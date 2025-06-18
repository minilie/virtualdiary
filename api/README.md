# 虚拟时间旅行日记 - API 使用文档

## 项目概述

这个 API 客户端类为虚拟时间旅行日记项目提供了统一的前后端通信接口规范。通过这个类，前端和后端可以按照相同的标准并行开发，确保接口的一致性和稳定性。

## 文件结构

```
api/
├── api-client.js     # API 客户端核心类
└── README.md         # 使用文档（本文件）
```

## 快速开始

### 1. 引入 API 客户端

```javascript
// 在 Node.js 环境中
const { VirtualDiaryAPI, APIError } = require('./api-client');

// 在浏览器环境中（ES6 模块）
import { VirtualDiaryAPI, APIError } from './api-client.js';

// 在浏览器环境中（script 标签）
// <script src="api-client.js"></script>
// 然后使用 window.VirtualDiaryAPI
```

### 2. 初始化客户端

```javascript
// 创建 API 客户端实例
const api = new VirtualDiaryAPI('https://api.virtualdiary.com/api', {
  timeout: 15000,  // 请求超时时间（毫秒）
  retries: 3       // 重试次数
});

// 设置认证 token（如果已登录）
const savedToken = localStorage.getItem('auth_token');
if (savedToken) {
  api.setAuthToken(savedToken);
}
```

### 3. 基本使用示例

```javascript
async function basicUsage() {
  try {
    // 用户登录
    const loginResult = await api.login({
      email: 'user@example.com',
      password: 'password123'
    });
    console.log('登录成功:', loginResult.user.nickname);
    
    // 创建日记
    const diary = await api.createDiary({
      title: '今天的思考',
      content: '今天发生了很多有趣的事情...',
      emotions: ['happy', 'thoughtful'],
      topics: ['工作', '个人成长'],
      visibility: 'private'
    });
    console.log('日记创建成功:', diary.id);
    
    // 生成"未来的你"反馈
    const feedback = await api.generateFutureFeedback(diary.id, {
      type: 'thinking',
      style: 'encouraging'
    });
    console.log('收到未来的反馈:', feedback.content);
    
  } catch (error) {
    if (error instanceof APIError) {
      console.error('API 错误:', error.message, error.status);
    } else {
      console.error('网络错误:', error);
    }
  }
}
```

## API 类详细说明

### 构造函数

```javascript
new VirtualDiaryAPI(baseURL, options)
```

**参数:**
- `baseURL` (string): API 基础URL，默认为 '/api'
- `options` (object): 配置选项
  - `timeout` (number): 请求超时时间，默认 10000ms
  - `retries` (number): 重试次数，默认 3 次

### 核心方法

#### setAuthToken(token)
设置认证令牌

```javascript
api.setAuthToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
```

#### request(method, endpoint, data, options)
通用 HTTP 请求方法

```javascript
const response = await api.request('GET', '/diary/123');
```

## 主要功能模块

### 1. 用户管理模块

```javascript
// 用户注册
const user = await api.register({
  email: 'user@example.com',
  password: 'password123',
  nickname: '用户昵称'
});

// 用户登录
const loginResult = await api.login({
  email: 'user@example.com',
  password: 'password123'
});

// 获取用户信息
const profile = await api.getUserProfile();

// 更新用户信息
await api.updateUserProfile({
  nickname: '新昵称',
  avatar: 'avatar_url'
});

// 完成个性化设置
await api.completePersonalitySetup({
  personality: {
    openness: 4,
    conscientiousness: 3,
    extraversion: 5,
    agreeableness: 4,
    neuroticism: 2
  },
  goals: ['自我提升', '工作发展'],
  communicationStyle: 'encouraging'
});
```

### 2. 日记核心模块

```javascript
// 创建日记
const diary = await api.createDiary({
  title: '日记标题',
  content: '日记内容...',
  emotions: ['happy', 'reflective'],
  topics: ['工作', '生活'],
  visibility: 'private'
});

// 获取日记列表
const diaries = await api.getDiaryList({
  page: 1,
  limit: 20,
  emotion: 'happy',
  topic: '工作',
  dateRange: '2024-01'
});

// 获取日记详情
const diaryDetail = await api.getDiary('diary-id');

// 更新日记
await api.updateDiary('diary-id', {
  title: '更新的标题',
  content: '更新的内容'
});

// 删除日记
await api.deleteDiary('diary-id');
```

