'use client';

import React from 'react';
import CommentItem, { Comment } from './CommentItem'; // Import Comment interface from CommentItem

interface CommentListProps {
  comments: Comment[];
  currentUserId?: string | null;
  // Callbacks to be passed to CommentItem, eventually handled by CommentSection
  onEditRequest: (comment: Comment) => void;
  onDeleteRequest: (commentId: string) => void;
  onReplyRequest: (comment: Comment) => void; // To initiate a reply to a specific comment

  // To render the form for replying under a specific comment
  replyingToCommentId?: string | null;
  CommentReplyFormComponent?: React.ReactNode; // The actual form component to render

  isNested?: boolean; // To control indentation for replies
}

const CommentList: React.FC<CommentListProps> = ({
  comments,
  currentUserId,
  onEditRequest,
  onDeleteRequest,
  onReplyRequest,
  replyingToCommentId,
  CommentReplyFormComponent,
  isNested = false,
}) => {
  if (!comments || comments.length === 0) {
    return null; // Don't render anything if there are no comments
  }

  return (
    <div className={`${isNested ? 'pl-4 sm:pl-6 border-l border-gray-200 dark:border-gray-700' : ''}`}>
      {comments.map((comment) => (
        <div key={comment.id}>
          <CommentItem
            comment={comment}
            currentUserId={currentUserId}
            onEdit={onEditRequest}
            onDelete={onDeleteRequest}
            onReply={onReplyRequest}
            isReply={isNested}
          />
          {/* Render the reply form if this comment is being replied to */}
          {replyingToCommentId === comment.id && CommentReplyFormComponent}

          {/* Recursively render CommentList for replies */}
          {comment.replies && comment.replies.length > 0 && (
            <CommentList
              comments={comment.replies}
              currentUserId={currentUserId}
              onEditRequest={onEditRequest}
              onDeleteRequest={onDeleteRequest}
              onReplyRequest={onReplyRequest}
              replyingToCommentId={replyingToCommentId} // Pass down the ID of the comment being replied to
              CommentReplyFormComponent={CommentReplyFormComponent} // Pass down the form
              isNested={true}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default CommentList;
