export interface Personality {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}
export interface UserProfile {
  nickname?: string;
  avatar?: string;
}
export interface PersonalitySetupRequest {
  personality: Personality;
  goals: string[];
  communicationStyle: string;
}
export interface OkResponse { msg: string; other?: any; }
export interface UserProfileResponse {
  user: {
    id: number;
    email: string;
    nickname?: string;
    avatar?: string;
    personality_settings?: string;
    goals?: string[];
    communication_style?: string;
    createdAt: string;
    // 你可以根据实际 User 模型结构再加字段
  };
}
