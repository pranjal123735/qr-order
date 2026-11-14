'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { 
  Restaurant, 
  Category, 
  MenuItem, 
  CartItem 
} from '@/types/database';
import { DataStore } from '@/lib/store';
import { 
  ShoppingBag, 
  Search, 
  X, 
  Plus, 
  Minus, 
  Clock, 
  ChevronRight, 
  UtensilsCrossed,
  ArrowRight,
  Info,
  Sparkles,
  Flame,
  Check,
  Bell,
  BellRing
} from 'lucide-react';
import { useLanguage, LanguageSwitcher } from '@/lib/i18n';
import { translateFoodName, translateFoodDescription, translateCategoryName } from '@/lib/foodTranslations';
import { TableServiceBellModal } from '@/components/customer/TableServiceBellModal';

function CustomerMenuContent() {
  const router = useRouter();
  const routeParams = useParams();
  const searchParams = useSearchParams();
  const slug = (routeParams?.slug as string) || 'rustic-grill';
  const tableParam = searchParams.get('table');
  const { t, isHindi } = useLanguage();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Table selection
  const [tableNumber, setTableNumber] = useState<number | null>(
    tableParam ? parseInt(tableParam, 10) : null
  );
  const isTableLockedFromQr = Boolean(tableParam && !isNaN(parseInt(tableParam, 10)));
  const [showTablePicker, setShowTablePicker] = useState(false);

  // Active filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);

  // Cart state
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active order session
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [isStaffBellOpen, setIsStaffBellOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
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
      }
      setLoading(false);
    }
    loadData();

    const unsub = DataStore.subscribeToMenuItems(slug, async () => {
      if (restaurant) {
        const freshItems = await DataStore.getMenuItems(restaurant.id);
        setMenuItems(freshItems);
      }
    });

    return () => unsub();
  }, [slug, restaurant?.id]);

  useEffect(() => {
    if (tableParam) {
      const t = parseInt(tableParam, 10);
      if (!isNaN(t)) {
        setTableNumber(t);
        setShowTablePicker(false);
      }
    } else if (!tableNumber) {
      setShowTablePicker(true);
    }
  }, [tableParam, tableNumber]);

  useEffect(() => {
    if (restaurant && tableNumber) {
      try {
        const existingId = localStorage.getItem(`qr_store_active_order_${restaurant.id}_table_${tableNumber}`);
        if (existingId) {
          const parsed = JSON.parse(existingId);
          setActiveOrderId(parsed);
        }
      } catch {
        // ignore
      }
    }
  }, [restaurant, tableNumber]);

  const cartList = useMemo(() => Object.values(cart), [cart]);
  const cartTotalCount = useMemo(() => cartList.reduce((sum, item) => sum + item.quantity, 0), [cartList]);
  const cartTotalPrice = useMemo(() => cartList.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0), [cartList]);

  const addToCart = (item: MenuItem) => {
    if (!item.is_available) return;
    setCart((prev) => {
      const existing = prev[item.id];
      if (existing) {
        return {
          ...prev,
          [item.id]: { ...existing, quantity: existing.quantity + 1 },
        };
      }
      return {
        ...prev,
        [item.id]: { menuItem: item, quantity: 1 },
      };
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return {
        ...prev,
        [itemId]: { ...existing, quantity: existing.quantity - 1 },
      };
    });
  };

  const updateItemNotes = (itemId: string, notes: string) => {
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      return {
        ...prev,
        [itemId]: { ...existing, notes },
      };
    });
  };

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (selectedCategory !== 'ALL' && item.category_id !== selectedCategory) {
        return false;
      }
      if (vegOnly && !item.is_veg) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hindiName = translateFoodName(item.name, true).toLowerCase();
        return item.name.toLowerCase().includes(q) || 
               hindiName.includes(q) || 
               item.description?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [menuItems, selectedCategory, vegOnly, searchQuery]);

  const handlePlaceOrder = async () => {
    if (!tableNumber) {
      alert(t.alert_select_table);
      setShowTablePicker(true);
      return;
    }
    if (cartList.length === 0) return;

    try {
      setIsSubmitting(true);
      const newOrder = await DataStore.createOrder(
        {
          restaurant_id: restaurant?.id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          table_number: tableNumber,
          customer_name: customerName.trim() || `Table ${tableNumber} Guest`,
          customer_phone: customerPhone.trim(),
          notes: orderNotes.trim(),
          total_amount: cartTotalPrice,
        },
        cartList.map((c) => ({
          menu_item_id: c.menuItem.id,
          item_name: c.menuItem.name,
          item_price: c.menuItem.price,
          quantity: c.quantity,
          notes: c.notes,
        }))
      );

      setCart({});
      setIsCartOpen(false);
      router.push(`/r/${slug}/order/${newOrder.id}?table=${tableNumber}`);
    } catch (err) {
      console.error(err);
      alert(t.alert_order_failed);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center p-6 text-white">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-bold text-stone-300 text-sm tracking-wide">{t.opening_menu}</p>
      </div>
    );
  }

  const currency = (!restaurant?.currency || restaurant.currency === '$') ? '₹' : restaurant.currency;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pb-32 font-sans select-none antialiased overflow-x-clip w-full">
      {/* 1. Permanently Fixed Top App Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-md">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between gap-2">
          {/* Restaurant identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            {restaurant?.logo_url ? (
              <img
                src={restaurant.logo_url}
                alt={restaurant.name}
                className="w-9 h-9 rounded-xl object-cover border border-stone-200 shadow-xs flex-shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 font-black flex items-center justify-center text-sm">
                🍽️
              </div>
            )}
            <div className="min-w-0">
              <h1 className="font-black text-sm text-stone-950 truncate leading-tight">
                {restaurant?.name || t.restaurant_menu}
              </h1>
              <p className="text-[11px] text-stone-500 truncate">
                {restaurant?.tagline || t.scan_and_dine}
              </p>
            </div>
          </div>

          {/* Language Switcher & Table Badge */}
          <div className="flex items-center gap-1.5 shrink-0">
            {tableNumber && (
              <button
                type="button"
                onClick={() => setIsStaffBellOpen(true)}
                className="p-1.5 sm:px-2.5 sm:py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-950 border border-amber-500/30 rounded-full font-bold text-xs flex items-center gap-1 transition active:scale-95 shadow-2xs"
                title={t.call_staff_bell}
              >
                <BellRing className="w-3.5 h-3.5 text-amber-700 animate-bounce" />
                <span className="hidden sm:inline">{t.call_staff_bell}</span>
              </button>
            )}
            <LanguageSwitcher theme="light" size="sm" />

            {isTableLockedFromQr ? (
              <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-emerald-500/10 text-emerald-950 border border-emerald-500/30 rounded-full font-black text-xs shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>{t.table_number}{tableNumber}</span>
                <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-full font-bold ml-0.5">
                  {isHindi ? 'क्यूआर' : 'QR'}
                </span>
              </div>
            ) : (
              <button
                onClick={() => setShowTablePicker(true)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-950 border border-amber-500/30 rounded-full font-black text-xs transition active:scale-95 shadow-xs"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{tableNumber ? `${t.table_number}${tableNumber}` : t.select_table}</span>
                <ChevronRight className="w-3.5 h-3.5 text-amber-700" />
              </button>
            )}
          </div>
        </div>

        {/* Floating Active Order Notice */}
        {activeOrderId && (
          <div className="bg-amber-500 text-stone-950 px-4 py-2 flex items-center justify-between text-xs font-bold shadow-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 animate-spin" />
              <span>{t.active_order_banner.replace('{table}', String(tableNumber || ''))}</span>
            </div>
            <button
              onClick={() => router.push(`/r/${slug}/order/${activeOrderId}?table=${tableNumber}`)}
              className="px-2.5 py-1 bg-stone-950 text-white rounded-lg text-[11px] font-black uppercase tracking-wider transition active:scale-95"
            >
              {t.btn_track_order}
            </button>
          </div>
        )}

        {/* 2. Search & Veg Toggle Bar */}
        <div className="max-w-lg mx-auto px-4 py-2.5 flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder={t.search_placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-stone-100 text-stone-900 text-xs rounded-xl border border-stone-200/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder:text-stone-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Veg Only Toggle */}
          <button
            onClick={() => setVegOnly(!vegOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black border transition active:scale-95 ${
              vegOnly
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
          >
            <div className={`w-3.5 h-3.5 border flex items-center justify-center rounded-xs ${vegOnly ? 'border-white' : 'border-emerald-600'}`}>
              <div className={`w-2 h-2 rounded-full ${vegOnly ? 'bg-white' : 'bg-emerald-600'}`} />
            </div>
            <span>{t.veg_label}</span>
          </button>
        </div>

        {/* 3. Category Horizontal Pills (Food App Style) */}
        <div className="max-w-lg mx-auto px-4 pb-2.5 flex items-center gap-1.5 no-scrollbar overflow-x-auto">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition active:scale-95 ${
              selectedCategory === 'ALL'
                ? 'bg-stone-950 text-white shadow-xs'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
            }`}
          >
            {t.all_items}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition active:scale-95 ${
                selectedCategory === cat.id
                  ? 'bg-stone-950 text-white shadow-xs'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              {translateCategoryName(cat.name, isHindi)}
            </button>
          ))}
        </div>
      </header>

      {/* 4. Menu Items List (Mobile Card Style with Floating Image Stepper) */}
      <main className={`max-w-lg mx-auto px-4 ${activeOrderId ? 'pt-44' : 'pt-36'} space-y-3`}>
        {filteredItems.length === 0 ? (
          <div className="py-20 text-center text-stone-400">
            <UtensilsCrossed className="w-12 h-12 mx-auto mb-2 text-stone-300 opacity-60" />
            <p className="font-bold text-stone-700 text-sm">{t.no_items_found}</p>
            <p className="text-xs text-stone-400 mt-0.5">{t.no_items_desc}</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const inCart = cart[item.id];
            const isSoldOut = !item.is_available;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-3.5 border border-stone-200/90 shadow-xs flex items-center justify-between gap-3.5 transition-all ${
                  isSoldOut ? 'opacity-60 bg-stone-50/80' : 'hover:border-stone-300'
                }`}
              >
                {/* Left Description & Pricing */}
                <div className="flex-1 min-w-0 pr-1">
                  {/* Veg / Non-Veg badge */}
                  <div className="flex items-center gap-1.5 mb-1">
                    <div
                      className={`w-3.5 h-3.5 border flex items-center justify-center rounded-xs ${
                        item.is_veg
                          ? 'border-emerald-600'
                          : 'border-rose-600'
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          item.is_veg ? 'bg-emerald-600' : 'bg-rose-600'
                        }`}
                      />
                    </div>
                    {isSoldOut && (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-wider rounded-md">
                        {t.sold_out}
                      </span>
                    )}
                  </div>

                  {/* Title & Price */}
                  <h3 className="font-extrabold text-sm sm:text-base text-stone-900 leading-tight">
                    {translateFoodName(item.name, isHindi)}
                  </h3>
                  <div className="font-black text-sm text-stone-950 mt-1">
                    {currency}{item.price % 1 === 0 ? item.price.toFixed(0) : item.price.toFixed(2)}
                  </div>

                  {/* Description */}
                  {item.description && (
                    <p className="text-[11px] text-stone-500 line-clamp-2 mt-1 leading-relaxed">
                      {translateFoodDescription(item.description, isHindi)}
                    </p>
                  )}
                </div>

                {/* Right: Food Image with Floating Add / Stepper Button */}
                <div className="relative flex-shrink-0">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shadow-inner">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl bg-stone-100">
                        🍔
                      </div>
                    )}
                  </div>

                  {/* Floating Action Button */}
                  {!isSoldOut ? (
                    inCart ? (
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-stone-950 text-white rounded-xl shadow-lg px-2 py-1 flex items-center gap-2 border border-stone-800">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-5 h-5 rounded-md hover:bg-stone-850 flex items-center justify-center active:scale-90"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5 text-stone-300" />
                        </button>
                        <span className="text-xs font-black w-4 text-center text-amber-400">
                          {inCart.quantity}
                        </span>
                        <button
                          onClick={() => addToCart(item)}
                          className="w-5 h-5 rounded-md hover:bg-stone-850 flex items-center justify-center active:scale-90"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5 text-stone-300" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(item)}
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white hover:bg-stone-50 text-amber-600 font-black text-xs px-3.5 sm:px-4 py-1.5 rounded-xl shadow-md border border-stone-200 active:scale-95 transition flex items-center gap-1 whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>{t.btn_add}</span>
                      </button>
                    )
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* 5. Sticky Floating Mobile Cart Pill */}
      {cartTotalCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between transition-all border border-emerald-500"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-700/80 flex items-center justify-center font-black text-xs">
                {cartTotalCount}
              </div>
              <div className="text-left">
                <p className="text-[11px] text-emerald-100 font-bold uppercase tracking-wider">
                  {t.table_order.replace('{table}', String(tableNumber || ''))}
                </p>
                <p className="text-base font-black text-white leading-tight">
                  {currency}{cartTotalPrice % 1 === 0 ? cartTotalPrice.toFixed(0) : cartTotalPrice.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-black bg-white/20 px-3.5 py-2 rounded-xl">
              <span>{t.btn_view_cart}</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </div>
          </button>
        </div>
      )}

      {/* 6. Slide-Up Mobile Cart Modal Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-950/70 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Drawer Top Pull Handle */}
            <div className="pt-3 pb-1 flex justify-center sm:hidden bg-stone-50">
              <div className="w-12 h-1.5 bg-stone-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-5 py-3 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div>
                <h2 className="font-black text-stone-950 text-base">{t.order_summary}</h2>
                <p className="text-xs text-stone-500 font-semibold">{t.table_number}{tableNumber}</p>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 flex items-center justify-center text-stone-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Items List */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 divide-y divide-stone-100">
              {cartList.map((item) => (
                <div key={item.menuItem.id} className="pt-3 first:pt-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-sm text-stone-900">
                        {translateFoodName(item.menuItem.name, isHindi)}
                      </h4>
                      <p className="text-xs text-stone-500 font-bold">
                        {currency}{item.menuItem.price % 1 === 0 ? item.menuItem.price.toFixed(0) : item.menuItem.price.toFixed(2)} {t.each}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 bg-stone-100 rounded-xl px-2 py-1">
                      <button
                        onClick={() => removeFromCart(item.menuItem.id)}
                        className="w-6 h-6 flex items-center justify-center bg-white rounded-lg shadow-xs text-stone-700 active:scale-90"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-black w-4 text-center text-stone-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => addToCart(item.menuItem)}
                        className="w-6 h-6 flex items-center justify-center bg-white rounded-lg shadow-xs text-stone-700 active:scale-90"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Special Item Instruction */}
                  <input
                    type="text"
                    placeholder={t.cooking_note_placeholder}
                    value={item.notes || ''}
                    onChange={(e) => updateItemNotes(item.menuItem.id, e.target.value)}
                    className="w-full mt-2 text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder:text-stone-400"
                  />
                </div>
              ))}

              {/* Customer Details */}
              <div className="pt-4 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-stone-400">
                  {t.diner_details_title}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder={t.name_placeholder}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <input
                    type="tel"
                    placeholder={t.phone_placeholder}
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <textarea
                  rows={2}
                  placeholder={t.chef_notes_placeholder}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Free Cancellation Window Notice */}
              <div className="pt-3">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 font-medium">
                  <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                  <span>
                    {t.cancel_policy_note}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Place Order Button */}
            <div className="p-5 border-t border-stone-200 bg-stone-50 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-stone-500">{t.total_bill}</span>
                <span className="font-black text-2xl text-stone-950">
                  {currency}{cartTotalPrice % 1 === 0 ? cartTotalPrice.toFixed(0) : cartTotalPrice.toFixed(2)}
                </span>
              </div>

              <button
                disabled={isSubmitting}
                onClick={handlePlaceOrder}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 text-white font-black rounded-2xl shadow-xl transition flex items-center justify-center gap-2 text-base"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{t.btn_place_order.replace('{table}', String(tableNumber || ''))}</span>
                    <ArrowRight className="w-5 h-5 stroke-[3]" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Table Picker Modal (Only shown when not scanned via QR) */}
      {showTablePicker && !isTableLockedFromQr && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <h3 className="font-black text-lg text-stone-900">{t.select_table_modal_title}</h3>
            <p className="text-xs text-stone-500 mt-1 mb-4">
              {t.select_table_modal_desc}
            </p>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {Array.from({ length: 16 }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    setTableNumber(num);
                    setShowTablePicker(false);
                    router.replace(`/r/${slug}?table=${num}`);
                  }}
                  className={`py-3 rounded-xl font-black text-sm transition ${
                    tableNumber === num
                      ? 'bg-amber-500 text-stone-950 shadow-md ring-2 ring-amber-400'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                  }`}
                >
                  #{num}
                </button>
              ))}
            </div>

            {tableNumber && (
              <button
                onClick={() => setShowTablePicker(false)}
                className="w-full py-2.5 bg-stone-900 text-white rounded-xl text-xs font-bold"
              >
                {t.btn_continue_table.replace('{table}', String(tableNumber))}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating Call Staff Bell Button */}
      {tableNumber && !isCartOpen && (
        <div className="fixed bottom-24 right-4 z-40">
          <button
            type="button"
            onClick={() => setIsStaffBellOpen(true)}
            className="px-3.5 py-2.5 bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-black text-xs rounded-full shadow-2xl shadow-amber-500/40 flex items-center gap-1.5 border-2 border-white transition active:scale-95 group ring-4 ring-amber-500/20"
          >
            <BellRing className="w-4 h-4 text-stone-950 group-hover:animate-bounce" />
            <span>{t.call_staff_bell}</span>
          </button>
        </div>
      )}

      {/* Table Service Bell Modal */}
      {tableNumber && restaurant && (
        <TableServiceBellModal
          isOpen={isStaffBellOpen}
          onClose={() => setIsStaffBellOpen(false)}
          restaurantId={restaurant.id}
          tableNumber={tableNumber}
          orderId={activeOrderId || undefined}
        />
      )}
    </div>
  );
}

export default function CustomerMenuPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-600 font-medium">Opening Menu...</div>}>
      <CustomerMenuContent />
    </Suspense>
  );
}
