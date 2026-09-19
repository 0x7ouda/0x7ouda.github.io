const scene = document.querySelector<HTMLElement>('[data-investigation]');
if (scene) {
  const investigator = scene.querySelector<SVGGElement>(
    '#investigator-character',
  )!;
  const virus = scene.querySelector<SVGGElement>('#virus-character')!;
  const pause = scene.querySelector<HTMLButtonElement>('[data-pause-scene]')!;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const points = [
    { x: 414, y: 182 },
    { x: 328, y: 103 },
    { x: 175, y: 194 },
    { x: 306, y: 262 },
    { x: 473, y: 240 },
  ];
  let point = 0,
    vx = 401,
    vy = 209,
    ix = 182,
    iy = 200,
    last = 0,
    frame = 0;
  let paused = motion.matches,
    visible = true;
  const next = () => {
    point = (point + 1) % points.length;
  };
  const render = (time: number) => {
    frame = 0;
    if (paused || !visible || document.hidden || motion.matches) return;
    const dt = Math.min((time - (last || time)) / 1000, 0.05);
    last = time;
    const target = points[point]!;
    vx += (target.x - vx) * Math.min(dt * 3.3, 1);
    vy += (target.y - vy) * Math.min(dt * 3.3, 1);
    const dx = vx - ix - 70,
      dy = vy - iy,
      distance = Math.hypot(dx, dy);
    if (distance < 78 && Math.hypot(target.x - vx, target.y - vy) < 20) next();
    ix += dx * dt * 0.67;
    iy += dy * dt * 0.67;
    virus.setAttribute(
      'transform',
      `translate(${vx.toFixed(1)} ${(vy + Math.sin(time / 155) * 2).toFixed(1)})`,
    );
    investigator.setAttribute(
      'transform',
      `translate(${ix.toFixed(1)} ${(iy + Math.sin(time / 230) * 1.2).toFixed(1)})`,
    );
    frame = requestAnimationFrame(render);
  };
  const sync = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    pause.setAttribute('aria-pressed', String(paused));
    pause.setAttribute(
      'aria-label',
      paused
        ? 'Resume investigation animation'
        : 'Pause investigation animation',
    );
    pause.innerHTML = paused
      ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z"/></svg>'
      : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M8 5v14m8-14v14"/></svg>';
    if (!paused && visible && !document.hidden && !motion.matches)
      frame = requestAnimationFrame(render);
  };
  pause.addEventListener('click', () => {
    paused = !paused;
    sync();
  });
  scene.querySelector('[data-new-trace]')?.addEventListener('click', () => {
    next();
    if (motion.matches || paused) {
      const target = points[point]!;
      virus.setAttribute('transform', `translate(${target.x} ${target.y})`);
      investigator.setAttribute(
        'transform',
        `translate(${target.x - 140} ${target.y + 10})`,
      );
    }
  });
  new IntersectionObserver(([entry]) => {
    visible = !!entry?.isIntersecting;
    sync();
  }).observe(scene);
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', () => {
    paused = motion.matches;
    sync();
  });
  sync();
}
