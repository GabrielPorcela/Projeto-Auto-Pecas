// Normalização de texto compartilhada (minúsculas, sem acento) usada pelos
// serviços de busca/IA para comparação tolerante a acentuação.
export function norm(s) {
  return (s || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
