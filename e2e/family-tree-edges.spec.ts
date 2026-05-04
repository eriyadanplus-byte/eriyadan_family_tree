import { test, expect } from '@playwright/test';

/**
 * Regression spec for the spouse-edge bug.
 * Verifies that [data-edge-type="spouse"] SVG elements are rendered at both
 * mobile and desktop viewport sizes, so the original bug cannot silently return.
 *
 * Prerequisites: the dev server must be running (`npm run dev`) with at least
 * one spouse pair in the database. The webServer block in playwright.config.ts
 * starts it automatically.
 */

test.describe('Family tree — spouse edge regression', () => {
  test('desktop viewport renders at least one spouse edge', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/tree');

    // Wait for the SVG canvas to be present
    await page.waitForSelector('svg', { timeout: 15000 });

    // Allow time for the data fetch and layout computation
    await page.waitForTimeout(2000);

    const spouseEdges = page.locator('[data-edge-type="spouse"]');
    const count = await spouseEdges.count();
    expect(count, 'Expected at least one spouse edge at desktop size').toBeGreaterThan(0);
  });

  test('mobile viewport (390×844) renders at least one spouse edge', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/tree');

    await page.waitForSelector('svg', { timeout: 15000 });
    await page.waitForTimeout(2000);

    const spouseEdges = page.locator('[data-edge-type="spouse"]');
    const count = await spouseEdges.count();
    expect(count, 'Expected at least one spouse edge at mobile size').toBeGreaterThan(0);
  });

  test('spouse edge has correct stroke color (gold for spouse, not green)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/tree');

    await page.waitForSelector('[data-edge-type="spouse"]', { timeout: 15000 });

    const firstSpouseEdge = page.locator('[data-edge-type="spouse"]').first();
    const stroke = await firstSpouseEdge.getAttribute('stroke');

    // Spouse edges use the gold colour (rgba(200,150,46,...)), not the green parent-child colour
    expect(stroke).toContain('200,150,46');
  });
});
