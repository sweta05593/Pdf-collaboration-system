
// utils/constants.js
export const API_ROUTES = {
  AUTH: '/api/auth',
  UPLOAD: '/api/upload',
  FILES: '/api/files',
  SHARED: '/api/shared'
};

export const FILE_CONSTRAINTS = {
  MAX_SIZE: 10485760, // 10MB
  ALLOWED_TYPES: ['application/pdf'],
  UPLOAD_DIR: './public/uploads'
};

export const ERROR_MESSAGES = {
  INVALID_FILE_TYPE: 'Only PDF files are allowed',
  FILE_TOO_LARGE: 'File size exceeds 10MB limit',
  UPLOAD_FAILED: 'File upload failed',
  UNAUTHORIZED: 'You must be logged in to perform this action',
  NOT_FOUND: 'Resource not found',
  INVALID_INPUT: 'Invalid input provided',
  SERVER_ERROR: 'An unexpected error occurred'
};