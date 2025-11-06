# ByteLearn - AI-Powered Visual Learning Platform

Transform your learning prompts into stunning visual explanations with AI-generated Manim animations and synchronized narration in 9 Indian languages.

## 🌟 Features

- **AI-Generated Animations**: Convert text prompts into educational Manim videos using Google Gemini AI
- **Multi-Language Support**: Get narrations in 9 Indian languages (English, Hindi, Tamil, Telugu, Malayalam, Kannada, Bengali, Gujarati, Marathi)
- **Text-to-Speech**: Professional voice narration powered by ElevenLabs
- **User Authentication**: Secure authentication using Clerk
- **Dashboard**: Track your learning progress and manage generated content
- **Background Processing**: Asynchronous video generation with status tracking
- **Modern UI**: Beautiful, responsive interface with dark mode support

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.5.6 (React 19.1.0)
- **Styling**: Tailwind CSS with custom components
- **UI Components**: Radix UI, Framer Motion, Lucide Icons
- **Authentication**: Clerk
- **Database ORM**: Prisma
- **State Management**: TanStack Query

### Backend
- **Python Backend**: FastAPI for Manim video rendering (see `byte_learn_backend/`)
- **AI**: Google Gemini AI for script generation
- **TTS**: Google TTS for voice synthesis
- **Storage**: Supabase for video and audio storage
- **Database**: Supabase (PostgreSQL)

## 📋 Prerequisites

- Node.js 20+
- pnpm (or npm/yarn)
- Python 3.9+ (for backend)
- Manim installed (for backend video rendering)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Chidanandareddyj/ByteLearnStudy.git
cd ByteLearnStudy/byte_learn_17
```

### 2. Install Dependencies

```bash
pnpm install
# or
npm install
# or
yarn install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:


### 4. Database Setup

Run Prisma migrations to set up your database:

```bash
pnpm prisma migrate dev
# or
npx prisma migrate dev
```

Generate Prisma client:

```bash
pnpm prisma generate
# or
npx prisma generate
```

### 5. Start the Development Server

```bash
pnpm dev
# or
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### 6. Start the Python Backend (Optional)

For video generation functionality, you need to run the Python backend:

```bash
cd ../byte_learn_backend
pip install -r requirements.txt
uvicorn main:app --reload
```

The backend will be available at `http://localhost:8000`

## 📁 Project Structure

```
byte_learn_17/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   │   ├── generate/     # Content generation endpoints
│   │   │   ├── prompts/      # Prompt management
│   │   │   ├── videos/       # Video processing
│   │   │   └── webhooks/     # Webhook handlers
│   │   ├── dashboard/        # User dashboard
│   │   ├── learn/            # Learning page
│   │   ├── sign-in/          # Authentication
│   │   └── sign-up/
│   ├── components/            # React components
│   │   ├── ui/               # UI components (shadcn/ui)
│   │   ├── Dashboard.tsx
│   │   ├── LearningPage.tsx
│   │   └── ...
│   └── lib/                   # Utilities and configurations
│       ├── prisma.ts         # Database client
│       └── generation/       # Content generation logic
├── prisma/
│   └── schema.prisma         # Database schema
├── public/                    # Static assets
└── package.json
```

## 🗄️ Database Schema

The application uses PostgreSQL with the following main models:

- **User**: User accounts (linked to Clerk)
- **Prompt**: User-submitted learning prompts
- **Script**: AI-generated Manim scripts with explanations
- **Audio**: Generated audio narrations
- **Video**: Rendered Manim videos
- **Mux**: Final muxed videos with audio

## 🎯 Available Scripts

```bash
# Development
pnpm dev           # Start development server

# Production
pnpm build         # Build for production
pnpm start         # Start production server

# Database
pnpm prisma studio # Open Prisma Studio
pnpm prisma migrate dev # Run migrations

# Linting
pnpm lint          # Run ESLint
```

## 🔑 Key Features Explained

### 1. Content Generation Flow
1. User submits a learning prompt with language preference
2. Google Gemini AI generates a Manim script with explanations
3. ElevenLabs converts narration to speech in the selected language
4. Python backend renders the Manim animation
5. Video and audio are muxed together
6. Final video is stored in Supabase

### 2. Background Processing
Videos are generated asynchronously with status tracking:
- `QUEUED`: Waiting for processing
- `PROCESSING`: Currently being generated
- `COMPLETED`: Ready to view
- `FAILED`: Error occurred

### 3. Multi-Language Support
Supports 9 Indian languages for narration:
- English, Hindi, Tamil, Telugu, Malayalam, Kannada, Bengali, Gujarati, Marathi

## 🚀 Deployment

### Deploy to Vercel

The easiest way to deploy is using the [Vercel Platform](https://vercel.com/new):

1. Push your code to GitHub
2. Import the repository in Vercel
3. Configure environment variables
4. Deploy!

### Deploy Python Backend

Deploy the `byte_learn_backend` to a Python hosting service:
- Railway
- Render
- Google Cloud Run
- AWS Lambda

Update the `BACKEND_URL` and `PYTHON_BACKEND_URL` environment variables accordingly.

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Manim Community](https://www.manim.community/)
- [Clerk Authentication](https://clerk.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Google Gemini AI](https://ai.google.dev/)
- [ElevenLabs API](https://elevenlabs.io/docs)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.


## 👥 Authors

- Chidananda Reddy J - [GitHub](https://github.com/Chidanandareddyj)

## 🙏 Acknowledgments

- Manim Community for the amazing animation library
- Vercel for hosting
- All contributors who help improve this project
