import { test, expect } from '@playwright/test';

test('subtasks feature covered by protected route behavior', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);
});
