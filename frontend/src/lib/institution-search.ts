import type { Institution } from './types';

const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const ignored = new Set(['el', 'la', 'los', 'las', 'de', 'del', 'y', 'mas', 'prueba', 'presentacion']);

function distance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + Number(a[i - 1] !== b[j - 1]));
    previous = current;
  }
  return previous[b.length];
}

export function searchInstitutions(institutions: Institution[], query: string): Institution[] {
  const text = normalize(query);
  if (!text) return institutions;
  const tokens = [...new Set(text.split(' ').filter(word => !ignored.has(word)))];
  if (!tokens.length) return institutions.filter(i => normalize(i.name).includes(text));
  return institutions.map(institution => {
    const name = normalize(institution.name);
    const words = name.split(' ');
    let score = name.includes(text) ? -10 : 0;
    for (const token of tokens) {
      const best = Math.min(...words.map(word => word === token ? 0 : word.startsWith(token) ? 0.25 : token.length >= 4 ? distance(token, word) : Infinity));
      const tolerance = token.length >= 8 ? 2 : token.length >= 4 ? 1 : 0.25;
      if (best > tolerance) return { institution, score: Infinity };
      score += best;
    }
    return { institution, score };
  }).filter(result => Number.isFinite(result.score)).sort((a, b) => a.score - b.score || a.institution.name.localeCompare(b.institution.name, 'es')).map(result => result.institution);
}
