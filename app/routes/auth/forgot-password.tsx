import type { Route } from './+types/forgot-password';
import { data, Form } from 'react-router';
import { getUserByEmail, generatePasswordResetTokenForEmail } from '~/db/auth';
import { motion } from 'motion/react';
import { GraduationCap, KeyRound } from 'lucide-react';

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

export default function ForgotPasswordPage({ actionData }: Route.ComponentProps) {
  const { success, message, error } = actionData || {};

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
            Reset your password
          </p>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl">
              <p className="text-sm">{message}</p>
            </div>
            <a
              href="/auth/login"
              className="w-full bg-[#5A5A40] text-white py-3 rounded-xl font-medium hover:bg-[#4a4a35] transition-colors flex items-center justify-center gap-2"
            >
              Back to Sign In
            </a>
          </div>
        ) : (
          <Form method="post" className="space-y-4">
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

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              className="w-full bg-[#5A5A40] text-white py-3 rounded-xl font-medium hover:bg-[#4a4a35] transition-colors flex items-center justify-center gap-2"
            >
              <KeyRound size={20} />
              Send Reset Link
            </button>

            <a
              href="/auth/login"
              className="w-full text-sm text-black/40 hover:text-black transition-colors text-center block"
            >
              Back to Sign In
            </a>
          </Form>
        )}
      </motion.div>
    </div>
  );
}
