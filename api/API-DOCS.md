# 虚拟时间旅行日记 - API 使用文档

## 目录

1. [快速开始](#快速开始)
2. [API 规范](#api-规范)
3. [前端使用示例](#前端使用示例)
4. [后端实现指南](#后端实现指南)
5. [数据结构定义](#数据结构定义)
6. [错误处理](#错误处理)
7. [认证机制](#认证机制)
8. [接口清单](#接口清单)

## 快速开始

### 引入 API 客户端

```javascript
// 在 Node.js 环境中
const { VirtualDiaryAPI, APIError } = require('./api-client');

// 在浏览器环境中
// <script src="api-client.js"></script>
// 或使用模块导入
import { VirtualDiaryAPI, APIError } from './api-client.js';
```

### 初始化客户端

```javascript
// 创建 API 客户端实例
const api = new VirtualDiaryAPI('https://api.virtualdiary.com/api', {
  timeout: 15000,  // 请求超时时间（毫秒）
  retries: 3       // 重试次数
});

// 如果有存储的 token，设置认证
const savedToken = localStorage.getItem('auth_token');
if (savedToken) {
  api.setAuthToken(savedToken);
}
```

### 基本使用流程

```javascript
async function basicUsage() {
  try {
    // 1. 用户登录
    const loginResult = await api.login({
      email: 'user@example.com',
      password: 'password123'
    });
    
    // 2. 创建日记
    const diary = await api.createDiary({
      title: '今天的思考',
      content: '今天发生了很多有趣的事情...',
      emotions: ['happy', 'thoughtful'],
      topics: ['工作', '个人成长'],
      visibility: 'private'
    });
    
    // 3. 获取"未来的你"反馈
    const feedback = await api.generateFutureFeedback(diary.id, {
      type: 'thinking',
      style: 'encouraging'
    });
    
    console.log('收到未来的你的反馈:', feedback.content);
    
  } catch (error) {
    if (error instanceof APIError) {
      console.error('API 错误:', error.message, error.status);
    } else {
      console.error('网络错误:', error);
    }
  }
}
```

## API 规范

### 请求格式

所有 API 请求都使用 JSON 格式，并需要设置正确的 Content-Type 头：

```
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>  (需要认证的接口)
```

### 响应格式

所有 API 响应都遵循统一的格式：

```javascript
// 成功响应
{
  "success": true,
  "data": { /* 具体数据 */ },
  "message": "操作成功",
  "timestamp": "2024-01-15T10:30:00Z"
}

// 错误响应
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "数据验证失败",
    "details": { /* 详细错误信息 */ }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### HTTP 状态码

- `200` - 请求成功
- `201` - 创建成功
- `400` - 请求参数错误
- `401` - 未认证或认证失败
- `403` - 权限不足
- `404` - 资源不存在
- `409` - 资源冲突
- `422` - 数据验证失败
- `500` - 服务器内部错误

## 前端使用示例

### 用户认证流程

```javascript
class AuthService {
  constructor(api) {
    this.api = api;
  }

  async register(userData) {
    try {
      const result = await this.api.register(userData);
      if (result.token) {
        localStorage.setItem('auth_token', result.token);
        this.api.setAuthToken(result.token);
      }
      return result;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async login(credentials) {
    try {
      const result = await this.api.login(credentials);
      localStorage.setItem('auth_token', result.token);
      localStorage.setItem('user_info', JSON.stringify(result.user));
      return result;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async logout() {
    try {
      await this.api.logout();
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
      this.api.setAuthToken(null);
    }
  }

  handleAuthError(error) {
    if (error.status === 401) {
      this.logout();
      return new Error('登录已过期，请重新登录');
    }
    return error;
  }
}
```

### 日记管理

```javascript
class DiaryService {
  constructor(api) {
    this.api = api;
  }

  async createDiary(diaryData) {
    // 数据验证
    if (!diaryData.content || diaryData.content.trim().length === 0) {
      throw new Error('日记内容不能为空');
    }

    try {
      const diary = await this.api.createDiary({
        title: diaryData.title || '',
        content: diaryData.content,
        emotions: diaryData.emotions || [],
        topics: diaryData.topics || [],
        visibility: diaryData.visibility || 'private'
      });

      // 自动生成"未来的你"反馈
      this.generateFeedbackAsync(diary.id);
      
      return diary;
    } catch (error) {
      console.error('创建日记失败:', error);
      throw error;
    }
  }

  async generateFeedbackAsync(diaryId) {
    try {
      await this.api.generateFutureFeedback(diaryId, {
        type: 'emotional',
        style: 'encouraging'
      });
    } catch (error) {
      console.warn('生成反馈失败:', error);
    }
  }

  async getDiaryWithFeedback(diaryId) {
    try {
      const [diary, feedback] = await Promise.all([
        this.api.getDiary(diaryId),
        this.api.getFutureFeedback(diaryId)
      ]);

      return {
        ...diary,
        futureFeedback: feedback
      };
    } catch (error) {
      console.error('获取日记详情失败:', error);
      throw error;
    }
  }

  async searchDiaries(searchParams) {
    try {
      return await this.api.searchDiaries({
        keyword: searchParams.keyword || '',
        emotions: searchParams.emotions || [],
        topics: searchParams.topics || [],
        dateRange: searchParams.dateRange || 'all'
      });
    } catch (error) {
      console.error('搜索日记失败:', error);
      throw error;
    }
  }
}
```

### React 组件示例

```jsx
import React, { useState, useEffect } from 'react';

function DiaryEditor({ api, onSave }) {
  const [diary, setDiary] = useState({
    title: '',
    content: '',
    emotions: [],
    topics: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // 保存日记
      const savedDiary = await api.createDiary(diary);
      
      // 生成反馈
      const futureFeedback = await api.generateFutureFeedback(savedDiary.id, {
        type: 'thinking',
        style: 'analytical'
      });
      
      setFeedback(futureFeedback);
      onSave(savedDiary);
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="diary-editor">
      <input
        type="text"
        placeholder="日记标题"
        value={diary.title}
        onChange={(e) => setDiary({ ...diary, title: e.target.value })}
      />
      
      <textarea
        placeholder="记录你的想法..."
        value={diary.content}
        onChange={(e) => setDiary({ ...diary, content: e.target.value })}
        rows="10"
      />
      
      <button onClick={handleSave} disabled={isLoading}>
        {isLoading ? '保存中...' : '保存日记'}
      </button>
      
      {feedback && (
        <div className="future-feedback">
          <h3>来自未来的你:</h3>
          <p>{feedback.content}</p>
        </div>
      )}
    </div>
  );
}
```

## 后端实现指南

### Express.js 路由示例

```javascript
const express = require('express');
const router = express.Router();

// 用户认证路由
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 验证用户凭据
    const user = await User.findByEmailAndPassword(email, password);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: '邮箱或密码错误'
        }
      });
    }

    // 生成 JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
    
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '服务器内部错误'
      }
    });
  }
});

// 创建日记路由
router.post('/diary', authenticateToken, async (req, res) => {
  try {
    const { title, content, emotions, topics, visibility } = req.body;
    
    // 数据验证
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '日记内容不能为空'
        }
      });
    }

    // 创建日记
    const diary = await Diary.create({
      userId: req.user.id,
      title,
      content,
      emotions,
      topics,
      visibility: visibility || 'private'
    });

    // 异步生成反馈
    generateFeedbackAsync(diary.id);

    res.status(201).json({
      success: true,
      data: diary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '创建日记失败'
      }
    });
  }
});

