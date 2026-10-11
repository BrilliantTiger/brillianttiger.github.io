// Progressive enhancement only: the page is fully readable without this file.
(() => {
  const root = document.documentElement;
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  /* theme toggle: <html data-theme> is set early by an inline script in <head> */
  const toggle = $('[data-theme-toggle]');
  const isDark = () => (root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);
  const sync = () => toggle && toggle.setAttribute('aria-pressed', String(isDark()));
  sync();
  toggle?.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('bt-theme', next); } catch {}
    sync();
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', sync);

  /* header: border on scroll, mobile menu */
  const header = $('[data-nav]');
  const menuBtn = $('[data-menu-toggle]');
  if (header) {
    const onScroll = () => header.toggleAttribute('data-scrolled', window.scrollY > 8);
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    const setMenu = (open) => {
      header.toggleAttribute('data-menu-open', open);
      menuBtn?.setAttribute('aria-expanded', String(open));
    };
    menuBtn?.addEventListener('click', () => setMenu(!header.hasAttribute('data-menu-open')));
    addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
    $$('.nav__links a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
    addEventListener('resize', () => { if (innerWidth > 880) setMenu(false); });
  }

  /* scrollspy */
  const links = new Map($$('[data-spy]').map((a) => [a.dataset.spy, a]));
  if (links.size && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          links.forEach((a, id) => (id === e.target.id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
        }
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    links.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
  }

  /* reveal on scroll (content stays visible if IntersectionObserver is missing) */
  const items = $$('[data-reveal]');
  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        let n = 0;
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.style.setProperty('--d', `${n++ * 80}ms`);
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );
    items.forEach((el) => io.observe(el));
  }
})();
