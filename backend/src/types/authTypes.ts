export interface UserRegister {
  email: string;
  password: string;
  nickname: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface ErrorResponse {
  error: string;
  details?: any;
}

export interface OkResponse{
    msg: string;
    other?: any;
}