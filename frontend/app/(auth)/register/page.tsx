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

const registerSchema = z.object({
  firstName: z.string().min(2, 'At least 2 characters').max(50),
  lastName: z.string().min(2, 'At least 2 characters').max(50),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must contain uppercase, lowercase, and number'),
  role: z.enum(['freelancer', 'client', 'agency_owner']),
  country: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const ROLES = [
  {
    id: 'freelancer',
    label: 'Freelancer',
    description: 'Find work and get paid',
    icon: Briefcase,
    color: 'nexus',
  },
  {
    id: 'client',
    label: 'Client',
    description: 'Hire top talent',
    icon: Users,
    color: 'emerald',
  },
  {
    id: 'agency_owner',
    label: 'Agency',
    description: 'Run a freelance agency',
    icon: Building2,
    color: 'violet',
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [register, { isLoading }] = useRegisterMutation();

  const { register: formRegister, handleSubmit, watch, setValue, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'freelancer' },
  });

  const selectedRole = watch('role');
  const password = watch('password') || '';

  const passwordChecks = [
    { label: '8+ characters', valid: password.length >= 8 },
    { label: 'Uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', valid: /[a-z]/.test(password) },
    { label: 'Number', valid: /\d/.test(password) },
  ];

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      const result = await register(values).unwrap();
      toast.success('Account created! Please verify your email.');
      router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-nexus-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">N</span>
            </div>
            <span className="font-bold text-2xl">Nexus</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create your account</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Already have an account?{' '}
            <Link href="/login" className="text-nexus-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-card p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              I want to...
            </label>
            <div className="grid grid-cols-3 gap-3">
              {ROLES.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setValue('role', role.id as any)}
                    className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-nexus-500 bg-nexus-50 dark:bg-nexus-950'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-nexus-500 rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                    <Icon className={`w-6 h-6 ${isSelected ? 'text-nexus-600' : 'text-gray-400'}`} />
                    <div className="text-center">
                      <div className={`text-sm font-semibold ${isSelected ? 'text-nexus-700' : 'text-gray-700 dark:text-gray-300'}`}>
                        {role.label}
                      </div>
                      <div className={`text-xs mt-0.5 ${isSelected ? 'text-nexus-500' : 'text-gray-400'}`}>
                        {role.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  First name
                </label>
                <input
                  {...formRegister('firstName')}
                  placeholder="John"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-nexus-500 focus:border-transparent bg-white dark:bg-gray-800 dark:text-white"
                />
                {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Last name
                </label>
                <input
                  {...formRegister('lastName')}
                  placeholder="Doe"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-nexus-500 focus:border-transparent bg-white dark:bg-gray-800 dark:text-white"
                />
                {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email address
              </label>
              <input
                {...formRegister('email')}
                type="email"
                placeholder="john@example.com"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-nexus-500 focus:border-transparent bg-white dark:bg-gray-800 dark:text-white"
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  {...formRegister('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
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
                        {check.valid && <Check className="w-2 h-2 text-white" />}
                      </div>
                      <span className={`text-xs ${check.valid ? 'text-green-600' : 'text-gray-400'}`}>
                        {check.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-nexus-600 hover:bg-nexus-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          By creating an account, you agree to our{' '}
          <Link href="/terms" className="underline">Terms of Service</Link> and{' '}
          <Link href="/privacy" className="underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
