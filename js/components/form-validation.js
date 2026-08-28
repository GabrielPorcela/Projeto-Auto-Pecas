// Validação compartilhada de formulários (orçamento/contato) — mensagens em
// pt-BR, erros ligados por aria-describedby, resumo em aria-live="assertive".

const validators = {
  required: (value) => (value.trim() ? null : 'Campo obrigatório.'),
  email: (value) => {
    if (!value.trim()) return null;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : 'Informe um e-mail válido.';
  },
  tel: (value) => {
    if (!value.trim()) return null;
    const digits = value.replace(/\D/g, '');
    return digits.length >= 10 ? null : 'Informe um telefone com DDD.';
  },
};

function fieldRules(input) {
  const rules = [];
  if (input.required) rules.push(validators.required);
  if (input.type === 'email') rules.push(validators.email);
  if (input.type === 'tel') rules.push(validators.tel);
  return rules;
}

function validateField(input) {
  for (const rule of fieldRules(input)) {
    const message = rule(input.value);
    if (message) return message;
  }
  return null;
}

function showFieldError(input, message) {
  const describedBy = input.getAttribute('aria-describedby');
  const el = describedBy && document.getElementById(describedBy);
  if (el) el.textContent = message || '';
  input.classList.toggle('form-field__input--invalid', Boolean(message));
}

/**
 * Liga validação a um <form>. Retorna true/false na submissão e chama
 * onValid(formData) quando tudo passa. Nunca envia nada de verdade — quem
 * decide o que fazer com os dados é o chamador.
 */
export function wireForm(formEl, { onValid, summaryEl } = {}) {
  const inputs = [...formEl.querySelectorAll('input, textarea, select')];

  inputs.forEach((input) => {
    input.addEventListener('blur', () => showFieldError(input, validateField(input)));
  });

  formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    let firstInvalid = null;
    const errors = [];

    for (const input of inputs) {
      const message = validateField(input);
      showFieldError(input, message);
      if (message) {
        errors.push(message);
        if (!firstInvalid) firstInvalid = input;
      }
    }

    if (summaryEl) {
      if (errors.length) {
        summaryEl.hidden = false;
        summaryEl.textContent = `Corrija ${errors.length === 1 ? 'o campo destacado' : `os ${errors.length} campos destacados`} antes de continuar.`;
      } else {
        summaryEl.hidden = true;
      }
    }

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    const data = Object.fromEntries(new FormData(formEl).entries());
    if (onValid) onValid(data);
  });
}
