import { getProdutos, getCategorias, filterProdutos, sortProdutos } from '../services/catalog-service.js';
import { getEstoque, getUnidades } from '../services/stock-service.js';

const grid = document.getElementById('results-grid');
const stateLoading = document.getElementById('results-state-loading');
const stateError = document.getElementById('results-state-error');
const stateEmpty = document.getElementById('results-state-empty');
const countEl = document.getElementById('results-count');
const vehicleEl = document.getElementById('results-vehicle');
const titleEl = document.getElementById('results-title');
const sortSelect = document.getElementById('results-sort');
const clearBtn = document.getElementById('filters-clear');
const retryBtn = document.getElementById('results-retry');

const activeFilters = { marcas: [], categoria: null, disponibilidade: null, unidade: null };

function readParams() {
  return Object.fromEntries(new URLSearchParams(window.location.search).entries());
}

function setState(state) {
  stateLoading.hidden = state !== 'loading';
  stateError.hidden = state !== 'error';
  stateEmpty.hidden = state !== 'empty';
  grid.hidden = state === 'loading' || state === 'error';
}

function productCardHTML(produto, estoque, unidadeById, categoriaById) {
  const posicoes = estoque.filter((e) => e.produtoId === produto.id);
  const disponivel = posicoes.find((p) => p.disponivel);
  const stockLabel = disponivel ? 'Em estoque' : 'Sob consulta';
  const stockClass = disponivel ? 'badge--stock' : 'badge--stock-out';
  const unidadeNome = disponivel
    ? unidadeById[disponivel.unidadeId]?.nome
    : unidadeById[posicoes[0]?.unidadeId]?.nome;
  const app = produto.compatibilidades[0]
    ? `${produto.compatibilidades[0].marca} ${produto.compatibilidades[0].modelo} ${produto.compatibilidades[0].motor} · ${produto.compatibilidades[0].anoInicio}–${produto.compatibilidades[0].anoFim}`
    : 'Aplicação a confirmar';

  return `
    <article class="product-card">
      <div class="product-card__image">foto do produto<span class="product-card__category-badge">${categoriaById[produto.categoriaId]?.nome || produto.categoriaId}</span></div>
      <div class="product-card__body">
        <div class="product-card__marca">${produto.marca}</div>
        <h3 class="product-card__title">${produto.nome}</h3>
        <div class="product-card__code">Cód. ${produto.codigo}</div>
        <div class="product-card__app">${app}</div>
        <div class="product-card__badges"><span class="badge ${stockClass}">${stockLabel}</span>${unidadeNome ? `<span class="badge badge--unit">${unidadeNome}</span>` : ''}</div>
        <div class="product-card__actions">
          <a href="produto/${produto.slug}.html" class="btn btn--navy">Ver detalhes</a>
          <button type="button" class="btn btn--outline" data-add-to-cart="${produto.id}">Solicitar orçamento</button>
        </div>
      </div>
    </article>`;
}

function renderFilterChips(container, values, onToggle) {
  container.innerHTML = values
    .map((v) => `<button class="filter-chip" type="button" data-value="${v}">${v}</button>`)
    .join('');
  container.querySelectorAll('.filter-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('filter-chip--active');
      onToggle();
    });
  });
}

function getActiveChipValues(container) {
  return [...container.querySelectorAll('.filter-chip--active')].map((c) => c.dataset.value);
}

