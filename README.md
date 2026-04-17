# onivue-invoice

Rechnungsverwaltung für Freelancer und kleine Unternehmen. Swiss QR-Bill, Team-Workspaces, Passkey-Auth.

## Stack

- **TanStack Start** — SSR-Framework mit TanStack Router (file-based routing)
- **tRPC** — End-to-end typsichere API
- **Drizzle ORM** — TypeScript-first ORM mit PostgreSQL
- **Neon** — Serverless PostgreSQL (Vercel-optimiert)
- **Better Auth** — Passwordless Auth (Passkey) + Team-Workspaces
- **Resend** — Transactional Email (Workspace-Einladungen)
- **TailwindCSS** — Styling
- **Bun** — Package Manager + Runtime

## Projekt-Struktur

```text
onivue-invoice/
├── apps/
│   └── web/              # Fullstack-App (TanStack Start)
│       └── src/
│           ├── routes/
│           │   ├── _app/         # Geschützte Routen (mit Sidebar)
│           │   ├── i.$token.tsx  # Öffentliche Rechnungsansicht
│           │   ├── login.tsx     # Passkey Login / Registrierung
│           │   └── workspace/
│           │       └── new.tsx   # Workspace erstellen
│           ├── lib/
│           │   ├── auth.ts       # Better Auth Server-Config
│           │   └── auth-client.ts
│           └── components/
├── packages/
│   ├── api/              # tRPC Router + Procedures
│   ├── db/               # Drizzle Schema + Client
│   └── env/              # Typisierte Umgebungsvariablen
```

## Setup

### 1. Dependencies installieren

```bash
bun install
```

### 2. Umgebungsvariablen

`.env.local` im Projekt-Root ausfüllen:

```env
DATABASE_URL=postgresql://...   # Neon Connection String (pooled)

BETTER_AUTH_SECRET=             # openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000

RESEND_API_KEY=re_...
```

### 3. Datenbank einrichten

Auth-Tabellen und App-Schema auf Neon anlegen:

```bash
# Better Auth Tabellen generieren (user, session, passkey, organization, ...)
npx @better-auth/cli@latest migrate

# App-Tabellen pushen (invoices, customers, products, settings, ...)
bun run db:push
```

### 4. Dev-Server starten

```bash
bun run dev
```

Öffne [http://localhost:3000](http://localhost:3000).

## Wichtige Scripts

| Script                | Beschreibung                   |
| --------------------- | ------------------------------ |
| `bun run dev`         | Alle Apps im Dev-Modus starten |
| `bun run dev:web`     | Nur die Web-App starten        |
| `bun run build`       | Alle Apps bauen                |
| `bun run typecheck`   | TypeScript-Typen prüfen        |
| `bun run db:push`     | Schema auf DB pushen           |
| `bun run db:studio`   | Drizzle Studio öffnen          |
| `bun run db:generate` | Drizzle-Migrationen generieren |
| `bun run check`       | Oxlint + Oxfmt ausführen       |

## Deployment (Vercel)

Folgende Umgebungsvariablen in Vercel setzen:

```env
DATABASE_URL        # Neon pooled connection string
BETTER_AUTH_SECRET  # Min. 32 Zeichen
BETTER_AUTH_URL     # https://invoice.onivue.ch
RESEND_API_KEY      # Resend API Key
```

> **Passkey rpID**: In `apps/web/src/lib/auth.ts` ist `rpID: "invoice.onivue.ch"` für Production gesetzt. Lokal wird automatisch `localhost` verwendet.
