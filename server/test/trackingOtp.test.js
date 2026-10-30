import test from 'node:test';
import assert from 'node:assert/strict';
import { createTrackingCode, hashTrackingCode, isValidTrackingCode } from '../src/utils/trackingOtp.js';

test('tracking code is a six digit string including leading zeroes', () => {
  for (let i = 0; i < 100; i++) {
    const code = createTrackingCode();
    assert.match(code, /^\d{6}$/);
    assert.equal(isValidTrackingCode(code), true);
  }
});

test('tracking code hash is deterministic and does not equal plaintext', () => {
  const code = '004291';
  const first = hashTrackingCode(code);
  assert.equal(first, hashTrackingCode(code));
  assert.notEqual(first, code);
  assert.match(first, /^[a-f0-9]{64}$/);
});

test('tracking code validator rejects malformed values', () => {
  for (const value of ['', '12345', '1234567', '12a456', ' 123456', null, undefined]) {
    assert.equal(isValidTrackingCode(value), false);
  }
});
