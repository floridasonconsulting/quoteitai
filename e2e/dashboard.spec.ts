import { test, expect } from '@playwright/test';

test.describe('Dashboard - Authenticated', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('sb-auth-token', JSON.stringify({
        user: { id: 'test-user-id', email: 'test@example.com' },
        session: { access_token: 'test-token' }
      }));
    });
  });

  test('should display dashboard metrics', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should see dashboard cards
    await expect(page.getByText('Total Quotes')).toBeVisible();
    await expect(page.getByText('Active Quotes')).toBeVisible();
    await expect(page.getByText('Total Revenue')).toBeVisible();
  });

  test('should navigate to quotes page', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click on quotes link
    await page.getByRole('link', { name: 'Quotes' }).click();
    
    // Should be on quotes page
    await expect(page).toHaveURL(/.*quotes/);
  });

  test('should navigate to customers page', async ({ page }) => {
    await page.goto('/dashboard');
    
    await page.getByRole('link', { name: 'Customers' }).click();
    
    await expect(page).toHaveURL(/.*customers/);
  });

  test('should navigate to items page', async ({ page }) => {
    await page.goto('/dashboard');
    
    await page.getByRole('link', { name: 'Items' }).click();
    
    await expect(page).toHaveURL(/.*items/);
  });
});