### 3. "未来的你"反馈模块

```javascript
// 生成反馈
const feedback = await api.generateFutureFeedback('diary-id', {
  type: 'thinking',        // emotional, thinking, action, memory
  style: 'encouraging'     // encouraging, analytical, humorous
});

// 获取已有反馈
const existingFeedback = await api.getFutureFeedback('diary-id');

// 评价反馈质量
await api.rateFeedback('feedback-id', {
  score: 5,
  feedback: '很有帮助',
  tags: ['useful', 'insightful']
});

// 继续对话
const reply = await api.continueFutureConversation('feedback-id', 
  '我想进一步了解这个建议'
);
```

### 4. 记忆连接模块

```javascript
// 搜索历史日记
const searchResults = await api.searchDiaries({
  keyword: '工作压力',
  emotions: ['stressed', 'anxious'],
  topics: ['工作'],
  dateRange: '2023-01-01,2024-01-01'
});

// 获取相关记忆
const relatedMemories = await api.getRelatedMemories('diary-id');

// 获取时间线视图
const timeline = await api.getTimelineView({
  type: 'emotion',
  filter: 'happy'
});

// 获取记忆推荐
const recommendations = await api.getMemoryRecommendations();
```

### 5. 决策辅助模块

```javascript
// 创建决策请求
const decision = await api.createDecisionRequest({
  title: '是否换工作',
  description: '当前工作遇到了一些问题...',
  options: [
    {
      title: '留在当前公司',
      description: '继续现在的工作',
      pros: ['稳定', '熟悉环境'],
      cons: ['成长有限', '薪资偏低']
    },
    {
      title: '换到新公司',
      description: '接受新的工作机会',
      pros: ['更高薪资', '新挑战'],
      cons: ['不确定性', '需要适应']
    }
  ],
  context: {
    urgency: 'medium',
    importance: 'high',
    category: '职业发展',
    stakeholders: ['自己', '家人']
  }
});

// 获取决策分析
const analysis = await api.getDecisionAnalysis('decision-id');

// 更新决策结果
await api.updateDecisionResult('decision-id', {
  chosenOption: 'option-1',
  reasoning: '经过深思熟虑...'
});
```

### 6. 好友系统模块

```javascript
// 搜索用户
const users = await api.searchUsers('张三');

// 发送好友请求
await api.sendFriendRequest('user-id', '你好，我想和你成为朋友');

// 响应好友请求
await api.respondFriendRequest('request-id', true); // true 接受，false 拒绝

// 获取好友列表
const friends = await api.getFriendsList();

// 分享日记给好友
await api.shareDiaryWithFriends('diary-id', ['friend-id-1', 'friend-id-2'], {
  allowComment: true,
  visibility: 'friends_only'
});

// 获取好友的"未来评论"
const friendsFeedback = await api.getFriendsFutureFeedback('diary-id');
```

## 错误处理

### APIError 类

所有 API 相关错误都会抛出 `APIError` 实例：

```javascript
class APIError extends Error {
  constructor(message, status, details = null) {
    super(message);
    this.name = 'APIError';
    this.status = status;     // HTTP 状态码
    this.details = details;   // 详细错误信息
  }
}
```

### 错误处理示例

```javascript
try {
  await api.createDiary(diaryData);
} catch (error) {
  if (error instanceof APIError) {
    switch (error.status) {
      case 400:
        console.error('请求参数错误:', error.message);
        break;
      case 401:
        console.error('未登录或登录已过期');
        // 重定向到登录页面
        break;
      case 403:
        console.error('权限不足:', error.message);
        break;
      case 404:
        console.error('资源不存在:', error.message);
        break;
      case 500:
        console.error('服务器错误:', error.message);
        break;
      default:
        console.error('API 错误:', error.message);
    }
  } else {
    console.error('网络错误:', error);
  }
}
```

## 响应数据格式

所有 API 响应都遵循统一格式：

### 成功响应

