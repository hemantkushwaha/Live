/**
 * Standardized API Response Helpers
 */

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data?: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  errorCode: string;
  message: string;
  details?: unknown;
  timestamp: string;
}

export type ApiResponseEnvelope<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export function createSuccessResponse<T = unknown>(
  data?: T,
  message: string = 'Success'
): ApiSuccessResponse<T> {
  return {
    success: true,
    message,
    ...(data !== undefined && { data }),
    timestamp: new Date().toISOString(),
  };
}

export function createErrorResponse(
  errorCode: string = 'INTERNAL_SERVER_ERROR',
  message: string = 'An error occurred',
  details?: unknown
): ApiErrorResponse {
  return {
    success: false,
    errorCode,
    message,
    ...(details !== undefined && { details }),
    timestamp: new Date().toISOString(),
  };
}
