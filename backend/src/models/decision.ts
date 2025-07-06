import db from './db'; // 假设已经有一个数据库连接实例
import { v4 as uuidv4 } from 'uuid';
import { DecisionContext, DecisionOption, DecisionAnalysis } from '@/types/decisionTypes';

// ===== 创建数据库表 =====
function createDecisionTables() {
  // 创建 decisions 表
  db.run(`
    CREATE TABLE IF NOT EXISTS decisions (
      id TEXT PRIMARY KEY,
      userId INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      context TEXT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id)
    )
  `);

  // 创建 decision_options 表
  db.run(`
    CREATE TABLE IF NOT EXISTS decision_options (
      id TEXT PRIMARY KEY,
      decisionId TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      pros TEXT NOT NULL,
      cons TEXT NOT NULL,
      FOREIGN KEY(decisionId) REFERENCES decisions(id) ON DELETE CASCADE
    )
  `);

  // 创建 decision_analysis 表
  db.run(`
    CREATE TABLE IF NOT EXISTS decision_analysis (
      id TEXT PRIMARY KEY,
      decisionId TEXT NOT NULL UNIQUE,
      recommendations TEXT NOT NULL,
      optionAnalysis TEXT NOT NULL,
      summary TEXT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(decisionId) REFERENCES decisions(id) ON DELETE CASCADE
    )
  `);

  // 创建 decision_results 表
  db.run(`
    CREATE TABLE IF NOT EXISTS decision_results (
      decisionId TEXT PRIMARY KEY,
      chosenOptionId TEXT NOT NULL,
      reasoning TEXT NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(decisionId) REFERENCES decisions(id) ON DELETE CASCADE,
      FOREIGN KEY(chosenOptionId) REFERENCES decision_options(id)
    )
  `);
}

// 初始化数据库表
createDecisionTables();

// ===== Decision 模型 =====
class DecisionModel {
  id?: string;
  userId: number;
  title: string;
  description: string;
  context: DecisionContext;
  options: DecisionOption[];
  createdAt?: Date;

  constructor(data: {
    userId: number;
    title: string;
    description: string;
    context: DecisionContext;
    options: Omit<DecisionOption, 'id'>[];
    id?: string;
    createdAt?: Date;
  }) {
    this.id = data.id;
    this.userId = data.userId;
    this.title = data.title;
    this.description = data.description;
    this.context = data.context;
    this.options = data.options.map(option => ({
      id: uuidv4(),
      ...option
    }));
    this.createdAt = data.createdAt;
  }

