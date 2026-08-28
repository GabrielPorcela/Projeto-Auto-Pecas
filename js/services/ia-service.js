// Passini IA — interpretador baseado em regras/palavras-chave (NÃO é um LLM
// real). Isolado como serviço com uma única função exportada para poder ser
// trocado por uma IA real depois sem tocar na página (ia.html/js/pages/ia.js).
// Nunca inventa produto ou compatibilidade: só devolve o que já está em
// data/produtos.json e data/veiculos.json.

import { getProdutos } from './catalog-service.js';
import { getVeiculos } from './vehicle-service.js';
import { norm } from '../utils/text.js';

/** Extrai marca/modelo/ano/motor citados no texto, cruzando com o catálogo de veículos. */
async function extrairVeiculo(texto) {
  const veiculos = await getVeiculos();
  const t = norm(texto);
  const anoMatch = texto.match(/\b(19|20)\d{2}\b/);
  const ano = anoMatch ? Number(anoMatch[0]) : null;

  for (const marcaEntry of veiculos) {
    if (!t.includes(norm(marcaEntry.marca))) continue;
    for (const modeloEntry of marcaEntry.modelos) {
      if (!t.includes(norm(modeloEntry.modelo))) continue;
      let motor = null;
      for (const faixa of modeloEntry.anos) {
        for (const m of faixa.motores) {
          if (t.includes(norm(m))) motor = m;
        }
      }
      return { marca: marcaEntry.marca, modelo: modeloEntry.modelo, ano, motor };
    }
  }
  return { marca: null, modelo: null, ano, motor: null };
}

/** Extrai palavras-chave de peça/categoria simples (nome do produto ou categoria citados). */
async function extrairPeca(texto) {
  const produtos = await getProdutos();
  const t = norm(texto);
  const categoriaKeywords = {
    freios: ['freio', 'pastilha', 'disco de freio'],
    suspensao: ['amortecedor', 'suspensao', 'mola'],
    filtros: ['filtro'],
    embreagem: ['embreagem'],
    arrefecimento: ['bomba d\'agua', 'bomba dagua', 'radiador', 'arrefecimento'],
    correias: ['correia'],
  };
  for (const [categoriaId, keywords] of Object.entries(categoriaKeywords)) {
    if (keywords.some((k) => t.includes(norm(k)))) {
      return { categoriaId, produtosDaCategoria: produtos.filter((p) => p.categoriaId === categoriaId) };
    }
  }
  return { categoriaId: null, produtosDaCategoria: [] };
}

/**
 * Interpreta uma mensagem em texto livre e devolve veículo identificado +
 * lista de produtos compatíveis já filtrados no catálogo mockado.
 */
export async function interpretQuery(texto) {
  const produtos = await getProdutos();
  const veiculo = await extrairVeiculo(texto);
  const peca = await extrairPeca(texto);

  let candidatos = peca.categoriaId ? peca.produtosDaCategoria : produtos;

  if (veiculo.marca) {
    candidatos = candidatos.filter((p) =>
      p.compatibilidades.some((c) => {
        if (norm(c.marca) !== norm(veiculo.marca)) return false;
        if (veiculo.modelo && norm(c.modelo) !== norm(veiculo.modelo)) return false;
        if (veiculo.motor && norm(c.motor) !== norm(veiculo.motor)) return false;
        if (veiculo.ano && (veiculo.ano < c.anoInicio || veiculo.ano > c.anoFim)) return false;
        return true;
      })
    );
  }

  // Sem nenhum sinal de veículo nem categoria: cai para busca textual simples
  // (código, nome, marca) em vez de devolver o catálogo inteiro.
  if (!veiculo.marca && !peca.categoriaId) {
    const t = norm(texto);
    candidatos = produtos.filter((p) => norm(p.nome).includes(t) || norm(p.codigo).includes(t) || norm(p.marca).includes(t));
  }

  return {
    veiculo,
    categoriaId: peca.categoriaId,
    resultados: candidatos.slice(0, 5),
    semSinal: !veiculo.marca && !peca.categoriaId && candidatos.length === 0,
  };
}
