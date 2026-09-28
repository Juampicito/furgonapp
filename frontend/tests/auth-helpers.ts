import { type Page } from '@playwright/test';

// All browser test writes go to the isolated test backend, never the local user database.
export async function isolateApi(page: Page) {
  await page.route('**/api/**', async route => {
    const source = new URL(route.request().url());
    const response = await route.fetch({ url: `${process.env.E2E_API_URL || 'http://127.0.0.1:8081'}${source.pathname}${source.search}` });
    await route.fulfill({response});
  });
}
export async function fixtureLogin(page: Page, role: string) {
  const names: Record<string,string> = {Administrador:'admin',Furgonista:'carlos',Apoderado:'maria',Colegio:'sanmarcos'};
  await page.goto('/');
  await page.getByLabel('Correo electrónico', {exact:true}).fill(`${names[role]}@furgonapp.demo`);
  await page.getByLabel('Contraseña', {exact:true}).fill('FurgonDemo2026!');
  await page.getByRole('button', {name:'Ingresar',exact:true}).click();
  await page.waitForURL(`/${({Administrador:'admin',Furgonista:'furgonista',Apoderado:'apoderado',Colegio:'colegio'} as Record<string,string>)[role]}`);
  await page.getByRole('heading', {level:1}).waitFor();
}
