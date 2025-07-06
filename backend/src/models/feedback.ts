import db from './db'; // 假设你已经有一个数据库连接实例
import {FeedbackStyle, FeedbackType, ConversationMessage, 
    RatingData, RatingTag, FutureFeedbackData } from '../types/feedbackTypes';

interface ConversationRow {
  message: string;
  response: string;
  createdAt: string; // SQLite返回时间字符串
}

// ===== 创建数据库表 =====
function createFutureFeedbackTable() {
  // 创建 future_feedbacks 表
  db.run(`
    CREATE TABLE IF NOT EXISTS future_feedbacks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      diaryId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      type TEXT CHECK(type IN ('emotional', 'thinking', 'action', 'memory')) NOT NULL,
      style TEXT CHECK(style IN ('encouraging', 'analytical', 'humorous')) NOT NULL,
      content TEXT NOT NULL,
      rating_score INTEGER CHECK(rating_score BETWEEN 1 AND 5),
      rating_feedback TEXT,
      rating_tags TEXT, -- 存储为JSON数组
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(diaryId) REFERENCES diaries(id),
      FOREIGN KEY(userId) REFERENCES users(id)
    )
  `);

  // 创建 feedback_conversations 表
  db.run(`
    CREATE TABLE IF NOT EXISTS feedback_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feedbackId INTEGER NOT NULL,
      message TEXT NOT NULL,
      response TEXT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(feedbackId) REFERENCES future_feedbacks(id)
    )
  `);
}

// 初始化数据库表
createFutureFeedbackTable();

