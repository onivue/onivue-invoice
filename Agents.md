# onivue-invoice

## Setup & Configuration

- **Required Scripts:** Ensure `package.json` includes:
  - `"check": "bun run format && bun run lint"`
  - `"format": "oxfmt --write src"`
  - `"lint": "oxlint"`
  - `"typecheck": "tsc --noEmit"`
  - `"updates": "npx npm-check-updates --interactive --format group"`
- **Install:** `bun install`
- **Dev Server:** `bun dev`
- **Build:** `bun build`
- **Lint & Format:** `bun check`
- **Typecheck:** `bun typecheck`
- **Update Deps:** `bun updates`
- **Test:** `bun test`
- **DB Push:** `bun db:push`
- **DB Studio:** `bun db:studio`
- **Env:** Validate env vars on startup. Access via type-safe config object only.

## Tech Stack

- **Package Manager:** bun
- **Frontend:** TanStack Start, Tailwind CSS v4, base-ui, Zustand v5+
- **Backend:** tRPC (self-hosted), Zod
- **Database:** Neon PostgreSQL, Drizzle ORM
- **Auth:** Better Auth (passkey / WebAuthn via `@better-auth/client`)

## Project Structure

```
onivue-invoice/
├── apps/
│   └── web/         # frontend application
├── packages/
│   ├── api/         # api layer (trpc routers)
│   ├── db/          # database schema (drizzle)
│   ├── config/      # shared config
│   └── env/         # environment validation
```

## Git & Workflow

- **Commits:** Follow Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`). Keep messages concise.

## Architecture & Structure

- **Feature-First:** Colocate components, hooks, and tests within feature folders (e.g., `features/invoices/`).
- **Services & Helpers:** Encapsulate all services, tools, and calculations in classes (e.g., `class APIService`, `class DateHelper`).
- **API Layer:** Abstract tRPC calls into service classes. Return Discriminated Unions (`{ success: true, data: T } | { success: false, error: E }`) for strict result handling.
- **Global Config:** Store app-wide constants and settings (e.g., app name) in a `config.ts` file.
- **No Barrel Files:** Avoid `index.ts` files that strictly re-export. Import directly from specific files.
- **Imports:** Use absolute imports (`@/`) exclusively. Avoid relative parent paths.
- **Naming:**
  - Components/Interfaces: `PascalCase`
  - Functions/Vars: `camelCase`
  - Files: `kebab-case`
  - Constants: `UPPER_CASE`
  - Classes: `PascalCase`
- **Class Modifiers:** Prefer explicit modifiers (`public`, `private`, `static`) for class members.

## Code Quality

- **Tooling:** Use oxlint and oxfmt for linting and formatting (run via `bun check`).
- **TypeScript:** Strict mode. No `any`. Infer types from Zod schemas.
- **State Modeling:** Use Discriminated Unions. Avoid multiple optional booleans for state.
- **Control Flow:** Use Guard Clauses (early returns) to avoid deep nesting.
- **Clean Code:** Replace magic values with named constants/enums.
- **Syntax:** Use optional chaining (`?.`) and nullish coalescing (`??`).
- **Dates:** Use `date-fns` for manipulation. Avoid native `Date` math.
- **DRY:** No code duplication.
- **Async:** Always use `async`/`await` and `try/catch`. Avoid `.then()`.
- **Formatting:** Use single quotes (configure oxfmt accordingly).
- **Comments:** Short, simple, readable, and always in lowercase.

## React & UI

- **Components:** Use `@base-ui/react`. Always install via CLI.
- **Test IDs:** Add `data-testid` to components for reliable element identification.
- **Layout Components:** Encapsulate repeated layout patterns (header, content area, etc.) into dedicated layout components. Accept `className` and spread `...props` so they remain composable. Example:

  ```tsx
  function PageHeader({ className, ...props }: React.ComponentProps<"div">) {
    return (
      <div
        className={cn(
          "sticky top-0 z-10 flex h-12 items-center justify-between border-b border-border bg-background px-6",
          className,
        )}
        {...props}
      />
    );
  }
  ```

- **Single Responsibility:** Each component does one thing. Extract logic into hooks, and layout into layout components when a component grows complex.
- **Rendering:** Strictly use ternary (`? : null`) or `!!value &&`. Never rely on `&&` with numbers/strings.
- **Routing:** Use TanStack Router type-safe routing patterns. Never use hardcoded strings for internal navigation.
- **Feedback:** Use `sonner` for toasts. Use Error Boundaries for crashes. Never use `alert()`.
- **States:** Implement explicit `Loading` (Skeletons) and `Empty` states. Avoid layout shifts.
- **Hooks:** Avoid `useEffect`. Never use `useMemo` or `useCallback`. Use `debounce` for user input, search, and resize handlers where appropriate.
- **Composition:** Prefer composition (children/slots) over configuration props.
- **HTML:** Use semantic tags (`nav`, `main`) and ensure keyboard accessibility.

## Data & State

- **Server State:** Use TanStack Query. Keep separate from client state.
- **Cancellation:** Use `AbortController` to handle async cancellations and race conditions.
- **Client State:** Use Zustand v5+ for complex local state.
- **Forms:** Use TanStack Form v1 (`@tanstack/react-form`) with field-level Zod validators.
- **Validation:** Use Zod for all schemas (API, forms, env).

## Security

- **Scope:** Treat all client-side code as public. Never hardcode secrets.
- **Input:** Sanitize all user inputs on the server using Zod.

## Tailwind CSS

- **Version:** Always use v4 + global CSS.
- **Values:** Use built-in utility values first.
- **Layout:** No `space-*` utilities. Use `flex`/`grid` with `gap-*` instead.
- **Base Styles:** In `@layer base`, set `cursor: pointer` for enabled buttons and roles.
- **Screen Height:** Prefer `dvh` (dynamic viewport height) over `vh` for better mobile browser compatibility.

## Maintenance

Keep `Agents.md` updated when:

- Adding/removing dependencies
- Changing project structure
- Adding new features or services
- Modifying build/dev workflows

AI assistants should suggest updates to this file when they notice relevant changes.
