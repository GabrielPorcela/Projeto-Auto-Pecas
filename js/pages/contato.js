import { wireForm } from '../components/form-validation.js';
import { applyWhatsAppLink } from '../services/whatsapp-service.js';

const form = document.getElementById('contato-form');
const summaryEl = document.getElementById('contato-form-summary');
const successEl = document.getElementById('contato-success');
const whatsappBtn = document.getElementById('contato-whatsapp-btn');

const LEADS_KEY = 'passini_leads';

function saveLead(payload) {
  try {
    const raw = localStorage.getItem(LEADS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.push({ ...payload, criadoEm: new Date().toISOString() });
    localStorage.setItem(LEADS_KEY, JSON.stringify(list));
  } catch {
    // sem localStorage disponível — segue o fluxo mesmo assim
  }
}

// Sem número real de WhatsApp confirmado ainda — fica em estado "em breve".
applyWhatsAppLink(whatsappBtn, null, '');

const params = new URLSearchParams(window.location.search);
const unidadeParam = params.get('unidade');
if (unidadeParam) {
  const veiculoInput = form?.querySelector('[name="veiculo"]');
  const hint = document.createElement('input');
  hint.type = 'hidden';
  hint.name = 'unidade';
  hint.value = unidadeParam;
  form?.appendChild(hint);
  if (veiculoInput) veiculoInput.closest('label')?.insertAdjacentHTML(
    'beforebegin',
    `<p class="demo-notice" style="margin:0 0 8px">Mensagem direcionada à unidade selecionada.</p>`
  );
}

if (form) {
  wireForm(form, {
    summaryEl,
    onValid(data) {
      saveLead(data);
      successEl.hidden = false;
      const mensagem = `Olá! Meu nome é ${data.nome}. ${data.mensagem || ''} Veículo: ${data.veiculo || 'não informado'}`;
      applyWhatsAppLink(whatsappBtn, null, mensagem);
      form.reset();
    },
  });
}
