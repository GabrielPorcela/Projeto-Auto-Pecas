import { getProdutos } from '../../services/catalog-service.js';
import { getEstoque, getUnidades } from '../../services/stock-service.js';

async function main() {
  const [produtos, estoque, unidades] = await Promise.all([getProdutos(), getEstoque(), getUnidades()]);
  const produtoById = Object.fromEntries(produtos.map((p) => [p.id, p]));
  const unidadeById = Object.fromEntries(unidades.map((u) => [u.id, u]));

  document.getElementById('admin-estoque-body').innerHTML = estoque
    .map((e) => {
      const produto = produtoById[e.produtoId];
      const unidade = unidadeById[e.unidadeId];
      return `<tr>
        <td>${produto?.nome || e.produtoId}</td>
        <td>${produto?.codigo || '—'}</td>
        <td>${unidade?.nome || e.unidadeId}</td>
        <td>${e.quantidade}</td>
        <td>${e.disponivel ? 'Sim' : 'Não'}</td>
      </tr>`;
    })
    .join('');
}

main();
