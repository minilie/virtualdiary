import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express'; // 修复1：导入完整类型

const JWT_SECRET: string = process.env.JWT_SECRET || 'dev';

// 修复2：扩展Express的Request接口
// 定义自定义请求类型
export interface AuthenticatedRequest extends Request {
  userId?: number;
}

export function extractUserId(token: string) : number {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    return decoded.userId; 
}

export function authenticate(
  req: AuthenticatedRequest, // 修复3：使用标准Request类型
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    // 修复4：明确返回void
    return void res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    req.userId = decoded.userId; // 修复5：通过声明合并添加userId
    next();
  } catch (err) {
    // 修复6：区分错误类型
    if (err instanceof jwt.TokenExpiredError) {
      return void res.status(401).json({ message: 'Token expired' });
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return void res.status(401).json({ message: 'Invalid token' });
    }
    return void res.status(500).json({ message: 'Authentication error' });
  }
}