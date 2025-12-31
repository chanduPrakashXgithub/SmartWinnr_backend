# 💬 Real-Time Chat Application

A production-ready, full-featured real-time chat application built with the MERN stack and Socket.IO. Similar to Slack, WhatsApp, and Microsoft Teams, this application provides instant messaging capabilities with modern features and a responsive design.

![Chat Application](https://via.placeholder.com/800x400?text=Chat+Application+Screenshot)

## 🌟 Features

### Core Features
- **Real-time Messaging** - Instant message delivery using Socket.IO WebSockets
- **One-on-One Chat** - Private conversations between two users
- **Group Chat** - Create and manage group conversations with multiple participants
- **Message Persistence** - All messages stored in MongoDB for history access
- **Media Sharing** - Share images, videos, documents, and files up to 10MB
- **Typing Indicators** - Real-time typing status for enhanced UX
- **Online Presence** - See who's online with live status updates
- **Read Receipts** - Track message delivery and read status

### Authentication & Security
- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt encryption for password security
- **Protected Routes** - Client and server-side route protection
- **Input Validation** - Comprehensive validation with express-validator

### User Experience
- **Responsive Design** - Fully responsive UI for desktop and mobile
- **Contact Management** - Add, search, and manage contacts
- **User Search** - Find users by username or email
- **Profile Management** - Update profile picture and display name
- **Message Search** - Search through conversation history
- **Emoji Support** - Rich text messaging with emoji picker

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime environment |
| Express.js | Web framework |
| MongoDB | Database |
| Mongoose | ODM for MongoDB |
| Socket.IO | Real-time WebSocket communication |
| JWT | Authentication tokens |
| bcryptjs | Password hashing |
| Multer | File upload handling |
| Cloudinary | Cloud media storage |
| express-validator | Input validation |
| dotenv | Environment variables |
| cors | Cross-origin requests |
| morgan | HTTP request logging |

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI library |
| Vite | Build tool |
| React Router v6 | Client-side routing |
| Socket.IO Client | WebSocket client |
| Axios | HTTP client |
| Tailwind CSS | Utility-first CSS framework |
| React Icons | Icon library |
| date-fns | Date formatting |

## 📁 Folder Structure

```
chat-app/
├── server/                      # Backend
│   ├── config/                  # Configuration files
│   │   ├── index.js            # Environment config
│   │   ├── database.js         # MongoDB connection
│   │   └── cloudinary.js       # Cloudinary setup
│   ├── models/                  # Mongoose models
│   │   ├── User.js             # User schema
│   │   ├── ChatRoom.js         # Chat room schema
│   │   ├── Message.js          # Message schema
│   │   └── index.js            # Model exports
│   ├── controllers/             # Route controllers
│   │   ├── authController.js   # Auth logic
│   │   ├── userController.js   # User operations
│   │   ├── chatRoomController.js # Chat room logic
│   │   └── messageController.js # Message handling
│   ├── routes/                  # API routes
│   │   ├── authRoutes.js       # /api/auth/*
│   │   ├── userRoutes.js       # /api/users/*
│   │   ├── chatRoomRoutes.js   # /api/chatrooms/*
│   │   ├── messageRoutes.js    # /api/messages/*
│   │   └── index.js            # Route aggregation
│   ├── middleware/              # Express middleware
│   │   ├── auth.js             # JWT verification
│   │   ├── errorHandler.js     # Error handling
│   │   ├── upload.js           # File upload config
│   │   └── validation.js       # Input validation
│   ├── socket/                  # Socket.IO handlers
│   │   ├── index.js            # Socket initialization
│   │   └── chatHandler.js      # Chat event handlers
│   ├── utils/                   # Utility functions
│   │   ├── jwt.js              # JWT helpers
│   │   └── helpers.js          # General helpers
│   ├── uploads/                 # Local file uploads
│   ├── app.js                   # Express app setup
│   ├── server.js                # Server entry point
│   ├── package.json             # Dependencies
│   └── .env.example             # Environment template
│
├── client/                      # Frontend
│   ├── public/                  # Static assets
│   │   └── chat-icon.svg       # App icon
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── common/         # Shared components
│   │   │   │   ├── Avatar.jsx
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Input.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   ├── Spinner.jsx
│   │   │   │   └── index.js
│   │   │   └── chat/           # Chat components
│   │   │       ├── Sidebar.jsx
│   │   │       ├── ChatHeader.jsx
│   │   │       ├── MessageList.jsx
│   │   │       ├── MessageItem.jsx
│   │   │       ├── MessageInput.jsx
│   │   │       ├── TypingIndicator.jsx
│   │   │       ├── NewChatModal.jsx
│   │   │       └── index.js
│   │   ├── pages/               # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Chat.jsx
│   │   │   └── index.js
│   │   ├── context/             # React Context
│   │   │   ├── AuthContext.jsx
│   │   │   ├── SocketContext.jsx
│   │   │   └── ChatContext.jsx
│   │   ├── services/            # API services
│   │   │   └── api.js
│   │   ├── hooks/               # Custom hooks
│   │   │   └── index.js
│   │   ├── utils/               # Utility functions
│   │   │   └── index.js
│   │   ├── App.jsx              # Root component
│   │   ├── main.jsx             # Entry point
│   │   └── index.css            # Global styles
│   ├── index.html               # HTML template
│   ├── package.json             # Dependencies
│   ├── vite.config.js           # Vite configuration
│   ├── tailwind.config.js       # Tailwind config
│   └── postcss.config.js        # PostCSS config
│
├── .gitignore                   # Git ignore rules
└── README.md                    # This file
```

## ⚙️ Environment Variables

### Backend (server/.env)

Create a `.env` file in the `server` directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/chat-app
# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.xxxxx.mongodb.net/chat-app?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Client URL (for CORS)
CLIENT_URL=http://localhost:5173

# Cloudinary Configuration (Optional - for cloud media storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads
```

### Frontend (client/.env)

Create a `.env` file in the `client` directory:

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## 🚀 Setup Instructions

### Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (local installation or MongoDB Atlas account)
- **npm** or **yarn** package manager
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/chat-app.git
   cd chat-app
   ```

2. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Configure environment variables**
   - Copy `server/.env.example` to `server/.env`
   - Update the values with your configuration
   - Create `client/.env` with the frontend variables

5. **Start MongoDB**
   - If using local MongoDB: `mongod`
   - If using MongoDB Atlas: Ensure your connection string is correct

## 🏃 How to Run

### Running the Backend

```bash
# Navigate to server directory
cd server

# Development mode (with hot reload)
npm run dev

# Production mode
npm start
```

The backend will start on `http://localhost:5000`

### Running the Frontend

```bash
# Navigate to client directory
cd client

# Development mode
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

The frontend will start on `http://localhost:5173`

### Running Both Concurrently

You can run both servers in separate terminal windows, or install `concurrently`:

```bash
# From root directory
npm install -g concurrently

# Create a script or run:
concurrently "cd server && npm run dev" "cd client && npm run dev"
```

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/search` | Search users |
| GET | `/api/users/:id` | Get user by ID |
| GET | `/api/users/contacts` | Get contacts |
| POST | `/api/users/contacts/:userId` | Add contact |
| DELETE | `/api/users/contacts/:userId` | Remove contact |

### Chat Rooms
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chatrooms` | Get user's chat rooms |
| POST | `/api/chatrooms` | Create chat room |
| GET | `/api/chatrooms/:id` | Get chat room details |
| PUT | `/api/chatrooms/:id` | Update chat room |
| DELETE | `/api/chatrooms/:id` | Delete chat room |
| POST | `/api/chatrooms/:id/participants` | Add participants |
| DELETE | `/api/chatrooms/:id/participants/:userId` | Remove participant |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/:chatRoomId` | Get messages |
| POST | `/api/messages/:chatRoomId` | Send message |
| POST | `/api/messages/:chatRoomId/media` | Send media message |
| PUT | `/api/messages/:id/read` | Mark as read |
| DELETE | `/api/messages/:id` | Delete message |

## 🔌 Socket Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join_room` | `{ roomId }` | Join a chat room |
| `leave_room` | `{ roomId }` | Leave a chat room |
| `send_message` | `{ roomId, content, type }` | Send a message |
| `typing_start` | `{ roomId }` | User started typing |
| `typing_stop` | `{ roomId }` | User stopped typing |
| `mark_read` | `{ roomId, messageId }` | Mark message as read |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `new_message` | `Message` | New message received |
| `user_typing` | `{ userId, roomId }` | User is typing |
| `user_stop_typing` | `{ userId, roomId }` | User stopped typing |
| `user_online` | `{ userId }` | User came online |
| `user_offline` | `{ userId }` | User went offline |
| `message_read` | `{ messageId, userId }` | Message was read |

## 📸 Screenshots

### 🔐 Login Page
![Login Page](./screenshots/login.png)

---

### 📝 Register Page
![Register Page](./screenshots/register.png)

---

### 💻 Chat Interface (Desktop)
![Chat Desktop](./screenshots/chat-desktop.png)

---

### 📎 Sending Media in Chat
![Sending Media](./screenshots/chatting_sending_media.png)

---

### 👥 Group Chat
![Group Chat](./screenshots/group-chat.png)


## 🧪 Testing

```bash
# Run backend tests
cd server
npm test

# Run frontend tests
cd client
npm test
```

## 🚢 Deployment

### Backend Deployment (Render/Railway/Heroku)

1. Set up your MongoDB Atlas cluster
2. Configure environment variables on your hosting platform
3. Deploy the `server` directory

### Frontend Deployment (Vercel/Netlify)

1. Build the production version: `npm run build`
2. Deploy the `dist` folder
3. Configure environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Socket.IO](https://socket.io/) for real-time communication
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [React Icons](https://react-icons.github.io/react-icons/) for icons
- [MongoDB](https://www.mongodb.com/) for database

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

⭐ **Star this repository if you found it helpful!**
