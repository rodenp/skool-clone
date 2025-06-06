'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getCurrentUser } from '@/lib/session'; // Placeholder

import ChannelList from '@/components/chat/ChannelList';
import MessageList, { MessageListHandle } from '@/components/chat/MessageList'; // Import handle type
import MessageInput from '@/components/chat/MessageInput';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Define types (can be moved to a shared types file later)
export interface ChatUser {
  id: string;
  name?: string | null;
  username?: string | null;
  image?: string | null;
}

export interface ChatMessageData {
  id: string;
  content: string;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  createdAt: string; // ISO string
  senderId: string;
  sender: ChatUser;
  channelId: string;
}

export interface ChatChannelData {
  id: string;
  name?: string | null; // Will be overridden for DMs by ChannelList based on other user
  image?: string | null; // For DMs, based on other user
  isDirectMessage: boolean;
  members: { userId: string; user: ChatUser }[];
  lastMessage?: ChatMessageData | null;
  lastMessageAt?: string | null; // ISO string
  unreadCount?: number; // To be calculated client-side or added by API later
  _count?: { members: number };
}


export default function ChatPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<ChatChannelData | null>(null); // Store full channel object
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const messageListRef = useRef<MessageListHandle>(null); // For calling methods on MessageList child

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoadingUser(true);
      try {
        const user = await getCurrentUser(); // Replace with your actual auth logic
        setCurrentUserId(user?.id || null);
      } catch (e) {
        console.error("Failed to fetch user", e);
        setCurrentUserId(null);
      } finally {
        setIsLoadingUser(false);
      }
    };
    fetchUser();
  }, []);

  const handleSelectChannel = (channel: ChatChannelData) => { // Changed to accept full channel object
    setSelectedChannel(channel);
  };

  const handleMessageSent = (sentMessage: ChatMessageData) => {
    // Optimistically update UI or trigger refetch in MessageList
    // If MessageList exposes a method to add a message, call it.
    // For now, MessageList will refetch on its own if a prop like `lastUpdated` changes,
    // or we can use the onNewMessage exposed by MessageList (though not fully implemented via ref yet).
    console.log(`Message sent in channel ${selectedChannel?.id}. Triggering refresh (conceptual).`);
    if (messageListRef.current && messageListRef.current.onNewMessage) {
      messageListRef.current.onNewMessage(sentMessage);
    }
    // Alternatively, could force a refetch in MessageList by changing a key or prop.
  };

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading user session...</p>
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Alert variant="destructive">
          <AlertDescription>Please log in to access chat.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex h-screen antialiased text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-900">
      <div className="flex flex-row h-full w-full overflow-x-hidden">
        {/* Channel List Column */}
        <div className="flex flex-col py-0 pr-0 pl-0 w-64 sm:w-72 md:w-80 lg:w-96 bg-white dark:bg-gray-800 flex-shrink-0 border-r dark:border-gray-700">
          <ChannelList onSelectChannel={handleSelectChannel} currentUserId={currentUserId} />
        </div>

        {/* Message Area Column */}
        <div className="flex flex-col flex-auto h-full">
          {selectedChannel ? (
            <>
              {/* Header for selected channel */}
              <div className="p-3 border-b dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center space-x-3">
                 {/* Avatar for DM/Group */}
                <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedChannel.image || undefined} alt={selectedChannel.name || 'Channel'} />
                    <AvatarFallback>{(selectedChannel.name || 'C').charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <h2 className="text-md font-semibold">{selectedChannel.name || `Chat`}</h2>
                    {selectedChannel.isDirectMessage && selectedChannel.members.length === 2 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                           {selectedChannel._count?.members ? `${selectedChannel._count.members} members` : 'Direct Message'}
                        </p>
                    )}
                     {!selectedChannel.isDirectMessage && selectedChannel._count?.members && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                           {selectedChannel._count.members} members
                        </p>
                    )}
                </div>
              </div>
              <MessageList
                // @ts-ignore // Temporarily ignore if MessageListHandle type is not perfectly matching ref
                ref={messageListRef}
                selectedChannelId={selectedChannel.id}
                currentUserId={currentUserId}
              />
              <MessageInput selectedChannelId={selectedChannel.id} onMessageSent={handleMessageSent} />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <div className="max-w-md">
                <svg className="w-24 h-24 mx-auto text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <h2 className="mt-2 text-xl font-medium text-gray-700 dark:text-gray-300">Select a channel</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Choose one of your existing conversations or start a new one to begin chatting.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
