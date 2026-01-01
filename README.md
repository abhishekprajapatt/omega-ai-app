# OMEGA - AI Chat Application

last command: npx cap open android

An advanced AI-powered chat application built with modern web technologies. OMEGA provides intelligent conversations with multiple AI models, voice input/output capabilities, and real-time message processing.

## Features

### 🤖 AI Models

- **Multiple AI Models Support**
  - DeepSeek R1
  - ChatGPT-5 (OpenAI)
  - Grok 4
  - Gemini 2.5 Pro
  - Claude Sonnet 4.5

### 🎙️ Voice Features

- Real-time voice input with continuous listening
- Text-to-speech output with multiple voice options
- Voice message detection and processing
- Wake word activation ("Hey Omega", "Hello Omega", etc.)
- Background listening mode

### 💬 Chat Features

- Create and manage multiple chat conversations
- Real-time message typing animation
- Edit and resend messages
- Regenerate AI responses
- Chat history with smart grouping (Recent, Today, Yesterday, etc.)
- Search chat history
- Auto-generated chat titles

### 🎨 User Interface

- Dark mode theme
- Collapsible sidebar
- Responsive design (Mobile & Desktop)
- Markdown rendering for formatted responses
- Code syntax highlighting with Prism.js
- Copy/paste message functionality

### 🔐 Authentication

- Clerk authentication integration
- User profile management
- Secure API endpoints

### 🌍 Localization

- Multi-language support
- Auto-detected browser language
- Language-specific AI responses

## Tech Stack

### Frontend

- **Framework**: Next.js 14+ (React)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Lucide React Icons
- **Markdown**: React Markdown + Prism.js
- **Voice API**: Web Speech API
- **Authentication**: Clerk

### Backend

- **Runtime**: Node.js
- **Framework**: Next.js API Routes
- **Database**: MongoDB
- **ORM**: Mongoose/Native MongoDB Driver

### Services

- **Authentication**: Clerk
- **AI Integration**: Multiple API providers

## Project Structure

```
omega/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   ├── ai/               # AI response endpoint
│   │   │   ├── create/           # Create new chat
│   │   │   ├── delete/           # Delete chat
│   │   │   ├── get/              # Fetch chats
│   │   │   └── rename/           # Rename chat
│   │   ├── clerk/                # Clerk webhook
│   │   └── user/                 # User endpoints
│   ├── c/[id]/                   # Chat page (dynamic route)
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/
│   ├── ChatLabel.tsx             # Chat list item
│   ├── Message.tsx               # Message component
│   ├── PromptBox.tsx             # Input box
│   ├── SettingsModal.tsx         # Settings modal
│   ├── Sidebar.tsx               # Sidebar navigation
│   ├── SkeletonLoading.tsx       # Loading skeleton
│   └── VoiceInputModal.tsx       # Voice input modal
├── config/
│   └── db.ts                     # Database configuration
├── context/
│   └── AppContext.tsx            # Global app context with state management
├── lib/
│   └── translations.ts           # Language translations
├── models/
│   ├── Chat.ts                   # Chat MongoDB schema
│   └── User.ts                   # User MongoDB schema
├── public/
│   ├── assets/                   # Images and icons
│   │   └── aimodels/            # AI model images
│   └── sounds/                   # Audio files
├── eslint.config.ts              # ESLint configuration
├── middleware.ts                 # Clerk auth middleware
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── postcss.config.mjs            # PostCSS configuration
└── package.json                  # Project dependencies
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB instance
- Clerk account for authentication

### Installation

1. Clone the repository

```bash
git clone https://github.com/abhishekprajapatt/omega.git
cd omega
```

2. Install dependencies

```bash
npm install
```

3. Set up environment variables
   Create `.env.local` file:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
MONGODB_URI=your_mongodb_connection_string
NEXT_PUBLIC_API_URL=http://localhost:3000
```

4. Run development server

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Development

### Build

```bash
npm run build
```

### Run Production

```bash
npm start
```

### Linting

```bash
npm run lint
```

## API Endpoints

### Chat Management

| Method | Endpoint                | Description          |
| ------ | ----------------------- | -------------------- |
| POST   | `/api/chat/create`      | Create new chat      |
| GET    | `/api/chat/get`         | Fetch user chats     |
| DELETE | `/api/chat/delete/[id]` | Delete specific chat |
| POST   | `/api/chat/rename`      | Rename chat          |

### AI

| Method | Endpoint       | Description              |
| ------ | -------------- | ------------------------ |
| POST   | `/api/chat/ai` | Send message to AI model |

### User

| Method | Endpoint                     | Description           |
| ------ | ---------------------------- | --------------------- |
| DELETE | `/api/user/delete-all-chats` | Delete all user chats |
| GET    | `/api/user/export-data`      | Export user data      |

## Configuration Files

- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `eslint.config.ts` - ESLint rules
- `postcss.config.mjs` - PostCSS plugins

## Key Features Implementation

### Real-time Message Updates

- WebSocket-like behavior using Context API
- Optimistic UI updates
- Synchronized state across components

### Voice Recognition & Synthesis

- Web Speech API for voice input
- Text-to-speech with multiple voices
- Language detection and switching

### Chat History Management

- Smart grouping by time periods
- Searchable chat history
- Auto-generated titles from first message

### AI Model Selection

- Runtime model switching
- Support for multiple AI providers
- Model-specific configurations

## Deployment

### Vercel (Recommended)

```bash
vercel
```

### Docker

```bash
docker build -t omega .
docker run -p 3000:3000 omega
```

### Manual Server

```bash
npm run build
npm start
```

## Performance Optimizations

- Code splitting with Next.js
- Image optimization
- Lazy loading components
- Efficient state management
- Debounced search

## Security

- Clerk authentication
- Protected API routes
- Environment variable protection
- CORS configuration
- Input validation and sanitization

## Database Schema

### Chat

```
{
  _id: ObjectId,
  userId: String,
  name: String,
  messages: [Message],
  createdAt: Date,
  updatedAt: Date
}
```

### Message

```
{
  role: 'user' | 'assistant',
  content: String,
  timestamp: Number,
  isVoiceMessage: Boolean
}
```

### User

```
{
  _id: ObjectId,
  clerkId: String,
  email: String,
  name: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Troubleshooting

### Voice not working

- Check browser microphone permissions
- Ensure HTTPS in production
- Test browser compatibility

### Messages not syncing

- Clear browser cache
- Check database connection
- Verify Clerk setup

### AI not responding

- Verify API keys
- Check network connectivity
- Review API rate limits

## License

Private Repository - All rights reserved

## Author

Abhishek Prajapat

## Support

For issues and feature requests, contact the development team.
