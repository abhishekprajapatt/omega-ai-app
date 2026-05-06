
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { assets } from '@/assets/assets';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  FacebookAuthProvider,
  updateProfile,
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';
import { FaApple, FaFacebook, FaMicrosoft } from 'react-icons/fa6';
import Link from 'next/link';

interface AuthPageProps {
  initialMode?: 'login' | 'signup';
}

export default function AuthPage({ initialMode = 'login' }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const router = useRouter();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        const result = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );

        if (name) {
          await updateProfile(result.user, {
            displayName: name,
          });
        }

        toast.success('Account created successfully!');
        router.push('/');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Logged in successfully!');
        router.push('/');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Authentication failed';
      toast.error(errorMessage);
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: any, providerName: string) => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      toast.success(`Signed in with ${providerName}!`);
      router.push('/');
    } catch (error: any) {
      const errorMessage =
        error.message || `Failed to sign in with ${providerName}`;
      toast.error(errorMessage);
      console.error('OAuth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const googleProvider = new GoogleAuthProvider();
  const microsoftProvider = new OAuthProvider('microsoft.com');
  const appleProvider = new OAuthProvider('apple.com');
  const facebookProvider = new FacebookAuthProvider();

  return (
    <div className="min-h-screen w-screen flex">
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 bg-slate-950/80">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Link href={'/'}>
              <Image
                src={assets.tranparant_logo}
                alt="OMG AI"
                width={60}
                height={60}
                className="rounded-lg select-none"
              />
            </Link>
          </div>

          <h1 className="text-3xl font-bold text-white text-center mb-2 select-none">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-gray-400 text-center mb-8 select-none">
            {showEmailForm
              ? mode === 'login'
                ? 'Sign in with your email'
                : 'Sign up with your email'
              : mode === 'login'
                ? 'Sign in to your account'
                : 'Join OMG AI today'}
          </p>

          {showEmailForm ? (
            <>
              <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      placeholder="Enter your name"
                      required={mode === 'signup'}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    placeholder="Enter your password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-primary hover:bg-primary/80 cursor-pointer disabled:opacity-50 text-white font-semibold rounded-full transition"
                >
                  {loading
                    ? 'Loading...'
                    : mode === 'login'
                      ? 'Sign In'
                      : 'Create Account'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowEmailForm(false)}
                  className="w-full py-3 text-gray-400 bg-black border rounded-full cursor-pointer hover:bg-gray-900 hover:text-white font-semibold transition"
                >
                  Back to other options
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="space-y-3 mb-6">
                <button
                  type="button"
                  onClick={() => setShowEmailForm(true)}
                  className="w-full py-3 bg-primary hover:bg-primary/80 cursor-pointer text-white font-semibold rounded-full transition"
                >
                  {mode === 'login' ? 'Sign in' : 'Sign up'} with Email
                </button>

                <div className="flex items-center">
                  <div className="flex-1 border-t border-gray-700"></div>
                  <span className="px-3 text-gray-500 text-sm">
                    Or continue with
                  </span>
                  <div className="flex-1 border-t border-gray-700"></div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOAuthSignIn(googleProvider, 'Google')}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-3 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-full cursor-pointer text-white font-semibold transition disabled:opacity-50"
                >
                  <FcGoogle size={20} />
                  {mode === 'login' ? 'Sign in' : 'Sign up'} with Google
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleOAuthSignIn(microsoftProvider, 'Microsoft')
                  }
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-3 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-full cursor-pointer text-white font-semibold transition disabled:opacity-50"
                >
                  <FaMicrosoft size={20} className="text-blue-500" />
                  {mode === 'login' ? 'Sign in' : 'Sign up'} with Microsoft
                </button>

                <button
                  type="button"
                  onClick={() => handleOAuthSignIn(appleProvider, 'Apple')}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-3 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-full cursor-pointer text-white font-semibold transition disabled:opacity-50"
                >
                  <FaApple size={20} />
                  {mode === 'login' ? 'Sign in' : 'Sign up'} with Apple
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleOAuthSignIn(facebookProvider, 'Facebook')
                  }
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-3 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-full cursor-pointer text-white font-semibold transition disabled:opacity-50"
                >
                  <FaFacebook size={20} className="text-blue-600" />
                  {mode === 'login' ? 'Sign in' : 'Sign up'} with Facebook
                </button>
              </div>
            </>
          )}

          <p className="text-center text-gray-400 select-none">
            {mode === 'login'
              ? "Don't have an account? "
              : 'Already have an account? '}
            <button
              type="button"
              onClick={() => {
                const newMode = mode === 'login' ? 'signup' : 'login';
                setMode(newMode);
                router.push(newMode === 'login' ? '/sign-in' : '/sign-up');
              }}
              className="text-blue-500 hover:text-blue-400 font-semibold cursor-pointer hover:underline"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>

      <div className="hidden md:flex md:w-1/2 bg-linear-to-br from-slate-950 via-slate-800 to-slate-200 items-center justify-center overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-white/50 glow-radial-ellipse"></div>
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-60 glow-radial-circle"></div>
        <Image
          src={assets.auth_logo_icon}
          alt="OMG Logo"
          width={600}
          height={600}
          className="relative z-10 select-none"
        />
      </div>
    </div>
  );
}