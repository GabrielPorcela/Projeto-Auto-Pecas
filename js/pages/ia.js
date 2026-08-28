import { interpretQuery } from '../services/ia-service.js';

const body = document.getElementById('chat-body');
const form = document.getElementById('chat-form');
const input = document.getElementById('chat-input');

function addBubble(text, { fromUser = false } = {}) {
  const wrap = document.createElement('div');
  wrap.className = fromUser ? 'chat-message chat-message--user' : 'chat-message';
  if (!fromUser) {
    const avatar = document.createElement('span');
    avatar.className = 'chat-avatar';
    avatar.textContent = 'P';
    wrap.appendChild(avatar);
  }
  const bubble = document.createElement('div');
  bubble.className = 'chat-message__bubble';
  bubble.textContent = text;
  wrap.appendChild(bubble);
  body.appendChild(wrap);
  body.scrollTop = body.scrollHeight;
  return wrap;
}

function addResults(resultados) {
  const wrap = document.createElement('div');
  wrap.className = 'chat-results';
  wrap.innerHTML = resultados
    .map(
      (p) => `
    <div class="chat-result">
      <div class="chat-result__thumb"></div>
      <div class="chat-result__body">
        <div class="chat-result__marca">${p.marca}</div>
        <div class="chat-result__name">${p.nome}</div>
        <div class="chat-result__meta">${p.codigo}</div>
      </div>
      <a href="produto/${p.slug}.html" class="chat-result__btn">Ver</a>
    </div>`
    )
    .join('');
  const actions = document.createElement('div');
  actions.className = 'chat-results__actions';
  actions.innerHTML = `
    <a href="orcamento.html" class="btn btn--yellow">Solicitar orçamento</a>
    <a href="contato.html" class="btn btn--outline">Falar com especialista</a>`;
  wrap.appendChild(actions);
  body.appendChild(wrap);
  body.scrollTop = body.scrollHeight;
}

async function handleMessage(texto) {
  addBubble(texto, { fromUser: true });
  const thinking = addBubble('Consultando o catálogo…');

  const { veiculo, resultados, semSinal } = await interpretQuery(texto);
  thinking.remove();

  if (semSinal) {
    addBubble('Não encontrei nada no catálogo de demonstração para essa descrição. Tente citar a peça e o veículo (ex.: "pastilha de freio para Onix 2020") ou fale com um especialista.');
    return;
  }

  const partesVeiculo = [veiculo.marca, veiculo.modelo, veiculo.motor, veiculo.ano].filter(Boolean).join(' ');
  if (!resultados.length) {
    addBubble(
      partesVeiculo
        ? `Entendi o veículo (${partesVeiculo}), mas não encontrei peça compatível no catálogo de demonstração para essa combinação.`
        : 'Não encontrei peças compatíveis no catálogo de demonstração para essa descrição.'
    );
    return;
  }

  addBubble(
    `Entendi assim:${partesVeiculo ? `\n• Veículo: ${partesVeiculo}` : ''}\n\nEncontrei ${resultados.length} item(ns) compatível(is) no catálogo de demonstração.`
  );
  addResults(resultados);
}

if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const texto = input.value.trim();
    if (!texto) return;
    input.value = '';
    handleMessage(texto);
  });
}

document.querySelectorAll('.suggestion-chip[data-suggestion]').forEach((chip) => {
  chip.addEventListener('click', () => handleMessage(chip.dataset.suggestion));
});
