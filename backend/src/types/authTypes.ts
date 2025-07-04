export interface UserRegister {
  email: string;
  password: string;
  nickname: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface OkResponse{
  msg: string;
  other?: any;
}