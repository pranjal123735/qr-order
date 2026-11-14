'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthService } from '@/lib/auth';
import { 
  Building2, 
  Mail, 
  Lock, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  Globe, 
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

function RegisterContent() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [slug, setSlug] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [tagline, setTagline] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto slug generator
  const handleNameChange = (val: string) => {
    setRestaurantName(val);
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(autoSlug);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || !restaurantName.trim() || !slug.trim()) return;

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await AuthService.registerRestaurantOwner({
        email: email.trim(),
        password,
        restaurantName: restaurantName.trim(),
        slug: slug.trim(),
        currency: currency.trim() || '₹',
        tagline: tagline.trim(),
      });

      if (res.success && res.user) {
        // Redirect straight to their authenticated restaurant management hub!
        router.push(`/admin/${res.user.restaurant_slug}/dashboard`);
      } else {
        setError(res.error || 'Registration failed.');
      }
    } catch {
      setError('An unexpected error occurred during account creation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center p-4 selection:bg-amber-500 selection:text-stone-950">
      <div className="max-w-xl w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 mb-2 group">
            <div className="w-10 h-10 bg-amber-500 text-stone-950 rounded-2xl flex items-center justify-center font-black shadow-lg shadow-amber-500/20 group-hover:scale-105 transition">
              <Building2 className="w-6 h-6" />
            </div>
            <span className="text-xl font-black text-white">TableBite Multi-Tenant</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Register Your Restaurant
          </h1>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            Create an owner account to manage your menu, get custom QR codes, and take live table orders.
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Section 1: Account Credentials */}
            <div className="space-y-3 pb-3 border-b border-stone-800">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>1. Owner Account Login</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@restaurant.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white placeholder:text-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-300 mb-1">
                    Password (min 6 chars) *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white placeholder:text-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Restaurant Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>2. Restaurant Information</span>
              </h3>

              <div>
                <label className="block text-[11px] font-bold text-stone-300 mb-1">
                  Restaurant Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bella Italia Bistro"
                  value={restaurantName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white placeholder:text-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-300 mb-1">
                  Your Custom Web Link Slug *
                </label>
                <div className="flex items-center bg-stone-950 border border-stone-800 rounded-xl px-3 py-2">
                  <span className="text-stone-500 text-xs font-mono select-none">
                    tablebite.app/r/
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="bella-italia"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    className="w-full bg-transparent text-amber-400 text-xs font-mono font-bold focus:outline-none pl-1"
                  />
                </div>
                <p className="text-[10px] text-stone-500 mt-1">
                  This custom link will be embedded in your table QR codes.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-stone-300 mb-1">
                    Tagline (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Wood-fired Pizza & Wine"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white placeholder:text-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-300 mb-1">
                    Currency Symbol
                  </label>
                  <input
                    type="text"
                    placeholder="₹"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white text-center font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={loading || !restaurantName.trim() || !slug.trim() || !email.trim()}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] disabled:opacity-50 text-stone-950 font-black rounded-xl text-xs shadow-xl transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Account & Open Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer Login Link */}
        <div className="text-center text-xs text-stone-400">
          <span>Already registered? </span>
          <Link
            href="/admin/login"
            className="text-amber-400 font-bold hover:underline"
          >
            Sign In Here &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-950 flex items-center justify-center text-stone-400">Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
