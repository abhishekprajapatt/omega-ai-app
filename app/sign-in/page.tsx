'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useFirebaseAuth } from '@/context/FirebaseAuthContext';
import AuthPage from '@/components/AuthPage';

export default function SignInPage() {
  const { isAuthenticated, loading } = useFirebaseAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#09090b]">
      <AuthPage initialMode="login" />
    </div>
  );
}
