# AGENTS.md - Coding Guidelines for AI Agents

> Guidelines for AI agents working on this Taro + React WeChat Mini Program.

## Project Overview

- **Framework**: Taro 4.1.5 + React 18 + TypeScript
- **State**: Zustand
- **Styling**: TailwindCSS with CSS variables
- **Backend**: Supabase
- **Icons**: Iconify (MDI: `i-mdi-*`, Lucide: `i-lucide-*`)

## Build/Lint/Test Commands

```bash
# Primary validation - USE THIS
npm run lint

# Package manager
pnpm
```

**IMPORTANT**: Do NOT run `dev`, `build`, `dev:h5`, `dev:weapp`, or `build:weapp`.

The `lint` command runs:
1. **Biome** - Format/lint with auto-fix
2. **TypeScript** - Type check via `tsgo`
3. **Custom checks** via ast-grep:
   - `checkAuth.sh` - useAuth/AuthProvider patterns
   - `checkNavigation.sh` - navigateTo vs switchTab
   - `checkIconPath.sh` - Icon path validation
   - `testBuild.sh` - Build validation

## Code Style (Biome)

- **Indent**: 2 spaces
- **Line width**: 120
- **Line ending**: LF
- **Quotes**: Single (JS/TS), double (CSS)
- **Semicolons**: As needed
- **Trailing commas**: None
- **Arrow parens**: Always
- **JSX quotes**: Double
- **Bracket same line**: true
- **Bracket spacing**: false

## Import Patterns

```typescript
// Path alias - ALWAYS use @/ for src/
import {supabase} from '@/client/supabase'
import type {Profile} from '@/db/types'
import PrivacyModal from '@/components/PrivacyModal'

// React - use type for type imports
import type {PropsWithChildren} from 'react'
import {useState, useEffect} from 'react'

// Taro
import Taro from '@tarojs/taro'
import {View, Text, ScrollView} from '@tarojs/components'
```

## Naming Conventions

- **Components**: PascalCase (e.g., `PrivacyModal.tsx`)
- **Hooks**: camelCase with `use` prefix
- **Utilities**: camelCase
- **Types**: PascalCase
- **Constants**: UPPER_SNAKE_CASE

## TypeScript Guidelines

- **Strict mode**: Disabled (`strictNullChecks: false`, `noImplicitAny: false`)
- Always use explicit return types for exported functions
- Use `type` for type imports
- Use `interface` for extensible object shapes
- Use `type` for unions/tuples

## Error Handling Pattern

```typescript
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

## Function Exports

- Named exports for utilities
- Default export for page components
- Add JSDoc for public API functions

## React Component Structure

```typescript
// Pages use default export
export default function Home() {
  const handleAction = () => {
    Taro.navigateTo({url: '/pages/camera/index'})
  }

  return (
    <View className="min-h-screen bg-gradient-dark">
      {/* JSX */}
    </View>
  )
}
```

## TailwindCSS/Styling

- Use Tailwind utility classes in `className`
- Custom theme: `bg-gradient-dark`, `text-primary`
- Icons: `i-mdi-*` or `i-lucide-*`
- Use single quotes in className

## Project Structure

```
src/
  app.tsx              # App entry (default export)
  app.config.ts        # Taro config
  app.scss             # Global styles
  pages/               # Page components
    page-name/
      index.tsx        # Page (default export)
      index.config.ts  # Page config
  components/          # Reusable components
  hooks/               # Custom hooks
  utils/               # Utility functions
  db/                  # Database types & API
  client/              # Client configs (Supabase)
  types/
    global.d.ts        # Global types
```

## Key Rules

1. **Navigation**:
   - Non-tab pages: `Taro.navigateTo({url: '/pages/page/index'})`
   - Tab pages: `Taro.switchTab({url: '/pages/home/index'})`
2. **TabBar pages**: Must be in `app.config.ts` tabBar.list
3. **Icon paths**: Use relative paths `./assets/images/`
4. **Environment**: Use `Taro.getEnv() !== Taro.ENV_TYPE.WEAPP`
5. **Storage**: Use `Taro.setStorageSync()` / `Taro.getStorageSync()`

## Important Notes

- WeChat Mini Program - no browser APIs
- All pages must be registered in `app.config.ts`
- Each page needs `index.config.ts`
- Environment variables: `process.env.VAR_NAME`
- **Never use `echarts-for-taro`** - package doesn't exist
