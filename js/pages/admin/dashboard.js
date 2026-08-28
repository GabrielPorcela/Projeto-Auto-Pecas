import { getProdutos, getCategorias } from '../../services/catalog-service.js';
import { listOrcamentoSubmissions } from '../../services/cart-service.js';

const LEADS_KEY = 'passini_leads';

function listLeads() {
  try {
    const raw = localStorage.getItem(LEADS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function main() {
  const [produtos, categorias] = await Promise.all([getProdutos(), getCategorias()]);
  const orcamentos = listOrcamentoSubmissions();
  const leads = listLeads();

  const stats = [
    { label: 'Produtos no catálogo', value: produtos.length },
    { label: 'Categorias', value: categorias.length },
    { label: 'Orçamentos (este navegador)', value: orcamentos.length },
    { label: 'Leads (este navegador)', value: leads.length },
  ];

  document.getElementById('admin-stats').innerHTML = stats
    .map((s) => `<div class="admin-stat"><div class="admin-stat__value">${s.value}</div><div class="admin-stat__label">${s.label}</div></div>`)
    .join('');
}

main();
