'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Github, ArrowRight, Loader2, Globe, ChevronDown } from 'lucide-react';
import { useLoginMutation } from '@/store/api/authApi';
import { setUser } from '@/store/slices/authSlice';
import { setTokens } from '@/lib/api';
import { useAppDispatch } from '@/store';
import { useI18n, useT, LANGUAGE_LABELS, Language } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [login, { isLoading }] = useLoginMutation();
  const t = useT();
  const { lang, setLang } = useI18n();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const result = await login(values).unwrap();
      setTokens(result.data.accessToken, result.data.refreshToken);
      dispatch(setUser(result.data.user));
      toast.success(`${t.login.welcomeBack}, ${result.data.user.firstName}!`);
      router.push('/dashboard');
    } catch (err: any) {
      if (err?.data?.requiresVerification || err?.data?.error?.requiresVerification) {
        const email = err?.data?.email || err?.data?.error?.email || values.email;
        toast.info(t.verifyEmail.title);
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }
      toast.error(err?.data?.message || 'Login failed');
    }
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  return (
    <div className="fixed inset-0 flex overflow-hidden">
      {/* Left panel – hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-nexus-600 to-nexus-900 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
            <span className="text-nexus-600 font-bold text-xl">N</span>
          </div>
          <span className="text-white font-bold text-2xl">Nexus</span>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight">{t.login.tagline}</h1>
            <p className="text-nexus-200 mt-4 text-lg">{t.login.taglineSub}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: t.login.stat_freelancers, value: '50K+' },
              { label: t.login.stat_projects, value: '200K+' },
              { label: t.login.stat_agencies, value: '5K+' },
              { label: t.login.stat_countries, value: '150+' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-4">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-nexus-200 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-nexus-200 text-sm">{t.login.joinLine}</p>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 overflow-y-auto bg-white dark:bg-gray-950">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          {/* Mobile logo + lang */}
          <div className="flex items-center justify-between lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-nexus-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">N</span>
              </div>
              <span className="font-bold text-xl">Nexus</span>
            </Link>
            {/* Language switcher mobile */}
            <div className="relative">
              <button
                onClick={() => setLangOpen((o) => !o)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400"
              >
                <Globe className="w-4 h-4" />
                <span className="uppercase font-medium">{lang}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1 min-w-[140px] z-50">
                  {(Object.keys(LANGUAGE_LABELS) as Language[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => { setLang(l); setLangOpen(false); }}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2 text-sm',
                        lang === l ? 'bg-nexus-50 text-nexus-700 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      )}
                    >
                      <span>{LANGUAGE_LABELS[l].flag}</span>
                      <span>{LANGUAGE_LABELS[l].label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{t.login.welcomeBack}</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm sm:text-base">
              {t.login.noAccount}{' '}
              <Link href="/register" className="text-nexus-600 hover:underline font-medium">
                {t.login.signUpFree}
              </Link>
            </p>
          </div>

          {/* Social login */}
          <div className="grid grid-cols-2 gap-3">
            <a
              href={`${API_URL}/auth/google`}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </a>
            <a
              href={`${API_URL}/auth/github`}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              <Github className="w-5 h-5" />
              GitHub
            </a>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-gray-950 text-gray-500">{t.login.orContinue}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t.login.emailLabel}
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="john@example.com"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-nexus-500 focus:border-transparent bg-white dark:bg-gray-800 dark:text-white transition-shadow text-sm"
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t.login.passwordLabel}
                </label>
                <Link href="/forgot-password" className="text-xs sm:text-sm text-nexus-600 hover:underline">
                  {t.login.forgotPassword}
                </Link>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-nexus-500 focus:border-transparent bg-white dark:bg-gray-800 dark:text-white transition-shadow text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-nexus-600 hover:bg-nexus-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {t.login.signIn}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400">
            {t.login.termsNote}{' '}
            <Link href="/terms" className="underline">{t.login.terms}</Link>{' '}
            {t.login.and}{' '}
            <Link href="/privacy" className="underline">{t.login.privacy}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
