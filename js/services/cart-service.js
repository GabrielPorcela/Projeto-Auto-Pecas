// Carrinho de orçamento — persistido em localStorage. É estado de protótipo
// (não substitui um backend real): cada aba/navegador tem o seu próprio.
// Dispara "passini:cart-changed" no window para quem precisar reagir
// (contador no header, lista na página de orçamento).

const CART_KEY = 'passini_orcamento_cart';
const SUBMISSIONS_KEY = 'passini_orcamento_submissions';

function readCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeCart(items) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    // localStorage indisponível (modo privado, storage cheio etc.) — o
    // carrinho simplesmente não persiste entre recarregamentos.
  }
  window.dispatchEvent(new CustomEvent('passini:cart-changed', { detail: { items } }));
}

export function listCart() {
  return readCart();
}

export function addToCart(item) {
  const items = readCart();
  if (!items.some((i) => i.id === item.id)) {
    items.push(item);
    writeCart(items);
  }
  return items;
}

export function removeFromCart(id) {
  const items = readCart().filter((i) => i.id !== id);
  writeCart(items);
  return items;
}

export function clearCart() {
  writeCart([]);
}

export function cartCount() {
  return readCart().length;
}

/** Guarda uma submissão de orçamento localmente (stand-in de arquitetura até existir CRM). */
export function saveOrcamentoSubmission(payload) {
  try {
    const raw = localStorage.getItem(SUBMISSIONS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.push({ ...payload, criadoEm: new Date().toISOString() });
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(list));
  } catch {
    // sem persistência disponível — segue o fluxo mesmo assim
  }
}

export function listOrcamentoSubmissions() {
  try {
    const raw = localStorage.getItem(SUBMISSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
