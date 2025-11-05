# White-Label Branding - Test Guide

## Running Tests

### Run all tests
```bash
npm run test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with UI
```bash
npm run test:ui
```

### Run specific test file
```bash
npm run test src/hooks/__tests__/useDynamicFavicon.test.tsx
```

## Test Coverage

### 1. Dynamic Favicon Hook (`useDynamicFavicon.test.tsx`)
Tests the favicon customization feature:
- ✅ No favicon change for non-Max AI tier users
- ✅ Favicon changes for Max AI tier users with logo
- ✅ No change when logo URL is missing
- ✅ Restore original favicon on cleanup
- ✅ Create favicon link if missing

### 2. Settings Page (`Settings.whitelabel.test.tsx`)
Tests logo upload/delete and tier-based access:
- ✅ Show upgrade prompt for non-Max AI users
- ✅ Show logo upload for Max AI users
- ✅ Validate file size (max 2MB)
- ✅ Validate file type (images only)
- ✅ Successfully upload valid logo
- ✅ Show remove button when logo exists
- ✅ Successfully delete logo with confirmation

### 3. Public Quote View (`PublicQuoteView.whitelabel.test.tsx`)
Tests tier-based footer display:
- ✅ Show "Powered by Quote-it AI" footer for Pro tier
- ✅ NO footer for Max AI tier users
- ✅ Show footer for Free tier users
- ✅ Dynamic favicon integration
- ✅ Browser title customization

### 4. Auth Context (`AuthContext.tier.test.tsx`)
Tests tier-based access control:
- ✅ `isMaxAITier` returns true for 'max' tier
- ✅ `isMaxAITier` returns true for 'admin' tier
- ✅ `isMaxAITier` returns false for 'pro' tier
- ✅ `isMaxAITier` returns false for 'free' tier
- ✅ Logo upload allowed for Max AI tier
- ✅ Logo upload denied for Pro tier

## Test Structure

```
src/
├── hooks/
│   └── __tests__/
│       └── useDynamicFavicon.test.tsx
├── pages/
│   └── __tests__/
│       ├── Settings.whitelabel.test.tsx
│       └── PublicQuoteView.whitelabel.test.tsx
├── contexts/
│   └── __tests__/
│       └── AuthContext.tier.test.tsx
└── test/
    └── setup.ts (Global test configuration)
```

## Mocking Strategy

### Supabase Client
All Supabase operations are mocked in `src/test/setup.ts`:
- `supabase.auth` - Authentication methods
- `supabase.from()` - Database queries
- `supabase.storage` - File storage operations

### Auth Context
Tests mock the `useAuth` hook to simulate different user tiers:
```typescript
vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
  isMaxAITier: true,
  userRole: 'max',
} as any);
```

## Adding New Tests

1. Create test file in `__tests__` directory next to the component
2. Import test utilities:
```typescript
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
```

3. Mock dependencies as needed
4. Write descriptive test cases with arrange-act-assert pattern

## CI/CD Integration

Add to your CI pipeline:
```yaml
- name: Run tests
  run: npm run test -- --run
```

## Troubleshooting

### Tests fail with Supabase errors
- Ensure mocks are properly set up in `src/test/setup.ts`
- Check that `vi.clearAllMocks()` is called in `beforeEach`

### TypeScript errors in tests
- Verify test file is in `__tests__` directory
- Check that vitest types are properly loaded
- Ensure `vitest.config.ts` includes test directory

### DOM-related errors
- Confirm `jsdom` environment is set in `vitest.config.ts`
- Check that `@testing-library/jest-dom` is imported in setup

## Future Test Additions

Consider adding tests for:
- PWA manifest generation edge function
- Logo URL validation and accessibility checks
- Error handling for storage failures
- Browser compatibility for favicon changes
- Performance testing for large logo files
