import express, { Router } from 'express'; // 1. 使用 ES Module 导入
import authRoutes from './authRoutes'; // 2. 省略 `.ts` 扩展名
import userRoutes from './userRoutes';
import diaryRoutes from './diaryRoutes';
import friendRoutes from './friendRoutes';
import futureRoutes from './futureRoutes';
import feedbackRoutes from './feedbackRoutes';
const router: Router = express.Router();

// 用户登录路由
router.use('/auth', authRoutes);
// 用户管理路由
router.use('/user', userRoutes);
// 日记管理路由
router.use('/diary', diaryRoutes); 
// “未来的你”路由
router.use('/diary', futureRoutes)
// 用户反馈管理路由
router.use('/feedback', feedbackRoutes);
// 好友管理路由
router.use('/friends', friendRoutes); 

// // 设置管理路由
// const settingsRoutes = require('./settingsRoutes');
// router.use('/settings', settingsRoutes);

// // 数据分析路由
// const analyticsRoutes = require('./analyticsRoutes');
// router.use('/analytics', analyticsRoutes);

// // 数据导出路由
// const dataRoutes = require('./dataRoutes');
// router.use('/data', dataRoutes);

export default router;