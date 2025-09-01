# Repository Guidelines

## Project Structure & Module Organization
- Source: `src/` (Next.js App Router)
  - `src/app/` pages, API routes (`route.ts`), global styles.
  - `src/components/` UI, auth, review, admin, layout; `ui/` for primitives.
  - `src/lib/` auth, firebase (client/admin), services, utils, monitoring.
  - `src/hooks/`, `src/types/` shared types.
  - Tests: `src/**/__tests__/*` (unit), plus integration and service tests.
- E2E tests: `e2e/` (Playwright). Firebase rules: `firestore.rules`, tests in `firestore.rules.test.js`.
- Config: `next.config.js`, `tailwind.config.js`, `jest*.config.js`, `tsconfig.json` (alias `@/* → src/*`).

## Build, Test, and Development Commands
- `npm run dev`: Start Next.js dev server at `http://localhost:3000` (pinned to port 3000 for social login callbacks).
- `npm run build`: Production build (App Router, SWC minify).
- `npm start`: Run built app on port 3000.
- `npm run lint` / `npm run type-check`: ESLint (Next config) / TypeScript checks.
- `npm test` | `npm run test:watch` | `npm run test:coverage`: Jest + RTL unit tests (70% global coverage target).
- `npm run test:integration`: Jest integration suite (custom config, longer timeout).
- `npm run test:e2e`: Playwright E2E (auto-starts dev server).
- `npm run emulators:start`: Local Firebase emulators; `npm run test:rules` to validate Firestore rules.

## Coding Style & Naming Conventions
- Language: TypeScript (strict). Import via `@/...` alias.
- Components: `PascalCase` (e.g., `ReviewCard.tsx`); hooks: `useCamelCase`.
- Pages/API: folder kebab-case + `page.tsx` / `route.ts`.
- Constants: `UPPER_SNAKE_CASE`; utilities/services: `camelCase`.
- Linting: `eslint-config-next`; Tailwind + `clsx` for conditional styles.

## Testing Guidelines
- Frameworks: Jest, `@testing-library/react`, jsdom; Playwright for E2E.
- Locations: `src/**/__tests__/` and `*.test.ts(x)`; E2E in `e2e/`.
- Coverage: 70% global (60% for integration config). Run `npm run test:coverage`.
- Mocks: See `jest.setup.js` (Firebase, Next navigation, OpenAI).

## Commit & Pull Request Guidelines
- Commit style: Prefer Conventional Commits (`feat:`, `fix:`, `docs:`). Keep messages scoped and imperative.
- Before PR: `npm run type-check && npm run lint && npm test && npm run build`.
- PR content: clear description, linked issue (e.g., `#123`), screenshots for UI, notes on testing and risk.

## Security & Configuration Tips
- Do not commit secrets. Use `.env.local`; see `config.cfg.sample` and `docs/DEPLOYMENT.md`.
- Use emulators for local dev (Auth/Firestore/Storage). Validate rules with `npm run test:rules`.
- Admin SDK usage exists in API routes—keep server-only code off the client.
