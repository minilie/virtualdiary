import express, { Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../utils/authenticate';
import { ErrorResponse } from '../types/generalTypes';
import { decisionAPI } from '../models/decision';
import { DecisionOption, HistoryResponse, CreateDecisionResponse, AnalysisResponse } from '../types/decisionTypes';

const router = express.Router();

/**
 * 创建决策请求
 * @route POST /decision
 * @param {string} title - 决策标题
 * @param {string} description - 决策描述
 * @param {Array} options - 可选方案
 * @param {Object} context - 决策背景
 * @returns {Object} 创建结果
 */
router.post(
  '/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response<CreateDecisionResponse | ErrorResponse>): Promise<void> => { // 1. 添加返回类型Promise<void>
    try {
      const userId = req.userId!;
      const { title, description, options, context } = req.body;

      // 验证必要参数
      if (!title || !description || !options || !context) {
        res.status(400).json({ message: '缺少必要参数' }); // 2. 移除return保留res
        return; // 3. 添加空return结束执行
      }

      // 验证选项格式
      if (!Array.isArray(options) || options.length < 2) {
        res.status(400).json({ message: '必须提供至少两个选项' }); // 同上
        return;
      }

      // 创建决策
      const { id } = await decisionAPI.createDecisionRequest(userId, {
        title,
        description,
        options,
        context
      });

      res.status(201).json({
        msg: '决策创建成功',
        decisionId: id
      });
    } catch (err) {
      console.error('创建决策错误:', err);
      res.status(500).json({ 
        message: '服务器错误，创建决策失败' 
      });
    }
  }
);

/**
 * 获取决策分析
 * @route GET /decision/:decisionId/analysis
 * @param {string} decisionId - 决策ID
 * @returns {Object} 决策分析结果
 */
router.post(
  '/:decisionId/analysis',
  authenticate,
  async (req: AuthenticatedRequest, res: Response<AnalysisResponse | ErrorResponse>) => {
    try {
      const userId = req.userId!;
      const { decisionId } = req.params;

      // 验证决策归属
      const decision = await decisionAPI.getDecision(decisionId);
      if (!decision || decision.userId !== userId) {
        res.status(404).json({ message: '决策不存在或无权访问' });
        return;
      }

      // 调用AI分析接口
      const aiAnalysis = "我不够了解你，我不能为你做主，还请你自己分析决策哦！如果有别的问题，尽管问我！";

      res.json({
        msg: '决策分析生成成功',
        analysis: aiAnalysis
      });
    } catch (err) {
      console.error('生成决策分析错误:', err);
      res.status(500).json({ 
        message: '服务器错误，生成决策分析失败' 
      });
    }
  }
);

/**
 * 更新决策结果
 * @route PUT /decision/:decisionId/result
 * @param {string} decisionId - 决策ID
 * @param {string} chosenOption - 选择的方案
 * @param {string} reasoning - 选择理由
 * @returns {Object} 更新结果
 */
router.put(
  '/:decisionId/result',
  authenticate,
  async (req: AuthenticatedRequest, res: Response<CreateDecisionResponse | ErrorResponse>) => {
    try {
      const userId = req.userId!;
      const { decisionId } = req.params;
      const { chosenOption: chosenOptionId, reasoning } = req.body;

      // 验证参数
      if (!chosenOptionId || !reasoning) {
        res.status(400).json({ message: '缺少必要参数' });
        return;
      }

      // 验证决策归属
      const decision = await decisionAPI.getDecision(decisionId);
      if (!decision || decision.userId !== userId) {
        res.status(404).json({ message: '决策不存在或无权访问' });
        return;
      }

      // 验证选项有效性
      const isValidOption = decision.options.some((opt: DecisionOption) => opt.id === chosenOptionId);
      if (!isValidOption) {
        res.status(400).json({ message: '无效的选项ID' });
        return;
      }

      // 更新决策结果
      await decisionAPI.updateDecisionResult(decisionId, {
        chosenOptionId,
        reasoning
      });

      res.json({
        msg: '决策结果更新成功',
        decisionId
      });
    } catch (err) {
      console.error('更新决策结果错误:', err);
      res.status(500).json({ 
        message: '服务器错误，更新决策结果失败' 
      });
    }
  }
);

/**
 * 获取决策历史
 * @route GET /decision/history
 * @param {number} limit - 返回结果数量限制
 * @param {number} offset - 结果偏移量
 * @param {string} category - 决策分类过滤
 * @returns {Object} 决策历史列表
 */
router.get(
  '/history',
  authenticate,
  async (req: AuthenticatedRequest, res: Response<HistoryResponse | ErrorResponse>) => {
    try {
      const userId = req.userId!;
      const { limit, offset, category } = req.query;
      
      // 解析查询参数
      const params = {
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        category: category as string | undefined
      };

      // 获取决策历史
      const history = await decisionAPI.getDecisionHistory(userId, params);

      res.json({
        msg: '获取决策历史成功',
        history,
        count: history.length
      });
    } catch (err) {
      console.error('获取决策历史错误:', err);
      res.status(500).json({ 
        message: '服务器错误，获取决策历史失败' 
      });
    }
  }
);

export default router;