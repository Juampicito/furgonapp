import {test,expect} from '@playwright/test';
import {fixtureLogin,isolateApi} from './auth-helpers';
test.beforeEach(async({page})=>isolateApi(page));

test('public registration, logout and login work for each public role',async({page})=>{
  for (const [role,route] of [['APODERADO','apoderado'],['FURGONISTA','furgonista'],['COLEGIO','colegio']]) {
    const email=`${role.toLowerCase()}-${Date.now()}@example.com`;
    await page.goto('/');
    await page.getByRole('button',{name:'Crear cuenta',exact:true}).click();
    await page.getByLabel('Tipo de cuenta').selectOption(role);
    await page.getByLabel('Nombre',{exact:true}).fill('Nueva');
    await page.getByLabel('Apellido',{exact:true}).fill('Familia');
    await page.getByLabel('Correo electrónico',{exact:true}).fill(email);
    await page.getByLabel('Contraseña',{exact:true}).fill('Una frase segura 2026!');
    await page.getByLabel('Confirmar contraseña',{exact:true}).fill('Una frase segura 2026!');
    await page.getByRole('button',{name:'Registrarme',exact:true}).click();
    await expect(page).toHaveURL('/'+route);
    await expect(page.getByRole('heading',{level:1})).toBeVisible();
    await page.getByRole('button',{name:'Cerrar sesión',exact:true}).click();
    await expect(page).toHaveURL('/');
    await page.getByLabel('Correo electrónico',{exact:true}).fill(email);
    await page.getByLabel('Contraseña',{exact:true}).fill('Una frase segura 2026!');
    await page.getByRole('button',{name:'Ingresar',exact:true}).click();
    await expect(page).toHaveURL('/'+route);
  }
});
test('invalid login shows an error and registration has no admin option',async({page})=>{
  await page.goto('/');
  await page.getByLabel('Correo electrónico',{exact:true}).fill('nobody@example.com');
  await page.getByLabel('Contraseña',{exact:true}).fill('incorrect-password');
  await page.getByRole('button',{name:'Ingresar',exact:true}).click();
  await expect(page.locator('.inline-error')).toContainText('Correo o contraseña incorrectos');
  await page.getByRole('button',{name:'Crear cuenta',exact:true}).click();
  await expect(page.getByLabel('Tipo de cuenta').locator('option')).toHaveCount(3);
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('unauthenticated routes return to login and admin signs in with password',async({page})=>{
  await page.goto('/admin');
  await expect(page).toHaveURL('/');
  await fixtureLogin(page,'Administrador');
  await expect(page).toHaveURL('/admin');
  await expect(page.getByRole('heading',{level:1})).toBeVisible();
});
