/**
 * OnlineUsers Component
 * Displays list of currently online users in the chat room
 */

import React from 'react';
import type { User } from '../services/socketService';

interface OnlineUsersProps {
  users: User[];
  currentUser: User;
}

const OnlineUsers: React.FC<OnlineUsersProps> = ({ users, currentUser }) => {
  /**
   * Sort users with current user first, then alphabetically
   */
  const sortedUsers = React.useMemo(() => {
    return [...users].sort((a, b) => {
      // Current user always first
      if (a.id === currentUser.id) return -1;
      if (b.id === currentUser.id) return 1;
      
      // Then sort alphabetically by username
      return a.username.localeCompare(b.username);
    });
  }, [users, currentUser]);

  /**
   * Get user status badge color
   */
  const getUserStatusColor = (user: User): string => {
    return user.id === currentUser.id ? 'bg-green-500' : 'bg-green-400';
  };

  /**
   * Get initials for avatar
   */
  const getInitials = (username: string): string => {
    return username
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  /**
   * Generate a consistent color for user avatar based on username
   */
  const getAvatarColor = (username: string): string => {
    const colors = [
      'bg-red-500', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500',
      'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500',
      'bg-teal-500', 'bg-cyan-500'
    ];
    
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Online Users
        </h2>
        <p className="text-sm text-gray-500">
          {users.length} {users.length === 1 ? 'person' : 'people'} online
        </p>
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto">
        {sortedUsers.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-gray-500 text-sm">No users online</p>
          </div>
        ) : (
          <div className="p-2">
            {sortedUsers.map((user) => (
              <div
                key={user.id}
                className={`flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors ${
                  user.id === currentUser.id ? 'bg-primary-50 border border-primary-200' : ''
                }`}
              >
                {/* User Avatar */}
                <div className="relative flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full ${getAvatarColor(user.username)} flex items-center justify-center text-white text-sm font-semibold`}>
                    {getInitials(user.username)}
                  </div>
                  
                  {/* Online status indicator */}
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${getUserStatusColor(user)} border-2 border-white rounded-full`}></div>
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    user.id === currentUser.id ? 'text-primary-700' : 'text-gray-900'
                  }`}>
                    {user.username}
                    {user.id === currentUser.id && (
                      <span className="ml-1 text-xs text-primary-600">(You)</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    Online
                  </p>
                </div>

                {/* Status icon */}
                <div className="flex-shrink-0">
                  {user.id === currentUser.id ? (
                    <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Online and active</span>
          </div>
          <p className="text-center mt-2">
            Users in this room only
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnlineUsers;