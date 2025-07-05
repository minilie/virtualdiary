// 定义反馈类型枚举
export type FeedbackType = 'emotional' | 'thinking' | 'action' | 'memory';

// 定义反馈风格枚举
export type FeedbackStyle = 'encouraging' | 'analytical' | 'humorous';

// 定义评价标签类型
export type RatingTag = 'useful' | 'inaccurate' | 'wrong_style';

// 评价数据结构
export interface RatingData {
  score: number; // 1-5
  feedback?: string; // 文字反馈
  tags?: RatingTag[]; // 评价标签
}

// 对话消息结构
export interface ConversationMessage {
  message: string; // 用户消息内容
  response: string; // AI响应内容
  createdAt: Date; // 创建时间
}

// 反馈数据结构
export interface FutureFeedbackData {
  id?: number; // 自增ID
  diaryId: number; // 关联的日记ID
  userId: number; // 关联的用户ID
  type: FeedbackType; // 反馈类型
  style: FeedbackStyle; // 反馈风格
  content: string; // 反馈内容
  rating?: RatingData; // 用户评价（可选）
  conversations?: ConversationMessage[]; // 后续对话（可选）
  createdAt?: Date; // 创建时间
  updatedAt?: Date; // 更新时间
}