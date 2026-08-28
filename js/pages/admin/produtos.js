import { getProdutos, getCategorias } from '../../services/catalog-service.js';

function money(v) {
  return v == null ? 'Sob consulta' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

async function main() {
  const [produtos, categorias] = await Promise.all([getProdutos(), getCategorias()]);
  const categoriaById = Object.fromEntries(categorias.map((c) => [c.id, c]));
  document.getElementById('admin-produtos-body').innerHTML = produtos
    .map(
      (p) => `<tr>
        <td><a href="../produto/${p.slug}.html">${p.nome}</a></td>
        <td>${p.marca}</td>
        <td>${p.codigo}</td>
        <td>${categoriaById[p.categoriaId]?.nome || p.categoriaId}</td>
        <td>${money(p.preco)}</td>
      </tr>`
    )
    .join('');
}

main();
