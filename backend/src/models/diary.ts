import db from './db';
import { FriendComment } from '../types/diaryTypes';
// 创建 diaries 表
db.run(`CREATE TABLE IF NOT EXISTS diaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  emotions TEXT NOT NULL,        -- 存储为JSON字符串
  topics TEXT NOT NULL,          -- 存储为JSON字符串
  visibility TEXT CHECK(visibility IN ('private', 'friends', 'public')) NOT NULL DEFAULT 'private',
  metadata TEXT NOT NULL,        -- 存储为JSON字符串
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(userId) REFERENCES users(id)
)`);

interface DiaryData {
  userId: number;
  title: string;
  content: string;
  emotions: string[];
  topics: string[];
  visibility: 'private' | 'friends' | 'public';
  metadata?: {
    wordCount?: number;
    readingTime?: number;
    sentimentScore?: number;
  };
}

interface DiaryRecord {
  id: number;
  userId: number;
  title: string;
  content: string;
  emotions: string;
  topics: string;
  visibility: string;
  metadata: string;
  createdAt: string;
  updatedAt: string;
}

interface UpdateResult {
  success: boolean;
  changes?: number;
}

class Diary {
  id?: number;
  userId: number;
  title: string;
  content: string;
  emotions: string[];
  topics: string[];
  visibility: 'private' | 'friends' | 'public';
  metadata: {
    wordCount: number;
    readingTime: number;
    sentimentScore: number;
  };
  createdAt?: string;
  updatedAt?: string;

  constructor(data: DiaryData) {
    this.userId = data.userId;
    this.title = data.title;
    this.content = data.content;
    this.emotions = data.emotions;
    this.topics = data.topics;
    this.visibility = data.visibility;
    this.metadata = {
      wordCount: data.metadata?.wordCount || this.calculateWordCount(),
      readingTime: data.metadata?.readingTime || this.calculateReadingTime(),
      sentimentScore: data.metadata?.sentimentScore || 0
    };
  }

  private calculateWordCount(): number {
    return this.content.split(/\s+/).length;
  }

  private calculateReadingTime(): number {
    return Math.ceil(this.calculateWordCount() / 200);
  }

