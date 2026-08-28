const LEADS_KEY = 'passini_leads';

function listLeads() {
  try {
    const raw = localStorage.getItem(LEADS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

const body = document.getElementById('admin-leads-body');
const empty = document.getElementById('admin-leads-empty');
const leads = listLeads();

empty.hidden = leads.length > 0;
body.innerHTML = leads
  .map(
    (l) => `<tr>
      <td>${new Date(l.criadoEm).toLocaleString('pt-BR')}</td>
      <td>${l.nome || ''}</td>
      <td>${l.telefone || ''} ${l.email ? `· ${l.email}` : ''}</td>
      <td>${l.veiculo || '—'}</td>
      <td>${l.mensagem || '—'}</td>
    </tr>`
  )
  .join('');
