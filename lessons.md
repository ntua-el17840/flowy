# Flowy Development Lessons

> Document fixes, workarounds, and important learnings to prevent repeating mistakes.

## Common Issues & Solutions

### Extension Development

#### Chrome Commands API Undefined Error
**Issue**: `Uncaught TypeError: Cannot read properties of undefined (reading 'onCommand')` in background script  
**Solution**: Configure commands in package.json manifest section, not separate manifest.json file  
**Date**: Current implementation  
**Files**: `package.json`, `background.ts`  
**Details**: 
- Plasmo generates manifest from package.json, not separate manifest.json file
- Commands must be declared in package.json under `"manifest": { "commands": {...} }`
- Add safety check: `if (chrome.commands && chrome.commands.onCommand)` before using
- Required permissions: `["activeTab", "storage", "tabs"]`

#### React Infinite Re-render Loop
**Issue**: `Warning: Maximum update depth exceeded` caused by useEffect dependencies  
**Solution**: Use useCallback to stabilize function references and prevent unnecessary re-renders  
**Date**: Current implementation  
**Files**: `CommandPalette.tsx`, `WebSearchPalette.tsx`, `ToolFinderPalette.tsx`  
**Details**: 
- Problem: onQueryChange function was recreated on every render, causing useEffect to run infinitely
- Solution: Wrap functions with useCallback and proper dependency arrays
- Key pattern: `const handler = useCallback((param) => { /* logic */ }, [dependencies])`

#### Content Script Element Type Invalid Error
**Issue**: `Element type is invalid: expected a string or class/function but got: undefined`  
**Solution**: Ensure proper imports and error handling in content script  
**Date**: Current implementation  
**Files**: `content.tsx`  
**Details**: 
- Add console.log for debugging message reception
- Use useCallback for message handlers to prevent re-creation
- Add error handling for database operations: `.catch(console.error)`
- Improve overlay styling with `cssText` and `!important` declarations

#### Content Script Overlay Positioning Issues
**Issue**: Search overlay appearing in wrong position or not visible  
**Solution**: Improve CSS styling with forced positioning and visibility control  
**Date**: Current implementation  
**Files**: `content.tsx`  
**Details**: 
- Use `cssText` with `!important` declarations to override page styles
- Control visibility with `display: none/block` in addition to `pointerEvents`
- Set proper z-index: `2147483647` (maximum)
- Add system font family to prevent font inheritance issues

#### Invalid Keyboard Shortcut Format
**Issue**: `Invalid value for 'commands[1].default': Ctrl+Alt+Space - Could not load manifest`  
**Solution**: Use valid Chrome extension shortcut combinations only  
**Date**: Current implementation  
**Files**: `package.json`  
**Details**: 
- Chrome only accepts specific modifier combinations: `Ctrl+[key]`, `Alt+[key]`, `Ctrl+Shift+[key]`, `Alt+Shift+[key]`
- `Ctrl+Alt+[key]` is NOT a valid combination
- Changed from `Ctrl+Alt+Space` to `Ctrl+Shift+Space` for tool finder
- Web search remains `Ctrl+Space`

#### Global Keyboard Shortcuts Implementation
**Issue**: Keyboard shortcuts (Ctrl+Space) not working globally across web pages  
**Solution**: Use chrome.commands API with content scripts to inject overlay on active tabs  
**Date**: Current implementation  
**Files**: `background.ts`, `content.tsx`, `manifest.json`  
**Details**: 
- Background script listens for commands and sends messages to active tab
- Content script creates overlay and handles search palette injection
- CommandPalette needs `pointerEvents: 'auto'` when active

#### CommandPalette Direct Search
**Issue**: Unable to search with typed query when no suggestions available  
**Solution**: Add onDirectSearch prop to allow Enter key to search with current query  
**Date**: Current implementation  
**Files**: `CommandPalette.tsx`, `WebSearchPalette.tsx`  
**Details**: When no suggestions match, pressing Enter triggers direct search with typed text

#### Content Script Overlay Pointer Events
**Issue**: Overlay blocking page interactions when not active  
**Solution**: Dynamically set `pointerEvents: 'none'` when inactive, `'auto'` when active  
**Date**: Current implementation  
**Files**: `content.tsx`, `CommandPalette.tsx`

