/**
 * Socket Service
 * Manages Socket.io client connection and event handling
 */

import { io, Socket } from 'socket.io-client';

export interface User {
  id: string;
  username: string;
  room: string;
  socketId: string;
}

export interface Message {
  id: string;
  username: string;
  message: string;
  timestamp: string;
  type: 'user' | 'system';
}

export interface SocketEvents {
  // Outgoing events
  joinRoom: (data: { username: string; room: string }) => void;
  leaveRoom: () => void;
  sendMessage: (data: { message: string }) => void;
  typing: (data: { isTyping: boolean }) => void;

  // Incoming events
  message: (message: Message) => void;
  roomHistory: (messages: Message[]) => void;
  onlineUsers: (users: User[]) => void;
  typing: (data: { users: User[] }) => void;
  leftRoom: () => void;
  error: (error: { message: string }) => void;
}

class SocketService {
  private socket: Socket | null = null;
  private serverUrl: string;

  constructor(serverUrl: string = 'http://localhost:3001') {
    this.serverUrl = serverUrl;
  }

  /**
   * Connect to the Socket.io server
   */
  connect(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.serverUrl, {
          transports: ['websocket'],
          autoConnect: true,
        });

        this.socket.on('connect', () => {
          console.log('Connected to server:', this.socket?.id);
          resolve(this.socket!);
        });

        this.socket.on('connect_error', (error) => {
          console.error('Connection error:', error);
          reject(error);
        });

        this.socket.on('disconnect', (reason) => {
          console.log('Disconnected from server:', reason);
        });

      } catch (error) {
        console.error('Socket connection failed:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Join a chat room
   */
  joinRoom(username: string, room: string): void {
    if (this.socket) {
      this.socket.emit('joinRoom', { username, room });
    }
  }

  /**
   * Leave the current room
   */
  leaveRoom(): void {
    if (this.socket) {
      this.socket.emit('leaveRoom');
    }
  }

  /**
   * Send a message to the current room
   */
  sendMessage(message: string): void {
    if (this.socket && message.trim()) {
      this.socket.emit('sendMessage', { message: message.trim() });
    }
  }

  /**
   * Send typing indicator
   */
  setTyping(isTyping: boolean): void {
    if (this.socket) {
      this.socket.emit('typing', { isTyping });
    }
  }

  /**
   * Listen for messages
   */
  onMessage(callback: (message: Message) => void): void {
    if (this.socket) {
      this.socket.on('message', callback);
    }
  }

  /**
   * Listen for room history
   */
  onRoomHistory(callback: (messages: Message[]) => void): void {
    if (this.socket) {
      this.socket.on('roomHistory', callback);
    }
  }

  /**
   * Listen for online users updates
   */
  onOnlineUsers(callback: (users: User[]) => void): void {
    if (this.socket) {
      this.socket.on('onlineUsers', callback);
    }
  }

  /**
   * Listen for typing indicators
   */
  onTyping(callback: (data: { users: User[] }) => void): void {
    if (this.socket) {
      this.socket.on('typing', callback);
    }
  }

  /**
   * Listen for room leave confirmation
   */
  onLeftRoom(callback: () => void): void {
    if (this.socket) {
      this.socket.on('leftRoom', callback);
    }
  }

  /**
   * Listen for errors
   */
  onError(callback: (error: { message: string }) => void): void {
    if (this.socket) {
      this.socket.on('error', callback);
    }
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get socket ID
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;