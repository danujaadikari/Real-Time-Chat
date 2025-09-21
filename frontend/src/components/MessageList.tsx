/**
 * MessageList Component
 * Displays chat messages with auto-scroll and message grouping
 */

import React, { useEffect, useRef } from 'react';
import type { Message, User } from '../services/socketService';

interface MessageListProps {
  messages: Message[];
  currentUser: User;
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUser }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Format timestamp for display
   */
  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true 
    });
  };

  /**
   * Check if two messages should be grouped together
   */
  const shouldGroupMessage = (currentMsg: Message, previousMsg: Message | undefined): boolean => {
    if (!previousMsg) return false;
    
    // Don't group system messages
    if (currentMsg.type === 'system' || previousMsg.type === 'system') return false;
    
    // Group if same user and within 5 minutes
    const timeDiff = new Date(currentMsg.timestamp).getTime() - new Date(previousMsg.timestamp).getTime();
    const fiveMinutes = 5 * 60 * 1000;
    
    return currentMsg.username === previousMsg.username && timeDiff < fiveMinutes;
  };

  /**
   * Render individual message
   */
  const renderMessage = (message: Message, index: number) => {
    const isCurrentUser = message.username === currentUser.username && message.type === 'user';
    const isSystemMessage = message.type === 'system';
    const previousMessage = index > 0 ? messages[index - 1] : undefined;
    const isGrouped = shouldGroupMessage(message, previousMessage);

    if (isSystemMessage) {
      return (
        <div key={message.id} className="flex justify-center my-2">
          <div className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">
            {message.message}
          </div>
        </div>
      );
    }

    return (
      <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-1`}>
        <div className={`max-w-xs lg:max-w-md ${isCurrentUser ? 'order-2' : 'order-1'}`}>
          {/* Message header (username + time) - only show if not grouped */}
          {!isGrouped && (
            <div className={`flex items-center space-x-2 mb-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
              <span className="text-sm font-medium text-gray-900">
                {message.username}
              </span>
              <span className="text-xs text-gray-500">
                {formatTime(message.timestamp)}
              </span>
            </div>
          )}

          {/* Message bubble */}
          <div
            className={`px-4 py-2 rounded-lg shadow-sm ${
              isCurrentUser
                ? 'bg-primary-600 text-white rounded-br-sm'
                : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
            } ${isGrouped ? 'mt-1' : ''}`}
          >
            <p className="text-sm break-words whitespace-pre-wrap">
              {message.message}
            </p>
            
            {/* Show time in grouped messages on hover */}
            {isGrouped && (
              <div className="opacity-0 hover:opacity-100 transition-opacity duration-200">
                <span className={`text-xs ${isCurrentUser ? 'text-primary-200' : 'text-gray-400'}`}>
                  {formatTime(message.timestamp)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No messages yet
          </h3>
          <p className="text-gray-500">
            Be the first to send a message in this room!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-1">
      {messages.map((message, index) => renderMessage(message, index))}
      
      {/* Invisible element to scroll to */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;