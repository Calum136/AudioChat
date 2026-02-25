const test = require('node:test');
const assert = require('node:assert/strict');
const { issueToken, verifyToken } = require('../src/auth');

test('issued token verifies and returns user id', () => {
  const now = Date.UTC(2026, 0, 1);
  const token = issueToken({ userId: 'u1', secret: 'secret', now });
  const result = verifyToken(token, { secret: 'secret', now: now + 1000 });
  assert.equal(result.valid, true);
  assert.equal(result.userId, 'u1');
});

test('expired token fails verification', () => {
  const now = Date.UTC(2026, 0, 1);
  const token = issueToken({ userId: 'u1', secret: 'secret', now, ttlMs: 10 });
  const result = verifyToken(token, { secret: 'secret', now: now + 11 });
  assert.equal(result.valid, false);
  assert.equal(result.reason, 'expired');
});
