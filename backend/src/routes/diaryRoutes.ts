import express, { Router, NextFunction, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Diary from '../models/diary';
import db from '../models/db';
import { authenticate, AuthenticatedRequest} from '../utils/authenticate';

const router: Router = express.Router();

// 创建日记
router.post(
  '/',
  authenticate,
  [
    body('title').notEmpty().trim().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
    body('emotions').isArray().withMessage('Emotions must be an array'),
    body('topics').isArray().withMessage('Topics must be an array'),
    body('visibility').isIn(['private', 'friends', 'public']).withMessage('Invalid visibility setting')
  ],
  async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }

    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { title, content, emotions, topics, visibility } = req.body;

      const diary = new Diary({
        userId: parseInt(userId),
        title,
        content,
        emotions,
        topics,
        visibility
      });

      const id = await diary.save();
      const newDiary = await Diary.findById(id);

      if (!newDiary) {
        res.status(500).json({ error: 'Failed to retrieve created diary' });
        return;
      }

      res.status(201).json(newDiary.toResponse());
    } catch (err) {
      console.error('Error creating diary:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// 获取日记列表
router.get(
  '/',
  authenticate,
  async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { emotion, topic, dateRange, page = '1', limit = '10' } = req.query;

      const diaries = await Diary.findByUserId(parseInt(userId), {
        emotion: emotion as string,
        topic: topic as string,
        dateRange: dateRange as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });

      // 获取总数
      const totalRes = await new Promise<number>((resolve, reject) => {
        db.get(
          'SELECT COUNT(*) as total FROM diaries WHERE userId = ?',
          [userId],
          (err, row: { total: number }) => {
            if (err) {
              reject(err);
            } else {
              resolve(row?.total || 0);
            }
          }
        );
      });

      res.json({
        diaries: diaries.map(diary => diary.toResponse()),
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 10,
        total: totalRes
      });
    } catch (err) {
      console.error('Error fetching diaries:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// 获取日记详情
router.get(
  '/:diaryId',
  authenticate,
  async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const diaryId = req.params.diaryId;
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const diary = await Diary.findById(parseInt(diaryId));
      if (!diary) {
        res.status(404).json({ error: 'Diary not found' });
        return;
      }

      if (diary.userId !== parseInt(userId)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      res.json(diary.toResponse());
    } catch (err) {
      console.error('Error fetching diary:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// 更新日记
router.put(
  '/:diaryId',
  authenticate,
  [
    body('title').optional().trim(),
    body('content').optional(),
    body('emotions').optional().isArray(),
    body('topics').optional().isArray(),
    body('visibility').optional().isIn(['private', 'friends', 'public'])
  ],
  async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'Validation failed', details: errors.array() });
      return;
    }

    try {
      const diaryId = req.params.diaryId;
      //console.log('找寻的id', diaryId);
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const existingDiary = await Diary.findById(parseInt(diaryId));
      if (!existingDiary) {
        res.status(404).json({ error: 'Diary not found' });
        return;
      }

      if (existingDiary.userId !== parseInt(userId)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const updateData = req.body;
      if (updateData.content) {
        updateData.metadata = {
          wordCount: updateData.content.split(/\s+/).length,
          readingTime: Math.ceil(updateData.content.split(/\s+/).length / 200)
        };
      }

      const result = await Diary.update(parseInt(diaryId), updateData);
      if (result.changes === 0) {
        res.status(404).json({ error: 'Diary not found or no changes' });
        return;
      }

      const updatedDiary = await Diary.findById(parseInt(diaryId));
      if (!updatedDiary) {
        res.status(404).json({ error: 'Updated diary not found' });
        return;
      }

      res.json(updatedDiary.toResponse());
    } catch (err) {
      console.error('Error updating diary:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// 删除日记
router.delete(
  '/:diaryId',
  authenticate,
  async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const diaryId = req.params.diaryId;
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const existingDiary = await Diary.findById(parseInt(diaryId));
      if (!existingDiary) {
        res.status(404).json({ error: 'Diary not found' });
        return;
      }

      if (existingDiary.userId !== parseInt(userId)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const result = await Diary.delete(parseInt(diaryId));
      if (result.changes === 0) {
        res.status(404).json({ error: 'Diary not found' });
        return;
      }

      res.json({ msg: 'Diary deleted successfully' });
    } catch (err) {
      console.error('Error deleting diary:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

export default router;