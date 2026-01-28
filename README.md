# Triad Frontend

A Next.js frontend application for the Triad sports psychology app, built with TypeScript, Tailwind CSS, and shadcn/ui.

## Features

- **Chat Page**: Interactive chat interface with streaming support for conversations with the sports psychology assistant
- **Journal Page**: Create and manage journal entries with emotion tracking
- **Nudges Page**: View personalized reminders, tips, and motivational messages
- **Retractable Navbar**: Responsive navigation with mobile-friendly sidebar
- **Login Page**: Clean login interface (authentication to be implemented)

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **Lucide React** - Icon library

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/fast
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

The app will redirect to `/login` by default. After "logging in" (no actual authentication yet), you'll be redirected to `/chat`.

## Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── chat/              # Chat page
│   ├── journal/           # Journal page
│   ├── login/              # Login page
│   ├── nudges/            # Nudges page
│   ├── layout.tsx         # Root layout with navbar
│   └── page.tsx           # Home page (redirects to login)
├── components/
│   ├── ui/                # shadcn/ui components
│   └── navbar.tsx         # Navigation component
└── lib/
    ├── api.ts             # API client utilities
    └── utils.ts           # Utility functions
```

## Pages

### Chat (`/chat`)
- Send messages to the sports psychology assistant
- View conversation history
- Streaming response support (simulated for now)
- Chat sessions are maintained via `chatsession_id`

### Journal (`/journal`)
- Create new journal entries with title, content, and emotion
- View all journal entries
- Filter by emotion type

### Nudges (`/nudges`)
- View active reminders and tips
- Mark nudges as complete
- View completed nudges

### Login (`/login`)
- Simple login form (UI only, no authentication)
- Redirects to `/chat` on submit

## API Integration

The frontend communicates with the backend API defined in `lib/api.ts`. The API base URL is configured via the `NEXT_PUBLIC_API_URL` environment variable.

### Endpoints Used

- `POST /api/chat` - Send chat messages
- `POST /api/journal` - Create journal entries
- `GET /api/journal/{user_id}` - Get journal entries

## Development

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Linting

```bash
npm run lint
```

## Notes

- Authentication is not yet implemented - the login page is UI-only
- Chat streaming is currently simulated (chunks the response) since the backend doesn't expose streaming endpoints yet
- User data is currently hardcoded - replace with actual user context when authentication is added
- The backend supports chat sessions, but there's no endpoint to fetch recent sessions yet

## Next Steps

- Implement actual authentication
- Add endpoint to fetch recent chat sessions
- Implement real streaming when backend supports it
- Add user profile/settings page
- Add error boundaries and better error handling
- Add loading states and skeletons
