import { wireSearchBox } from '../components/search-box.js';
import { wireVehicleForm } from '../services/vehicle-service.js';

function goToResults(query) {
  const params = new URLSearchParams();
  if (query && query.trim()) params.set('q', query.trim());
  window.location.href = `resultados.html?${params.toString()}`;
}

const heroInput = document.getElementById('pass-hero-search');
const heroSuggestions = document.getElementById('hero-search-suggestions');
const heroBtn = document.getElementById('hero-search-btn');

if (heroInput && heroSuggestions) {
  wireSearchBox(heroInput, heroSuggestions, goToResults, '');
  if (heroBtn) heroBtn.addEventListener('click', () => goToResults(heroInput.value));
}

document.querySelectorAll('.example-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    if (heroInput) heroInput.value = chip.textContent.trim();
    goToResults(chip.textContent.trim());
  });
});

const vehicleForm = document.getElementById('home-vehicle-form');
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
