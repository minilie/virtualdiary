/**
 * 用户设置类型
 */
export interface UserSettings {
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  timezone?: string;
  diaryPrivacy?: 'public' | 'friends-only' | 'private';
  // 可根据需要扩展其他设置
}

/**
 * 通知设置类型
 */
export interface NotificationSettings {
  emailSummary?: boolean;
  pushNewDiary?: boolean;
  pushFriendRequests?: boolean;
  pushComments?: boolean;
  pushLikes?: boolean;
  // 可根据需要扩展其他通知设置
}

/**
 * 更新用户设置请求体
 */
export interface UpdateUserSettingsRequest {
  settings: UserSettings;
}

/**
 * 更新通知设置请求体
 */
export interface UpdateNotificationSettingsRequest {
  notificationSettings: NotificationSettings;
}

/**
 * 用户设置响应
 */
export interface UserSettingsResponse {
  settings: UserSettings;
}

/**
 * 通知设置响应
 */
export interface NotificationSettingsResponse {
  notificationSettings: NotificationSettings;
}