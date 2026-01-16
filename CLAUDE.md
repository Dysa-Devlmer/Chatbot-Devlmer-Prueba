# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PITHY Chatbot** is an enterprise-grade WhatsApp Business chatbot with local AI (Ollama), real-time conversations, and an admin dashboard.

- **Tech Stack**: Next.js 16 (Turbopack), React 19, Prisma, SQLite, Ollama, Winston, bcrypt
- **Architecture**: Repository → Service → API Route (layered architecture)
- **Port**: 7847 (Next.js), 11434 (Ollama), 4847 (ngrok)
- **Database**: SQLite with Prisma ORM
- **Status**: Phase 2 Step 2 in progress (WhatsApp webhook refactoring)

## Quick Commands

### Development
```bash
npm run dev              # Start server on port 7847
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run linter
```

### Database
```bash
npx prisma migrate dev   # Run migrations
npx prisma generate      # Generate Prisma client
npx prisma studio       # Open DB UI
```

### Scripts
```bash
tsx scripts/migrate-passwords.ts   # Migrate passwords to bcrypt (Phase 2 Step 1)
```

## Architecture & Patterns

### Established Layered Pattern

All data operations follow: **API Route → Service → Repository → Prisma → Database**

```typescript
// Example flow
export const POST = createPublicHandler(async (request) => {
  const { data } = await getValidatedBody(request)
  const result = await whatsappService.processMessage(data)
  return successResponse(result)
}, { bodySchema: messageSchema })
```

### Repository Layer

**Purpose**: Data access abstraction

- **Singleton Pattern**: Each repository is instantiated once and exported
- **TypeScript Interfaces**: All inputs/outputs are type-safe
- **Error Handling**: Graceful degradation, proper logging
- **Privacy**: Phone numbers masked in logs

**Existing Repositories** (5 created in Phase 2 Step 2):
1. `AuthRepository` - Admin authentication (from Phase 2 Step 1)
2. `WhatsAppRepository` - WhatsApp API communication (467 lines)
3. `UserRepository` - WhatsApp users (247 lines)
4. `ConversationRepository` - Conversation lifecycle (341 lines)
5. `MessageRepository` - Message storage (353 lines)
6. `WebhookLogRepository` - Webhook auditing (214 lines)

**Creating a New Repository**:

```typescript
// src/repositories/ExampleRepository.ts
import { prisma } from '@/lib/prisma'
import { dbLogger } from '@/lib/logger'

export class ExampleRepository {
  async findById(id: string) {
    dbLogger.debug('Finding example', { id })
    return prisma.example.findUnique({ where: { id } })
  }
}

export const exampleRepository = new ExampleRepository()
```

### Service Layer

**Purpose**: Business logic and orchestration

- Uses repositories for data access
- No direct Prisma calls
- Winston logging for all operations
- Error handling with meaningful messages

**Existing Services**:
- `AuthService` (Phase 2 Step 1) - Login, password, profile management

**To Create in Phase 2 Step 2**:
- `WhatsAppService` - Orchestrate webhook processing
- `MessageProcessorService` - Message transcription, AI, TTS

### Logging

**Winston Logger** (replaced Pino in Phase 2 Step 1 due to Turbopack compatibility)

- **Specialized Loggers**: `authLogger`, `whatsappLogger`, `aiLogger`, `dbLogger`, etc.
- **Levels**: error, warn, info, http, verbose, debug, silly
- **Format**: Development (colorized), Production (JSON)
- **Auto-Redaction**: Passwords, tokens, API keys automatically redacted

**Usage**:
```typescript
import { whatsappLogger, dbLogger } from '@/lib/logger'

whatsappLogger.info('Message received', { phoneNumber, messageId })
dbLogger.error('Failed to save message', { error: error.message })
```

### Type Safety

- **TypeScript Strict Mode**: All files must have proper types
- **Zod Schemas**: All API inputs validated with Zod
- **Prisma Types**: Use Prisma-generated types

**Validation Pattern**:
```typescript
import { z } from 'zod'

export const messageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1),
})

export type MessageInput = z.infer<typeof messageSchema>
```

