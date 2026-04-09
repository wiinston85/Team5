import { test, expect } from '@playwright/test';

test('notification permission button exists after auth page gate', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
});
