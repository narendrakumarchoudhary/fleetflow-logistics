import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Resolve the env file from this source file, never from process.cwd().
// This is reliable for npm workspaces, PowerShell, Docker and direct node runs.
const serverEnvPath = fileURLToPath(new URL('../../.env', import.meta.url));
const rootEnvPath = fileURLToPath(new URL('../../../.env', import.meta.url));
export const loadedEnvPath = existsSync(serverEnvPath)
  ? serverEnvPath
  : existsSync(rootEnvPath)
    ? rootEnvPath
    : null;

function loadEnvFile(path) {
  const content = readFileSync(path, 'utf8').replace(/^\uFEFF/, '');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    const key = match[1];
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, '').trim();
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

if (loadedEnvPath) {
  loadEnvFile(loadedEnvPath);
} else if (process.env.NODE_ENV !== 'test') {
  console.warn(`[FleetFlow] No .env file found. Expected: ${serverEnvPath}\nRun "npm run setup" from the project root to create it.`);
}
