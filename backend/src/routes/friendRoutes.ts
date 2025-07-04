import express, { Request, Response, Router, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user';
import Friend from '../models/friend';
import {
  SearchUsersRequest,
  SendFriendRequest,
  RespondFriendRequest,
  GetFriendsListResponse,
  FriendRequestResponse
} from '../types/friendTypes';
import { promises } from 'dns';
import db from '../models/db';
const router: Router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secure_fallback_secret';

// 修正后的身份验证中间件
const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.cookies.token;
  
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    (req as any).user = { id: decoded.id };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// 使用修正后的中间件
router.use((req, res, next) => requireAuth(req, res, next));
/**
 * 搜索用户
 * GET /friends/search?q=keyword
 */
router.get('/search', 
  async (req: Request<{}, {}, {}, SearchUsersRequest>, res: Response, next: NextFunction): Promise<void> =>  {
    try {
      const keyword = req.query.q;
      if (!keyword || keyword.length < 2) {
          res.status(400).json({ 
          error: 'Keyword must be at least 2 characters long' 
        });
        return; 
      }

      const currentUserId = (req as any).user.id;
      const searchTerm = `%${keyword}%`;
      
      const db = require('../models/db');
      const query = `
        SELECT id, nickname, avatar 
        FROM users 
        WHERE (nickname LIKE ? OR email LIKE ?)
          AND id != ?
        LIMIT 20
      `;
      
      db.all(query, [searchTerm, searchTerm, currentUserId], (err: any, rows: any) => {
        if (err) {
          console.error('Search error:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * 发送好友请求
 * POST /friends/request
 */
router.post('/request', 
  async (req: Request<{}, {}, SendFriendRequest>, res: Response, next: NextFunction) : Promise<void> => {
    try {
      const { userId, message } = req.body;
      const currentUserId = (req as any).user.id;
      //console.log('发送请求的用户ID（currentUserId）:', currentUserId);
      //console.log('目标用户ID（userId）:', userId);
      // 确保目标用户存在
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      // 检查是否已经是好友
      const isFriend = await Friend.checkFriendship(currentUserId, userId);
      if (isFriend) {
        res.status(400).json({ error: 'Already friends' });
        return;
      }
      
      // 检查是否已有待处理请求
      const hasPendingRequest = await Friend.checkPendingRequest(currentUserId, userId);
      if (hasPendingRequest) {
        res.status(400).json({ error: 'Friend request already sent' });
        return;
      }
      
      // 发送请求
      const result = await Friend.sendRequest(currentUserId, userId, message);
      res.status(201).json({ 
        success: true, 
        requestId: result.id 
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * 响应好友请求
 * POST /friends/request/:requestId/respond
 */
router.post('/request/:requestId/respond', 
  async (req: Request<{ requestId: string }, {}, RespondFriendRequest>, res: Response, next: NextFunction) :Promise<void> => {
    try {
      const requestId = parseInt(req.params.requestId);
      const { accept } = req.body;
      const currentUserId = (req as any).user.id;
      
      if (isNaN(requestId)) {
        res.status(400).json({ error: 'Invalid request ID' });
        return;
      }
      
      // 获取请求详情
      const request = await Friend.getRequestById(requestId);
      if (!request) {
        res.status(404).json({ error: 'Friend request not found' });
        return;
      }
      
      if (request.to_user_id !== currentUserId) {
        res.status(403).json({ error: 'Unauthorized' });
        return;
      }
      
      await Friend.respondRequest(requestId, currentUserId, accept);
      
      // 返回完整的响应信息
      res.json({ 
        success: true,
        requestId,
        action: accept ? 'accepted' : 'rejected'
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * 获取好友列表
 * GET /friends
 */
router.get('/', 
  async (req: Request, res: Response<GetFriendsListResponse[]>, next: NextFunction) => {
    try {
      const currentUserId = (req as any).user.id;
      const friends = await Friend.getFriends(currentUserId);
      
      // 确保返回空数组而不是undefined
      res.json(friends || []);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * 获取待处理的好友请求
 * GET /friends/requests/pending
 */
router.get('/requests/pending', 
  async (req: Request, res: Response<FriendRequestResponse[]>, next: NextFunction) => {
    try {
      const currentUserId = (req as any).user.id;
      const requests = await Friend.getPendingRequests(currentUserId);
      
      // 确保返回空数组而不是undefined
      res.json(requests || []);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * 分享日记给好友
 * POST /diary/:diaryId/share
 */
/*router.post('/diary/:diaryId/share', async (req: Request, res: Response, next: NextFunction) : Promise<void> => {
  try {
    const { diaryId } = req.params;
    const { friendIds, settings } = req.body;
    const currentUserId = (req as any).user.id;

    // 验证日记归属
    const diary = await db.get(`SELECT * FROM diaries WHERE id = ? AND userId = ?`, [diaryId, currentUserId]);
    if (!diary) {
      res.status(404).json({ error: 'Diary not found or unauthorized' });
      return;
    }

    // 批量插入分享记录
    const stmt = await db.prepare(`INSERT OR IGNORE INTO diary_shares (diary_id, friend_id, settings) VALUES (?, ?, ?)`);

    for (const friendId of friendIds) {
      await stmt.run(diaryId, friendId, JSON.stringify(settings || {}));
    }
    await stmt.finalize();

    res.json({
      success: true,
      diaryId,
      sharedWith: friendIds
    });
  } catch (err) {
    next(err);
  }
});*/

/**
 * 获取好友的评论
 * GET /diary/:diaryId/friends-feedback
 */
/*
router.get('/diary/:diaryId/friends-feedback', async (req: Request, res: Response, next: NextFunction) :Promise<void> => {
  try {
    const { diaryId } = req.params;
    const currentUserId = (req as any).user.id;

    // 检查用户是否有权限查看该日记
    const shared = await db.get(
      `SELECT * FROM diary_shares WHERE diary_id = ? AND friend_id = ?`,
      [diaryId, currentUserId]
    );
    if (!shared) {
      res.status(403).json({ error: 'No access to diary comments' });
      return;
    }

    const comments = await db.all(
      `SELECT dc.user_id AS friendId, u.nickname AS friendName, dc.comment, dc.created_at
       FROM diary_comments dc
       JOIN users u ON u.id = dc.user_id
       WHERE dc.diary_id = ?
       ORDER BY dc.created_at DESC`,
      [diaryId]
    );

    res.json(comments);
  } catch (err) {
    next(err);
  }
});
*/
export default router;