# AGENTS.md - Coding Guidelines for AI Agents

> This file contains essential information for AI agents working on this codebase.

## Project Overview

This is a **Taro + React + TypeScript** WeChat Mini Program project using:
- **Framework**: Taro 4.1.5 with React 18
- **State Management**: Zustand
- **Styling**: TailwindCSS with custom CSS variables
- **Backend**: Supabase
- **Icons**: Iconify (MDI, Lucide collections)

## Build/Lint Commands

```bash
# Primary validation command - USE THIS
npm run lint

# Package manager (REQUIRED)
pnpm
```

**IMPORTANT**: Do NOT run `dev`, `build`, `dev:h5`, `dev:weapp`, or `build:weapp` scripts. They are disabled in this environment.

The `lint` command runs:
1. **Biome** - Formatting and linting with auto-fix (`--write --unsafe`)
2. **TypeScript** - Type checking via `tsgo`
3. **Custom checks**:
   - `checkAuth.sh` - Validates authentication patterns
   - `checkNavigation.sh` - Validates navigation patterns
   - `checkIconPath.sh` - Validates icon paths
   - `testBuild.sh` - Build validation

## Code Style Guidelines

### Formatting (Biome Configuration)
- **Indent**: 2 spaces
- **Line width**: 120 characters
- **Line ending**: LF
- **Quotes**: Single for JS/TS, double for CSS
- **Semicolons**: As needed (omit when possible)
- **Trailing commas**: None
- **Arrow parentheses**: Always
- **JSX quotes**: Double
- **Bracket same line**: true
- **Bracket spacing**: false

### Import Patterns
```typescript
// Path alias - ALWAYS use @/ for src/ imports
import {supabase} from '@/client/supabase'
import type {Profile} from '@/db/types'
import PrivacyModal from '@/components/PrivacyModal'

// React imports - use type for type imports
import type React from 'react'
import type {PropsWithChildren} from 'react'
import {useState, useEffect} from 'react'

// Taro imports
import Taro from '@tarojs/taro'
import {View, Text, ScrollView} from '@tarojs/components'
```

### Naming Conventions
- **Components**: PascalCase (e.g., `PrivacyModal.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useTabBarPageClass.ts`)
- **Utilities**: camelCase (e.g., `auth.ts`, `upload.ts`)
- **Types/Interfaces**: PascalCase (e.g., `PhotoEvaluation`, `CreateEvaluationInput`)
- **Constants**: UPPER_SNAKE_CASE for true constants

### TypeScript Guidelines
- **Strict mode**: Disabled (`strictNullChecks: false`, `noImplicitAny: false`)
- **Always** use explicit return types for exported functions
- Use `type` keyword for type imports
- Use `interface` for object shapes that may be extended
- Use `type` for unions, tuples, and mapped types

### Error Handling Pattern
```typescript
// Always wrap async operations in try-catch
export async function getCurrentUser(): Promise<Profile | null> {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return null

    const {data, error} = await supabase.from('profiles').select('*').eq('id', userId).single()

    if (error) {
      console.error('获取用户信息失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return null
  }
}
```

### Function Export Patterns
- Use named exports for utility functions
- Use default export for page components and React components
- Always add JSDoc comments for public API functions

### React Component Structure
```typescript
// Pages use default export
export default function Home() {
  const handleAction = () => {
    Taro.navigateTo({url: '/pages/camera/index'})
  }

  return (
    <View className="min-h-screen bg-gradient-dark">
      {/* JSX content */}
    </View>
  )
}
```

### TailwindCSS/Styling
- Use Tailwind utility classes in `className`
- Custom theme colors use CSS variables (e.g., `bg-gradient-dark`, `text-primary`)
- Icons use `i-mdi-*` or `i-lucide-*` classes
- Always use single quotes in className for consistency

## Project Structure

```
src/
  app.tsx              # App entry (default export)
  app.config.ts        # Taro app config
  app.scss             # Global styles
  pages/               # Page components
    page-name/
      index.tsx        # Page component (default export)
      index.config.ts  # Page config
  components/          # Reusable components
  hooks/               # Custom React hooks
  utils/               # Utility functions
  db/                  # Database types and API
    types.ts           # TypeScript interfaces
    api.ts             # Database API functions
  client/              # Client configurations
    supabase.ts        # Supabase client
  types/
    global.d.ts        # Global type declarations
```

## Key Rules & Constraints

1. **Navigation**: Always use `Taro.navigateTo({url: '/pages/page-name/index'})`
2. **TabBar pages**: Must be registered in `app.config.ts` tabBar.list
3. **Icon paths**: Must use relative paths starting with `./assets/images/`
4. **Environment checks**: Use `Taro.getEnv() !== Taro.ENV_TYPE.WEAPP` for platform-specific code
5. **Storage**: Use `Taro.setStorageSync()` / `Taro.getStorageSync()` for local storage

## Important Notes

- This is a **WeChat Mini Program** - browser APIs are not available
- All pages must be registered in `app.config.ts` pages array
- Each page needs an `index.config.ts` file
- Environment variables are accessed via `process.env.VAR_NAME`
- Do not use `echarts-for-taro` package - it does not exist (enforced by linter)
