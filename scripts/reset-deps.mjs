// scripts/reset-deps.mjs
// Cross-platform "clean reinstall" helper.
//   npm run reset
// Removes node_modules + .next so the next `npm install` re-downloads the
// platform-specific Next.js native binaries (@next/swc-*).
import { rmSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

for (const target of ['node_modules', '.next']) {
  const path = join(root, target);
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true });
    console.log(`removed ${target}/`);
  } else {
    console.log(`skipped ${target}/ (not present)`);
  }
}

console.log('\nDone. Now run:');
console.log('  npm cache verify');
console.log('  npm install');
console.log('  npm run dev');
