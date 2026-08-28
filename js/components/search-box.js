// Caixa de busca com autocomplete reaproveitada pelo hero (index.html) e por
// busca.html. Navegável por teclado (setas + Enter), com debounce simples.
import { suggest } from '../services/catalog-service.js';

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

/**
 * @param {HTMLInputElement} inputEl
 * @param {HTMLElement} listEl contêiner onde as sugestões são renderizadas (role="listbox")
 * @param {(query: string) => void} onSubmit chamado ao pressionar Enter/clicar no botão de busca
 * @param {string} base prefixo relativo para montar o link do produto (ex.: "" ou "../")
 */
export function wireSearchBox(inputEl, listEl, onSubmit, base = '') {
  let activeIndex = -1;
  let items = [];

  function render(newItems) {
    items = newItems;
    activeIndex = -1;
    if (!items.length) {
      listEl.hidden = true;
      listEl.innerHTML = '';
      return;
    }
    listEl.innerHTML = items
      .map(
        (item, i) =>
          `<a href="${base}produto/${item.slug}.html" role="option" id="suggestion-${i}" class="search-suggestion">${item.label}</a>`
      )
      .join('');
    listEl.hidden = false;
  }

  const runSearch = debounce(async (q) => {
    if (!q.trim()) {
      render([]);
      return;
    }
    const results = await suggest(q);
    render(results);
  }, 200);

  inputEl.addEventListener('input', () => runSearch(inputEl.value));

  inputEl.addEventListener('keydown', (e) => {
    if (!items.length) {
      if (e.key === 'Enter') onSubmit(inputEl.value);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, items.length - 1);
      inputEl.setAttribute('aria-activedescendant', `suggestion-${activeIndex}`);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      inputEl.setAttribute('aria-activedescendant', `suggestion-${activeIndex}`);
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0) {
        window.location.href = `${base}produto/${items[activeIndex].slug}.html`;
      } else {
        onSubmit(inputEl.value);
      }
    } else if (e.key === 'Escape') {
      render([]);
    }
  });

  document.addEventListener('click', (e) => {
    if (!listEl.contains(e.target) && e.target !== inputEl) render([]);
  });
}
