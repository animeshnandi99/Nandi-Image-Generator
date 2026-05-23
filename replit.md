# NandiAi

A text-to-image AI app that turns written prompts into stunning AI-generated artwork using OpenAI's gpt-image-1 model.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/nandi-ai run dev` — run the frontend (port 19879)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `OPENAI_API_KEY` — OpenAI API key for image generation

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, shadcn/ui, wouter, TanStack Query
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- AI: OpenAI gpt-image-1 (text-to-image)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all endpoints)
- `lib/db/src/schema/images.ts` — Drizzle schema for the images table
- `artifacts/api-server/src/routes/images.ts` — Image generation & history API routes
- `artifacts/nandi-ai/src/` — React frontend (Studio, Gallery, Stats pages)
- `lib/api-client-react/src/generated/` — Auto-generated React Query hooks

## Architecture decisions

- Image data stored as base64 in PostgreSQL (b64_json column) — avoids need for object storage on first build
- OpenAI gpt-image-1 model used for generation (always returns base64, no response_format needed)
- All API contracts defined in OpenAPI first, then codegen produces hooks + Zod schemas
- Frontend uses generated hooks exclusively — no raw fetch calls

## Product

- **Studio** (`/`) — Enter a prompt, pick size (square/landscape/portrait) and optional style, click Generate. The resulting image is shown prominently on the right.
- **Gallery** (`/gallery`) — Browse all previously generated images in a masonry grid with hover overlays. Full-screen zoom and delete supported.
- **Stats** (`/stats`) — View total images generated, today's count, and popular styles.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- `gpt-image-1` always returns base64 (`b64_json`) — `response_format` param is not supported
- After editing the OpenAPI spec, always run codegen before writing routes or frontend code
- DB schema changes require `pnpm --filter @workspace/db run push` then `pnpm run typecheck:libs`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
