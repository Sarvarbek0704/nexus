'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Mail, CheckCircle } from 'lucide-react';
import { useForgotPasswordMutation } from '@/store/api/authApi';
import { useT } from '@/lib/i18n';

const schema = z.object({
  email: z.string().email('Invalid email address'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const t = useT();
  const [sent, setSent] = useState(false);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const { register, handleSubmit, formState: { errors }, getValues } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await forgotPassword(data as { email: string }).unwrap();
      setSent(true);
    } catch {
      toast.error(t.common.error);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-nexus-100 dark:bg-nexus-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-nexus-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t.authExtended.forgotPassword.checkInbox}</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {t.authExtended.forgotPassword.checkInboxDesc.replace('{email}', getValues('email'))}
          </p>
          <p className="text-sm text-gray-400 mb-6">
            {t.authExtended.forgotPassword.checkSpam}
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-nexus-600 hover:text-nexus-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.forgotPassword.backToLogin}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-nexus-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">N</span>
            </div>
            <span className="font-bold text-2xl">Nexus</span>
          </Link>
          <div className="w-16 h-16 bg-nexus-100 dark:bg-nexus-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-nexus-600 dark:text-nexus-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.forgotPassword.title}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            {t.forgotPassword.subtitle}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t.forgotPassword.emailLabel}
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="john@example.com"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-nexus-500 focus:border-transparent bg-white dark:bg-gray-800 dark:text-white transition-shadow"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-nexus-600 hover:bg-nexus-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                t.forgotPassword.sendLink
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t.forgotPassword.backToLogin}
          </Link>
        </div>
      </div>
    </div>
  );
}
