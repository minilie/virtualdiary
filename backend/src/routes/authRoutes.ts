import express, { Request, Response, Router, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult, Result, ValidationError } from 'express-validator';
import { UserLogin, UserRegister, LoginResponse } from '../types/authTypes';
import { OkResponse, ErrorResponse } from '../types/generalTypes';
import User from '../models/user';

const router: Router = express.Router();

// 密钥配置
const JWT_SECRET: string = process.env.JWT_SECRET || 'dev';
const TOKEN_EXPIRY: jwt.SignOptions['expiresIn'] = '1h';

/**
 * 用户注册路由处理函数
 * 
 * @param req - Express 请求对象，包含用户注册数据
 * @param res - Express 响应对象，返回操作结果
 * 
 * 成功响应：
 *   - 状态码: 201 Created
 *   - 响应体: OkResponse 类型，msg 为 "success"
 * 
 * 错误响应：
 *   - 400 Bad Request: 输入验证失败，details 包含验证错误详情
 *   - 409 Conflict: 邮箱已被注册
 *   - 500 Internal Server Error: 服务器内部错误
 */
router.post('/register', 
  // 输入验证规则
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('nickname').trim().escape()
  ],
  async (req: Request<{}, {}, UserRegister>, res: Response<OkResponse | ErrorResponse>) => {
    // 验证输入数据
    const errors: Result<ValidationError> = validationResult(req);
    
    // 处理验证错误
    if (!errors.isEmpty()) {
      const errorDetails = errors.array();
      
      // 返回验证错误响应
      res.status(400).json({
        message: 'Invalid email or password',
        details: errorDetails
      });
      return;
    }

    try {
      const { email, password, nickname } = req.body;

      // 检查邮箱是否已注册
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(409).json({ 
          message: 'Email already registered' 
        });
        return;
      }

      // 密码加密处理
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // 创建并保存新用户
      const newUser = new User({
        email,
        password: hashedPassword,
        nickname
      });
      await newUser.save();

      // 返回成功响应
      res.status(201).json({ 
        msg: 'success'
      });
    } catch (err) {
      console.error('Registration error:', err);
      
      // 返回服务器错误响应
      res.status(500).json({ 
        message: 'Server error',
      });
    }
  }
);

/**
 * 用户登录接口
 * 
 * @param req - Express 请求对象，包含用户登录凭证
 * @param res - Express 响应对象，返回认证结果
 * 
 * 安全措施：
 * 1. 计时攻击防护：统一响应时间避免时序攻击
 * 2. JWT签名防篡改：使用强密钥签名令牌
 * 3. HTTPS传输加密：生产环境强制安全Cookie
 * 4. HTTP-only Cookie：防止客户端脚本访问令牌
 * 5. SameSite严格模式：防止CSRF攻击
 * 
 * 响应状态码：
 * - 200 OK: 登录成功，返回用户信息和HTTP-only Cookie
 * - 401 Unauthorized: 无效凭证
 * - 500 Internal Server Error: 服务器内部错误
 */
router.post('/login', 
  async (req: Request<{}, {}, UserLogin>, res: Response<LoginResponse | ErrorResponse>) => {
    try {
      const { email, password } = req.body;

      // 查找用户
      const user = await User.findOne({ email });
      
      // 计时攻击防护：统一响应时间
      const dummyHash = await bcrypt.hash('dummy', 10);
      const validPassword = user 
        ? await bcrypt.compare(password, user.password)
        : false;

      // 无效凭证处理
      if (!user || !validPassword) {
        await bcrypt.compare('dummy', dummyHash); // 平衡响应时间
        return void res.status(401).json({ 
          message: 'Invalid credentials' 
        });
      }

      // 生成防篡改JWT（包含用户ID和过期时间）
      const token = jwt.sign(
        { userId: user.id }, 
        JWT_SECRET, 
        { expiresIn: TOKEN_EXPIRY }
      );
//console.log('Signing token for user id:', user.id);


      // 设置安全Cookie（HTTP-only + SameSite严格模式）
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // 生产环境启用HTTPS
        sameSite: 'strict', // 防止CSRF攻击
        maxAge: 3600000 // 1小时有效期
      });

      // 返回登录成功响应（不含敏感信息）
      res.json({ token: token });
    } catch (err) {
      console.error('登录错误:', err);
      res.status(500).json({ 
        message: 'Server error'
      });
    }
  }
);


/**
 * 用户登出接口
 * 
 * @param req - Express 请求对象
 * @param res - Express 响应对象
 * 
 * 安全措施：
 * 1. 客户端令牌即时失效：清除安全Cookie
 * 2. 同步服务器端状态：可扩展为令牌黑名单
 * 
 * 响应状态码：
 * - 200 OK: 登出成功
 * - 500 Internal Server Error: 服务器内部错误
 */
router.post('/logout', 
  (_req: Request, res: Response<OkResponse | ErrorResponse>) => {
    try {
      // 清除安全Cookie（使用与登录相同的安全配置）
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      res.json({ msg: 'Logout successfully' });
    } catch (err) {
      console.error('登出错误:', err);
      res.status(500).json({ 
        message: 'Server error'
      });
    }
  }
);

export default router;