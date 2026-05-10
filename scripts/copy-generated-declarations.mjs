import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(scriptDir, '..');
const source = join(packageRoot, 'src', 'generated', 'v1.d.ts');
const target = join(packageRoot, 'dist', 'generated', 'v1.d.ts');

mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);
console.log('Copied generated OpenAPI declarations to dist/generated/v1.d.ts');
