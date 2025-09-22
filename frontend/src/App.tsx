/**
 * Main App Comconst App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    isConnected: false,
    currentUser: null,
    currentRoom: '',
    messages: [],
    onlineUsers: [],
    typingUsers: [],
    error: null,
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);anages application state and routing between Login and Chat screens
 */

import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import ChatRoom from './components/ChatRoom';
import socketService, { User, Message } from './services/socketService';

interface AppState {
  isConnected: boolean;
  currentUser: User | null;
  currentRoom: string;
  messages: Message[];
  onlineUsers: User[];
  typingUsers: User[];
  error: string | null;
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    isConnected: false,
    currentUser: null,
    currentRoom: '',
    messages: [],
    onlineUsers: [],
    typingUsers: [],
    error: null,
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Setup socket event listeners
    const setupSocketListeners = () => {
      // Handle new messages
      socketService.onMessage((message: Message) => {
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, message],
        }));
      });

      // Handle room history (when joining)
      socketService.onRoomHistory((messages: Message[]) => {
        setState(prev => ({
          ...prev,
          messages: messages,
        }));
      });

      // Handle online users updates
      socketService.onOnlineUsers((users: User[]) => {
        setState(prev => ({
          ...prev,
          onlineUsers: users,
        }));
      });

      // Handle typing indicators
      socketService.onTyping((data: { users: User[] }) => {
        setState(prev => ({
          ...prev,
          typingUsers: data.users,
        }));
      });

      // Handle room leave confirmation
      socketService.onLeftRoom(() => {
        setState(prev => ({
          ...prev,
          currentUser: null,
          currentRoom: '',
          messages: [],
          onlineUsers: [],
          typingUsers: [],
        }));
      });

      // Handle errors
      socketService.onError((error: { message: string }) => {
        setState(prev => ({
          ...prev,
          error: error.message,
        }));
        setIsLoading(false);
      });
    };

    setupSocketListeners();

    // Cleanup function
    return () => {
      socketService.removeAllListeners();
      socketService.disconnect();
    };
  }, []);

  /**
   * Handle user login and room joining
   */
  const handleLogin = async (username: string, room: string) => {
    try {
      setIsLoading(true);
      setState(prev => ({ ...prev, error: null }));

      // Connect to socket server if not already connected
      if (!socketService.isConnected()) {
        await socketService.connect();
      }

      // Create user object
      const user: User = {
        id: '', // Will be assigned by server
        username,
        room,
        socketId: socketService.getSocketId() || '',
      };

      // Join the room
      socketService.joinRoom(username, room);

      // Update state
      setState(prev => ({
        ...prev,
        isConnected: true,
        currentUser: user,
        currentRoom: room,
        messages: [],
        onlineUsers: [],
        typingUsers: [],
      }));

      setIsLoading(false);
    } catch (error) {
      console.error('Login failed:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to connect to chat server. Please try again.',
      }));
      setIsLoading(false);
    }
  };

  /**
   * Handle user logout and leaving room
   */
  const handleLogout = () => {
    try {
      if (socketService.isConnected()) {
        socketService.leaveRoom();
      }
      
      setState(prev => ({
        ...prev,
        isConnected: false,
        currentUser: null,
        currentRoom: '',
        messages: [],
        onlineUsers: [],
        typingUsers: [],
        error: null,
      }));
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  /**
   * Handle sending messages
   */
  const handleSendMessage = (message: string) => {
    try {
      socketService.sendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to send message. Please try again.',
      }));
    }
  };

  /**
   * Handle typing indicators
   */
  const handleTyping = (isTyping: boolean) => {
    try {
      socketService.setTyping(isTyping);
    } catch (error) {
      console.error('Failed to send typing indicator:', error);
    }
  };

  /**
   * Clear error messages
   */
  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  // Render login screen if not connected or no current user
  if (!state.isConnected || !state.currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h1 className="text-center text-3xl font-extrabold text-gray-900">
              Real-Time Chat
            </h1>
            <p className="mt-2 text-center text-sm text-gray-600">
              Join a chat room and start messaging instantly
            </p>
          </div>
          
          <Login 
            onLogin={handleLogin}
            isLoading={isLoading}
            error={state.error}
            onClearError={clearError}
          />
        </div>
      </div>
    );
  }

  // Render chat room if connected and user is set
  return (
    <div className="min-h-screen bg-gray-50">
      <ChatRoom
        currentUser={state.currentUser}
        currentRoom={state.currentRoom}
        messages={state.messages}
        onlineUsers={state.onlineUsers}
        typingUsers={state.typingUsers}
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        onLogout={handleLogout}
        error={state.error}
        onClearError={clearError}
      />
    </div>
  );
};

export default App;