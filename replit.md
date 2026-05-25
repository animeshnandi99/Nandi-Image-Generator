# NandiAi

A text-to-image AI app that turns written prompts into stunning AI-generated artwork.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/nandi-ai run dev` — run the frontend (port 19879)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- No `DATABASE_URL` required — all persistence is local (IndexedDB in the browser)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, shadcn/ui, wouter, TanStack Query
- API: Express 5 (stateless — only proxies AI calls)
- Local persistence: IndexedDB via `idb` (`lib/local-store`)
- AI: Pollinations.ai (image generation), OpenRouter (chat/enhance-prompt)
- Validation: Zod (`zod/v4`)
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all endpoints)
- `lib/local-store/src/` — IndexedDB persistence layer (images + chat messages)
- `artifacts/api-server/src/routes/images.ts` — Image generation API (stateless)
- `artifacts/api-server/src/routes/chat.ts` — Chat/enhance-prompt API (stateless)
- `artifacts/nandi-ai/src/` — React frontend (Studio, Gallery, Stats, Chat pages)
- `lib/api-client-react/src/generated/` — Auto-generated React Query hooks

## Architecture decisions

- All user data (images, chat) stored in browser IndexedDB — no server-side persistence
- Server is fully stateless: generates images, proxies AI calls, returns results
- Chat history sent from client to server on each request (server never stores it)
- Image IDs are UUIDs generated server-side at generation time
- All API contracts defined in OpenAPI first, then codegen produces hooks + Zod schemas

## Product

- **Studio** (`/`) — Enter a prompt, pick size (square/landscape/portrait) and optional style, click Generate. The resulting image is shown prominently on the right and saved to local storage.
- **Gallery** (`/gallery`) — Browse all previously generated images from IndexedDB in a masonry grid with hover overlays. Full-screen zoom and delete supported.
- **Stats** (`/stats`) — View total images generated, today's count, and popular styles — all computed from local data.
- **Chat** (`/chat`) — Streaming AI chat with NandiAi Assistant. History persists across refreshes in IndexedDB.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After editing the OpenAPI spec, always run codegen before writing routes or frontend code
- `lib/db` is kept as an empty stub for workspace resolution — do not add it back to tsconfig references
- Chat history is sent from client to server on each message (last 20 messages) — no server storage needed

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
