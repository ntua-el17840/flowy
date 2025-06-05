# Flowy Technical Documentation

## Project Overview

Flowy is a multi-platform productivity suite consisting of:
- **Browser Extension**: Quick access tools with keyboard shortcuts
- **Web Application**: Full-featured online tool suite
- **Shared Library**: Common utilities and types

## Architecture

### Monorepo Structure
- **PNPM Workspaces**: Manages dependencies across packages
- **Shared Package**: Common utilities, types, and business logic
- **Extension Package**: Browser extension using Plasmo framework
- **Web Package**: React-based web application

### Browser Extension Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Background    │    │     Popup       │    │   Content       │
│  Service Worker │◄──►│   React App     │    │    Scripts      │
│                 │    │                 │    │                 │
│ • Hotkey Listen │    │ • Command Pal.  │    │ • DOM Interact. │
│ • Chrome APIs   │    │ • Tool Launcher │    │ • Eye Dropper   │
│ • DB Sync       │    │ • Settings      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
           │                       │                       │
           └───────────────────────┼───────────────────────┘
                                   │
                        ┌─────────────────┐
                        │   Dexie DB      │
                        │                 │
                        │ • Actions       │
                        │ • Settings      │
                        │ • Color History │
                        └─────────────────┘
```

## Tech Stack

### Core Technologies
- **Framework**: React 18.2.0 with TypeScript
- **Extension Framework**: Plasmo 0.90.5
- **Package Manager**: PNPM 10.11.1
- **Build Tool**: Vite (via Plasmo)

### Styling & UI
- **CSS Framework**: Tailwind CSS 4.1.8
- **PostCSS**: Autoprefixer integration
- **Design System**: Custom brand palette with dark mode support

### Database & Storage
- **Local Storage**: Dexie (IndexedDB wrapper) 4.0.11
- **Sync Storage**: Chrome Storage API
- **Data Models**: TypeScript interfaces for type safety

### Development Tools
- **Testing**: 
  - Unit Tests: Vitest 3.2.1
  - E2E Tests: Playwright 1.52.0
  - Testing Library: React Testing Library 16.3.0
- **Code Quality**:
  - Linting: ESLint with TypeScript rules
  - Formatting: Prettier 3.2.4
  - Git Hooks: Husky for pre-commit checks

### Search & Navigation
- **Fuzzy Search**: Fuse.js 7.1.0
- **Hotkeys**: hotkeys-js 3.13.10
- **Type-ahead**: Debounced search with API integration

## Key Features Implemented

### Phase 0 - Infrastructure ✅
- [x] Repository setup with PNPM workspaces
- [x] Plasmo + Vite scaffold with HMR
- [x] Tailwind design system with dark mode
- [x] ESLint + Prettier + Husky setup
- [x] Dexie database with actions/settings tables
- [x] Vitest + Playwright testing setup
- [x] GitHub Actions CI pipeline

### Phase 1 - Command Palette ✅
- [x] **Keyboard Shortcuts**: Ctrl+Space (web search), Ctrl+Alt+Space (tools)
- [x] **Universal Command Palette**: Reusable component with arrow navigation
- [x] **Web Search Integration**: Google, DuckDuckGo, Bing with type-ahead
- [x] **Tool Search**: Fuzzy search over available actions
- [x] **Storage Sync**: Chrome storage integration

### Phase 2 - Tools (Partial)
- [x] **Color Picker**: Native EyeDropper API with fallback
- [ ] PDF Operations (planned)
- [ ] Image/Video editing (planned)

## Database Schema

### Actions Table
```typescript
interface Action {
  id: string;           // Unique identifier
  name: string;         // Display name
  handler: string;      // Function to execute
  shortcut?: string;    // Keyboard shortcut
  tags: string[];       // Search tags
  category: string;     // Tool category
  createdAt: Date;      // Creation timestamp
  lastUsed?: Date;      // Last usage timestamp
}
```

### Settings Table
```typescript
interface Settings {
  id: string;           // Setting key
  value: any;           // Setting value
  updatedAt: Date;      // Last update timestamp
}
```

## API Integrations

### Search Engines
- **Google**: `https://suggestqueries.google.com/complete/search?client=chrome&q={q}`
- **DuckDuckGo**: `https://ac.duckduckgo.com/ac/?q={q}&type=list`
- **Bing**: `https://api.bing.com/osjson.aspx?query={q}`

All integrations use CORS-friendly endpoints without API keys.

## Development Guidelines

### Code Style
- **TypeScript**: Strict mode enabled
- **React**: Functional components with hooks
- **File Naming**: PascalCase for components, camelCase for utilities
- **Import Order**: External deps → Internal deps → Relative imports

### Testing Strategy
- **Unit Tests**: Component logic and utilities
- **Integration Tests**: Database operations and API calls
- **E2E Tests**: User workflows and keyboard shortcuts
- **Performance Tests**: HMR speed and palette response time

### Performance Requirements
- **HMR**: < 2 minutes on Intel i3
- **Palette Open**: < 120ms (p90)
- **Search Response**: < 300ms debounced

## Build & Deployment

### Development
```bash
# Install dependencies
pnpm install

# Start extension development
pnpm dev:extension

# Start web app development  
pnpm dev:web

# Run tests
pnpm test
```

### Production
```bash
# Build extension
pnpm build:extension

# Build web app
pnpm build:web

# Package extension
pnpm --filter @flowy/extension package
```

### CI/CD Pipeline
- **Triggers**: Push to main, Pull requests
- **Steps**: Install → Lint → Test → Build
- **Artifacts**: Extension .crx file, Web app bundle
- **Cache**: PNPM store for faster builds

## Security Considerations

### Extension Permissions
- **Host Permissions**: `https://*/*` for search suggestions
- **Storage**: Local and sync storage access
- **Active Tab**: For color picker functionality

### Data Privacy
- **Local Storage**: All user data stored locally
- **Sync Storage**: Only settings synced across devices
- **No Analytics**: No user data transmitted to external services

## Future Architecture Plans

### Phase 3 - Web Application
- **Authentication**: OAuth with Google/GitHub
- **Backend**: Node.js with Express or Fastify
- **Database**: PostgreSQL with Prisma ORM
- **Deployment**: Vercel/Netlify with serverless functions
- **Real-time**: WebSockets for collaborative features

### Shared Components Migration
- Extract common UI components to `@flowy/shared`
- Implement design system tokens
- Create unified theming system
- Add i18n support with react-i18next 