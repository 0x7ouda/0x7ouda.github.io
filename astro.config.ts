import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { existsSync } from 'node:fs';
import { codeTheme } from './src/lib/code-theme';
import { yaraLanguage } from './src/lib/yara';
import { remarkResearch, rehypePublication } from './src/lib/markdown';
import { unified } from '@astrojs/markdown-remark';

if (existsSync('.env')) process.loadEnvFile('.env');
const base = process.env.SITE_BASE || '/';
export default defineConfig({
  site: process.env.SITE_URL || 'https://0x7ouda.github.io',
  base,
  trailingSlash: 'always',
  output: 'static',
  integrations: [sitemap({ filter: (url) => !url.endsWith('/404/') })],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkResearch],
      rehypePlugins: [[rehypePublication, { base }]],
    }),
    shikiConfig: {
      theme: codeTheme,
      langs: [yaraLanguage],
      wrap: false,
      langAlias: { sigma: 'yaml', registry: 'ini', kql: 'kusto' },
      transformers: [
        {
          pre(node) {
            node.properties['data-code-block'] = '';
            node.properties.tabIndex = 0;
            const meta = this.options.meta?.__raw || '';
            node.properties['data-filename'] =
              /title="([^"]+)"/.exec(meta)?.[1] || this.options.lang || 'code';
          },
        },
      ],
    },
  },
});
