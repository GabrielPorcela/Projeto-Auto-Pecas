// Serviço de WhatsApp — ponto único para montar links wa.me. Nenhum número
// real de WhatsApp está configurado no repositório ainda (ver
// data/unidades.json e .env.example); enquanto isso, buildWhatsAppLink
// retorna null e a UI deve tratar isso como "em breve", nunca inventar um
// número. Quando um número real existir, ele deve vir de data/unidades.json
// (não de um valor fixo aqui).

function onlyDigits(v) {
  return (v || '').replace(/\D/g, '');
}

/**
 * @param {string|null} numero Número no formato local (ex.: "51999998888") ou null se ainda não confirmado.
 * @param {string} mensagem Texto a pré-preencher na conversa.
 * @returns {string|null} URL wa.me pronta, ou null se não houver número configurado.
 */
export function buildWhatsAppLink(numero, mensagem) {
  const digits = onlyDigits(numero);
  if (!digits) return null;
  const withCountry = digits.startsWith('55') ? digits : `55${digits}`;
  const params = new URLSearchParams({ text: mensagem || '' });
  return `https://wa.me/${withCountry}?${params.toString()}`;
}

/** Aplica um link wa.me a um <a>, ou deixa o elemento em estado "em breve" quando não há número. */
export function applyWhatsAppLink(anchorEl, numero, mensagem) {
  const link = buildWhatsAppLink(numero, mensagem);
  if (link) {
    anchorEl.href = link;
    anchorEl.target = '_blank';
    anchorEl.rel = 'noopener';
    anchorEl.removeAttribute('aria-disabled');
    anchorEl.classList.remove('is-disabled');
  } else {
    anchorEl.removeAttribute('href');
    anchorEl.setAttribute('aria-disabled', 'true');
    anchorEl.classList.add('is-disabled');
  }
  return link;
}
