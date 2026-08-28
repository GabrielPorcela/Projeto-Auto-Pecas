import { wireSearchBox } from '../components/search-box.js';
import { wireVehicleForm } from '../services/vehicle-service.js';

function goToResults(query) {
  const params = new URLSearchParams();
  if (query && query.trim()) params.set('q', query.trim());
  window.location.href = `resultados.html?${params.toString()}`;
}

const input = document.getElementById('busca-input');
const suggestions = document.getElementById('busca-suggestions');
const btn = document.getElementById('busca-btn');

if (input && suggestions) {
  wireSearchBox(input, suggestions, goToResults, '');
  if (btn) btn.addEventListener('click', () => goToResults(input.value));
}

const vehicleForm = document.getElementById('busca-vehicle-form');
if (vehicleForm) {
  wireVehicleForm(vehicleForm);
  vehicleForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(vehicleForm);
    const params = new URLSearchParams();
    for (const [key, value] of data.entries()) if (value) params.set(key, value);
    window.location.href = `resultados.html?${params.toString()}`;
  });
}
