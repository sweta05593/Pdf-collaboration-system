// src/components/comments/CommentSection.js
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import CommentForm from './CommentForm';
import CommentList from './CommentList';
import LoadingSpinner from '../ui/loadingSpinner';


export default function CommentSection({ pdfId, isShared = false }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { data: session } = useSession();

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/files/${pdfId}/comments`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch comments');
      }

      setComments(data.comments);
      setError('');
    } catch (error) {
      console.error('Fetch comments error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pdfId) {
      fetchComments();
    }
  }, [pdfId]);

  const handleCommentAdded = (newComment) => {
    if (newComment.parentId) {
      // Handle reply - find parent comment and add to its replies
      setComments(prevComments => {
        const updateCommentsRecursively = (comments) => {
          return comments.map(comment => {
            if (comment.id === newComment.parentId) {
              return {
                ...comment,
                replies: [...comment.replies, newComment]
              };
            }
            if (comment.replies.length > 0) {
              return {
                ...comment,
                replies: updateCommentsRecursively(comment.replies)
              };
            }
            return comment;
          });
        };
        return updateCommentsRecursively(prevComments);
      });
    } else {
      // Handle new top-level comment
      setComments(prev => [newComment, ...prev]);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Comments ({comments.length})
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <CommentForm
            pdfId={pdfId}
            onCommentAdded={handleCommentAdded}
            isAuthenticated={!!session}
            isShared={isShared}
          />

          <CommentList
            comments={comments}
            pdfId={pdfId}
            onReplyAdded={handleCommentAdded}
            isAuthenticated={!!session}
            isShared={isShared}
          />
        </div>
      </div>
    </div>
  );
}