#### Plasmo Build Issues
**Issue**: Build failures with TypeScript strict mode  
**Solution**: Ensure all types are properly defined, especially for Chrome extension APIs  
**Date**: Initial setup  
**Files**: `background.ts`, `popup.tsx`

#### Hot Module Replacement (HMR) Performance
**Issue**: Slow HMR on initial setup  
**Solution**: Optimize Tailwind configuration and reduce watch file scope  
**Date**: Initial setup  
**Files**: `tailwind.config.js`, `vite.config.ts`

#### Chrome Extension Manifest V3 Compatibility
**Issue**: Service worker background scripts vs persistent background pages  
**Solution**: Use Chrome extension manifest V3 patterns with service workers  
**Date**: Initial setup  
**Files**: `manifest.json`, `background.ts`

### Database & Storage

#### Dexie IndexedDB Setup
**Issue**: Database schema migrations and type safety  
**Solution**: Define clear interfaces and use Dexie's migration system  
**Date**: Phase 0  
**Files**: `src/lib/db.ts`, `src/types/`

#### Chrome Storage API Sync
**Issue**: Storage quota limits and sync conflicts  
**Solution**: Use local storage for large data, sync storage only for settings  
**Date**: Phase 1  
**Files**: `background.ts`, storage service layer

### Testing Setup

#### Vitest Configuration with Plasmo
**Issue**: Module resolution conflicts between Vitest and Plasmo  
**Solution**: Separate vitest config with proper path mapping  
**Date**: Phase 0  
**Files**: `vitest.config.ts`

#### Playwright E2E with Extension
**Issue**: Loading unpacked extension in Playwright tests  
**Solution**: Use Playwright's extension testing features  
**Date**: Phase 0  
**Files**: `playwright.config.ts`, `e2e/` tests

### UI & Styling

#### Tailwind CSS v4 Integration
**Issue**: Breaking changes from Tailwind v3 to v4  
**Solution**: Update configuration syntax and class names  
**Date**: Initial setup  
**Files**: `tailwind.config.js`, `postcss.config.js`

#### Dark Mode Implementation
**Issue**: Inconsistent dark mode across components  
**Solution**: Use Tailwind's class-based dark mode with proper state management  
**Date**: Phase 0  
**Files**: `tailwind.config.js`, component files

#### Dark Blue Command Palette Styling
**Issue**: Default styling didn't match desired dark blue theme  
**Solution**: Implement custom dark blue color scheme with proper contrast  
**Date**: Current implementation  
**Files**: `CommandPalette.tsx`, `popup.tsx`  
**Details**: 
- Background: `#0f172a` (slate-900) with 95% opacity overlay
- Main container: `#1e293b` (slate-800)
- Input field: `#374151` (gray-700)
- Selected item: `#3b82f6` (blue-500)
- Text colors: `#f1f5f9` (slate-100), `#cbd5e1` (slate-300), `#64748b` (slate-500)
- Added `isPopup` prop to render differently in popup vs overlay mode

#### Enter Key Direct Search Not Working
**Issue**: Pressing Enter with typed text didn't trigger search when no suggestions matched  
**Solution**: Add fallback logic in CommandPalette Enter key handler  
**Date**: Current implementation  
**Files**: `CommandPalette.tsx`  
**Details**: 
- Added fallback: if no suggestion selected and query exists, trigger direct search
- If onDirectSearch not provided, fallback to Google search with chrome.tabs.create
- Ensures Enter always works for web search even without suggestions

#### Popup Interface Consistency
**Issue**: Popup didn't always show search interface when opened  
**Solution**: Default popup to web search mode and add navigation tabs  
**Date**: Current implementation  
**Files**: `popup.tsx`  
**Details**: 
- Set default palette state to 'web' instead of null
- Added header with Search/Tools/Colors navigation tabs
- Popup version uses `isPopup={true}` prop for embedded styling
- Consistent dark blue theme across popup and overlay modes

#### Extension Context Invalidated Error
**Issue**: "Extension context invalidated" error when extension reloads while content scripts are running  
**Solution**: Add comprehensive error handling and graceful cleanup  
**Date**: Current implementation  
**Files**: `content.tsx`, `WebSearchPalette.tsx`, `CommandPalette.tsx`  
**Details**: 
- Added try-catch blocks around all chrome.runtime and chrome.storage calls
- Graceful cleanup in useEffect return functions
- Error logging for debugging without breaking functionality
- Handle chrome.runtime.lastError in storage operations

