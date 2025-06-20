const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/user'); // 数据库用户模型

// 密钥配置
const JWT_SECRET = process.env.JWT_SECRET || 'secure_fallback_secret';
const TOKEN_EXPIRY = '1h'; // 令牌有效期

interface RegisterSuccessResponse {
  msg: string;
}

interface ValidationErrorResponse {
  errors: Array<{ 
    msg: string; 
    location?: string; 
    param: string 
  }>;
}

interface ConflictErrorResponse {
  error: string;
}

interface ServerErrorResponse {
  error: string;
}
/*
 * 用户注册
 * 安全措施：
 * 1. 密码加盐哈希存储
 * 2. 输入数据验证
 * 3. 敏感信息过滤
 */
router.post('/register', 
  // 输入验证规则
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('nickname').trim().escape()
  ],
  async (req, res) => {
    // 验证输入数据
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password, nickname } = req.body;

      // 检查邮箱是否注册
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      // 密码加密处理（加盐哈希）
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // 创建用户并保存
      const newUser = new User({
        email,
        password: hashedPassword,
        nickname
      });
      await newUser.save();

      // 返回成功响应（不含密码）
      res.status(201).json({ 
        msg: 'success'
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
});

/*
 * 用户登录
 * 安全措施：
 * 1. 计时攻击防护
 * 2. JWT签名防篡改
 * 3. HTTPS传输加密
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 查找用户
    const user = await User.findOne({ email });
    
    // 统一响应时间避免时序攻击
    const dummyHash = await bcrypt.hash('dummy', 10);
    const validPassword = user 
      ? await bcrypt.compare(password, user.password)
      : false;

    if (!user || !validPassword) {
      await bcrypt.compare('dummy', dummyHash); // 平衡响应时间
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 生成 JWT（包含用户ID和过期时间）
    const token = jwt.sign(
      { id: user.id }, 
      JWT_SECRET, 
      { expiresIn: TOKEN_EXPIRY }
    );

    // 设置 HTTP-only 安全 Cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000 // 1小时
    });

    res.json({ 
      message: 'Login successful',
      user: {
        id: user.id,
        nickname: user.nickname
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/*
 * 用户登出
 * 安全措施：
 * 1. 客户端令牌即时失效
 */
router.post('/logout', (req, res) => {
  try {
    // 清除安全Cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.json({ message: 'Logout successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;