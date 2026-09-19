import { chromium } from '@playwright/test';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { preview } from 'astro';

await mkdir('test-results/performance', { recursive: true });
const server = await preview({
  server: { host: '127.0.0.1', port: 0 },
});
let browser;
try {
  browser = await chromium.launch({
    channel: 'chromium',
    args: ['--remote-debugging-port=9222'],
  });
  const summaries = [];
  for (const [name, route, config] of [
    ['home-mobile', '/', undefined],
    ['article-mobile', '/writeups/glyph/', undefined],
    ['home-desktop', '/', desktopConfig],
  ]) {
    const result = await lighthouse(
      `http://127.0.0.1:${server.port}${route}`,
      {
        port: 9222,
        output: ['html', 'json'],
        logLevel: 'error',
        onlyCategories: [
          'performance',
          'accessibility',
          'best-practices',
          'seo',
        ],
      },
      config,
    );
    if (!result || result.lhr.runtimeError)
      throw new Error(result?.lhr.runtimeError?.message || 'Lighthouse failed');
    await writeFile(`test-results/performance/${name}.html`, result.report[0]);
    await writeFile(`test-results/performance/${name}.json`, result.report[1]);
    const summary = {
      page: name,
      scores: Object.fromEntries(
        Object.entries(result.lhr.categories).map(([key, value]) => [
          key,
          Math.round(value.score * 100),
        ]),
      ),
      lcp: result.lhr.audits['largest-contentful-paint'].displayValue,
      cls: result.lhr.audits['cumulative-layout-shift'].displayValue,
      tbt: result.lhr.audits['total-blocking-time'].displayValue,
    };
    summaries.push(summary);
    console.log(JSON.stringify(summary));
  }
  await writeFile(
    'test-results/performance/summary.json',
    JSON.stringify(summaries, null, 2),
  );
} finally {
  try {
    await browser?.close();
  } finally {
    await server.stop();
  }
}
