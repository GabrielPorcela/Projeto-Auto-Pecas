// Servico de veiculos — alimenta os selects em cascata Marca -> Modelo -> Ano -> Motor.
// So cobre marcas/modelos para os quais ha compatibilidade real no catalogo
// (data/veiculos.json), para nao prometer cobertura que o catalogo nao tem.

const VEICULOS_URL = new URL('../../data/veiculos.json', import.meta.url);

let cache = null;

export async function getVeiculos() {
  if (!cache) {
    const res = await fetch(VEICULOS_URL);
    if (!res.ok) throw new Error(`Falha ao carregar veiculos.json: ${res.status}`);
    cache = await res.json();
  }
  return cache;
}

export async function getMarcas() {
  const veiculos = await getVeiculos();
  return veiculos.map((v) => v.marca);
}

export async function getModelos(marca) {
  const veiculos = await getVeiculos();
  const entry = veiculos.find((v) => v.marca === marca);
  return entry ? entry.modelos.map((m) => m.modelo) : [];
}

export async function getAnos(marca, modelo) {
  const veiculos = await getVeiculos();
  const marcaEntry = veiculos.find((v) => v.marca === marca);
  const modeloEntry = marcaEntry && marcaEntry.modelos.find((m) => m.modelo === modelo);
  if (!modeloEntry) return [];
  const anos = new Set();
  for (const faixa of modeloEntry.anos) {
    for (let a = faixa.anoInicio; a <= faixa.anoFim; a++) anos.add(a);
  }
  return [...anos].sort((a, b) => b - a);
}

export async function getMotores(marca, modelo, ano) {
  const veiculos = await getVeiculos();
  const marcaEntry = veiculos.find((v) => v.marca === marca);
  const modeloEntry = marcaEntry && marcaEntry.modelos.find((m) => m.modelo === modelo);
  if (!modeloEntry) return [];
  const anoNum = Number(ano);
  const motores = new Set();
  for (const faixa of modeloEntry.anos) {
    if (!ano || (anoNum >= faixa.anoInicio && anoNum <= faixa.anoFim)) {
      faixa.motores.forEach((m) => motores.add(m));
    }
  }
  return [...motores];
}

/**
 * Liga um conjunto de <select> em cascata (marca -> modelo -> ano -> motor).
 * Cada elemento precisa de [data-field="marca|modelo|ano|motor"].
 */
export async function wireVehicleForm(formEl, { onReady } = {}) {
  const marcaSel = formEl.querySelector('[data-field="marca"]');
  const modeloSel = formEl.querySelector('[data-field="modelo"]');
  const anoSel = formEl.querySelector('[data-field="ano"]');
  const motorSel = formEl.querySelector('[data-field="motor"]');
  if (!marcaSel || !modeloSel || !anoSel || !motorSel) return;

  function fillSelect(sel, options, placeholder) {
    sel.innerHTML = '';
    const ph = document.createElement('option');
    ph.value = '';
    ph.textContent = placeholder;
    ph.disabled = true;
    ph.selected = true;
    sel.appendChild(ph);
    for (const opt of options) {
      const el = document.createElement('option');
      el.value = opt;
      el.textContent = opt;
      sel.appendChild(el);
    }
  }

  function resetDownstream(...sels) {
    for (const sel of sels) {
      sel.innerHTML = '';
      sel.disabled = true;
    }
  }

  const marcas = await getMarcas();
  fillSelect(marcaSel, marcas, 'Selecione a marca');
  resetDownstream(modeloSel, anoSel, motorSel);

  marcaSel.addEventListener('change', async () => {
    resetDownstream(anoSel, motorSel);
    const modelos = await getModelos(marcaSel.value);
    fillSelect(modeloSel, modelos, 'Selecione o modelo');
    modeloSel.disabled = false;
  });

  modeloSel.addEventListener('change', async () => {
    resetDownstream(motorSel);
    const anos = await getAnos(marcaSel.value, modeloSel.value);
    fillSelect(anoSel, anos, 'Selecione o ano');
    anoSel.disabled = false;
  });

  anoSel.addEventListener('change', async () => {
    const motores = await getMotores(marcaSel.value, modeloSel.value, anoSel.value);
    fillSelect(motorSel, motores, 'Selecione o motor');
    motorSel.disabled = false;
  });

  if (onReady) onReady();
}
