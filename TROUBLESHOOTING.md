# Troubleshooting Guide - Drawn to Run

## Overview
This guide provides solutions to common problems encountered during development, deployment, and operation of the Drawn to Run application.

---

## Development Environment Issues

### TypeScript Build Errors

#### Problem: Generic Function Syntax Conflicts with JSX
**Error**: 
```
Parsing error: '>' expected after type parameter list
```

**Cause**: Generic function syntax `<T>` conflicts with JSX parsing in .tsx files

**Solution**:
```typescript
// ❌ Problematic
const mockApiResponse = <T>(data: T) => ({ ... });

// ✅ Fixed - use trailing comma
const mockApiResponse = <T,>(data: T) => ({ ... });
```

**Prevention**: Always use trailing comma syntax for generic functions in TSX files

---

#### Problem: Module Resolution Errors
**Error**:
```
Cannot find module '@/components/...' or its corresponding type declarations
```

**Cause**: TypeScript path mapping not configured correctly

**Solution**:
1. Check `tsconfig.json` baseUrl and paths configuration
2. Ensure Vite alias configuration matches TypeScript paths
3. Restart TypeScript language server

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

---

### Jest/Testing Configuration Issues

#### Problem: ES Modules Import Errors
**Error**:
```
SyntaxError: Cannot use import statement outside a module
```

**Cause**: Jest not configured properly for ES modules with TypeScript

**Solution**:
```javascript
// jest.config.js
export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      tsconfig: './tsconfig.test.json'
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

**Key Points**:
- Use `ts-jest/presets/default-esm` for ES modules
- Configure `extensionsToTreatAsEsm` for .ts/.tsx files
- Set `useESM: true` in ts-jest options

---

#### Problem: TextEncoder/TextDecoder Not Defined
**Error**:
```
ReferenceError: TextEncoder is not defined
```

**Cause**: Node.js test environment missing browser APIs

**Solution**:
```typescript
// setupTests.ts
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}
```

**Alternative**: Use jsdom environment which includes these APIs

---

#### Problem: Mock Function Declaration Order
**Error**:
```
Cannot access 'mockSql' before initialization
```

**Cause**: Jest mock hoisting conflicts with variable declarations

**Solution**:
```typescript
// ✅ Correct order - declare mock first
const mockSql = jest.fn();

// Then mock the module
jest.mock('@netlify/neon', () => ({
  neon: jest.fn(() => mockSql),
}));
```

**Key Point**: Mock functions must be declared before jest.mock() calls

---

#### Problem: API Test Format Incompatibility
**Error**: Tests fail because they expect Lambda event format but functions use Netlify Request/Response

**Cause**: Mismatch between test expectations and actual implementation

**Solution**: 
1. Remove incompatible API integration tests
2. Focus on controller unit tests and component tests
3. Test API functionality through deployment and manual testing

```typescript
// ✅ Test the controller, not the API endpoint
describe('FollowController', () => {
  it('should follow user successfully', async () => {
    const result = await followController.followUser(1, 2);
    expect(result).toBeDefined();
  });
});
```

---

#### Problem: Mock Function Type Errors
**Error**:
```
Property 'mockImplementation' does not exist on type
```

**Cause**: Jest types not properly imported or configured

**Solution**:
```typescript
// setupTests.ts
import '@testing-library/jest-dom';

// For mocking modules
jest.mock('./module-to-mock');

// For manual mocks
const mockFunction = jest.fn() as jest.MockedFunction<typeof originalFunction>;
```

---

### Database Connection Issues

#### Problem: Neon Connection Timeouts
**Error**:
```
Connection timeout expired
```

**Cause**: Database connection not properly configured or network issues

**Solution**:
1. Verify DATABASE_URL environment variable
2. Check Neon database status
3. Implement connection retry logic

```typescript
// lib/database.ts
const connectWithRetry = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await neon(process.env.DATABASE_URL!);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

---

#### Problem: Database Query Errors
**Error**:
```
relation "table_name" does not exist
```

**Cause**: Database schema not properly initialized

**Solution**:
1. Run schema initialization: `npm run db:setup`
2. Check if migrations are applied
3. Verify table names match schema

