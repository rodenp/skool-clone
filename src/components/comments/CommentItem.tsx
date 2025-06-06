'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Assuming Avatar components
import { formatDistanceToNow } from 'date-fns'; // For relative timestamps

// Forward declaration for Comment and CommentList as they might be co-dependent in type definitions
// This is a common pattern for recursive components.
export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  postId: string;
  parentId?: string | null;
  author: { // Assuming author is included; adjust based on actual API response
    id: string;
    name?: string | null;
    username?: string | null;
    image?: string | null;
  };
  replies?: Comment[]; // Direct replies
  _count?: { // If API provides reply counts
    replies: number;
  };
}

interface CommentItemProps {
  comment: Comment;
  currentUserId?: string | null; // Can be null if user not logged in
  onEdit: (comment: Comment) => void;
  onDelete: (commentId: string) => void;
  onReply: (comment: Comment) => void;
  // For rendering nested replies, CommentList will be used by CommentSection typically
  // but if CommentItem needs to render its own replies directly:
  // renderReplies?: (replies: Comment[]) => React.ReactNode;
  isReply?: boolean; // To style nested replies differently
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUserId,
  onEdit,
  onDelete,
  onReply,
  isReply = false,
}) => {
  const canModify = currentUserId === comment.author?.id;
  const authorName = comment.author?.name || comment.author?.username || 'Anonymous';
  const avatarFallback = (authorName.charAt(0) || 'A').toUpperCase();
  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });

  return (
    <div className={`flex space-x-3 ${isReply ? 'ml-4 sm:ml-8 my-2' : 'my-4'}`}>
      <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
        <AvatarImage src={comment.author?.image || undefined} alt={authorName} />
        <AvatarFallback>{avatarFallback}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{authorName}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{timeAgo}</p>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{comment.content}</p>
        <div className="flex items-center space-x-2 pt-1">
          <Button variant="ghost" size="xs" onClick={() => onReply(comment)} className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            Reply
          </Button>
          {canModify && (
            <>
              <Button variant="ghost" size="xs" onClick={() => onEdit(comment)} className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                Edit
              </Button>
              <Button variant="ghost" size="xs" onClick={() => onDelete(comment.id)} className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400">
                Delete
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
