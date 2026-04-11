# Project Structure

This document describes the directory structure and organization of the Playlist Manager application.

## Directory Layout

```
playlist-manager/
├── .kiro/                      # Kiro spec files
│   └── specs/
│       └── playlist-manager/
│           ├── requirements.md
│           ├── design.md
│           └── tasks.md
├── dist/                       # Build output (generated)
├── node_modules/               # Dependencies (generated)
├── src/                        # Source code
│   ├── adapters/              # Streaming service adapters
│   │   ├── SpotifyAdapter.ts
│   │   ├── StreamingServiceAdapter.ts
│   │   └── YouTubeMusicAdapter.ts
│   ├── components/            # Reusable UI components
│   │   ├── ConfirmationDialog.tsx
│   │   ├── PlaylistCard.tsx
│   │   └── SongItem.tsx
│   ├── models/                # Data models and type definitions
│   │   └── index.ts
│   ├── pages/                 # Page components
│   │   └── HomePage.tsx
│   ├── services/              # Business logic services
│   │   ├── ExportService.ts
│   │   ├── PlaylistService.ts
│   │   └── SearchService.ts
│   ├── store/                 # State management (Zustand)
│   │   └── index.ts
│   ├── test/                  # Test setup and utilities
│   │   ├── example.test.ts
│   │   ├── fast-check.test.ts
│   │   └── setup.ts
│   ├── utils/                 # Utility functions
│   │   └── storage.ts
│   ├── App.tsx                # Root application component
│   ├── index.css              # Global styles
│   └── main.tsx               # Application entry point
├── .eslintrc.cjs              # ESLint configuration
├── .gitignore                 # Git ignore rules
├── .prettierrc                # Prettier configuration
├── index.html                 # HTML entry point
├── package.json               # Project dependencies and scripts
├── PROJECT_STRUCTURE.md       # This file
├── README.md                  # Project documentation
├── tsconfig.json              # TypeScript configuration
├── tsconfig.node.json         # TypeScript config for Node files
└── vite.config.ts             # Vite build configuration
```

## Layer Responsibilities

### Presentation Layer (`src/components/`, `src/pages/`)
- React components for UI rendering
- User interaction handling
- Component-level state management
- Styling and layout

### Application Layer (`src/store/`)
- Global state management with Zustand
- State persistence
- State selectors and actions
- Single source of truth for application data

### Service Layer (`src/services/`)
- Business logic implementation
- Validation and error handling
- Orchestration of complex operations
- Integration with adapters

### Data Layer (`src/adapters/`, `src/utils/`)
- External API integrations
- Local storage operations
- Data transformation
- Low-level data access

### Models (`src/models/`)
- TypeScript interfaces and types
- Data structure definitions
- Type guards and validators

## File Naming Conventions

- **Components**: PascalCase with `.tsx` extension (e.g., `PlaylistCard.tsx`)
- **Services**: PascalCase with `.ts` extension (e.g., `PlaylistService.ts`)
- **Utilities**: camelCase with `.ts` extension (e.g., `storage.ts`)
- **Tests**: Same name as file being tested with `.test.ts` suffix (e.g., `example.test.ts`)
- **Types**: PascalCase interfaces/types in `models/index.ts`

## Configuration Files

- **tsconfig.json**: TypeScript strict mode enabled, path aliases configured
- **vite.config.ts**: Vite build configuration with Vitest setup
- **.eslintrc.cjs**: ESLint with TypeScript and React rules
- **.prettierrc**: Code formatting rules
- **package.json**: Dependencies and npm scripts

## Testing Structure

- Unit tests co-located with source files or in `src/test/`
- Property-based tests using fast-check
- Integration tests for end-to-end flows
- Test setup in `src/test/setup.ts`

## Build Output

- **dist/**: Production build output
- **dist/assets/**: Bundled JavaScript and CSS files
- **dist/index.html**: Entry HTML file

## Development Workflow

1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Run tests: `npm test`
4. Lint code: `npm run lint`
5. Format code: `npm run format`
6. Build for production: `npm run build`
