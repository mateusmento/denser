# Denser

pnpm monorepo scaffold for Denser (Node **24.18.0**). Architecture: [`FRONTEND-ARCHITECTURE.md`](FRONTEND-ARCHITECTURE.md).

## Packages

| Package                 | Role                                     |
| ----------------------- | ---------------------------------------- |
| `@denser/contracts`     | Zod + branded IDs                        |
| `@denser/api-client`    | HTTP + Socket.IO                         |
| `@denser/design-system` | shadcn-vue kit + Storybook `:6006`       |
| `@denser/api`           | Hono + Better Auth + Drizzle + Socket.IO |
| `@denser/app`           | Vue SPA + Storybook `:6007`              |
| `@denser/e2e`           | Testcontainers API smoke                 |

## Quick start

```bash
nvm use            # .nvmrc → 24.18.0
cp .env.example .env
pnpm install
pnpm db:up
pnpm db:migrate
pnpm seed
pnpm dev           # api :3457 + app :5173
```

Seeded users (`SEED_PASSWORD`, default `password`): `alice`, `bob`, `carol`, `david`, `emma`, `frank`.

Google OAuth and invite SMTP: copy placeholders from [`.env.example`](.env.example) into `.env` and fill from Epicstory `api/.env` (`GOOGLE_*`, `EMAIL_SMTP_*`, `DEFAULT_SENDER_EMAIL_ADDRESS`). Google callback must be `${BETTER_AUTH_URL}/api/auth/callback/google` (default `http://localhost:3457/api/auth/callback/google`).

```bash
pnpm test:e2e
pnpm storybook:design-system
pnpm storybook:app
pnpm lint
pnpm format:check
```

Lint and format live at the workspace root:

| Command             | What it does                                                                     |
| ------------------- | -------------------------------------------------------------------------------- |
| `pnpm lint`         | ESLint (TS, Vue templates, Tailwind classes) + Stylelint (CSS and Vue `<style>`) |
| `pnpm lint:fix`     | Auto-fix lint where safe                                                         |
| `pnpm format`       | Oxfmt write (TS, Vue SFC, CSS, Tailwind class order, JSON, YAML, Markdown)       |
| `pnpm format:check` | Oxfmt check, no writes                                                           |
