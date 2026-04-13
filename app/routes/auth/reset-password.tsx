import type { Route } from './+types/reset-password';
import { data, redirect } from 'react-router';
import { validatePasswordResetToken, updateUserPassword } from '~/db/auth';

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  
  if (!token) {
    return redirect('/auth/forgot-password');
  }

  return { token };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const token = formData.get('token') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!token) {
    return redirect('/auth/forgot-password');
  }

  if (!password || !confirmPassword) {
    return data({ error: 'Both password fields are required' }, { status: 400 });
  }

  if (password !== confirmPassword) {
    return data({ error: 'Passwords do not match' }, { status: 400 });
  }

  if (password.length < 8) {
    return data({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  // Validate the reset token
  const tokenData = await validatePasswordResetToken(token);
  if (!tokenData) {
    return data({ error: 'Invalid or expired reset token. Please request a new one.' }, { status: 400 });
  }

  // Update the user's password
  const success = await updateUserPassword(tokenData.userId, password);
  if (!success) {
    return data({ error: 'Failed to reset password. Please try again.' }, { status: 500 });
  }

  return redirect('/auth/login?resetSuccess=true');
}

export default function ResetPasswordPage({ loaderData }: Route.ComponentProps) {
  const { token } = loaderData;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Set new password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below.
          </p>
        </div>
        <form className="mt-8 space-y-6" method="post">
          <input type="hidden" name="token" value={token} />
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="New password (min. 8 characters)"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Reset password
            </button>
          </div>

          <div className="text-center">
            <a href="/auth/login" className="font-medium text-purple-600 hover:text-purple-500">
              Back to sign in
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
