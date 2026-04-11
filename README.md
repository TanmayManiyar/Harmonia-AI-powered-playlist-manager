# Harmonia- AI powered playlist manager

A web application for organizing and managing music playlists with genre-based organization and real-time song search powered by YouTube Data API.

## Features

- Create genre-based playlists with auto-populated songs
- Real-time song search using YouTube Data API v3
- Organize playlists by genre, favorites, and custom collections
- Add custom songs manually
- Language preference for playlist curation
- Dark theme with smooth animations
- Cross-section consistency with reactive state management

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **Routing**: React Router v6
- **Testing**: Vitest + React Testing Library + fast-check (property-based testing)
- **Code Quality**: ESLint + Prettier with TypeScript strict mode

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- YouTube Data API v3 key (see setup instructions below)

### YouTube API Setup

To enable real-time song search, you need a YouTube Data API key:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3
4. Create credentials (API Key)
5. Copy the API key

For detailed instructions, see [YOUTUBE_API_SETUP.md](./YOUTUBE_API_SETUP.md)

### Installation

```bash
npm install
```

### Configuration

Create a `.env` file in the root directory:

```bash
VITE_YOUTUBE_API_KEY=your_api_key_here
```

See `.env.example` for reference.

### Development

```bash
npm run dev
```

The app will run at `http://localhost:5173`

### Build

```bash
npm run build
```

### Testing

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

### Linting and Formatting

```bash
# Lint code
npm run lint

# Format code
npm run format
```

## Project Structure

```
src/
├── components/        # Reusable UI components
├── models/            # Data models and type definitions
├── pages/             # Page components
├── services/          # Business logic services
│   ├── PlaylistService.ts    # Playlist CRUD operations
│   ├── SearchService.ts      # Song search with YouTube API
│   └── YouTubeAPIService.ts  # YouTube Data API integration
├── store/             # State management (Zustand)
├── test/              # Test setup and utilities
├── utils/             # Utility functions (storage, etc.)
├── App.tsx            # Root application component
├── main.tsx           # Application entry point
└── index.css          # Global styles with dark theme
```

## Architecture

The application follows a layered architecture:

- **Presentation Layer**: React components with dark theme styling
- **Application Layer**: State management with Zustand
- **Service Layer**: Business logic services
- **Data Layer**: Local storage persistence
- **External API**: YouTube Data API v3 for song search

## How It Works

1. **Playlist Creation**: When you create a playlist, the app automatically searches YouTube for 10 popular songs in that genre
2. **Song Search**: Real-time search queries the YouTube Data API to find matching songs
3. **Data Storage**: All playlists are stored locally in browser localStorage
4. **State Management**: Zustand provides reactive state updates across all components

## License

MIT
