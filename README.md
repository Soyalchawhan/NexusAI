# NexusAI — AI-Powered Chatbot Suite

> Five expert AI assistants in one elegant platform.

## 🤖 AI Assistants

| Bot | Domain | Specialty |
|-----|--------|-----------|
| ⚡ FitCoach | Fitness & Wellness | Workouts, Nutrition, Recovery |
| 📈 TradePilot | Stocks & Trading | Market Analysis, Portfolio, Risk |
| 🎓 StudyMate | Academic | All Subjects, Exam Prep, Research |
| 💼 BizMentor | Business Strategy | Startups, Marketing, Scaling |
| 🧘 ZenGuide | Mind & Lifestyle | Mindfulness, Habits, Growth |

## 📁 Project Structure

```
nexusai/
├── frontend/
│   ├── index.html            # Main HTML (landing + chat pages)
│   ├── styles/
│   │   └── main.css          # External stylesheet
│   └── js/
│       └── app.js            # Application logic + AI integration
│
└── backend/
    ├── server.js             # Express + Socket.io server
    ├── package.json
    ├── .env.example
    ├── config/
    │   └── db.js             # MongoDB connection
    ├── models/
    │   ├── User.js           # User schema
    │   ├── Message.js        # Message schema
    │   └── Session.js        # Chat session schema
    ├── controllers/
    │   ├── authController.js
    │   ├── chatController.js
    │   └── adminController.js
    ├── middleware/
    │   ├── auth.js           # JWT verification
    │   └── validation.js     # Input sanitization
    ├── routes/
    │   ├── auth.js
    │   ├── chat.js
    │   └── admin.js
    └── services/
        ├── aiService.js      # Claude AI integration
        └── socketService.js  # Real-time WebSocket handlers
```

## 🚀 Quick Start

### Frontend (Static)
Open `frontend/index.html` directly in a browser — no build step required. The frontend calls the Anthropic API directly for demo purposes.

### Backend (Full Stack)

```bash
cd backend
cp .env.example .env
# Fill in your MONGODB_URI, JWT_SECRET, and ANTHROPIC_API_KEY

npm install
npm run dev    # Development with nodemon
npm start      # Production
```

## 🛠 Tech Stack

- **Frontend:** HTML5, CSS3 (custom), Vanilla JS, Anthropic API
- **Backend:** Node.js, Express.js, MongoDB, Mongoose
- **Real-time:** Socket.io (WebSockets)
- **Auth:** JWT (JSON Web Tokens)
- **AI:** Claude (Anthropic) via @anthropic-ai/sdk
- **Deployment:** Frontend → Vercel | Backend → Render/Railway | DB → MongoDB Atlas

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/preferences` | Update preferences |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/message` | Send message, get AI reply |
| GET | `/api/chat/sessions` | List sessions |
| POST | `/api/chat/sessions` | New session |
| GET | `/api/chat/sessions/:id` | Get session messages |
| DELETE | `/api/chat/sessions/:id` | Delete session |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Platform analytics |
| GET | `/api/admin/users` | User management |
| GET | `/api/admin/activity` | Activity log |

## 🔮 Future Enhancements
- Multilingual support
- Voice input/output
- Mobile app (React Native)
- Custom AI fine-tuning
- Integration with Google Calendar, email, etc.
