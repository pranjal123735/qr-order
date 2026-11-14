'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import { Order, OrderItemReview } from '@/types/database';
import { DataStore } from '@/lib/store';
import { audioManager } from '@/lib/audio';
import { 
  Clock, 
  XCircle, 
  ChefHat, 
  Utensils, 
  AlertTriangle, 
  ArrowLeft, 
  PlusCircle, 
  ShieldCheck,
  Receipt,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Star,
  Rocket,
  Flame,
  Check
} from 'lucide-react';
import { useLanguage, LanguageSwitcher } from '@/lib/i18n';
import { translateFoodName } from '@/lib/foodTranslations';

function OrderTrackingContent() {
  const router = useRouter();
  const routeParams = useParams();
  const searchParams = useSearchParams();
  const slug = (routeParams?.slug as string) || 'rustic-grill';
  const orderId = (routeParams?.orderId as string) || '';
  const tableParam = searchParams.get('table');
  const { t, isHindi } = useLanguage();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Per-dish reviews & overall rating state
  const [overallRating, setOverallRating] = useState<number>(5);
  const [overallComment, setOverallComment] = useState<string>('');
  const [itemReviews, setItemReviews] = useState<Record<string, OrderItemReview>>({});
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      setLoading(true);
      const res = await DataStore.getOrder(orderId);
      if (res) {
        setOrder(res);
        if (res.feedback) {
          setOverallRating(res.feedback.rating || 5);
          setOverallComment(res.feedback.comment || '');
          if (res.feedback.item_reviews) {
            setItemReviews(res.feedback.item_reviews);
            setReviewSubmitted(true);
          }
        }
      }
      setLoading(false);
    }
    fetchOrder();

    const unsub = DataStore.subscribeToOrder(orderId, (updated) => {
      setOrder((prev) => {
        if (prev?.status === 'PENDING' && updated.status === 'CONFIRMED') {
          audioManager.playSuccessChime();
        } else if (updated.status === 'CANCELLED') {
          audioManager.playCancelTone();
        }
        return updated;
      });
      if (updated.feedback) {
        setOverallRating(updated.feedback.rating || 5);
        setOverallComment(updated.feedback.comment || '');
        if (updated.feedback.item_reviews) {
          setItemReviews(updated.feedback.item_reviews);
          setReviewSubmitted(true);
        }
      }
    });

    return () => unsub();
  }, [orderId]);

  const handleCancelOrder = async () => {
    try {
      setIsCancelling(true);
      setCancelError(null);
      const result = await DataStore.cancelOrder(orderId);
      if (result.success) {
        setShowCancelConfirm(false);
        const updated = await DataStore.getOrder(orderId);
        if (updated) setOrder(updated);
        audioManager.playCancelTone();
      } else {
        setCancelError(result.message);
      }
    } catch {
      setCancelError(t.cancel_error_default);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleItemRatingChange = (itemId: string, rating: number) => {
    setItemReviews(prev => ({
      ...prev,
      [itemId]: {
        item_id: itemId,
        rating,
        remark: prev[itemId]?.remark || '',
      },
    }));
  };

  const handleItemRemarkChange = (itemId: string, remark: string) => {
    setItemReviews(prev => ({
      ...prev,
      [itemId]: {
        item_id: itemId,
        rating: prev[itemId]?.rating || 5,
        remark,
      },
    }));
  };

  const handleSubmitReview = async () => {
    if (!order) return;
    try {
      setIsSubmittingReview(true);
      await DataStore.submitOrderFeedback(order.id, {
        rating: overallRating,
        comment: overallComment,
        created_at: new Date().toISOString(),
        item_reviews: itemReviews,
      });
      setReviewSubmitted(true);
      const updated = await DataStore.getOrder(order.id);
      if (updated) setOrder(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-stone-700">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-bold text-sm tracking-wide">{t.syncing_kitchen}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-stone-50 p-6 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-stone-900">{t.order_not_found}</h2>
        <p className="text-xs text-stone-500 mt-1 max-w-xs">
          {t.order_expired_desc}
        </p>
        <button
          onClick={() => router.push(`/r/${slug}${tableParam ? `?table=${tableParam}` : ''}`)}
          className="mt-6 px-6 py-3 bg-stone-950 text-white rounded-2xl text-xs font-black shadow-md transition active:scale-95"
        >
          {t.btn_back_to_menu}
        </button>
      </div>
    );
  }

  const tableNumber = order.table_number;
  const isPending = order.status === 'PENDING';
  const isConfirmed = order.status === 'CONFIRMED' || order.status === 'PREPARING';
  const isOnTheWay = order.status === 'ON_THE_WAY' || order.status === 'READY';
  const isServed = order.status === 'SERVED';
  const isCancelled = order.status === 'CANCELLED';
  const isRejected = order.status === 'REJECTED';
  const currency = '₹';

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 pb-24 font-sans select-none antialiased overflow-x-clip w-full">
      {/* Top Navbar - Fixed at top */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-200/80 px-4 py-3 flex items-center justify-between shadow-xs gap-2">
        <button
          onClick={() => router.push(`/r/${slug}?table=${tableNumber}`)}
          className="flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-950 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.btn_back_to_menu}</span>
        </button>

        <span className="font-black text-xs sm:text-sm text-stone-950">
          {t.order_hash}{order.id.slice(-6).toUpperCase()}
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          <LanguageSwitcher theme="light" size="sm" />
          <span className="px-2.5 sm:px-3 py-1 bg-amber-500/15 text-amber-950 border border-amber-500/30 rounded-full font-black text-xs">
            {t.table_number}{tableNumber}
          </span>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 pt-16 space-y-4">
        {/* 1. Live Animated Status Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-md text-center space-y-5">
          {/* PENDING STATE */}
          {isPending && (
            <div className="space-y-4">
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-amber-400 opacity-40 animate-ping" />
                <div className="relative w-16 h-16 bg-amber-500 text-stone-950 rounded-full flex items-center justify-center shadow-lg">
                  <Clock className="w-8 h-8 stroke-[2.5]" />
                </div>
              </div>

              <div>
                <span className="px-3 py-1 bg-amber-100 text-amber-900 text-[11px] font-black uppercase tracking-wider rounded-full">
                  {t.status_pending_badge}
                </span>
                <h2 className="text-2xl font-black text-stone-950 mt-2">
                  {t.status_pending_title}
                </h2>
                <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  {t.status_pending_desc.replace('{table}', String(tableNumber))}
                </p>
              </div>

              {/* ACTIVE CANCEL BUTTON */}
              <div className="pt-2">
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="w-full py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs rounded-2xl border border-rose-200 transition active:scale-98 flex items-center justify-center gap-2 shadow-xs"
                >
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>{t.btn_cancel_order_now}</span>
                </button>
                <p className="text-[11px] text-stone-400 mt-2 flex items-center justify-center gap-1 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
                  {t.free_cancel_subtext}
                </p>
              </div>
            </div>
          )}

          {/* CONFIRMED / COOKING STATE */}
          {isConfirmed && (
            <div className="space-y-4">
              <div className="w-18 h-18 bg-emerald-500 text-white rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/25">
                <ChefHat className="w-9 h-9" />
              </div>

              <div>
                <span className="px-3.5 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-black uppercase tracking-wider rounded-full">
                  {order.status === 'PREPARING' ? t.status_cooking_badge : t.status_confirmed_badge}
                </span>
                <h2 className="text-2xl font-black text-stone-950 mt-2">
                  {t.status_cooking_title}
                </h2>
                <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  {t.status_cooking_desc}
                </p>
              </div>

              {/* Cancellation Locked Notice */}
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs text-stone-600 flex items-center justify-center gap-2 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{t.cancellation_locked}</span>
              </div>
            </div>
          )}

          {/* ON THE WAY STATE */}
          {isOnTheWay && (
            <div className="space-y-4">
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-orange-400 opacity-40 animate-ping" />
                <div className="relative w-18 h-18 bg-gradient-to-tr from-amber-500 to-orange-500 text-stone-950 rounded-3xl flex items-center justify-center shadow-xl shadow-orange-500/25">
                  <Rocket className="w-9 h-9 stroke-[2.5]" />
                </div>
              </div>

              <div>
                <span className="px-3.5 py-1 bg-orange-100 text-orange-900 text-[11px] font-black uppercase tracking-wider rounded-full border border-orange-300">
                  {t.status_ontheway_badge}
                </span>
                <h2 className="text-2xl font-black text-stone-950 mt-2">
                  {t.status_ontheway_title.replace('{table}', String(tableNumber))}
                </h2>
                <p className="text-xs text-stone-600 mt-1 max-w-xs mx-auto leading-relaxed">
                  {t.status_ontheway_desc}
                </p>
              </div>
            </div>
          )}

          {/* SERVED STATE */}
          {isServed && (
            <div className="space-y-4">
              <div className="w-18 h-18 bg-blue-600 text-white rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-blue-500/25">
                <Utensils className="w-9 h-9" />
              </div>

              <div>
                <span className="px-3.5 py-1 bg-blue-100 text-blue-800 text-[11px] font-black uppercase tracking-wider rounded-full">
                  {t.status_served_badge.replace('{table}', String(tableNumber))}
                </span>
                <h2 className="text-2xl font-black text-stone-950 mt-2">
                  {t.status_served_title}
                </h2>
                <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  {t.status_served_desc}
                </p>
              </div>
            </div>
          )}

          {/* CANCELLED STATE */}
          {isCancelled && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-stone-200 text-stone-600 rounded-3xl flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8" />
              </div>

              <div>
                <span className="px-3 py-1 bg-stone-200 text-stone-700 text-[11px] font-black uppercase tracking-wider rounded-full">
                  {t.status_cancelled_badge}
                </span>
                <h2 className="text-xl font-black text-stone-900 mt-2">
                  {t.status_cancelled_title}
                </h2>
                <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                  {t.status_cancelled_desc}
                </p>
              </div>

              <button
                onClick={() => router.push(`/r/${slug}?table=${tableNumber}`)}
                className="w-full py-3 bg-stone-950 text-white text-xs font-black rounded-2xl shadow-md transition active:scale-95"
              >
                {t.btn_place_new_order}
              </button>
            </div>
          )}

          {/* REJECTED STATE */}
          {isRejected && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8" />
              </div>

              <div>
                <span className="px-3 py-1 bg-rose-100 text-rose-800 text-[11px] font-black uppercase tracking-wider rounded-full">
                  {t.status_declined_badge}
                </span>
                <h2 className="text-xl font-black text-stone-900 mt-2">
                  {t.status_declined_title}
                </h2>
                <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                  {t.status_declined_desc}
                </p>
              </div>

              <button
                onClick={() => router.push(`/r/${slug}?table=${tableNumber}`)}
                className="w-full py-3 bg-stone-950 text-white text-xs font-black rounded-2xl shadow-md transition active:scale-95"
              >
                {t.btn_choose_different}
              </button>
            </div>
          )}
        </div>

        {/* 2. Step Progress Bar */}
        {!isCancelled && !isRejected && (
          <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-stone-400 mb-4">
              {t.step_progress_title}
            </h4>
            <div className="relative flex items-center justify-between text-center">
              <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1 bg-stone-100 -z-0" />

              {/* Step 1: Placed */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-black shadow-xs">
                  ✓
                </div>
                <span className="text-[10px] font-bold text-stone-900 mt-1.5">{t.step_sent}</span>
              </div>

              {/* Step 2: Cooking */}
              <div className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition shadow-xs ${
                    isConfirmed || isOnTheWay || isServed
                      ? 'bg-emerald-500 text-white'
                      : 'bg-stone-200 text-stone-500'
                  }`}
                >
                  {isConfirmed || isOnTheWay || isServed ? '✓' : '2'}
                </div>
                <span className="text-[10px] font-bold text-stone-900 mt-1.5">{t.step_cooking}</span>
              </div>

              {/* Step 3: On The Way */}
              <div className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition shadow-xs ${
                    isOnTheWay || isServed
                      ? 'bg-orange-500 text-white shadow-orange-500/30'
                      : 'bg-stone-200 text-stone-500'
                  }`}
                >
                  {isServed ? '✓' : isOnTheWay ? '🚀' : '3'}
                </div>
                <span className="text-[10px] font-bold text-stone-900 mt-1.5">{t.step_ontheway}</span>
              </div>

              {/* Step 4: Served */}
              <div className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition shadow-xs ${
                    isServed ? 'bg-blue-600 text-white' : 'bg-stone-200 text-stone-500'
                  }`}
                >
                  {isServed ? '✓' : '4'}
                </div>
                <span className="text-[10px] font-bold text-stone-900 mt-1.5">{t.step_served}</span>
              </div>
            </div>
          </div>
        )}

        {/* 2b. Eye-Appealing Live Dish-by-Dish Status Tracker */}
        {!isCancelled && !isRejected && order.items && order.items.length > 0 && (() => {
          const items = order.items;
          const totalItemsCount = items.length;
          const readyItemsCount = items.filter(it => it.item_status === 'READY' || it.is_prepared).length;
          const cookingItemsCount = items.filter(it => it.item_status === 'COOKING').length;
          const queuedItemsCount = items.filter(it => it.item_status === 'QUEUED' || (!it.item_status && !it.is_prepared && !isPending)).length;
          const pendingItemsCount = isPending ? totalItemsCount : items.filter(it => it.item_status === 'PENDING').length;

          const readyPct = totalItemsCount > 0 ? (readyItemsCount / totalItemsCount) * 100 : 0;
          const cookingPct = totalItemsCount > 0 ? (cookingItemsCount / totalItemsCount) * 100 : 0;
          const queuedPct = totalItemsCount > 0 ? ((queuedItemsCount + (isPending ? 0 : pendingItemsCount)) / totalItemsCount) * 100 : 0;

          return (
            <div className="bg-white rounded-3xl p-5 border border-stone-200/90 shadow-sm space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center flex-shrink-0">
                    <ChefHat className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-stone-950 flex items-center gap-2">
                      <span>{t.live_dish_tracker_title}</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                        {totalItemsCount} {isHindi ? 'व्यंजन' : 'items'}
                      </span>
                    </h3>
                    <p className="text-[11px] text-stone-500 font-medium">
                      {t.live_dish_tracker_subtitle}
                    </p>
                  </div>
                </div>
              </div>

              {/* Visual Multi-Segment Progress Strip */}
              <div className="space-y-1.5">
                <div className="h-2.5 w-full bg-stone-100 rounded-full overflow-hidden flex gap-1 p-0.5">
                  {readyPct > 0 && (
                    <div 
                      style={{ width: `${readyPct}%` }} 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      title={`${readyItemsCount} Ready`}
                    />
                  )}
                  {cookingPct > 0 && (
                    <div 
                      style={{ width: `${cookingPct}%` }} 
                      className="h-full bg-amber-500 rounded-full animate-pulse transition-all duration-500"
                      title={`${cookingItemsCount} Cooking`}
                    />
                  )}
                  {queuedPct > 0 && (
                    <div 
                      style={{ width: `${queuedPct}%` }} 
                      className="h-full bg-stone-300 rounded-full transition-all duration-500"
                      title={`${queuedItemsCount} Queued`}
                    />
                  )}
                </div>

                {/* Status Summary Pills */}
                <div className="flex items-center justify-between text-[11px] font-bold text-stone-500 px-0.5 flex-wrap gap-1.5 pt-0.5">
                  {readyItemsCount > 0 && (
                    <span className="flex items-center gap-1 text-emerald-700 font-black">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{readyItemsCount} {isHindi ? 'तैयार' : 'Ready'}</span>
                    </span>
                  )}
                  {cookingItemsCount > 0 && (
                    <span className="flex items-center gap-1 text-amber-700 font-black">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      <span>{cookingItemsCount} {isHindi ? 'पक रहा है' : 'Cooking'}</span>
                    </span>
                  )}
                  {(queuedItemsCount > 0 || (isPending && totalItemsCount > 0)) && (
                    <span className="flex items-center gap-1 text-stone-500 font-medium">
                      <span className="w-2 h-2 rounded-full bg-stone-400" />
                      <span>
                        {isPending 
                          ? `${totalItemsCount} ${isHindi ? 'पुष्टि की प्रतीक्षा' : 'Awaiting Confirmation'}`
                          : `${queuedItemsCount} ${isHindi ? 'कतार में' : 'In Queue'}`
                        }
                      </span>
                    </span>
                  )}
                </div>
              </div>

              {/* Individual Dishes List */}
              <div className="space-y-2 pt-1 divide-y divide-stone-100">
                {items.map((item) => {
                  let status: 'READY' | 'COOKING' | 'QUEUED' | 'PENDING' = 'QUEUED';
                  if (isPending) {
                    status = 'PENDING';
                  } else if (item.is_prepared || item.item_status === 'READY') {
                    status = 'READY';
                  } else if (item.item_status === 'COOKING') {
                    status = 'COOKING';
                  } else if (item.item_status === 'PENDING') {
                    status = 'PENDING';
                  } else {
                    status = 'QUEUED';
                  }

                  return (
                    <div 
                      key={item.id} 
                      className={`pt-2.5 first:pt-0 flex items-center justify-between gap-3 transition-all ${
                        status === 'COOKING' ? 'p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-xs' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Quantity Tag */}
                        <span className="px-2 py-0.5 bg-stone-100 text-stone-900 font-black text-xs rounded-lg shrink-0">
                          {item.quantity}×
                        </span>

                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs sm:text-sm text-stone-900 truncate">
                            {translateFoodName(item.item_name, isHindi)}
                          </h4>
                          {item.notes && (
                            <p className="text-[10px] text-amber-700 italic truncate font-medium">
                              Note: {item.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Dish Status Pill */}
                      <div className="shrink-0">
                        {status === 'READY' && (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-[11px] font-black flex items-center gap-1 shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                            <span>{t.dish_status_ready}</span>
                          </span>
                        )}
                        {status === 'COOKING' && (
                          <span className="px-2.5 py-1 bg-amber-500 text-stone-950 border border-amber-400 rounded-full text-[11px] font-black flex items-center gap-1 shadow-xs animate-pulse">
                            <Flame className="w-3.5 h-3.5 fill-stone-950 inline" />
                            <span>{t.dish_status_cooking}</span>
                          </span>
                        )}
                        {status === 'QUEUED' && (
                          <span className="px-2.5 py-1 bg-stone-100 text-stone-600 border border-stone-200 rounded-full text-[11px] font-bold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-stone-400 inline" />
                            <span>{t.dish_status_queued}</span>
                          </span>
                        )}
                        {status === 'PENDING' && (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-[11px] font-bold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-600 inline" />
                            <span>{t.dish_status_pending}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* 3. Order Items Receipt & Live Cooked Status */}
        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-stone-500" />
              <h3 className="font-black text-sm text-stone-950">
                {t.receipt_table_items.replace('{table}', String(tableNumber))}
              </h3>
            </div>
            <span className="text-xs text-stone-400 font-mono">
              {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="space-y-3">
            {order.items?.map((item) => (
              <div key={item.id} className="flex items-start justify-between text-sm py-1.5 border-b border-stone-50 last:border-0">
                <div className="flex-1 pr-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 bg-stone-100 text-stone-900 font-black text-xs rounded-md">
                      {item.quantity}×
                    </span>
                    <span className="font-bold text-stone-900">
                      {translateFoodName(item.item_name, isHindi)}
                    </span>
                    {/* Real-time cooked status badge */}
                    {item.is_prepared ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" /> {t.cooked_and_ready}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-medium rounded-md">
                        {t.preparing_status}
                      </span>
                    )}
                  </div>
                  {item.notes && (
                    <p className="text-[11px] text-amber-700 italic pl-7 mt-0.5 font-medium">
                      {t.special_note_label}{item.notes}
                    </p>
                  )}
                </div>
                <span className="font-black text-stone-900">
                  {currency}{(item.item_price * item.quantity).toFixed(0)}
                </span>
              </div>
            ))}
          </div>

          {order.notes && (
            <div className="p-3 bg-stone-50 rounded-2xl text-xs text-stone-700 border border-stone-200">
              <strong className="text-stone-900">{t.special_note_label}</strong>
              {order.notes}
            </div>
          )}

          <div className="pt-3 border-t border-stone-100 flex items-center justify-between font-black text-lg text-stone-950">
            <span>{t.total_bill}</span>
            <span>{currency}{order.total_amount.toFixed(0)}</span>
          </div>
        </div>

        {/* 4. Per-Dish Rating & Remarks Form (Active when SERVED) */}
        {isServed && (
          <div className="bg-white rounded-3xl p-5 border border-amber-300 shadow-md space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="font-black text-sm text-stone-950">{t.rate_dish_title}</h3>
                <p className="text-[11px] text-stone-500">{t.rate_dish_subtitle}</p>
              </div>
            </div>

            {/* Individual Dishes Review */}
            <div className="space-y-3">
              {order.items?.map((item) => (
                <div key={item.id} className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-stone-900">
                      {item.quantity}× {translateFoodName(item.item_name, isHindi)}
                    </span>
                    {/* Star Rating for this item */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const currentVal = itemReviews[item.id]?.rating ?? item.rating ?? 0;
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleItemRatingChange(item.id, star)}
                            className="p-1 hover:scale-110 transition active:scale-95"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                currentVal >= star
                                  ? 'fill-amber-400 text-amber-500'
                                  : 'text-stone-300'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Remark input for this item */}
                  <input
                    type="text"
                    placeholder={t.remark_for_dish.replace('{dish}', translateFoodName(item.item_name, isHindi))}
                    value={itemReviews[item.id]?.remark ?? item.remark ?? ''}
                    onChange={(e) => handleItemRemarkChange(item.id, e.target.value)}
                    className="w-full px-3 py-1.5 bg-white text-stone-900 text-xs rounded-xl border border-stone-200 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              ))}
            </div>

            {/* Overall Experience Rating */}
            <div className="pt-3 border-t border-stone-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800">{t.overall_meal_rating}</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setOverallRating(star)}
                      className="p-1 hover:scale-110 transition active:scale-95"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          overallRating >= star
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-stone-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                rows={2}
                placeholder={t.overall_comment_placeholder}
                value={overallComment}
                onChange={(e) => setOverallComment(e.target.value)}
                className="w-full p-2.5 bg-stone-50 text-stone-900 text-xs rounded-xl border border-stone-200 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Submit Button */}
            <button
              disabled={isSubmittingReview}
              onClick={handleSubmitReview}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>{reviewSubmitted ? t.btn_update_reviews : t.btn_submit_reviews}</span>
            </button>
            {reviewSubmitted && (
              <p className="text-center text-xs text-emerald-700 font-bold bg-emerald-50 py-1.5 px-3 rounded-xl border border-emerald-200">
                {t.review_submitted_thanks}
              </p>
            )}
          </div>
        )}

        {/* 5. Action: Re-Order / Add More Items */}
        {!isCancelled && !isRejected && (
          <button
            onClick={() => router.push(`/r/${slug}?table=${tableNumber}`)}
            className="w-full py-4 bg-stone-950 hover:bg-stone-900 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-98"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span>{t.btn_order_more.replace('{table}', String(tableNumber))}</span>
          </button>
        )}
      </main>

      {/* Confirmation Modal for Order Cancellation */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg text-stone-950">{t.cancel_modal_title}</h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                {t.cancel_modal_desc.replace('{table}', String(tableNumber))}
              </p>
            </div>

            {cancelError && (
              <p className="text-xs text-rose-600 font-bold p-2 bg-rose-50 rounded-xl">
                {cancelError}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-black text-xs rounded-xl transition"
              >
                {t.btn_keep_order}
              </button>
              <button
                disabled={isCancelling}
                onClick={handleCancelOrder}
                className="py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center"
              >
                {isCancelling ? t.cancelling_text : t.btn_yes_cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-600">Loading Order Tracking...</div>}>
      <OrderTrackingContent />
    </Suspense>
  );
}
