'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { DataStore } from '@/lib/store';
import { SAMPLE_MENU_PRESETS } from '@/lib/menuScanner';
import { getFoodPhotoForDish } from '@/lib/foodImageSearch';
import { 
  Building2, 
  ArrowRight, 
  Sparkles, 
  DollarSign, 
  Globe, 
  Image as ImageIcon, 
  CheckCircle2,
  ArrowLeft,
  Camera,
  Utensils,
  Layers
} from 'lucide-react';

function CreateRestaurantContent() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [tagline, setTagline] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [menuSetupMethod, setMenuSetupMethod] = useState<'SCAN' | 'TEMPLATE' | 'BLANK'>('SCAN');
  const [selectedTemplate, setSelectedTemplate] = useState('italian-pizzeria');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-slug generator when typing name
  const handleNameChange = (val: string) => {
    setName(val);
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(autoSlug);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    try {
      setIsSubmitting(true);
      const created = await DataStore.createRestaurant({
        name: name.trim(),
        slug: slug.trim(),
        tagline: tagline.trim(),
        currency: currency.trim() || '₹',
        logo_url: logoUrl.trim() || undefined,
        banner_url: bannerUrl.trim() || undefined,
      });

      if (menuSetupMethod === 'TEMPLATE') {
        const preset = SAMPLE_MENU_PRESETS.find((p) => p.id === selectedTemplate) || SAMPLE_MENU_PRESETS[0];
        for (const it of preset.items) {
          const cat = await DataStore.ensureCategory(created.id, it.category);
          await DataStore.saveMenuItem({
            restaurant_id: created.id,
            category_id: cat.id,
            name: it.name,
            price: it.price,
            description: it.description,
            image_url: getFoodPhotoForDish(it.name, it.category),
            is_veg: it.is_veg,
            is_available: true,
          });
        }
        router.push(`/admin/${created.slug}/menu`);
      } else if (menuSetupMethod === 'SCAN') {
        // Open directly with the AI Menu Photo Scanner open!
        router.push(`/admin/${created.slug}/menu?scan=1`);
      } else {
        router.push(`/admin/${created.slug}/menu`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to register restaurant');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 p-6 flex flex-col justify-center items-center">
      <div className="max-w-xl w-full">
        {/* Back Link */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-xs font-semibold text-stone-400 hover:text-white mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        {/* Card */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center font-black">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Register New Restaurant
              </h1>
              <p className="text-xs text-stone-400">
                Create a new restaurant tenant with its own menu, tables, and kitchen dashboard.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            {/* Restaurant Name */}
            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1.5">
                Restaurant Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Spice Route Bistro"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-4 py-3 bg-stone-950 border border-stone-800 rounded-xl text-sm text-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Custom URL Slug */}
            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1.5">
                Unique URL Slug *
              </label>
              <div className="flex items-center bg-stone-950 border border-stone-800 rounded-xl px-3 py-2.5">
                <span className="text-stone-500 text-xs font-mono select-none">
                  domain.com/r/
                </span>
                <input
                  type="text"
                  required
                  placeholder="spice-route"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  className="w-full bg-transparent text-amber-400 text-xs font-mono font-bold focus:outline-none pl-1"
                />
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                This is the link diners will visit when scanning the QR code.
              </p>
            </div>

            {/* Tagline & Currency */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-stone-300 mb-1.5">
                  Tagline (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Authentic Wood-Fired Taste"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  placeholder="₹"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white text-center font-bold placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Logo & Banner URLs */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5">
                  Logo Image URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full px-3 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5">
                  Cover Banner URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  className="w-full px-3 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Menu Initial Setup Preference */}
            <div className="pt-2 space-y-2.5">
              <label className="block text-xs font-bold text-stone-300">
                How would you like to add your dishes?
              </label>

              <div className="space-y-2">
                {/* Option 1: AI Menu Photo Scanner */}
                <div
                  onClick={() => setMenuSetupMethod('SCAN')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                    menuSetupMethod === 'SCAN'
                      ? 'bg-amber-500/10 border-amber-500 text-white'
                      : 'bg-stone-950/60 border-stone-800 text-stone-300 hover:border-stone-700'
                  }`}
                >
                  <div className={`p-2 rounded-xl mt-0.5 ${menuSetupMethod === 'SCAN' ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-400'}`}>
                    <Camera className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">📸 Scan Photo of Paper Menu Card</span>
                      <span className="px-1.5 py-0.2 text-[9px] font-black bg-amber-500 text-stone-950 rounded uppercase">
                        Recommended
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 mt-0.5 leading-snug">
                      Snap or upload a photo — AI detects dishes, prices, categories and attaches appetizing web photos in seconds!
                    </p>
                  </div>
                </div>

                {/* Option 2: Pre-loaded Cuisine Template */}
                <div
                  onClick={() => setMenuSetupMethod('TEMPLATE')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                    menuSetupMethod === 'TEMPLATE'
                      ? 'bg-amber-500/10 border-amber-500 text-white'
                      : 'bg-stone-950/60 border-stone-800 text-stone-300 hover:border-stone-700'
                  }`}
                >
                  <div className={`p-2 rounded-xl mt-0.5 ${menuSetupMethod === 'TEMPLATE' ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-400'}`}>
                    <Utensils className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-xs">⚡ Load Ready-Made Popular Dishes</span>
                    <p className="text-[11px] text-stone-400 mt-0.5 leading-snug">
                      Start instantly with pre-populated signature dishes, descriptions, and high-res photos.
                    </p>

                    {menuSetupMethod === 'TEMPLATE' && (
                      <div className="mt-2.5 grid grid-cols-3 gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {SAMPLE_MENU_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setSelectedTemplate(preset.id)}
                            className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition truncate ${
                              selectedTemplate === preset.id
                                ? 'bg-amber-500 text-stone-950 border-amber-400'
                                : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-white'
                            }`}
                          >
                            {preset.title.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Option 3: Manual */}
                <div
                  onClick={() => setMenuSetupMethod('BLANK')}
                  className={`p-3 rounded-2xl border cursor-pointer transition flex items-center gap-3 ${
                    menuSetupMethod === 'BLANK'
                      ? 'bg-amber-500/10 border-amber-500 text-white'
                      : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${menuSetupMethod === 'BLANK' ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-400'}`}>
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-xs">✍️ I will add all dishes manually later</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting || !name.trim() || !slug.trim()}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] disabled:opacity-50 text-stone-950 font-black rounded-2xl shadow-xl transition flex items-center justify-center gap-2 text-sm"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Restaurant & Open Menu Builder</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CreateRestaurantPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-950 flex items-center justify-center text-stone-400">Loading...</div>}>
      <CreateRestaurantContent />
    </Suspense>
  );
}
