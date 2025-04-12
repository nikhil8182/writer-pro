# Writer Pro Project Structure

This project follows a logical, feature-based architecture that promotes maintainability and scalability.

## Directory Structure

```
src/
├── components/        # All React components
│   └── ui/            # UI components like ThemeSwitcher
├── contexts/          # Context providers
├── features/          # Feature modules
│   ├── editor/        # Editor feature
│   ├── config/        # Config feature
│   ├── history/       # History feature
│   ├── reply/         # Reply feature
│   └── todo/          # Todo feature
├── pages/             # Page-level components
├── services/          # API services
└── utils/             # Utility functions
```

## Features-Based Architecture

We use a feature-based architecture where each major feature has its own module under `src/features/`. This provides several advantages:

1. **Clear organization**: Each feature is self-contained
2. **Easier navigation**: Developers can quickly find feature-specific code
3. **Better maintainability**: Changes to one feature don't affect others
4. **Improved scalability**: New features can be added without modifying existing ones

## How to Use This Structure

### Importing Components

Instead of importing directly from the component file, import from the feature module:

```javascript
// OLD WAY
import Editor from './components/Editor';

// NEW WAY
import { Editor } from './features';
// OR
import Editor from './features/editor';
```

### Adding New Features

To add a new feature:

1. Create a directory under `src/features/` (e.g., `src/features/newFeature/`)
2. Add an `index.js` file that exports the feature's components
3. Update `src/features/index.js` to include the new feature

### UI Components

Reusable UI components that aren't tied to a specific feature should be placed in the `components/ui/` directory and imported from there.

## Working with Utilities

Common utilities have been extracted into a separate `utils/` directory:

- `aiInstructions.js`: Contains AI-related constants and utility functions

## Benefits of This Structure

This project structure provides the benefits of a feature-based architecture without requiring any file moves. It uses ES modules and re-exports to create a logical organization while maintaining the original file locations. 