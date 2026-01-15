# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router pages, API routes, and admin UI components.
- `src/`: Core TypeScript code (repositories, services, utilities, types).
- `prisma/`: Prisma schema and database artifacts.
- `public/` and `img/`: Static assets.
- `scripts/` and root `*.ps1`/`*.bat`: Operational scripts for starting/stopping services and migrations.
- `embeddings-service/` and `venv_*`: Auxiliary Python services and virtual environments.

Keep data access in the repository layer (`src/repositories`), business logic in services (`src/services`), and thin request handlers in `app/api`.

## Build, Test, and Development Commands
- `npm run dev`: Start the Next.js dev server on port 7847.
- `npm run build`: Production build (use before merging).
- `npm start`: Run the production server on port 7847.
- `npm run lint`: Run ESLint (Next.js + TypeScript config).
- `npx prisma migrate dev`: Apply schema changes to local SQLite.
- `npx prisma generate`: Regenerate Prisma client after schema changes.
- `npx prisma studio`: Inspect the local database.

Optional: `INICIO-SIMPLE.bat` and `iniciar-sistema-completo.ps1` start the full local stack (Ollama, Next.js, ngrok) when you need end-to-end testing.

## Coding Style & Naming Conventions
- TypeScript strict mode is enabled; avoid `any` and keep types explicit.
- Follow existing formatting; most files use 2-space indentation.
- React components use `PascalCase`, functions/variables use `camelCase`.
- Files in `src/` typically use `PascalCase` for class modules (e.g., `WhatsAppRepository.ts`) and `kebab-case` only for scripts.

## Testing Guidelines
There is no single test runner yet. Validation typically includes:
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

Ad-hoc scripts live at the repo root (e.g., `test-*.js`, `test-*.ts`, `test-*.ps1`). If you add a formal test runner, co-locate tests near the modules they cover.

## Commit & Pull Request Guidelines
Recent history uses Conventional Commits (`feat: ...`, `docs: ...`, `fix: ...`). Keep messages short and imperative.

PRs should include:
- A concise summary and the motivation for the change.
- Testing performed (commands and results).
- Screenshots for admin UI changes.
- Migration notes when touching `prisma/schema.prisma`.

## Security & Configuration Tips
- Secrets belong in `.env.local`; never commit tokens or API keys.
- Use repository/services patterns for data access and logging; avoid direct Prisma access in route handlers.
- Check `CLAUDE.md` for the latest architecture and refactor guidance.
