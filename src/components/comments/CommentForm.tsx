'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea'; // Assuming Textarea component
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CardDescription } from '@/components/ui/card'; // For small messages

interface CommentFormProps {
  postId: string; // Always needed to associate comment/reply with a post
  parentId?: string | null; // For replies, this is the ID of the parent comment
  commentIdToEdit?: string | null; // If editing, this is the ID of the comment being edited
  initialContent?: string; // For editing, pre-fill the textarea
  onCommentSubmitted: (newComment?: any) => void; // Callback after successful submission (passes new/updated comment)
  onCancelEdit?: () => void; // Callback to cancel editing mode
  submitButtonText?: string;
  placeholderText?: string;
}

const CommentForm: React.FC<CommentFormProps> = ({
  postId,
  parentId,
  commentIdToEdit,
  initialContent = '',
  onCommentSubmitted,
  onCancelEdit,
  submitButtonText = "Post Comment",
  placeholderText = "Write a comment..."
}) => {
  const [content, setContent] = useState<string>(initialContent);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Update content if initialContent changes (e.g., when switching to edit a different comment)
    setContent(initialContent);
  }, [initialContent]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (content.trim() === '') {
      setError('Comment cannot be empty.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      let response;
      let responseData;

      if (commentIdToEdit) {
        // Editing existing comment
        response = await fetch(`/api/comments/${commentIdToEdit}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });
        responseData = await response.json();
        if (!response.ok) {
          throw new Error(responseData.error || 'Failed to update comment.');
        }
      } else {
        // Creating new comment or reply
        response = await fetch(`/api/posts/${postId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
            parentId: parentId || null, // Ensure parentId is explicitly null if undefined
            // userId is handled by the backend using session
          }),
        });
        responseData = await response.json();
        if (!response.ok) {
          throw new Error(responseData.error || 'Failed to post comment.');
        }
      }

      onCommentSubmitted(responseData); // Pass the new/updated comment data back
      setContent(''); // Clear form after successful submission
      if (commentIdToEdit && onCancelEdit) { // If was editing, call cancel to exit edit mode
        onCancelEdit();
      }

    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 py-2">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholderText}
        rows={commentIdToEdit || parentId ? 2 : 3} // Smaller for replies/edits
        disabled={isLoading}
        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-700"
      />
      <div className="flex items-center justify-end space-x-2">
        { (commentIdToEdit || parentId ) && onCancelEdit && ( // Show cancel button only if it's an edit or reply form with a cancel action
            <Button type="button" variant="ghost" onClick={onCancelEdit} disabled={isLoading}>
                Cancel
            </Button>
        )}
        <Button type="submit" disabled={isLoading || content.trim() === ''}>
          {isLoading ? (commentIdToEdit ? 'Saving...' : 'Posting...') : submitButtonText}
        </Button>
      </div>
      {!commentIdToEdit && !parentId && <CardDescription className="text-xs">Your new comment will appear at the top.</CardDescription>}
    </form>
  );
};

export default CommentForm;
