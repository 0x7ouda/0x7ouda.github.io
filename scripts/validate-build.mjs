import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, join, extname, relative } from 'node:path';
import { existsSync } from 'node:fs';

if (existsSync('.env')) process.loadEnvFile('.env');

const root = resolve('dist');
const base = (process.env.SITE_BASE || '/').replace(/\/$/, '');

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

const files = await walk(root);
const pages = files.filter((file) => extname(file) === '.html');

const failures = [];
const ids = new Map();

for (const file of pages) {
  const html = await readFile(file, 'utf8');

  ids.set(
    file,
    new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1])),
  );
}

for (const file of pages) {
  const html = await readFile(file, 'utf8');

  if (
    !/<title>[^<]+<\/title>/.test(html) ||
    !/rel="canonical"/.test(html) ||
    !/name="description"/.test(html)
  ) {
    failures.push(`${relative(root, file)}: missing SEO metadata`);
  }

  if ((html.match(/<h1\b/g) || []).length !== 1) {
    failures.push(`${relative(root, file)}: expected one h1`);
  }

  for (const [, attribute, target] of html.matchAll(
    /\b(href|src)="([^"<>]+)"/g,
  )) {
    if (/^(?:https?:|mailto:|data:|tel:)/.test(target)) continue;

    if (!target.startsWith('/') && !target.startsWith('#')) continue;

    const [pathname, hash] = target.split('#');

    let disk = file;

    if (pathname) {
      const route = decodeURIComponent(pathname.split('?')[0]);

      if (base && !route.startsWith(`${base}/`)) {
        failures.push(`${relative(root, file)}: missing base in ${target}`);
        continue;
      }

      disk = resolve(root, `.${route.slice(base.length)}`);

      if (
        !disk.startsWith(`${root}\\`) &&
        !disk.startsWith(`${root}/`) &&
        disk !== root
      ) {
        failures.push(`Path escape: ${target}`);
        continue;
      }

      try {
        if ((await stat(disk)).isDirectory()) {
          disk = join(disk, 'index.html');
        }

        await stat(disk);
      } catch {
        failures.push(
          `${relative(root, file)}: missing ${attribute} ${target}`,
        );
        continue;
      }
    }

    if (hash && ids.has(disk) && !ids.get(disk).has(decodeURIComponent(hash))) {
      failures.push(`${relative(root, file)}: missing anchor ${target}`);
    }
  }
}

for (const required of [
  'rss.xml',
  'robots.txt',
  'sitemap-index.xml',
  '404.html',
  'pagefind/pagefind.js',
  'og/default.png',
]) {
  try {
    await stat(join(root, required));
  } catch {
    failures.push(`Missing ${required}`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

const jsBytes = (
  await Promise.all(
    files
      .filter((f) => /[\\/]_astro[\\/].*\.js$/.test(f))
      .map(async (file) => (await stat(file)).size),
  )
).reduce((a, b) => a + b, 0);

const home = await readFile(join(root, 'index.html'), 'utf8');

const inlineBytes = [
  ...home.matchAll(/<script type="module">([\s\S]*?)<\/script>/g),
].reduce((sum, match) => sum + Buffer.byteLength(match[1]), 0);

console.log(
  `Validated ${pages.length} HTML pages, local links and anchors, SEO metadata, and required outputs.\nHomepage first-party JavaScript: ${((jsBytes + inlineBytes) / 1024).toFixed(1)} KiB uncompressed including inline modules (search index lazy-loaded).`,
);
