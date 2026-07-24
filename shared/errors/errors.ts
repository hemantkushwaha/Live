/**
 * Reusable Custom Error Classes for LiveConnect
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: string = 'INTERNAL_SERVER_ERROR',
    details?: unknown,
    isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Invalid input parameters', details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required or invalid credentials', details?: unknown) {
    super(message, 401, 'AUTHENTICATION_ERROR', details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Requested resource was not found', details?: unknown) {
    super(message, 404, 'NOT_FOUND_ERROR', details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource state conflict', details?: unknown) {
    super(message, 409, 'CONFLICT_ERROR', details);
  }
}

export class ServerError extends AppError {
  constructor(message: string = 'An unexpected internal server error occurred', details?: unknown) {
    super(message, 500, 'INTERNAL_SERVER_ERROR', details, false);
  }
}
