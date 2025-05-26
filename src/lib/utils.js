// lib/utils.js
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export const generateUniqueFilename = (originalName) => {
  const ext = path.extname(originalName);
  const uuid = uuidv4();
  return `${uuid}${ext}`;
};

export const validatePDFFile = (file) => {
  const errors = [];
  
  // Check file type
  if (file.mimetype !== 'application/pdf') {
    errors.push('File must be a PDF');
  }
  
  // Check file size (10MB limit)
  const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10485760; // 10MB
  if (file.size > maxSize) {
    errors.push(`File size must be less than ${maxSize / 1048576}MB`);
  }
  
  return errors;
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const generateShareToken = () => {
  return uuidv4();
};

export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};
