'use client';

import React, { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizonal, Paperclip, Smile } from 'lucide-react'; // Icons
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MessageInputProps {
  selectedChannelId: string | null;
  onMessageSent: (sentMessage: any) => void; // Callback after successful submission, passes the new message
}

const MessageInput: React.FC<MessageInputProps> = ({ selectedChannelId, onMessageSent }) => {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // Future: state for attachments: const [attachment, setAttachment] = useState<File | null>(null);

  const handleSubmit = async (event?: FormEvent) => { // Allow calling without event for Enter key
    if (event) event.preventDefault();
    if (content.trim() === '' /* && !attachment */) { // Check for attachment if implementing
      // setError('Message cannot be empty.'); // Or just don't send
      return;
    }
    if (!selectedChannelId) {
      setError('No channel selected to send message to.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // TODO: If implementing file attachments, handle FormData and upload here.
      // For now, just sending text content.
      const messageData = {
        content,
        // attachmentUrl: null, // From upload response
        // attachmentType: null, // From file type
      };

      const response = await fetch(`/api/chat/channels/${selectedChannelId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to send message.');
      }

      onMessageSent(responseData); // Pass the successfully sent message back
      setContent(''); // Clear input after successful submission
      // setAttachment(null); // Clear attachment

    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
      // Don't clear content on error, so user can retry
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent newline
      handleSubmit();
    }
  };


  if (!selectedChannelId) {
    return (
        <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-center">
            <p className="text-sm text-gray-400 dark:text-gray-500">Select a channel to start messaging.</p>
        </div>
    );
  }

  return (
    <div className="p-3 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
      {error && (
        <Alert variant="destructive" className="mb-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        {/* Future: Attachment Button
        <Button type="button" variant="ghost" size="icon" className="flex-shrink-0">
          <Paperclip className="h-5 w-5" />
        </Button>
        */}
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-grow resize-none p-2.5 border rounded-lg focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 max-h-24 min-h-[48px]"
          disabled={isLoading}
        />
        {/* Future: Emoji Button
        <Button type="button" variant="ghost" size="icon" className="flex-shrink-0">
          <Smile className="h-5 w-5" />
        </Button>
        */}
        <Button type="submit" size="icon" disabled={isLoading || content.trim() === ''} className="flex-shrink-0 h-11 w-11">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendHorizonal className="h-5 w-5" />}
        </Button>
      </form>
    </div>
  );
};

export default MessageInput;
