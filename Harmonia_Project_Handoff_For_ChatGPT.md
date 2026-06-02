# Harmonia Project Handoff For ChatGPT

Generated: June 2, 2026  
Project path: `C:\ai mini project`  
Repository: `https://github.com/TanmayManiyar/Harmonia-AI-powered-playlist-manager`

## How To Use This Document With ChatGPT

Upload this document or paste its contents into ChatGPT with this prompt:

```text
You are helping me continue development on Harmonia, an AI-powered playlist manager. Read this complete project handoff first. Use it as the source of truth for the current architecture, tech stack, features, project structure, setup, testing status, known constraints, and next development work. After reading, ask only for the specific task I want to do next.
```

Important safety note: do not share the real `.env` file or API keys. This document intentionally describes the environment variables without exposing secret values.

## Executive Summary

Harmonia is a full-stack AI-powered playlist manager. Users authenticate with email/password, create and manage playlists, generate AI-curated playlists with Google Gemini, enrich songs with YouTube Data API video IDs, and optionally sync playlists into their YouTube account through Google OAuth.

The project started as a localStorage-focused frontend app and has been modernized into a backend-backed MongoDB application. The current source of truth for users, playlists, and YouTube OAuth tokens is MongoDB.

## Current Verification Status

The project currently passes:

- `npm.cmd test`: 11 test files, 61 tests passed
- `npm.cmd run build`: passed
- `npm.cmd run lint`: passed
- `node --check` on backend route/helper files: passed
- Backend startup probe: connected to local MongoDB and started on `http://localhost:5000`

On Windows PowerShell, use `npm.cmd` if plain `npm` is blocked by execution policy.

## Tech Stack

### Frontend

- React 18
- TypeScript
- Vite
- React Router v6
- Zustand for state management
- Vanilla CSS for styling
- Browser `localStorage` only for auth token and lightweight local preferences

### Backend

- Node.js
- Express 5
- MongoDB
- Mongoose
- JWT authentication with `jsonwebtoken`
- Password hashing with `bcryptjs`
- CORS via `cors`
- Environment configuration via `dotenv`

### AI And External APIs

- Google Gemini through `@google/genai`
- YouTube Data API v3 for video search and song hydration
- Google OAuth through `googleapis` for YouTube playlist sync
- Axios for backend HTTP calls to YouTube Data API

### Testing And Quality

- Vitest
- React Testing Library
- `@testing-library/jest-dom`
- fast-check
- ESLint
- Prettier
- TypeScript strict mode through the build config

## Core Features

### Authentication

- Register with email and password
- Login with email and password
- JWT-based session authentication
- Session restoration on app startup
- Logout
- Delete account with all associated playlists

### Playlist Management

- Fetch authenticated user's playlists from MongoDB
- Create playlists by genre
- Rename playlists
- Delete playlists
- Toggle favorites
- Group playlists by genre
- Add songs to playlists
- Remove songs from playlists
- Add custom songs through the UI

### AI Playlist Generation

- User can describe a desired playlist in natural language.
- Backend gathers existing user songs into an exclusion list.
- Gemini generates a structured JSON response with:
  - inferred genre
  - song title
  - artist
  - language
- Backend caps prompt-requested song counts to protect quota.
- Backend creates a MongoDB playlist from the AI response.

### YouTube Search And Hydration

- Backend can search YouTube by genre or text query.
- If `YOUTUBE_API_KEY` is configured, real YouTube Data API results are used.
- If no YouTube key is present or YouTube fails, backend route includes static fallback song data.
- AI-generated songs are resolved to YouTube video IDs when possible.

### YouTube OAuth And Sync

- User can connect a Google/YouTube account.
- OAuth tokens are stored on the MongoDB user record.
- Backend creates a private YouTube playlist.
- Backend adds songs by existing `youtubeId` or searches YouTube when missing.
- Token refresh updates the user's stored Google token fields.

## Architecture Overview

```text
React UI
  -> Zustand stores
  -> src/services/api.ts
  -> Express API routes
  -> MongoDB / Gemini / YouTube Data API / Google OAuth
```

### Data Flow

1. User registers or logs in through `/api/auth`.
2. Backend returns a JWT and public user profile.
3. Frontend stores the JWT in `localStorage` under `playlist-manager:auth`.
4. Frontend API client sends the token as `Authorization: Bearer <token>`.
5. Protected backend routes use shared JWT middleware.
6. Playlist data is stored in MongoDB via Mongoose.
7. AI generation uses existing playlist songs to reduce duplicates.
8. YouTube sync uses Google OAuth tokens stored on the user document.

