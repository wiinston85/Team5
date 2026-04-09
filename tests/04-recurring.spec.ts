import { test, expect } from '@playwright/test';

test('recurring flow requires authenticated session', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);
});
