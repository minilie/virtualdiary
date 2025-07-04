/* =========================
  输入参数类型的定义
======================= */
export interface UserRegister {
  email: string;
  password: string;
  nickname: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

/* =========================
  输出类型的定义
======================= */
export interface LoginResponse {
  token: string;
}