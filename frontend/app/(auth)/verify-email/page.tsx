'use client';

import { useRef, useState, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useVerifyOtpMutation, useResendOtpMutation } from '@/store/api/authApi';
import { useAppDispatch } from '@/store';
import { setCredentials } from '@/store/slices/authSlice';
import { toast } from 'sonner';
import Cookies from 'js-cookie';
import { Mail, Loader2, RefreshCw, CheckCircle, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  const email = searchParams.get('email') || '';

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [cooldown, setCooldown] = useState(0);
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [verifyOtp, { isLoading: verifying }] = useVerifyOtpMutation();
  const [resendOtp, { isLoading: resending }] = useResendOtpMutation();

  // Start cooldown on mount (OTP just sent after register)
  useEffect(() => {
    if (!email) {
      router.replace('/register');
      return;
    }
    startCooldown();
    inputRefs.current[0]?.focus();
  }, []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN);
  };

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleDigitChange = (index: number, value: string) => {
    // Allow only digits
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    // Auto-focus next input
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (digit && index === OTP_LENGTH - 1) {
      const allFilled = newDigits.every((d) => d !== '');
      if (allFilled) {
        handleSubmit(newDigits.join(''));
      }
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        // Clear current digit
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
      } else if (index > 0) {
        // Move to previous input
        inputRefs.current[index - 1]?.focus();
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter') {
      const otp = digits.join('');
      if (otp.length === OTP_LENGTH) handleSubmit(otp);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;

    const newDigits = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((char, i) => { newDigits[i] = char; });
    setDigits(newDigits);

    // Focus last filled or next empty
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();

    if (pasted.length === OTP_LENGTH) {
      handleSubmit(pasted);
    }
  };

  const handleSubmit = async (otp?: string) => {
    const code = otp ?? digits.join('');
    if (code.length !== OTP_LENGTH) {
      toast.error('Please enter all 6 digits');
      return;
    }

    try {
      const result = await verifyOtp({ email, otp: code }).unwrap();
      const { user, accessToken, refreshToken } = result.data;

      Cookies.set('accessToken', accessToken, { expires: 7 });
      Cookies.set('refreshToken', refreshToken, { expires: 30 });
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      dispatch(setCredentials({ user, accessToken }));

      setVerified(true);
      toast.success('Email verified! Welcome to Nexus 🎉');

      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err: any) {
      const message = err?.data?.message ?? 'Invalid verification code';
      toast.error(message);
      // Clear digits on wrong code
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    try {
      await resendOtp({ email }).unwrap();
      toast.success('A new code has been sent to your email');
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      startCooldown();
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Failed to resend code');
    }
  };

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Email Verified!</h2>
          <p className="text-gray-500 dark:text-gray-400">Redirecting to your dashboard...</p>
          <Loader2 className="w-5 h-5 animate-spin text-nexus-500 mx-auto mt-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-nexus-100 dark:bg-nexus-900/50 rounded-2xl flex items-center justify-center">
              <Mail className="w-8 h-8 text-nexus-600 dark:text-nexus-400" />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Check your email
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
              We sent a 6-digit verification code to
            </p>
            <p className="font-semibold text-gray-800 dark:text-gray-200 mt-1 text-sm">{email}</p>
          </div>

          {/* OTP Inputs */}
          <div className="flex gap-3 justify-center mb-6">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                onFocus={(e) => e.target.select()}
                className={cn(
                  'w-12 h-14 text-center text-xl font-bold border-2 rounded-xl transition-all focus:outline-none',
                  'bg-white dark:bg-gray-800',
                  digit
                    ? 'border-nexus-500 bg-nexus-50 dark:bg-nexus-950/30 text-nexus-700 dark:text-nexus-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white',
                  'focus:border-nexus-500 focus:ring-2 focus:ring-nexus-500/20'
                )}
              />
            ))}
          </div>

          {/* Verify Button */}
          <button
            onClick={() => handleSubmit()}
            disabled={verifying || digits.some((d) => !d)}
            className="w-full py-3 bg-nexus-600 hover:bg-nexus-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {verifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Email'
            )}
          </button>

          {/* Resend */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Didn't receive the code?
            </p>
            <button
              onClick={handleResend}
              disabled={cooldown > 0 || resending}
              className={cn(
                'inline-flex items-center gap-1.5 text-sm font-medium transition-colors',
                cooldown > 0 || resending
                  ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  : 'text-nexus-600 dark:text-nexus-400 hover:text-nexus-700 dark:hover:text-nexus-300'
              )}
            >
              {resending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </div>

          {/* Divider */}
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to registration
            </Link>
          </div>
        </div>

        {/* Help text */}
        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-4">
          Check your spam folder if you don't see the email. The code expires in 10 minutes.
        </p>
      </div>
    </div>
  );
}
