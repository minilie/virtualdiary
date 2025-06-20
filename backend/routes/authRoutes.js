const express = require('express');
const router = express.Router();

// 用户注册
router.post('/register', (req, res) => {
  const { email, password, nickname } = req.body;
  
  // 最小实现：返回模拟用户数据
  res.status(201).json({
    success: true,
    user: {
      id: 'user_123',
      email,
      nickname,
      createdAt: new Date().toISOString()
    },
    message: '注册成功'
  });
});

// 用户登录
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // 最小实现：返回模拟token
  res.json({
    success: true,
    token: 'simulated_jwt_token_here',
    user: {
      id: 'user_123',
      email,
      nickname: '测试用户'
    }
  });
});

// 用户登出
router.post('/logout', (req, res) => {
  res.json({ success: true, message: '登出成功' });
});

module.exports = router;