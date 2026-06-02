# Harmonia - AI-Powered Playlist Manager

Harmonia is a full-stack web app for creating, managing, and syncing music playlists. Users sign in, generate playlists with Google Gemini, enrich songs with YouTube Data API results, save playlists in MongoDB, and optionally sync playlists into their YouTube account.

## Features

- Email/password authentication with JWT
- MongoDB-backed playlist storage per user
- AI playlist generation with Google Gemini
- Duplicate-aware AI recommendations based on a user's saved songs
- YouTube Data API search for song discovery and video IDs
- YouTube OAuth connection and playlist sync
- Favorites, playlist renaming, song removal, and account deletion
- React/Vite frontend with Zustand state management
- Vitest, React Testing Library, and fast-check test coverage

## Tech Stack

- Frontend: React 18, TypeScript, Vite, React Router, Zustand
- Backend: Node.js, Express 5, Mongoose, JWT, bcrypt
- Database: MongoDB
- AI: `@google/genai`
- External APIs: YouTube Data API v3 and Google OAuth
- Quality: Vitest, React Testing Library, ESLint, Prettier

## Prerequisites

- Node.js 18+ and npm
- MongoDB running locally or a MongoDB connection string
- Gemini API key
- YouTube Data API key
- Google OAuth client credentials if you want YouTube sync

## Configuration

Create a `.env` file in the project root. Use `.env.example` as the template:

```bash
YOUTUBE_API_KEY=your_youtube_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=replace_with_a_long_random_secret
MONGODB_URI=mongodb://127.0.0.1:27017/playlist-manager
PORT=5000
CLIENT_URL=http://localhost:5173
VITE_API_BASE_URL=http://localhost:5000/api
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/api/youtube/oauth/callback
```

`CLIENT_URL` controls backend redirects and CORS for the frontend. `VITE_API_BASE_URL` controls which backend the frontend calls. For local development the defaults are `http://localhost:5173` and `http://localhost:5000/api`.

## Installation

```bash
npm install
```

## Development

Start MongoDB first, then run the backend and frontend in separate terminals:

```bash
npm run server
```

```bash
npm run dev
```

The frontend runs at `http://localhost:5173` and the API runs at `http://localhost:5000/api`.

## Build, Test, And Lint

```bash
npm run build
npm test
npm run lint
```

On Windows PowerShell, if script execution blocks `npm`, use `npm.cmd`:

```bash
npm.cmd run build
npm.cmd test
npm.cmd run lint
```

## Project Structure

```text
server/
  index.js                  Express app entrypoint
  middleware/               Shared Express middleware
  models/                   Mongoose User and Playlist models
  routes/                   Auth, playlists, YouTube, YouTube sync, Gemini routes
  services/gemini.js        Gemini playlist generation
  utils/                    Request validation helpers

src/
  components/               Reusable React UI
  pages/                    Login and main app pages
  services/                 Frontend API client and playlist validation service
  store/                    Zustand auth and playlist stores
  models/                   Shared frontend TypeScript types
  test/                     Vitest setup and shared mocks
```

## Data Flow

1. The user authenticates through the Express backend.
2. The frontend stores the JWT locally and sends it with API requests.
3. Playlist data is persisted in MongoDB through Mongoose models.
4. Gemini receives the user's prompt plus an exclusion list built from existing playlist songs.
5. The backend resolves AI song suggestions to YouTube video IDs when an API key is configured.
6. YouTube sync uses OAuth tokens stored on the user's MongoDB record.

## Security Notes

- Keep `.env` out of source control.
- Rotate API keys and OAuth secrets if they were ever shared publicly.
- Use a strong `JWT_SECRET` outside local development.

## License

MIT
