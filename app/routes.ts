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
  ]),
  // OAuth callback route
  route('api/auth/google', 'routes/api/auth/google.tsx'),

  // Protected routes
  layout('./routes/layouts/ProtectedLayout.tsx', [
    route('dashboard', 'routes/dashboard.tsx'),
    route('courses', 'routes/courses.tsx'),
    route('courses/:id', 'routes/courses/$id.tsx'),
    route('create', 'routes/create.tsx'),
    route('auth/logout', 'routes/auth/logout.tsx'),
    route('api/user', 'routes/api/user.ts'),
    route('api/course/serve/*', 'routes/api/course/serve.$.tsx'),
  ]),
] satisfies RouteConfig;
