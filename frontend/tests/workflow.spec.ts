import { test, expect, type Page } from '@playwright/test';
import { mockMaps } from './maps-mock';
import { fixtureLogin, isolateApi } from './auth-helpers';
test.beforeEach(async ({ page }) => isolateApi(page));

async function enter(page: Page, role: string) {
  await fixtureLogin(page, role);
  const routes: Record<string, string> = {
    Colegio: 'colegio',
    Apoderado: 'apoderado',
    Furgonista: 'furgonista',
    Administrador: 'admin',
  };
  await expect(page).toHaveURL(`/${routes[role]}`);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

test('school identity → search → quote → offer → contract → admin', async ({ page }) => {
  await mockMaps(page);
  await enter(page, 'Colegio');
  await page.getByLabel('Nombre del establecimiento').fill('Colegio San Marcos');
  await page.getByLabel('Color principal').fill('#178a45');
  await page.getByLabel('Color secundario').fill('#ffffff');
  const logo = await page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#178a45'; context.fillRect(0, 0, 128, 128);
    context.fillStyle = '#ffffff'; context.font = 'bold 48px Arial'; context.textAlign = 'center'; context.fillText('SM', 64, 82);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await page.getByLabel('Logo institucional · PNG o JPEG').setInputFiles({ name: 'san-marcos.png', mimeType: 'image/png', buffer: Buffer.from(logo, 'base64') });
  await expect(page.getByRole('status')).toContainText('Logo cargado');
  await page.getByRole('button', { name: 'Guardar institución', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Institución y tema guardados');

  await enter(page, 'Apoderado');
  const schoolResult = page.locator('.school-result').filter({ hasText: 'Colegio San Marcos' });
  if (await schoolResult.count())
    await schoolResult.getByRole('button', { name: 'Guardar institución' }).click();
  await page
    .locator('.institution-card')
    .filter({ hasText: 'Colegio San Marcos' })
    .getByRole('button', { name: 'Entrar al colegio' })
    .click();
  await expect(page.locator('.institution-hero')).toHaveCSS('background-color', 'rgb(23, 138, 69)');
  await page.getByRole('button', { name: 'Seleccionar dirección de prueba' }).click();
  await page.getByRole('button', { name: 'Buscar furgonistas' }).click();
  await expect(page.locator('.driver-card')).toHaveCount(2);
  await page
    .locator('.driver-card')
    .filter({ hasText: 'Carlos González' })
    .getByRole('button', { name: 'Ver perfil y cotizar' })
    .click();
  await expect(page.getByRole('dialog')).toContainText('Furgón aprobado por el sistema');
  await expect(page.getByRole('dialog')).toContainText('8 disponibles');
  await page.getByRole('button', { name: 'Solicitar cotización' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('link', { name: 'Mis cotizaciones', exact: true }).click();
  await expect(page.locator('.quote-card').first()).toContainText('$75.000');

  await enter(page, 'Furgonista');
  await page.getByRole('link', { name: 'Cotizaciones', exact: true }).click();
  const request = page.locator('.quote-card').filter({ hasText: 'María González' }).first();
  await expect(request).toContainText('maria@furgonapp.demo');
  await request.getByRole('button', { name: 'Enviar oferta' }).click();
  await page.getByLabel('Tu oferta mensual (CLP)').fill('100000');
  await page.getByRole('dialog').getByRole('button', { name: 'Enviar oferta' }).click();
  await expect(page.locator('.toast[role="alert"]')).toContainText('La oferta excede el rango permitido');
  await page.getByLabel('Tu oferta mensual (CLP)').fill('78000');
  await page.getByRole('dialog').getByRole('button', { name: 'Enviar oferta' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();

  await enter(page, 'Apoderado');
  await page.getByRole('link', { name: 'Mis cotizaciones', exact: true }).click();
  await page.getByRole('button', { name: 'Aceptar oferta', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar aceptación' }).click();
  await expect(page.getByRole('status')).toContainText('Contrato activo y cupo reservado');
  await page.getByRole('link', { name: 'Mis contratos', exact: true }).click();
  await expect(page.locator('.contract-card')).toContainText('$78.000');
  await expect(page.locator('.contract-card')).toContainText('1 cupo reservado');

  await enter(page, 'Furgonista');
  await expect(page.locator('.my-vehicle')).toContainText('13 de 20 ocupados');
  await page.screenshot({ path: 'test-results/furgonista-desktop.png', fullPage: true });

  await enter(page, 'Administrador');
  await page.getByRole('link', { name: 'Contratos', exact: true }).click();
  await expect(page.locator('.contract-card').filter({ hasText: '$78.000' })).toHaveCount(1);
});

test('mobile navigation and four role pages have no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const role of ['Apoderado', 'Furgonista', 'Colegio', 'Administrador']) {
    await enter(page, role);
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);
    await page.getByRole('button', { name: 'Abrir menú' }).click();
    await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
    await page.getByRole('button', { name: 'Cerrar menú', exact: true }).click({ position: { x: 370, y: 80 } });
  }
  await enter(page, 'Apoderado');
  await page.screenshot({ path: 'test-results/apoderado-mobile.png', fullPage: true });
});

test('wrong role URL redirects to the authenticated role', async ({ page }) => {
  await enter(page, 'Apoderado');
  await page.goto('/admin');
  await expect(page).toHaveURL('/apoderado');
  await expect(page.getByRole('heading', { name: 'Hola, María 👋' })).toBeVisible();
});

test('driver submits a document and admin reviews document and profile', async ({ page }) => {
  await enter(page, 'Furgonista');
  await page.getByRole('link', { name: 'Mi perfil y vehículo', exact: true }).click();
  await page.getByRole('button', { name: '2 Mi vehículo', exact: true }).click();
  await page.getByLabel('Marca', { exact: true }).fill('Hyundai');
  await page.getByLabel('Modelo', { exact: true }).fill('H1');
  await page.getByLabel('Capacidad total de pasajeros').fill('20');
  await page.getByRole('button', { name: 'Guardar vehículo y continuar' }).click();
  await page.getByLabel('Subir Licencia de conducir', { exact: true }).setInputFiles({
    name: 'licencia-demo.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\nDocumento de prueba, sin validez oficial'),
  });
  await expect(page.getByRole('status')).toContainText('Documento recibido');
  await page.getByRole('button', { name: '4 Área de cobertura', exact: true }).click();
  await page.getByLabel('Macul', { exact: true }).check();
  await page.getByLabel('Ñuñoa', { exact: true }).check();
  await page.getByRole('button', { name: 'Guardar cobertura' }).click();
  await expect(page.getByRole('status')).toContainText('Cobertura actualizada');
  await page.getByRole('button', { name: 'Solicitar revisión' }).click();
  await expect(page.getByRole('status')).toContainText('Perfil enviado a revisión');

  await enter(page, 'Administrador');
  await page.getByRole('link', { name: 'Documentación', exact: true }).click();
  const row = page.getByRole('row').filter({ hasText: 'Licencia de conducir' }).filter({ hasText: 'Carlos González' });
  await row.getByRole('button', { name: 'Revisar', exact: true }).click();
  await page.getByLabel('Observación de la revisión').fill('Aprobación simulada en la demostración');
  await page.getByRole('dialog').getByRole('button', { name: 'Aprobar', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('link', { name: 'Furgonistas', exact: true }).click();
  const driver = page.getByRole('row').filter({ hasText: 'Carlos González' });
  await driver.getByRole('button', { name: 'Aprobar', exact: true }).click();
  await expect(driver).toContainText('Aprobado');
});
