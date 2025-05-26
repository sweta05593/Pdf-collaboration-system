// src/components/comments/CommentForm.js
'use client';

import { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import LoadingSpinner from '../ui/loadingSpinner';

export default function CommentForm({ 
  pdfId, 
  onCommentAdded, 
  isAuthenticated, 
  isShared = false,
  parentId = null,
  onCancel = null,
  placeholder = "Add a comment..."
}) {
  const [content, setContent] = useState('');
  const [guestName, setGuestName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Comment content is required');
      return;
    }

    if (!isAuthenticated && !guestName.trim()) {
      setError('Name is required for guest comments');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/files/${pdfId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: content.trim(),
          guestName: isAuthenticated ? null : guestName.trim(),
          parentId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add comment');
      }

      onCommentAdded(data.comment);
      setContent('');
      setGuestName('');
      
      if (onCancel) {
        onCancel();
      }

    } catch (error) {
      console.error('Comment submission error:', error);
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}

      {!isAuthenticated && (
        <Input
          type="text"
          placeholder="Your name"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          required
        />
      )}

      <div>
        <textarea
          placeholder={placeholder}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting || !content.trim()}
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <LoadingSpinner size="sm" color="white" />
              <span className="ml-2">Posting...</span>
            </div>
          ) : (
            parentId ? 'Reply' : 'Comment'
          )}
        </Button>
      </div>
    </form>
  );
}