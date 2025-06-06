'use client';

import React, { useState, useEffect, useCallback } from 'react';
import CommentList from './CommentList';
import CommentForm from './CommentForm';
import { Comment } from './CommentItem'; // Assuming Comment interface is exported from CommentItem
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CardDescription } from '@/components/ui/card';


interface CommentSectionProps {
  postId: string;
  currentUserId?: string | null; // From session, can be null if user not logged in
}

interface PaginatedCommentsResponse {
  comments: Comment[];
  currentPage: number;
  totalPages: number;
  totalComments: number;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId, currentUserId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [replyingToComment, setReplyingToComment] = useState<Comment | null>(null);

  // Pagination state (optional, but good for future)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const commentsPerPage = 10; // Or get from API response

  const fetchComments = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/posts/${postId}/comments?page=${page}&limit=${commentsPerPage}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch comments.');
      }
      const data: PaginatedCommentsResponse = await response.json();
      // For simplicity, replacing comments. For "load more" pagination, you'd append.
      setComments(data.comments || []);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
      setComments([]); // Clear comments on error
    } finally {
      setIsLoading(false);
    }
  }, [postId, commentsPerPage]);

  useEffect(() => {
    if (postId) {
      fetchComments(1); // Fetch initial page
    }
  }, [postId, fetchComments]);

  const handleCommentSubmitted = (newOrUpdatedComment?: Comment) => {
    // Refetch all comments to see the new one in its correct place (or update local state smartly)
    fetchComments(currentPage);
    setEditingComment(null);
    setReplyingToComment(null);
  };

  const handleEditRequest = (comment: Comment) => {
    setEditingComment(comment);
    setReplyingToComment(null); // Can't edit and reply at the same time
    // Scroll to form or make it visible if it's not already
    document.getElementById(`comment-form-${comment.id}-edit`)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteRequest = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete comment.');
      }
      fetchComments(currentPage); // Refresh comments list
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred while deleting.');
    }
  };

  const handleReplyRequest = (comment: Comment) => {
    setReplyingToComment(comment);
    setEditingComment(null); // Can't edit and reply at the same time
     // Scroll to the reply form for this comment
    document.getElementById(`comment-reply-form-${comment.id}`)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelEditOrReply = () => {
    setEditingComment(null);
    setReplyingToComment(null);
  };

  const renderCommentFormForContext = (commentContext: Comment | null, isEdit: boolean) => {
    if (!currentUserId) return null; // Don't show form if user not logged in

    const formKey = isEdit ? `edit-${commentContext?.id}` : `reply-${commentContext?.id}`;

    return (
      <div id={isEdit ? `comment-form-${commentContext?.id}-edit` : `comment-reply-form-${commentContext?.id}`} className="my-2 ml-4 sm:ml-12">
        <CommentForm
          key={formKey} // Ensure form resets when context changes
          postId={postId}
          parentId={isEdit ? commentContext?.parentId : commentContext?.id}
          commentIdToEdit={isEdit ? commentContext?.id : null}
          initialContent={isEdit ? commentContext?.content : ''}
          onCommentSubmitted={handleCommentSubmitted}
          onCancelEdit={handleCancelEditOrReply}
          submitButtonText={isEdit ? "Save Changes" : "Post Reply"}
          placeholderText={isEdit ? "Edit your comment..." : `Replying to ${commentContext?.author?.name || 'comment'}...`}
        />
      </div>
    );
  };


  if (isLoading && comments.length === 0) { // Show initial loading state
    return <CardDescription>Loading comments...</CardDescription>;
  }

  if (error && comments.length === 0) { // Show error if initial fetch failed
    return (
      <Alert variant="destructive">
        <AlertTitle>Error Loading Comments</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button onClick={() => fetchComments(1)} variant="outline" className="mt-2">Try Again</Button>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Comments ({comments.length > 0 ? totalPages * commentsPerPage : 0})</h3>

      {/* Form for new top-level comment */}
      {currentUserId && !editingComment && !replyingToComment && (
        <div className="border-t pt-4 dark:border-gray-700">
           <h4 className="text-md font-medium mb-1 dark:text-gray-300">Leave a comment</h4>
          <CommentForm
            postId={postId}
            onCommentSubmitted={handleCommentSubmitted}
            submitButtonText="Post Comment"
            placeholderText="Share your thoughts..."
          />
        </div>
      )}
       {!currentUserId && (
         <CardDescription>Please <a href="/login" className="underline">log in</a> to post a comment or reply.</CardDescription>
       )}

      {/* Display general errors not tied to a specific form action */}
      {error && !isLoading && ( // Show non-initial load errors here
         <Alert variant="destructive" className="my-2">
            <AlertTitle>An error occurred</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
         </Alert>
      )}

      {/* Editing Form (shown at top level for simplicity, or could be inline) */}
      {editingComment && renderCommentFormForContext(editingComment, true)}

      {/* List of comments */}
      {comments.length > 0 ? (
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onEditRequest={handleEditRequest}
          onDeleteRequest={handleDeleteRequest}
          onReplyRequest={handleReplyRequest}
          // Pass down the ID of the comment being replied to and the form itself
          replyingToCommentId={replyingToComment?.id || null}
          CommentReplyFormComponent={replyingToComment ? renderCommentFormForContext(replyingToComment, false) : undefined}
        />
      ) : (
        !isLoading && <CardDescription>No comments yet. Be the first to comment!</CardDescription>
      )}

      {/* Pagination (Basic Example) */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? 'default' : 'outline'}
              onClick={() => fetchComments(page)}
              disabled={isLoading}
            >
              {page}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
