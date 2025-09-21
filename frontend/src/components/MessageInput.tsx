/**
 * MessageInput Component
 * Handles message composition and sending with typing indicators
 */

import React, { useState, useRef, useEffect } from 'react';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ 
  onSendMessage, 
  onTyping, 
  disabled = false 
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [message]);

  /**
   * Handle typing indicator with debouncing
   */
  const handleTypingIndicator = (typing: boolean) => {
    if (disabled) return;

    if (typing && !isTyping) {
      setIsTyping(true);
      onTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    if (typing) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        onTyping(false);
      }, 2000); // Stop typing indicator after 2 seconds of inactivity
    } else {
      setIsTyping(false);
      onTyping(false);
    }
  };

  /**
   * Handle input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Trigger typing indicator if user is typing
    if (value.trim().length > 0) {
      handleTypingIndicator(true);
    } else {
      handleTypingIndicator(false);
    }
  };

  /**
   * Handle message submission
   */
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendMessage();
  };

  /**
   * Send message function
   */
  const sendMessage = () => {
    if (disabled) return;
    
    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) return;

    // Send the message
    onSendMessage(trimmedMessage);
    
    // Clear input and stop typing indicator
    setMessage('');
    handleTypingIndicator(false);
    
    // Focus back on input
    textareaRef.current?.focus();
  };

  /**
   * Handle key press events
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (disabled) return;

    // Send message on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /**
   * Clean up timeout on unmount
   */
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        {/* Message Input */}
        <div className="flex-1">
          <label htmlFor="message" className="sr-only">
            Your message
          </label>
          <textarea
            ref={textareaRef}
            id="message"
            name="message"
            rows={1}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            disabled={disabled}
            placeholder={disabled ? "Unable to send messages..." : "Type your message... (Enter to send, Shift+Enter for new line)"}
            className={`block w-full resize-none border-0 py-2 px-3 text-gray-900 placeholder-gray-500 bg-gray-50 rounded-lg focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
        </div>

        {/* Send Button */}
        <div className="flex-shrink-0">
          <button
            type="submit"
            disabled={disabled || message.trim().length === 0}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span className="sr-only">Send message</span>
          </button>
        </div>
      </form>

      {/* Character counter for long messages */}
      {message.length > 200 && (
        <div className="mt-2 text-right">
          <span className={`text-xs ${message.length > 500 ? 'text-red-500' : 'text-gray-500'}`}>
            {message.length}/1000
          </span>
        </div>
      )}

      {/* Helpful hints */}
      <div className="mt-2 text-xs text-gray-500">
        <span>Press Enter to send • Shift+Enter for new line</span>
      </div>
    </div>
  );
};

export default MessageInput;