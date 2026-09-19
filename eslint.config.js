import js from '@eslint/js';
import ts from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import globals from 'globals';

export default ts.config(
  {
    ignores: [
      'dist/**',
      '.astro/**',
      '**/.wrangler/**',
      'node_modules/**',
      '.local/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...astro.configs.recommended,
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  {
    files: ['**/*.astro'],
    languageOptions: { parserOptions: { parser: ts.parser } },
  },
  {
    files: ['worker/**/*.ts', 'tests/unit/**/*.ts'],
    languageOptions: {
      globals: {
        D1Database: 'readonly',
        ExecutionContext: 'readonly',
        ScheduledController: 'readonly',
      },
    },
  },
  {
    files: ['worker/src/security.ts', 'worker/src/index.ts'],
    rules: { 'no-control-regex': 'off' },
  },
);
