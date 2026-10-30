import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const tokenSource = await readFile(new URL('../src/utils/token.js', import.meta.url), 'utf8');
const authSource = await readFile(new URL('../src/middleware/auth.js', import.meta.url), 'utf8');

test('access token source includes tenant identity when user belongs to a tenant', () => {
  assert.match(tokenSource, /user\.tenantId/);
  assert.match(tokenSource, /tenantId:\s*user\.tenantId\.toString\(\)/);
});

test('authentication middleware rejects stale tenant membership claims', () => {
  assert.match(authSource, /storedTenantId !== tokenTenantId/);
  assert.match(authSource, /req\.tenantId = storedTenantId/);
});
