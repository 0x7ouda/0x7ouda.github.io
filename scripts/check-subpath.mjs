import { strict as assert } from 'node:assert';
import { chromium } from '@playwright/test';
import { preview } from 'astro';
const base = (process.env.SITE_BASE || '/research-lab/').replace(/\/$/, '');
const server = await preview({
  base,
  server: { host: '127.0.0.1', port: 4323 },
});
const browser = await chromium.launch({ channel: 'chromium' });
try {
  const page = await browser.newPage();
  const failed = [];
  page.on('response', (response) => {
    if (
      response.url().startsWith('http://127.0.0.1:4323') &&
      response.status() >= 400
    )
      failed.push(response.url());
  });
  await page.goto(`http://127.0.0.1:4323${base}/`);
  await page.getByRole('searchbox').click();
  await page.getByRole('searchbox').fill('WebCache');
  await page.locator('.search-result').first().waitFor();
  const links = await page
    .locator('.search-result')
    .evaluateAll((items) => items.map((item) => item.getAttribute('href')));
  assert(
    links.every((link) =>
      new URL(link, 'http://127.0.0.1:4323').pathname.startsWith(`${base}/`),
    ),
  );
  await page.locator('.search-result').first().click();
  await page.locator('h1').waitFor();
  assert(new URL(page.url()).pathname.startsWith(`${base}/`));
  assert.deepEqual(failed, []);
  console.log(
    'Project-subpath browser smoke test passed, including Pagefind result navigation.',
  );
} finally {
  await browser.close();
  await server.stop();
}
