import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
}

/**
 * Send success response
 */
export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    ...(data && { data })
  };

  return res.status(statusCode).json(response);
};

/**
 * Send error response
 */
export const sendError = (
  res: Response,
  message: string,
  errors?: any,
  statusCode: number = 400
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    ...(errors && { errors })
  };

  return res.status(statusCode).json(response);
};

/**
 * Send validation error response
 */
export const sendValidationError = (
  res: Response,
  errors: any
): Response => {
  return sendError(res, 'Validation failed', errors, 422);
};

/**
 * Send unauthorized response
 */
export const sendUnauthorized = (
  res: Response,
  message: string = 'Unauthorized access'
): Response => {
  return sendError(res, message, null, 401);
};

/**
 * Send forbidden response
 */
export const sendForbidden = (
  res: Response,
  message: string = 'Forbidden - Insufficient permissions'
): Response => {
  return sendError(res, message, null, 403);
};

/**
 * Send not found response
 */
export const sendNotFound = (
  res: Response,
  message: string = 'Resource not found'
): Response => {
  return sendError(res, message, null, 404);
};

/**
 * Send bad request response
 */
export const sendBadRequest = (
  res: Response,
  message: string,
  errors?: any
): Response => {
  return sendError(res, message, errors, 400);
};

/**
 * Send server error response
 */
export const sendServerError = (
  res: Response,
  message: string = 'Internal server error',
  errors?: any
): Response => {
  return sendError(res, message, errors, 500);
};
