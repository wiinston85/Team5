import { test, expect } from '@playwright/test';

test('export import feature path is protected for unauthenticated users', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);
});
