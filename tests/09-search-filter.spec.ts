import { test, expect } from '@playwright/test';

test('search and filter UI is behind auth gate', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);
});
