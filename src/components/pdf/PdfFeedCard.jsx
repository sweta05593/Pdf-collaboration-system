'use client';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

export default function PdfFeedCard({ file, currentUser, onLike, onShare }) {
  const [imageError, setImageError] = useState(false);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = () => {
    window.open(`/api/files/${file._id}/download`, '_blank');
  };

  const handleView = () => {
    window.open(`/share/${file.shareToken}`, '_blank');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {file.uploadedBy?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {file.uploadedBy?.name || 'Anonymous User'}
              </p>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {formatFileSize(file.fileSize)}
            </span>
            {file.metadata?.pages && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {file.metadata.pages} pages
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {file.originalName}
        </h3>
        
        {file.metadata?.title && file.metadata.title !== file.originalName && (
          <p className="text-gray-700 mb-2">{file.metadata.title}</p>
        )}
        
        {file.metadata?.subject && (
          <p className="text-gray-600 text-sm mb-3">{file.metadata.subject}</p>
        )}

        {file.metadata?.author && (
          <p className="text-gray-500 text-sm mb-3">
            Author: {file.metadata.author}
          </p>
        )}

        {/* PDF Preview */}
        <div className="bg-gray-100 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-red-500 mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-gray-600">PDF Document</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Like Button */}
            <button
              onClick={() => onLike(file._id)}
              className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm transition-colors ${
                file.isLiked 
                  ? 'bg-red-100 text-red-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
              }`}
            >
              <svg className="w-4 h-4" fill={file.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{file.likes || 0}</span>
            </button>

            {/* Comments */}
            <button className="flex items-center space-x-1 px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{file.commentCount || 0}</span>
            </button>

            {/* Share Button */}
            <button
              onClick={() => onShare(file)}
              className="flex items-center space-x-1 px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              <span>Share</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleView}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}