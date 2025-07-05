/**
 * 虚拟时间旅行日记 - API客户端
 * 统一前后端通信接口规范
 */

class VirtualDiaryAPI {
  constructor(baseURL = '/api', options = {}) {
    this.baseURL = baseURL;
    this.options = {
      timeout: 10000,
      retries: 3,
      ...options
    };
    this.token = null;
  }

  /**
   * 设置认证令牌
   * @param {string} token - JWT令牌
   */
  setAuthToken(token) {
    this.token = token;
  }

  /**
   * 通用HTTP请求方法
   * @param {string} method - HTTP方法
   * @param {string} endpoint - API端点
   * @param {Object} data - 请求数据
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} API响应
   */
  async request(method, endpoint, data = null, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // 添加认证头
    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    // 添加请求体
    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: '网络错误' }));
        throw new APIError(error.message, response.status, error);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('网络连接失败', 0, error);
    }
  }

  // ===== 用户管理模块 =====

  /**
   * 用户注册
   * @param {Object} userData - 用户注册信息
   * @param {string} userData.email - 邮箱
   * @param {string} userData.password - 密码
   * @param {string} userData.nickname - 昵称
   * @typedef {import('../backend/src/types/authTypes').OkResponse} OkResponse
   * @typedef {import('../backend/src/types/generalTypes').ErrorResponse} ErrorResponse
   * @returns {Promise<OkResponse| ErrorResponse>} 注册结果
   */
  async register(userData) {
    return this.request('POST', '/auth/register', userData);
  }

  /**
   * 用户登录
   * @param {Object} credentials - 登录凭据
   * @param {string} credentials.email - 邮箱
   * @param {string} credentials.password - 密码
   * @typedef {import('../backend/src/types/authTypes').LoginResponse} LoginResponse
   * @typedef {import('../backend/src/types/generalTypes').ErrorResponse} ErrorResponse
   * @returns {Promise<LoginResponse | ErrorResponse>} 登录结果（包含token）
   */
  async login(credentials) {
    const response = await this.request('POST', '/auth/login', credentials);
    if (response.token) {
      this.setAuthToken(response.token);
    }
    return response;
  }

  /**
   * 用户登出
   * @typedef {import('../backend/src/types/authTypes').OkResponse} OkResponse
   * @typedef {import('../backend/src/types/generalTypes').ErrorResponse} ErrorResponse
   * @returns {Promise<OkResponse | ErrorResponse>} 登出结果
   */
  async logout() {
    const response = await this.request('POST', '/auth/logout');
    this.token = null;
    return response;
  }

  /**
   * 获取用户信息
   * @returns {Promise<Object>} 用户信息
   */
  async getUserProfile() {
    return this.request('GET', '/user/profile');
  }

  /**
   * 更新用户信息
   * @param {Object} profileData - 用户信息
   * @returns {Promise<Object>} 更新结果
   */
  async updateUserProfile(profileData) {
    return this.request('PUT', '/user/profile', profileData);
  }

  /**
   * 完成个性化初始设置
   * @param {Object} personalityData - 个性化数据
   * @param {Object} personalityData.personality - 性格问卷结果
   * @param {Array} personalityData.goals - 生活目标
   * @param {string} personalityData.communicationStyle - 沟通风格
   * @returns {Promise<Object>} 设置结果
   */
  async completePersonalitySetup(personalityData) {
    return this.request('POST', '/user/personality-setup', personalityData);
  }

  // ===== 日记核心模块 =====

  /**
   * 创建日记
   * @param {Object} diaryData - 日记数据
   * @param {string} diaryData.title - 标题
   * @param {string} diaryData.content - 内容
   * @param {Array} diaryData.emotions - 情绪标签
   * @param {Array} diaryData.topics - 主题标签
   * @param {string} diaryData.visibility - 可见性设置
   * @returns {Promise<Object>} 创建结果
   */
  async createDiary(diaryData) {
    return this.request('POST', '/diary', diaryData);
  }

  /**
   * 获取日记列表
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码
   * @param {number} params.limit - 每页数量
   * @param {string} params.emotion - 情绪过滤
   * @param {string} params.topic - 主题过滤
   * @param {string} params.dateRange - 时间范围
   * @returns {Promise<Object>} 日记列表
   */
  async getDiaryList(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request('GET', `/diary?${queryString}`);
  }

  /**
   * 获取日记详情
   * @param {string} diaryId - 日记ID
   * @returns {Promise<Object>} 日记详情
   */
  async getDiary(diaryId) {
    return this.request('GET', `/diary/${diaryId}`);
  }

  /**
   * 更新日记
   * @param {string} diaryId - 日记ID
   * @param {Object} diaryData - 更新数据
   * @returns {Promise<Object>} 更新结果
   */
  async updateDiary(diaryId, diaryData) {
    return this.request('PUT', `/diary/${diaryId}`, diaryData);
  }

  /**
   * 删除日记
   * @param {string} diaryId - 日记ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteDiary(diaryId) {
    return this.request('DELETE', `/diary/${diaryId}`);
  }

  // ===== "未来的你"反馈模块 =====

  /**
   * 获取日记的"未来的你"反馈
   * @param {string} diaryId - 日记ID
   * @returns {Promise<Object>} 反馈内容
   */
  async getFutureFeedback(diaryId) {
    return this.request('GET', `/diary/${diaryId}/future-feedback`);
  }

  /**
   * 生成"未来的你"反馈
   * @param {string} diaryId - 日记ID
   * @param {Object} options - 生成选项
   * @param {string} options.type - 反馈类型 (emotional|thinking|action|memory)
   * @param {string} options.style - 反馈风格 (encouraging|analytical|humorous)
   * @returns {Promise<Object>} 生成的反馈
   */
  async generateFutureFeedback(diaryId, options = {}) {
    return this.request('POST', `/diary/${diaryId}/future-feedback`, options);
  }

  /**
   * 评价反馈质量
   * @param {string} feedbackId - 反馈ID
   * @param {Object} rating - 评价数据
   * @param {number} rating.score - 评分 (1-5)
   * @param {string} rating.feedback - 文字反馈
   * @param {Array} rating.tags - 标签 (useful|inaccurate|wrong_style)
   * @returns {Promise<Object>} 评价结果
   */
  async rateFeedback(feedbackId, rating) {
    return this.request('POST', `/feedback/${feedbackId}/rating`, rating);
  }

  /**
   * 与"未来的你"继续对话
   * @param {string} feedbackId - 反馈ID
   * @param {string} message - 用户消息
   * @returns {Promise<Object>} 对话回复
   */
  async continueFutureConversation(feedbackId, message) {
    return this.request('POST', `/feedback/${feedbackId}/conversation`, { message });
  }

  // ===== 记忆连接模块 =====

  /**
   * 搜索历史日记
   * @param {Object} searchParams - 搜索参数
   * @param {string} searchParams.keyword - 关键词
   * @param {Array} searchParams.emotions - 情绪筛选
   * @param {Array} searchParams.topics - 主题筛选
   * @param {string} searchParams.dateRange - 时间范围
   * @returns {Promise<Object>} 搜索结果
   */
  async searchDiaries(searchParams) {
    return this.request('POST', '/memory/search', searchParams);
  }

  /**
   * 获取相关记忆
   * @param {string} diaryId - 日记ID
   * @returns {Promise<Object>} 相关记忆列表
   */
  async getRelatedMemories(diaryId) {
    return this.request('GET', `/memory/related/${diaryId}`);
  }

  /**
   * 获取时间线视图
   * @param {Object} params - 查询参数
   * @param {string} params.type - 视图类型 (timeline|topic|emotion)
   * @param {string} params.filter - 过滤条件
   * @returns {Promise<Object>} 时间线数据
   */
  async getTimelineView(params) {
    const queryString = new URLSearchParams(params).toString();
    return this.request('GET', `/memory/timeline?${queryString}`);
  }

  /**
   * 获取记忆回顾推荐
   * @returns {Promise<Object>} 推荐的历史记忆
   */
  async getMemoryRecommendations() {
    return this.request('GET', '/memory/recommendations');
  }

  // ===== 决策辅助模块 =====

  /**
   * 创建决策请求
   * @param {Object} decisionData - 决策数据
   * @param {string} decisionData.title - 决策标题
   * @param {string} decisionData.description - 决策描述
   * @param {Array} decisionData.options - 可选方案
   * @param {Object} decisionData.context - 决策背景
   * @returns {Promise<Object>} 创建结果
   */
  async createDecisionRequest(decisionData) {
    return this.request('POST', '/decision', decisionData);
  }

  /**
   * 获取决策分析
   * @param {string} decisionId - 决策ID
   * @returns {Promise<Object>} 决策分析结果
   */
  async getDecisionAnalysis(decisionId) {
    return this.request('GET', `/decision/${decisionId}/analysis`);
  }

  /**
   * 更新决策结果
   * @param {string} decisionId - 决策ID
   * @param {Object} result - 决策结果
   * @param {string} result.chosenOption - 选择的方案
   * @param {string} result.reasoning - 选择理由
   * @returns {Promise<Object>} 更新结果
   */
  async updateDecisionResult(decisionId, result) {
    return this.request('PUT', `/decision/${decisionId}/result`, result);
  }

  /**
   * 获取决策历史
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 决策历史列表
   */
  async getDecisionHistory(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request('GET', `/decision/history?${queryString}`);
  }

  // ===== 好友系统模块 =====

  /**
   * 搜索用户
   * @param {string} keyword - 搜索关键词
   * @returns {Promise<Object>} 用户搜索结果
   */
  async searchUsers(keyword) {
    return this.request('GET', `/friends/search?q=${encodeURIComponent(keyword)}`);
  }

  /**
   * 发送好友请求
   * @param {string} userId - 用户ID
   * @param {string} message - 请求消息
   * @returns {Promise<Object>} 发送结果
   */
  async sendFriendRequest(userId, message = '') {
    return this.request('POST', '/friends/request', { userId, message });
  }

  /**
   * 响应好友请求
   * @param {string} requestId - 请求ID
   * @param {boolean} accept - 是否接受
   * @returns {Promise<Object>} 响应结果
   */
  async respondFriendRequest(requestId, accept) {
    return this.request('POST', `/friends/request/${requestId}/respond`, { accept });
  }

  /**
   * 获取好友列表
   * @returns {Promise<Object>} 好友列表
   */
  async getFriendsList() {
    return this.request('GET', '/friends');
  }

  /**
   * 分享日记给好友
   * @param {string} diaryId - 日记ID
   * @param {Array} friendIds - 好友ID列表
   * @param {Object} shareSettings - 分享设置
   * @returns {Promise<Object>} 分享结果
   */
  async shareDiaryWithFriends(diaryId, friendIds, shareSettings = {}) {
    return this.request('POST', `/diary/${diaryId}/share`, { 
      friendIds, 
      settings: shareSettings 
    });
  }

  /**
   * 获取好友的"未来评论"
   * @param {string} diaryId - 日记ID
   * @returns {Promise<Object>} 好友评论列表
   */
  async getFriendsFutureFeedback(diaryId) {
    return this.request('GET', `/diary/${diaryId}/friends-feedback`);
  }

  // ===== 设置和偏好模块 =====

  /**
   * 获取用户设置
   * @returns {Promise<Object>} 用户设置
   */
  async getUserSettings() {
    return this.request('GET', '/settings');
  }

  /**
   * 更新用户设置
   * @param {Object} settings - 设置数据
   * @returns {Promise<Object>} 更新结果
   */
  async updateUserSettings(settings) {
    return this.request('PUT', '/settings', settings);
  }

  /**
   * 获取通知设置
   * @returns {Promise<Object>} 通知设置
   */
  async getNotificationSettings() {
    return this.request('GET', '/settings/notifications');
  }

  /**
   * 更新通知设置
   * @param {Object} notificationSettings - 通知设置
   * @returns {Promise<Object>} 更新结果
   */
  async updateNotificationSettings(notificationSettings) {
    return this.request('PUT', '/settings/notifications', notificationSettings);
  }

  // ===== 数据分析模块 =====

  /**
   * 获取情绪趋势分析
   * @param {string} timeRange - 时间范围 (week|month|quarter|year)
   * @returns {Promise<Object>} 情绪趋势数据
   */
  async getEmotionTrends(timeRange = 'month') {
    return this.request('GET', `/analytics/emotions?range=${timeRange}`);
  }

  /**
   * 获取个人成长报告
   * @param {string} period - 报告周期 (monthly|quarterly|yearly)
   * @returns {Promise<Object>} 成长报告
   */
  async getGrowthReport(period = 'monthly') {
    return this.request('GET', `/analytics/growth-report?period=${period}`);
  }

  /**
   * 获取写作统计
   * @returns {Promise<Object>} 写作统计数据
   */
  async getWritingStats() {
    return this.request('GET', '/analytics/writing-stats');
  }

  // ===== 数据导出和备份 =====

  /**
   * 导出用户数据
   * @param {Object} exportOptions - 导出选项
   * @param {Array} exportOptions.dataTypes - 数据类型 (diaries|feedback|analytics)
   * @param {string} exportOptions.format - 导出格式 (json|csv|pdf)
   * @param {string} exportOptions.dateRange - 时间范围
   * @returns {Promise<Object>} 导出结果（包含下载链接）
   */
  async exportUserData(exportOptions) {
    return this.request('POST', '/data/export', exportOptions);
  }

  /**
   * 删除用户账户
   * @param {string} confirmationText - 确认文本
   * @returns {Promise<Object>} 删除结果
   */
  async deleteAccount(confirmationText) {
    return this.request('POST', '/user/delete-account', { 
      confirmation: confirmationText 
    });
  }
}

/**
 * API错误类
 */
class APIError extends Error {
  constructor(message, status, details = null) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.details = details;
  }
}

// 导出类和错误类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VirtualDiaryAPI, APIError };
} else if (typeof window !== 'undefined') {
  window.VirtualDiaryAPI = VirtualDiaryAPI;
  window.APIError = APIError;
} 