```javascript
{
  "success": true,
  "data": {
    // 具体的响应数据
  },
  "message": "操作成功",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 错误响应

```javascript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "数据验证失败",
    "details": {
      // 详细错误信息
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 数据结构定义

### 用户数据结构

```javascript
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

```javascript
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

```javascript
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
```

## 实际使用案例

### React 组件示例

```jsx
import React, { useState, useEffect } from 'react';
import { VirtualDiaryAPI, APIError } from './api/api-client';

function DiaryApp() {
  const [api] = useState(() => new VirtualDiaryAPI('http://localhost:3000/api'));
  const [user, setUser] = useState(null);
  const [diaries, setDiaries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 检查是否已登录
    const token = localStorage.getItem('auth_token');
    if (token) {
      api.setAuthToken(token);
      loadUserProfile();
    }
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await api.getUserProfile();
      setUser(profile);
      loadDiaries();
    } catch (error) {
      console.error('加载用户信息失败:', error);
    }
  };

  const loadDiaries = async () => {
    try {
      setIsLoading(true);
      const diariesData = await api.getDiaryList({ limit: 10 });
      setDiaries(diariesData.items);
    } catch (error) {
      console.error('加载日记失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const result = await api.login({ email, password });
      localStorage.setItem('auth_token', result.token);
      setUser(result.user);
      loadDiaries();
    } catch (error) {
      if (error instanceof APIError && error.status === 401) {
        alert('邮箱或密码错误');
      } else {
        alert('登录失败: ' + error.message);
      }
    }
  };

  const handleCreateDiary = async (diaryData) => {
    try {
      const newDiary = await api.createDiary(diaryData);
      setDiaries(prev => [newDiary, ...prev]);
      
      // 异步生成反馈
      api.generateFutureFeedback(newDiary.id, {
        type: 'emotional',
        style: 'encouraging'
      }).catch(error => {
        console.warn('生成反馈失败:', error);
      });
    } catch (error) {
      alert('创建日记失败: ' + error.message);
    }
  };

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="diary-app">
      <header>
        <h1>虚拟时间旅行日记</h1>
        <span>欢迎, {user.nickname}</span>
      </header>
      
      <DiaryEditor onSave={handleCreateDiary} />
      
      <div className="diary-list">
        {isLoading ? (
          <div>加载中...</div>
        ) : (
          diaries.map(diary => (
            <DiaryItem key={diary.id} diary={diary} api={api} />
          ))
        )}
      </div>
    </div>
  );
}
```

### Node.js 后端使用示例

```javascript
const express = require('express');
const { VirtualDiaryAPI } = require('./api/api-client');

// 创建反向代理或测试客户端
const testClient = new VirtualDiaryAPI('http://localhost:3000/api');

// 测试 API 接口
async function testAPI() {
  try {
    // 测试注册
    const user = await testClient.register({
      email: 'test@example.com',
      password: 'password123',
      nickname: '测试用户'
    });
    console.log('注册成功:', user);

    // 测试登录
    const loginResult = await testClient.login({
      email: 'test@example.com',
      password: 'password123'
    });
    console.log('登录成功:', loginResult.user.nickname);

    // 测试创建日记
    const diary = await testClient.createDiary({
      title: '测试日记',
      content: '这是一个测试日记',
      emotions: ['happy'],
      topics: ['测试']
    });
    console.log('日记创建成功:', diary.id);

  } catch (error) {
    console.error('测试失败:', error);
  }
}

testAPI();
```

## 开发建议

### 前端开发者

1. **错误处理**: 务必对所有 API 调用进行适当的错误处理
2. **加载状态**: 为异步操作添加加载指示器
3. **缓存策略**: 合理使用本地缓存减少不必要的 API 调用
4. **离线支持**: 考虑实现离线写作功能
5. **性能优化**: 使用分页、虚拟滚动等技术处理大数据列表

### 后端开发者

1. **接口规范**: 严格按照文档实现 API 接口
2. **数据验证**: 对所有输入数据进行严格验证
3. **错误响应**: 提供清晰、一致的错误响应格式
4. **性能优化**: 实现适当的缓存和数据库查询优化
5. **安全措施**: 实施适当的认证、授权和数据保护机制

### 协作建议

1. **接口测试**: 使用 Postman 或类似工具测试 API 接口
2. **文档更新**: 及时更新 API 文档以反映变更
3. **版本控制**: 为 API 实施适当的版本控制策略
4. **沟通机制**: 建立前后端团队的定期沟通机制

这个 API 客户端类为虚拟时间旅行日记项目提供了完整的接口规范，可以确保前后端开发的一致性和效率。 