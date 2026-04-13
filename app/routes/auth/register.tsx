import type { Route } from './+types/register';
import { data, redirect, Form } from 'react-router';
import { getUserByEmail, createUserWithPassword } from '~/db/auth';
import { generateSessionToken } from '~/utils/auth.server';
import { motion } from 'motion/react';
import { UserPlus, GraduationCap } from 'lucide-react';

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const callbackUrl = url.searchParams.get('callbackUrl') || '/dashboard';
  return { callbackUrl };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const callbackUrl = formData.get('callbackUrl') as string || '/dashboard';

  // Validation
  if (!email || !password || !firstName || !lastName) {
    return data({ error: 'All fields are required' }, { status: 400 });
  }

  if (password !== confirmPassword) {
    return data({ error: 'Passwords do not match' }, { status: 400 });
  }

  if (password.length < 8) {
    return data({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  // Check if user already exists
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return data({ error: 'An account with this email already exists' }, { status: 400 });
  }

  // Create user
  const user = await createUserWithPassword(email, password, firstName, lastName);
  if (!user) {
    return data({ error: 'Failed to create account. Please try again.' }, { status: 500 });
  }

  // Generate session and log user in
  const sessionToken = await generateSessionToken(user.id, user.email);

  const headers = new Headers();
  headers.append(
    'Set-Cookie',
    `session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`
  );

  return redirect(callbackUrl, { headers });
}

export default function RegisterPage({ loaderData }: Route.ComponentProps) {
  const { callbackUrl } = loaderData;

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
            Begin your learning journey
          </p>
        </div>

        <Form method="post" className="space-y-4">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-black/70 mb-1">First Name</label>
              <input
                type="text"
                name="firstName"
                className="w-full px-4 py-3 rounded-xl border border-black/10 focus:ring-2 focus:ring-[#5A5A40] outline-none transition-all"
                placeholder="John"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black/70 mb-1">Last Name</label>
              <input
                type="text"
                name="lastName"
                className="w-full px-4 py-3 rounded-xl border border-black/10 focus:ring-2 focus:ring-[#5A5A40] outline-none transition-all"
                placeholder="Doe"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-black/70 mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              className="w-full px-4 py-3 rounded-xl border border-black/10 focus:ring-2 focus:ring-[#5A5A40] outline-none transition-all"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black/70 mb-1">Password</label>
            <input
              type="password"
              name="password"
              className="w-full px-4 py-3 rounded-xl border border-black/10 focus:ring-2 focus:ring-[#5A5A40] outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black/70 mb-1">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              className="w-full px-4 py-3 rounded-xl border border-black/10 focus:ring-2 focus:ring-[#5A5A40] outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#5A5A40] text-white py-3 rounded-xl font-medium hover:bg-[#4a4a35] transition-colors flex items-center justify-center gap-2"
          >
            <UserPlus size={20} />
            Create Account
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-black/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-black/40">Or continue with</span>
            </div>
          </div>

          <a
            href="/api/auth/google"
            className="w-full bg-white border border-black/10 text-[#1a1a1a] py-3 rounded-xl font-medium hover:bg-black/5 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </a>
        </Form>

        <div className="mt-6 text-center">
          <a
            href="/auth/login"
            className="text-[#5A5A40] font-medium hover:underline underline-offset-4"
          >
            Already have an account? Sign in
          </a>
        </div>
      </motion.div>
    </div>
  );
}
