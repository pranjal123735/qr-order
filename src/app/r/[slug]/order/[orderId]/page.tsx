'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import { Order } from '@/types/database';
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
  ArrowRight
} from 'lucide-react';

function OrderTrackingContent() {
  const router = useRouter();
  const routeParams = useParams();
  const searchParams = useSearchParams();
  const slug = (routeParams?.slug as string) || 'rustic-grill';
  const orderId = (routeParams?.orderId as string) || '';
  const tableParam = searchParams.get('table');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      setLoading(true);
      const res = await DataStore.getOrder(orderId);
      if (res) {
        setOrder(res);
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
      setCancelError('Failed to cancel order. Please notify waitstaff.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-stone-700">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-bold text-sm tracking-wide">Syncing with Kitchen...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-stone-50 p-6 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-stone-900">Order Not Found</h2>
        <p className="text-xs text-stone-500 mt-1 max-w-xs">
          This order could not be loaded or has expired.
        </p>
        <button
          onClick={() => router.push(`/r/${slug}${tableParam ? `?table=${tableParam}` : ''}`)}
          className="mt-6 px-6 py-3 bg-stone-950 text-white rounded-2xl text-xs font-black shadow-md"
        >
          Back to Menu
        </button>
      </div>
    );
  }

  const tableNumber = order.table_number;
  const isPending = order.status === 'PENDING';
  const isConfirmed = order.status === 'CONFIRMED' || order.status === 'PREPARING';
  const isServed = order.status === 'SERVED' || order.status === 'READY';
  const isCancelled = order.status === 'CANCELLED';
  const isRejected = order.status === 'REJECTED';
  const currency = '₹';

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 pb-24 font-sans select-none antialiased overflow-x-hidden w-full">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/80 px-4 py-3 flex items-center justify-between shadow-xs">
        <button
          onClick={() => router.push(`/r/${slug}?table=${tableNumber}`)}
          className="flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-950 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Menu</span>
        </button>
        <span className="font-black text-sm text-stone-950">
          Order #{order.id.slice(-6).toUpperCase()}
        </span>
        <span className="px-3 py-1 bg-amber-500/15 text-amber-950 border border-amber-500/30 rounded-full font-black text-xs">
          Table #{tableNumber}
        </span>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
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
                  Waiting for Kitchen Confirmation
                </span>
                <h2 className="text-2xl font-black text-stone-950 mt-2">
                  Order Sent to Kitchen!
                </h2>
                <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  Your order has been transmitted to Table #{tableNumber}&apos;s kitchen terminal.
                </p>
              </div>

              {/* ACTIVE CANCEL BUTTON */}
              <div className="pt-2">
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="w-full py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs rounded-2xl border border-rose-200 transition active:scale-98 flex items-center justify-center gap-2 shadow-xs"
                >
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Cancel Order Now</span>
                </button>
                <p className="text-[11px] text-stone-400 mt-2 flex items-center justify-center gap-1 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
                  Free cancellation until kitchen hits &quot;Accept&quot;.
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
                  {order.status === 'PREPARING' ? 'Cooking on the Grill' : 'Order Confirmed'}
                </span>
                <h2 className="text-2xl font-black text-stone-950 mt-2">
                  Chef is Cooking Your Food! 🍳
                </h2>
                <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  The kitchen staff confirmed your order and cooking is underway. Sit back and relax!
                </p>
              </div>

              {/* Cancellation Locked Notice */}
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs text-stone-600 flex items-center justify-center gap-2 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Cooking in progress (cancellation locked)</span>
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
                  Served to Table #{tableNumber}
                </span>
                <h2 className="text-2xl font-black text-stone-950 mt-2">
                  Enjoy Your Meal! 🍽️
                </h2>
                <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  Your dishes have been served. Settle the bill when finished.
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
                  Cancelled
                </span>
                <h2 className="text-xl font-black text-stone-900 mt-2">
                  Order was Cancelled
                </h2>
                <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                  You cancelled this order before the kitchen confirmed it. No charge.
                </p>
              </div>

              <button
                onClick={() => router.push(`/r/${slug}?table=${tableNumber}`)}
                className="w-full py-3 bg-stone-950 text-white text-xs font-black rounded-2xl shadow-md"
              >
                Place New Order
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
                  Declined
                </span>
                <h2 className="text-xl font-black text-stone-900 mt-2">
                  Kitchen Could Not Accept Order
                </h2>
                <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                  One or more dishes are sold out. Please ask waitstaff for recommendations.
                </p>
              </div>

              <button
                onClick={() => router.push(`/r/${slug}?table=${tableNumber}`)}
                className="w-full py-3 bg-stone-950 text-white text-xs font-black rounded-2xl shadow-md"
              >
                Choose Different Dishes
              </button>
            </div>
          )}
        </div>

        {/* 2. Step Progress Bar */}
        {!isCancelled && !isRejected && (
          <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-stone-400 mb-4">
              Order Progress
            </h4>
            <div className="relative flex items-center justify-between text-center">
              <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1 bg-stone-100 -z-0" />

              {/* Step 1: Placed */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-black shadow-xs">
                  ✓
                </div>
                <span className="text-[11px] font-bold text-stone-900 mt-1.5">Sent</span>
              </div>

              {/* Step 2: Confirmed */}
              <div className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition shadow-xs ${
                    isConfirmed || isServed
                      ? 'bg-emerald-500 text-white'
                      : 'bg-stone-200 text-stone-500'
                  }`}
                >
                  {isConfirmed || isServed ? '✓' : '2'}
                </div>
                <span className="text-[11px] font-bold text-stone-900 mt-1.5">Cooking</span>
              </div>

              {/* Step 3: Served */}
              <div className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition shadow-xs ${
                    isServed ? 'bg-blue-600 text-white' : 'bg-stone-200 text-stone-500'
                  }`}
                >
                  {isServed ? '✓' : '3'}
                </div>
                <span className="text-[11px] font-bold text-stone-900 mt-1.5">Served</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. Order Items Receipt */}
        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-stone-500" />
              <h3 className="font-black text-sm text-stone-950">Table #{tableNumber} Items</h3>
            </div>
            <span className="text-xs text-stone-400 font-mono">
              {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="space-y-3">
            {order.items?.map((item) => (
              <div key={item.id} className="flex items-start justify-between text-sm">
                <div className="flex-1 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-stone-100 text-stone-900 font-black text-xs rounded-md">
                      {item.quantity}×
                    </span>
                    <span className="font-bold text-stone-900">
                      {item.item_name}
                    </span>
                  </div>
                  {item.notes && (
                    <p className="text-[11px] text-amber-700 italic pl-7 mt-0.5 font-medium">
                      Note: {item.notes}
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
              <strong className="text-stone-900">Special Note: </strong>
              {order.notes}
            </div>
          )}

          <div className="pt-3 border-t border-stone-100 flex items-center justify-between font-black text-lg text-stone-950">
            <span>Total Bill</span>
            <span>{currency}{order.total_amount.toFixed(0)}</span>
          </div>
        </div>

        {/* 4. Action: Re-Order / Add More Items */}
        {!isCancelled && !isRejected && (
          <button
            onClick={() => router.push(`/r/${slug}?table=${tableNumber}`)}
            className="w-full py-4 bg-stone-950 hover:bg-stone-900 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-98"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span>Order More Drinks or Dishes (Table #{tableNumber})</span>
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
              <h3 className="font-black text-lg text-stone-950">Cancel Your Order?</h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Are you sure you want to cancel Table #{tableNumber}&apos;s order? Once cancelled, you will need to place a new order.
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
                No, Keep
              </button>
              <button
                disabled={isCancelling}
                onClick={handleCancelOrder}
                className="py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center"
              >
                {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
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
