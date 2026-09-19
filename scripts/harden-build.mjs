import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
if (existsSync('.env')) process.loadEnvFile('.env');
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory()
          ? walk(join(dir, entry.name))
          : join(dir, entry.name),
      ),
    )
  ).flat();
}

for (const name of [
  'PUBLIC_GITHUB_URL',
  'PUBLIC_LINKEDIN_URL',
  'PUBLIC_DISCORD_URL',
]) {
  const value = process.env[name];
  if (value) {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password)
      throw new Error(`${name} must be an HTTPS URL.`);
  }
}
const pages = (await walk('dist')).filter((file) => file.endsWith('.html'));
for (const file of pages) {
  let html = await readFile(file, 'utf8');
  const hashes = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)]
    .filter((match) => !/\bsrc=/.test(match[1]))
    .map(
      (match) =>
        `'sha256-${createHash('sha256').update(match[2]).digest('base64')}'`,
    );
  const policy = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
    `script-src 'self' 'wasm-unsafe-eval' https://giscus.app https://challenges.cloudflare.com ${[...new Set(hashes)].join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "img-src 'self' data:",
    `connect-src 'self' https://challenges.cloudflare.com ${workerOrigin}`.trim(),
    'frame-src https://giscus.app https://challenges.cloudflare.com',
  ].join('; ');
  html = html.replace(
    '<head>',
    `<head><meta http-equiv="Content-Security-Policy" content="${policy}">`,
  );
  await writeFile(file, html);
}
console.log(
  `Added a script-hashed Content Security Policy to ${pages.length} pages.`,
);
