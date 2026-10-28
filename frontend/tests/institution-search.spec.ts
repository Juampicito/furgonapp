import { test, expect } from '@playwright/test';
import { searchInstitutions } from '../src/lib/institution-search';
import type { Institution } from '../src/lib/types';

const schools = [
  { id: 'aromos', name: 'Colegio Los Aromos · Presentación' },
  { id: 'agustin', name: 'Colegio San Agustín · Prueba' },
  { id: 'boston', name: 'Boston College Alto Macul · Prueba' },
] as Institution[];

test('school search tolerates typos, accents, partial names and repeated words without unrelated results', () => {
  for (const query of ['los aromos', 'comegio los aromos', 'los aromos mas el colegio los aromos', 'arom', 'colegio los armos']) {
    expect(searchInstitutions(schools, query).map(i => i.id)).toEqual(['aromos']);
  }
  expect(searchInstitutions(schools, 'comegio').map(i => i.id).sort()).toEqual(['agustin', 'aromos']);
  expect(searchInstitutions(schools, 'san agus')).toEqual([schools[1]]);
  expect(searchInstitutions(schools, 'institución inexistente xyz')).toEqual([]);
  expect(searchInstitutions(schools, '')).toEqual(schools);
});
