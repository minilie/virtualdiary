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
// 分享日记请求类型
export interface ShareDiaryRequest {
  friendIds: number[];
  settings: {
    allowComment?: boolean;
    visibility?: 'private' | 'friends' | 'public';
  };
}

// 分享日记响应类型
export interface ShareDiaryResponse {
  success: boolean;
  sharedCount: number;
}

// 好友评论类型
export interface FriendComment {
  id: number;
  friendId: number;
  nickname: string;
  avatar?: string;
  comment: string;
  createdAt: string;
}

// 好友未来评论响应类型
export interface FriendsFutureFeedbackResponse {
  comments: FriendComment[];
}