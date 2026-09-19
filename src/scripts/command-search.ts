import { commandSections, parseCommand } from '../lib/commands';

type SearchEntry = {
  url: string;
  title: string;
  description: string;
  type: string;
  text: string;
  tags: string[];
  author: string;
};
type Match = Pick<SearchEntry, 'url' | 'title' | 'description' | 'type'>;
type Pagefind = {
  search: (
    query: string,
    options?: { filters: Record<string, string> },
  ) => Promise<{
    results: {
      data: () => Promise<{
        url: string;
        excerpt: string;
        meta: { title?: string; type?: string };
        filters: Record<string, string[]>;
      }>;
    }[];
  }>;
};

const search = document.querySelector<HTMLElement>('[data-command-search]')!;
const input = search.querySelector<HTMLInputElement>('#command-input')!;
const output = search.querySelector<HTMLElement>('.command-output')!;
const results = search.querySelector<HTMLElement>('.search-results')!;
const status = search.querySelector<HTMLElement>('.search-status')!;
const filters = search.querySelector<HTMLElement>('.search-filters')!;
const base = search.dataset.base!;
let sequence = 0,
  kind = '';
let timer: ReturnType<typeof setTimeout>;
let pagefind: Promise<Pagefind> | undefined;
let fallback: Promise<SearchEntry[]> | undefined;

function showMatches(matches: Match[]) {
  results.replaceChildren();
  for (const match of matches) {
    const url = new URL(match.url, location.origin);
    if (url.origin !== location.origin || !url.pathname.startsWith(base))
      continue;
    const link = document.createElement('a');
    link.className = 'search-result';
    link.href = url.href;
    for (const [className, value] of [
      ['result-type', match.type],
      ['result-title', match.title],
      ['result-excerpt', match.description.slice(0, 200)],
    ]) {
      const span = document.createElement('span');
      span.className = className!;
      span.textContent = value!;
      link.append(span);
    }
    results.append(link);
  }
}
function syncFilters() {
  search
    .querySelectorAll<HTMLElement>('[data-search-type]')
    .forEach((button) =>
      button.setAttribute(
        'aria-pressed',
        String(button.dataset.searchType === kind),
      ),
    );
}
function clear() {
  ++sequence;
  clearTimeout(timer);
  input.value = '';
  kind = '';
  syncFilters();
  results.replaceChildren();
  output.hidden = true;
  input.focus();
}
async function runSearch() {
  const request = ++sequence;
  const command = parseCommand(input.value);
  output.hidden = !input.value.trim();
  results.replaceChildren();
  if (output.hidden) return;
  filters.hidden = command.kind !== 'search';
  if (command.kind === 'clear') {
    status.textContent = 'Press Enter to clear the command.';
    return;
  }
  if (command.kind === 'unknown') {
    status.textContent =
      'Unknown section. Try cd research, cd writeups, or help.';
    return;
  }
  if (command.kind === 'help') {
    status.textContent =
      'Use cd to open a section, / to search the archive, or clear to start again.';
    showMatches(
      Object.entries(commandSections).map(([section, route]) => ({
        url: `${base}${route}`,
        title: `cd ${section}`,
        description: `Open the ${section} section.`,
        type: 'Navigation',
      })),
    );
    return;
  }
  if (command.kind === 'navigate') {
    status.textContent = 'Press Enter or follow the link to open this section.';
    showMatches([
      {
        url: `${base}${command.route}`,
        title: `Open ${command.section}`,
        description: 'Navigate within the research lab.',
        type: 'Navigation',
      },
    ]);
    return;
  }
  if (!command.query) {
    status.textContent =
      'Type an artifact, title, tool, or phrase to search the archive.';
    return;
  }
  status.textContent = 'Searching the research archive…';
  try {
    let matches: Match[], total: number;
    if (import.meta.env.DEV) {
      fallback ??= fetch(`${base}search-index.json`).then((response) => {
        if (!response.ok) throw new Error('Index unavailable');
        return response.json() as Promise<SearchEntry[]>;
      });
      const entries = await fallback;
      const terms = command.query
        .toLocaleLowerCase()
        .split(/\s+/)
        .filter(Boolean);
      matches = entries.filter(
        (entry) =>
          (!kind || entry.type === kind) &&
          terms.every((term) =>
            `${entry.title} ${entry.description} ${entry.text} ${entry.tags.join(' ')} ${entry.author} ${entry.type}`
              .toLocaleLowerCase()
              .includes(term),
          ),
      );
      total = matches.length;
      matches = matches.slice(0, 20);
    } else {
      const moduleUrl = `${base}pagefind/pagefind.js`;
      pagefind ??= import(/* @vite-ignore */ moduleUrl).catch((error) => {
        pagefind = undefined;
        throw error;
      });
      const found = await (
        await pagefind
      ).search(command.query, kind ? { filters: { type: kind } } : undefined);
      total = found.results.length;
      matches = await Promise.all(
        found.results.slice(0, 20).map(async (result) => {
          const data = await result.data();
          return {
            url: data.url,
            title: data.meta.title || 'Research entry',
            description: data.excerpt.replace(/<[^>]*>/g, ''),
            type: data.meta.type || data.filters.type?.[0] || 'Research',
          };
        }),
      );
    }
    if (request !== sequence) return;
    status.textContent = total
      ? `${total} ${total === 1 ? 'trace' : 'traces'} found${total > 20 ? ' · showing the first 20' : ''}`
      : 'No matching traces. Try an artifact name, tool, or shorter query.';
    showMatches(matches);
  } catch {
    if (request === sequence)
      status.textContent =
        'The archive could not be loaded. Check your connection and try again.';
    fallback = undefined;
  }
}
input.addEventListener('input', () => {
  ++sequence;
  clearTimeout(timer);
  results.replaceChildren();
  output.hidden = !input.value.trim();
  status.textContent = input.value.trim() ? 'Reading command…' : '';
  timer = setTimeout(() => void runSearch(), 130);
});
search.querySelector('form')!.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (parseCommand(input.value).kind === 'clear') clear();
  else {
    clearTimeout(timer);
    const value = input.value;
    await runSearch();
    if (input.value === value)
      results.querySelector<HTMLAnchorElement>('a')?.click();
  }
});
search.querySelector('[data-clear-command]')!.addEventListener('click', clear);
search.querySelectorAll<HTMLElement>('[data-search-type]').forEach((button) =>
  button.addEventListener('click', () => {
    kind = button.dataset.searchType || '';
    syncFilters();
    void runSearch();
  }),
);
search.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    clear();
    return;
  }
  const links = [...results.querySelectorAll<HTMLAnchorElement>('a')];
  if (!links.length) return;
  const current = links.indexOf(document.activeElement as HTMLAnchorElement);
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    links[(current + 1) % links.length]?.focus();
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    if (current <= 0) input.focus();
    else links[current - 1]?.focus();
  }
});
document.addEventListener('click', (event) => {
  const target =
    event.target instanceof Element
      ? event.target.closest<HTMLElement>(
          '[data-focus-search], [data-search-query]',
        )
      : null;
  if (!target) return;
  event.preventDefault();
  if (target.dataset.searchQuery !== undefined) {
    input.value = target.dataset.searchQuery;
    kind = '';
    syncFilters();
  }
  search.scrollIntoView({
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'instant'
      : 'smooth',
    block: 'start',
  });
  input.focus({ preventScroll: true });
  void runSearch();
});
