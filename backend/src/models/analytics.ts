import db from './db';

// 创建分析结果表
function createAnalyticsTable() {
db.run(`CREATE TABLE IF NOT EXISTS analytics_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('emotion_trends', 'growth_report', 'writing_stats')),
  range TEXT,
  result TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(userId) REFERENCES users(id)
)`);

// 创建索引以提高查询性能
db.run('CREATE INDEX IF NOT EXISTS idx_analytics_user_type ON analytics_results(userId, type)');
db.run('CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_results(createdAt)');
}
interface AnalyticsRecord {
  id: number;
  userId: number;
  type: string;
  range: string | null;
  result: string;
  createdAt: string;
}

export type AnalyticsType = 'emotion_trends' | 'growth_report' | 'writing_stats';
createAnalyticsTable();
class Analytics {
  id?: number;
  userId: number;
  type: AnalyticsType;
  range: string | null;
  result: string;
  createdAt?: string;

  constructor(data: {
    userId: number;
    type: AnalyticsType;
    range?: string;
    result: string;
  }) {
    this.userId = data.userId;
    this.type = data.type;
    this.range = data.range || null;
    this.result = data.result;
  }

  /**
   * 保存分析结果到数据库
   */
  async save(): Promise<number> {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO analytics_results (userId, type, range, result)
        VALUES (?, ?, ?, ?)
      `;
      
      db.run(
        query, 
        [this.userId, this.type, this.range, this.result],
        function(err) {
          if (err) return reject(err);
          //this.id = this.lastID;
          resolve(this.lastID);
        }
      );
    });
  }

  /**
   * 根据ID获取分析结果
   */
  static async findById(id: number): Promise<Analytics | null> {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM analytics_results WHERE id = ?',
        [id],
        (err, row: AnalyticsRecord) => {
          if (err) return reject(err);
          if (!row) return resolve(null);

          const analytics = new Analytics({
            userId: row.userId,
            type: row.type as AnalyticsType,
            range: row.range || undefined,
            result: row.result
          });
          analytics.id = row.id;
          analytics.createdAt = row.createdAt;
          resolve(analytics);
        }
      );
    });
  }

  /**
   * 根据用户ID获取分析结果
   * @param type 可选，筛选特定类型的分析结果
   */
  static async findByUserId(
    userId: number,
    options: {
      type?: AnalyticsType;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Analytics[]> {
    const { type, limit, offset } = options;
    
    let query = 'SELECT * FROM analytics_results WHERE userId = ?';
    const params: (number | string)[] = [userId];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY createdAt DESC';

    if (limit !== undefined) {
      query += ' LIMIT ?';
      params.push(limit);
      
      if (offset !== undefined) {
        query += ' OFFSET ?';
        params.push(offset);
      }
    }

    return new Promise((resolve, reject) => {
      db.all(
        query,
        params,
        (err, rows: AnalyticsRecord[]) => {
          if (err) return reject(err);
          
          const results = rows.map(row => {
            const analytics = new Analytics({
              userId: row.userId,
              type: row.type as AnalyticsType,
              range: row.range || undefined,
              result: row.result
            });
            analytics.id = row.id;
            analytics.createdAt = row.createdAt;
            return analytics;
          });
          
          resolve(results);
        }
      );
    });
  }

  /**
   * 删除分析结果
   */
  async delete(): Promise<boolean> {
    if (!this.id) {
      throw new Error('Cannot delete unsaved analytics result');
    }

    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM analytics_results WHERE id = ?',
        [this.id],
        function(err) {
          if (err) return reject(err);
          resolve(this.changes > 0);
        }
      );
    });
  }

  /**
   * 删除用户的所有分析结果
   */
  static async deleteAllByUserId(userId: number): Promise<number> {
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM analytics_results WHERE userId = ?',
        [userId],
        function(err) {
          if (err) return reject(err);
          resolve(this.changes);
        }
      );
    });
  }

  /**
   * 获取用户的分析结果统计
   */
  static async getStatsByUserId(userId: number): Promise<{
    total: number;
    byType: Record<AnalyticsType, number>;
  }> {
    return new Promise((resolve, reject) => {
      // 获取总数
      db.get(
        'SELECT COUNT(*) as total FROM analytics_results WHERE userId = ?',
        [userId],
        (err, totalRow: { total: number }) => {
          if (err) return reject(err);

          // 获取按类型统计
          db.all(
            `SELECT type, COUNT(*) as count 
             FROM analytics_results 
             WHERE userId = ? 
             GROUP BY type`,
            [userId],
            (err, typeRows: Array<{ type: AnalyticsType; count: number }>) => {
              if (err) return reject(err);

              const byType = {
                emotion_trends: 0,
                growth_report: 0,
                writing_stats: 0
              };

              typeRows.forEach(row => {
                byType[row.type] = row.count;
              });

              resolve({
                total: totalRow.total,
                byType
              });
            }
          );
        }
      );
    });
  }
  /**
 * 转换为API响应格式
 */
    toResponse() {
    return {
        id: this.id,
        userId: this.userId,
        type: this.type,
        range: this.range,
        result: JSON.parse(this.result), // 解析JSON字符串
        createdAt: this.createdAt
    };
    }
}

export default Analytics;