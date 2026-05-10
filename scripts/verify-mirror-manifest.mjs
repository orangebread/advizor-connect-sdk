#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const manifest = JSON.parse(await readFile(path.join(root, 'SDK_SOURCE_MANIFEST.json'), 'utf8'));

async function hashFile(filePath) {
  return createHash('sha256').update(await readFile(filePath)).digest('hex');
}

for (const entry of manifest.files) {
  const fullPath = path.join(root, entry.path);
  const actual = await hashFile(fullPath);
  if (actual !== entry.sha256) {
    throw new Error(`Mirror manifest mismatch for ${entry.path}`);
  }
}

const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
if (pkg.repository?.url !== manifest.publicRepository.url) {
  throw new Error('package.json repository.url does not match mirror manifest');
}

console.log(`Verified ${manifest.files.length} mirror files from source commit ${manifest.source.commit}`);