---

## API and Netlify Functions Issues

### Netlify Functions Deployment

#### Problem: Functions Returning 404
**Error**: API endpoints return 404 instead of function response

**Cause**: Netlify function routing configuration issues

**Solution**:
1. Verify `netlify.toml` redirects configuration
2. Ensure function files are in correct directory structure
3. Check function file naming matches redirects

```toml
# netlify.toml
[[redirects]]
  from = "/api/auth/login"
  to = "/.netlify/functions/auth-login"
  status = 200
```

**File Structure**:
```
netlify/functions/
├── auth-login.ts        # ✅ Correct flat structure
├── auth-register.ts
└── events/
    └── index.ts         # ❌ Avoid nested structure
```

---

#### Problem: Function Cold Start Timeouts
**Error**: Functions timeout on first request after period of inactivity

**Cause**: Serverless cold start latency

**Solution**:
1. Optimize function initialization
2. Use connection pooling for database
3. Implement function warming for critical endpoints

```typescript
// Optimize imports - only import what's needed
import { neon } from '@netlify/neon';

// Connection pooling
let connection: any = null;
const getConnection = () => {
  if (!connection) {
    connection = neon(process.env.DATABASE_URL!);
  }
  return connection;
};
```

---

### Authentication Issues

#### Problem: "Authentication required" with Valid Login
**Error**: 
```
{"success":false,"error":{"message":"Authentication required","code":"UNAUTHORIZED"}}
```

**Symptoms**: 
- User can log in successfully but API calls fail with authentication errors
- Network requests show `Authorization: Bearer null` in headers
- localStorage contains authentication data but components can't access it

**Root Cause**: Components using incorrect localStorage key for JWT token retrieval

**Diagnostic Steps**:
1. **Check localStorage contents**:
   ```javascript
   console.log('localStorage keys:', Object.keys(localStorage));
   console.log('All localStorage:', { ...localStorage });
   ```

2. **Inspect network requests**:
   - Open DevTools → Network tab
   - Check Authorization header in failed API requests
   - Look for "Bearer null" or "Bearer undefined"

3. **Verify token storage key**:
   - Login system stores JWT under `'auth_token'` key
   - Check if component uses different key like `'token'`

**Solution**:
```typescript
// ❌ Incorrect - causes authentication failures
const token = localStorage.getItem('token');

// ✅ Correct - use standardized key
const token = localStorage.getItem('auth_token');

// ✅ With error handling
const token = localStorage.getItem('auth_token');
if (!token) {
  // Redirect to login or show error
  window.location.href = '/login';
  return;
}
```

**Prevention**:
- Use consistent localStorage keys across all components
- Consider creating centralized token utilities:
```typescript
// utils/auth.ts
export const getAuthToken = () => localStorage.getItem('auth_token');
export const setAuthToken = (token: string) => localStorage.setItem('auth_token', token);
export const removeAuthToken = () => localStorage.removeItem('auth_token');
```

**Common Variations**:
- `localStorage.getItem('token')` → should be `'auth_token'`
- `localStorage.getItem('jwt')` → should be `'auth_token'` 
- `localStorage.getItem('accessToken')` → should be `'auth_token'`

---

#### Problem: "can't access property 'length', d is undefined" JavaScript Error
**Error**: 
```
Uncaught TypeError: can't access property "length", d is undefined
```

**Symptoms**:
- API returns 200 status and successful data
- JavaScript crashes when rendering the data
- Console shows undefined property access errors
- Components fail to display despite receiving data

**Root Cause**: API response structure mismatch between backend and frontend expectations

**Common Scenarios**:
1. **Wrapped API Responses**: Backend returns `{success: true, data: {...}}` but frontend expects unwrapped data
2. **Null Array Properties**: Database fields return null instead of empty arrays  
3. **Missing Optional Chaining**: Accessing nested properties without safety checks

**Diagnostic Steps**:
1. **Check actual API response structure**:
   ```javascript
   // Add to query function temporarily
   const result = await response.json();
   console.log('API Response Structure:', result);
   ```

2. **Inspect expected vs actual data format**:
   - Network tab: Check actual JSON response
   - Console logs: Compare with frontend expectations
   - Look for wrapper objects like `{success, data}` or `{result, error}`

