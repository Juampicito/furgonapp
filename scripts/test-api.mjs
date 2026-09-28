import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = process.env.TEST_API_URL || 'http://127.0.0.1:8081/api';
let backend;
let tokens = {};
let driver, school, vehicle, guardian, admin;
let acceptedQuote;

async function request(url, role = 'ADMIN', method = 'GET', body, expected = 200) {
  const form = body instanceof FormData;
  const response = await fetch(base + url, {
    method,
    headers: { ...(tokens[role] ? { Authorization: `Bearer ${tokens[role]}` } : {}), ...(!form && body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
    body: body === undefined ? undefined : form ? body : JSON.stringify(body),
  });
  const text = await response.text();
  assert.equal(response.status, expected, `${method} ${url}: ${text}`);
  return text ? JSON.parse(text) : null;
}
async function createQuote() {
  return (await request('/quotes', 'APODERADO', 'POST', { driverId: driver.id, institutionId: school.id, address: 'Los Plátanos 1234', commune: 'Macul' }, 201)).id;
}
async function approve() { await request(`/admin/drivers/${driver.id}`, 'ADMIN', 'PATCH', { status: 'APROBADO' }); }

before(async () => {
  if (!process.env.TEST_API_URL) {
    fs.mkdirSync(path.join(root, '.tools'), { recursive: true });
    const log = fs.openSync(path.join(root, '.tools/api-test-server.log'), 'w');
    backend = spawn('java', ['-jar', 'target/furgonapp-0.1.0.jar', '--spring.profiles.active=test', '--server.port=8081', '--spring.datasource.url=jdbc:h2:mem:api-tests;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1'], { cwd: path.join(root, 'backend'), stdio: ['ignore', log, log], windowsHide: true });
    backend.on('error', e => { throw e; });
    let ready = false;
    for (let i = 0; i < 120; i++) {
      if (backend.exitCode !== null) throw new Error('El backend de pruebas no pudo iniciar. Consulta .tools/api-test-server.log.');
      try { if ((await fetch(base + '/health')).ok) { ready = true; break; } } catch {}
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    assert.ok(ready, 'El backend no inició en 60 segundos');
  }
  for (const role of ['ADMIN', 'FURGONISTA', 'APODERADO', 'COLEGIO']) {
    for (let attempt = 0; attempt < 20; attempt++) {
      try { tokens[role] = (await request('/auth/login', '', 'POST', { email: ({ ADMIN: 'admin', FURGONISTA: 'carlos', APODERADO: 'maria', COLEGIO: 'sanmarcos' })[role] + '@furgonapp.demo', password: 'FurgonDemo2026!' })).token; break; }
      catch (e) { if (attempt === 19) throw e; await new Promise(resolve => setTimeout(resolve, 300)); }
    }
  }
  admin = await request('/workspace');
  driver = admin.drivers.find(d => d.name === 'Carlos González');
  vehicle = driver.vehicle;
  school = admin.institutions.find(i => i.name === 'Colegio San Marcos');
  guardian = (await request('/workspace', 'APODERADO')).user;
}, { timeout: 90000 });
after(() => { backend?.kill(); });

test('search returns only approved, available drivers in the selected zone and school', async () => {
  const found = await request(`/search/drivers?institutionId=${school.id}&commune=Macul`, 'APODERADO');
  assert.deepEqual(found.map(d => d.name).sort(), ['Carlos González', 'Patricia Muñoz']);
  const wrong = await request(`/search/drivers?institutionId=${school.id}&commune=Maip%C3%BA`, 'APODERADO');
  assert.equal(wrong.length, 0);
  assert.ok(!JSON.stringify(found).includes('passwordHash'));
  assert.ok(!JSON.stringify(found).includes('rut'));
});
test('guardian saves multiple institutions and repeated save is idempotent', async () => {
  for (const i of admin.institutions) for (let n=0;n<2;n++) await request(`/guardians/me/institutions/${i.id}`, 'APODERADO', 'POST');
  assert.equal((await request('/workspace', 'APODERADO')).savedInstitutionIds.length, 2);
});
test('school theme persists and school cannot see family contracts', async () => {
  await request(`/institutions/${school.id}`, 'COLEGIO', 'PUT', { ...school, primaryColor: '#178A45', secondaryColor: '#FFFFFF' });
  const w = await request('/workspace', 'COLEGIO');
  assert.equal(w.institutions.find(i => i.id === school.id).primaryColor, '#178A45');
  assert.equal(w.contracts.length, 0);assert.equal(w.quotes.length, 0);
  await request(`/institutions/${school.id}`, 'APODERADO', 'PUT', school, 403);
});
test('private documents require the owner or admin, including cross-driver access', async () => {
  const doc = admin.documents.find(d => d.driverId === driver.id);
  await request(`/documents/${doc.id}/content`, 'APODERADO', 'GET', undefined, 403);
  tokens.OTHER = (await request('/auth/login', '', 'POST', { email: 'patricia@furgonapp.demo', password: 'FurgonDemo2026!' })).token;
  await request(`/documents/${doc.id}/content`, 'OTHER', 'GET', undefined, 403);
  const own = await fetch(base + `/documents/${doc.id}/content`, { headers: { Authorization: `Bearer ${tokens.FURGONISTA}` } });
  assert.equal(own.status, 200);assert.equal(own.headers.get('cache-control'), 'no-store');
  await request('/workspace', '', 'GET', undefined, 401);
});
test('price validation rejects excess, zero and wrong-role offers', async () => {
  acceptedQuote = await createQuote();
  await request(`/quotes/${acceptedQuote}/offer`, 'FURGONISTA', 'POST', { monthlyPrice: 100000 }, 400);
  await request(`/quotes/${acceptedQuote}/offer`, 'FURGONISTA', 'POST', { monthlyPrice: 0 }, 400);
  await request(`/quotes/${acceptedQuote}/offer`, 'APODERADO', 'POST', { monthlyPrice: 78000 }, 403);
  await request(`/quotes/${acceptedQuote}/offer`, 'OTHER', 'POST', { monthlyPrice: 78000 }, 403);
  await request(`/quotes/${acceptedQuote}/review`, 'FURGONISTA', 'POST');
  await request(`/quotes/${acceptedQuote}/offer`, 'FURGONISTA', 'POST', { monthlyPrice: 78000 });
});
test('acceptance atomically creates a contract, reserves one seat and notifies both users', async () => {
  await request(`/quotes/${acceptedQuote}/accept`, 'APODERADO', 'POST');
  const d = await request('/workspace', 'FURGONISTA');
  assert.equal(d.drivers[0].vehicle.occupied, 13);assert.equal(d.drivers[0].vehicle.available, 7);
  const g = await request('/workspace', 'APODERADO');
  assert.equal(g.contracts.length, 1);assert.equal(g.contracts[0].monthlyPrice, 78000);
  assert.ok(d.notifications.some(n => n.title.includes('Oferta aceptada')));
  assert.ok(g.notifications.some(n => n.title === 'Contrato activo'));
  assert.ok((await request('/workspace')).contracts.some(c => c.quoteId === acceptedQuote));
});
test('an accepted quote cannot be accepted twice or rejected', async () => {
  await request(`/quotes/${acceptedQuote}/accept`, 'APODERADO', 'POST', undefined, 409);
  await request(`/quotes/${acceptedQuote}/reject`, 'FURGONISTA', 'POST', undefined, 409);
  assert.equal((await request('/workspace', 'APODERADO')).contracts.length, 1);
});
test('capacity cannot be reduced below active contracts', async () => {
  await request(`/drivers/${driver.id}/vehicle`, 'FURGONISTA', 'PUT', { ...vehicle, capacity: 12 }, 409);
});
test('replacing a document removes public approval until administrator review', async () => {
  const form = new FormData();form.append('type', 'LICENCIA');form.append('file', new Blob(['%PDF-1.4\nDemostración'], { type: 'application/pdf' }), 'licencia-prueba.pdf');
  const doc = await request(`/drivers/${driver.id}/documents`, 'FURGONISTA', 'POST', form);
  assert.equal(doc.status, 'PENDIENTE');
  await request(`/drivers/${driver.id}`, 'APODERADO', 'GET', undefined, 404);
  await request(`/drivers/${driver.id}/submit`, 'FURGONISTA', 'POST');
  await request(`/admin/drivers/${driver.id}`, 'ADMIN', 'PATCH', { status: 'APROBADO' }, 400);
  await request(`/admin/documents/${doc.id}`, 'ADMIN', 'PATCH', { status: 'APROBADO', note: 'Revisión simulada de prueba' });
  await approve();
  assert.equal((await request(`/drivers/${driver.id}`, 'APODERADO')).status, 'APROBADO');
});
test('two simultaneous acceptances for one remaining seat yield one contract and one conflict', async () => {
  await request(`/drivers/${driver.id}/vehicle`, 'FURGONISTA', 'PUT', { ...vehicle, capacity: 14 });
  await approve();
  const ids = [await createQuote(), await createQuote()];
  for (const id of ids) await request(`/quotes/${id}/offer`, 'FURGONISTA', 'POST', { monthlyPrice: 75000 });
  const responses = await Promise.all(ids.map(id => fetch(base + `/quotes/${id}/accept`, { method: 'POST', headers: { Authorization: `Bearer ${tokens.APODERADO}` } })));
  assert.deepEqual(responses.map(r => r.status).sort(), [200, 409]);
  const d = (await request('/workspace', 'FURGONISTA')).drivers[0];
  assert.equal(d.vehicle.occupied, 14);assert.equal(d.vehicle.available, 0);
  assert.ok(!(await request(`/search/drivers?institutionId=${school.id}&commune=Macul`, 'APODERADO')).some(x => x.id === driver.id));
});
test('deactivating an account blocks an already issued token', async () => {
  await request(`/admin/users/${driver.userId}/active`, 'ADMIN', 'PATCH', { active: false });
  await request('/workspace', 'FURGONISTA', 'GET', undefined, 403);
  await request(`/admin/users/${driver.userId}/active`, 'ADMIN', 'PATCH', { active: true });
});
