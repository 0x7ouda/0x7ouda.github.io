document
  .querySelectorAll<HTMLPreElement>('pre.astro-code, pre[data-code-block]')
  .forEach((pre) => {
    if (pre.parentElement?.classList.contains('code-frame')) return;
    const frame = document.createElement('div');
    frame.className = 'code-frame';
    const heading = document.createElement('div');
    heading.className = 'code-heading';
    const name = document.createElement('span');
    name.textContent = pre.dataset.filename || pre.dataset.language || 'code';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'code-copy';
    button.textContent = 'Copy';
    button.setAttribute('aria-label', `Copy ${name.textContent}`);
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(
          pre.querySelector('code')?.textContent || pre.textContent || '',
        );
        button.textContent = 'Copied';
      } catch {
        button.textContent = 'Select to copy';
      }
      setTimeout(() => {
        button.textContent = 'Copy';
      }, 2000);
    });
    pre.setAttribute('tabindex', '0');
    pre.setAttribute(
      'aria-label',
      `${name.textContent} code, scroll horizontally if needed`,
    );
    heading.append(name, button);
    pre.before(frame);
    frame.append(heading, pre);
  });
document
  .querySelectorAll<HTMLTableElement>('.article-prose table')
  .forEach((table) => {
    const scroll = document.createElement('div');
    scroll.className = 'table-scroll';
    scroll.tabIndex = 0;
    scroll.setAttribute('role', 'region');
    scroll.setAttribute(
      'aria-label',
      'Data table, scroll horizontally if needed',
    );
    table.before(scroll);
    scroll.append(table);
  });
const prose = document.querySelector<HTMLElement>('.article-prose');
if (prose) {
  const links = [
    ...document.querySelectorAll<HTMLAnchorElement>('.toc a[href^="#"]'),
  ];
  const headings = [...prose.querySelectorAll<HTMLElement>('h2[id], h3[id]')];
  let scheduled = false;
  const updateReading = () => {
    const current =
      headings
        .filter((heading) => heading.getBoundingClientRect().top < 140)
        .at(-1) || headings[0];
    links.forEach((link) => {
      if (link.hash === `#${current?.id}`)
        link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    const progress = Math.max(
      0,
      Math.min(
        1,
        -prose.getBoundingClientRect().top /
          Math.max(1, prose.offsetHeight - innerHeight),
      ),
    );
    const bar = document.querySelector<HTMLElement>('.reading-progress');
    if (bar) bar.style.transform = `scaleX(${progress})`;
    scheduled = false;
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(updateReading);
      }
    },
    { passive: true },
  );
  updateReading();
}
document
  .querySelectorAll<HTMLButtonElement>('[data-index-filter]')
  .forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.indexFilter;
      document
        .querySelectorAll('[data-index-filter]')
        .forEach((item) =>
          item.setAttribute('aria-pressed', String(item === button)),
        );
      let count = 0;
      document
        .querySelectorAll<HTMLElement>('[data-filter-tags]')
        .forEach((item) => {
          const tags: string[] = JSON.parse(item.dataset.filterTags || '[]');
          item.hidden = !!filter && !tags.includes(filter);
          if (!item.hidden) count++;
        });
      const status = document.querySelector('[data-index-count]');
      if (status)
        status.textContent = `${count} ${count === 1 ? 'entry' : 'entries'}`;
    });
  });
