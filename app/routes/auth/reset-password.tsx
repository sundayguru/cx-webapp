import type { Route } from './+types/reset-password';
import { data, redirect, Form } from 'react-router';
import { validatePasswordResetToken, updateUserPassword } from '~/db/auth';
import { motion } from 'motion/react';
import { GraduationCap, Lock } from 'lucide-react';

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

export default function ResetPasswordPage({ loaderData, actionData }: Route.ComponentProps) {
  const { token } = loaderData;
  const { error } = actionData || {};

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[32px] shadow-xl p-8 border border-black/5"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#5A5A40] rounded-2xl flex items-center justify-center mb-4">
            <GraduationCap className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-serif text-[#1a1a1a]">CourseX</h1>
          <p className="text-black/60 font-serif italic">
            Set your new password
          </p>
        </div>

        <Form method="post" className="space-y-4">
          <input type="hidden" name="token" value={token} />
          <div>
            <label className="block text-sm font-medium text-black/70 mb-1">New Password</label>
            <input
              type="password"
              name="password"
              className="w-full px-4 py-3 rounded-xl border border-black/10 focus:ring-2 focus:ring-[#5A5A40] outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black/70 mb-1">Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              className="w-full px-4 py-3 rounded-xl border border-black/10 focus:ring-2 focus:ring-[#5A5A40] outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-[#5A5A40] text-white py-3 rounded-xl font-medium hover:bg-[#4a4a35] transition-colors flex items-center justify-center gap-2"
          >
            <Lock size={20} />
            Reset Password
          </button>

          <a
            href="/auth/login"
            className="w-full text-sm text-black/40 hover:text-black transition-colors text-center block"
          >
            Back to Sign In
          </a>
        </Form>
      </motion.div>
    </div>
  );
}
