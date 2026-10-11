// Build, serve and rebuild on change:  npm run dev
import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './preview.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let timer;
let running = false;
let again = false;

function rebuild() {
  if (running) {
    again = true;
    return;
  }
  running = true;
  const p = spawn(process.execPath, ['src/build.mjs'], { cwd: ROOT, stdio: 'inherit' });
  p.on('close', () => {
    running = false;
    if (again) {
      again = false;
      rebuild();
    }
  });
}

rebuild();
for (const dir of ['content', 'src', 'public']) {
  watch(path.join(ROOT, dir), { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(rebuild, 120);
  });
}
serve(Number(process.env.PORT) || 4173);
console.log('watching content/, src/, public/ ...');
