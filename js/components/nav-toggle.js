// Menu hamburger mobile — sem isso, abaixo de 899px o usuário não tem como
// alcançar o <nav class="site-nav">, já que o botão só existia visualmente.
export function initNavToggle() {
  const btn = document.querySelector('.mobile-menu-btn');
  const nav = document.getElementById('site-nav');
  if (!btn || !nav) return;

  function close() {
    nav.classList.remove('site-nav--open');
    btn.setAttribute('aria-expanded', 'false');
  }

  function open() {
    nav.classList.add('site-nav--open');
    btn.setAttribute('aria-expanded', 'true');
    const firstLink = nav.querySelector('a');
    if (firstLink) firstLink.focus();
  }

  btn.addEventListener('click', () => {
    const isOpen = nav.classList.contains('site-nav--open');
    if (isOpen) close();
    else open();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('site-nav--open')) {
      close();
      btn.focus();
    }
  });

  document.addEventListener('click', (e) => {
    if (!nav.classList.contains('site-nav--open')) return;
    if (nav.contains(e.target) || btn.contains(e.target)) return;
    close();
  });
}
