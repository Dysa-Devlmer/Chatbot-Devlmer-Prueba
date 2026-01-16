import assert from 'node:assert/strict'
import crypto from 'crypto'
import { afterEach, test } from 'node:test'
import { NextRequest } from 'next/server'
import { webhookAuthMiddleware, getHttpStatus } from '@/middleware/webhook-auth'
import { rateLimiter } from '@/services/RateLimiter'

const secret = 'test-webhook-secret'
const payload = JSON.stringify({
  entry: [
    {
      changes: [
        {
          value: {
            messages: [
              {
                from: '5491234567890',
                id: 'msg-123',
              },
            ],
          },
        },
      ],
    },
  ],
})

const hmac = crypto.createHmac('sha256', secret)
hmac.update(payload)
const validSignature = `sha256=${hmac.digest('hex')}`

const createMockRequest = (body: string, signature?: string) =>
  ({
    text: async () => body,
    headers: new Map(signature ? [['X-Hub-Signature-256', signature]] : []),
    ip: '192.168.1.1',
  } as unknown as NextRequest)

const originalCheckLimit = rateLimiter.checkLimit.bind(rateLimiter)

afterEach(() => {
  rateLimiter.checkLimit = originalCheckLimit
  delete process.env.WHATSAPP_WEBHOOK_SECRET
})

test('webhookAuthMiddleware allows valid HMAC and rate limit', async () => {
  process.env.WHATSAPP_WEBHOOK_SECRET = secret
  const request = createMockRequest(payload, validSignature)

  const result = await webhookAuthMiddleware(request)

  assert.equal(result.valid, true)
  assert.equal(result.error, undefined)
  assert.equal(result.rateLimitInfo?.allowed, true)
})

test('webhookAuthMiddleware rejects invalid HMAC', async () => {
  process.env.WHATSAPP_WEBHOOK_SECRET = secret
  const invalidSignature = 'sha256=invalid_hash_abc123'
  const request = createMockRequest(payload, invalidSignature)

  const result = await webhookAuthMiddleware(request)

  assert.equal(result.valid, false)
  assert.ok(result.error)
})

test('webhookAuthMiddleware rejects when rate limit exceeded', async () => {
  process.env.WHATSAPP_WEBHOOK_SECRET = secret
  rateLimiter.checkLimit = () => ({
    allowed: false,
    limit: 100,
    remaining: 0,
    resetTime: Date.now() + 60000,
    error: 'Rate limit exceeded',
  })

  const request = createMockRequest(payload, validSignature)
  const result = await webhookAuthMiddleware(request)

  assert.equal(result.valid, false)
  assert.equal(getHttpStatus(result), 429)
})

test('getHttpStatus returns 200 for valid auth', () => {
  const result = { valid: true }
  assert.equal(getHttpStatus(result), 200)
})

test('getHttpStatus returns 401 for invalid signature', () => {
  const result = { valid: false, error: 'Invalid HMAC signature' }
  assert.equal(getHttpStatus(result), 401)
})

test('getHttpStatus returns 429 for rate limit exceeded', () => {
  const result = { valid: false, error: 'Rate limit exceeded' }
  assert.equal(getHttpStatus(result), 429)
})
