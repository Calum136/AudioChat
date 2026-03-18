const crypto = require('crypto');

function base64url(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function sign(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

function issueToken({ userId, secret, ttlMs = 24 * 60 * 60 * 1000, now = Date.now() }) {
  const body = {
    userId,
    exp: now + ttlMs,
  };
  const payload = base64url(JSON.stringify(body));
  const signature = sign(payload, secret);
  return `${payload}.${signature}`;
}

function verifyToken(token, { secret, now = Date.now() }) {
  if (!token || !token.includes('.')) {
    return { valid: false, reason: 'malformed' };
  }
  const [payload, receivedSignature] = token.split('.');
  const expectedSignature = sign(payload, secret);

  if (expectedSignature !== receivedSignature) {
    return { valid: false, reason: 'signature_mismatch' };
  }

  let parsed;
  try {
    parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return { valid: false, reason: 'malformed_payload' };
  }

  if (!parsed.userId || !parsed.exp) {
    return { valid: false, reason: 'missing_claims' };
  }

  if (parsed.exp < now) {
    return { valid: false, reason: 'expired' };
  }

  return { valid: true, userId: parsed.userId, exp: parsed.exp };
}

module.exports = {
  issueToken,
  verifyToken,
};
