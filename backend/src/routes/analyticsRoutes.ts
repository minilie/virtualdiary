import express, { Router } from 'express';
import { authenticate, AuthenticatedRequest } from '../utils/authenticate';
import Diary from '../models/diary';
import Analytics ,{AnalyticsType}from '../models/analytics';
import { ErrorResponse } from '../types/generalTypes';

const router: Router = express.Router();

// 辅助函数：计算时间范围
const calculateDateRange = (range: string): [Date, Date] => {
  const now = new Date();
  const start = new Date(now);
  
  switch (range) {
    case 'week':
      start.setDate(now.getDate() - 7);
      break;
    case 'month':
      start.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      start.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      start.setFullYear(now.getFullYear() - 1);
      break;
    default:
      start.setMonth(now.getMonth() - 1);
  }
  
  return [start, now];
};

// 获取情绪趋势分析
router.get('/emotions', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { range = 'month' } = req.query;
    const userId = req.userId!;
    
    const [startDate, endDate] = calculateDateRange(range as string);
    const diaries = await Diary.findByUserId(userId, {
      dateRange: `${startDate.toISOString()},${endDate.toISOString()}`
    });
    
    // 调用外部分析函数（模拟）
    const analyzeEmotionTrends = async (diaries: any[]): Promise<string> => {
      return ``;
    };
    
    const result = await analyzeEmotionTrends(diaries);
    
    // 保存分析结果
    const analytics = new Analytics({
      userId,
      type: 'emotion_trends',
      range: range as string,
      result
    });
    await analytics.save();
    
    res.send(result);
  } catch (err) {
    console.error('情绪趋势分析错误:', err);
    res.status(500).json({ message: '分析失败' } as ErrorResponse);
  }
});

// 获取个人成长报告
router.get('/growth-report', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { period = 'monthly' } = req.query;
    const userId = req.userId!;
    
    let range = 'month';
    if (period === 'quarterly') range = 'quarter';
    if (period === 'yearly') range = 'year';
    
    const [startDate, endDate] = calculateDateRange(range);
    const diaries = await Diary.findByUserId(userId, {
      dateRange: `${startDate.toISOString()},${endDate.toISOString()}`
    });
    
    // 调用外部分析函数（模拟）
    const generateGrowthReport = async (diaries: any[]): Promise<string> => {
      return ``;
    };
    
    const result = await generateGrowthReport(diaries);
    
    // 保存分析结果
    const analytics = new Analytics({
      userId,
      type: 'growth_report',
      range: period as string,
      result
    });
    await analytics.save();
    
    res.send(result);
  } catch (err) {
    console.error('成长报告生成错误:', err);
    res.status(500).json({ message: '报告生成失败' } as ErrorResponse);
  }
});

// 获取写作统计
router.get('/writing-stats', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const diaries = await Diary.findByUserId(userId, { limit: 1000 });
    
    if (diaries.length === 0) {
      const emptyStats = {
        totalDiaries: 0,
        totalWords: 0,
        averageWords: 0,
        longestDiary: 0,
        shortestDiary: 0,
        favoriteTopics: [],
        emotionSummary: [],
        writingFrequency: {
          daily: 0,
          weekly: 0,
          monthly: 0
        }
      };
      
      const analytics = new Analytics({
        userId,
        type: 'writing_stats',
        result: JSON.stringify(emptyStats)
      });
      await analytics.save();
      
      return void res.json(emptyStats);
    }
    
    // 计算写作统计数据
    const totalWords = diaries.reduce((sum, diary) => sum + diary.metadata.wordCount, 0);
    const wordCounts = diaries.map(d => d.metadata.wordCount);
    
    // 计算主题和情绪分布
    const topicCount: Record<string, number> = {};
    const emotionCount: Record<string, number> = {};
    
    diaries.forEach(diary => {
      diary.topics.forEach((topic: string) => {
        topicCount[topic] = (topicCount[topic] || 0) + 1;
      });
      diary.emotions.forEach((emotion: string) => {
        emotionCount[emotion] = (emotionCount[emotion] || 0) + 1;
      });
    });
    
    // 计算写作频率
    const firstDiary = diaries[diaries.length - 1];
    const firstDate = firstDiary?.createdAt 
    ? new Date(firstDiary.createdAt) 
    : new Date(); 
    const lastDiary = diaries[0];
    const lastDate = lastDiary?.createdAt 
    ? new Date(lastDiary.createdAt) 
    : new Date(); // 或者根据业务逻辑设置默认值或抛错
    //const lastDate = new Date(diaries[0].createdAt);
    const daysDiff = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
    
    const stats = {
      totalDiaries: diaries.length,
      totalWords,
      averageWords: Math.round(totalWords / diaries.length),
      longestDiary: Math.max(...wordCounts),
      shortestDiary: Math.min(...wordCounts),
      favoriteTopics: Object.entries(topicCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([topic, count]) => ({ topic, count })),
      emotionSummary: Object.entries(emotionCount)
        .sort((a, b) => b[1] - a[1])
        .map(([emotion, count]) => ({ emotion, count })),
      writingFrequency: {
        daily: parseFloat((diaries.length / daysDiff).toFixed(2)),
        weekly: parseFloat((diaries.length / (daysDiff / 7)).toFixed(2)),
        monthly: parseFloat((diaries.length / (daysDiff / 30)).toFixed(2))
      }
    };
    
    // 保存分析结果
    const analytics = new Analytics({
      userId,
      type: 'writing_stats',
      result: JSON.stringify(stats)
    });
    await analytics.save();
    
    res.json(stats);
  } catch (err) {
    console.error('写作统计错误:', err);
    res.status(500).json({ message: '统计失败' } as ErrorResponse);
  }
});

// 获取所有分析结果（分页）
router.get('/results', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const { page = 1, limit = 10, type } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    const results = await Analytics.findByUserId(userId, {
      type: type as AnalyticsType | undefined,
      limit: Number(limit),
      offset
    });
    
    const total = (await Analytics.getStatsByUserId(userId)).total;
    
    res.json({
      data: results,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    console.error('获取分析结果错误:', err);
    res.status(500).json({ message: '获取失败' } as ErrorResponse);
  }
});

// 删除分析结果
router.delete('/results/:id', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const id = Number(req.params.id);
    
    const analytics = await Analytics.findById(id);
    if (!analytics || analytics.userId !== userId) {
      return void res.status(404).json({ message: '未找到分析结果' });
    }
    
    const success = await analytics.delete();
    res.json({ success });
  } catch (err) {
    console.error('删除分析结果错误:', err);
    res.status(500).json({ message: '删除失败' } as ErrorResponse);
  }
});

export default router;