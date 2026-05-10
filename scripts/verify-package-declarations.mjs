import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, posix, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(scriptDir, '..');

const packOutput = execFileSync('npm', ['pack', '--dry-run', '--json'], {
  cwd: packageRoot,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'inherit'],
});
const pack = JSON.parse(packOutput);
const packedFiles = new Set(pack[0].files.map((file) => file.path));

const requiredDeclarations = [
  'dist/index.d.ts',
  'dist/client.d.ts',
  'dist/integration.d.ts',
  'dist/owner.d.ts',
  'dist/widget.d.ts',
  'dist/generated/v1.d.ts',
];

const missingRequired = requiredDeclarations.filter((file) => !packedFiles.has(file));
if (missingRequired.length > 0) {
  throw new Error(`SDK package is missing required declaration artifacts: ${missingRequired.join(', ')}`);
}

const relativeDeclarationImportPattern = /(?:from\s+|import\s*\(\s*)['"](\.[^'"]+)['"]/g;
const unresolved = [];
const invalidDeclarations = [];

function declarationCandidates(fromFile, specifier) {
  const base = posix.normalize(posix.join(posix.dirname(fromFile), specifier));
  if (specifier.endsWith('.js')) {
    return [`${base.slice(0, -3)}.d.ts`];
  }
  if (specifier.endsWith('.d.ts')) {
    return [base];
  }
  return [`${base}.d.ts`, posix.join(base, 'index.d.ts')];
}

for (const file of [...packedFiles].filter((entry) => entry.endsWith('.d.ts')).sort()) {
  const absoluteFile = join(packageRoot, file);
  if (!existsSync(absoluteFile)) {
    unresolved.push(`${file} is listed in npm pack output but does not exist on disk`);
    continue;
  }

  const source = readFileSync(absoluteFile, 'utf8');
  if (/\bgetGroupSitemap\s*\([^)]*\):\s*Promise<never>;/.test(source)) {
    invalidDeclarations.push(`${file} exposes getGroupSitemap as Promise<never>`);
  }
  if (/\bgetAdvisorJsonLd\s*\([^)]*\):\s*Promise<never>;/.test(source)) {
    invalidDeclarations.push(`${file} exposes getAdvisorJsonLd as Promise<never>`);
  }
  for (const match of source.matchAll(relativeDeclarationImportPattern)) {
    const specifier = match[1];
    const candidates = declarationCandidates(file, specifier);
    if (!candidates.some((candidate) => packedFiles.has(candidate))) {
      unresolved.push(`${file} imports ${specifier}, expected one of: ${candidates.join(', ')}`);
    }
  }
}

if (unresolved.length > 0) {
  throw new Error(`SDK package declaration imports do not resolve:\n${unresolved.map((item) => `- ${item}`).join('\n')}`);
}

if (invalidDeclarations.length > 0) {
  throw new Error(`SDK package declarations expose invalid public helper types:\n${invalidDeclarations.map((item) => `- ${item}`).join('\n')}`);
}

const relativeRoot = relative(process.cwd(), packageRoot) || '.';
console.log(`Verified packed SDK declarations for ${pack[0].name}@${pack[0].version} in ${relativeRoot}: ${packedFiles.size} files, ${requiredDeclarations.length} required declarations, all relative .d.ts imports resolved.`);
