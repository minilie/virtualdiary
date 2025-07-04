export interface OkResponse{
  msg: string;
  other?: any;
}

export interface ErrorResponse {
  message: string;
  details?: any;
}