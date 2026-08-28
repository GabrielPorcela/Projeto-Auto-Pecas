import { listCart, removeFromCart, saveOrcamentoSubmission } from '../services/cart-service.js';
import { wireForm } from '../components/form-validation.js';
import { applyWhatsAppLink } from '../services/whatsapp-service.js';

const listEl = document.getElementById('quote-list');
const emptyEl = document.getElementById('quote-list-empty');
const form = document.getElementById('orcamento-form');
const summaryEl = document.getElementById('orcamento-form-summary');
const successEl = document.getElementById('orcamento-success');
const whatsappBtn = document.getElementById('orcamento-whatsapp-btn');

function renderCart() {
  const items = listCart();
  listEl.querySelectorAll('.quote-item').forEach((el) => el.remove());
  emptyEl.hidden = items.length > 0;
  for (const item of items) {
    const el = document.createElement('div');
    el.className = 'quote-item';
    el.innerHTML = `
      <div class="quote-item__thumb"></div>
      <div class="quote-item__body">
        <div class="quote-item__marca">${item.marca || ''}</div>
        <div class="quote-item__name">${item.nome || ''}</div>
        <div class="quote-item__meta">${item.codigo || ''}</div>
      </div>
      <button class="quote-item__remove" type="button" data-remove="${item.id}">Remover</button>`;
    listEl.appendChild(el);
  }
  listEl.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', () => {
      removeFromCart(btn.dataset.remove);
      renderCart();
    });
  });
}

renderCart();
window.addEventListener('passini:cart-changed', renderCart);

// Nenhum número real de WhatsApp está configurado ainda (ver data/unidades.json)
// — o botão fica em estado "em breve" até existir um número confirmado.
applyWhatsAppLink(whatsappBtn, null, '');

wireForm(form, {
  summaryEl,
  onValid(data) {
    const itens = listCart();
    saveOrcamentoSubmission({ ...data, itens });
    successEl.hidden = false;
    form.reset();

    const resumoItens = itens.map((i) => `- ${i.nome} (${i.codigo})`).join('\n');
    const mensagem = `Olá! Meu nome é ${data.nome}. Gostaria de orçamento para:\n${resumoItens || '(lista vazia)'}\nVeículo: ${data.veiculo || 'não informado'}`;
    applyWhatsAppLink(whatsappBtn, null, mensagem);
  },
});
