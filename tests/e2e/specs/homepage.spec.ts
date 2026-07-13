import { test, expect } from '@playwright/test';

test.describe('FestSchmiede Homepage (Plattform)', () => {
  test('Landingpage zeigt Hero und Navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /veranstaltungen organisieren/i })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('link', { name: /start/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /mandant beantragen|beantragen/i }).first()).toBeVisible();

    await page.getByRole('button', { name: /menü öffnen/i }).click();
    const drawer = page.getByRole('navigation', { name: /seitennavigation/i });
    await expect(drawer.getByRole('link', { name: /funktionen/i })).toBeVisible();
    await expect(drawer.getByRole('link', { name: /faq/i })).toBeVisible();
  });

  test('FAQ-Seite ist erreichbar', async ({ page }) => {
    await page.goto('/faq');
    await expect(page.getByRole('heading', { name: /häufige fragen/i })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/was kostet festschmiede/i)).toBeVisible();
  });

  test('Screenshots-Seite ist responsive sichtbar', async ({ page }) => {
    await page.goto('/screenshots');
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole('heading', { name: /screenshots/i })).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('img').first()).toBeVisible();
  });
});
