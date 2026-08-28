import { getUnidades } from '../services/stock-service.js';

// "Como chegar" só fica clicável quando a unidade já tem coordenadas reais
// (data/unidades.json). Hoje nenhuma tem — os botões continuam desabilitados
// (renderizados assim no build) até existir dado real para não inventar rota.
getUnidades().then((unidades) => {
  const unidadeById = Object.fromEntries(unidades.map((u) => [u.id, u]));
  document.querySelectorAll('[data-unit-directions]').forEach((btn) => {
    const unidade = unidadeById[btn.dataset.unitDirections];
    if (!unidade?.coordenadas) return;
    const { lat, lng } = unidade.coordenadas;
    btn.addEventListener('click', () => {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank', 'noopener');
    });
  });
});
