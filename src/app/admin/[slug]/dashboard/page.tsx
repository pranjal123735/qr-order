'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { AuthService, OwnerUser } from '@/lib/auth';
import { DataStore } from '@/lib/store';
import { Restaurant } from '@/types/database';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { 
  Building2, 
  ChefHat, 
  UtensilsCrossed, 
  QrCode, 
  ExternalLink, 
  LogOut, 
  Sparkles, 
  ArrowRight, 
  Copy, 
  Check, 
  Clock, 
  ShoppingBag,
  Printer
} from 'lucide-react';

function DashboardContent() {
  const router = useRouter();
  const routeParams = useParams();
  const slug = (routeParams?.slug as string) || 'rustic-grill';

  const [owner, setOwner] = useState<OwnerUser | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [menuItemsCount, setMenuItemsCount] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    const currentOwner = AuthService.getCurrentOwner();
    setOwner(currentOwner);

    async function loadData() {
      const res = await DataStore.getRestaurant(slug);
      if (res) {
        setRestaurant(res);
        const [orders, items] = await Promise.all([
          DataStore.getOrders(res.id),
          DataStore.getMenuItems(res.id),
        ]);
        setOrdersCount(orders.filter(o => o.status !== 'CANCELLED' && o.status !== 'REJECTED').length);
        setMenuItemsCount(items.length);
      }
    }
    loadData();

    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, [slug]);

  const handleLogout = () => {
    AuthService.logout();
    router.push('/admin/login');
  };

  const customerMenuUrl = `${origin}/r/${slug}?table=1`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(customerMenuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AdminAuthGuard slug={slug}>
      <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col select-none selection:bg-amber-500 selection:text-stone-950 overflow-x-clip w-full">
      {/* 1. Dashboard Top Navbar - Fixed at top */}
      <header className="bg-stone-900/95 backdrop-blur-md border-b border-stone-800 px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3 fixed top-0 inset-x-0 z-50 shadow-xl">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20 shrink-0">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-black text-base sm:text-lg text-white truncate">
                {restaurant?.name || slug}
              </h1>
              <span className="hidden xs:inline-block px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded-full border border-amber-500/30 whitespace-nowrap">
                Tenant Portal
              </span>
            </div>
            <p className="text-xs text-stone-400 font-mono truncate">
              /r/{slug}
            </p>
          </div>
        </div>

        {/* Header Action */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href={`/r/${slug}?table=1`}
            target="_blank"
            className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            title="Preview diner menu in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Diner View</span>
          </Link>
        </div>
      </header>

      {/* 2. Main Content */}
      <main className="flex-1 p-4 sm:p-6 pt-20 sm:pt-20 max-w-6xl mx-auto w-full space-y-6">
        {/* Banner with Customer Link */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-900 to-amber-950/40 border border-stone-800 rounded-3xl p-4 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 shadow-xl">
          <div className="space-y-2 max-w-xl w-full">
            <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-black uppercase tracking-wider rounded-full border border-amber-500/20">
              Your Diner Ordering Link
            </span>
            <h2 className="text-lg sm:text-2xl font-black text-white">
              Diners scan QR codes to access this URL:
            </h2>
            <div className="flex items-center gap-2 bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-400 w-full overflow-hidden">
              <span className="truncate flex-1 min-w-0">{customerMenuUrl}</span>
              <button
                onClick={handleCopyLink}
                className="p-1.5 rounded hover:bg-stone-800 text-stone-400 hover:text-white shrink-0"
                title="Copy customer link"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto shrink-0">
            <a
              href={`/r/${slug}?table=1`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full md:w-auto px-5 py-3 bg-white hover:bg-stone-100 text-stone-950 font-black text-xs rounded-xl shadow transition flex items-center justify-center gap-2"
            >
              <span>Preview Customer Menu</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* 3. Action Hub Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Card 1: Kitchen Screen (KDS) */}
          <Link
            href={`/admin/${slug}/live-orders`}
            className="group relative p-5 sm:p-7 rounded-3xl bg-gradient-to-b from-stone-900 to-stone-900/90 border border-emerald-500/40 hover:border-emerald-400 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition" />
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition shadow-lg shrink-0">
                  <ChefHat className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] sm:text-[11px] font-black uppercase tracking-wider rounded-full border border-emerald-500/30 flex items-center gap-1.5 animate-pulse shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Live Sync
                </span>
              </div>

              <h3 className="font-black text-white text-lg sm:text-xl tracking-tight group-hover:text-emerald-300 transition">
                Kitchen Display Screen (KDS)
              </h3>
              <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                High-visibility cook terminal with audio chimes, elapsed ticket timers, special modifier callouts, and 1-tap Accept/Cooking/Served actions.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-950/60 text-emerald-400 rounded-xl text-xs font-black border border-emerald-500/30">
                <Clock className="w-3.5 h-3.5" />
                <span>{ordersCount} active ticket{ordersCount === 1 ? '' : 's'} waiting</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-stone-800/80 flex items-center justify-between text-xs font-black text-emerald-400 group-hover:text-emerald-300">
              <span>Open Cooker Terminal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition" />
            </div>
          </Link>

          {/* Card 2: My Menu & Stock */}
          <Link
            href={`/admin/${slug}/menu`}
            className="group relative p-7 rounded-3xl bg-gradient-to-b from-stone-900 to-stone-900/90 border border-amber-500/40 hover:border-amber-400 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center group-hover:scale-110 transition shadow-lg">
                  <UtensilsCrossed className="w-7 h-7" />
                </div>
                <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-[11px] font-black uppercase tracking-wider rounded-full border border-amber-500/30">
                  Instant Stock
                </span>
              </div>

              <h3 className="font-black text-white text-xl tracking-tight group-hover:text-amber-300 transition">
                Menu & Stock Manager
              </h3>
              <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                Add and customize dishes, organize categories, and use 1-click &quot;Sold Out&quot; switches to instantly disable dishes when ingredients run out.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-950/60 text-amber-400 rounded-xl text-xs font-black border border-amber-500/30">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{menuItemsCount} total dish{menuItemsCount === 1 ? '' : 'es'} in menu</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-stone-800/80 flex items-center justify-between text-xs font-black text-amber-400 group-hover:text-amber-300">
              <span>Manage Dishes & Stock</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition" />
            </div>
          </Link>

          {/* Card 3: My Table QR Codes */}
          <Link
            href={`/admin/${slug}/tables`}
            className="group relative p-7 rounded-3xl bg-gradient-to-b from-stone-900 to-stone-900/90 border border-purple-500/40 hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center group-hover:scale-110 transition shadow-lg">
                  <Printer className="w-7 h-7" />
                </div>
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-[11px] font-black uppercase tracking-wider rounded-full border border-purple-500/30">
                  Print Ready
                </span>
              </div>

              <h3 className="font-black text-white text-xl tracking-tight group-hover:text-purple-300 transition">
                Table QR Codes
              </h3>
              <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                Generate high-resolution scannable QR cards formatted for tabletop acrylic stands for Tables 1 to N with your restaurant branding.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 px-3.5 py-1.5 bg-purple-950/60 text-purple-400 rounded-xl text-xs font-black border border-purple-500/30">
                <QrCode className="w-3.5 h-3.5" />
                <span>Ready for acrylic tent cards</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-stone-800/80 flex items-center justify-between text-xs font-black text-purple-400 group-hover:text-purple-300">
              <span>Print Table QR Cards</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition" />
            </div>
          </Link>
        </div>
      </main>
    </div>
    </AdminAuthGuard>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-950 flex items-center justify-center text-stone-400">Loading Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
