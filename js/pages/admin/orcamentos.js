import { listOrcamentoSubmissions } from '../../services/cart-service.js';

const body = document.getElementById('admin-orcamentos-body');
const empty = document.getElementById('admin-orcamentos-empty');
const submissions = listOrcamentoSubmissions();

empty.hidden = submissions.length > 0;
body.innerHTML = submissions
  .map(
    (s) => `<tr>
      <td>${new Date(s.criadoEm).toLocaleString('pt-BR')}</td>
      <td>${s.nome || ''}</td>
      <td>${s.telefone || ''} ${s.email ? `· ${s.email}` : ''}</td>
      <td>${s.veiculo || '—'}</td>
      <td>${(s.itens || []).map((i) => i.nome).join(', ') || '—'}</td>
    </tr>`
  )
  .join('');
