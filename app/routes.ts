import {
  type RouteConfig,
  layout,
  prefix,
  route,
  index,
} from '@react-router/dev/routes';

export default [
  // Public auth routes
  layout('./routes/layouts/PublicLayout.ts', [
  index('routes/home.tsx'),
  route('auth/login', 'routes/auth/login.tsx'),
  route('auth/register', 'routes/auth/register.tsx'),
  route('auth/forgot-password', 'routes/auth/forgot-password.tsx'),
  route('auth/reset-password', 'routes/auth/reset-password.tsx'),
  route('auth/logout', 'routes/auth/logout.tsx'),
  ]),
  // OAuth callback route
  route('api/auth/google', 'routes/api/auth/google.tsx'),
  
  // Protected routes
  layout('./routes/layouts/ProtectedLayout.ts', [
    route('dashboard', 'routes/dashboard.tsx'),
    route('api/user', 'routes/api/user.ts'),
  ]),
] satisfies RouteConfig;
