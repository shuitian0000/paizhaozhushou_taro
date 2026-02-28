# AGENTS.md - Coding Guidelines for AI Agents

> Taro 4.1.5 + React 18 + TypeScript WeChat Mini Program

## Build/Lint/Test Commands

```bash
# Primary validation - ALWAYS run before committing (runs all checks)
npm run lint

# Single file format/lint
npx biome check --write src/pages/home/index.tsx    # Fix + format
npx biome check src/pages/home/index.tsx             # Check only

# Type check only
tsgo -p tsconfig.check.json

# Individual validation scripts (Windows: use Git Bash/WSL)
./scripts/checkAuth.sh        # useAuth requires AuthProvider
./scripts/checkNavigation.sh  # navigateTo vs switchTab rules
./scripts/checkIconPath.sh    # Relative icon paths only
./scripts/testBuild.sh        # Build check
```

**Testing**: No test framework. Do not add tests.

**IMPORTANT**: Do NOT run `dev`, `build`, `dev:h5`, `dev:weapp`, or `build:weapp` - these are disabled.

## Code Style (Biome)

See `biome.json` for full config:

| Setting | Value |
|---------|-------|
| Indent | 2 spaces |
| Line width | 120 |
| Line ending | LF |
| JS/TS quotes | Single |
| CSS/JSON quotes | Double |
| JSX quotes | Double |
| Semicolons | As needed |
| Trailing commas | None |

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

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `PrivacyModal.tsx` |
| Hooks | camelCase with `use` | `useAuth` |
| Utilities | camelCase | `formatDate` |
| Types | PascalCase | `Profile` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY` |
| Files | kebab-case | `my-component.tsx` |

## TypeScript Guidelines

- Strict mode disabled (`strictNullChecks: false`, `noImplicitAny: false`)
- Always use explicit return types for exported functions
- Use `type` for type imports, `interface` for extensible shapes
- Use `type` for unions/tuples
- Avoid `any` - use `unknown` if type is unknown
- Prefer `null` over `undefined` for optional values
- Use `import type` for type-only imports

## Error Handling Pattern

```typescript
export async function getUser(): Promise<Profile | null> {
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

## Key Rules

1. **Navigation**:
   - Non-tab pages: `Taro.navigateTo({url: '/pages/page/index'})`
   - Tab pages: `Taro.switchTab({url: '/pages/home/index'})`
2. **TabBar pages**: Must be in `app.config.ts` tabBar.list
3. **Icon paths**: Use relative paths `./assets/images/`
4. **Environment check**: `Taro.getEnv() !== Taro.ENV_TYPE.WEAPP`
5. **Storage**: `Taro.setStorageSync()` / `Taro.getStorageSync()`
6. **CommonJS**: Forbidden - use ES modules only

## Important Notes

- WeChat Mini Program - no browser APIs available
- All pages must be registered in `app.config.ts`
- Each page needs `index.config.ts`
- **Never use `echarts-for-taro`** - package does not exist
- Use `console.error` for error logging (consistent with pattern)
- Use Taro's built-in `console` - browser console may not work

## Project Structure

```
src/
├── app.tsx/app.config.ts/app.scss     # App entry & config
├── pages/page-name/index.{tsx,config.ts}  # Pages
├── components/                        # Reusable components
├── hooks/                             # Custom hooks
├── utils/                             # Utilities
├── db/                                # Database types & API
├── client/                            # Supabase client
└── types/global.d.ts                  # Global types
```

## Custom Lint Rules (.rules/)

- `useAuth.yml` - Detects useAuth hook usage
- `tabbar-list.yml` - Validates tabBar config
- `navigateTo.yml` - Enforces navigateTo vs switchTab
- `noAbsoluteIconPath.yml` - Validates relative icon paths
- `authProvider.yml` - Ensures AuthProvider wraps routes