  /**
   * 保存决策到数据库
   * 包括决策基本信息和所有选项
   */
  async save(): Promise<DecisionModel> {
    const that = this;

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        // 开始事务
        db.run('BEGIN TRANSACTION');

        // 1. 插入决策基本信息
        db.run(
          `INSERT INTO decisions (id, userId, title, description, context) VALUES (?, ?, ?, ?, ?)`,
          [
            this.id || uuidv4(),
            this.userId,
            this.title,
            this.description,
            JSON.stringify(this.context)
          ],
          function (
            this: { lastID: string; id?: string; options: DecisionOption[] },
            err: any
          ) {
            if (err) {
              db.run('ROLLBACK');
              return reject(err);
            }

            that.id = this.lastID;
            
            // 2. 插入所有选项
            const insertOption = (index: number) => {
              if (index >= this.options.length) {
                db.run('COMMIT', (err) => {
                  if (err) return reject(err);
                  resolve(that);
                });
                return;
              }
              
              const option = this.options[index];
              db.run(
                `INSERT INTO decision_options 
                (id, decisionId, title, description, pros, cons) 
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                  option.id,
                  this.id,
                  option.title,
                  option.description,
                  JSON.stringify(option.pros),
                  JSON.stringify(option.cons)
                ],
                (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    return reject(err);
                  }
                  insertOption(index + 1);
                }
              );
            };
            
            insertOption(0);
          }
        );
      });
    });
  }

  /**
   * 通过ID获取决策（包含选项）
   */
  static async getById(decisionId: string): Promise<DecisionModel | null> {
    return new Promise((resolve, reject) => {
      // 1. 获取决策基本信息
      db.get(
        `SELECT * FROM decisions WHERE id = ?`,
        [decisionId],
        async (err, decisionRow: any) => {
          if (err) return reject(err);
          if (!decisionRow) return resolve(null);
          
          // 2. 获取决策选项
          db.all(
            `SELECT * FROM decision_options WHERE decisionId = ?`,
            [decisionId],
            (err, optionRows: any[]) => {
              if (err) return reject(err);
              
              const decision = new DecisionModel({
                id: decisionRow.id,
                userId: decisionRow.userId,
                title: decisionRow.title,
                description: decisionRow.description,
                context: JSON.parse(decisionRow.context),
                options: optionRows.map(row => ({
                  id: row.id,
                  title: row.title,
                  description: row.description,
                  pros: JSON.parse(row.pros),
                  cons: JSON.parse(row.cons)
                })),
                createdAt: new Date(decisionRow.createdAt)
              });
              
              resolve(decision);
            }
          );
        }
      );
    });
  }
}

// ===== DecisionAnalysis 模型 =====
class DecisionAnalysisModel {
  id?: string;
  decisionId: string;
  recommendations: string[];
  optionAnalysis: DecisionAnalysis['optionAnalysis'];
  summary: string;
  createdAt?: Date;

  constructor(data: {
    decisionId: string;
    recommendations: string[];
    optionAnalysis: DecisionAnalysis['optionAnalysis'];
    summary: string;
    id?: string;
    createdAt?: Date;
  }) {
    this.id = data.id;
    this.decisionId = data.decisionId;
    this.recommendations = data.recommendations;
    this.optionAnalysis = data.optionAnalysis;
    this.summary = data.summary;
    this.createdAt = data.createdAt;
  }

  /**
   * 保存分析结果到数据库
   */
  async save(): Promise<DecisionAnalysisModel> {
    const that = this; // 保存类实例引用
    
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO decision_analysis 
        (id, decisionId, recommendations, optionAnalysis, summary) 
        VALUES (?, ?, ?, ?, ?)`,
        [
          this.id || uuidv4(),
          this.decisionId,
          JSON.stringify(this.recommendations),
          JSON.stringify(this.optionAnalysis),
          this.summary
        ],
        function (this: { lastID: string }, err) {
          if (err) return reject(err);
          
          // 设置新创建的 ID
          that.id = this.lastID || (this as any).id;
          resolve(that);
        }
      );
    });
  }

  /**
   * 通过决策ID获取分析结果
   */
  static async getByDecisionId(decisionId: string): Promise<DecisionAnalysisModel | null> {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM decision_analysis WHERE decisionId = ?`,
        [decisionId],
        (err, row: any) => {
          if (err) return reject(err);
          if (!row) return resolve(null);
          
          resolve(new DecisionAnalysisModel({
            id: row.id,
            decisionId: row.decisionId,
            recommendations: JSON.parse(row.recommendations),
            optionAnalysis: JSON.parse(row.optionAnalysis),
            summary: row.summary,
            createdAt: new Date(row.createdAt)
          }));
        }
      );
    });
  }
}

// ===== DecisionResult 模型 =====
class DecisionResultModel {
  decisionId: string;
  chosenOptionId: string;
  reasoning: string;
  updatedAt?: Date;

  constructor(data: {
    decisionId: string;
    chosenOptionId: string;
    reasoning: string;
    updatedAt?: Date;
  }) {
    this.decisionId = data.decisionId;
    this.chosenOptionId = data.chosenOptionId;
    this.reasoning = data.reasoning;
    this.updatedAt = data.updatedAt;
  }

  /**
   * 保存或更新决策结果
   */
  async save(): Promise<DecisionResultModel> {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT OR REPLACE INTO decision_results 
        (decisionId, chosenOptionId, reasoning) 
        VALUES (?, ?, ?)`,
        [this.decisionId, this.chosenOptionId, this.reasoning],
        (err) => {
          if (err) return reject(err);
          resolve(this);
        }
      );
    });
  }

  /**
   * 通过决策ID获取结果
   */
  static async getByDecisionId(decisionId: string): Promise<DecisionResultModel | null> {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM decision_results WHERE decisionId = ?`,
        [decisionId],
        (err, row: any) => {
          if (err) return reject(err);
          if (!row) return resolve(null);
          
          resolve(new DecisionResultModel({
            decisionId: row.decisionId,
            chosenOptionId: row.chosenOptionId,
            reasoning: row.reasoning,
            updatedAt: new Date(row.updatedAt)
          }));
        }
      );
    });
  }
}

// ===== 导出API函数 =====
export const decisionAPI = {
  /**
   * 创建决策请求
   * @param userId - 用户ID
   * @param decisionData - 决策数据
   */
  async createDecisionRequest(
    userId: number,
    decisionData: {
      title: string;
      description: string;
      options: Array<{
        title: string;
        description: string;
        pros: string[];
        cons: string[];
      }>;
      context: DecisionContext;
    }
  ): Promise<{ id: string }> {
    const decision = new DecisionModel({
      userId,
      title: decisionData.title,
      description: decisionData.description,
      context: decisionData.context,
      options: decisionData.options
    });
    
    await decision.save();
    return { id: decision.id! };
  },

  /**
   * 获取决策分析
   * @param decisionId - 决策ID
   */
  async getDecisionAnalysis(decisionId: string): Promise<DecisionAnalysis | null> {
    const analysis = await DecisionAnalysisModel.getByDecisionId(decisionId);
      if (!analysis || !analysis.id) {
        return null;
      }
  
    // 类型转换确保兼容性
    return analysis as DecisionAnalysis;
  },

  /**
   * 保存决策分析结果（通常在AI处理完成后调用）
   * @param analysisData - 分析数据
   */
  async saveDecisionAnalysis(analysisData: {
    decisionId: string;
    recommendations: string[];
    optionAnalysis: DecisionAnalysis['optionAnalysis'];
    summary: string;
  }): Promise<{ id: string }> {
    const analysis = new DecisionAnalysisModel(analysisData);
    await analysis.save();
    return { id: analysis.id! };
  },

  /**
   * 更新决策结果
   * @param decisionId - 决策ID
   * @param result - 结果数据
   */
  async updateDecisionResult(
    decisionId: string,
    result: {
      chosenOptionId: string;
      reasoning: string;
    }
  ): Promise<void> {
    const decisionResult = new DecisionResultModel({
      decisionId,
      chosenOptionId: result.chosenOptionId,
      reasoning: result.reasoning
    });
    
    await decisionResult.save();
  },

  /**
   * 获取决策历史
   * @param userId - 用户ID
   * @param params - 查询参数
   */
  async getDecisionHistory(
    userId: number,
    params: {
      limit?: number;
      offset?: number;
      category?: string;
    } = {}
  ): Promise<Array<{
    id: string;
    title: string;
    createdAt: Date;
    result?: {
      chosenOptionId: string;
    };
  }>> {
    let query = `
      SELECT 
        d.id, 
        d.title, 
        d.createdAt,
        r.chosenOptionId
      FROM decisions d
      LEFT JOIN decision_results r ON d.id = r.decisionId
      WHERE d.userId = ?
    `;
    
    const queryParams: any[] = [userId];
    
    if (params.category) {
      query += ' AND JSON_EXTRACT(context, \'$.category\') = ?';
      queryParams.push(params.category);
    }
    
    query += ' ORDER BY d.createdAt DESC';
    
    if (params.limit !== undefined) {
      query += ' LIMIT ?';
      queryParams.push(params.limit);
    }
    
    if (params.offset !== undefined) {
      query += ' OFFSET ?';
      queryParams.push(params.offset);
    }
    
    return new Promise((resolve, reject) => {
      db.all(query, queryParams, (err, rows: any[]) => {
        if (err) return reject(err);
        
        resolve(rows.map(row => ({
          id: row.id,
          title: row.title,
          createdAt: new Date(row.createdAt),
          result: row.chosenOptionId ? {
            chosenOptionId: row.chosenOptionId
          } : undefined
        })));
      });
    });
  },

  /**
   * 获取完整决策记录（包含基本信息和选项）
   * @param decisionId - 决策ID
   */
  async getDecision(decisionId: string): Promise<DecisionModel | null> {
    return DecisionModel.getById(decisionId);
  },

  /**
   * 获取决策结果
   * @param decisionId - 决策ID
   */
  async getDecisionResult(decisionId: string): Promise<DecisionResultModel | null> {
    return DecisionResultModel.getByDecisionId(decisionId);
  }
};