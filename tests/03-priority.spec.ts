import { test, expect } from '@playwright/test';

test('priority options are rendered on login-protected app', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('button', { name: 'Register' })).toBeVisible();
});
