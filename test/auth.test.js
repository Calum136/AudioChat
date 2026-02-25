const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
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

test('token with wrong secret fails signature check', () => {
  const token = issueToken({ userId: 'u1', secret: 'secret-A' });
  const result = verifyToken(token, { secret: 'secret-B' });
  assert.equal(result.valid, false);
  assert.equal(result.reason, 'signature_mismatch');
});

test('malformed token (no dot) returns malformed', () => {
  const result = verifyToken('nodothere', { secret: 'secret' });
  assert.equal(result.valid, false);
  assert.equal(result.reason, 'malformed');
});

test('null/undefined/empty token returns malformed', () => {
  assert.equal(verifyToken(null, { secret: 's' }).valid, false);
  assert.equal(verifyToken(undefined, { secret: 's' }).valid, false);
  assert.equal(verifyToken('', { secret: 's' }).valid, false);
});

test('token with corrupted base64 payload fails', () => {
  const result = verifyToken('!!!invalid!!!.fakesig', { secret: 'secret' });
  assert.equal(result.valid, false);
});

test('token missing userId claim fails', () => {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + 10000 }))
    .toString('base64url');
  const sig = crypto.createHmac('sha256', 'secret').update(payload).digest('base64url');
  const result = verifyToken(`${payload}.${sig}`, { secret: 'secret' });
  assert.equal(result.valid, false);
  assert.equal(result.reason, 'missing_claims');
});

test('token missing exp claim fails', () => {
  const payload = Buffer.from(JSON.stringify({ userId: 'u1' }))
    .toString('base64url');
  const sig = crypto.createHmac('sha256', 'secret').update(payload).digest('base64url');
  const result = verifyToken(`${payload}.${sig}`, { secret: 'secret' });
  assert.equal(result.valid, false);
  assert.equal(result.reason, 'missing_claims');
});

test('custom TTL is respected', () => {
  const now = Date.UTC(2026, 0, 1);
  const token = issueToken({ userId: 'u1', secret: 's', now, ttlMs: 5000 });
  const stillValid = verifyToken(token, { secret: 's', now: now + 4999 });
  assert.equal(stillValid.valid, true);
  const expired = verifyToken(token, { secret: 's', now: now + 5001 });
  assert.equal(expired.valid, false);
});
