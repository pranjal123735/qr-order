'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  QrCode, 
  ChefHat, 
  Smartphone, 
  Printer, 
  UtensilsCrossed, 
  ArrowRight, 
  Sparkles, 
  Volume2, 
  ExternalLink,
  ShieldCheck, 
  Zap, 
  Building2, 
  Plus, 
  Lock, 
  KeyRound, 
  LogOut,
  ShieldAlert
} from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { AuthService, OwnerUser } from '@/lib/auth';
import { localSync } from '@/lib/store';
import { useLanguage, LanguageSwitcher } from '@/lib/i18n';

export default function HomePage() {
  const [owner, setOwner] = useState<OwnerUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const { t, isHindi } = useLanguage();

  useEffect(() => {
    // 1. Check logged in manager
    const current = AuthService.getCurrentOwner();
    setOwner(current);
    setLoadingAuth(false);

    // 2. Real-time auth state updates
    const unsub = localSync.subscribe((event) => {
      if (event.type === 'AUTH_STATE_CHANGED') {
        setOwner(event.payload as OwnerUser | null);
      }
    });

    return () => unsub();
  }, []);

  const handleLogout = () => {
    AuthService.logout();
    setOwner(null);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col selection:bg-amber-500 selection:text-stone-950 font-sans overflow-x-clip w-full">
      {/* 1. Top Navbar - Fixed at top */}
      <header className="border-b border-stone-800/80 bg-stone-950/95 backdrop-blur-md fixed top-0 inset-x-0 z-50 w-full shadow-lg">
        <nav className="px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between max-w-6xl mx-auto w-full gap-2">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20 group-hover:scale-105 transition shrink-0">
              <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-black text-base sm:text-lg text-white tracking-tight">TableBite</span>
              <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30 whitespace-nowrap">
                {t.brand_tag}
              </span>
            </div>
          </Link>

          {/* Action Buttons & Language Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Language Switcher */}
            <LanguageSwitcher theme="dark" size="sm" />

            {owner ? (
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                <Link
                  href={`/admin/${owner.restaurant_slug}/dashboard`}
                  className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-xl shadow-md transition flex items-center gap-1 sm:gap-1.5 whitespace-nowrap"
                >
                  <span>{t.btn_dashboard}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 bg-stone-900 hover:bg-stone-850 text-stone-400 hover:text-rose-400 border border-stone-800 rounded-xl text-xs font-bold transition flex items-center gap-1 whitespace-nowrap"
                  title={t.btn_sign_out}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline sm:inline">{t.btn_sign_out}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                <Link
                  href="/admin/login"
                  className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-stone-900 hover:bg-stone-850 text-stone-200 hover:text-white border border-stone-800 rounded-xl text-xs font-bold transition flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="hidden sm:inline">{t.btn_restaurant_login}</span>
                  <span className="sm:hidden">{t.btn_login}</span>
                </Link>

                <Link
                  href="/admin/register"
                  className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-xl shadow-md transition flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3] shrink-0" />
                  <span className="hidden sm:inline">{t.btn_register_restaurant}</span>
                  <span className="sm:hidden">{t.btn_register}</span>
                </Link>
              </div>
            )}

            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-stone-900 border border-stone-800 rounded-full text-xs font-medium text-stone-400 whitespace-nowrap">
              <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
              <span>{isSupabaseConfigured ? t.supabase_connected : t.local_sync_ready}</span>
            </div>
          </div>
        </nav>
      </header>

      {/* 2. Hero Section */}
      <section className="pt-24 sm:pt-28 pb-10 sm:pb-16 px-4 sm:px-6 max-w-5xl mx-auto text-center space-y-4 sm:space-y-6">
        <div className="inline-flex max-w-full items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-center flex-wrap justify-center">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{t.hero_badge}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight px-1">
          {t.hero_title_1} <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500">
            {t.hero_title_2}
          </span>
        </h1>

        <p className="text-sm sm:text-lg text-stone-400 max-w-2xl mx-auto leading-relaxed px-2">
          {t.hero_subtitle}
        </p>

        {/* 3. Conditional Content Based on Authentication */}
        {!loadingAuth && (
          <div className="pt-4 max-w-4xl mx-auto">
            {owner ? (
              /* LOGGED IN OWNER: Private Workspace Strip */
              <div className="space-y-4">
                <div className="bg-stone-900 border border-amber-500/30 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase text-amber-400">{t.auth_manager}</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-white">
                        {owner.restaurant_name || owner.restaurant_slug}
                      </h3>
                      <p className="text-xs text-stone-400">
                        {t.signed_in_as} <strong className="text-stone-300">{owner.email}</strong>
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/admin/${owner.restaurant_slug}/dashboard`}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-xl shadow transition flex items-center gap-2"
                  >
                    <span>{t.btn_open_dashboard}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Authenticated Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                  {/* Card 1: Kitchen Screen */}
                  <Link
                    href={`/admin/${owner.restaurant_slug}/live-orders`}
                    className="p-5 rounded-2xl bg-stone-900 border border-emerald-500/40 hover:border-emerald-400 hover:bg-stone-850 transition group flex flex-col justify-between shadow-lg"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                        <ChefHat className="w-5 h-5" />
                      </div>
                      <h4 className="font-extrabold text-white text-base">{t.kds_title}</h4>
                      <p className="text-xs text-stone-400 mt-1">{t.kds_desc}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-stone-800 flex items-center gap-1 text-xs font-bold text-emerald-400">
                      <span>{t.btn_open_kds}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                    </div>
                  </Link>

                  {/* Card 2: Menu & Stock */}
                  <Link
                    href={`/admin/${owner.restaurant_slug}/menu`}
                    className="p-5 rounded-2xl bg-stone-900 border border-stone-800 hover:border-amber-500/50 hover:bg-stone-850 transition group flex flex-col justify-between shadow-lg"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                        <UtensilsCrossed className="w-5 h-5" />
                      </div>
                      <h4 className="font-extrabold text-white text-base">{t.menu_title}</h4>
                      <p className="text-xs text-stone-400 mt-1">{t.menu_desc}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-stone-800 flex items-center gap-1 text-xs font-bold text-amber-400">
                      <span>{t.btn_manage_dishes}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                    </div>
                  </Link>

                  {/* Card 3: Table QR Cards */}
                  <Link
                    href={`/admin/${owner.restaurant_slug}/tables`}
                    className="p-5 rounded-2xl bg-stone-900 border border-stone-800 hover:border-purple-500/50 hover:bg-stone-850 transition group flex flex-col justify-between shadow-lg"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                        <Printer className="w-5 h-5" />
                      </div>
                      <h4 className="font-extrabold text-white text-base">{t.tables_title}</h4>
                      <p className="text-xs text-stone-400 mt-1">{t.tables_desc}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-stone-800 flex items-center gap-1 text-xs font-bold text-purple-400">
                      <span>{t.btn_print_qrs}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                    </div>
                  </Link>

                  {/* Card 4: Preview Live Diner QR Menu */}
                  <Link
                    href={`/r/${owner.restaurant_slug}?table=1`}
                    target="_blank"
                    className="p-5 rounded-2xl bg-stone-900 border border-stone-800 hover:border-blue-500/50 hover:bg-stone-850 transition group flex flex-col justify-between shadow-lg"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <h4 className="font-extrabold text-white text-base">{t.preview_menu_title}</h4>
                      <p className="text-xs text-stone-400 mt-1">{t.preview_menu_desc}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-stone-800 flex items-center gap-1 text-xs font-bold text-blue-400">
                      <span>{t.btn_view_table1}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </Link>
                </div>
              </div>
            ) : (
              /* NOT LOGGED IN: Enforce Login & Show Security Barrier */
              <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-xl mx-auto space-y-5">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                  <Lock className="w-7 h-7 text-amber-400" />
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {t.auth_enforced}
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-white">
                    {t.portal_protected_title}
                  </h3>
                  <p className="text-xs text-stone-400 leading-relaxed max-w-md mx-auto">
                    {t.portal_protected_desc}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <Link
                    href="/admin/login"
                    className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>{t.btn_sign_in_access}</span>
                  </Link>

                  <Link
                    href="/admin/register"
                    className="w-full sm:w-auto px-6 py-3 bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t.btn_register_new}</span>
                  </Link>
                </div>

                <div className="pt-3 border-t border-stone-800/80 text-[11px] text-stone-400 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.diner_no_login_note}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 4. Multi-Tenant Pitch Features */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 max-w-5xl mx-auto space-y-8 sm:space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white">{t.why_choose_title}</h2>
          <p className="text-xs sm:text-sm text-stone-400 max-w-xl mx-auto">
            {t.why_choose_subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="p-5 bg-stone-900 rounded-2xl border border-stone-800 space-y-2">
            <Zap className="w-6 h-6 text-amber-400" />
            <h4 className="font-bold text-white text-base">{t.feat1_title}</h4>
            <p className="text-xs text-stone-400 leading-relaxed">
              {t.feat1_desc}
            </p>
          </div>

          <div className="p-5 bg-stone-900 rounded-2xl border border-stone-800 space-y-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h4 className="font-bold text-white text-base">{t.feat2_title}</h4>
            <p className="text-xs text-stone-400 leading-relaxed">
              {t.feat2_desc}
            </p>
          </div>

          <div className="p-5 bg-stone-900 rounded-2xl border border-stone-800 space-y-2">
            <Volume2 className="w-6 h-6 text-blue-400" />
            <h4 className="font-bold text-white text-base">{t.feat3_title}</h4>
            <p className="text-xs text-stone-400 leading-relaxed">
              {t.feat3_desc}
            </p>
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="border-t border-stone-800 py-6 px-4 sm:px-6 text-center text-xs text-stone-500">
        {t.footer_text}
      </footer>
    </div>
  );
}
