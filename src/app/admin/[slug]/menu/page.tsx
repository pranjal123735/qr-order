'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Restaurant, Category, MenuItem } from '@/types/database';
import { DataStore } from '@/lib/store';
import { MenuScannerModal } from './MenuScannerModal';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { getFoodPhotoForDish } from '@/lib/foodImageSearch';
import { inferDietaryType } from '@/lib/menuScanner';
import { 
  ArrowLeft, 
  Plus, 
  Check, 
  X, 
  ChefHat, 
  UtensilsCrossed, 
  Flame, 
  Search,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Filter,
  DollarSign,
  Tag,
  Layers,
  AlertCircle,
  Camera,
  Trash2,
  Wand2,
  Image as ImageIcon
} from 'lucide-react';

function MenuManagerContent() {
  const router = useRouter();
  const routeParams = useParams();
  const searchParams = useSearchParams();
  const slug = (routeParams?.slug as string) || 'rustic-grill';

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [filterMode, setFilterMode] = useState<'ALL' | 'IN_STOCK' | 'SOLD_OUT' | 'VEG'>('ALL');

  // AI Menu Scanner Modal
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Add Item Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemImage, setNewItemImage] = useState('');
  const [newItemIsVeg, setNewItemIsVeg] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Check URL query parameters: e.g. /menu?scan=1 automatically launches the scanner
  useEffect(() => {
    if (searchParams?.get('scan') === '1') {
      setIsScannerOpen(true);
    }
  }, [searchParams]);

  const loadData = async () => {
    setLoading(true);
    const res = await DataStore.getRestaurant(slug);
    if (res) {
      setRestaurant(res);
      const [cats, items] = await Promise.all([
        DataStore.getCategories(res.id),
        DataStore.getMenuItems(res.id),
      ]);
      setCategories(cats);
      setMenuItems(items);
      if (cats.length > 0 && !newItemCategory) {
        setNewItemCategory(cats[0].id);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [slug]);

  const handleToggleAvailability = async (itemId: string, currentStatus: boolean) => {
    // Optimistic local state update
    setMenuItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, is_available: !currentStatus } : it))
    );
    await DataStore.toggleMenuItemAvailability(itemId, !currentStatus);
  };

  const handleDeleteItem = async (itemId: string, name: string) => {
    if (confirm(`Remove "${name}" from the menu?`)) {
      setMenuItems((prev) => prev.filter((it) => it.id !== itemId));
      await DataStore.deleteMenuItem(itemId);
    }
  };

  // Magic Auto-Fill for Single Item:
  // When user enters dish title, automatically find web photo, suggest description, and set dietary tag
  const handleAutoFillSingleItem = () => {
    if (!newItemName.trim()) return;
    const catName = categories.find((c) => c.id === newItemCategory)?.name;
    const photo = getFoodPhotoForDish(newItemName, catName);
    const isVeg = inferDietaryType(newItemName);
    setNewItemImage(photo);
    setNewItemIsVeg(isVeg);
    if (!newItemDesc.trim()) {
      setNewItemDesc(`Freshly prepared ${newItemName.toLowerCase()} with authentic seasonings and premium ingredients.`);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemPrice || !restaurant) return;

    try {
      setIsSaving(true);
      await DataStore.saveMenuItem({
        restaurant_id: restaurant.id,
        category_id: newItemCategory || categories[0]?.id || 'cat-1',
        name: newItemName.trim(),
        price: parseFloat(newItemPrice) || 0,
        description: newItemDesc.trim(),
        image_url: newItemImage.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80',
        is_veg: newItemIsVeg,
        is_available: true,
      });

      setNewItemName('');
      setNewItemPrice('');
      setNewItemDesc('');
      setNewItemImage('');
      setIsModalOpen(false);

      await loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to save menu item');
    } finally {
      setIsSaving(false);
    }
  };

  // Metrics
  const totalItems = menuItems.length;
  const inStockCount = menuItems.filter((i) => i.is_available).length;
  const soldOutCount = menuItems.filter((i) => !i.is_available).length;

  const filteredItems = useMemo(() => {
    return menuItems.filter((it) => {
      if (selectedCategory !== 'ALL' && it.category_id !== selectedCategory) {
        return false;
      }
      if (filterMode === 'IN_STOCK' && !it.is_available) return false;
      if (filterMode === 'SOLD_OUT' && it.is_available) return false;
      if (filterMode === 'VEG' && !it.is_veg) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return it.name.toLowerCase().includes(q) || it.description?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [menuItems, selectedCategory, filterMode, search]);

  return (
    <AdminAuthGuard slug={slug}>
      <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col select-none font-sans overflow-x-hidden w-full">
      {/* 1. Header Bar */}
      <header className="bg-stone-900/95 border-b border-stone-800 px-3.5 sm:px-6 py-3 sm:py-4 sticky top-0 z-40 backdrop-blur-md flex flex-wrap items-center justify-between gap-2.5 sm:gap-4 shadow-2xl">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <Link
            href={`/admin/${slug}/dashboard`}
            className="p-2 sm:p-2.5 rounded-2xl bg-stone-800 hover:bg-stone-750 text-stone-300 hover:text-white border border-stone-700 transition shrink-0"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-black text-base sm:text-xl text-white tracking-tight truncate">MENU & STOCK</h1>
              <span className="hidden xs:inline-block px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] sm:text-xs font-black rounded-full border border-amber-500/30 whitespace-nowrap">
                1-CLICK STOCK
              </span>
            </div>
            <p className="text-xs text-stone-400 truncate">
              Restaurant: <strong className="text-amber-400 uppercase">{slug}</strong>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="px-2.5 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black rounded-2xl text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5 sm:gap-2 active:scale-95"
            title="Snap photo of paper menu to auto-add dishes"
          >
            <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            <span>AI Scan</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-2.5 sm:px-4 py-2 sm:py-2.5 bg-stone-850 hover:bg-stone-800 text-stone-200 border border-stone-700/80 rounded-2xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Add Dish Manually</span>
            <span className="sm:hidden">Add</span>
          </button>

          <button
            onClick={() => router.push(`/admin/${slug}/live-orders`)}
            className="p-2 sm:p-2.5 bg-stone-850 hover:bg-stone-800 text-stone-200 border border-stone-700/80 rounded-2xl text-xs font-bold transition flex items-center gap-1.5"
            title="Kitchen Screen"
          >
            <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
          </button>
        </div>
      </header>

      {/* 2. Top Metric Strip */}
      <div className="bg-stone-900 border-b border-stone-800/80 px-3.5 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        {/* Metric Badges */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-950 border border-stone-800 rounded-xl text-xs font-bold shrink-0">
            <span className="text-stone-400">Total Items:</span>
            <span className="text-white font-black">{totalItems}</span>
          </div>

          <button
            onClick={() => setFilterMode(filterMode === 'IN_STOCK' ? 'ALL' : 'IN_STOCK')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              filterMode === 'IN_STOCK'
                ? 'bg-emerald-500 text-stone-950 shadow-md'
                : 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{inStockCount} In Stock</span>
          </button>

          <button
            onClick={() => setFilterMode(filterMode === 'SOLD_OUT' ? 'ALL' : 'SOLD_OUT')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              filterMode === 'SOLD_OUT'
                ? 'bg-rose-500 text-white shadow-md'
                : 'bg-rose-950/40 text-rose-400 border border-rose-500/30 hover:bg-rose-900/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>{soldOutCount} Sold Out</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="w-full sm:w-72 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
          <input
            type="text"
            placeholder="Search dishes to toggle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white placeholder:text-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-inner"
          />
        </div>
      </div>

      {/* 3. Category Filter Navigation Bar */}
      <div className="bg-stone-900/60 border-b border-stone-800/60 px-3.5 sm:px-6 py-2 sm:py-2.5 flex items-center gap-2 no-scrollbar overflow-x-auto">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
            selectedCategory === 'ALL'
              ? 'bg-amber-500 text-stone-950 shadow-sm'
              : 'bg-stone-800 text-stone-400 hover:text-white hover:bg-stone-750'
          }`}
        >
          All Categories ({menuItems.length})
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              selectedCategory === c.id
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'bg-stone-800 text-stone-400 hover:text-white hover:bg-stone-750'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* 4. Menu Items Grid */}
      <main className="flex-1 p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-4 sm:space-y-5">
        {/* Instant AI Menu Scanner Banner */}
        <div className="bg-gradient-to-r from-amber-950/30 via-stone-900 to-stone-900 border border-amber-500/30 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 font-black mt-0.5 sm:mt-0">
              <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-white leading-tight">
                  Add Dishes Effortlessly with AI Photo Scan
                </h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase whitespace-nowrap shrink-0">
                  Zero Manual Typing
                </span>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed">
                Click or upload a photo of your paper menu card. Our AI detects dishes, prices, categories & automatically fetches delicious photos from the web!
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsScannerOpen(true)}
            className="w-full sm:w-auto px-5 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-2xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 shrink-0 active:scale-95"
          >
            <Sparkles className="w-4 h-4 stroke-[2.5]" />
            <span>Scan Menu Card Now</span>
          </button>
        </div>

        {filteredItems.length === 0 ? (
          <div className="py-20 text-center text-stone-500 bg-stone-900/50 rounded-3xl border border-stone-850 p-8">
            <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 text-stone-700 opacity-60" />
            <p className="font-bold text-stone-300 text-sm">No dishes found in your menu yet.</p>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              Click &quot;Scan Menu Card Now&quot; to auto-import from a photo in seconds, or click &quot;Add Dish Manually&quot;.
            </p>
            <button
              onClick={() => setIsScannerOpen(true)}
              className="mt-4 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-xl shadow transition inline-flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <span>Launch AI Menu Scanner</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map((item) => {
              const isAvailable = item.is_available;

              return (
                <div
                  key={item.id}
                  className={`p-4 sm:p-5 rounded-3xl border transition-all duration-200 flex flex-col justify-between gap-4 shadow-xl ${
                    isAvailable
                      ? 'bg-stone-900/95 border-stone-800 hover:border-stone-700'
                      : 'bg-rose-950/20 border-rose-900/50 opacity-80'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Dish Photo */}
                    {item.image_url ? (
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-stone-950 flex-shrink-0 border border-stone-800">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        {!isAvailable && (
                          <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-[2px] flex items-center justify-center">
                            <span className="text-[10px] font-black uppercase text-rose-400 tracking-wider">
                              OFFLINE
                            </span>
                          </div>
                        )}
                      </div>
                    ) : null}

                    {/* Dish Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`w-2.5 h-2.5 rounded-full border ${
                            item.is_veg
                              ? 'bg-emerald-500 border-emerald-700'
                              : 'bg-rose-600 border-rose-800'
                          }`}
                          title={item.is_veg ? 'Vegetarian' : 'Non-Vegetarian'}
                        />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                          {item.is_veg ? 'Veg' : 'Non-Veg'}
                        </span>
                        <span className="font-mono text-xs font-black text-amber-400 ml-auto">
                          {(!restaurant?.currency || restaurant.currency === '$') ? '₹' : restaurant.currency}{item.price.toFixed(0)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id, item.name)}
                          className="p-1 rounded text-stone-600 hover:text-rose-400 transition ml-1"
                          title="Remove dish from menu"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h3 className="font-black text-base sm:text-lg text-white leading-tight truncate">
                        {item.name}
                      </h3>
                      <p className="text-xs text-stone-400 line-clamp-2 mt-1 leading-relaxed">
                        {item.description || 'No description provided.'}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Stock Toggle Strip */}
                  <div className="pt-3 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <span className="text-xs font-bold text-stone-400">Stock:</span>
                      <span
                        className={`text-[11px] sm:text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shrink-0 ${
                          isAvailable
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                        }`}
                      >
                        {isAvailable ? 'IN STOCK' : 'SOLD OUT'}
                      </span>
                    </div>

                    {/* Giant Tactile Toggle Button */}
                    <button
                      onClick={() => handleToggleAvailability(item.id, isAvailable)}
                      className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-black shadow-md transition active:scale-95 flex items-center gap-1.5 shrink-0 ${
                        isAvailable
                          ? 'bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-rose-300'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                      title={isAvailable ? 'Click to mark as Sold Out' : 'Click to restore to In Stock'}
                    >
                      {isAvailable ? (
                        <>
                          <X className="w-3.5 h-3.5" />
                          <span>Mark Sold Out</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Put Back in Stock</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add New Dish Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5 stroke-[3]" />
                </div>
                <h3 className="font-black text-lg text-white">Add New Dish to Menu</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-stone-300">Dish Name *</label>
                  {newItemName.trim().length > 1 && (
                    <button
                      type="button"
                      onClick={handleAutoFillSingleItem}
                      className="text-[11px] font-black text-amber-400 hover:text-amber-300 flex items-center gap-1 transition"
                      title="Auto-fetch photo and details from web"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Auto-Fill Photo & Details</span>
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Signature Wood-Fired Margherita"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-inner"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">Category</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="199"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    className="w-full px-3 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">Dietary Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewItemIsVeg(true)}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      newItemIsVeg
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow'
                        : 'bg-stone-950 border-stone-800 text-stone-400'
                    }`}
                  >
                    🥬 Vegetarian
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewItemIsVeg(false)}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      !newItemIsVeg
                        ? 'bg-rose-700 border-rose-600 text-white shadow'
                        : 'bg-stone-950 border-stone-800 text-stone-400'
                    }`}
                  >
                    🍗 Non-Vegetarian
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Ingredients, seasonings, and culinary details..."
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  className="w-full p-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-stone-300">Photo URL (Optional)</label>
                  {newItemName.trim() && (
                    <button
                      type="button"
                      onClick={async () => {
                        const cat = categories.find(c => c.id === newItemCategory)?.name;
                        const initialPhoto = getFoodPhotoForDish(newItemName, cat);
                        setNewItemImage(initialPhoto);
                        try {
                          const res = await fetch(`/api/menu/food-image?q=${encodeURIComponent(newItemName)}&category=${encodeURIComponent(cat || '')}`);
                          if (res.ok) {
                            const data = await res.json();
                            if (data.primaryPhoto) setNewItemImage(data.primaryPhoto);
                          }
                        } catch {}
                      }}
                      className="text-[10px] font-bold text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <ImageIcon className="w-3 h-3" />
                      <span>Find Web Photo</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={newItemImage}
                    onChange={(e) => setNewItemImage(e.target.value)}
                    className="flex-1 px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  {newItemImage && (
                    <div className="w-9 h-9 rounded-xl overflow-hidden border border-stone-800 flex-shrink-0 bg-stone-950">
                      <img src={newItemImage} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-stone-800 hover:bg-stone-750 text-stone-300 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-xl shadow-lg transition"
                >
                  {isSaving ? 'Adding...' : 'Save & Add Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Menu Scanner Modal */}
      {restaurant && (
        <MenuScannerModal
          restaurant={restaurant}
          categories={categories}
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onSuccess={async () => {
            await loadData();
          }}
        />
      )}
    </div>
    </AdminAuthGuard>
  );
}

export default function MenuManagerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-950 flex items-center justify-center text-stone-400">Loading Menu Manager...</div>}>
      <MenuManagerContent />
    </Suspense>
  );
}
