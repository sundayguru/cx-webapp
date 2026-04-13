import type { Route } from './+types/forgot-password';
import { data } from 'react-router';
import { getUserByEmail, generatePasswordResetTokenForEmail } from '~/db/auth';

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get('email') as string;

  if (!email) {
    return data({ error: 'Email is required' }, { status: 400 });
  }

  // Check if user exists (always return success to prevent email enumeration)
  const user = await getUserByEmail(email);
  
  if (user) {
    // Generate reset token
    const resetToken = await generatePasswordResetTokenForEmail(email);
    
    if (resetToken) {
      // In production, send email with reset link
      // For now, we'll log it (you should implement email sending)
      const resetUrl = `${new URL(request.url).origin}/auth/reset-password?token=${resetToken.token}`;
      console.log(`Password reset URL for ${email}: ${resetUrl}`);
      
      // TODO: Send email with resetUrl
      // await sendEmail({
      //   to: email,
      //   subject: 'Reset your password',
      //   text: `Click here to reset your password: ${resetUrl}`,
      // });
    }
  }

  // Always return success to prevent email enumeration
  return data({ 
    success: true, 
    message: 'If an account exists with that email, we\'ve sent password reset instructions.' 
  });
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we'll send you instructions to reset your password.
          </p>
        </div>
        <form className="mt-8 space-y-6" method="post">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Send reset instructions
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
