const test = require('node:test');
const assert = require('node:assert/strict');
const { parseQuery } = require('../src/realtime-query');

test('parseQuery reads token from websocket url', () => {
  const result = parseQuery('/realtime?token=abc123');
  assert.equal(result.token, 'abc123');
});

test('parseQuery returns undefined when token is absent', () => {
  const result = parseQuery('/realtime');
  assert.equal(result.token, undefined);
});