  // 保存日记到数据库
  async save(): Promise<number> {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO diaries (userId, title, content, emotions, topics, visibility, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      const emotionsJson = JSON.stringify(this.emotions);
      const topicsJson = JSON.stringify(this.topics);
      const metadataJson = JSON.stringify(this.metadata);

      db.run(query, 
        [this.userId, this.title, this.content, emotionsJson, topicsJson, this.visibility, metadataJson],
        function(err) {
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    });
  }
  static async findAllByUserId(
    userId: number,
    filters: {
      emotion?: string;
      topic?: string;
      dateRange?: string;
    } = {}
  ): Promise<Diary[]> {
    let query = `SELECT * FROM diaries WHERE userId = ?`;
    const queryParams: (string | number)[] = [userId];

    // 构建过滤条件
    if (filters.emotion) {
      query += ` AND emotions LIKE ?`;
      queryParams.push(`%"${filters.emotion}"%`);
    }
    if (filters.topic) {
      query += ` AND topics LIKE ?`;
      queryParams.push(`%"${filters.topic}"%`);
    }
    if (filters.dateRange) {
      const [start, end] = filters.dateRange.split(',');
      query += ` AND createdAt BETWEEN ? AND ?`;
      queryParams.push(start, end);
    }

    query += ` ORDER BY createdAt DESC`;

    return new Promise((resolve, reject) => {
      db.all(query, queryParams, (err, rows: DiaryRecord[]) => {
        if (err) return reject(err);
        const diaries = rows.map(row => this.parseDiaryRecord(row));
        resolve(diaries);
      });
    });
  }
  // 根据用户ID获取日记列表（支持分页和过滤）
  static async findByUserId(
    userId: number, 
    params: {
      emotion?: string;
      topic?: string;
      dateRange?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<Diary[]> {
    const { emotion, topic, dateRange, page = 1, limit = 10 } = params;

    let query = `SELECT * FROM diaries WHERE userId = ?`;
    const queryParams: (string | number)[] = [userId];

    // 构建过滤条件
    if (emotion) {
      query += ` AND emotions LIKE ?`;
      queryParams.push(`%"${emotion}"%`);
    }
    if (topic) {
      query += ` AND topics LIKE ?`;
      queryParams.push(`%"${topic}"%`);
    }
    if (dateRange) {
      const [start, end] = dateRange.split(',');
      query += ` AND createdAt BETWEEN ? AND ?`;
      queryParams.push(start, end);
    }
    if (!params.limit || params.limit === 0) {
      return this.findAllByUserId(userId, {
        emotion: params.emotion,
        topic: params.topic,
        dateRange: params.dateRange
      });
    }
    // 分页
    query += ` ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
    const offset = (page - 1) * limit;
    queryParams.push(limit, offset);

    return new Promise((resolve, reject) => {
      db.all(query, queryParams, (err, rows: DiaryRecord[]) => {
        if (err) return reject(err);
        
        const diaries = rows.map(row => this.parseDiaryRecord(row));
        resolve(diaries);
      });
    });
  }

  // 根据日记ID获取日记
  static async findById(id: number): Promise<Diary | null> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM diaries WHERE id = ?', [id], (err, row: DiaryRecord) => {
        if (err) return reject(err);
        if (!row) return resolve(null);
        
        resolve(this.parseDiaryRecord(row));
      });
    });
  }
  // Diary 类中新增方法
  static async deleteByUserId(userId: number): Promise<UpdateResult> {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM diaries WHERE userId = ?', [userId], function(err) {
        if (err) return reject(err);
        resolve({ success: true, changes: this.changes });
      });
    });
  }

  // 解析数据库记录为Diary对象
private static parseDiaryRecord(row: DiaryRecord): Diary {
  const diary = new Diary({
    userId: row.userId,
    title: row.title,
    content: row.content,
    emotions: JSON.parse(row.emotions),
    topics: JSON.parse(row.topics),
    visibility: row.visibility as 'private' | 'friends' | 'public',
    metadata: JSON.parse(row.metadata)
  });
  diary.id = row.id;
  diary.createdAt = row.createdAt;
  diary.updatedAt = row.updatedAt;
  return diary;
}


  // 更新日记
  static async update(id: number, data: Partial<DiaryData>): Promise<UpdateResult> {
    const fields: string[] = [];
    const params: (string | number)[] = [];
    const allowedFields: Array<keyof DiaryData> = ['title', 'content', 'emotions', 'topics', 'visibility', 'metadata'];

    allowedFields.forEach(field => {
      const value = data[field];
      if (value !== undefined) {
        fields.push(`${field} = ?`);
        if (field === 'emotions' || field === 'topics' || field === 'metadata') {
          params.push(JSON.stringify(value));
        } else {
          params.push(value as string | number);
        }
      }
    });

    if (fields.length === 0) {
      return { success: false };
    }

    fields.push('updatedAt = CURRENT_TIMESTAMP');
    params.push(id);

    const query = `UPDATE diaries SET ${fields.join(', ')} WHERE id = ?`;
    
    return new Promise((resolve, reject) => {
      db.run(query, params, function(err) {
        if (err) return reject(err);
        resolve({ success: true, changes: this.changes });
      });
    });
  }

  // 删除日记
  static async delete(id: number): Promise<UpdateResult> {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM diaries WHERE id = ?', [id], function(err) {
        if (err) return reject(err);
        resolve({ success: true, changes: this.changes });
      });
    });
  }

  // 转换为API响应格式
  toResponse(): {
    id: string;
    userId: string;
    title: string;
    content: string;
    emotions: string[];
    topics: string[];
    visibility: 'private' | 'friends' | 'public';
    metadata: {
      wordCount: number;
      readingTime: number;
      sentimentScore: number;
    };
    createdAt: string;
    updatedAt: string;
  } {
    return {
      id: this.id?.toString() || '',
      userId: this.userId.toString(),
      title: this.title,
      content: this.content,
      emotions: this.emotions,
      topics: this.topics,
      visibility: this.visibility,
      metadata: this.metadata,
      createdAt: this.createdAt || new Date().toISOString(),
      updatedAt: this.updatedAt || new Date().toISOString()
    };
  }
  /**
 * 分享日记给好友
 */
static async shareWithFriends(
  diaryId: number,
  sharerId: number,
  friendIds: number[],
  settings: {
    allowComment?: boolean;
    visibility?: 'private' | 'friends' | 'public';
  } = {}
): Promise<{ success: boolean; sharedCount: number }> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      let sharedCount = 0;
      const errors: Error[] = [];
      
      friendIds.forEach(friendId => {
        db.run(
          `INSERT INTO diary_shares 
          (diary_id, sharer_id, friend_id, allow_comment, visibility)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(diary_id, friend_id) DO NOTHING`,
          [
            diaryId,
            sharerId,
            friendId,
            settings.allowComment ? 1 : 0,
            settings.visibility || 'friends'
          ],
          function(err) {
            if (err) {
              errors.push(err);
            } else if (this.changes > 0) {
              sharedCount++;
            }
          }
        );
      });
      
      db.run('COMMIT', (err) => {
        if (err || errors.length > 0) {
          db.run('ROLLBACK');
          reject(err || errors[0]);
        } else {
          resolve({ success: true, sharedCount });
        }
      });
    });
  });
}

  /**
   * 获取好友的未来评论
   */
  static async getFriendsFutureFeedback(
    diaryId: number,
    userId: number
  ): Promise<FriendComment[]> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT c.id, c.friend_id as friendId, u.nickname, u.avatar, c.comment, c.created_at as createdAt
        FROM diary_comments c
        JOIN users u ON c.friend_id = u.id
        WHERE c.diary_id = ? AND c.is_future_comment = 1
        AND c.friend_id IN (
          SELECT friend_id FROM friends WHERE user_id = ?
          UNION
          SELECT user_id FROM friends WHERE friend_id = ?
        )
        ORDER BY c.created_at DESC
      `;
      
      db.all(query, [diaryId, userId, userId], (err, rows) => {
        if (err) return reject(err);
        resolve((rows as FriendComment[]) || []);
      });
    });
  }

  /**
   * 检查用户是否有权限查看日记
   */
  static async checkViewPermission(
    diaryId: number,
    userId: number
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // 1. 检查是否是日记所有者
      db.get(
        'SELECT 1 FROM diaries WHERE id = ? AND userId = ?',
        [diaryId, userId],
        (err, row) => {
          if (err) return reject(err);
          if (row) return resolve(true);
          
          // 2. 检查是否是被分享的好友
          db.get(
            `SELECT 1 FROM diary_shares 
            WHERE diary_id = ? AND friend_id = ?`,
            [diaryId, userId],
            (err, row) => {
              if (err) return reject(err);
              resolve(!!row);
            }
          );
        }
      );
    });
  }
}

export default Diary;