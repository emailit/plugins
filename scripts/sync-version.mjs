#!/usr/bin/env node
// Sets one version across every plugin manifest.
// Usage: node scripts/sync-version.mjs [version]   (defaults to plugin.json's version)

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MANIFESTS = ['plugin.json', '.cursor-plugin/plugin.json', '.claude-plugin/plugin.json', '.grok-plugin/plugin.json', 'package.json'];

const version = process.argv[2] || JSON.parse(readFileSync(join(root, 'plugin.json'), 'utf8')).version;
if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
  console.error(`"${version}" is not a semantic version.`);
  process.exit(1);
}

for (const path of MANIFESTS) {
  const file = join(root, path);
  const text = readFileSync(file, 'utf8');
  const next = text.replace(/("version"\s*:\s*")[^"]*(")/, `$1${version}$2`);
  if (next !== text) {
    writeFileSync(file, next);
    console.log(`${path}: ${version}`);
  }
}

const changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf8');
if (!changelog.includes(`## ${version}`)) console.warn(`Add a "## ${version}" section to CHANGELOG.md.`);