async function main() {
  setState('loading');
  let produtos, categorias, estoque, unidades;
  try {
    [produtos, categorias, estoque, unidades] = await Promise.all([
      getProdutos(),
      getCategorias(),
      getEstoque(),
      getUnidades(),
    ]);
  } catch {
    setState('error');
    return;
  }

  const unidadeById = Object.fromEntries(unidades.map((u) => [u.id, u]));
  const categoriaById = Object.fromEntries(categorias.map((c) => [c.id, c]));
  const marcas = [...new Set(produtos.map((p) => p.marca))].sort();
  const unidadeNomes = unidades.map((u) => u.nome);

  const marcaContainer = document.getElementById('filter-marca');
  const categoriaContainer = document.getElementById('filter-categoria');
  const unidadeContainer = document.getElementById('filter-unidade');
  const disponibilidadeContainer = document.getElementById('filter-disponibilidade');

  function render() {
    const params = readParams();
    const marcasAtivas = getActiveChipValues(marcaContainer);
    const categoriaAtiva = getActiveChipValues(categoriaContainer)[0] || params.categoria || null;
    const disponibilidadeAtiva = getActiveChipValues(disponibilidadeContainer)[0] || null;
    const unidadeAtiva = getActiveChipValues(unidadeContainer)[0] || null;

    let resultado = filterProdutos(produtos, {
      q: params.q,
      categoria: categoriaAtiva,
      marca: params.marca,
      modelo: params.modelo,
      ano: params.ano,
      motor: params.motor,
      marcas: marcasAtivas.length ? marcasAtivas : null,
    });

    if (disponibilidadeAtiva) {
      resultado = resultado.filter((p) => {
        const posicoes = estoque.filter((e) => e.produtoId === p.id);
        const disponivel = posicoes.some((e) => e.disponivel);
        return disponibilidadeAtiva === 'disponivel' ? disponivel : !disponivel;
      });
    }

    if (unidadeAtiva) {
      const unidade = unidades.find((u) => u.nome === unidadeAtiva);
      resultado = resultado.filter((p) => estoque.some((e) => e.produtoId === p.id && e.unidadeId === unidade?.id));
    }

    resultado = sortProdutos(resultado, sortSelect.value);

    countEl.textContent = `${resultado.length} peça${resultado.length === 1 ? '' : 's'} encontrada${resultado.length === 1 ? '' : 's'}`;

    if (params.marca && params.modelo) {
      vehicleEl.hidden = false;
      vehicleEl.textContent = [params.marca, params.modelo, params.ano, params.motor].filter(Boolean).join(' ');
    }

    if (params.q) titleEl.textContent = `Resultados para "${params.q}"`;
    else if (categoriaAtiva) {
      const cat = categorias.find((c) => c.id === categoriaAtiva);
      titleEl.textContent = cat ? cat.nome : 'Resultados da busca';
    }

    if (!resultado.length) {
      setState('empty');
      grid.innerHTML = '';
      return;
    }

    setState('idle');
    grid.innerHTML = resultado.map((p) => productCardHTML(p, estoque, unidadeById, categoriaById)).join('');
    grid.querySelectorAll('[data-add-to-cart]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const { addToCart } = await import('../services/cart-service.js');
        const produto = produtos.find((p) => p.id === btn.dataset.addToCart);
        addToCart({ id: produto.id, nome: produto.nome, marca: produto.marca, codigo: produto.codigo, slug: produto.slug });
        btn.textContent = 'Adicionado ✓';
        btn.disabled = true;
      });
    });
  }

  renderFilterChips(marcaContainer, marcas, render);
  renderFilterChips(categoriaContainer, categorias.map((c) => c.nome), render);
  renderFilterChips(unidadeContainer, unidadeNomes, render);
  disponibilidadeContainer.querySelectorAll('.filter-chip').forEach((chip) => chip.addEventListener('click', () => {
    const wasActive = chip.classList.contains('filter-chip--active');
    disponibilidadeContainer.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('filter-chip--active'));
    if (!wasActive) chip.classList.add('filter-chip--active');
    render();
  }));

  sortSelect.addEventListener('change', render);
  clearBtn.addEventListener('click', () => {
    document.querySelectorAll('.filter-chip--active').forEach((c) => c.classList.remove('filter-chip--active'));
    render();
  });

  render();
}

if (retryBtn) retryBtn.addEventListener('click', main);
main();
