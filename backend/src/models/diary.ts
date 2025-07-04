import db from './db';

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


// 日记分享表
db.run(`CREATE TABLE IF NOT EXISTS diary_shares (
  diary_id INTEGER NOT NULL,
  friend_id INTEGER NOT NULL,
  settings TEXT DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (diary_id, friend_id),
  FOREIGN KEY (diary_id) REFERENCES diaries(id),
  FOREIGN KEY (friend_id) REFERENCES users(id)
)`);

// 日记评论表
db.run(`CREATE TABLE IF NOT EXISTS diary_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  diary_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (diary_id) REFERENCES diaries(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
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
  lastID?: number;
}

interface ShareResult {
  success: boolean;
  sharedCount: number;
  message?: string;
}

interface Comment {
  friendId: number;
  friendName: string;
  comment: string;
  createdAt: string;
}

interface CommentResult {
  success: boolean;
  commentId?: number;
  message?: string;
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

/**
   * 分享日记给好友
   * @param diaryId 日记ID
   * @param userId 分享用户ID
   * @param friendId 好友ID
   * @param options 分享设置
   */
  static async share(
    diaryId: number,
    userId: number,
    friendId: number,
    options: { canComment?: boolean } = {}
  ): Promise<boolean> {
    try {
      await this.runUpdate(
        `INSERT OR IGNORE INTO diary_shares 
         (diary_id, friend_id, settings) 
         VALUES (?, ?, ?)`,
        [diaryId, friendId, JSON.stringify(options)]
      );
      return true;
    } catch (error) {
      console.error('分享失败:', error);
      return false;
    }
  }

  /**
   * 添加评论
   * @param diaryId 日记ID
   * @param userId 评论用户ID
   * @param content 评论内容
   */
  static async addComment(
    diaryId: number,
    userId: number,
    content: string
  ): Promise<number | null> {
    if (!content.trim()) return null;
    
    try {
      const { lastID } = await this.runUpdate(
        'INSERT INTO diary_comments (diary_id, user_id, content) VALUES (?, ?, ?)',
        [diaryId, userId, content.trim()]
      );
      return lastID || null;
    } catch (error) {
      console.error('评论失败:', error);
      return null;
    }
  }

  /**
   * 获取日记评论
   * @param diaryId 日记ID
   */
  static async getComments(diaryId: number): Promise<{
    userId: number;
    content: string;
    createdAt: string;
  }[]> {
    try {
      return await this.queryAll(
        `SELECT user_id as userId, content, created_at as createdAt
         FROM diary_comments WHERE diary_id = ?
         ORDER BY created_at DESC`,
        [diaryId]
      );
    } catch (error) {
      console.error('获取评论失败:', error);
      return [];
    }
  }

  /**
   * 检查查看权限
   * @param diaryId 日记ID
   * @param userId 用户ID
   */
  static async canView(diaryId: number, userId: number): Promise<boolean> {
    try {
      const [isOwner, isShared] = await Promise.all([
        this.runQuery<{ exists: number }>(
          'SELECT 1 as exists FROM diaries WHERE id = ? AND userId = ?',
          [diaryId, userId]
        ),
        this.runQuery<{ exists: number }>(
          'SELECT 1 as exists FROM diary_shares WHERE diary_id = ? AND friend_id = ?',
          [diaryId, userId]
        )
      ]);
      return !!(isOwner?.exists || isShared?.exists);
    } catch (error) {
      console.error('权限检查失败:', error);
      return false;
    }
  }

  /**
   * 执行SQL查询的辅助方法
   * @param sql SQL语句
   * @param params 参数
   * @returns 查询结果
   */
  private static runQuery<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) return reject(err);
        resolve(row as T);
      });
    });
  }

  /**
   * 执行SQL更新的辅助方法
   * @param sql SQL语句
   * @param params 参数
   * @returns 变更信息
   */
  private static runUpdate(sql: string, params: any[] = []): Promise<UpdateResult> {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) return reject(err);
        resolve({
          success: true, 
          changes: this.changes,
          lastID: this.lastID  // 添加lastID
        });
      });
    });
  }
  static async getFriendComments(
    diaryId: number,
    currentUserId: number
  ): Promise<Comment[]> {
    try {
      // 验证查看权限
      const canView = await this.canView(diaryId, currentUserId);
      if (!canView) {
        throw new Error('无权查看此日记的评论');
      }

      const sql = `
        SELECT 
          c.friend_id as friendId,
          u.nickname as friendName,
          c.comment,
          c.created_at as createdAt
        FROM diary_comments c
        JOIN users u ON c.friend_id = u.id
        WHERE c.diary_id = ? AND EXISTS (
          SELECT 1 FROM diary_shares 
          WHERE diary_id = ? AND friend_id = c.friend_id AND sharer_id = ?
        )
        ORDER BY c.created_at DESC`;

      const rows = await this.queryAll<{
        friendId: number;
        friendName: string;
        comment: string;
        createdAt: string;
      }>(sql, [diaryId, diaryId, currentUserId]);

      return rows.map(row => ({
        friendId: row.friendId,
        friendName: row.friendName,
        comment: row.comment,
        createdAt: row.createdAt
      }));
    } catch (error) {
      console.error('获取好友评论失败:', error);
      throw error;
    }
  }

  /**
   * 添加好友评论
   * @param diaryId 日记ID
   * @param friendId 好友用户ID
   * @param comment 评论内容
   * @returns 操作结果
   */
  static async addFriendComment(
    diaryId: number,
    friendId: number,
    comment: string
  ): Promise<CommentResult> {
    try {
      // 验证评论权限
      const canComment = await this.runQuery<{ exists: number }>(
        `SELECT 1 as exists FROM diary_shares 
         WHERE diary_id = ? AND friend_id = ?`,
        [diaryId, friendId]
      ).then(res => res?.exists === 1);

      if (!canComment) {
        return {
          success: false,
          message: '无权评论此日记'
        };
      }

      // 验证评论内容
      if (!comment || comment.trim().length === 0) {
        return {
          success: false,
          message: '评论内容不能为空'
        };
      }

      const { lastID } = await this.runUpdate(
        'INSERT INTO diary_comments (diary_id, friend_id, comment) VALUES (?, ?, ?)',
        [diaryId, friendId, comment.trim()]
      );

      return {
        success: true,
        commentId: lastID,
        message: '评论添加成功'
      };
    } catch (error) {
      console.error('添加评论失败:', error);
      return {
        success: false,
        message: '添加评论时发生错误'
      };
    }
  }

  /**
   * 查询多条记录的辅助方法
   * @param sql SQL语句
   * @param params 参数
   * @returns 查询结果数组
   */
  private static queryAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows as T[]);
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
}

export default Diary;