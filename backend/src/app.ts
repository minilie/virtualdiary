import dotenv from 'dotenv';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import apiRouter from './routes/api'; // 注意路径变化

dotenv.config();
const app: Express = express();
const PORT = process.env.PORT || 3000;
const BASE_PATH = process.env.BASE_PATH || '/api';

// 中间件（添加类型注解）
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// 基础路由
app.get('/', (_req: Request, res: Response) => {
  res.send('虚拟时间旅行日记 - 后端服务运行中');
});

// API路由
app.use(BASE_PATH, apiRouter);

// 错误处理（显式声明类型）
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: '服务器内部错误',
      details: err.message
    }
  });
});

// 仅直接运行时启动（保留测试兼容性）
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`API 基础路径: ${BASE_PATH}`);
  });
}

export default app;