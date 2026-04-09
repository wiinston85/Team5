import { expect, Page } from '@playwright/test';

export class TestHelper {
  constructor(private readonly page: Page) {}

  async gotoLogin() {
    await this.page.goto('/login');
    await expect(this.page.getByRole('heading', { name: 'Passkey Login' })).toBeVisible();
  }

  async createTodo(title: string) {
    await this.page.getByPlaceholder('Todo title').fill(title);
    await this.page.getByRole('button', { name: 'Add Todo' }).click();
    await expect(this.page.getByText(title)).toBeVisible();
  }

  async createTag(name: string) {
    await this.page.getByPlaceholder('New tag').fill(name);
    await this.page.getByRole('button', { name: 'Create Tag' }).click();
    await expect(this.page.getByText(name)).toBeVisible();
  }

  async addSubtask(todoTitle: string, subtaskTitle: string) {
    this.page.on('dialog', async (dialog) => {
      await dialog.accept(subtaskTitle);
    });
    const card = this.page.locator('article').filter({ hasText: todoTitle });
    await card.getByRole('button', { name: 'Add subtask' }).click();
    await expect(card.getByText(subtaskTitle)).toBeVisible();
  }
}
