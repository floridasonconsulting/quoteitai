# Testing Guide - Quote-It AI

**Last Updated**: 2025-11-15

## 📋 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Unit Testing (Vitest)](#unit-testing-vitest)
4. [E2E Testing (Playwright)](#e2e-testing-playwright)
5. [Test Writing Best Practices](#test-writing-best-practices)
6. [CI/CD Integration](#cicd-integration)
7. [Troubleshooting](#troubleshooting)

---

## Overview

Quote-It AI uses a comprehensive testing strategy combining:

- **Unit Tests**: Vitest + React Testing Library for component and utility testing
- **E2E Tests**: Playwright for full user journey testing
- **CI/CD**: GitHub Actions for automated testing on every push/PR

**Coverage Goals**:
- Unit Tests: 70% code coverage
- E2E Tests: 100% critical user flows
- Performance: Lighthouse score >90

---

## Quick Start

### Installation

```bash
# Install all dependencies including Playwright browsers
npm install
npx playwright install --with-deps
```

### Run All Tests

```bash
npm test
```

### Run Tests Individually

```bash
# Unit tests (watch mode)
npm run test:watch

# Unit tests (single run)
npm test

# Unit tests with UI
npm run test:ui

# E2E tests
npm run test:e2e

# E2E tests with interactive UI
npm run test:e2e:ui

# Coverage report
npm run test:coverage
```

---

## Unit Testing (Vitest)

### Framework Setup

**Technologies**:
- Vitest (test runner)
- React Testing Library (component testing)
- jsdom (DOM simulation)
- @testing-library/user-event (user interaction simulation)

### Test File Conventions

```
src/
  components/
    Button.tsx
    __tests__/
      Button.test.tsx
  hooks/
    useAuth.ts
    __tests__/
      useAuth.test.ts
  lib/
    utils.ts
    __tests__/
      utils.test.ts
```

### Writing Unit Tests

**Component Test Example**:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '../Button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies correct variant styles', () => {
    render(<Button variant="primary">Primary</Button>);
    const button = screen.getByText('Primary');
    expect(button).toHaveClass('bg-primary');
  });
});
```

**Hook Test Example**:

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useAuth } from '../useAuth';

describe('useAuth Hook', () => {
  it('initializes with loading state', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.loading).toBe(true);
  });

  it('loads user data on mount', async () => {
    const { result } = renderHook(() => useAuth());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.user).toBeDefined();
    });
  });
});
```

### Test Utilities

**Mock Data**:
```typescript
// src/test/mocks.ts
export const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  tier: 'pro'
};

export const mockQuote = {
  id: 'quote-123',
  title: 'Test Quote',
  total: 1000
};
```

**Custom Render**:
```typescript
// src/test/utils.tsx
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';

export function renderWithProviders(ui: React.ReactElement) {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </BrowserRouter>
  );
}
```

---

## E2E Testing (Playwright)

### Framework Setup

**Technologies**:
- Playwright (E2E testing framework)
- Browsers: Chromium, Firefox, WebKit
- Mobile: Pixel 5, iPhone 12 emulation

### Test File Structure

```
e2e/
  auth.spec.ts          # Authentication flows
  dashboard.spec.ts     # Dashboard functionality
  quotes.spec.ts        # Quote management
  settings.spec.ts      # Settings page
```

### Writing E2E Tests

**Basic Test Example**:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('user can sign in', async ({ page }) => {
    // Navigate to app
    await page.goto('/');
    
    // Click sign in button
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Fill in credentials
    await page.getByLabel(/email/i).fill('user@example.com');
    await page.getByLabel(/password/i).fill('password123');
    
    // Submit form
    await page.getByRole('button', { name: /submit/i }).click();
    
    // Assert redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });
});
```

**Advanced Test with Setup**:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Quote Management', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login before each test
    await page.goto('/auth');
    await page.getByLabel(/email/i).fill('user@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /submit/i }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('user can create a new quote', async ({ page }) => {
    // Navigate to new quote
    await page.goto('/quotes/new');
    
    // Fill quote details
    await page.getByLabel(/customer/i).selectOption('customer-1');
    await page.getByLabel(/title/i).fill('Test Quote');
    
    // Add item
    await page.getByRole('button', { name: /add item/i }).click();
    await page.getByLabel(/item/i).selectOption('item-1');
    await page.getByLabel(/quantity/i).fill('2');
    
    // Save quote
    await page.getByRole('button', { name: /save/i }).click();
    
    // Assert success
    await expect(page.getByText(/quote created/i)).toBeVisible();
  });
});
```

### Playwright Best Practices

1. **Use data-testid for stable selectors**:
```typescript
// Component
<button data-testid="submit-quote">Submit</button>

// Test
await page.getByTestId('submit-quote').click();
```

2. **Wait for network idle**:
```typescript
await page.goto('/dashboard', { waitUntil: 'networkidle' });
```

3. **Take screenshots on failure**:
```typescript
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== 'passed') {
    await page.screenshot({ 
      path: `test-results/failure-${testInfo.title}.png` 
    });
  }
});
```

---

## Test Writing Best Practices

### General Guidelines

1. **Follow AAA Pattern** (Arrange, Act, Assert)
2. **One assertion per test** (when possible)
3. **Test behavior, not implementation**
4. **Use descriptive test names**
5. **Keep tests independent**
6. **Clean up after tests**

### Component Testing Tips

```typescript
// ❌ Bad: Testing implementation details
expect(component.state.isOpen).toBe(true);

// ✅ Good: Testing behavior
expect(screen.getByRole('dialog')).toBeVisible();
```

```typescript
// ❌ Bad: Multiple unrelated assertions
it('button works', () => {
  expect(button).toBeInTheDocument();
  expect(button).toHaveClass('primary');
  expect(button).not.toBeDisabled();
});

// ✅ Good: Separate, focused tests
it('renders button', () => {
  expect(button).toBeInTheDocument();
});

it('applies primary class', () => {
  expect(button).toHaveClass('primary');
});
```

### Mocking

**Mock API Calls**:
```typescript
import { vi } from 'vitest';

vi.mock('@/lib/api', () => ({
  fetchQuotes: vi.fn(() => Promise.resolve([mockQuote]))
}));
```

**Mock Router**:
```typescript
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));
```

---

## CI/CD Integration

### GitHub Actions Workflow

Tests run automatically on:
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

**Workflow Steps**:
1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Run linter
5. Run type check
6. Run unit tests with coverage
7. Run E2E tests
8. Upload artifacts (coverage, test reports)
9. Deploy preview (PRs)

### Required Secrets

Add these to GitHub repository settings:

```
CODECOV_TOKEN       # For coverage reporting
SNYK_TOKEN          # For security scanning
VERCEL_TOKEN        # For deployments
VERCEL_ORG_ID       # Vercel organization ID
VERCEL_PROJECT_ID   # Vercel project ID
```

---

## Troubleshooting

### Common Issues

**Issue**: Playwright browsers not installed
```bash
# Solution
npx playwright install --with-deps
```

**Issue**: Tests timeout
```typescript
// Increase timeout in playwright.config.ts
timeout: 60 * 1000, // 60 seconds
```

**Issue**: Flaky E2E tests
```typescript
// Add proper waits
await page.waitForSelector('[data-testid="content"]');
await page.waitForLoadState('networkidle');
```

**Issue**: Coverage not updating
```bash
# Clear coverage cache
rm -rf coverage/
npm run test:coverage
```

### Debug Mode

**Unit Tests**:
```bash
# Run in debug mode
npm run test:watch -- --inspect-brk

# Run specific test file
npm run test -- Button.test.tsx
```

**E2E Tests**:
```bash
# Run in headed mode (see browser)
npm run test:e2e -- --headed

# Run in debug mode
npm run test:e2e -- --debug

# Run specific test file
npm run test:e2e -- auth.spec.ts
```

---

## Coverage Reports

### View Coverage

```bash
npm run test:coverage
```

Coverage report generated in `coverage/` directory.

**Open HTML Report**:
```bash
open coverage/index.html
```

### Coverage Thresholds

Configured in `vitest.config.ts`:

```typescript
coverage: {
  branches: 70,
  functions: 70,
  lines: 70,
  statements: 70
}
```

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## Need Help?

- Check existing tests in `src/**/__tests__/` and `e2e/` for examples
- Review `TESTING_STATUS.md` for current test coverage
- Ask in team chat or open a GitHub discussion
