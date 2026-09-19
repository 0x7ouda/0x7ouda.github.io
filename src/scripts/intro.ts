const root = document.documentElement;
const panel = document.querySelector<HTMLElement>(
  '[data-workspace-intro-panel]',
);
if (panel && root.dataset.workspaceIntro) {
  const stage = panel.querySelector<HTMLElement>('[data-intro-stage]')!;
  const percent = panel.querySelector<HTMLElement>('[data-intro-percent]')!;
  const progress = panel.querySelector<HTMLElement>('[data-intro-progress]')!;
  const timers: ReturnType<typeof setTimeout>[] = [];
  const finish = () => {
    timers.forEach(clearTimeout);
    delete root.dataset.workspaceIntro;
    document.removeEventListener('keydown', finish);
    document.removeEventListener('pointerdown', finish);
    document.removeEventListener('focusin', finish);
  };
  // These are brief visual introduction stages, not network progress estimates.
  for (const [delay, value, label] of [
    [80, 35, 'Initializing workspace...'],
    [460, 68, 'Loading research archive...'],
    [850, 92, 'Preparing environment...'],
    [1200, 100, 'SYSTEM READY'],
  ] as const)
    timers.push(
      setTimeout(() => {
        percent.textContent = String(value);
        stage.textContent = label;
        progress.style.transform = `scaleX(${value / 100})`;
        if (value === 100) panel.classList.add('is-ready');
      }, delay),
    );
  timers.push(setTimeout(finish, 1550));
  panel.querySelector('[data-skip-intro]')?.addEventListener('click', finish);
  document.addEventListener('keydown', finish);
  document.addEventListener('pointerdown', finish);
  document.addEventListener('focusin', finish);
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener(
    'change',
    finish,
    { once: true },
  );
}
