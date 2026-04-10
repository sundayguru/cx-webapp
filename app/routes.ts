import {
  type RouteConfig,
  layout,
  prefix,
  route,
  index,
} from '@react-router/dev/routes';

export default [
  layout('./routes/layouts/ProtectedLayout.ts', [
    index('routes/dashboard.tsx'),
    route('api/user', 'routes/api/user.ts'),
  ]),
] satisfies RouteConfig;
