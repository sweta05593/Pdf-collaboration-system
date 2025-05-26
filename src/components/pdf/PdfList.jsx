// src/components/pdf/PdfList.js
'use client';
import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/loadingSpinner';

export default function PdfList({ refreshTrigger, onError }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState({});

  useEffect(() => {
    fetchFiles();
  }, [refreshTrigger]);

  const fetchFiles = async (search = '') => {
    try {
      setLoading(true);
      
      const url = new URL('/api/files', window.location.origin);
      if (search) {
        url.searchParams.append('search', search);
      }

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setFiles(data.files || []);
        if (onError) onError(null);
      } else {
        throw new Error(data.error || 'Failed to fetch files');
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      if (onError) onError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchFiles(searchTerm);
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      setDeleteLoading(prev => ({ ...prev, [fileId]: true }));

      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setFiles(prev => prev.filter(file => file._id !== fileId));
        if (onError) onError(null);
      } else {
        throw new Error(data.error || 'Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      if (onError) onError(error.message);
    } finally {
      setDeleteLoading(prev => ({ ...prev, [fileId]: false }));
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Search Bar */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Button type="submit" variant="outline">
            Search
          </Button>
          {searchTerm && (
            <Button 
              type="button" 
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                fetchFiles();
              }}
            >
              Clear
            </Button>
          )}
        </form>
      </div>

      {/* Files List */}
      {files.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'No files match your search.' : 'Get started by uploading a PDF document.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden">
          <div className="divide-y divide-gray-200">
            {files.map((file) => (
              <div key={file._id} className="py-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-10 w-10 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {file.originalName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatFileSize(file.fileSize)} • {formatDate(file.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/uploads/${file.filename}`, '_blank')}
                  >
                    View
                  </Button>
                  {file.shareToken && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const shareUrl = `${window.location.origin}/share/${file.shareToken}`;
                        navigator.clipboard.writeText(shareUrl);
                        // You could show a toast here
                        alert('Share link copied to clipboard!');
                      }}
                    >
                      Share
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteFile(file._id)}
                    disabled={deleteLoading[file._id]}
                    className="text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    {deleteLoading[file._id] ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      'Delete'
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}