export interface Diary {
  id: string;
  userId: string;
  title: string;
  content: string;
  emotions: string[];
  topics: string[];
  visibility: 'private' | 'friends' | 'public';
  metadata: {
    wordCount: number;
    readingTime: number;
    sentimentScore: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DiaryListResponse {
  diaries: Diary[];
  page: number;
  limit: number;
  total: number;
}

export interface ErrorResponse {
  error: string;
  details?: any;
}

export interface OkResponse {
  msg: string;
}