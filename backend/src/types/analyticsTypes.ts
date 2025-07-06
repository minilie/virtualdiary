/**
 * 情绪趋势分析数据类型
 */
export interface EmotionTrends {
  date: string; // 日期 (YYYY-MM-DD)
  averageScore: number; // 平均情绪分数
  emotionDistribution: Record<string, number>; // 情绪分布 {emotion: count}
}

/**
 * 个人成长报告类型
 */
export interface GrowthReport {
  period: string; // 报告周期
  insights: string; // 分析洞察文本
  keyMetrics: {
    totalWords: number; // 总字数
    diaryCount: number; // 日记数量
    topEmotions: string[]; // 高频情绪
    topTopics: string[]; // 高频主题
    consistencyScore: number; // 写作连贯性分数 (0-10)
  };
}

/**
 * 写作统计数据
 */
export interface WritingStats {
  totalDiaries: number; // 总日记数
  totalWords: number; // 总字数
  averageWords: number; // 平均每篇字数
  longestDiary: number; // 最长日记字数
  shortestDiary: number; // 最短日记字数
  favoriteTopics: { topic: string; count: number }[]; // 热门主题
  emotionSummary: { emotion: string; count: number }[]; // 情绪分布
  writingFrequency: { // 写作频率
    daily: number; // 日均日记数
    weekly: number; // 周均日记数
    monthly: number; // 月均日记数
  };
}