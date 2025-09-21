# Real-Time Chat Application

A modern, scalable real-time chat application built with React (TypeScript) and Node.js, featuring Socket.io for real-time communication. This application uses in-memory storage for simplicity and can be easily extended with database integration.

## ✨ Features

- **Real-time messaging** with Socket.io
- **Multiple chat rooms** support
- **Typing indicators** to show when users are composing messages
- **Online users list** with real-time updates
- **Message history** for each room (last 100 messages)
- **Responsive design** that works on desktop and mobile
- **Modern UI** with TailwindCSS
- **TypeScript** for better development experience
- **In-memory storage** (no database required)

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Socket.io** - Real-time communication
- **CORS** - Cross-origin resource sharing
- **UUID** - Unique identifier generation

### Frontend
- **React 18** - UI library
- **TypeScript** - Static type checking
- **Vite** - Build tool and development server
- **TailwindCSS** - Utility-first CSS framework
- **Socket.io-client** - Real-time client communication

## 📁 Project Structure

```
Real-Time-Chat/
├── backend/
│   ├── package.json
│   └── server.js              # Express + Socket.io server
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.tsx      # User authentication & room selection
│   │   │   ├── ChatRoom.tsx   # Main chat interface
│   │   │   ├── MessageList.tsx    # Message display with grouping
│   │   │   ├── MessageInput.tsx   # Message composition
│   │   │   ├── TypingIndicator.tsx # Typing status display
│   │   │   └── OnlineUsers.tsx    # Online users sidebar
│   │   ├── services/
│   │   │   └── socketService.ts   # Socket.io client wrapper
│   │   ├── App.tsx            # Main application component
│   │   ├── main.tsx          # Application entry point
│   │   └── index.css         # Global styles with TailwindCSS
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
├── README.md
└── LICENSE
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Real-Time-Chat
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   npm start
   ```
   
   The backend server will start on `http://localhost:3001`

3. **Setup Frontend** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   
   The frontend will start on `http://localhost:5173`

4. **Open your browser**
   
   Navigate to `http://localhost:5173` and start chatting!

### Development Mode

For development with auto-reload:

**Backend:**
```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

**Frontend:**
```bash
cd frontend
npm run dev  # Vite dev server with hot reload
```

## 🔧 Configuration

### Backend Configuration

The server can be configured through environment variables:

```bash
PORT=3001                    # Server port (default: 3001)
```

### Frontend Configuration

Update the Socket.io server URL in `src/services/socketService.ts`:

```typescript
constructor(serverUrl: string = 'http://localhost:3001') {
  this.serverUrl = serverUrl;
}
```

## 📡 API & Socket Events

### Socket.io Events

#### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `joinRoom` | `{ username: string, room: string }` | Join a chat room |
| `leaveRoom` | `{}` | Leave current room |
| `sendMessage` | `{ message: string }` | Send a message |
| `typing` | `{ isTyping: boolean }` | Toggle typing indicator |

#### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `message` | `Message` | New message received |
| `roomHistory` | `Message[]` | Chat history when joining |
| `onlineUsers` | `User[]` | Updated online users list |
| `typing` | `{ users: User[] }` | Users currently typing |
| `leftRoom` | `{}` | Confirmation of leaving room |
| `error` | `{ message: string }` | Error messages |

### Data Structures

```typescript
interface User {
  id: string;
  username: string;
  room: string;
  socketId: string;
}

interface Message {
  id: string;
  username: string;
  message: string;
  timestamp: string;
  type: 'user' | 'system';
}
```

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server health check with statistics |

## 🎨 UI Components

### Login Component
- Username validation (2-20 characters, alphanumeric + spaces)
- Room name input with suggestions
- Form validation with error handling
- Loading states during connection

### ChatRoom Component
- Header with room name and user info
- Message list with auto-scroll
- Real-time typing indicators
- Online users sidebar (desktop) / modal (mobile)
- Responsive design for all screen sizes

### MessageList Component
- Message grouping for better readability
- Timestamp display
- User/system message differentiation
- Auto-scroll to new messages
- Empty state handling

### MessageInput Component
- Auto-resizing textarea
- Send on Enter, new line on Shift+Enter
- Typing indicator with debouncing
- Character counter for long messages
- Disabled state handling

## 🔒 Data Storage & Memory Management

### In-Memory Storage Structure

```javascript
const storage = {
  users: new Map(),        // userId → User object
  rooms: new Map(),        // roomName → { users: Set(), messages: [] }
  sockets: new Map(),      // socketId → userId
  typingUsers: new Map()   // roomName → Set(userIds)
};
```

### Memory Optimization

- **Message Limit**: Only the last 100 messages per room are stored
- **Automatic Cleanup**: Users are removed from storage on disconnect
- **Typing Timeout**: Typing indicators auto-clear after 2 seconds
- **Connection Management**: Proper cleanup on socket disconnection

## 📱 Responsive Design

The application is fully responsive with:

- **Mobile-first approach** using TailwindCSS
- **Adaptive layouts** for different screen sizes
- **Touch-friendly interfaces** for mobile devices
- **Collapsible sidebar** on smaller screens
- **Optimized message bubbles** for readability

## 🚀 Future Improvements

### Authentication & Security
- [ ] JWT-based authentication
- [ ] User registration and profiles
- [ ] Private messaging
- [ ] Message encryption
- [ ] Rate limiting and spam protection

### Database Integration
- [ ] MongoDB/PostgreSQL for persistent storage
- [ ] Message history pagination
- [ ] User preferences and settings
- [ ] File upload and sharing
- [ ] Message search functionality

### Scalability
- [ ] Redis for session management
- [ ] Horizontal scaling with multiple server instances
- [ ] Load balancing
- [ ] CDN integration for assets
- [ ] Caching strategies

### Enhanced Features
- [ ] Voice and video calling
- [ ] Screen sharing
- [ ] Rich text formatting
- [ ] Emoji reactions
- [ ] Message threads and replies
- [ ] Push notifications
- [ ] Dark mode theme
- [ ] Multiple language support

### DevOps & Deployment
- [ ] Docker containerization
- [ ] CI/CD pipeline
- [ ] Environment-specific configs
- [ ] Monitoring and logging
- [ ] Health checks and alerts

## 🐛 Troubleshooting

### Common Issues

1. **Connection refused**
   - Ensure backend server is running on port 3001
   - Check firewall settings
   - Verify CORS configuration

2. **Messages not appearing**
   - Check browser console for JavaScript errors
   - Verify Socket.io connection status
   - Ensure proper event handling

3. **Styling issues**
   - Verify TailwindCSS is properly configured
   - Check for conflicting CSS rules
   - Ensure proper class names are used

### Development Tips

- Use browser developer tools to monitor Socket.io events
- Check server logs for connection and error messages
- Test with multiple browser tabs to simulate multiple users
- Use React Developer Tools for component debugging

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Search existing issues in the repository
3. Create a new issue with detailed information
4. Include error messages and reproduction steps

---

**Happy Chatting! 🎉**

