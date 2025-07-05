import express, { Router, Request, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../utils/authenticate';
import User from '../models/user';
import {
  UserSettings,
  NotificationSettings,
  UpdateUserSettingsRequest,
  UpdateNotificationSettingsRequest,
  UserSettingsResponse,
  NotificationSettingsResponse
} from '../types/settingsTypes';
import { OkResponse, ErrorResponse } from '../types/generalTypes';

const router: Router = express.Router();

// 获取用户设置
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response<UserSettingsResponse | ErrorResponse>) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return void res.status(401).json({ message: 'Unauthorized' });
    }

    const settings = await User.getUserSettings(userId);
    res.json({ settings });
  } catch (err) {
    console.error('Error fetching user settings:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 更新用户设置
router.put(
  '/',
  authenticate,
  async (req: Request<{}, {}, UpdateUserSettingsRequest>, res: Response<OkResponse | ErrorResponse>) => {
    try {
      const userId = (req as AuthenticatedRequest).userId;
      if (!userId) {
        return void res.status(401).json({ message: 'Unauthorized' });
      }

      const { settings } = req.body;
      await User.updateUserSettings(userId, settings);
      res.json({ msg: 'User settings updated successfully' });
    } catch (err) {
      console.error('Error updating user settings:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// 获取通知设置
router.get('/notifications', authenticate, async (req: AuthenticatedRequest, res: Response<NotificationSettingsResponse | ErrorResponse>) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return void res.status(401).json({ message: 'Unauthorized' });
    }

    const notificationSettings = await User.getNotificationSettings(userId);
    res.json({ notificationSettings });
  } catch (err) {
    console.error('Error fetching notification settings:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 更新通知设置
router.put(
  '/notifications',
  authenticate,
  async (req: Request<{}, {}, UpdateNotificationSettingsRequest>, res: Response<OkResponse | ErrorResponse>) => {
    try {
      const userId = (req as AuthenticatedRequest).userId;
      if (!userId) {
        return void res.status(401).json({ message: 'Unauthorized' });
      }

      const { notificationSettings } = req.body;
      await User.updateNotificationSettings(userId, notificationSettings);
      res.json({ msg: 'Notification settings updated successfully' });
    } catch (err) {
      console.error('Error updating notification settings:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router;