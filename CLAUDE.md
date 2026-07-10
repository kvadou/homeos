# HomeOS — Project Guide

## Tech Stack
- **Framework**: Next.js 15 (App Router) with React 19
- **Language**: TypeScript (strict — all new files must be .ts/.tsx)
- **Database**: PostgreSQL 16 + Prisma 6 + pgvector (1536-dim embeddings)
- **Auth**: Clerk v6 (`@clerk/nextjs`)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`) + Radix UI primitives
- **AI**: Anthropic Claude API (`@anthropic-ai/sdk`), Vercel AI SDK (`ai`)
- **Monorepo**: Turborepo + pnpm workspaces
- **Deployment**: Vercel (frontend), Neon (database)

## Monorepo Structure
```
homeos/
├── apps/web/           — Next.js app (pages, components, API routes)
├── packages/database/  — Prisma schema, client, seed data
├── packages/shared/    — Zod validators, TypeScript types, constants
├── packages/ai/        — Claude client, embeddings, RAG, vision utilities
└── packages/ui/        — Shared UI components (placeholder)
```

## Coding Conventions

### General
- TypeScript-first. No `.js` files.
- Server components by default. Add `"use client"` only when needed (hooks, event handlers, browser APIs).
- Use `import { x } from "@/..."` for app-local imports, `import { x } from "@homeos/..."` for packages.
- No native browser dialogs (`window.alert`, `window.confirm`, `window.prompt`). Use Radix Dialog or custom modals.

### API Routes
- Pattern: `app/api/{resource}/route.ts` (collection) and `app/api/{resource}/[id]/route.ts` (single)
- Always call `requireAuth()` first — throws if unauthenticated
- Validate body with Zod schemas from `@homeos/shared`
- Return `{ success: true, data }` or `{ success: false, error }` consistently
- Async params in Next.js 15: `params: Promise<{ id: string }>`

### Components
- Radix UI primitives wrapped in shadcn-style components in `components/ui/`
- Use `cn()` from `@/lib/utils` for class merging (clsx + tailwind-merge)
- Forms: controlled inputs with local state, submit to API routes
- Delete actions: use Dialog for confirmation, never native confirm()

### Database
- Prisma schema at `packages/database/prisma/schema.prisma`
- All models use `@map("snake_case")` for table/column names
- Use `cuid()` for all IDs
- Query through `prisma` singleton from `@/lib/db`
- Verify home ownership: `home.users.some({ userId: user.id })`

### Styling (Design System)
- **Navy**: `#0A2E4D` (primary dark), **Teal**: `#00B4A0` (accent)
- CSS variables via `hsl(var(--...))` pattern
- Tailwind v4 — use `@import "tailwindcss"` not `@tailwind` directives
- Responsive: mobile-first, sidebar collapses on `lg:` breakpoint

### AI Integration
- Claude API client in `packages/ai/src/claude.ts`
- Vision: send base64 images to Claude for item identification
- Embeddings: use for manual chunks in pgvector (1536 dimensions)
- RAG: query ManualChunk embeddings for relevant context in chat
- Streaming: use Vercel AI SDK `ai` package for streaming responses

## Key File Paths
- Auth helpers: `apps/web/lib/auth.ts` (requireAuth, getOrCreateUser)
- DB client: `apps/web/lib/db.ts` (re-exports prisma)
- Utils: `apps/web/lib/utils.ts` (cn function)
- Validators: `packages/shared/src/validators/index.ts`
- Types: `packages/shared/src/types/index.ts`
- Constants: `packages/shared/src/constants/index.ts`
- Sidebar nav: `apps/web/components/dashboard/sidebar.tsx`

## Environment Variables
```
DATABASE_URL          — PostgreSQL connection string
CLERK_SECRET_KEY      — Clerk backend key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY — Clerk frontend key
ANTHROPIC_API_KEY     — Claude API key (Phase 2)
```

## Rules
- Always use TypeScript (.ts/.tsx) for new files
- Break large multi-phase plans into single-phase tasks
- Start coding within first 2 minutes — minimize exploration
- When fixing data bugs, verify against the specific reported case before marking complete
- After fixing any bug, re-run the affected report/query and confirm output matches expected
- When work can't complete in one session, end with explicit handoff
- Check for related bugs in the same code path before closing