## Project Structure

### Key Directories

```
src/
├── repositories/        # Data access layer (6 files)
├── services/           # Business logic (2 completed, 2 pending)
├── lib/               # Core utilities
│   ├── logger.ts      # Winston logging
│   ├── auth.ts        # NextAuth configuration
│   ├── prisma.ts      # Prisma singleton
│   ├── ai.ts          # Ollama/Claude/OpenAI integration
│   ├── conversation.ts # Legacy conversation logic (being refactored)
│   └── whatsapp.ts    # Legacy WhatsApp utilities (being refactored)
├── middleware/        # Request middleware
│   ├── validation.ts   # Zod validation + error handling
│   ├── rateLimit.ts    # Rate limiting
│   └── security.ts     # CORS, HMAC, security headers
├── utils/            # Utilities
│   ├── security.ts    # bcrypt, token generation, HMAC
│   └── apiHandler.ts  # Route handler wrappers
└── types/
    └── schemas.ts     # Zod schemas and types

app/
├── api/
│   ├── whatsapp/webhook/   # Webhook (being refactored)
│   ├── admin/              # Admin API routes
│   └── auth/               # Auth routes
├── admin/                  # Admin dashboard pages
└── components/            # React components
```

### Important Files

- `REFACTOR_GUIDE.md` - Detailed Phase 1 documentation
- `prisma/schema.prisma` - Database schema (14 models)
- `.env.local` - Environment variables (not in git)

## Current Refactoring Status

### ✅ Phase 2 Step 1: Authentication (Complete)
- AuthRepository and AuthService created
- Password migration from plaintext to bcrypt
- NextAuth refactored to use AuthService
- Winston logger replaces Pino

### 🔄 Phase 2 Step 2: WhatsApp Webhook Refactoring (In Progress)
- ✅ All 5 repositories created (1,851 lines)
- ✅ Build verification passed
- ⏳ Services: WhatsAppService, MessageProcessorService
- ⏳ Security: HMAC validation, rate limiting
- ⏳ Route refactoring
- ⏳ Testing

### 📋 Current Webhook Code

**File**: `app/api/whatsapp/webhook/route.ts` (480 lines)

**Current Issues**:
- All logic in route handler (monolithic)
- Direct Prisma calls scattered throughout
- Tightly coupled to ConversationService (legacy)
- Missing type safety in places

**Refactoring Plan**:
1. Extract WhatsApp API calls → WhatsAppRepository ✅
2. Extract message processing → MessageProcessorService
3. Extract orchestration → WhatsAppService
4. Add HMAC validation middleware
5. Add rate limiting
6. Replace route with thin handler using services

## Security Considerations

### Implemented
- ✅ Bcrypt password hashing (12 salt rounds)
- ✅ Token generation with crypto
- ✅ Input validation with Zod
- ✅ Rate limiting (memory-based, 6 presets)
- ✅ CORS configuration
- ✅ Security headers (CSP, HSTS, etc.)
- ✅ Winston log redaction for secrets
- ✅ HMAC signature support (ready to integrate)

### To Implement in Phase 2 Step 2
- ✅ HMAC validation for webhook (code exists in `security.ts`)
- Rate limiting for webhook specifically
- Phone number masking in all logs (partially done)

### Environment Variables

Required in `.env.local`:
```env
WHATSAPP_TOKEN=your_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
WHATSAPP_WEBHOOK_TOKEN=your_webhook_token
WHATSAPP_APP_SECRET=your_app_secret  # For HMAC

NEXTAUTH_SECRET=generate_with_openssl
NEXTAUTH_URL=http://localhost:7847

DATABASE_URL=file:./db.sqlite
OLLAMA_URL=http://localhost:11434

CLAUDE_API_KEY=optional_for_claude_fallback
OPENAI_API_KEY=optional_for_gpt_fallback
```

## Workflow Guidelines

### When Adding a New Feature

