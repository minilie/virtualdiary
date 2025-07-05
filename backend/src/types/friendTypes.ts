// 搜索用户请求
export interface SearchUsersQuery {
  q?: string;
}

// 搜索用户结果
export interface UserSearchResult {
  id: number;
  nickname: string;
  avatar?: string;
}

// 发送好友请求
export interface SendFriendRequest {
  userId: number;  // 目标用户ID
  message?: string;
}

// 响应好友请求
export interface RespondFriendRequest {
  accept: boolean;
}

// 好友列表项
export interface GetFriendsListResponse {
  id: number;
  nickname: string;
  avatar?: string;
}

// 好友请求项
export interface FriendRequestResponse {
  id: number;
  message?: string | null;
  created_at: string;
  from_user_id: number;
  nickname: string;
  avatar?: string;
}