#### Chrome Tabs API Access in Content Scripts
**Issue**: `chrome.tabs.create()` doesn't work in content scripts, only background scripts  
**Solution**: Use message passing to background script for tab creation  
**Date**: Current implementation  
**Files**: `CommandPalette.tsx`, `WebSearchPalette.tsx`, `background.ts`  
**Details**: 
- Replace direct `chrome.tabs.create()` calls with `chrome.runtime.sendMessage()`
- Send `{type: 'OPEN_TAB', url: searchUrl}` messages to background
- Background script handles OPEN_TAB messages and creates tabs
- Added error handling for failed message sending

#### Chrome Action OpenPopup API Availability
**Issue**: `chrome.action.openPopup()` appeared to be restricted to policy-installed extensions  
**Solution**: API is now officially available in Chrome 127+ without restrictions  
**Date**: December 2024  
**Files**: `background.ts`  
**Details**: 
- API became available in Chrome 127 (July 2024) for all extensions
- No longer requires policy installation or experimental flags
- Must handle specific error cases like "Browser window has no toolbar"
- Requires proper error handling and fallback strategies

#### Chrome Action OpenPopup "Browser Window Has No Toolbar" Error
**Issue**: `chrome.action.openPopup()` fails with "Browser window has no toolbar" error even on normal windows  
**Solution**: API is available in Chrome 127+ but requires proper browser window with toolbar state  
**Date**: December 2024  
**Files**: `background.ts`  
**Key Discovery**: The API IS available without restrictions in Chrome 127+, confirmed by Google Chrome team  
**Details**: 
- API became available in Chrome 127 (July 2024) for all extensions without policy requirements
- Error "Browser window has no toolbar" indicates the current window doesn't meet toolbar requirements
- Solution: Check window type and create new normal browser window if needed
- Use `chrome.windows.create({ type: 'normal', state: 'normal' })` to ensure proper toolbar
- Wait for window initialization before calling `chrome.action.openPopup({ windowId: newWindow.id })`
- Fallback: Create maximized window or open popup.html directly in new window
- This is NOT a permanent limitation - it's a window state requirement that can be solved

#### Tool Selection to Extension Popup Navigation
**Issue**: When selecting a tool from Ctrl+Shift+Space palette, user wanted it to open the extension popup with that tool already selected  
**Solution**: Implement cross-context communication using storage and popup navigation  
**Date**: Current implementation  
**Files**: `ToolFinderPalette.tsx`, `background.ts`, `popup.tsx`  
**Details**: 
- ToolFinderPalette sends `{type: 'OPEN_POPUP_WITH_TOOL', toolId: action.id}` message to background
- Background script stores toolId in chrome.storage.local and attempts chrome.action.openPopup()
- Popup component checks for stored toolId on mount using `GET_SELECTED_TOOL` message
- If toolId found, popup automatically navigates to Tools tab and selects the tool
- Background clears stored toolId after retrieval to prevent persistence
- Fallback handling when chrome.action.openPopup() fails (user interaction required)
- Fixed TypeScript linter errors by using type-only imports for Action and SearchEngine types

#### React Component Undefined Error in Content Script
**Issue**: "Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: undefined" error in content script  
**Solution**: Use type-only imports for TypeScript types across all components  
**Date**: Current implementation  
**Files**: `content.tsx`, `WebSearchPalette.tsx`, `popup.tsx`, `ToolFinderPalette.tsx`  
**Details**: 
- Error occurs when TypeScript types are imported as regular imports instead of type-only imports
- Changed `import { Action }` to `import type { Action }` in content.tsx
- Changed `import { SearchEngine } from 'types'` to `import type { SearchEngine }` in WebSearchPalette.tsx
- Pattern: Use `import type { TypeName }` for TypeScript interfaces and types
- Use regular `import { ComponentName }` for React components and functions
- After making changes, rebuild extension with `pnpm run build` and reload in browser

