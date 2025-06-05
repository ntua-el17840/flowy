# Flowy Project File Structure

## Root Structure
```
flowy/
├── packages/
│   ├── extension/          # Browser extension (Plasmo)
│   ├── shared/            # Shared code between packages
│   └── web/               # Web application (React + Vite)
├── package.json           # Root package.json with workspace config
├── pnpm-workspace.yaml    # PNPM workspace configuration
├── pnpm-lock.yaml         # Dependency lock file
├── plan.md               # Project roadmap and task checklist
├── filestructure.md      # This file - project structure overview
├── documentation.md      # Technical documentation
├── lessons.md           # Development lessons and fixes
├── .gitignore           # Git ignore rules
└── LICENSE              # MIT license

```

## Extension Package (`packages/extension/`)
```
extension/
├── src/
│   ├── components/              # React components
│   │   ├── CommandPalette.tsx   # Universal command palette component
│   │   ├── ColorPicker.tsx      # Color picker tool component
│   │   ├── ToolFinderPalette.tsx # Tool search palette
│   │   └── WebSearchPalette.tsx  # Web search palette
│   ├── lib/
│   │   ├── db.ts               # Dexie database configuration
│   │   ├── services/           # Business logic services
│   │   └── hooks/              # Custom React hooks
│   ├── types/
│   │   ├── action.ts           # Action type definitions
│   │   └── settings.ts         # Settings type definitions
│   ├── test/                   # Test utilities and fixtures
│   ├── background.ts           # Service worker background script
│   ├── popup.tsx              # Extension popup UI
│   ├── popup.test.tsx         # Popup component tests
│   └── styles.css             # Global CSS with Tailwind imports
├── assets/                     # Static assets (icons, images)
├── e2e/                       # End-to-end tests (Playwright)
├── scripts/                   # Build and utility scripts
├── .github/                   # GitHub Actions workflows
├── .husky/                    # Git hooks
├── .plasmo/                   # Plasmo build artifacts
├── build/                     # Production build output
├── manifest.json             # Extension manifest
├── package.json              # Extension dependencies
├── tailwind.config.js        # Tailwind CSS configuration
├── postcss.config.js         # PostCSS configuration
├── tsconfig.json             # TypeScript configuration
├── vitest.config.ts          # Vitest test configuration
├── playwright.config.ts      # Playwright e2e test configuration
├── .eslintrc.js              # ESLint configuration
├── .prettierrc               # Prettier configuration
└── README.md                 # Extension-specific documentation
```

## Shared Package (`packages/shared/`)
```
shared/
├── src/                      # Shared utilities and types
├── package.json              # Shared package dependencies
└── README.md                 # Shared package documentation
```

## Web Application Package (`packages/web/`)
```
web/
├── src/                      # Web app source code
├── package.json              # Web app dependencies
└── README.md                 # Web app documentation
```

## Key Configuration Files

### Root Level
- **`package.json`**: Workspace configuration with scripts for all packages
- **`pnpm-workspace.yaml`**: Defines package workspace structure
- **`plan.md`**: Ultra-granular development checklist and roadmap

### Extension Specific
- **`manifest.json`**: Chrome extension manifest with permissions
- **`tailwind.config.js`**: Brand palette and design system configuration
- **`vitest.config.ts`**: Unit test configuration
- **`playwright.config.ts`**: E2E test configuration
- **`.eslintrc.js`**: Linting rules for code quality
- **`.prettierrc`**: Code formatting configuration

## Development Workflow Files
- **`.github/workflows/`**: CI/CD pipeline configurations
- **`.husky/`**: Git hooks for pre-commit linting and formatting
- **`scripts/`**: Custom build and development scripts

## Data Layer
- **`src/lib/db.ts`**: Dexie IndexedDB configuration with `actions` and `settings` tables
- **`src/types/`**: TypeScript type definitions for data models

## Testing Structure
- **`src/*.test.tsx`**: Unit tests co-located with components
- **`e2e/`**: End-to-end tests using Playwright
- **`src/test/`**: Test utilities, fixtures, and helpers 