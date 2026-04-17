import {
  type RouteConfig,
  layout,
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
    route('courses/:id/edit', 'routes/courses/$id.edit.tsx'),
    route('courses/:id/units/:unitId', 'routes/courses/$id.units.$unitId.tsx'),
    route('create', 'routes/create.tsx'),
    route('auth/logout', 'routes/auth/logout.tsx'),
    route('api/user', 'routes/api/user.ts'),
    route('api/schools', 'routes/api/schools.ts'),
    route('api/authors', 'routes/api/authors.ts'),
    route('api/course/serve/*', 'routes/api/course/serve.$.tsx'),
    route(
      'api/courses/:id/generate-curriculum',
      'routes/api/courses/generate-curriculum.tsx',
    ),
    route(
      'api/courses/:id/generate-units',
      'routes/api/courses/generate-units.tsx',
    ),
    route(
      'api/courses/:id/extract-raw-text',
      'routes/api/courses/extract-raw-text.tsx',
    ),
    route(
      'api/courses/:id/update-raw-text',
      'routes/api/courses/update-raw-text.tsx',
    ),
    route(
      'api/courses/:id/split-raw-text-into-modules',
      'routes/api/courses/split-raw-text-into-modules.tsx',
    ),
    route(
      'api/courses/:id/split-module-raw-text-into-units',
      'routes/api/courses/split-module-raw-text-into-units.tsx',
    ),
    route(
      'api/courses/:id/update-module-raw-text',
      'routes/api/courses/update-module-raw-text.tsx',
    ),
    route(
      'api/courses/:id/units/:unitId/generate-content',
      'routes/api/courses/$id.units.$unitId.generate-content.tsx',
    ),
    route(
      'api/courses/:id/units/:unitId/generate-audio-script',
      'routes/api/courses/$id.units.$unitId.generate-audio-script.tsx',
    ),
    route(
      'api/courses/:id/units/:unitId/upload-media',
      'routes/api/courses/$id.units.$unitId.upload-media.tsx',
    ),
    route(
      'api/courses/:id/units/:unitId/set-complete',
      'routes/api/courses/$id.units.$unitId.set-complete.tsx',
    ),
    route(
      'api/courses/:id/units/:unitId/generate-quiz',
      'routes/api/courses/$id.units.$unitId.generate-quiz.tsx',
    ),
    route(
      'api/courses/:id/units/:unitId/start-quiz-session',
      'routes/api/courses/$id.units.$unitId.start-quiz-session.tsx',
    ),
    route(
      'api/courses/:id/units/:unitId/save-quiz-session',
      'routes/api/courses/$id.units.$unitId.save-quiz-session.tsx',
    ),
    route(
      'api/courses/:id/units/:unitId/clear-quizzes',
      'routes/api/courses/$id.units.$unitId.clear-quizzes.tsx',
    ),
  ]),
] satisfies RouteConfig;
