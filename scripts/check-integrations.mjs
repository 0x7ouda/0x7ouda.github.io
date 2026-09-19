import { strict as assert } from 'node:assert';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { preview } from 'astro';

const server = await preview({
  server: {
    host: '127.0.0.1',
    port: 4322,
  },
});

const browser = await chromium.launch({ channel: 'chromium' });

try {
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 },
  ]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();

    const errors = [];

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    page.on('console', (message) => {
      if (
        message.type() === 'error' &&
        /Content Security Policy/.test(message.text())
      ) {
        errors.push(message.text());
      }
    });

    let externalLoads = 0;

    await page.route('https://giscus.app/client.js', async (route) => {
      externalLoads++;

      await route.fulfill({
        contentType: 'application/javascript',
        body: `
          const giscus = document.querySelector('.giscus');
          if (giscus) {
            giscus.setAttribute('data-test-loaded', 'true');
          }
        `,
      });
    });

    await page.goto('http://127.0.0.1:4322/');

    await page.waitForFunction(
      () =>
        getComputedStyle(document.querySelector('.page-shell')).opacity === '1',
    );

    assert.equal(
      externalLoads,
      0,
      'Third-party discussion widget must wait for interaction',
    );

    const accessibility = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    assert.deepEqual(
      accessibility.violations.map(({ id, nodes }) => ({
        id,
        targets: nodes.map((node) => node.target),
      })),
      [],
    );

    await page.goto('http://127.0.0.1:4322/writeups/glyph/');

    await page
      .getByRole('button', { name: 'Load discussion & reactions' })
      .click();

    await page.locator('.giscus[data-test-loaded="true"]').waitFor();

    assert.equal(
      externalLoads,
      1,
      'Giscus should load once after discussion interaction',
    );

    assert.deepEqual(errors, []);

    await context.close();
  }

  console.log(
    'Configured desktop and mobile integrations passed: lazy Giscus loading, accessibility, and CSP. External discussion service was mocked.',
  );
} finally {
  await browser.close();
  await server.stop();
}
