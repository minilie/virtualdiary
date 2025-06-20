require('dotenv').config();
const express = require('express');
const app = express();

const apiRouter = require('./routes/api');

const PORT = process.env.PORT || 3000;
const BASE_PATH = process.env.BASE_PATH || '/api';

// 中间件
app.use(require('cors')()); // 允许跨域请求
app.use(express.json());  // 解析 json 请求体
app.use(require('cookie-parser')()); 

// 基础路由
app.get('/', (req, res) => {
  res.send('虚拟时间旅行日记 - 后端服务运行中');
});

// API 路由
app.use(BASE_PATH, apiRouter);

// 错误处理中间件
app.use((err, req, res, next) => {
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

// 仅当直接运行文件时启动服务器（测试时不自动启动）
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`API 基础路径: ${BASE_PATH}`);
  });
}

// !!! 重要: 导出应用实例供测试使用 !!!
module.exports = app;