// 生成"未来的你"反馈路由
router.post('/diary/:diaryId/future-feedback', authenticateToken, async (req, res) => {
  try {
    const { diaryId } = req.params;
    const { type, style } = req.body;

    // 获取日记
    const diary = await Diary.findByIdAndUser(diaryId, req.user.id);
    if (!diary) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '日记不存在'
        }
      });
    }

    // 生成反馈
    const feedback = await FutureFeedbackService.generate({
      diary,
      user: req.user,
      type: type || 'emotional',
      style: style || 'encouraging'
    });

    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'GENERATION_ERROR',
        message: '生成反馈失败'
      }
    });
  }
});

// 认证中间件
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'NO_TOKEN',
        message: '缺少认证令牌'
      }
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: '无效的认证令牌'
        }
      });
    }
    req.user = user;
    next();
  });
}

module.exports = router;
```

### 数据库模型示例（MongoDB/Mongoose）

```javascript
const mongoose = require('mongoose');

// 用户模型
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  nickname: { type: String, required: true },
  personality: {
    openness: { type: Number, default: 3 },
    conscientiousness: { type: Number, default: 3 },
    extraversion: { type: Number, default: 3 },
    agreeableness: { type: Number, default: 3 },
    neuroticism: { type: Number, default: 3 }
  },
  preferences: {
    communicationStyle: { type: String, default: 'encouraging' },
    feedbackFrequency: { type: String, default: 'normal' },
    themes: [String]
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 日记模型
const DiarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: '' },
  content: { type: String, required: true },
  emotions: [String],
  topics: [String],
  visibility: { type: String, enum: ['private', 'friends', 'public'], default: 'private' },
  metadata: {
    wordCount: Number,
    readingTime: Number,
    sentimentScore: Number
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 反馈模型
const FeedbackSchema = new mongoose.Schema({
  diaryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Diary', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['emotional', 'thinking', 'action', 'memory'], required: true },
  style: { type: String, enum: ['encouraging', 'analytical', 'humorous'], required: true },
  rating: {
    score: { type: Number, min: 1, max: 5 },
    feedback: String,
    tags: [String]
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = {
  User: mongoose.model('User', UserSchema),
  Diary: mongoose.model('Diary', DiarySchema),
  Feedback: mongoose.model('Feedback', FeedbackSchema)
};
```

## 数据结构定义

### 用户数据结构

```typescript
interface User {
  id: string;
  email: string;
  nickname: string;
  avatar?: string;
  personality: {
    openness: number;          // 开放性 (1-5)
    conscientiousness: number; // 责任感 (1-5)
    extraversion: number;      // 外向性 (1-5)
    agreeableness: number;     // 宜人性 (1-5)
    neuroticism: number;       // 神经质 (1-5)
  };
  preferences: {
    communicationStyle: 'encouraging' | 'analytical' | 'humorous';
    feedbackFrequency: 'high' | 'normal' | 'low';
    themes: string[];
  };
  createdAt: string;
  updatedAt: string;
}
```

### 日记数据结构

```typescript
interface Diary {
  id: string;
  userId: string;
  title: string;
  content: string;
  emotions: string[];        // ['happy', 'thoughtful', 'excited']
  topics: string[];          // ['工作', '个人成长', '人际关系']
  visibility: 'private' | 'friends' | 'public';
  metadata: {
    wordCount: number;
    readingTime: number;     // 预估阅读时间（分钟）
    sentimentScore: number;  // 情感分数 (-1 到 1)
  };
  createdAt: string;
  updatedAt: string;
}
```

### 反馈数据结构

```typescript
interface FutureFeedback {
  id: string;
  diaryId: string;
  userId: string;
  content: string;
  type: 'emotional' | 'thinking' | 'action' | 'memory';
  style: 'encouraging' | 'analytical' | 'humorous';
  relatedMemories?: RelatedMemory[];
  rating?: {
    score: number;         // 1-5 分
    feedback: string;
    tags: string[];        // ['useful', 'inaccurate', 'wrong_style']
  };
  createdAt: string;
}

interface RelatedMemory {
  diaryId: string;
  title: string;
  date: string;
  similarity: number;      // 相似度 (0-1)
  reason: string;          // 关联原因
}
```

### 决策数据结构

```typescript
interface Decision {
  id: string;
  userId: string;
  title: string;
  description: string;
  options: DecisionOption[];
  context: {
    urgency: 'low' | 'medium' | 'high';
    importance: 'low' | 'medium' | 'high';
    category: string;
    stakeholders: string[];
  };
  analysis?: DecisionAnalysis;
  result?: {
    chosenOption: string;
    reasoning: string;
    outcome?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface DecisionOption {
  id: string;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  score?: number;          // 综合评分
}

interface DecisionAnalysis {
  recommendations: string[];
  riskAssessment: string[];
  similarPastDecisions: PastDecision[];
  futureProjections: string[];
}
```

## 错误处理

### 错误类型定义

```javascript
class APIError extends Error {
  constructor(message, status, details = null) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.details = details;
  }

  // 判断是否为特定类型的错误
  isAuthError() {
    return this.status === 401 || this.status === 403;
  }

  isValidationError() {
    return this.status === 400 || this.status === 422;
  }

  isNotFoundError() {
    return this.status === 404;
  }

  isServerError() {
    return this.status >= 500;
  }
}
```

### 统一错误处理

```javascript
class ErrorHandler {
  static handle(error, context = '') {
    console.error(`[${context}] Error:`, error);

    if (error instanceof APIError) {
      return this.handleAPIError(error);
    }
    
    return this.handleUnknownError(error);
  }

  static handleAPIError(error) {
    const errorMessages = {
      400: '请求参数错误',
      401: '请先登录',
      403: '权限不足',
      404: '资源不存在',
      409: '数据冲突',
      422: '数据验证失败',
      500: '服务器错误，请稍后重试'
    };

    return {
      type: 'api_error',
      message: errorMessages[error.status] || error.message,
      status: error.status,
      details: error.details
    };
  }

  static handleUnknownError(error) {
    return {
      type: 'unknown_error',
      message: '网络连接失败，请检查网络设置',
      originalError: error
    };
  }
}

// 使用示例
try {
  await api.createDiary(diaryData);
} catch (error) {
  const handledError = ErrorHandler.handle(error, 'DiaryService.create');
  showErrorMessage(handledError.message);
}
```

## 认证机制

### JWT Token 管理

```javascript
class TokenManager {
  static TOKEN_KEY = 'virtual_diary_token';
  static REFRESH_TOKEN_KEY = 'virtual_diary_refresh_token';

  static saveToken(token, refreshToken = null) {
    localStorage.setItem(this.TOKEN_KEY, token);
    if (refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  static getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static getRefreshToken() {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static clearTokens() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  static isTokenExpired(token) {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}

// 自动刷新 token
class AuthenticatedAPI extends VirtualDiaryAPI {
  async request(method, endpoint, data = null, options = {}) {
    const token = TokenManager.getToken();
    
    // 检查 token 是否过期
    if (token && TokenManager.isTokenExpired(token)) {
      await this.refreshToken();
    }

    try {
      return await super.request(method, endpoint, data, options);
    } catch (error) {
      // 如果是认证错误，尝试刷新 token
      if (error.status === 401) {
        await this.refreshToken();
        return await super.request(method, endpoint, data, options);
      }
      throw error;
    }
  }

  async refreshToken() {
    const refreshToken = TokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new APIError('需要重新登录', 401);
    }

    try {
      const response = await super.request('POST', '/auth/refresh', {
        refreshToken
      });
      
      TokenManager.saveToken(response.token, response.refreshToken);
      this.setAuthToken(response.token);
    } catch (error) {
      TokenManager.clearTokens();
      throw new APIError('登录已过期，请重新登录', 401);
    }
  }
}
```

## 接口清单

### 认证相关接口

| 方法 | 端点 | 描述 | 是否需要认证 |
|------|------|------|-------------|
| POST | `/auth/register` | 用户注册 | ❌ |
| POST | `/auth/login` | 用户登录 | ❌ |
| POST | `/auth/logout` | 用户登出 | ✅ |
| POST | `/auth/refresh` | 刷新 token | ❌ |
| POST | `/auth/forgot-password` | 忘记密码 | ❌ |
| POST | `/auth/reset-password` | 重置密码 | ❌ |

### 用户管理接口

| 方法 | 端点 | 描述 | 是否需要认证 |
|------|------|------|-------------|
| GET | `/user/profile` | 获取用户信息 | ✅ |
| PUT | `/user/profile` | 更新用户信息 | ✅ |
| POST | `/user/personality-setup` | 完成个性化设置 | ✅ |
| POST | `/user/delete-account` | 删除账户 | ✅ |

### 日记管理接口

| 方法 | 端点 | 描述 | 是否需要认证 |
|------|------|------|-------------|
| POST | `/diary` | 创建日记 | ✅ |
| GET | `/diary` | 获取日记列表 | ✅ |
| GET | `/diary/:id` | 获取日记详情 | ✅ |
| PUT | `/diary/:id` | 更新日记 | ✅ |
| DELETE | `/diary/:id` | 删除日记 | ✅ |
| POST | `/diary/:id/share` | 分享日记 | ✅ |

### 反馈相关接口

| 方法 | 端点 | 描述 | 是否需要认证 |
|------|------|------|-------------|
| GET | `/diary/:id/future-feedback` | 获取反馈 | ✅ |
| POST | `/diary/:id/future-feedback` | 生成反馈 | ✅ |
| GET | `/diary/:id/friends-feedback` | 获取好友反馈 | ✅ |
| POST | `/feedback/:id/rating` | 评价反馈 | ✅ |
| POST | `/feedback/:id/conversation` | 继续对话 | ✅ |

### 记忆和搜索接口

| 方法 | 端点 | 描述 | 是否需要认证 |
|------|------|------|-------------|
| POST | `/memory/search` | 搜索日记 | ✅ |
| GET | `/memory/related/:diaryId` | 获取相关记忆 | ✅ |
| GET | `/memory/timeline` | 获取时间线 | ✅ |
| GET | `/memory/recommendations` | 获取记忆推荐 | ✅ |

### 决策辅助接口

| 方法 | 端点 | 描述 | 是否需要认证 |
|------|------|------|-------------|
| POST | `/decision` | 创建决策 | ✅ |
| GET | `/decision/:id/analysis` | 获取决策分析 | ✅ |
| PUT | `/decision/:id/result` | 更新决策结果 | ✅ |
| GET | `/decision/history` | 获取决策历史 | ✅ |

### 好友系统接口

| 方法 | 端点 | 描述 | 是否需要认证 |
|------|------|------|-------------|
| GET | `/friends/search` | 搜索用户 | ✅ |
| POST | `/friends/request` | 发送好友请求 | ✅ |
| POST | `/friends/request/:id/respond` | 响应好友请求 | ✅ |
| GET | `/friends` | 获取好友列表 | ✅ |

### 设置和分析接口

| 方法 | 端点 | 描述 | 是否需要认证 |
|------|------|------|-------------|
| GET | `/settings` | 获取设置 | ✅ |
| PUT | `/settings` | 更新设置 | ✅ |
| GET | `/settings/notifications` | 获取通知设置 | ✅ |
| PUT | `/settings/notifications` | 更新通知设置 | ✅ |
| GET | `/analytics/emotions` | 情绪趋势分析 | ✅ |
| GET | `/analytics/growth-report` | 个人成长报告 | ✅ |
| GET | `/analytics/writing-stats` | 写作统计 | ✅ |

### 数据管理接口

| 方法 | 端点 | 描述 | 是否需要认证 |
|------|------|------|-------------|
| POST | `/data/export` | 导出数据 | ✅ |
| POST | `/data/import` | 导入数据 | ✅ |
| GET | `/data/backup` | 数据备份 | ✅ |

---

## 注意事项

1. **安全性**: 所有包含敏感信息的接口都需要进行身份验证
2. **性能**: 对于大数据量的接口（如搜索、列表），建议实现分页机制
3. **错误处理**: 前端应该对所有可能的错误场景进行适当处理
4. **缓存**: 适当使用缓存机制提高用户体验
5. **离线支持**: 考虑实现离线写作和同步功能
6. **数据保护**: 确保用户数据的隐私和安全

这个 API 规范为前后端开发提供了统一的标准，可以保证双方并行开发的顺利进行。 