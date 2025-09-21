/**
 * TypingIndicator Component
 * Shows who is currently typing in the chat
 */

import React from 'react';
import type { User } from '../services/socketService';

interface TypingIndicatorProps {
  typingUsers: User[];
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers }) => {
  if (typingUsers.length === 0) {
    return <div className="h-6"></div>; // Maintain consistent height
  }

  /**
   * Format typing message based on number of users
   */
  const formatTypingMessage = (): string => {
    const count = typingUsers.length;
    
    if (count === 1) {
      return `${typingUsers[0].username} is typing...`;
    } else if (count === 2) {
      return `${typingUsers[0].username} and ${typingUsers[1].username} are typing...`;
    } else if (count === 3) {
      return `${typingUsers[0].username}, ${typingUsers[1].username}, and ${typingUsers[2].username} are typing...`;
    } else {
      return `${typingUsers[0].username}, ${typingUsers[1].username}, and ${count - 2} others are typing...`;
    }
  };

  return (
    <div className="flex items-center space-x-2 h-6">
      {/* Typing animation dots */}
      <div className="flex space-x-1">
        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
      
      {/* Typing message */}
      <span className="text-sm text-gray-500 italic">
        {formatTypingMessage()}
      </span>
    </div>
  );
};

export default TypingIndicator;