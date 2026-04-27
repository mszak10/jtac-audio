// Builds dist/ and writes a Chrome Web Store-ready ZIP at the project root.
// Usage: npm run package

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(here, '..');
const distDir = resolve(projectRoot, 'dist');
const pkg = JSON.parse(
  readFileSync(resolve(projectRoot, 'package.json'), 'utf8'),
);
const zipPath = resolve(projectRoot, `${pkg.name}-v${pkg.version}.zip`);

console.log(`[package] building dist/`);
execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' });

if (!existsSync(distDir)) {
  throw new Error(`build did not produce ${distDir}`);
}

const manifestPath = resolve(distDir, 'manifest.json');
if (!existsSync(manifestPath)) {
  throw new Error(`dist/ has no manifest.json — refusing to package`);
}

if (existsSync(zipPath)) {
  rmSync(zipPath);
}

console.log(`[package] zipping → ${zipPath}`);
const zip = new AdmZip();
zip.addLocalFolder(distDir);
zip.writeZip(zipPath);

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
console.log(`[package] done.`);
console.log(`          name:    ${manifest.name}`);
console.log(`          version: ${manifest.version}`);
console.log(`          file:    ${zipPath}`);