## Environment Variables

Use `.env.example` as the template:

```bash
YOUTUBE_API_KEY=your_youtube_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=your_jwt_secret_here
MONGODB_URI=mongodb://127.0.0.1:27017/playlist-manager
PORT=5000
CLIENT_URL=http://localhost:5173
VITE_API_BASE_URL=http://localhost:5000/api
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/api/youtube/oauth/callback
```

Variable purposes:

- `YOUTUBE_API_KEY`: backend YouTube Data API search.
- `GEMINI_API_KEY`: backend Gemini playlist generation.
- `JWT_SECRET`: signs JWT auth tokens.
- `MONGODB_URI`: MongoDB database connection.
- `PORT`: Express API port.
- `CLIENT_URL`: frontend URL for CORS and OAuth redirect return.
- `VITE_API_BASE_URL`: frontend API base URL.
- `GOOGLE_CLIENT_ID`: Google OAuth client ID.
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret.
- `GOOGLE_REDIRECT_URI`: Google OAuth callback URL.

Security note: rotate real API keys and OAuth secrets if they were ever exposed.

## Current Project Structure

```text
harmonia/
  server/
    index.js
    middleware/
      authenticate.js
    models/
      User.js
      Playlist.js
    routes/
      auth.js
      playlists.js
      geminiChat.js
      youtube.js
      youtubeSync.js
    services/
      gemini.js
    utils/
      validation.js

  src/
    App.tsx
    main.tsx
    index.css
    vite-env.d.ts
    components/
      AddCustomSongDialog.tsx
      AIChatPanel.tsx
      ConfirmationDialog.tsx
      FavoritesSection.tsx
      GenreSection.tsx
      LanguageSelector.tsx
      MyPlaylistsSection.tsx
      PlaylistCard.tsx
      PlaylistCreationPanel.tsx
      SearchPanel.tsx
      SongItem.tsx
      components.css
      index.ts
    pages/
      HomePage.tsx
      HomePage.css
      LoginPage.tsx
      LoginPage.css
    services/
      api.ts
      PlaylistService.ts
    store/
      authStore.ts
      index.ts
    models/
      index.ts
    test/
      setup.ts
      example.test.ts
      fast-check.test.ts

  README.md
  PROJECT_STRUCTURE.md
  package.json
  vite.config.ts
  tsconfig.json
  tsconfig.build.json
  tsconfig.node.json
  .env.example
  .eslintrc.cjs
  .prettierrc
  index.html
```

## Backend Details

### `server/index.js`

Responsibilities:

- Loads environment variables.
- Creates Express app.
- Configures CORS using `CLIENT_URL`.
- Configures JSON body parsing.
- Mounts route modules.
- Redirects legacy OAuth callback path to the YouTube sync callback.
- Provides `/api/health`.
- Connects to MongoDB and starts the server.

Mounted routes:

- `/api/auth`
- `/api/playlists`
- `/api/youtube`
- `/api/youtube-sync`
- `/api/gemini`

### Shared Middleware

`server/middleware/authenticate.js`

- Reads JWT from the `Authorization` header.
- Verifies token with `JWT_SECRET`.
- Sets `req.userId`.
- Returns `401` for missing or invalid tokens.

### Validation Helpers

`server/utils/validation.js`

- `isNonEmptyString`
- `normalizeString`
- `escapeRegExp`
- `isSongInput`
- `normalizeSong`
- `parseSongList`

These helpers normalize request body values and reduce repeated validation logic across routes.

### Models

#### `User`

Fields:

- `name`
- `email`
- `password`
- `googleTokens`
  - `access_token`
  - `refresh_token`
  - `scope`
  - `token_type`
  - `expiry_date`
- `createdAt`

#### `Playlist`

Fields:

- `userId`
- `name`
- `genre`
- `songs`
- `isFavorite`
- timestamps

Embedded song fields:

- `id`
- `title`
- `artist`
- `genre`
- `language`
- `duration`
- `isCustom`
- `youtubeId`

### Auth Routes

Base path: `/api/auth`

- `POST /register`
  - Requires `email` and `password`.
  - Optional `name`.
  - Hashes password with bcrypt.
  - Creates user.
  - Returns JWT and public user object.