1. **Check existing patterns**: Look at AuthService/AuthRepository for patterns
2. **Create repository** if data access needed
3. **Create service** for business logic
4. **Use route handler wrappers**: `createPublicHandler`, `createProtectedHandler`, etc.
5. **Validate inputs**: Add Zod schema
6. **Log appropriately**: Use specialized logger
7. **Handle errors**: Throw custom errors, catch in handler
8. **Test**: Verify build with `npm run build`

### When Refactoring Legacy Code

1. **Don't modify in place**: Create new repository/service alongside
2. **Use new handlers**: Apply pattern from Phase 2 Step 1
3. **Add tests**: Verify behavior matches original
4. **Gradually migrate**: Switch route to new implementation
5. **Remove old code**: Delete legacy files once migrated
6. **Commit incrementally**: Small, logical commits

### Database Changes

1. Modify `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name description`
3. Run `npx prisma generate`
4. Update repositories and services

## Common Tasks

### Running the Full Stack

```bash
# Terminal 1
npm run dev

# Terminal 2
ollama serve

# Terminal 3
./ngrok http 7847
```

### Testing a Repository

```typescript
// Quick test in browser console or Node
import { userRepository } from '@/repositories/UserRepository'

const user = await userRepository.getOrCreate('+56912345678', 'John')
console.log(user)
```

### Adding a Logger

```typescript
// In src/lib/logger.ts, add:
export const myModuleLogger = createLogger('myModule')

// Then use:
import { myModuleLogger } from '@/lib/logger'
myModuleLogger.info('Something happened', { context })
```

### Debugging

- **Build issues**: Check `npm run build` output
- **TypeScript errors**: Type-check with `npx tsc --noEmit`
- **Prisma issues**: Check `npx prisma studio` to inspect data
- **Logs**: Check console output or `logs/` directory (if configured)
- **Phone numbers**: Always masked in logs for privacy

## Key Dependencies

- **Next.js 16** - Framework with Turbopack
- **Prisma 6.19** - ORM with SQLite
- **Winston 3.19** - Logging (replaces Pino)
- **Zod 4.2** - Schema validation
- **bcrypt 6.0** - Password hashing
- **Ollama 0.6** - Local LLM
- **Anthropic SDK** - Claude API integration
- **OpenAI SDK** - GPT integration (fallback)
- **NextAuth 4.24** - Authentication

## Important Notes

1. **Never hardcode secrets**: Use environment variables
2. **Always use repositories**: Direct Prisma calls only in repository layer
3. **Mask phone numbers**: Use `maskPhoneNumber()` before logging
4. **Type everything**: Strict TypeScript mode enabled
5. **Validate inputs**: Every API input needs Zod schema
6. **Winston for logs**: Never use `console.log` in production code
7. **Singleton pattern**: Create instances once, export as singleton
8. **Build before commit**: Always run `npm run build` and verify success

## Recent Changes (Phase 2)

### Phase 2 Step 1 (Completed)
- Created `AuthRepository` (234 lines)
- Created `AuthService` (287 lines)
- Implemented password migration to bcrypt
- Replaced Pino with Winston (Turbopack compatibility)
- Refactored NextAuth to use AuthService

### Phase 2 Step 2 Progress
- Created `WhatsAppRepository` (467 lines) - WhatsApp API interface
- Created `UserRepository` (247 lines) - User management
- Created `ConversationRepository` (341 lines) - Conversation lifecycle
- Created `MessageRepository` (353 lines) - Message storage with duplicate detection
- Created `WebhookLogRepository` (214 lines) - Webhook auditing
- **Next**: Services and webhook route refactoring

## Contact & Attribution

**Original Author**: Pierre Arturo Benites Solier (Devlmer)
- **Email**: bpier@zgamersa.com
- **Company**: PITHY (zgamersa.com)

**Architecture & Refactoring**: Claude Code (Anthropic)
- Started: Phase 1 security foundation
- Current: Phase 2 webhook refactoring
- Pattern: Repository → Service → Route (layered architecture)

---

**Last Updated**: January 14, 2026
**Repository**: https://github.com/Dysa-Devlmer/Chatbot-Devlmer-Prueba
**License**: PROPRIETARY