#### Command Palette Layout Optimization
**Issue**: Search box needed to be more compact and take full available width  
**Solution**: Optimize padding, font sizes, and layout spacing for slimmer appearance  
**Date**: Current implementation  
**Files**: `CommandPalette.tsx`  
**Details**: 
- Reduced container padding from `p-4` to `p-2`
- Reduced input padding from `px-4 py-3` to `px-3 py-2`
- Reduced input font size from `18px` to `16px`
- Reduced suggestion items padding from `px-4 py-2` to `px-3 py-1.5`
- Reduced suggestion font size from `16px` to `14px`
- Reduced minimum width from `580px` to `520px`
- Search box already takes full width with `flex-1` class

#### React Component Type Invalid Error During Search
**Issue**: "Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: undefined" error when using search functionality  
**Solution**: Fixed Action interface and optimized component dependencies  
**Date**: Current implementation  
**Files**: `types/action.ts`, `ToolFinderPalette.tsx`, `content.tsx`  
**Details**: 
- Added missing `description?: string` field to Action interface
- Removed unused `useRef` import from ToolFinderPalette
- Removed unused `selectedIndex` state variable
- Replaced dependency array in useEffect with `useMemo` for sortedTools to prevent infinite loops
- Added error handling and console logging to track component rendering issues
- Issue may also be related to HMR (Hot Module Reload) during development

#### Tool Interface System Implementation
**Issue**: Need to implement actual tool functionality when users click on tools instead of just console logging  
**Solution**: Created dynamic tool interface system with ColorPicker as first implementation  
**Date**: Current implementation  
**Files**: `popup.tsx`, `ToolFinderPalette.tsx`, `ColorPicker.tsx`  
**Details**: 
- Added `activeTool` state to popup to track which tool is currently open
- Modified ToolFinderPalette to accept `onToolSelect` callback for popup mode
- Integrated existing ColorPicker component with modern dark theme styling
- Added color clipboard functionality with visual feedback
- Added "Coming Soon" placeholder for tools not yet implemented
- ColorPicker uses native EyeDropper API with browser compatibility checking
- Recent colors are stored in Dexie database and displayed in grid layout
- Automatic clipboard copying with 2-second success notification

#### ColorPicker Real-time State Updates
**Issue**: Newly picked colors only appeared in Recent Colors after reopening the extension  
**Solution**: Update local state immediately after color selection and database save  
**Date**: Current implementation  
**Files**: `ColorPicker.tsx`  
**Details**: 
- Added immediate state update after saving new color to database
- New colors appear at the top of Recent Colors list instantly
- Duplicate colors are removed and moved to front when re-selected
- Maintains limit of 20 recent colors in both state and database
- Clicking existing recent colors moves them to the front for better UX

#### Search API CORS and Fetch Errors
**Issue**: "Failed to fetch" errors for search suggestion APIs  
**Solution**: Add proper error handling and fallback behavior  
**Date**: Current implementation  
**Files**: `WebSearchPalette.tsx`, `search.ts`  
**Details**: 
- Added `.catch()` handlers for all fetch operations
- Set empty suggestions array on fetch failure
- Console error logging for debugging
- Graceful degradation when suggestions unavailable

#### Google Search API CORS Restrictions
**Issue**: Google's suggestion API blocks cross-origin requests from browser extensions  
**Solution**: Implement local suggestion generation as primary method  
**Date**: Current implementation  
**Files**: `search.ts`, `settings.ts`, `package.json`  
**Details**: 
- Replaced external API calls with local suggestion generation
- Generate contextual suggestions like "what is {query}", "how to {query}"
- Added specific host permissions for future API usage
- Fallback system maintains full functionality without external dependencies
- Alternative Google endpoint (clients1.google.com) available for future use

#### React Component Export Issues in Plasmo
**Issue**: "Element type is invalid" errors due to missing default export  
**Solution**: Add proper default export for Plasmo framework compatibility  
**Date**: Current implementation  
**Files**: `content.tsx`  
**Details**: 
- Added `export default ContentApp` to content script
- Plasmo requires default export for content script components
- Maintains existing named exports for internal usage

