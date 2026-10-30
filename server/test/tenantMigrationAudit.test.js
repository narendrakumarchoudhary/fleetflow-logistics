import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const read=p=>fs.readFileSync(path.join(here,'..','src',p),'utf8');
test('tenant backfill is dry-run by default and requires explicit apply',()=>{
 const s=read('migrations/tenantBackfill.js');
 assert.match(s,/const apply = process\.argv\.includes\('--apply'\)/);
 assert.match(s,/mode: 'dry-run'/);
 assert.match(s,/Re-run with --apply/);
});
test('migration scopes backfill to records without tenant identity',()=>{
 const s=read('migrations/tenantBackfill.js');
 assert.match(s,/tenantId: \{ \$exists: false \}/);
 assert.match(s,/updateMany\(\{ tenantId: \{ \$exists: false \} \}, \{ \$set: \{ tenantId: tenant\._id \} \}\)/);
});
test('migration replaces only global unique vehicle and driver indexes',()=>{
 const s=read('migrations/tenantBackfill.js');
 assert.match(s,/\['vehicles', 'registration'\], \['drivers', 'license'\]/);
 assert.match(s,/index\.unique && Object\.keys\(index\.key \|\| \{\}\)\.length === 1/);
 assert.match(s,/await Model\.syncIndexes\(\)/);
});
test('user email remains globally unique as a login identity',()=>{
 const user=read('models/User.js');
 assert.match(user,/email: \{ type: String, required: true, unique: true/);
});
