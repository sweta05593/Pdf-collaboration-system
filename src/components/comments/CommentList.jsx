
// src/components/comments/CommentList.js
'use client';

import { useState } from 'react';
import CommentForm from './CommentForm';
import Button from '../ui/Button';

function CommentItem({ 
  comment, 
  pdfId, 
  onReplyAdded, 
  isAuthenticated, 
  isShared, 
  depth = 0 
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);

  const handleReplyAdded = (newReply) => {
    onReplyAdded({
      ...newReply,
      parentId: comment.id
    });
    setShowReplyForm(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l-2 border-gray-100 pl-4' : ''}`}>
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {comment.author.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-gray-900">{comment.author}</p>
              {comment.isGuest && (
                <span className="text-xs text-gray-500">Guest</span>
              )}
            </div>
          </div>
          <span className="text-sm text-gray-500">
            {formatDate(comment.createdAt)}
          </span>
        </div>

        <div className="mt-3">
          <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
        </div>

        <div className="mt-3 flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="text-xs"
          >
            Reply
          </Button>
          {comment.replies.length > 0 && (
            <span className="text-xs text-gray-500">
              {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </span>
          )}
        </div>

        {showReplyForm && (
          <div className="mt-4">
            <CommentForm
              pdfId={pdfId}
              parentId={comment.id}
              onCommentAdded={handleReplyAdded}
              isAuthenticated={isAuthenticated}
              isShared={isShared}
              onCancel={() => setShowReplyForm(false)}
              placeholder={`Reply to ${comment.author}...`}
            />
          </div>
        )}
      </div>

      {/* Render replies */}
      {comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              pdfId={pdfId}
              onReplyAdded={onReplyAdded}
              isAuthenticated={isAuthenticated}
              isShared={isShared}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentList({ 
  comments, 
  pdfId, 
  onReplyAdded, 
  isAuthenticated, 
  isShared 
}) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-8">
        <svg 
          className="mx-auto h-12 w-12 text-gray-400" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1} 
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
          />
        </svg>
        <p className="mt-2 text-gray-500">No comments yet</p>
        <p className="text-sm text-gray-400">Be the first to add a comment!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          pdfId={pdfId}
          onReplyAdded={onReplyAdded}
          isAuthenticated={isAuthenticated}
          isShared={isShared}
        />
      ))}
    </div>
  );
}