# AGENTS.md - Development Guidelines

## Commands
- `npm run dev` (port 3456), `npm run build`, `npm run preview` (port 3000)
- `npm run biome` / `biome:fix` (lint), `npm run typecheck`, `npm run codegen`
- `npm run e2e` (all tests), `npx playwright test tests/file.test.ts` (single test), `npm run e2e:ui`

## Code Style
- 2 spaces, double quotes, semicolons always, trailing commas, LF line endings
- camelCase vars, PascalCase components, kebab-case files, ALL_CAPS constants
- Import from `'react-router'` NOT `'react-router-dom'`
- Use `~/` alias for app directory: `import X from "~/utils/file"`
- React 19: use `ref` prop directly (not `forwardRef`)
- Biome linter, TypeScript strict mode disabled

## Key Patterns
- Weaverse sections: export default + `schema` + optional `loader`
- Register sections in `/app/weaverse/components.ts` (namespace import)
- Route loaders: `Promise.all([weaverse.loadPage(), storefront.query()])`
- Use `cn()` utility for class merging (Tailwind + clsx)
- GraphQL changes: run `npm run codegen`
- Customer Account API queries only in `*.account*` files

## Testing
- Playwright E2E tests run against `localhost:3000` (use `npm run preview`)
- Test files in `/tests/`, use `npx playwright test --debug` for debugging
