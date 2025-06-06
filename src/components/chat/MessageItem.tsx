'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatMessageData } from '@/app/app/chat/page'; // Assuming types are in page.tsx or a shared types file
import { format } from 'date-fns'; // For precise timestamps
import { Download, Image as ImageIcon, FileText } from 'lucide-react'; // Icons for attachments

interface MessageItemProps {
  message: ChatMessageData;
  isOwnMessage: boolean;
  showSenderInfo?: boolean; // To show avatar/name for consecutive messages from same sender or not
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isOwnMessage, showSenderInfo = true }) => {
  const senderName = message.sender?.name || message.sender?.username || 'User';
  const avatarFallback = (senderName.charAt(0) || 'U').toUpperCase();

  const renderAttachment = () => {
    if (!message.attachmentUrl) return null;

    // Basic preview for images
    if (message.attachmentType === 'image') {
      return (
        <a href={message.attachmentUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block">
          <img
            src={message.attachmentUrl}
            alt="Attachment"
            className="max-w-xs max-h-64 rounded-lg object-cover border dark:border-gray-700"
          />
        </a>
      );
    }

    // Link for other file types
    const Icon = message.attachmentType?.startsWith('image/') ? ImageIcon : FileText;

    return (
      <a
        href={message.attachmentUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 flex items-center space-x-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        <Icon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
        <span className="text-sm text-blue-600 dark:text-blue-400 truncate">
          {message.attachmentUrl.split('/').pop() || 'View Attachment'}
        </span>
        <Download className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </a>
    );
  };


  return (
    <div className={`flex mb-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-end gap-2 max-w-[70%] sm:max-w-[60%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isOwnMessage && showSenderInfo && (
          <Avatar className="h-7 w-7 self-start"> {/* Smaller avatar for messages */}
            <AvatarImage src={message.sender?.image || undefined} alt={senderName} />
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>
        )}
         {!isOwnMessage && !showSenderInfo && ( /* Placeholder for alignment if avatar hidden */
            <div className="w-7"></div>
        )}

        <div
          className={`p-2.5 rounded-xl shadow-sm ${
            isOwnMessage
              ? 'bg-blue-500 text-white rounded-br-none'
              : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'
          }`}
        >
          {!isOwnMessage && showSenderInfo && (
            <p className="text-xs font-semibold mb-0.5">{senderName}</p>
          )}
          {message.content && <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>}
          {renderAttachment()}
          <p className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100 opacity-80' : 'text-gray-400 dark:text-gray-500'} text-right`}>
            {format(new Date(message.createdAt), 'p')} {/* e.g., 12:30 PM */}
          </p>
        </div>
         {isOwnMessage && !showSenderInfo && ( /* Placeholder for alignment if avatar hidden */
            <div className="w-0"></div> // Own messages don't show avatar, so no need for large placeholder
        )}
      </div>
    </div>
  );
};

export default MessageItem;
