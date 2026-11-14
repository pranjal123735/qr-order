'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Order, OrderStatus, Restaurant } from '@/types/database';
import { DataStore } from '@/lib/store';
import { audioManager } from '@/lib/audio';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { 
  Bell, 
  BellOff, 
  Volume2, 
  Check, 
  X, 
  Clock, 
  ChefHat, 
  Utensils, 
  Flame, 
  RefreshCw,
  BookOpen,
  ArrowLeft,
  Timer,
  CheckCircle2,
  AlertCircle,
  MessageSquare
} from 'lucide-react';

function KitchenLiveOrdersContent() {
  const router = useRouter();
  const routeParams = useParams();
  const slug = (routeParams?.slug as string) || 'rustic-grill';

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'COOKING' | 'SERVED'>('ALL');
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());

  // Interactive dish strike-off for cooker
  const [checkedDishIds, setCheckedDishIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setNowTimestamp(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const prevOrderCountRef = useRef<number>(0);

  const fetchOrders = async (shouldChime = false) => {
    const res = await DataStore.getRestaurant(slug);
    if (res) {
      setRestaurant(res);
      const allOrders = await DataStore.getOrders(res.id);
      if (shouldChime && allOrders.length > prevOrderCountRef.current && audioEnabled) {
        audioManager.playNewOrderChime();
      }
      prevOrderCountRef.current = allOrders.length;
      setOrders(allOrders);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders(false);

    const unsub = DataStore.subscribeToOrders(slug, () => {
      fetchOrders(true);
    });

    const interval = setInterval(() => fetchOrders(false), 8000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [slug, audioEnabled]);

  const toggleAudio = () => {
    const nextState = !audioEnabled;
    setAudioEnabled(nextState);
    audioManager.setMuted(!nextState);
    if (nextState) {
      audioManager.playNewOrderChime();
    }
  };

  const toggleDishChecked = (dishId: string) => {
    setCheckedDishIds(prev => ({
      ...prev,
      [dishId]: !prev[dishId],
    }));
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setProcessingOrderId(orderId);
      await DataStore.updateOrderStatus(orderId, newStatus);
      if (newStatus === 'CONFIRMED' || newStatus === 'SERVED') {
        audioManager.playSuccessChime();
      }
      await fetchOrders();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingOrderId(null);
    }
  };

  const pendingOrders = orders.filter((o) => o.status === 'PENDING');
  const cookingOrders = orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'PREPARING');
  const servedOrders = orders.filter((o) => o.status === 'SERVED' || o.status === 'READY');

  const displayedOrders = orders.filter((o) => {
    if (activeTab === 'PENDING') return o.status === 'PENDING';
    if (activeTab === 'COOKING') return o.status === 'CONFIRMED' || o.status === 'PREPARING';
    if (activeTab === 'SERVED') return o.status === 'SERVED';
    return o.status !== 'CANCELLED' && o.status !== 'REJECTED';
  });

  const getElapsedMinutes = (isoString: string) => {
    const diffMs = nowTimestamp - new Date(isoString).getTime();
    return Math.floor(diffMs / 60000);
  };

  const formatElapsedTimer = (isoString: string) => {
    const diffSeconds = Math.max(0, Math.floor((nowTimestamp - new Date(isoString).getTime()) / 1000));
    const mins = Math.floor(diffSeconds / 60);
    const secs = diffSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const currency = restaurant?.currency || '₹';

  return (
    <AdminAuthGuard slug={slug}>
      <div className="min-h-screen bg-neutral-950 text-stone-100 flex flex-col font-sans select-none antialiased">
      {/* 1. Sleek Top Navigation Bar */}
      <header className="bg-neutral-900 border-b border-neutral-800 px-6 py-3.5 sticky top-0 z-40 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/${slug}/dashboard`}
            className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-stone-300 hover:text-white border border-neutral-700 transition"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg text-white tracking-tight">Kitchen Order Terminal</h1>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[11px] font-bold rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync
              </span>
            </div>
            <p className="text-xs text-stone-400">
              {restaurant?.name || slug} • Table Orders
            </p>
          </div>
        </div>

        {/* Live Digital Clock */}
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl font-mono text-xs">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-stone-400 font-medium">Clock:</span>
          <span className="text-amber-400 font-bold">{currentTime || '12:00:00'}</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleAudio}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              audioEnabled
                ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md'
                : 'bg-neutral-800 text-stone-400 border border-neutral-700'
            }`}
          >
            {audioEnabled ? (
              <>
                <Volume2 className="w-4 h-4 animate-bounce" />
                <span>Audio Alert ON</span>
              </>
            ) : (
              <>
                <BellOff className="w-4 h-4" />
                <span>Muted</span>
              </>
            )}
          </button>

          <button
            onClick={() => router.push(`/admin/${slug}/menu`)}
            className="px-3.5 py-2 bg-neutral-850 hover:bg-neutral-800 text-stone-200 border border-neutral-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Menu & Stock</span>
          </button>

          <button
            onClick={() => fetchOrders(false)}
            className="p-2 bg-neutral-850 hover:bg-neutral-800 text-stone-300 border border-neutral-700 rounded-xl transition"
            title="Refresh Orders"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Status Metric Tabs */}
      <div className="bg-neutral-900/60 border-b border-neutral-800 px-6 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'ALL'
                ? 'bg-amber-500 text-neutral-950 shadow-sm'
                : 'bg-neutral-800 text-stone-300 hover:bg-neutral-750'
            }`}
          >
            <span>All Active</span>
            <span className="px-1.5 py-0.5 rounded-md bg-neutral-950/40 text-[10px] font-bold">
              {orders.filter((o) => o.status !== 'CANCELLED' && o.status !== 'REJECTED').length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'PENDING'
                ? 'bg-amber-500 text-neutral-950 shadow-sm ring-2 ring-amber-400'
                : 'bg-amber-950/40 border border-amber-500/40 text-amber-400 hover:bg-amber-900/40'
            }`}
          >
            <span className="relative flex h-2 w-2">
              {pendingOrders.length > 0 && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              )}
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span>New Orders</span>
            <span className="px-1.5 py-0.5 rounded-md bg-neutral-950/40 text-[10px] font-bold">
              {pendingOrders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('COOKING')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'COOKING'
                ? 'bg-amber-500 text-neutral-950 shadow-sm'
                : 'bg-neutral-800 text-emerald-400 hover:bg-neutral-750'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>Cooking Now</span>
            <span className="px-1.5 py-0.5 rounded-md bg-neutral-950/40 text-[10px] font-bold">
              {cookingOrders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('SERVED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'SERVED'
                ? 'bg-amber-500 text-neutral-950 shadow-sm'
                : 'bg-neutral-800 text-blue-400 hover:bg-neutral-750'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Served</span>
            <span className="px-1.5 py-0.5 rounded-md bg-neutral-950/40 text-[10px] font-bold">
              {servedOrders.length}
            </span>
          </button>
        </div>

        <span className="hidden md:inline text-xs text-stone-400 font-medium">
          💡 Tap any item to check it off as you cook
        </span>
      </div>

      {/* 3. Redesigned Ticket Cards Grid */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="py-24 text-center text-stone-500">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-3 text-amber-500" />
            <p className="font-bold text-stone-300 text-sm">Syncing live kitchen orders...</p>
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="py-24 text-center text-stone-500 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-3">
              <ChefHat className="w-8 h-8 text-stone-500 opacity-60" />
            </div>
            <h3 className="text-lg font-bold text-white">No active orders right now</h3>
            <p className="text-xs text-stone-400 mt-1">
              When diners scan a table QR code and order, tickets will pop up here live.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedOrders.map((order) => {
              const isPending = order.status === 'PENDING';
              const isCooking = order.status === 'CONFIRMED' || order.status === 'PREPARING';
              const isServed = order.status === 'SERVED';
              const isProcessing = processingOrderId === order.id;
              const elapsedMins = getElapsedMinutes(order.created_at);

              const isUrgent = elapsedMins >= 10;
              const isWarning = elapsedMins >= 5 && elapsedMins < 10;

              return (
                <div
                  key={order.id}
                  className={`bg-neutral-900 rounded-3xl border flex flex-col justify-between overflow-hidden shadow-xl transition-all duration-200 ${
                    isPending
                      ? 'border-amber-500/70 shadow-amber-500/5'
                      : isCooking
                      ? 'border-emerald-500/50 shadow-emerald-500/5'
                      : 'border-neutral-800'
                  }`}
                >
                  {/* Clean Card Top Header */}
                  <div className="p-4 bg-neutral-850/80 border-b border-neutral-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {/* Crisp Table Badge */}
                      <span className="px-3.5 py-1.5 bg-amber-500 text-neutral-950 font-black text-sm rounded-xl tracking-tight shadow-sm">
                        TABLE #{order.table_number}
                      </span>
                      <span className="text-xs font-bold text-stone-300 truncate max-w-[110px]">
                        {order.customer_name}
                      </span>
                    </div>

                    {/* Timer Pill */}
                    <div
                      className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs flex items-center gap-1.5 ${
                        isUrgent
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                          : isWarning
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-neutral-950 text-stone-400 border border-neutral-800'
                      }`}
                    >
                      <Timer className="w-3.5 h-3.5" />
                      <span>{formatElapsedTimer(order.created_at)}</span>
                    </div>
                  </div>

                  {/* Body: Clean Checklist with Strike-through */}
                  <div className="p-5 flex-1 space-y-3">
                    <div className="divide-y divide-neutral-800/80">
                      {order.items?.map((item) => {
                        const isChecked = checkedDishIds[item.id];

                        return (
                          <div
                            key={item.id}
                            onClick={() => toggleDishChecked(item.id)}
                            className={`py-3 first:pt-0 last:pb-0 cursor-pointer rounded-xl transition ${
                              isChecked ? 'opacity-40' : 'hover:bg-neutral-850/40'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                {/* Clean Checkbox */}
                                <div
                                  className={`w-5 h-5 rounded-lg flex items-center justify-center border transition flex-shrink-0 ${
                                    isChecked
                                      ? 'bg-emerald-500 border-emerald-500 text-neutral-950'
                                      : 'border-neutral-700 bg-neutral-950'
                                  }`}
                                >
                                  {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </div>

                                {/* Quantity Pill */}
                                <span className="px-2 py-0.5 bg-neutral-800 text-amber-400 font-black text-xs rounded-md flex-shrink-0">
                                  {item.quantity}×
                                </span>

                                {/* Dish Name */}
                                <span
                                  className={`font-bold text-sm text-white flex-1 leading-snug ${
                                    isChecked ? 'line-through text-stone-500' : ''
                                  }`}
                                >
                                  {item.item_name}
                                </span>
                              </div>

                              {/* Price in Rupee */}
                              <span className="text-xs font-mono font-semibold text-stone-400">
                                {currency}{(item.item_price * item.quantity).toFixed(0)}
                              </span>
                            </div>

                            {/* Refined Cooking Note Callout */}
                            {item.notes && (
                              <div className="mt-1.5 ml-8 px-2.5 py-1 bg-amber-500/10 border-l-2 border-amber-500 rounded-r-lg text-xs text-amber-300 font-medium">
                                <span>Note: {item.notes}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Overall Order Notes */}
                    {order.notes && (
                      <div className="mt-2 p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-stone-300 flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-amber-400">Diner Note: </strong>
                          <span>{order.notes}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Clean Bottom Footer & Action Buttons */}
                  <div className="p-4 bg-neutral-850/80 border-t border-neutral-800 flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs font-medium text-stone-400 px-1">
                      <span>Total: <strong className="text-white text-sm font-black">{currency}{order.total_amount.toFixed(0)}</strong></span>
                      <span className="font-mono text-stone-500">#{order.id.slice(-6).toUpperCase()}</span>
                    </div>

                    {/* Pending Action Buttons */}
                    {isPending && (
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          disabled={isProcessing}
                          onClick={() => handleUpdateStatus(order.id, 'REJECTED')}
                          className="py-2.5 px-3 bg-neutral-800 hover:bg-rose-950 border border-neutral-700 hover:border-rose-800 text-rose-400 rounded-xl font-bold text-xs transition active:scale-95 flex items-center justify-center gap-1"
                        >
                          <X className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                        <button
                          disabled={isProcessing}
                          onClick={() => handleUpdateStatus(order.id, 'CONFIRMED')}
                          className="col-span-2 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-neutral-950 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>Accept & Confirm</span>
                        </button>
                      </div>
                    )}

                    {/* Cooking / Preparing Action Buttons */}
                    {isCooking && (
                      <div className="grid grid-cols-2 gap-2">
                        {order.status !== 'PREPARING' && (
                          <button
                            disabled={isProcessing}
                            onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                            className="py-2.5 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs transition active:scale-95 flex items-center justify-center gap-1.5"
                          >
                            <Flame className="w-3.5 h-3.5" />
                            <span>On the Stove</span>
                          </button>
                        )}
                        <button
                          disabled={isProcessing}
                          onClick={() => handleUpdateStatus(order.id, 'SERVED')}
                          className={`py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md ${
                            order.status === 'PREPARING' ? 'col-span-2' : ''
                          }`}
                        >
                          <Utensils className="w-3.5 h-3.5" />
                          <span>Mark as Served</span>
                        </button>
                      </div>
                    )}

                    {/* Served Badge */}
                    {isServed && (
                      <div className="py-2 px-3 bg-neutral-900 border border-neutral-800 text-blue-400 font-bold text-xs rounded-xl text-center flex items-center justify-center gap-1.5">
                        <Check className="w-4 h-4" />
                        <span>Delivered to Table #{order.table_number}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
    </AdminAuthGuard>
  );
}

export default function KitchenLiveOrdersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-950 flex items-center justify-center text-stone-400">Loading Kitchen Terminal...</div>}>
      <KitchenLiveOrdersContent />
    </Suspense>
  );
}
