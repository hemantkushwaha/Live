import { ApiResponse } from '../../shared/types';

export function sendSuccess<T>(res: import('express').Response, message: string, data?: T, statusCode = 200) {
  const payload: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(payload);
}

export function sendError(res: import('express').Response, message: string, error?: string, statusCode = 400) {
  const payload: ApiResponse = {
    success: false,
    message,
    error: error || message,
  };
  return res.status(statusCode).json(payload);
}
