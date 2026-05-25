'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store';
import { setUser } from '@/store/slices/authSlice';
import { setTokens } from '@/lib/api';
import { useGetMeQuery } from '@/store/api/authApi';
import { Loader2 } from 'lucide-react';

function OAuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const accessToken = searchParams.get('accessToken');
  const refreshToken = searchParams.get('refreshToken');

  useEffect(() => {
    if (accessToken && refreshToken) {
      setTokens(accessToken, refreshToken);
    } else {
      router.push('/login?error=oauth_failed');
    }
  }, [accessToken, refreshToken]);

  const { data, isSuccess, isError } = useGetMeQuery(undefined, {
    skip: !accessToken,
  });

  useEffect(() => {
    if (isSuccess && data?.data) {
      dispatch(setUser(data.data));
      router.push('/dashboard');
    }
    if (isError) {
      router.push('/login?error=oauth_failed');
    }
  }, [isSuccess, isError, data]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-nexus-100 rounded-full flex items-center justify-center mx-auto">
          <Loader2 className="w-8 h-8 text-nexus-600 animate-spin" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Signing you in...</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Please wait while we complete authentication
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-nexus-600 animate-spin" />
      </div>
    }>
      <OAuthCallbackContent />
    </Suspense>
  );
}
