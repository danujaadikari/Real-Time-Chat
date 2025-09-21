/**
 * ChatRoom Component
 * Main chat interface with message list, input, online users, and typing indicators
 */

import React from 'react';
import type { User, Message } from '../services/socketService';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import OnlineUsers from './OnlineUsers';
import TypingIndicator from './TypingIndicator';

interface ChatRoomProps {
  currentUser: User;
  currentRoom: string;
  messages: Message[];
  onlineUsers: User[];
  typingUsers: User[];
  onSendMessage: (message: string) => void;
  onTyping: (isTyping: boolean) => void;
  onLogout: () => void;
  error: string | null;
  onClearError: () => void;
}

const ChatRoom: React.FC<ChatRoomProps> = ({
  currentUser,
  currentRoom,
  messages,
  onlineUsers,
  typingUsers,
  onSendMessage,
  onTyping,
  onLogout,
  error,
  onClearError,
}) => {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                #{currentRoom}
              </h1>
              <p className="text-sm text-gray-500">
                Welcome, {currentUser.username}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Online users count */}
            <div className="hidden sm:flex items-center text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              {onlineUsers.length} online
            </div>
            
            {/* Leave room button */}
            <button
              onClick={onLogout}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Leave Room
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm">{error}</p>
              </div>
              <button
                onClick={onClearError}
                className="text-red-500 hover:text-red-700 focus:outline-none"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Chat Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Messages */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages List */}
          <div className="flex-1 overflow-hidden">
            <MessageList 
              messages={messages} 
              currentUser={currentUser}
            />
          </div>

          {/* Typing Indicator */}
          <div className="px-4 py-2 border-t border-gray-200 bg-white">
            <TypingIndicator typingUsers={typingUsers} />
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200 bg-white">
            <MessageInput
              onSendMessage={onSendMessage}
              onTyping={onTyping}
              disabled={!!error}
            />
          </div>
        </div>

        {/* Online Users Sidebar - Hidden on mobile */}
        <div className="hidden lg:block w-64 border-l border-gray-200 bg-white">
          <OnlineUsers 
            users={onlineUsers} 
            currentUser={currentUser}
          />
        </div>
      </div>

      {/* Mobile Online Users Modal Toggle */}
      <div className="lg:hidden fixed bottom-20 right-4">
        <button className="bg-primary-600 text-white p-3 rounded-full shadow-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <span className="sr-only">Show online users</span>
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {onlineUsers.length}
          </span>
        </button>
      </div>
    </div>
  );
};

export default ChatRoom;