// ===== FutureFeedback 模型 =====
class FutureFeedback {
  id?: number;
  diaryId: number;
  userId: number;
  type: FeedbackType;
  style: FeedbackStyle;
  content: string;
  rating?: RatingData;
  conversations?: ConversationMessage[];
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: FutureFeedbackData) {
    this.id = data.id;
    this.diaryId = data.diaryId;
    this.userId = data.userId;
    this.type = data.type;
    this.style = data.style;
    this.content = data.content;
    this.rating = data.rating;
    this.conversations = data.conversations;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  /**​
   * 保存反馈到数据库
   * 如果已有id则更新，否则插入新记录
   */
  async save(): Promise<FutureFeedback> {
    if (this.id) {
      // 更新现有反馈
      return this.update();
    } else {
      // 插入新反馈
      return this.insert();
    }
  }

  /**​
   * 插入新反馈到数据库
   */
  private async insert(): Promise<FutureFeedback> {
    const that = this; // 保存类实例引用
    const ratingTags = this.rating?.tags ? JSON.stringify(this.rating.tags) : null;
    
    return new Promise((resolve, reject) => {
        db.run(
        `INSERT INTO future_feedbacks 
        (diaryId, userId, type, style, content, rating_score, rating_feedback, rating_tags) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            this.diaryId,
            this.userId,
            this.type,
            this.style,
            this.content,
            this.rating?.score || null,
            this.rating?.feedback || null,
            ratingTags
        ],
        function (this: { lastID: number }, err: any) {
            if (err) return reject(err);
            
            // 1. 设置新创建的 ID
            that.id = this.lastID;
            
            // 2. 保存关联的对话记录
            if (that.conversations && that.conversations.length > 0) {
            that.saveConversations()
                .then(() => resolve(that))
                .catch(reject);
            } else {
            resolve(that);
            }
        }
        );
    });
  }

  /**​
   * 更新数据库中的反馈
   */
  private async update(): Promise<FutureFeedback> {
    if (!this.id) throw new Error('Cannot update feedback without ID');
    
    // 序列化评价标签
    const ratingTags = this.rating?.tags ? JSON.stringify(this.rating.tags) : null;
    
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE future_feedbacks SET
          type = ?,
          style = ?,
          content = ?,
          rating_score = ?,
          rating_feedback = ?,
          rating_tags = ?,
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [
          this.type,
          this.style,
          this.content,
          this.rating?.score || null,
          this.rating?.feedback || null,
          ratingTags,
          this.id
        ],
        async (err) => {
          if (err) return reject(err);
          
          // 更新对话记录
          if (this.conversations && this.conversations.length > 0) {
            await this.saveConversations();
          }
          
          resolve(this);
        }
      );
    });
  }

  /**​
   * 保存反馈的对话记录
   */
  private async saveConversations(): Promise<void> {
    if (!this.id) throw new Error('Cannot save conversations without feedback ID');
    
    // 首先删除所有现有对话
    await new Promise<void>((resolve, reject) => {
      db.run(`DELETE FROM feedback_conversations WHERE feedbackId = ?`, [this.id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // 保存新的对话记录
    if (this.conversations && this.conversations.length > 0) {
      for (const conversation of this.conversations) {
        await new Promise<void>((resolve, reject) => {
          db.run(
            `INSERT INTO feedback_conversations (feedbackId, message, response)
            VALUES (?, ?, ?)`,
            [this.id, conversation.message, conversation.response],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }
    }
  }

  /**​
   * 从数据库记录中解析FutureFeedback对象
   * @param row 数据库查询结果行
   */
  static parseFromRow(row: any): FutureFeedback {
    // 解析rating_tags
    let ratingTags: RatingTag[] = [];
    try {
      if (row.rating_tags) {
        ratingTags = JSON.parse(row.rating_tags);
      }
    } catch (e) {
      console.error('Error parsing rating tags', e);
    }
    
    return new FutureFeedback({
      id: row.id,
      diaryId: row.diaryId,
      userId: row.userId,
      type: row.type as FeedbackType,
      style: row.style as FeedbackStyle,
      content: row.content,
      rating: row.rating_score ? {
        score: row.rating_score,
        feedback: row.rating_feedback,
        tags: ratingTags
      } : undefined,
      createdAt: row.createdAt ? new Date(row.createdAt) : undefined,
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : undefined
    });
  }

  /**​
   * 通过ID查找反馈
   * @param id 反馈ID
   */
  static async findById(id: number): Promise<FutureFeedback | null> {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM future_feedbacks WHERE id = ?',
        [id],
        async (err, row) => {
          if (err) return reject(err);
          if (!row) return resolve(null);
          
          const feedback = FutureFeedback.parseFromRow(row);
          
          // 加载对话记录
          feedback.conversations = await FutureFeedback.loadConversations(id);
          
          resolve(feedback);
        }
      );
    });
  }

  /**​
   * 加载反馈的对话记录
   * @param feedbackId 反馈ID
   */
  static async loadConversations(feedbackId: number): Promise<ConversationMessage[]> {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM feedback_conversations WHERE feedbackId = ? ORDER BY createdAt ASC',
        [feedbackId],
        (err, rows) => {
          if (err) return reject(err);
          
        const conversations = (rows as ConversationRow[]).map(row => ({
          message: row.message,
          response: row.response,
          createdAt: new Date(row.createdAt) // ✅ 安全转换
        }));
        
        resolve(conversations);
        }
      );
    });
  }

  /**​
   * 通过日记ID查找反馈
   * @param diaryId 日记ID
   */
  static async findByDiaryId(diaryId: number): Promise<FutureFeedback | null> {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM future_feedbacks WHERE diaryId = ?',
        [diaryId],
        async (err, row) => {
          if (err) return reject(err);
          if (!row) return resolve(null);
          
          const feedback = FutureFeedback.parseFromRow(row);
          
          // 加载对话记录
          feedback.conversations = await FutureFeedback.loadConversations(feedback.id!);
          
          resolve(feedback);
        }
      );
    });
  }

  /**​
   * 添加对话消息到反馈
   * @param message 用户消息
   * @param response AI回复
   */
  async addConversation(message: string, response: string): Promise<void> {
    // 确保有反馈ID
    if (!this.id) throw new Error('Cannot add conversation to feedback without ID');
    
    // 创建对话消息对象
    const conversation: ConversationMessage = {
      message,
      response,
      createdAt: new Date()
    };
    
    // 添加对话到内存
    if (!this.conversations) this.conversations = [];
    this.conversations.push(conversation);
    
    // 保存到数据库
    await new Promise<void>((resolve, reject) => {
      db.run(
        `INSERT INTO feedback_conversations (feedbackId, message, response)
        VALUES (?, ?, ?)`,
        [this.id, message, response],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  /**​
   * 更新用户评价
   * @param rating 评价数据
   */
  async updateRating(rating: RatingData): Promise<void> {
    // 更新内存中的评价
    this.rating = rating;
    
    // 序列化评价标签
    const ratingTags = rating.tags ? JSON.stringify(rating.tags) : null;
    
    // 更新数据库
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE future_feedbacks SET
          rating_score = ?,
          rating_feedback = ?,
          rating_tags = ?,
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [
          rating.score,
          rating.feedback || null,
          ratingTags,
          this.id
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }
}

export default FutureFeedback;