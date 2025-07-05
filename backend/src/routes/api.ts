import express, { Router } from 'express'; // 1. 使用 ES Module 导入
import authRoutes from './authRoutes'; // 2. 省略 `.ts` 扩展名
import userRoutes from './userRoutes';
import diaryRoutes from './diaryRoutes';
import friendRoutes from './friendRoutes';
import settingsRoutes from './settingsRoutes';
import dataRoutes from './dataRoutes';
const router: Router = express.Router();

router.use('/auth', authRoutes);
// // 用户管理路由
router.use('/user', userRoutes);
// // 日记管理路由
router.use('/diary', diaryRoutes); 

// // 反馈管理路由
// const feedbackRoutes = require('./feedbackRoutes');
// router.use('/feedback', feedbackRoutes);

// // 记忆管理路由
// const memoryRoutes = require('./memoryRoutes');
// router.use('/memory', memoryRoutes);

// // 决策管理路由
// const decisionRoutes = require('./decisionRoutes');
// router.use('/decision', decisionRoutes);

// // 好友管理路由
// const friendRoutes = require('./friendRoutes');
router.use('/friends', friendRoutes); 

// // 设置管理路由
// const settingsRoutes = require('./settingsRoutes');
 router.use('/settings', settingsRoutes);

// // 数据分析路由
// const analyticsRoutes = require('./analyticsRoutes');
// router.use('/analytics', analyticsRoutes);

// // 数据导出路由
// const dataRoutes = require('./dataRoutes');
router.use('/data', dataRoutes);

export default router;