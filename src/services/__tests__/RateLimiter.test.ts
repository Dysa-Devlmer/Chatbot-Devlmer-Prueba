import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { RateLimiter } from '../RateLimiter'

let limiter: RateLimiter

beforeEach(() => {
  limiter = new RateLimiter({
    windowMs: 1000,
    maxRequests: 5,
  })
})

afterEach(() => {
  limiter.destroy()
})

test('checkLimit allows first request', () => {
  const result = limiter.checkLimit('user-1')
  assert.equal(result.allowed, true)
  assert.equal(result.remaining, 4)
})

test('checkLimit allows requests within limit', () => {
  for (let i = 0; i < 5; i++) {
    const result = limiter.checkLimit('user-1')
    assert.equal(result.allowed, true)
  }
})

test('checkLimit blocks requests exceeding limit', () => {
  for (let i = 0; i < 5; i++) {
    limiter.checkLimit('user-1')
  }

  const result = limiter.checkLimit('user-1')
  assert.equal(result.allowed, false)
  assert.ok(result.error)
})

test('checkLimit resets after window expires', async () => {
  for (let i = 0; i < 5; i++) {
    limiter.checkLimit('user-2')
  }

  await new Promise((resolve) => setTimeout(resolve, 1100))

  const result = limiter.checkLimit('user-2')
  assert.equal(result.allowed, true)
})

test('checkLimit blocks users independently', () => {
  for (let i = 0; i < 5; i++) {
    limiter.checkLimit('user-a')
  }

  const resultA = limiter.checkLimit('user-a')
  assert.equal(resultA.allowed, false)

  const resultB = limiter.checkLimit('user-b')
  assert.equal(resultB.allowed, true)
})

test('reset clears counter for key', () => {
  for (let i = 0; i < 5; i++) {
    limiter.checkLimit('user-3')
  }

  limiter.reset('user-3')

  const result = limiter.checkLimit('user-3')
  assert.equal(result.allowed, true)
  assert.equal(result.remaining, 4)
})

test('getStatus returns status for key', () => {
  limiter.checkLimit('user-4')
  limiter.checkLimit('user-4')

  const status = limiter.getStatus('user-4')
  assert.equal(status.count, 2)
  assert.equal(status.remaining, 3)
  assert.equal(status.isBlocked, false)
})

test('getStatus returns default status for unknown key', () => {
  const status = limiter.getStatus('unknown')
  assert.equal(status.count, 0)
  assert.equal(status.remaining, 5)
  assert.equal(status.isBlocked, false)
})