3. **Identify array access patterns**:
   - Search code for `.length`, `.map()`, `.filter()` operations
   - Look for destructuring assignments expecting arrays
   - Check for optional chaining usage

**Solution Patterns**:

1. **Unwrap API Responses**:
```typescript
// ❌ Problematic - assumes unwrapped data
return response.json();

// ✅ Fixed - handle wrapped responses  
const result = await response.json();
if (!result.success) {
  throw new Error(result.error || 'API error');
}
return result.data; // Unwrap the data
```

2. **Add Defensive Programming**:
```typescript
// ❌ Dangerous - can crash on null/undefined
{items.length > 0 && <ItemsList items={items} />}

// ✅ Safe - handles null/undefined gracefully
{items?.length > 0 && <ItemsList items={items} />}
```

3. **Provide Array Fallbacks**:
```typescript
// ❌ Risky - mapping over potentially undefined array  
const processedItems = data.items.map(item => transform(item));

// ✅ Safe - ensures array before operations
const processedItems = (data.items || []).map(item => transform(item));
```

**Prevention**:
- Always examine actual API response structure during development
- Use optional chaining (`?.`) for nested property access
- Provide fallback values for array operations: `array || []`
- Add response validation in query functions
- Consider using TypeScript for compile-time type safety

**API Response Wrapper Pattern**:
Many APIs return data in wrapper format. Establish consistent unwrapping:
```typescript
// Standard unwrapping utility
const unwrapApiResponse = (response: any) => {
  if (!response.success) {
    throw new Error(response.error || 'API error');
  }
  return response.data;
};
```

---

#### Problem: JWT Token Expired Errors
**Error**: 
```
Token has expired
```

**Cause**: JWT tokens expire after 24 hours without refresh

**Solution**:
1. Implement automatic token refresh
2. Check token expiration before API calls
3. Redirect to login if refresh fails

```typescript
// authStore.ts
const checkTokenExpiry = () => {
  const token = getToken();
  if (token && isTokenExpired(token)) {
    return refreshToken();
  }
  return Promise.resolve();
};
```

---

#### Problem: CORS Errors on Authentication
**Error**:
```
Access-Control-Allow-Origin header missing
```

**Cause**: CORS not properly configured for authentication endpoints

**Solution**:
```typescript
// _shared/response.ts
export const createResponse = (statusCode: number, body: any) => ({
  statusCode,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  },
  body: JSON.stringify(body),
});
```

---

## Frontend Component Issues

### React Query Issues

#### Problem: Stale Data Display
**Issue**: Components show old data after mutations

**Cause**: React Query cache not properly invalidated

**Solution**:
```typescript
// After successful mutation
const mutation = useMutation({
  mutationFn: updateEvent,
  onSuccess: () => {
    // Invalidate related queries
    queryClient.invalidateQueries({ queryKey: ['events'] });
    queryClient.invalidateQueries({ queryKey: ['event', eventId] });
  },
});
```

---

#### Problem: Loading States Not Working
**Issue**: Loading spinners not showing during data fetching

**Cause**: Incorrect loading state handling

**Solution**:
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['events'],
  queryFn: fetchEvents,
});

// ✅ Correct loading handling
if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
```

---

### Form Validation Issues

#### Problem: Form Validation Not Triggering
**Issue**: React Hook Form validation not working

**Cause**: Validation schema not properly configured

**Solution**:
```typescript
// ✅ Correct validation setup
const form = useForm<FormData>({
  resolver: zodResolver(validationSchema),
  mode: 'onChange', // Enable real-time validation
});

// ✅ Proper field registration
<input {...form.register('email')} />
{form.formState.errors.email && (
  <span>{form.formState.errors.email.message}</span>
)}
```

---

### Routing Issues

#### Problem: Protected Routes Not Working
**Issue**: Users can access protected pages without authentication

**Cause**: ProtectedRoute component not properly implemented

**Solution**:
```typescript
// components/auth/ProtectedRoute.tsx
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <LoadingSpinner />;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};
```

---

## Build and Deployment Issues

### Vite Build Errors

#### Problem: Build Fails with Type Errors
**Error**: Type errors during production build

**Cause**: TypeScript strict mode or missing type definitions

**Solution**:
1. Fix all TypeScript errors in development
2. Ensure all dependencies have type definitions
3. Check `tsconfig.json` configuration

```bash
# Check types before building
npm run type-check

