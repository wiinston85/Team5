import { test, expect } from '@playwright/test';

test('tag feature path is protected for unauthenticated users', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);
});
