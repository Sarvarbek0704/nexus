'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, Loader2, CheckCircle } from 'lucide-react';
import { useResetPasswordMutation } from '@/store/api/authApi';
import { useT } from '@/lib/i18n';

const schema = z.object({
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must contain uppercase, lowercase, and number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const password = watch('password') || '';
  const passwordChecks = [
    { label: t.register.passwordChecks.chars, valid: password.length >= 8 },
    { label: t.register.passwordChecks.uppercase, valid: /[A-Z]/.test(password) },
    { label: t.register.passwordChecks.lowercase, valid: /[a-z]/.test(password) },
    { label: t.register.passwordChecks.number, valid: /\d/.test(password) },
  ];

  const onSubmit = async (data: FormData) => {
    if (!token) {
      toast.error(t.authExtended.resetPassword.invalidLinkDesc);
      return;
    }
    try {
      await resetPassword({ token, password: data.password }).unwrap();
      setDone(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      toast.error(err?.data?.message ?? t.common.error);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="text-center">
          <p className="text-gray-900 dark:text-white font-semibold mb-2">{t.authExtended.resetPassword.invalidLink}</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
            {t.authExtended.resetPassword.invalidLinkDesc}
          </p>
          <Link href="/forgot-password" className="text-nexus-600 hover:underline font-medium">
            {t.authExtended.resetPassword.requestNew}
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t.authExtended.resetPassword.successTitle}</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {t.authExtended.resetPassword.successDesc}
          </p>
          <Link href="/login" className="text-nexus-600 hover:underline font-medium">
            {t.authExtended.resetPassword.goToLogin}
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
            <Lock className="w-8 h-8 text-nexus-600 dark:text-nexus-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.authExtended.resetPassword.createNew}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            {t.authExtended.resetPassword.createNewDesc}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t.resetPassword.newPassword}
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder={t.register.passwordHint}
                  className="w-full px-4 py-2.5 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-nexus-500 focus:border-transparent bg-white dark:bg-gray-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {password && (
                <div className="mt-2 grid grid-cols-2 gap-1">
                  {passwordChecks.map((check) => (
                    <div key={check.label} className="flex items-center gap-1.5">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                        check.valid ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                      }`}>
                        {check.valid && <CheckCircle className="w-2 h-2 text-white" />}
                      </div>
                      <span className={`text-xs ${check.valid ? 'text-green-600' : 'text-gray-400'}`}>
                        {check.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t.authExtended.resetPassword.confirmLabel}
              </label>
              <div className="relative">
                <input
                  {...register('confirmPassword')}
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder={t.authExtended.resetPassword.confirmPlaceholder}
                  className="w-full px-4 py-2.5 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-nexus-500 focus:border-transparent bg-white dark:bg-gray-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
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
                t.resetPassword.reset
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          {t.authExtended.resetPassword.rememberPassword}{' '}
          <Link href="/login" className="text-nexus-600 hover:underline font-medium">
            {t.authExtended.resetPassword.signIn}
          </Link>
        </p>
      </div>
    </div>
  );
}
