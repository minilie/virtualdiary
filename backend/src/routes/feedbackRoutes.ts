import express, { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../utils/authenticate';
import { ConversationMessage, RatingData } from '../types/feedbackTypes';
import FutureFeedback from '../models/feedback';
import { OkResponse, ErrorResponse } from '../types/generalTypes';
import AIService from '../utils/AIService'; // 假设的AI服务

const router: Router = express.Router();

router.post(
  '/:feedbackId/rating',
  authenticate,
  async (req: AuthenticatedRequest, res: Response<OkResponse | ErrorResponse>) => {
    try {
      const feedbackId = parseInt(req.params.feedbackId);
      const userId = req.userId!;
      
      // 解析评分数据
      const { score, feedback: feedbackText, tags = [] } = req.body as RatingData;

      // 验证评分值
      if (!score || score < 1 || score > 5) {
        res.status(400).json({ message: 'Invalid rating score' });
        return;
      }

      // 获取反馈
      const feedback = await FutureFeedback.findById(feedbackId);
      if (!feedback) {
        res.status(404).json({ message: 'Feedback not found' });
        return;
      }
      
      // 验证所有者
      if (feedback.userId !== userId) {
        res.status(403).json({ message: 'Access denied' });
        return;
      }

      // 更新评价
      await feedback.updateRating({
        score,
        feedback: feedbackText,
        tags
      });

      res.json({ msg: 'Rating submitted successfully' });
    } catch (err) {
      console.error('评价反馈错误:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ===== 与"未来的你"继续对话 =====
router.post(
  '/:feedbackId/conversation',
  authenticate,
  async (req: AuthenticatedRequest, res: Response<ConversationMessage | ErrorResponse>) => {
    try {
      const feedbackId = parseInt(req.params.feedbackId);
      const userId = req.userId!;
      
      // 验证消息
      const { message } = req.body as { message: string };
      if (!message || message.trim().length === 0) {
        res.status(400).json({ message: 'Message cannot be empty' });
        return;
      }

      // 获取反馈
      const feedback = await FutureFeedback.findById(feedbackId);
      if (!feedback) {
        res.status(404).json({ message: 'Feedback not found' });
        return;
      }
      
      // 验证所有者
      if (feedback.userId !== userId) {
        res.status(403).json({ message: 'Access denied' });
        return;
      }

      // 加载对话历史
      const conversations = feedback.conversations || [];
      
      // 调用AI服务生成回复
      const response = await AIService.generateConversationResponse(
        message.trim(), 
        feedback, 
        conversations
      );
      
      // 保存对话记录
      await feedback.addConversation(message, response);
      
      // 构建响应
      const conversationMessage: ConversationMessage = {
        message,
        response,
        createdAt: new Date()
      };
      
      res.json(conversationMessage);
    } catch (err) {
      console.error('继续对话错误:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router;