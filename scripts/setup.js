import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const envPath = fileURLToPath(new URL('../server/.env', import.meta.url));
const examplePath = fileURLToPath(new URL('../server/.env.example', import.meta.url));

if (existsSync(envPath)) {
  console.log('server/.env already exists. Leaving it unchanged.');
} else {
  if (!existsSync(examplePath)) {
    console.error('Could not find server/.env.example. Re-extract the project and try again.');
    process.exit(1);
  }
  const template = readFileSync(examplePath, 'utf8');
  const secret = randomBytes(48).toString('hex');
  const configured = template.replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${secret}`);
  writeFileSync(envPath, configured, { flag: 'wx' });
  console.log('Created server/.env with a unique JWT secret.');
}

console.log('\nNext steps:');
console.log('1. Make sure your local MongoDB service is running, or configure MONGODB_URI in server/.env.');
console.log('2. Run: npm run seed');
console.log('3. Run: npm run dev');
console.log('\nAPI: http://localhost:4000/api/health');
console.log('Web: http://localhost:5173');
