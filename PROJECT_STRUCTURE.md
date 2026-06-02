# Project Structure

This document describes the current full-stack Harmonia project layout.

```text
harmonia/
  server/
    index.js                Express app entrypoint and MongoDB connection
    middleware/
      authenticate.js       Shared JWT authentication middleware
    models/
      User.js               Mongoose user model with password and Google tokens
      Playlist.js           Mongoose playlist and embedded song schemas
    routes/
      auth.js               Register, login, current user, account deletion
      playlists.js          Authenticated playlist and song CRUD
      geminiChat.js         AI playlist generation endpoint
      youtube.js            YouTube search and genre endpoints
      youtubeSync.js        Google OAuth and YouTube playlist sync
    services/
      gemini.js             Gemini prompt orchestration and JSON parsing
    utils/
      validation.js         Request body validation and normalization helpers

  src/
    App.tsx                 Route shell for login and authenticated app
    main.tsx                React entrypoint
    index.css               Global styles
    components/             Playlist, search, AI chat, dialog, and song UI
    pages/                  HomePage and LoginPage
    services/
      api.ts                Frontend API client for the Express backend
      PlaylistService.ts    Validation wrapper around playlist store actions
    store/
      authStore.ts          Auth state, token persistence, account deletion
      index.ts              Playlist state backed by the API client
    models/
      index.ts              Frontend TypeScript interfaces
    test/
      setup.ts              Test setup and backend API mock

  dist/                     Production build output
  package.json              Scripts and dependencies
  vite.config.ts            Vite and Vitest configuration
  tsconfig*.json            TypeScript configuration
  .eslintrc.cjs             ESLint configuration
  .env.example              Required environment variables template
```

## Runtime Responsibilities

- React handles the user interface, routing, and interactions.
- Zustand stores frontend auth and playlist state.
- `src/services/api.ts` sends authenticated requests to the backend.
- Express owns authentication, playlist persistence, AI generation, YouTube search, and YouTube sync.
- MongoDB is the source of truth for users, playlists, and Google OAuth tokens.

## Development Commands

```bash
npm run server
npm run dev
npm test
npm run lint
npm run build
```
