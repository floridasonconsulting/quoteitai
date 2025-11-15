import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should show landing page for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    
    // Should see landing page elements
    await expect(page.getByText('Quote-It AI')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible();
  });

  test('should navigate to auth page', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('link', { name: 'Sign In' }).click();
    
    // Should be on auth page
    await expect(page).toHaveURL(/.*auth/);
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
  });

  test('should show validation errors for invalid credentials', async ({ page }) => {
    await page.goto('/auth');
    
    // Try to sign in with empty fields
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Should show validation error
    await expect(page.getByText(/email.*required/i)).toBeVisible();
  });

  test('should toggle between sign in and sign up', async ({ page }) => {
    await page.goto('/auth');
    
    // Should start on sign in
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    
    // Click "Sign Up" tab
    await page.getByRole('tab', { name: 'Sign Up' }).click();
    
    // Should now show sign up form
    await expect(page.getByRole('button', { name: 'Sign Up' })).toBeVisible();
  });
});
