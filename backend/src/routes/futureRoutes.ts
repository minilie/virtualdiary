import express, { Router, Request, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../utils/authenticate';
import Diary from '../models/diary';
import {FutureFeedbackData, FeedbackType, FeedbackStyle } from '../types/feedbackTypes';
import FutureFeedback from '../models/feedback';
import { ErrorResponse } from '../types/generalTypes';
import AIService from '../utils/AIService'; // 假设的AI服务

const router: Router = express.Router();

router.get(
  '/:diaryId/future-feedback',
  authenticate,
  async (req: AuthenticatedRequest, res: Response<FutureFeedbackData | ErrorResponse>) => {
    try {
      const diaryId = parseInt(req.params.diaryId);
      const userId = req.userId!;

      // 验证日记是否存在且属于当前用户
      const diary = await Diary.findById(diaryId);
      if (!diary || diary.userId !== userId) {
        res.status(404).json({ message: 'Diary not found or access denied' });
        return;
      }

      // 获取反馈
      const feedback = await FutureFeedback.findByDiaryId(diaryId);
      
      if (!feedback) {
        res.status(404).json({ message: 'Feedback not found for this diary' });
        return;
      }

      // 构建响应数据
      const feedbackData: FutureFeedbackData = {
        id: feedback.id!,
        diaryId: feedback.diaryId,
        userId: feedback.userId,
        type: feedback.type,
        style: feedback.style,
        content: feedback.content,
        rating: feedback.rating,
        conversations: feedback.conversations,
        createdAt: feedback.createdAt,
        updatedAt: feedback.updatedAt
      };
      
      res.json(feedbackData);
    } catch (err) {
      console.error('获取反馈错误:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ===== 生成"未来的你"反馈 =====
router.post(
  '/:diaryId/future-feedback',
  authenticate,
  async (req: AuthenticatedRequest, res: Response<FutureFeedbackData | ErrorResponse>) => {
    try {
      const diaryId = parseInt(req.params.diaryId);
      const userId = req.userId!;
      
      // 解析请求体并设置默认值
    const { 
      type = 'emotional', 
      style = 'encouraging' 
    } = (req.body || {}) as { 
      type?: FeedbackType; 
      style?: FeedbackStyle;
    };

      // 验证日记
      const diary = await Diary.findById(diaryId);
      if (!diary || diary.userId !== userId) {
        res.status(404).json({ message: 'Diary not found or access denied' });
        return;
      }
      
      // 检查现有反馈
      let feedback = await FutureFeedback.findByDiaryId(diaryId);
      
      // 调用AI服务生成反馈内容
      const aiContent = await AIService.generateFutureFeedback(diary, { type, style });

      if (feedback != null) {
        // 更新现有反馈
        feedback.type = type;
        feedback.style = style;
        feedback.content = aiContent;
        feedback.updatedAt = new Date(); // 确保更新时间戳
        await feedback.save();
      } else {
        // 创建新反馈（添加时间戳）
        feedback = new FutureFeedback({
          diaryId,
          userId,
          type,
          style,
          content: aiContent,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        await feedback.save();
      }

      // 构建响应数据（不含对话和评价）
      const feedbackData: FutureFeedbackData = {
        id: feedback.id!,
        diaryId: feedback.diaryId,
        userId: feedback.userId,
        type: feedback.type,
        style: feedback.style,
        content: feedback.content,
        createdAt: feedback.createdAt,
        updatedAt: feedback.updatedAt
      };
      
      res.json(feedbackData);
    } catch (err) {
      console.error('生成反馈错误:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router;