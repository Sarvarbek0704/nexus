'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, ArrowRight, Loader2, Check, Briefcase, Users, Building2 } from 'lucide-react';
import { useRegisterMutation } from '@/store/api/authApi';
import { setUser } from '@/store/slices/authSlice';
import { setTokens } from '@/lib/api';
import { useAppDispatch } from '@/store';
import { useT } from '@/lib/i18n';
import { NexusMark } from '@/components/shared/AppLogo';

const registerSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  role: z.enum(['freelancer', 'client', 'agency_owner']),
  country: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [register, { isLoading }] = useRegisterMutation();
  const t = useT();

  const ROLES = [
    { id: 'freelancer', label: t.register.roles.freelancer, description: t.register.roles.freelancerDesc, icon: Briefcase },
    { id: 'client', label: t.register.roles.client, description: t.register.roles.clientDesc, icon: Users },
    { id: 'agency_owner', label: t.register.roles.agency, description: t.register.roles.agencyDesc, icon: Building2 },
  ];

  const { register: formRegister, handleSubmit, watch, setValue, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'freelancer' },
  });

  const selectedRole = watch('role');
  const password = watch('password') || '';

  const passwordChecks = [
    { label: t.register.passwordChecks.chars, valid: password.length >= 8 },
    { label: t.register.passwordChecks.uppercase, valid: /[A-Z]/.test(password) },
    { label: t.register.passwordChecks.lowercase, valid: /[a-z]/.test(password) },
    { label: t.register.passwordChecks.number, valid: /\d/.test(password) },
  ];

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      await register(values).unwrap();
      toast.success(t.register.createAccount + '!');
      router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6 sm:mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 sm:mb-6">
            <div className="w-10 h-10 bg-nexus-600 rounded-xl flex items-center justify-center">
              <NexusMark className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl">Nexus</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{t.register.title}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm sm:text-base">
            {t.register.alreadyHave}{' '}
            <Link href="/login" className="text-nexus-600 hover:underline font-medium">{t.register.signIn}</Link>
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-card p-5 sm:p-8 space-y-5 sm:space-y-6">
          {/* Role selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t.register.iWantTo}</label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {ROLES.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setValue('role', role.id as any)}
                    className={`relative flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-nexus-500 bg-nexus-50 dark:bg-nexus-950'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-4 h-4 bg-nexus-500 rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${isSelected ? 'text-nexus-600' : 'text-gray-400'}`} />
                    <div className="text-center">
                      <div className={`text-xs sm:text-sm font-semibold ${isSelected ? 'text-nexus-700' : 'text-gray-700 dark:text-gray-300'}`}>
                        {role.label}
                      </div>
                      <div className={`text-xs mt-0.5 hidden sm:block ${isSelected ? 'text-nexus-500' : 'text-gray-400'}`}>
                        {role.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.register.firstName}</label>
                <input
                  {...formRegister('firstName')}
                  placeholder="John"
                  className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-nexus-500 focus:border-transparent bg-white dark:bg-gray-800 dark:text-white text-sm"
                />
                {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.register.lastName}</label>
                <input
                  {...formRegister('lastName')}
                  placeholder="Doe"
                  className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-nexus-500 focus:border-transparent bg-white dark:bg-gray-800 dark:text-white text-sm"
                />
                {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.register.email}</label>
              <input
                {...formRegister('email')}
                type="email"
                placeholder="john@example.com"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-nexus-500 focus:border-transparent bg-white dark:bg-gray-800 dark:text-white text-sm"
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.register.password}</label>
              <div className="relative">
                <input
                  {...formRegister('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t.register.passwordHint}
                  className="w-full px-4 py-2.5 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-nexus-500 focus:border-transparent bg-white dark:bg-gray-800 dark:text-white text-sm"
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
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${check.valid ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
                        {check.valid && <Check className="w-2 h-2 text-white" />}
                      </div>
                      <span className={`text-xs ${check.valid ? 'text-green-600' : 'text-gray-400'}`}>{check.label}</span>
                    </div>
                  ))}
                </div>
              )}
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-nexus-600 hover:bg-nexus-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2 text-sm sm:text-base"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {t.register.createAccount}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5 sm:mt-6">
          {t.register.termsNote}{' '}
          <Link href="/terms" className="underline">{t.register.terms}</Link>{' '}
          {t.register.and}{' '}
          <Link href="/privacy" className="underline">{t.register.privacy}</Link>
        </p>
      </div>
    </div>
  );
}
