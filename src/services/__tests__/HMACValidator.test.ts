import assert from 'node:assert/strict'
import crypto from 'crypto'
import { test } from 'node:test'
import { HMACValidator } from '../HMACValidator'

test('validateSignature accepts valid signature', () => {
  const secret = 'test-secret-key'
  const payload = JSON.stringify({ test: 'data' })
  const validHmac = crypto.createHmac('sha256', secret)
  validHmac.update(payload)
  const validSignature = `sha256=${validHmac.digest('hex')}`

  const result = HMACValidator.validateSignature(payload, validSignature, secret)
  assert.equal(result.valid, true)
})

test('validateSignature rejects invalid signature', () => {
  const secret = 'test-secret-key'
  const payload = JSON.stringify({ test: 'data' })
  const invalidSignature = 'sha256=invalid_hash_abc123'

  const result = HMACValidator.validateSignature(payload, invalidSignature, secret)
  assert.equal(result.valid, false)
  assert.ok(result.error)
})

test('validateSignature rejects malformed signature header', () => {
  const secret = 'test-secret-key'
  const payload = JSON.stringify({ test: 'data' })
  const malformedSignature = 'invalid_format'

  const result = HMACValidator.validateSignature(payload, malformedSignature, secret)
  assert.equal(result.valid, false)
})

test('validateSignature rejects empty payload', () => {
  const secret = 'test-secret-key'
  const payload = ''
  const signature = 'sha256=abc'

  const result = HMACValidator.validateSignature(payload, signature, secret)
  assert.equal(result.valid, false)
})

test('validateSignature rejects unsupported algorithm', () => {
  const secret = 'test-secret-key'
  const payload = JSON.stringify({ test: 'data' })
  const wrongAlgoSignature = 'sha512=abc123'

  const result = HMACValidator.validateSignature(payload, wrongAlgoSignature, secret)
  assert.equal(result.valid, false)
})

test('isConfigured returns true when secret set', () => {
  const originalEnv = process.env.WHATSAPP_WEBHOOK_SECRET
  process.env.WHATSAPP_WEBHOOK_SECRET = 'configured-secret'

  const result = HMACValidator.isConfigured()
  assert.equal(result, true)

  process.env.WHATSAPP_WEBHOOK_SECRET = originalEnv
})

test('isConfigured returns false when secret missing', () => {
  const originalEnv = process.env.WHATSAPP_WEBHOOK_SECRET
  delete process.env.WHATSAPP_WEBHOOK_SECRET

  const result = HMACValidator.isConfigured()
  assert.equal(result, false)

  if (originalEnv) {
    process.env.WHATSAPP_WEBHOOK_SECRET = originalEnv
  }
})
