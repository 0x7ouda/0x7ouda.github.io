import { preview } from 'astro';

// Use the API so Astro's CLI cannot detach the server in an agent environment.
// Playwright owns this process and must test this build, not a reused dev server.
const server = await preview({
  server: { host: '127.0.0.1', port: 4321 },
  vite: { preview: { strictPort: true } },
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => void server.stop());
}
await server.closed();
