// Serviço de estoque — junta produto × unidade × quantidade. Desacoplado do
// catálogo para permitir trocar só este arquivo por um feed real do ERP no
// futuro, sem tocar em produtos.json nem nos componentes visuais.

const ESTOQUE_URL = new URL('../../data/estoque.json', import.meta.url);
const UNIDADES_URL = new URL('../../data/unidades.json', import.meta.url);

let estoqueCache = null;
let unidadesCache = null;

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao carregar ${url}: ${res.status}`);
  return res.json();
}

export async function getEstoque() {
  if (!estoqueCache) estoqueCache = await fetchJSON(ESTOQUE_URL);
  return estoqueCache;
}

export async function getUnidades() {
  if (!unidadesCache) unidadesCache = await fetchJSON(UNIDADES_URL);
  return unidadesCache;
}

/** Retorna as posições de estoque de um produto, já com o nome da unidade. */
export async function getEstoquePorProduto(produtoId) {
  const [estoque, unidades] = await Promise.all([getEstoque(), getUnidades()]);
  const unidadeById = Object.fromEntries(unidades.map((u) => [u.id, u]));
  return estoque
    .filter((e) => e.produtoId === produtoId)
    .map((e) => ({ ...e, unidade: unidadeById[e.unidadeId] || null }));
}

/** true se houver ao menos uma posição de estoque disponível para o produto. */
export async function isDisponivel(produtoId) {
  const posicoes = await getEstoquePorProduto(produtoId);
  return posicoes.some((p) => p.disponivel);
}

/** Badge de disponibilidade/unidade pronto para exibir em um product-card. */
export async function getDisponibilidadeBadge(produtoId) {
  const posicoes = await getEstoquePorProduto(produtoId);
  const disponivel = posicoes.find((p) => p.disponivel);
  if (disponivel) {
    return { texto: 'Em estoque', unidade: disponivel.unidade ? disponivel.unidade.nome : 'a confirmar' };
  }
  return { texto: 'Sob consulta', unidade: posicoes[0]?.unidade ? posicoes[0].unidade.nome : 'a confirmar' };
}
