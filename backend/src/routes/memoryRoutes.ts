import express, { Router } from 'express';
import { authenticate, AuthenticatedRequest } from '../utils/authenticate';
import Diary from '../models/diary';
import { 
  SearchParams, 
  DiarySearchResult,
  RelatedMemory,
  TimelineParams,
  TimelineItem,
  MemoryRecommendation
} from '../types/memoryTypes';
import { ErrorResponse } from '../types/generalTypes';
import db from '../models/db';

const router: Router = express.Router();

// 搜索历史日记
router.post('/search', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const searchParams: SearchParams = req.body;
    
    // 提供默认值或安全访问
    const emotions = searchParams.emotions || [];
    const topics = searchParams.topics || [];
    
    // 解析日期范围
    let dateStart, dateEnd;
    if (searchParams.dateRange) {
      [dateStart, dateEnd] = searchParams.dateRange.split(',');
    }

    // 构建查询
    let query = `
      SELECT id, title, content, emotions, topics, createdAt 
      FROM diaries 
      WHERE userId = ? 
    `;
    const params: any[] = [userId];

    // 添加关键词过滤
    if (searchParams.keyword) {
      query += ` AND (title LIKE ? OR content LIKE ?) `;
      params.push(`%${searchParams.keyword}%`, `%${searchParams.keyword}%`);
    }

    // 添加情绪过滤 - 现在使用安全的emotions变量
    if (emotions.length > 0) {
      query += ` AND ( `;
      emotions.forEach((emotion, index) => {
        query += ` emotions LIKE ? `;
        params.push(`%"${emotion}"%`);
        if (index < emotions.length - 1) query += ` OR `;
      });
      query += ` ) `;
    }

    // 添加主题过滤 - 现在使用安全的topics变量
    if (topics.length > 0) {
      query += ` AND ( `;
      topics.forEach((topic, index) => {
        query += ` topics LIKE ? `;
        params.push(`%"${topic}"%`);
        if (index < topics.length - 1) query += ` OR `;
      });
      query += ` ) `;
    }

    // 添加日期范围过滤
    if (dateStart && dateEnd) {
      query += ` AND createdAt BETWEEN ? AND ? `;
      params.push(dateStart, dateEnd);
    }

    query += ` ORDER BY createdAt DESC LIMIT 100`;

    // 执行查询
    const diaries = await new Promise<DiarySearchResult[]>((resolve, reject) => {
      db.all(query, params, (err, rows: any[]) => {
        if (err) return reject(err);
        
        const results = rows.map(row => ({
          id: row.id,
          title: row.title,
          excerpt: row.content.length > 100 
            ? row.content.substring(0, 100) + '...' 
            : row.content,
          emotions: JSON.parse(row.emotions),
          topics: JSON.parse(row.topics),
          createdAt: row.createdAt
        }));
        
        resolve(results);
      });
    });

    res.json(diaries);
  } catch (err) {
    console.error('Error searching diaries:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 获取相关记忆
router.get('/related/:diaryId', authenticate, async (req: AuthenticatedRequest, res: express.Response<RelatedMemory[] | ErrorResponse>) => {
  try {
    const userId = req.userId!;
    const diaryId = parseInt(req.params.diaryId);
    
    // 1. 获取当前日记信息
    const currentDiary = await new Promise<any>((resolve, reject) => {
      db.get('SELECT * FROM diaries WHERE id = ? AND userId = ?', [diaryId, userId], (err, row) => {
        if (err) return reject(err);
        if (!row) return reject(new Error('Diary not found'));
        resolve(row);
      });
    });
    
    if (!currentDiary) {
      return void res.status(404).json({ message: 'Diary not found' });
    }
    
    // 解析当前日记的情绪和主题
    const currentEmotions: string[] = JSON.parse(currentDiary.emotions);
    const currentTopics: string[] = JSON.parse(currentDiary.topics);
    
    // 2. 查询相关日记（基于相同情绪和主题）
    const relatedDiaries = await new Promise<any[]>((resolve, reject) => {
      let query = `
        SELECT id, title, emotions, topics, createdAt 
        FROM diaries 
        WHERE userId = ? AND id != ? 
      `;
      const params: any[] = [userId, diaryId];
      
      // 添加情绪匹配条件
      if (currentEmotions.length > 0) {
        query += ` AND ( `;
        currentEmotions.forEach((emotion, index) => {
          query += ` emotions LIKE ? `;
          params.push(`%"${emotion}"%`);
          if (index < currentEmotions.length - 1) query += ` OR `;
        });
        query += ` ) `;
      }
      
      query += ` ORDER BY createdAt DESC LIMIT 10`;
      
      db.all(query, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
    
    // 3. 转换为相关记忆格式
    const relatedMemories: RelatedMemory[] = relatedDiaries.map(diary => {
      const diaryEmotions: string[] = JSON.parse(diary.emotions);
      const diaryTopics: string[] = JSON.parse(diary.topics);
      
      // 计算相似度分数
      const emotionMatches = currentEmotions.filter(e => diaryEmotions.includes(e)).length;
      const topicMatches = currentTopics.filter(t => diaryTopics.includes(t)).length;
      const similarityScore = Math.min(1, (emotionMatches + topicMatches) / 5);
      
      return {
        id: diary.id,
        title: diary.title,
        relationType: emotionMatches > topicMatches ? 'emotion' : 'topic',
        similarityScore,
        createdAt: diary.createdAt
      };
    });
    
    // 按相似度排序
    relatedMemories.sort((a, b) => b.similarityScore - a.similarityScore);
    
    res.json(relatedMemories);
  } catch (err: any) {
    console.error('Error getting related memories:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// 获取时间线视图
router.get('/timeline', authenticate, async (req: AuthenticatedRequest, res: express.Response<TimelineItem[] | ErrorResponse>) => {
  try {
    const userId = req.userId!;
    const params: TimelineParams = req.query as any;
    
    // 构建基础查询
    let query = `
      SELECT id, title, emotions, topics, createdAt 
      FROM diaries 
      WHERE userId = ? 
    `;
    const queryParams: any[] = [userId];
    
    // 根据类型添加过滤条件
    if (params.type === 'emotion' && params.filter) {
      query += ` AND emotions LIKE ? `;
      queryParams.push(`%"${params.filter}"%`);
    } else if (params.type === 'topic' && params.filter) {
      query += ` AND topics LIKE ? `;
      queryParams.push(`%"${params.filter}"%`);
    }
    
    query += ` ORDER BY createdAt DESC LIMIT 100`;
    
    // 执行查询
    const timelineItems = await new Promise<TimelineItem[]>((resolve, reject) => {
      db.all(query, queryParams, (err, rows: any[]) => {
        if (err) return reject(err);
        
        const items = rows.map(row => ({
          id: row.id,
          title: row.title,
          date: row.createdAt,
          emotion: JSON.parse(row.emotions)[0] || 'neutral', // 取第一个情绪
          topics: JSON.parse(row.topics).slice(0, 3) // 最多取三个主题
        }));
        
        resolve(items);
      });
    });
    
    res.json(timelineItems);
  } catch (err) {
    console.error('Error getting timeline view:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 获取记忆回顾推荐
router.get('/recommendations', authenticate, async (req: AuthenticatedRequest, res: express.Response<MemoryRecommendation[] | ErrorResponse>) => {
  try {
    const userId = req.userId!;
    
    // 获取三种类型的推荐：
    // 1. 去年同期的日记
    // 2. 情绪强烈的日记
    // 3. 随机精选日记
    
    const recommendations: MemoryRecommendation[] = [];
    
    // 1. 去年同期的日记
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0];
    
    const samePeriodDiaries = await new Promise<any[]>((resolve, reject) => {
      db.all(`
        SELECT id, title, emotions, createdAt 
        FROM diaries 
        WHERE userId = ? 
          AND strftime('%m-%d', createdAt) = strftime('%m-%d', date('now'))
          AND strftime('%Y', createdAt) = ?
        ORDER BY createdAt DESC
        LIMIT 2
      `, [userId, oneYearAgo.getFullYear().toString()], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
    
    samePeriodDiaries.forEach(diary => {
      recommendations.push({
        id: diary.id,
        title: diary.title,
        reason: '去年今日的记忆',
        createdAt: diary.createdAt,
        emotion: JSON.parse(diary.emotions)[0] || 'neutral'
      });
    });
    
    // 2. 情绪强烈的日记（积极或消极）
    const emotionalDiaries = await new Promise<any[]>((resolve, reject) => {
      db.all(`
        SELECT id, title, emotions, createdAt 
        FROM diaries 
        WHERE userId = ? 
          AND (emotions LIKE '%"joy"%' OR emotions LIKE '%"sad"%' OR emotions LIKE '%"angry"%')
        ORDER BY RANDOM()
        LIMIT 2
      `, [userId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
    
    emotionalDiaries.forEach(diary => {
      const emotions = JSON.parse(diary.emotions);
      const primaryEmotion = emotions[0] || 'emotional';
      const reasonMap: Record<string, string> = {
        joy: '充满欢乐的回忆',
        sad: '值得反思的经历',
        angry: '情感强烈的时刻'
      };
      
      recommendations.push({
        id: diary.id,
        title: diary.title,
        reason: reasonMap[primaryEmotion] || '情感丰富的记忆',
        createdAt: diary.createdAt,
        emotion: primaryEmotion
      });
    });
    
    // 3. 随机精选日记（凑足5个推荐）
    const neededCount = 5 - recommendations.length;
    if (neededCount > 0) {
      const randomDiaries = await new Promise<any[]>((resolve, reject) => {
        db.all(`
          SELECT id, title, emotions, createdAt 
          FROM diaries 
          WHERE userId = ? 
          ORDER BY RANDOM()
          LIMIT ?
        `, [userId, neededCount], (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        });
      });
      
      randomDiaries.forEach(diary => {
        recommendations.push({
          id: diary.id,
          title: diary.title,
          reason: '精选回忆',
          createdAt: diary.createdAt,
          emotion: JSON.parse(diary.emotions)[0] || 'neutral'
        });
      });
    }
    
    // 随机排序推荐
    recommendations.sort(() => Math.random() - 0.5);
    
    res.json(recommendations);
  } catch (err) {
    console.error('Error getting memory recommendations:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;