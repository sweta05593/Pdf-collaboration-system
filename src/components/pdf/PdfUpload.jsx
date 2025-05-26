
'use client';

import { useState, useRef } from 'react';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/loadingSpinner';


export default function PdfUpload({ onSuccess, onError, onLoadingChange }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);


  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const validateFile = (file) => {
    const errors = [];
    
    if (!file) {
      errors.push('No file selected');
      return errors;
    }
    
    if (file.type !== 'application/pdf') {
      errors.push('File must be a PDF');
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB
      errors.push('File size must be less than 10MB');
    }

    if (file.size === 0) {
      errors.push('File cannot be empty');
    }
    
    return errors;
  };

  const handleFileUpload = async (file) => {
    setError('');
    setUploadProgress(0);
    
    const validationErrors = validateFile(file);
    if (validationErrors.length > 0) {
      const errorMessage = validationErrors.join(', ');
      setError(errorMessage);
      if (onError) onError(new Error(errorMessage));
      return;
    }

    setIsUploading(true);
    if (onLoadingChange) onLoadingChange(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev < 90) {
            return prev + 10;
          }
          return prev;
        });
      }, 200);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Upload failed: ${response.status}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      // Success
      if (onSuccess) onSuccess(data.file || data);
      
      // Reset form
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Clear any previous errors
      if (onError) onError(null);
      
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.message || 'Upload failed. Please try again.';
      setError(errorMessage);
      if (onError) onError(error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (onLoadingChange) onLoadingChange(false);
    }
  };

  const clearError = () => {
    setError('');
    if (onError) onError(null);
  };

  return (
    <div className="w-full">
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200
          ${isDragging ? 'border-blue-400 bg-blue-500' : 'border-gray-300'}
          ${isUploading ? 'opacity-50 pointer-events-none' : 'hover:border-gray-400'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isUploading ? (
          <div className="space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-gray-600">Uploading PDF...</p>
            {uploadProgress > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
            <p className="text-sm text-gray-500">{uploadProgress}%</p>
          </div>
        ) : (
          <div className="space-y-4">
            <svg 
              className="mx-auto h-16 w-16 text-gray-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1} 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
              />
            </svg>
            
            <div>
              <p className="text-lg font-medium text-gray-900">
                Drop your PDF here, or{' '}
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-500 font-medium focus:outline-none focus:underline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  browse
                </button>
              </p>
              <p className="text-sm text-gray-500 mt-2">
                PDF files up to 10MB
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="mt-4"
            >
              Select PDF File
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <div className="flex items-center justify-between">
            <span className="text-sm">{error}</span>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-600 ml-2 focus:outline-none"
              aria-label="Clear error"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}