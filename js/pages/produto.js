import { addToCart } from '../services/cart-service.js';
import { getEstoquePorProduto } from '../services/stock-service.js';

const addBtn = document.querySelector('[data-add-to-cart]');
if (addBtn) {
  addBtn.addEventListener('click', () => {
    const id = addBtn.dataset.addToCart;
    const nome = document.querySelector('.product-info__title')?.textContent.trim();
    const marca = document.querySelector('.badge--marca')?.textContent.trim();
    const codigo = document.querySelector('.product-info__code')?.textContent.replace('Código', '').trim();
    addToCart({ id, nome, marca, codigo });
    addBtn.textContent = 'Adicionado ao orçamento ✓';
    addBtn.disabled = true;
  });
}

const unitEl = document.querySelector('[data-product-unit]');
if (unitEl) {
  const produtoId = unitEl.dataset.productUnit;
  getEstoquePorProduto(produtoId).then((posicoes) => {
    const disponivel = posicoes.find((p) => p.disponivel);
    const posicao = disponivel || posicoes[0];
    unitEl.textContent = posicao?.unidade?.nome || 'a confirmar';
  });
}
