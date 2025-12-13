import { test, expect } from '@playwright/test';

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('sb-auth-token', JSON.stringify({
        user: { id: 'test-user-id', email: 'test@example.com' },
        session: { access_token: 'test-token' }
      }));
    });
    
    await page.goto('/settings');
  });

  test('should display settings sections', async ({ page }) => {
    // Should see settings header
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    
    // Should see key sections
    await expect(page.getByText('Company Information')).toBeVisible();
    await expect(page.getByText('Branding')).toBeVisible();
    await expect(page.getByText('Appearance')).toBeVisible();
  });

  test('should update company name', async ({ page }) => {
    // Find company name input
    const companyNameInput = page.getByLabel('Company Name');
    await expect(companyNameInput).toBeVisible();
    
    // Clear and enter new name
    await companyNameInput.clear();
    await companyNameInput.fill('Test Company Inc.');
    
    // Save changes
    await page.getByRole('button', { name: 'Save Company Information' }).click();
    
    // Should see success message
    await expect(page.getByText(/successfully/i)).toBeVisible();
  });

  test('should toggle theme', async ({ page }) => {
    // Find theme selector
    const darkThemeOption = page.getByLabel('Dark');
    await darkThemeOption.click();
    
    // Theme should change (check for dark class or background)
    await page.waitForTimeout(500);
    
    // Verify dark theme is active
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);
  });

  test('should update branding colors', async ({ page }) => {
    // Find primary color input
    const primaryColorInput = page.getByLabel('Primary Color');
    await expect(primaryColorInput).toBeVisible();
    
    // Change color
    await primaryColorInput.fill('#ff5733');
    
    // Save changes
    await page.getByRole('button', { name: 'Save Branding' }).click();
    
    // Should see success message
    await expect(page.getByText(/successfully/i)).toBeVisible();
  });
});