- `POST /login`
  - Requires `email` and `password`.
  - Verifies password.
  - Returns JWT and public user object.

- `GET /me`
  - Protected.
  - Returns the authenticated user.

- `DELETE /account`
  - Protected.
  - Deletes all playlists for the user.
  - Deletes the user account.

### Playlist Routes

Base path: `/api/playlists`

All routes are protected.

- `GET /`
  - Returns playlists for current user, newest first.

- `POST /`
  - Creates playlist.
  - Requires non-empty `genre`.
  - Optional `name`.
  - Optional validated `songs` array.
  - Auto-numbers unnamed playlists by genre.

- `PUT /:id`
  - Updates `name`, `isFavorite`, and/or `songs`.
  - Validates all mutable fields.

- `POST /:id/songs`
  - Adds a validated song to a playlist.
  - Rejects duplicate song IDs.

- `DELETE /:id/songs/:songId`
  - Removes a song from a playlist.

- `DELETE /:id`
  - Deletes a playlist.

### Gemini Route

Base path: `/api/gemini`

- `POST /chat`
  - Protected.
  - Requires non-empty `prompt`.
  - Optional `playlistName`.
  - Optional `genre`.
  - Builds an exclusion list from all existing user playlist songs.
  - Parses count phrases like `20 songs` or `15 tracks`.
  - Caps requested count at 30.
  - Calls Gemini through `server/services/gemini.js`.
  - Resolves songs to YouTube IDs when possible.
  - Creates and returns a MongoDB playlist.

### YouTube Search Route

Base path: `/api/youtube`

- `GET /genre/:genre`
  - Query params:
    - `language`
    - `maxResults`
  - Uses YouTube Data API if configured.
  - Falls back to static song database otherwise.

- `GET /search`
  - Query params:
    - `q`
    - `genre`
    - `maxResults`
  - Uses YouTube Data API if configured.
  - Falls back to static search otherwise.

### YouTube Sync Routes

Base path: `/api/youtube-sync`

- `GET /oauth/start?token=<jwt>`
  - Starts Google OAuth consent flow.

- `GET /oauth/callback`
  - Handles Google OAuth response.
  - Stores Google tokens on the user record.
  - Redirects to `CLIENT_URL`.

- `GET /status`
  - Protected.
  - Returns whether the user has connected YouTube.

- `DELETE /disconnect`
  - Protected.
  - Clears stored Google tokens.

- `POST /sync/:playlistId`
  - Protected.
  - Creates private YouTube playlist.
  - Adds playlist songs to YouTube.
  - Returns sync counts and YouTube playlist URL.

## Frontend Details

### Routing

`src/App.tsx`

- Uses `BrowserRouter`.
- `/` route renders `HomePage` only when authenticated.
- `/login` route renders `LoginPage` only when unauthenticated.
- Calls `restoreSession()` on startup to validate stored token.

### Auth Store

`src/store/authStore.ts`

State:

- `isAuthenticated`
- `user`
- `token`

Actions:

- `login`
- `register`
- `deleteAccount`
- `logout`
- `restoreSession`

Persistence:

- Stores auth object in `localStorage` under `playlist-manager:auth`.

### Playlist Store

`src/store/index.ts`

State:

- `playlists: Map<string, Playlist>`
- `languagePreference`
- `isLoading`

Actions:

- `fetchPlaylists`
- `createPlaylist`
- `deletePlaylist`
- `addSongToPlaylist`
- `removeSongFromPlaylist`
- `toggleFavorite`
- `updatePlaylistName`
- `setLanguagePreference`

Selectors:

- `getAllPlaylists`
- `getFavoritePlaylists`
- `getPlaylistsByGenre`
- `getPlaylistByGenre`

### API Client

`src/services/api.ts`

- Reads `VITE_API_BASE_URL`.
- Reads JWT from localStorage.
- Sends `Authorization: Bearer <token>`.
- Exposes typed methods for:
  - auth
  - playlists
  - YouTube search
  - YouTube sync
  - Gemini chat

Exported API DTOs:

- `ApiUser`
- `ApiPlaylist`
- `YouTubeSyncResult`

### Main UI Components

