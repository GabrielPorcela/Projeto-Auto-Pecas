// Bootstrap carregado em toda página: menu mobile + contador do carrinho no
// header. Cada página soma a isso o seu próprio js/pages/<nome>.js.
import { initNavToggle } from './components/nav-toggle.js';
import { cartCount } from './services/cart-service.js';

initNavToggle();

function updateHeaderCount() {
  const el = document.getElementById('header-quote-count');
  if (el) el.textContent = String(cartCount());
}

updateHeaderCount();
window.addEventListener('passini:cart-changed', updateHeaderCount);

// Busca do header (topbar) — presente em toda página, sempre navega para
// resultados.html?q=... na raiz do site (calcula o prefixo relativo a partir
// do próprio <script src> para funcionar também em produto/*.html e admin/*.html).
const appScript = document.querySelector('script[src$="js/app.js"]');
const base = appScript ? appScript.getAttribute('src').replace(/js\/app\.js$/, '') : '';

const headerInput = document.getElementById('header-search-input');
const headerBtn = document.getElementById('header-search-btn');
if (headerInput && headerBtn) {
  const submit = () => {
    const params = new URLSearchParams();
    if (headerInput.value.trim()) params.set('q', headerInput.value.trim());
    window.location.href = `${base}resultados.html?${params.toString()}`;
  };
  headerBtn.addEventListener('click', submit);
  headerInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submit();
  });
}
