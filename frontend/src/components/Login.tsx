/**
 * Login Component
 * Handles user authentication and room selection
 */

import React, { useState, FormEvent } from 'react';

interface LoginProps {
  onLogin: (username: string, room: string) => void;
  isLoading: boolean;
  error: string | null;
  onClearError: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, isLoading, error, onClearError }) => {
  const [formData, setFormData] = useState({
    username: '',
    room: '',
  });

  const [validationErrors, setValidationErrors] = useState({
    username: '',
    room: '',
  });

  // Common room suggestions
  const commonRooms = [
    'General',
    'Random',
    'Tech Talk',
    'Gaming',
    'Music',
    'Movies',
  ];

  /**
   * Handle input changes and clear validation errors
   */
  const handleInputChange = (field: 'username' | 'room', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }

    // Clear server error when user starts typing
    if (error) {
      onClearError();
    }
  };

  /**
   * Validate form inputs
   */
  const validateForm = (): boolean => {
    const errors = {
      username: '',
      room: '',
    };

    // Username validation
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.trim().length < 2) {
      errors.username = 'Username must be at least 2 characters';
    } else if (formData.username.trim().length > 20) {
      errors.username = 'Username must be less than 20 characters';
    } else if (!/^[a-zA-Z0-9_\s]+$/.test(formData.username.trim())) {
      errors.username = 'Username can only contain letters, numbers, underscores, and spaces';
    }

    // Room validation
    if (!formData.room.trim()) {
      errors.room = 'Room name is required';
    } else if (formData.room.trim().length < 2) {
      errors.room = 'Room name must be at least 2 characters';
    } else if (formData.room.trim().length > 30) {
      errors.room = 'Room name must be less than 30 characters';
    } else if (!/^[a-zA-Z0-9_\s]+$/.test(formData.room.trim())) {
      errors.room = 'Room name can only contain letters, numbers, underscores, and spaces';
    }

    setValidationErrors(errors);

    return !errors.username && !errors.room;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isLoading) return;

    if (validateForm()) {
      onLogin(formData.username.trim(), formData.room.trim());
    }
  };

  /**
   * Handle room selection from suggestions
   */
  const handleRoomSelect = (roomName: string) => {
    handleInputChange('room', roomName);
  };

  return (
    <div className="bg-white py-8 px-6 shadow-lg rounded-lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Server Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Username Field */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
            Username
          </label>
          <div className="mt-1">
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              className={`appearance-none rounded-md relative block w-full px-3 py-2 border ${
                validationErrors.username
                  ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 placeholder-gray-500 text-gray-900 focus:ring-primary-500 focus:border-primary-500'
              } focus:outline-none focus:z-10 sm:text-sm`}
              placeholder="Enter your username"
              disabled={isLoading}
            />
          </div>
          {validationErrors.username && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.username}</p>
          )}
        </div>

        {/* Room Field */}
        <div>
          <label htmlFor="room" className="block text-sm font-medium text-gray-700">
            Chat Room
          </label>
          <div className="mt-1">
            <input
              id="room"
              name="room"
              type="text"
              required
              value={formData.room}
              onChange={(e) => handleInputChange('room', e.target.value)}
              className={`appearance-none rounded-md relative block w-full px-3 py-2 border ${
                validationErrors.room
                  ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 placeholder-gray-500 text-gray-900 focus:ring-primary-500 focus:border-primary-500'
              } focus:outline-none focus:z-10 sm:text-sm`}
              placeholder="Enter room name or select below"
              disabled={isLoading}
            />
          </div>
          {validationErrors.room && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.room}</p>
          )}

          {/* Room Suggestions */}
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-2">Popular rooms:</p>
            <div className="flex flex-wrap gap-2">
              {commonRooms.map((room) => (
                <button
                  key={room}
                  type="button"
                  onClick={() => handleRoomSelect(room)}
                  disabled={isLoading}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {room}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Joining...
              </>
            ) : (
              'Join Chat Room'
            )}
          </button>
        </div>
      </form>

      {/* Info Section */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Enter a username and room name to start chatting.<br />
          You'll be connected with others in the same room.
        </p>
      </div>
    </div>
  );
};

export default Login;