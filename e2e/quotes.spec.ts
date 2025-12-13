import { test, expect } from '@playwright/test';

test.describe('Quotes Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('sb-auth-token', JSON.stringify({
        user: { id: 'test-user-id', email: 'test@example.com' },
        session: { access_token: 'test-token' }
      }));
    });
    
    await page.goto('/quotes');
  });

  test('should display quotes list', async ({ page }) => {
    // Should see quotes page header
    await expect(page.getByRole('heading', { name: 'Quotes' })).toBeVisible();
    
    // Should see "New Quote" button
    await expect(page.getByRole('button', { name: 'New Quote' })).toBeVisible();
  });

  test('should navigate to new quote page', async ({ page }) => {
    // Click "New Quote" button
    await page.getByRole('button', { name: 'New Quote' }).click();
    
    // Should be on new quote page
    await expect(page).toHaveURL(/.*quotes\/new/);
    await expect(page.getByText('Create New Quote')).toBeVisible();
  });

  test('should filter quotes by status', async ({ page }) => {
    // Should see status filter dropdown
    const statusFilter = page.getByRole('combobox', { name: /status/i });
    await expect(statusFilter).toBeVisible();
    
    // Change filter
    await statusFilter.click();
    await page.getByRole('option', { name: 'Accepted' }).click();
    
    // List should update (verify by checking URL or data)
    await page.waitForTimeout(500); // Wait for filter to apply
  });

  test('should search quotes', async ({ page }) => {
    // Should see search input
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();
    
    // Type in search
    await searchInput.fill('test quote');
    
    // Wait for search to apply
    await page.waitForTimeout(500);
  });
});
