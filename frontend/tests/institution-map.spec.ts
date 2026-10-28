import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import { fixtureLogin, isolateApi } from './auth-helpers';
import { mockMaps } from './maps-mock';

const api = process.env.E2E_API_URL || 'http://127.0.0.1:8081';
async function newSchool(request: APIRequestContext, name: string, located: boolean) {
  const email = `map-school-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;
  const registered = await request.post(`${api}/api/auth/register`, { data: {
    email, password: 'InstitutionMap2026!', firstName: 'Colegio', lastName: 'Mapa', role: 'COLEGIO',
  }});
  expect(registered.status()).toBe(201);
  const { token } = await registered.json();
  if (located) {
    const response = await request.post(`${api}/api/institutions`, { headers: { Authorization: `Bearer ${token}` }, data: {
      name, address: 'Avenida Macul 123, Macul', region: 'Región Metropolitana', commune: 'Macul',
      phone: '123456789', email, primaryColor: '#178A45', secondaryColor: '#FFFFFF',
      placeId: 'test-institution-place', latitude: -33.49, longitude: -70.60,
    }});
    expect(response.status()).toBe(201);
    return { email, institution: await response.json() };
  }
  return { email, institution: null };
}
async function loginSchool(page: Page, email: string) {
  await page.goto('/');
  await page.getByLabel('Correo electrónico', { exact: true }).fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill('InstitutionMap2026!');
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  await expect(page).toHaveURL('/colegio');
}
test.beforeEach(async ({ page }) => { await isolateApi(page); await mockMaps(page); });

test('school must select a Google address; editing invalidates it and saved location survives reload', async ({ page, request }) => {
  const { email } = await newSchool(request, '', false);
  await loginSchool(page, email);
  await page.getByLabel('Nombre del establecimiento').fill('Colegio Registro Mapa');
  await page.getByLabel('Teléfono', { exact: true }).fill('123456789');
  const save = page.getByRole('button', { name: 'Guardar institución', exact: true });
  await expect(save).toBeDisabled();
  await page.getByRole('button', { name: 'Seleccionar dirección de prueba' }).click();
  await expect(save).toBeEnabled();
  await page.getByRole('textbox', { name: 'Dirección del establecimiento', exact: true }).fill('Otra calle');
  await expect(save).toBeDisabled();
  await page.getByRole('button', { name: 'Seleccionar dirección de prueba' }).click();
  const saved = page.waitForResponse(response => response.url().endsWith('/api/institutions') && response.request().method() === 'POST');
  await save.click();
  const institution = await (await saved).json();
  expect(institution.latitude).toBe(-33.49);
  expect(institution.longitude).toBe(-70.60);
  expect(institution.placeId).toBe('test-place');
  await expect(page.locator('.toast')).toContainText('Institución y tema guardados');
  await page.reload();
  await expect(page.locator('.pickup-confirmed')).toContainText('Los Plátanos 1234');
  await expect(save).toBeEnabled();
});

test('families search by name, hover markers, focus and save; drivers select on the same map', async ({ page, request }) => {
  const name = `Colegio Mapa Ñuñoa ${Date.now()}`;
  const { institution } = await newSchool(request, name, true);
  await fixtureLogin(page, 'Apoderado');
  const search = page.getByRole('combobox', { name: 'Buscar institución por nombre' });
  await search.fill(name.replace('Ñuñoa', 'nunoa'));
  const row = page.locator('.school-result').filter({ hasText: name });
  await expect(row).toBeVisible();
  await search.fill(name.replace('Colegio', 'Comegio'));
  await page.getByRole('option', { name: new RegExp(name) }).click();
  await expect(page.locator('.institution-focused')).toContainText(name);
  await expect(page.getByRole('listbox', { name: 'Colegios sugeridos' })).toHaveCount(0);
  await search.fill(name.replace('Ñuñoa', 'nunoa'));
  await search.press('ArrowDown');
  await search.press('Enter');
  await expect(page.locator('.institution-focused')).toContainText(name);
  const pin = page.getByRole('button', { name: `Ubicar ${name}`, exact: true });
  await expect(pin).toBeVisible();
  await pin.dispatchEvent('mouseenter');
  await expect(page.locator('.institution-directory-map strong')).toHaveText(name);
  await pin.click();
  await expect(page.locator('.institution-focused')).toContainText(name);
  await expect(page.locator('[aria-label="Mapa de instituciones inscritas"]')).toHaveAttribute('data-center', '{"lat":-33.49,"lng":-70.6}');
  await row.getByRole('button', { name: 'Guardar institución' }).click();
  await expect(page.locator('.institution-card').filter({ hasText: name })).toBeVisible();
  await search.fill('institución inexistente xyz');
  await expect(page.locator('.institution-directory')).toContainText('No hay instituciones con ese nombre');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  await fixtureLogin(page, 'Furgonista');
  await page.goto('/furgonista/cobertura');
  await page.getByRole('combobox', { name: 'Buscar institución por nombre' }).fill(name);
  await row.getByRole('button', { name: 'Seleccionar institución' }).click();
  await expect(row.getByRole('button', { name: 'Quitar selección' })).toBeVisible();
  const clearZone = page.getByRole('button', { name: 'Borrar zona y dibujar otra' });
  if (await clearZone.isEnabled()) await clearZone.click();
  await page.getByRole('button', { name: 'Punto de zona 1', exact: true }).click();
  await page.getByRole('button', { name: 'Punto de zona 2', exact: true }).click();
  await page.getByRole('button', { name: 'Punto de zona 3', exact: true }).click();
  await page.getByRole('button', { name: 'Punto de zona 4', exact: true }).click();
  await page.getByRole('button', { name: 'Terminar dibujo' }).click();
  const updated = page.waitForRequest(request => request.url().includes('/coverage') && request.method() === 'PUT');
  await page.getByRole('button', { name: 'Guardar cobertura' }).click();
  expect((await updated).postDataJSON().institutionIds).toContain(institution.id);
  await expect(page.locator('.toast')).toContainText('Cobertura actualizada');
  await page.reload();
  await expect(page.getByRole('region', { name: 'Delimitar zona de trabajo' })).toContainText('4 puntos');
  await page.getByRole('combobox', { name: 'Buscar institución por nombre' }).fill(name);
  await expect(row.getByRole('button', { name: 'Quitar selección' })).toBeVisible();
});

