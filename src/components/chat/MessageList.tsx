'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import MessageItem from './MessageItem';
import { ChatMessageData } from '@/app/app/chat/page'; // Shared types
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react'; // For loading spinner

interface MessageListProps {
  selectedChannelId: string | null;
  currentUserId: string | null;
}

interface ApiMessagesResponse {
  messages: ChatMessageData[];
  nextCursor?: string | null;
}

const MESSAGES_PER_PAGE = 20; // Number of messages to fetch per page

const MessageList: React.FC<MessageListProps> = ({ selectedChannelId, currentUserId }) => {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const listRef = useRef<HTMLDivElement>(null);
  const prevChannelIdRef = useRef<string | null>(null);


  const fetchMessages = useCallback(async (channelId: string, cursor?: string | null) => {
    if (!channelId) return;
    if (cursor) setIsLoadingMore(true); else setIsLoading(true);
    setError(null);

    try {
      const url = `/api/chat/channels/${channelId}/messages?limit=${MESSAGES_PER_PAGE}${cursor ? `&cursor=${cursor}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch messages.');
      }
      const data: ApiMessagesResponse = await response.json();

      setMessages(prevMessages => cursor ? [...data.messages, ...prevMessages] : data.messages);
      setNextCursor(data.nextCursor || null);
      setHasMore(!!data.nextCursor);

      if (!cursor && listRef.current) { // Scroll to bottom on initial load of new channel
        // Timeout to allow DOM to update
        setTimeout(() => listRef.current?.scrollTo(0, listRef.current.scrollHeight), 0);
      }

    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  // Initial fetch or when channel changes
  useEffect(() => {
    if (selectedChannelId) {
        if (selectedChannelId !== prevChannelIdRef.current) {
            setMessages([]); // Clear messages from previous channel
            setNextCursor(null);
            setHasMore(true);
            fetchMessages(selectedChannelId);
            prevChannelIdRef.current = selectedChannelId;

            // Mark messages as read when opening a channel
            const markAsRead = async () => {
                try {
                    await fetch(`/api/chat/channels/${selectedChannelId}/read`, { method: 'POST' });
                    // Optionally, update unread counts in ChannelList via a callback or event bus
                } catch (readError) {
                    console.error("Failed to mark messages as read:", readError);
                }
            };
            markAsRead();
        }
    } else {
        setMessages([]); // Clear messages if no channel selected
        prevChannelIdRef.current = null;
    }
  }, [selectedChannelId, fetchMessages]);

  const loadMoreMessages = () => {
    if (selectedChannelId && nextCursor && !isLoadingMore && hasMore) {
      fetchMessages(selectedChannelId, nextCursor);
    }
  };

  // Function to be called when a new message is sent/received (for optimistic updates or refetch)
  // This would be expanded with WebSocket logic.
  const onNewMessage = useCallback((newMessage: ChatMessageData) => {
    if (newMessage.channelId === selectedChannelId) {
      setMessages(prev => [...prev, newMessage]); // Add new message to the end
      setTimeout(() => listRef.current?.scrollTo(0, listRef.current.scrollHeight), 0);

      // Also mark this new message as read since user is in channel
       const markAsRead = async () => {
          try {
              await fetch(`/api/chat/channels/${selectedChannelId}/read`, { method: 'POST' });
          } catch (readError) {
              console.error("Failed to mark new message as read:", readError);
          }
      };
      markAsRead();
    }
  }, [selectedChannelId]);

  // Expose onNewMessage to parent if needed (e.g. via a ref or context)
  // For now, MessageInput will call a prop that eventually calls this or refetches.


  if (isLoading && messages.length === 0) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <p className="ml-2 text-gray-500">Loading messages...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-grow flex items-center justify-center p-4">
        <Alert variant="destructive">
          <AlertDescription>{error} <Button variant="link" size="sm" onClick={() => selectedChannelId && fetchMessages(selectedChannelId)}>Try again</Button></AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!selectedChannelId) {
      // This state should be handled by the parent, but as a fallback:
    return <div className="flex-grow flex items-center justify-center"><p>Select a channel to view messages.</p></div>;
  }

  if (messages.length === 0 && !isLoading) {
     return (
        <div className="flex-grow flex flex-col items-center justify-center p-4 text-center">
            <svg className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">No messages yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Be the first to send a message in this channel!</p>
        </div>
    );
  }


  return (
    <div ref={listRef} className="flex-grow overflow-y-auto p-4 space-y-1 bg-gray-50 dark:bg-gray-900">
      {hasMore && (
        <div className="text-center mb-4">
          <Button onClick={loadMoreMessages} variant="outline" size="sm" disabled={isLoadingMore}>
            {isLoadingMore ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...</> : 'Load Older Messages'}
          </Button>
        </div>
      )}
      {messages.map((msg, index) => {
        // Basic logic to show sender info only for first of consecutive messages
        const prevMessage = messages[index - 1];
        const showSender = !prevMessage || prevMessage.senderId !== msg.senderId ||
                           (new Date(msg.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() > 5 * 60 * 1000); // Show if >5m gap

        return (
          <MessageItem
            key={msg.id}
            message={msg}
            isOwnMessage={msg.senderId === currentUserId}
            showSenderInfo={showSender}
          />
        );
      })}
    </div>
  );
};

// This is a trick to allow parent component (ChatPage) to call onNewMessage
// A better way would be using React Context or a state management library for cross-component communication.
// Or, MessageInput's onMessageSent can trigger a refetch in ChatPage, which MessageList picks up.
// For now, we rely on MessageInput triggering a refetch via ChatPage.
export type MessageListHandle = {
  onNewMessage: (newMessage: ChatMessageData) => void;
};


export default MessageList;