# Build with type checking
npm run build
```

---

#### Problem: Build Size Too Large
**Issue**: Bundle size exceeds recommended limits

**Cause**: Large dependencies or missing code splitting

**Solution**:
1. Analyze bundle with `npm run build:analyze`
2. Implement dynamic imports for large components
3. Remove unused dependencies

```typescript
// ✅ Dynamic import for large components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// ✅ Wrap with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <HeavyComponent />
</Suspense>
```

---

### Netlify Deployment Issues

#### Problem: Environment Variables Not Available
**Issue**: Environment variables undefined in production

**Cause**: Variables not configured in Netlify dashboard

**Solution**:
1. Add variables in Netlify site settings → Environment variables
2. Ensure variable names match exactly
3. Redeploy after adding variables

---

#### Problem: Functions Not Deploying
**Issue**: Netlify functions not available after deployment

**Cause**: Function directory configuration or build issues

**Solution**:
1. Verify `netlify.toml` functions directory
2. Check function syntax and imports
3. Review deploy logs for errors

```toml
# netlify.toml
[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"
```

---

## Performance Issues

### Slow Page Load Times

#### Problem: Initial Page Load Slow
**Cause**: Large bundle size or blocking resources

**Solution**:
1. Implement route-based code splitting
2. Optimize images and assets
3. Use lazy loading for non-critical components

```typescript
// Route-based code splitting
const EventsPage = lazy(() => import('./pages/EventsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
```

---

#### Problem: API Response Times Slow
**Cause**: Database queries not optimized

**Solution**:
1. Add database indexes for frequently queried columns
2. Implement query result caching
3. Use database query analysis tools

```sql
-- Add indexes for common queries
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_location ON events(location);
CREATE INDEX idx_event_tags_event_id ON event_tags(event_id);
```

---

## Common Error Patterns

### Error: Cannot read property 'X' of undefined
**Cause**: Accessing properties on null/undefined objects

**Solution**:
```typescript
// ✅ Use optional chaining
const eventDate = event?.event_date;

// ✅ Provide default values
const events = data?.events || [];

// ✅ Check before accessing
if (user && user.profile_image) {
  // Safe to use user.profile_image
}
```

---

### Error: React Hook called outside of component
**Cause**: Using hooks in non-React functions or conditionally

**Solution**:
```typescript
// ❌ Wrong - hook in non-React function
function utilityFunction() {
  const data = useQuery(...); // Error
}

// ✅ Correct - hook in React component
function MyComponent() {
  const data = useQuery(...);
  
  return <div>{data}</div>;
}
```

---

## Debugging Tips

### Enable Detailed Logging
```typescript
// Add to development environment
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', { data, error, state });
}
```

### React Developer Tools
1. Install React Developer Tools browser extension
2. Use Components tab to inspect component state
3. Use Profiler tab to identify performance issues

### Network Tab Debugging
1. Open browser DevTools → Network tab
2. Check API request/response details
3. Verify headers and status codes

### Database Query Debugging
```typescript
// Add query logging in development
const sql = neon(process.env.DATABASE_URL!, {
  debug: process.env.NODE_ENV === 'development',
});
```

---

## When to Seek Help

### Escalation Criteria
- Security-related issues
- Database corruption or data loss
- Performance degradation in production
- Authentication/authorization failures

### Information to Gather
1. Error messages and stack traces
2. Steps to reproduce the issue
3. Environment details (development/production)
4. Recent changes or deployments
5. Browser/device information (for frontend issues)

### Quick Diagnostic Checklist
- [ ] Check error logs and console output
- [ ] Verify environment variables are set
- [ ] Confirm database connectivity
- [ ] Test in different browser/environment
- [ ] Review recent code changes
- [ ] Check third-party service status

---

*This troubleshooting guide should be updated as new issues are discovered and resolved. Keep solutions generalized and reusable for future reference.*