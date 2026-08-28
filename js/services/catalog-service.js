// Serviço de catálogo — única porta de entrada para ler produtos/categorias
// mockados. Nenhum outro módulo deve fazer fetch direto de data/produtos.json;
// isso mantém o ponto de troca por uma API real em um só lugar.

import { norm } from '../utils/text.js';

const PRODUTOS_URL = new URL('../../data/produtos.json', import.meta.url);
const CATEGORIAS_URL = new URL('../../data/categorias.json', import.meta.url);

let produtosCache = null;
let categoriasCache = null;

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao carregar ${url}: ${res.status}`);
  return res.json();
}

export async function getProdutos() {
  if (!produtosCache) produtosCache = await fetchJSON(PRODUTOS_URL);
  return produtosCache;
}

export async function getCategorias() {
  if (!categoriasCache) categoriasCache = await fetchJSON(CATEGORIAS_URL);
  return categoriasCache;
}

/** Match simples por nome, código, marca, categoria ou aplicação (veículo). */
export function matchesQuery(produto, query) {
  const q = norm(query);
  if (!q) return true;
  const haystacks = [
    produto.nome,
    produto.marca,
    produto.codigo,
    produto.categoriaId,
    ...produto.compatibilidades.map((c) => `${c.marca} ${c.modelo} ${c.motor}`),
  ];
  return haystacks.some((h) => norm(h).includes(q));
}

/**
 * Filtra o catálogo por um conjunto de critérios (todos opcionais e
 * combinados com E lógico). Nunca inventa produto — só filtra o array
 * recebido.
 */
export function filterProdutos(produtos, { q, categoria, marca, marcas, modelo, ano, motor } = {}) {
  return produtos.filter((p) => {
    if (q && !matchesQuery(p, q)) return false;
    if (categoria && p.categoriaId !== categoria) return false;
    if (marca && norm(p.marca) !== norm(marca)) return false;
    if (marcas && marcas.length && !marcas.some((m) => norm(m) === norm(p.marca))) return false;
    if (modelo || ano || motor) {
      const anoNum = ano ? Number(ano) : null;
      const ok = p.compatibilidades.some((c) => {
        if (modelo && norm(c.modelo) !== norm(modelo)) return false;
        if (motor && norm(c.motor) !== norm(motor)) return false;
        if (anoNum && (anoNum < c.anoInicio || anoNum > c.anoFim)) return false;
        return true;
      });
      if (!ok) return false;
    }
    return true;
  });
}

export function sortProdutos(produtos, sortBy) {
  const list = [...produtos];
  if (sortBy === 'nome') list.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  else if (sortBy === 'marca') list.sort((a, b) => a.marca.localeCompare(b.marca, 'pt-BR'));
  return list;
}

/** Sugestões simples de autocomplete (top N por nome/código/marca). */
export async function suggest(query, limit = 6) {
  const produtos = await getProdutos();
  const q = norm(query);
  if (!q) return [];
  return produtos
    .filter((p) => matchesQuery(p, query))
    .slice(0, limit)
    .map((p) => ({ id: p.id, slug: p.slug, label: `${p.nome} ${p.marca} — ${p.codigo}` }));
}