#### Search Input Autofocus Enhancement
**Issue**: Search input not automatically focused when opening overlay with Ctrl+Space  
**Solution**: Implement multi-layered autofocus strategy  
**Date**: Current implementation  
**Files**: `CommandPalette.tsx`, `content.tsx`  
**Details**: 
- Added `autoFocus` prop to both input elements (popup and overlay)
- Immediate focus attempt on component mount
- Backup focus attempts at 50ms and 200ms intervals
- Content script ensures focus when overlay becomes visible
- Input text selection for better UX (can immediately start typing)
- Multiple focus strategies ensure reliability across different timing scenarios

### API Integration

#### CORS Issues with Search APIs
**Issue**: Cross-origin requests blocked in extension context  
**Solution**: Use host_permissions in manifest and CORS-friendly endpoints  
**Date**: Phase 1  
**Files**: `manifest.json`, search service files

#### Search API Rate Limiting
**Issue**: Too many requests to search suggestion APIs  
**Solution**: Implement proper debouncing (300ms) and request cancellation  
**Date**: Phase 1  
**Files**: Search components, debounce utilities

#### Search Engine Response Formats
**Issue**: Different response formats from Google, DuckDuckGo, and Bing APIs  
**Solution**: Handle each format specifically in fetchSearchSuggestions  
**Date**: Current implementation  
**Files**: `src/lib/services/search.ts`  
**Details**: 
- Google: `[query, [suggestions]]`
- DuckDuckGo: `[{phrase: "suggestion"}]`
- Bing: `[query, [suggestions]]`

### Performance Optimization

#### Command Palette Response Time
**Issue**: Slow palette opening on older hardware  
**Solution**: Lazy load components and optimize bundle size  
**Date**: Phase 1  
**Files**: Component lazy loading patterns

#### Memory Leaks in Event Listeners
**Issue**: Event listeners not properly cleaned up  
**Solution**: Use proper cleanup in useEffect hooks and component unmount  
**Date**: Ongoing  
**Files**: All components with event listeners

## Development Workflow Lessons

### Git Hooks & Code Quality
**Learning**: Pre-commit hooks catch issues early but should be fast  
**Implementation**: Husky with incremental linting and formatting  
**Files**: `.husky/`, package.json scripts

### Monorepo Management
**Learning**: PNPM workspaces require careful dependency management  
**Implementation**: Use workspace protocols for internal dependencies  
**Files**: `package.json`, `pnpm-workspace.yaml`

### CI/CD Pipeline
**Learning**: Cache pnpm store for faster builds, run tests in parallel  
**Implementation**: GitHub Actions with matrix strategy  
**Files**: `.github/workflows/ci.yml`

## Architecture Decisions

### State Management
**Decision**: Use React local state + Dexie for persistence  
**Reasoning**: Avoid complexity of Redux for extension scope  
**Trade-offs**: Manual sync between components, but simpler debugging

### Component Library Choice
**Decision**: Build custom components with Tailwind  
**Reasoning**: Smaller bundle size, full design control  
**Trade-offs**: More development time, but better performance

### TypeScript Configuration
**Decision**: Strict mode enabled across all packages  
**Reasoning**: Better type safety and developer experience  
**Trade-offs**: More initial setup time, but fewer runtime errors

## Future Improvements

### Error Handling
- [ ] Implement global error boundary
- [ ] Add Sentry integration for production error tracking
- [ ] Create user-friendly error messages

### Performance Monitoring
- [ ] Add performance budgets to CI
- [ ] Implement metrics collection for palette response times
- [ ] Monitor bundle size growth

### Testing Coverage
- [ ] Achieve >90% test coverage for critical paths
- [ ] Add visual regression testing
- [ ] Implement load testing for search APIs

## Quick Reference

### Commands
```bash
# Fresh install
pnpm install

# Development
pnpm dev:extension  # Start extension dev server
pnpm dev:web       # Start web app dev server

# Testing  
pnpm test          # Run all tests
pnpm test:e2e      # Run E2E tests only

# Build
pnpm build:extension  # Production extension build
pnpm package         # Create .crx file
```

### Debugging
- **Extension**: Chrome DevTools → Extensions → Inspect views
- **Background Script**: chrome://extensions → Inspect service worker
- **Database**: DevTools → Application → IndexedDB → flowy-db

### Performance Testing
- **HMR Speed**: `pnpm measure:hmr` (custom script)
- **Bundle Size**: Check build/ folder after `pnpm build`
- **Palette Speed**: Use DevTools Performance tab 