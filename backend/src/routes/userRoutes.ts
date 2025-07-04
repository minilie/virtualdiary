import express, { Request, Response, Router } from 'express';
import { body, validationResult } from 'express-validator';
import { PersonalitySetupRequest, UserProfile, OkResponse, UserProfileResponse} from '../types/userTypes';
import { ErrorResponse } from '../types/generalTypes';
import User from '../models/user';

const router: Router = express.Router();

/**
 * 更新用户的 personality_settings 字段
 * @param {number} userId 用户id
 * @param {object} data 要更新的字段对象（通常包含 personality_settings）
 * @returns {Promise<void>}
 */
router.post(
  '/personality-setup',
  [
    body('personality').isObject(),
    body('goals').isArray(),
    body('communicationStyle').isString()
  ],
  async (req: Request<{}, {}, PersonalitySetupRequest>, res: Response<OkResponse | ErrorResponse>) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) {
      void res.status(400).json({ error: 'Validation failed', details: errs.array() });
      return;
    }
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        void res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      await User.updatePersonality(userId, req.body);
      void res.json({ msg: 'Personality setup completed' });
      return;
    } catch (err) {
      console.error(err);
      void res.status(500).json({ error: 'Server error' });
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
  [
    body('nickname').optional().isString(),
    body('avatar').optional().isURL()
  ],
  async (req: Request<{}, {}, UserProfile>, res: Response<OkResponse | ErrorResponse>) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) {
      void res.status(400).json({ error: 'Validation failed', details: errs.array() });
      return;
    }
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        void res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      await User.updateProfile(userId, req.body);
      void res.json({ msg: 'Profile updated' });
      return;
    } catch (err) {
      console.error(err);
      void res.status(500).json({ error: 'Server error' });
      return;
    }
  }
);
router.get(
  '/profile',
  async (req: Request, res: Response<UserProfileResponse | ErrorResponse>) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        void res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const user = await User.getUserProfile(userId);
      if (!user) {
        void res.status(404).json({ error: 'User not found' });
        return;
      }

      void res.json({ user });
    } catch (err) {
      console.error(err);
      void res.status(500).json({ error: 'Server error' });
    }
  }
);


export default router;
