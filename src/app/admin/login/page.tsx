'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AuthService } from '@/lib/auth';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  Building2, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle,
  KeyRound
} from 'lucide-react';
import { useLanguage, LanguageSwitcher } from '@/lib/i18n';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const { isHindi } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    try {
      setLoading(true);
      setError(null);
      const res = await AuthService.login(email, password);
      if (res.success && res.user) {
        if (redirectUrl) {
          router.push(redirectUrl);
        } else {
          router.push(`/admin/${res.user.restaurant_slug}/dashboard`);
        }
      } else {
        setError(res.error || 'Login failed.');
      }
    } catch {
      setError('An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await AuthService.login('owner@rusticgrill.com', 'demo123');
      if (res.success && res.user) {
        if (redirectUrl) {
          router.push(redirectUrl);
        } else {
          router.push(`/admin/${res.user.restaurant_slug}/dashboard`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center p-4 selection:bg-amber-500 selection:text-stone-950">
      <div className="max-w-md w-full space-y-6">
        <div className="flex justify-end">
          <LanguageSwitcher theme="dark" size="sm" />
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 mb-2 group">
            <div className="w-10 h-10 bg-amber-500 text-stone-950 rounded-2xl flex items-center justify-center font-black shadow-lg shadow-amber-500/20 group-hover:scale-105 transition">
              <Building2 className="w-6 h-6" />
            </div>
            <span className="text-xl font-black text-white">TableBite Portal</span>
          </Link>
          <h1 className="text-2xl font-black text-white">Restaurant Owner Login</h1>
          <p className="text-xs text-stone-400">
            Sign in to access your kitchen screen, manage your menu, and print your table QR codes.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="owner@your-restaurant.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] disabled:opacity-50 text-stone-950 font-black rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isHindi ? 'डैशबोर्ड में साइन इन करें' : 'Sign In to Dashboard'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-stone-800 w-full" />
            <span className="bg-stone-900 px-3 text-[11px] text-stone-500 font-bold uppercase">
              {isHindi ? 'या त्वरित डेमो' : 'Or Instant Demo'}
            </span>
            <div className="border-t border-stone-800 w-full" />
          </div>

          {/* 1-Click Demo Login */}
          <button
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full py-2.5 bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>{isHindi ? '1-क्लिक डेमो लॉगिन (The Rustic Grill)' : '1-Click Demo Login (The Rustic Grill)'}</span>
          </button>
        </div>

        {/* Footer Register Link */}
        <div className="text-center text-xs text-stone-400">
          <span>New restaurant? </span>
          <Link
            href="/admin/register"
            className="text-amber-400 font-bold hover:underline"
          >
            Register Your Restaurant &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-950 flex items-center justify-center text-stone-400">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
