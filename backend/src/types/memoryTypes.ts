/**
 * 记忆连接模块类型定义
 */

// 搜索参数类型
export interface SearchParams {
  keyword?: string;
  emotions?: string[];
  topics?: string[];
  dateRange?: string; // 格式: "startDate,endDate"
}

// 日记搜索结果
export interface DiarySearchResult {
  id: number;
  title: string;
  excerpt: string; // 内容摘要
  emotions: string[];
  topics: string[];
  createdAt: string;
}

// 相关记忆项
export interface RelatedMemory {
  id: number;
  title: string;
  relationType: 'emotion' | 'topic' | 'date' | 'keyword';
  similarityScore: number;
  createdAt: string;
}

// 时间线视图项
export interface TimelineItem {
  id: number;
  title: string;
  date: string;
  emotion: string;
  topics: string[];
}

// 时间线视图参数
export interface TimelineParams {
  type: 'timeline' | 'topic' | 'emotion';
  filter?: string;
}

// 记忆推荐项
export interface MemoryRecommendation {
  id: number;
  title: string;
  reason: string; // 推荐原因
  createdAt: string;
  emotion: string;
}