- `LoginPage`: login/register form.
- `HomePage`: main app shell, toolbar, tabs, account controls, delete account flow.
- `PlaylistCreationPanel`: creates AI-backed genre/language playlists.
- `AIChatPanel`: natural-language AI playlist generator.
- `SearchPanel`: searches songs and adds them to playlists.
- `MyPlaylistsSection`: all playlists view.
- `FavoritesSection`: favorite playlists view.
- `GenreSection`: grouped-by-genre view.
- `PlaylistCard`: accordion card with rename, favorite, delete, play, YouTube sync.
- `SongItem`: song row display and removal.
- `AddCustomSongDialog`: manual custom song input.
- `ConfirmationDialog`: reusable confirmation modal.

## TypeScript Models

`src/models/index.ts`

### `Song`

- `id`
- `title`
- `artist`
- `genre`
- `language`
- `duration`
- `isCustom`
- `youtubeId`
- `metadata`

### `Playlist`

- `id`
- `name`
- `genre`
- `songs`
- `isFavorite`
- `createdAt`
- `updatedAt`

### Other Types

- `ApplicationState`
- `SearchFilters`

## Testing

Current test structure:

- `src/test/setup.ts`
  - Sets up `@testing-library/jest-dom`.
  - Provides a shared mocked backend API for frontend unit tests.

- `src/services/PlaylistService.test.ts`
  - Tests playlist service validation and store coordination.

- `src/store/index.test.ts`
  - Tests async API-backed playlist store behavior.

- Component tests:
  - `ConfirmationDialog.test.tsx`
  - `FavoritesSection.test.tsx`
  - `GenreSection.test.tsx`
  - `MyPlaylistsSection.test.tsx`
  - `PlaylistCard.test.tsx`
  - `SongItem.test.tsx`
  - `HomePage.test.tsx`

- Miscellaneous:
  - `example.test.ts`
  - `fast-check.test.ts`

Removed stale tests and legacy helpers:

- `SearchService.ts`
- `YouTubeAPIService.ts`
- `utils/storage.ts`
- related tests

## Commands

Install dependencies:

```bash
npm install
```

Start backend:

```bash
npm run server
```

Start frontend:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Test:

```bash
npm test
```

Lint:

```bash
npm run lint
```

Format:

```bash
npm run format
```

Windows PowerShell equivalents:

```bash
npm.cmd run server
npm.cmd run dev
npm.cmd run build
npm.cmd test
npm.cmd run lint
```

## Current Git State Note

At the time this handoff was generated, the workspace had uncommitted changes from stabilization and cleanup work. The project is connected to GitHub:

```text
origin https://github.com/TanmayManiyar/Harmonia-AI-powered-playlist-manager.git
branch master tracking origin/master
```

Recommended before further work:

1. Review the diff.
2. Commit the cleanup/stabilization batch.
3. Rotate any exposed API/OAuth secrets.
4. Run a real browser end-to-end test.

## Known Constraints And Important Notes

- Do not commit `.env`.
- Real Google/API keys should be rotated if they were exposed.
- YouTube OAuth requires Google Cloud redirect URI configuration.
- MongoDB must be running before backend startup.
- Gemini generation requires `GEMINI_API_KEY`.
- YouTube live search requires `YOUTUBE_API_KEY`.
- YouTube sync requires Google OAuth credentials and connected user tokens.
- Tests use mocked frontend API calls and do not require a live backend.
- Backend route syntax has been checked with `node --check`.

## Suggested Next Development Tasks

1. Commit the current cleanup work.
2. Rotate secrets in Google Cloud/API dashboards.
3. Add integration tests for backend routes with an in-memory MongoDB or test database.
4. Add UI loading/error states for session restoration.
5. Add a production deployment config guide.
6. Add richer backend validation with a schema library such as Zod or Joi.
7. Add rate limiting for auth and AI endpoints.
8. Add refresh-token handling tests for YouTube sync.
9. Add a real E2E test path for login -> create AI playlist -> sync or play.
10. Add user-facing error messages for missing API key configuration.

## Short Version For ChatGPT

Harmonia is a React 18 + TypeScript + Vite frontend with Zustand stores and an Express 5 + MongoDB/Mongoose backend. It supports JWT auth, MongoDB playlist persistence, Gemini-powered playlist generation, YouTube Data API song search/hydration, and Google OAuth YouTube playlist sync. The frontend talks to the backend through `src/services/api.ts`; the backend routes live under `server/routes`; shared auth middleware is in `server/middleware/authenticate.js`; request validation helpers are in `server/utils/validation.js`. The project currently passes tests, build, and lint. Secrets are excluded and must not be shared.
