'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { PlusCircle, Users, Search } from 'lucide-react'; // Icons
import { Input } from '@/components/ui/input';
import { ChatChannelData } from '@/app/app/chat/page'; // Assuming types are in page.tsx or a shared types file
import { formatDistanceToNowStrict } from 'date-fns';


interface ChannelListProps {
  currentUserId: string | null;
  onSelectChannel: (channelId: string) => void;
  // onInitiateNewChat: () => void; // Future: For opening a modal or view to start new chat
}

const ChannelList: React.FC<ChannelListProps> = ({ currentUserId, onSelectChannel }) => {
  const [channels, setChannels] = useState<ChatChannelData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(''); // For future search functionality

  const fetchChannels = useCallback(async () => {
    if (!currentUserId) {
        setIsLoading(false);
        return;
    };
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/chat/channels');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch channels.');
      }
      const data: ChatChannelData[] = await response.json();
      setChannels(data);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchChannels();
    // TODO: Implement real-time updates for new messages or channel changes (e.g., via WebSockets)
    // For example, listen to 'new-channel' or 'channel-updated' events.
  }, [fetchChannels]);

  const getUnreadCount = (channel: ChatChannelData): number => {
    // Placeholder - Actual unread count logic needs:
    // 1. `channel.lastReadAt` for the current user (needs to be added to ChatChannelMember data returned in channel).
    // 2. Comparison with `channel.lastMessage.createdAt` or individual message timestamps.
    // This is a simplified example.
    if (channel.lastMessage && channel.lastMessageAt) {
        // Assume lastReadAt is available for current user on the channel or member object
        // const memberInfo = channel.members.find(m => m.userId === currentUserId);
        // if (memberInfo?.lastReadAt && new Date(channel.lastMessageAt) > new Date(memberInfo.lastReadAt)) {
        //   return 1; // Simplified: indicates at least one new message
        // }
    }
    return 0; // Placeholder
  };

  const filteredChannels = channels.filter(channel =>
    channel.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (channel.isDirectMessage && channel.members.find(m => m.userId !== currentUserId)?.user.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );


  if (isLoading) {
    return (
      <div className="p-4">
        <CardDescription>Loading channels...</CardDescription>
        {/* Skeleton loaders can be added here */}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertDescription>{error} <Button variant="link" size="sm" onClick={fetchChannels}>Try again</Button></AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <CardHeader className="py-3 px-4 border-b dark:border-gray-700">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Messages</CardTitle>
          <Button variant="ghost" size="icon" /* onClick={onInitiateNewChat} */ title="New Chat (Not Implemented)">
            <PlusCircle className="h-5 w-5" />
          </Button>
        </div>
        <div className="mt-2 relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search chats..."
            className="pl-8 bg-gray-100 dark:bg-gray-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto p-0">
        {filteredChannels.length === 0 ? (
          <div className="p-4 text-center">
            <Users className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
            <CardDescription>No channels found.</CardDescription>
            <CardDescription className="text-xs">Start a new conversation.</CardDescription>
          </div>
        ) : (
          <ul className="divide-y dark:divide-gray-700">
            {filteredChannels.map((channel) => {
              const unreadCount = getUnreadCount(channel);
              const otherUser = channel.isDirectMessage ? channel.members.find(m => m.userId !== currentUserId)?.user : null;
              const displayName = channel.isDirectMessage ? (otherUser?.name || otherUser?.username || 'Chat User') : channel.name;
              const displayImage = channel.isDirectMessage ? otherUser?.image : channel.image; // Group chats might have images too

              return (
                <li
                  key={channel.id}
                  onClick={() => onSelectChannel(channel.id)}
                  className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex items-center space-x-3 transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={displayImage || undefined} alt={displayName || 'Chat Avatar'} />
                    <AvatarFallback>{(displayName || 'C').charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-center">
                      <h3 className={`text-sm font-medium truncate ${unreadCount > 0 ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                        {displayName}
                      </h3>
                      {channel.lastMessageAt && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                          {formatDistanceToNowStrict(new Date(channel.lastMessageAt), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className={`text-xs truncate ${unreadCount > 0 ? 'text-gray-700 dark:text-gray-200 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
                        {channel.lastMessage?.content || (channel.lastMessage?.attachmentType ? `Sent an ${channel.lastMessage.attachmentType}` : 'No messages yet')}
                      </p>
                      {unreadCount > 0 && (
                        <span className="ml-2 bg-blue-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </div>
  );
};

export default ChannelList;
