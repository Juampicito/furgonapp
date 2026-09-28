import { test, expect, type Page } from '@playwright/test';
import { mockMaps } from './maps-mock';
import { fixtureLogin, isolateApi } from './auth-helpers';
test.beforeEach(async ({ page }) => isolateApi(page));
import { communeFromComponents } from '../src/lib/google-maps';

async function openSchool(page: Page) {
  await fixtureLogin(page, 'Apoderado');
  const school = page.locator('.school-result').filter({ hasText: 'Colegio San Marcos' });
  if (await school.count()) await school.getByRole('button', { name: 'Guardar institución' }).click();
  await page
    .locator('.institution-card')
    .filter({ hasText: 'Colegio San Marcos' })
    .getByRole('button', { name: 'Entrar al colegio' })
    .click();
}

test('missing key clearly blocks unverified address search', async ({ page }) => {
  await page.route('**/maps-config', (route) => route.fulfill({ json: { key: '' } }));
  await openSchool(page);
  await expect(
    page.getByText('Google Maps pendiente de activación.', { exact: false }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Buscar furgonistas' })).toBeDisabled();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('selected Google address determines search commune and editing clears results', async ({
  page,
}) => {
  await mockMaps(page);
  await openSchool(page);
  await expect(page.getByRole('button', { name: 'Buscar furgonistas' })).toBeDisabled();
  await page.getByRole('button', { name: 'Seleccionar dirección de prueba' }).click();
  await expect(page.locator('.pickup-confirmed')).toContainText('Comuna: Macul');
  await expect(page.getByRole('link', { name: 'Ver en Google Maps' })).toHaveAttribute(
    'href',
    /query_place_id=test-place/,
  );
  const search = page.waitForRequest((request) => request.url().includes('/api/search/drivers?'));
  await page.getByRole('button', { name: 'Buscar furgonistas' }).click();
  expect(new URL((await search).url()).searchParams.get('commune')).toBe('Macul');
  await expect(page.locator('.driver-card').first()).toBeVisible();
  await page.getByRole('textbox', { name: 'Dirección de recogida' }).fill('Otra dirección');
  await expect(page.getByRole('button', { name: 'Buscar furgonistas' })).toBeDisabled();
  await expect(page.locator('.driver-card')).toHaveCount(0);
});

test('Google network failure stays actionable and does not permit searching', async ({ page }) => {
  await page.route('**/maps-config', (route) => route.fulfill({ json: { key: 'test-key' } }));
  await page.route('https://maps.googleapis.com/**', (route) => route.abort());
  await openSchool(page);
  await expect(page.locator('.pickup-search [role=alert]')).toContainText(
    'No se pudo conectar con Google Maps',
  );
  await expect(page.getByRole('button', { name: 'Buscar furgonistas' })).toBeDisabled();
});

test('Chilean commune takes priority over city and province', () => {
  const parts = [
    { longText: 'Santiago', types: ['locality'] },
    { longText: 'Ñuñoa', types: ['administrative_area_level_3'] },
  ] as google.maps.places.AddressComponent[];
  expect(communeFromComponents(parts)).toBe('Ñuñoa');
  expect(
    communeFromComponents([
      { longText: 'Santiago', types: ['administrative_area_level_2'] },
    ] as google.maps.places.AddressComponent[]),
  ).toBe('');
});

test('late Google authorization failure invalidates the selected location', async ({ page }) => {
  await mockMaps(page);
  await openSchool(page);
  await page.getByRole('button', { name: 'Seleccionar dirección de prueba' }).click();
  await expect(page.getByRole('button', { name: 'Buscar furgonistas' })).toBeEnabled();
  await page.evaluate(() => (window as unknown as { gm_authFailure: () => void }).gm_authFailure());
  await expect(page.locator('.pickup-search [role=alert]')).toContainText(
    'Google Maps no está disponible',
  );
  await expect(page.getByRole('button', { name: 'Buscar furgonistas' })).toBeDisabled();
  await expect(page.locator('.pickup-confirmed')).toHaveCount(0);
});
