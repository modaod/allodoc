// Authentication User Acceptance Tests
import { test, expect } from '@playwright/test';

test.describe('Authentication Workflows', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('UAT-001: User can successfully log in with valid credentials', async ({ page }) => {
    // Test user login flow
    await page.fill('[data-testid=email-input]', 'doctor@medical.com');
    await page.fill('[data-testid=password-input]', 'Test123!@#');
    await page.click('[data-testid=login-button]');
    
    // Verify successful login
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid=user-menu]')).toBeVisible();
    await expect(page.locator('[data-testid=welcome-message]')).toContainText('Welcome');
  });

  test('UAT-002: User cannot log in with invalid credentials', async ({ page }) => {
    // Test invalid login
    await page.fill('[data-testid=email-input]', 'invalid@medical.com');
    await page.fill('[data-testid=password-input]', 'wrongpassword');
    await page.click('[data-testid=login-button]');
    
    // Verify error message
    await expect(page.locator('[data-testid=error-message]')).toBeVisible();
    await expect(page.locator('[data-testid=error-message]')).toContainText('Invalid credentials');
    await expect(page).toHaveURL('/login');
  });

  test('UAT-003: User can see validation errors for empty fields', async ({ page }) => {
    // Try to login without filling fields
    await page.click('[data-testid=login-button]');
    
    // Check validation errors
    await expect(page.locator('[data-testid=email-error]')).toBeVisible();
    await expect(page.locator('[data-testid=password-error]')).toBeVisible();
    await expect(page.locator('[data-testid=email-error]')).toContainText('Email is required');
    await expect(page.locator('[data-testid=password-error]')).toContainText('Password is required');
  });

  test('UAT-004: User can toggle password visibility', async ({ page }) => {
    await page.fill('[data-testid=password-input]', 'password123');
    
    // Password should be hidden by default
    await expect(page.locator('[data-testid=password-input]')).toHaveAttribute('type', 'password');
    
    // Click show password
    await page.click('[data-testid=toggle-password]');
    await expect(page.locator('[data-testid=password-input]')).toHaveAttribute('type', 'text');
    
    // Click hide password
    await page.click('[data-testid=toggle-password]');
    await expect(page.locator('[data-testid=password-input]')).toHaveAttribute('type', 'password');
  });

  test('UAT-005: User can access forgot password functionality', async ({ page }) => {
    await page.click('[data-testid=forgot-password-link]');
    
    // Should navigate to forgot password page
    await expect(page).toHaveURL('/forgot-password');
    await expect(page.locator('h1')).toContainText('Reset Password');
    
    // Fill email and submit
    await page.fill('[data-testid=reset-email-input]', 'doctor@medical.com');
    await page.click('[data-testid=reset-submit-button]');
    
    // Should show success message
    await expect(page.locator('[data-testid=success-message]')).toBeVisible();
    await expect(page.locator('[data-testid=success-message]')).toContainText('Reset link sent');
  });

  test('UAT-006: User session persists across browser refresh', async ({ page }) => {
    // Login first
    await page.fill('[data-testid=email-input]', 'doctor@medical.com');
    await page.fill('[data-testid=password-input]', 'Test123!@#');
    await page.click('[data-testid=login-button]');
    await expect(page).toHaveURL('/dashboard');
    
    // Refresh the page
    await page.reload();
    
    // Should still be logged in
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid=user-menu]')).toBeVisible();
  });

  test('UAT-007: User can successfully log out', async ({ page }) => {
    // Login first
    await page.fill('[data-testid=email-input]', 'doctor@medical.com');
    await page.fill('[data-testid=password-input]', 'Test123!@#');
    await page.click('[data-testid=login-button]');
    await expect(page).toHaveURL('/dashboard');
    
    // Logout
    await page.click('[data-testid=user-menu]');
    await page.click('[data-testid=logout-button]');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
    
    // Try to access protected route
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });

  test('UAT-008: Unauthenticated user is redirected to login', async ({ page }) => {
    // Try to access protected routes
    const protectedRoutes = ['/dashboard', '/patients', '/consultations', '/prescriptions'];
    
    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL('/login');
    }
  });

  test('UAT-009: Different user roles can access appropriate features', async ({ page }) => {
    // Test with doctor role
    await page.fill('[data-testid=email-input]', 'doctor@medical.com');
    await page.fill('[data-testid=password-input]', 'Test123!@#');
    await page.click('[data-testid=login-button]');
    
    await expect(page).toHaveURL('/dashboard');
    
    // Doctor should see all menu items
    await expect(page.locator('[data-testid=menu-patients]')).toBeVisible();
    await expect(page.locator('[data-testid=menu-consultations]')).toBeVisible();
    await expect(page.locator('[data-testid=menu-prescriptions]')).toBeVisible();
    
    // Logout and test with nurse role
    await page.click('[data-testid=user-menu]');
    await page.click('[data-testid=logout-button]');
    
    await page.fill('[data-testid=email-input]', 'nurse@medical.com');
    await page.fill('[data-testid=password-input]', 'Test123!@#');
    await page.click('[data-testid=login-button]');
    
    // Nurse should see limited menu items
    await expect(page.locator('[data-testid=menu-patients]')).toBeVisible();
    await expect(page.locator('[data-testid=menu-consultations]')).toBeVisible();
    
    // Nurse should not see prescriptions (if restricted)
    const prescriptionsMenu = page.locator('[data-testid=menu-prescriptions]');
    if (await prescriptionsMenu.count() > 0) {
      // If visible, check if it's disabled or has restricted access
      await prescriptionsMenu.click();
      // This would depend on the actual RBAC implementation
    }
  });

  test('UAT-010: Login form handles network errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('**/api/v1/auth/login', (route) => {
      route.abort('failed');
    });
    
    await page.fill('[data-testid=email-input]', 'doctor@medical.com');
    await page.fill('[data-testid=password-input]', 'Test123!@#');
    await page.click('[data-testid=login-button]');
    
    // Should show network error message
    await expect(page.locator('[data-testid=error-message]')).toBeVisible();
    await expect(page.locator('[data-testid=error-message]')).toContainText('Network error');
  });
});