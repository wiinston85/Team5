import { test, expect } from '@playwright/test';

test('calendar route redirects to login when unauthenticated', async ({ page }) => {
  await page.goto('/calendar');
  await expect(page).toHaveURL(/\/login/);
});
