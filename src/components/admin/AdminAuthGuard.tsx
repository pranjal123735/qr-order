'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { AuthService, OwnerUser, DEMO_OWNER } from '@/lib/auth';
import { localSync } from '@/lib/store';
import { 
  Lock, 
  ShieldAlert, 
  ArrowRight, 
  Building2, 
  KeyRound, 
  LogOut, 
  UserCheck, 
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { LanguageSwitcher } from '@/lib/i18n';

interface AdminAuthGuardProps {
  slug: string;
  children: React.ReactNode;
}

export function AdminAuthGuard({ slug, children }: AdminAuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [owner, setOwner] = useState<OwnerUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [isDemoLoggingIn, setIsDemoLoggingIn] = useState(false);

  useEffect(() => {
    // 1. Initial check
    const current = AuthService.getCurrentOwner();
    setOwner(current);
    setChecking(false);

    // 2. Real-time auth changes across tabs
    const unsub = localSync.subscribe((event) => {
      if (event.type === 'AUTH_STATE_CHANGED') {
        setOwner(event.payload as OwnerUser | null);
      }
    });

    return () => unsub();
  }, []);

  const handleQuickDemoLogin = async () => {
    try {
      setIsDemoLoggingIn(true);
      const res = await AuthService.login('owner@rusticgrill.com', 'demo123');
      if (res.success && res.user) {
        setOwner(res.user);
      }
    } finally {
      setIsDemoLoggingIn(false);
    }
  };

  const handleLogout = () => {
    AuthService.logout();
    setOwner(null);
    router.push('/admin/login');
  };

  // While checking local storage
  if (checking) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center text-stone-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
          <p className="text-xs font-bold text-stone-500">Verifying manager credentials...</p>
        </div>
      </div>
    );
  }

  // 1. NOT LOGGED IN: Access Denied Screen
  if (!owner) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center p-4 select-none">
        <div className="max-w-md w-full space-y-6">
          
          {/* Back button */}
          <button
            onClick={() => router.push(`/r/${slug}?table=1`)}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Diner Menu</span>
          </button>

          {/* Locked Card */}
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-8 h-8 text-amber-400 stroke-[2.2]" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                Staff Authentication Required
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Restaurant Access Protected
              </h1>
              <p className="text-xs text-stone-400 leading-relaxed max-w-sm mx-auto">
                This portal is for restaurant owners and kitchen staff only. Diners scanning QR codes cannot access this page without signing in.
              </p>
            </div>

            <div className="pt-2 space-y-2.5">
              {/* Primary: Sign In Button */}
              <Link
                href={`/admin/login?redirect=${encodeURIComponent(pathname)}`}
                className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-stone-950 font-black rounded-2xl text-xs shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>Sign In with Restaurant Account</span>
              </Link>

              {/* Secondary: 1-Click Demo Login for Testing */}
              <button
                type="button"
                disabled={isDemoLoggingIn}
                onClick={handleQuickDemoLogin}
                className="w-full py-2.5 px-4 bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700/80 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{isDemoLoggingIn ? 'Logging in...' : '1-Click Demo Staff Sign In'}</span>
              </button>
            </div>

            <div className="pt-2 border-t border-stone-800/80 text-[11px] text-stone-500 flex items-center justify-center gap-1">
              <span>Restaurant Tenant:</span>
              <strong className="text-amber-400 uppercase font-mono">{slug}</strong>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. STRICT MULTI-TENANT ISOLATION CHECK
  // Restaurant Owner A CANNOT view or access Restaurant B under any circumstance
  const matchesSlug = owner.restaurant_slug === slug;

  if (!matchesSlug) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center p-4 select-none">
        <div className="max-w-md w-full bg-stone-900 border border-rose-900/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7 text-rose-400" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
              Access Denied • Tenant Quarantined
            </span>
            <h1 className="text-lg sm:text-xl font-black text-white">
              Restaurant Boundary Protection
            </h1>
            <p className="text-xs text-stone-400 leading-relaxed">
              You are signed in as <strong className="text-white">{owner.email}</strong> for restaurant <strong className="text-amber-400 uppercase">{owner.restaurant_slug}</strong>.
            </p>
            <p className="text-xs text-rose-300 font-semibold mt-1">
              For security, you cannot view, modify dishes, or access kitchen orders for another restaurant ({slug}).
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <Link
              href={`/admin/${owner.restaurant_slug}/dashboard`}
              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl text-xs transition flex items-center justify-center gap-2"
            >
              <span>Go to My Restaurant ({owner.restaurant_slug})</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={handleLogout}
              className="w-full py-2 px-4 bg-stone-800 hover:bg-stone-750 text-stone-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Switch Account / Sign In as {slug}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. AUTHENTICATED: Render protected admin page with a secure top banner
  return (
    <div className="min-h-screen flex flex-col bg-stone-950 overflow-x-hidden w-full">
      {/* Top Manager Security Bar */}
      <div className="bg-stone-950 border-b border-stone-850 px-3 sm:px-4 py-1.5 flex items-center justify-between text-[11px] text-stone-400 print:hidden z-50 gap-2 w-full">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="hidden sm:inline font-medium text-stone-500 shrink-0">Logged in:</span>
          <span className="font-bold text-stone-200 truncate max-w-[120px] xs:max-w-[180px] sm:max-w-none text-[11px] sm:text-xs">
            {owner.email}
          </span>
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-black bg-stone-850 text-amber-400 border border-stone-700 uppercase shrink-0">
            {slug} Staff
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <LanguageSwitcher theme="dark" size="sm" />
          <Link
            href={`/r/${slug}?table=1`}
            target="_blank"
            className="hidden md:inline-flex items-center gap-1 text-stone-400 hover:text-amber-400 transition"
          >
            <span>Preview Diner Menu</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-stone-300 hover:text-rose-400 transition font-bold px-2 py-1 rounded-lg bg-stone-900 border border-stone-800 hover:border-rose-900/40 text-[11px]"
            title="Sign out of manager account"
          >
            <LogOut className="w-3 h-3 text-rose-400 sm:text-inherit" />
            <span className="text-[11px]">Sign Out</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-x-hidden w-full">
        {children}
      </div>
    </div>
  );
}
