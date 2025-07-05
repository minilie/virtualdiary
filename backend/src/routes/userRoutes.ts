import express, { Request, Response, Router } from 'express';
import { body, validationResult } from 'express-validator';
import { PersonalitySetupRequest, UserProfile, UserProfileResponse,  DeleteAccountRequest,  DeleteAccountResponse} from '../types/userTypes';
import { OkResponse, ErrorResponse } from '../types/generalTypes';
import User from '../models/user';
import { authenticate, AuthenticatedRequest} from '../utils/authenticate';
const router: Router = express.Router();

/**
 * 更新用户的 personality_settings 字段
 * @param {number} userId 用户id
 * @param {object} data 要更新的字段对象（通常包含 personality_settings）
 * @returns {Promise<void>}
 */
router.post(
  '/personality-setup',
  authenticate,
  [ 
    body('personality').isObject(),
    body('goals').isArray(),
    body('communicationStyle').isString()
  ],
  //async (req: Request<{}, {}, PersonalitySetupRequest>, res: Response<OkResponse | ErrorResponse>) => {
  async (req: AuthenticatedRequest, res: Response<OkResponse | ErrorResponse>) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) {
      void res.status(400).json({ message: 'Validation failed', details: errs.array() });
      return;
    }
    try {
      const userId = req.userId!;
      if (!userId) {
        void res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      await User.updatePersonality(userId, req.body);
      void res.json({ msg: 'Personality setup completed' });
      return;
    } catch (err) {
      console.error(err);
      void res.status(500).json({ message: 'Server error' });
      return;
    }
  }
);

/**
 * 更新用户的 avatar 和 nickname 字段
 * @param {number} userId 用户id
 * @param {object} data 要更新的字段对象，可能包含 avatar 和/或 nickname
 * @returns {Promise<void>}
 */
router.put(
  '/profile',
  authenticate,
  [
    body('nickname').optional().isString(),
    body('avatar').optional().isURL()
  ],
  async (req: AuthenticatedRequest, res: Response<OkResponse | ErrorResponse>) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) {
      void res.status(400).json({ message: 'Validation failed', details: errs.array() });
      return;
    }
    try {
      const userId = req.userId;
      if (!userId) {
        void res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      await User.updateProfile(userId, req.body);
      void res.json({ msg: 'Profile updated' });
      return;
    } catch (err) {
      console.error(err);
      void res.status(500).json({ message: 'Server error' });
      return;
    }
  }
);
router.get(
  '/profile',
  authenticate,
  async (req: AuthenticatedRequest, res: Response<UserProfileResponse | ErrorResponse>) => {
    try {
      const userId = req.userId!;
      if (!userId) {
        void res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const user = await User.getUserProfile(userId);
      if (!user) {
        void res.status(404).json({ message: 'User not found' });
        return;
      }

      void res.json({ user });
    } catch (err) {
      console.error(err);
      void res.status(500).json({ message: 'Server error' });
    }
  }
);

router.post(
  '/delete-account',
  authenticate,
  [
    body('confirmation')
      .isString()
      .withMessage('Confirmation must be a string')
      .equals('DELETE MY ACCOUNT') // 要求用户必须输入这个确认文本
      .withMessage('Confirmation text does not match')
  ],
  async (req: AuthenticatedRequest, res: Response<DeleteAccountResponse | ErrorResponse>) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return void res.status(400).json({ 
        message: 'Validation failed', 
        details: errors.array() 
      });
    }

    try {
      const userId = req.userId;
      if (!userId) {
        return void res.status(401).json({ message: 'Unauthorized' });
      }

      // 先获取用户信息用于日志或其他操作
      const user = await User.findById(userId);
      if (!user) {
        return void res.status(404).json({ message: 'User not found' });
      }

      // 执行删除操作
      const result = await User.deleteById(userId);
      if ((result as any).changes === 0) {
        return void res.status(500).json({ message: 'Failed to delete account' });
      }

      // 这里可以添加其他清理操作，如删除用户的日记、好友关系等

      return void res.json({ 
        success: true, 
        message: 'Account deleted successfully' 
      });
    } catch (err) {
      console.error('Error deleting account:', err);
      return void res.status(500).json({ message: 'Server error' });
    }
  }
);
export default router;
