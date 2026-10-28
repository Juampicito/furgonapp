import { test, expect } from '@playwright/test';
import { fixtureLogin, isolateApi } from './auth-helpers';
import { mockMaps } from './maps-mock';

test('coverage help video opens, plays and pauses when the help is closed', async ({ page }) => {
  await isolateApi(page); await mockMaps(page);
  await fixtureLogin(page, 'Furgonista');
  await page.goto('/furgonista/cobertura');
  const help = page.locator('.territory-tutorial summary');
  const video = page.getByLabel('Video: cómo delimitar tu zona de trabajo');
  await expect(video).not.toBeVisible();
  await help.click();
  await expect(video).toBeVisible();
  await video.evaluate((element: HTMLVideoElement) => element.play());
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(0);
  await expect.poll(() => video.evaluate((element: HTMLVideoElement & { webkitAudioDecodedByteCount: number }) => element.webkitAudioDecodedByteCount)).toBeGreaterThan(0);
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => Number.isFinite(element.duration) && element.duration > 40)).toBe(true);
  await help.click();
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.paused)).toBe(true);
});
