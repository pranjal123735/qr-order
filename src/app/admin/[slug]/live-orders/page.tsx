'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Order, OrderStatus, Restaurant, ItemPrepStatus, ServiceCall, OrderItem } from '@/types/database';
import { DataStore } from '@/lib/store';
import { audioManager } from '@/lib/audio';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { 
  Bell, 
  BellOff, 
  BellRing,
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
  AlertTriangle,
  MessageSquare,
  Rocket,
  Star,
  RotateCcw,
  SlidersHorizontal,
  ArrowRight,
  CreditCard,
  HelpCircle,
  Droplets,
  UserCheck
} from 'lucide-react';
import { translateFoodName } from '@/lib/foodTranslations';

interface StatusChangeRequest {
  orderId: string;
  tableNumber: number;
  customerName: string;
  currentStatus: OrderStatus;
  newStatus: OrderStatus;
  actionTitle: string;
}

const ALL_KITCHEN_STATUS_OPTIONS: Array<{
  status: OrderStatus;
  label: string;
  desc: string;
  icon: string;
  badgeClass: string;
}> = [
  {
    status: 'PENDING',
    label: 'New Order (Pending)',
    desc: 'Waiting for kitchen accept',
    icon: '⏳',
    badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  {
    status: 'CONFIRMED',
    label: 'Accepted / Confirmed',
    desc: 'Order accepted, in line for stove',
    icon: '✅',
    badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
  {
    status: 'PREPARING',
    label: 'Cooking on Stove',
    desc: 'Chef is actively preparing dishes',
    icon: '🍳',
    badgeClass: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  },
  {
    status: 'ON_THE_WAY',
    label: 'Food Cooked • On the Way',
    desc: 'Cooked dishes being brought to table',
    icon: '🚀',
    badgeClass: 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-400 border-orange-500/30',
  },
  {
    status: 'SERVED',
    label: 'Delivered / Served',
    desc: 'Dishes served to diner table',
    icon: '🍽️',
    badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  {
    status: 'REJECTED',
    label: 'Rejected / Declined',
    desc: 'Items sold out or declined',
    icon: '❌',
    badgeClass: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  },
  {
    status: 'CANCELLED',
    label: 'Cancelled',
    desc: 'Order voided or cancelled',
    icon: '🚫',
    badgeClass: 'bg-stone-500/20 text-stone-400 border-stone-500/30',
  },
];

interface DishStatusChangeRequest {
  orderId: string;
  dishId: string;
  dishName: string;
  tableNumber: number;
  currentStatus: ItemPrepStatus;
  newStatus: ItemPrepStatus;
  actionTitle: string;
}

interface DishPickerState {
  orderId: string;
  dishId: string;
  dishName: string;
  tableNumber: number;
  currentStatus: ItemPrepStatus;
}

const ALL_DISH_STATUS_OPTIONS: Array<{
  status: ItemPrepStatus;
  label: string;
  hindiLabel: string;
  desc: string;
  icon: string;
  badgeClass: string;
}> = [
  {
    status: 'COOKING',
    label: 'Cooking on Stove',
    hindiLabel: 'चूल्हे पर पक रहा है',
    desc: 'Actively preparing & cooking on stove',
    icon: '🍳',
    badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  },
  {
    status: 'ON_THE_WAY',
    label: 'Food Cooked • On the Way',
    hindiLabel: 'तैयार • रास्ते में है',
    desc: 'Dish finished, server carrying to table',
    icon: '🚚',
    badgeClass: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
  },
  {
    status: 'SERVED',
    label: 'Served to Table',
    hindiLabel: 'टेबल पर परोसा गया',
    desc: 'Delivered and placed on diner table',
    icon: '🍽️',
    badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  },
  {
    status: 'REJECTED',
    label: 'Reject Dish (Out of Stock)',
    hindiLabel: 'अस्वीकृत / समाप्त',
    desc: 'Out of stock or cannot be prepared',
    icon: '❌',
    badgeClass: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
  },
  {
    status: 'QUEUED',
    label: 'In Queue (Pending)',
    hindiLabel: 'रसोई कतार में',
    desc: 'Reset or place back into cooking queue',
    icon: '⏳',
    badgeClass: 'bg-neutral-800 text-stone-400 border-neutral-700',
  },
];

function getDishStatusBadgeInfo(status?: ItemPrepStatus) {
  switch (status) {
    case 'COOKING':
      return { label: 'Cooking', hindi: 'चूल्हे पर', icon: '🍳', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40' };
    case 'ON_THE_WAY':
      return { label: 'On the Way', hindi: 'रास्ते में', icon: '🚚', color: 'bg-orange-500/20 text-orange-400 border-orange-500/40' };
    case 'SERVED':
      return { label: 'Served', hindi: 'परोसा गया', icon: '🍽️', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' };
    case 'REJECTED':
      return { label: 'Rejected', hindi: 'अस्वीकृत', icon: '❌', color: 'bg-rose-500/20 text-rose-400 border-rose-500/40' };
    case 'READY':
      return { label: 'Ready', hindi: 'तैयार', icon: '✓', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' };
    case 'PENDING':
    case 'QUEUED':
    default:
      return { label: 'In Queue', hindi: 'कतार में', icon: '⏳', color: 'bg-neutral-800 text-stone-400 border-neutral-700' };
  }
}

function getStatusBadgeInfo(status: OrderStatus) {
  switch (status) {
    case 'PENDING':
      return { label: 'New Order (Pending)', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
    case 'CONFIRMED':
      return { label: 'Accepted / Confirmed', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    case 'PREPARING':
      return { label: 'Cooking on Stove', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
    case 'ON_THE_WAY':
    case 'READY':
      return { label: 'On the Way to Table', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
    case 'SERVED':
      return { label: 'Served to Table', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
    case 'REJECTED':
      return { label: 'Rejected / Declined', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
    case 'CANCELLED':
      return { label: 'Cancelled', color: 'bg-stone-500/20 text-stone-400 border-stone-500/30' };
    default:
      return { label: status, color: 'bg-stone-800 text-stone-300 border-stone-700' };
  }
}

function getAnnouncementText(call: ServiceCall): string {
  if (call.type === 'BILL') {
    return `Table ${call.table_number}: Requesting bill and payment.${call.notes ? ' ' + call.notes : ''}`;
  }
  if (call.type === 'FOOD_INFO') {
    return `Table ${call.table_number}: Food info requested for ${call.item_name || 'dish'}.${call.notes ? ' ' + call.notes : ''}`;
  }
  if (call.type === 'DOUBT') {
    return `Table ${call.table_number}: Customer has a question or doubt.${call.notes ? ' ' + call.notes : ''}`;
  }
  if (call.type === 'FEEDBACK') {
    return `Table ${call.table_number}: Customer requested feedback or manager.${call.notes ? ' ' + call.notes : ''}`;
  }
  if (call.type === 'WATER') {
    return `Table ${call.table_number}: Requesting water or cutlery.${call.notes ? ' ' + call.notes : ''}`;
  }
  return `Table ${call.table_number}: Calling waiter to table.${call.notes ? ' ' + call.notes : ''}`;
}

function KitchenLiveOrdersContent() {
  const router = useRouter();
  const routeParams = useParams();
  const slug = (routeParams?.slug as string) || 'rustic-grill';

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'COOKING' | 'ON_THE_WAY' | 'SERVED'>('ALL');
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());

  // Interactive dish strike-off for cooker (synced across tabs/database)
  const [checkedDishIds, setCheckedDishIds] = useState<Record<string, boolean>>({});

  // Live Table Service Bells & Calls state
  const [serviceCalls, setServiceCalls] = useState<ServiceCall[]>([]);
  const prevCallsCountRef = useRef<number>(0);
  const knownCallIdsRef = useRef<Set<string>>(new Set());

  // Confirmation modal and Undo / manual status picker state
  const [confirmDialog, setConfirmDialog] = useState<StatusChangeRequest | null>(null);
  const [statusPickerOrder, setStatusPickerOrder] = useState<Order | null>(null);

  // Dish-level confirmation modal & status picker state
  const [dishConfirmDialog, setDishConfirmDialog] = useState<DishStatusChangeRequest | null>(null);
  const [dishPicker, setDishPicker] = useState<DishPickerState | null>(null);

  // Anti-Abuse: Manager Snoozed Tables map (table_number -> expire timestamp)
  const [snoozedTables, setSnoozedTables] = useState<Record<number, number>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`tablebite_snoozed_${slug}`);
      if (stored) {
        setSnoozedTables(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, [slug]);

  const isTableSnoozed = (tbl: number) => {
    const expire = snoozedTables[tbl];
    return Boolean(expire && expire > Date.now());
  };

  const handleSnoozeTable = (tbl: number) => {
    const until = Date.now() + 5 * 60 * 1000; // 5 minutes snooze
    setSnoozedTables(prev => {
      const next = { ...prev, [tbl]: until };
      try { localStorage.setItem(`tablebite_snoozed_${slug}`, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  const handleUnsnoozeTable = (tbl: number) => {
    setSnoozedTables(prev => {
      const next = { ...prev };
      delete next[tbl];
      try { localStorage.setItem(`tablebite_snoozed_${slug}`, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  // Auto-unlock audio and speech on any initial interaction anywhere on screen
  useEffect(() => {
    const handleUserInteraction = () => {
      audioManager.unlockAudio();
      setAudioUnlocked(true);
    };
    window.addEventListener('click', handleUserInteraction, { once: true });
    window.addEventListener('touchstart', handleUserInteraction, { once: true });
    window.addEventListener('keydown', handleUserInteraction, { once: true });
    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);

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
      const [allOrders, calls] = await Promise.all([
        DataStore.getOrders(res.id),
        DataStore.getServiceCalls(res.id),
      ]);

      const pendingCalls = calls.filter(c => c.status === 'PENDING');
      const newCalls = pendingCalls.filter(c => !knownCallIdsRef.current.has(c.id));

      if (shouldChime && audioEnabled) {
        // Filter out snoozed tables from voice announcements and bell rings
        const eligibleCalls = newCalls.filter(c => !isTableSnoozed(c.table_number));
        if (eligibleCalls.length > 0) {
          // Play desk bell AND speak the latest service call announcement
          const latestCall = eligibleCalls[0];
          const speakText = getAnnouncementText(latestCall);
          if (speechEnabled) {
            audioManager.ringAndAnnounce(speakText);
          } else {
            audioManager.playServiceBell();
          }
        } else if (allOrders.length > prevOrderCountRef.current) {
          audioManager.playNewOrderChime();
        }
      }

      // Mark calls as known
      pendingCalls.forEach(c => knownCallIdsRef.current.add(c.id));

      prevOrderCountRef.current = allOrders.length;
      prevCallsCountRef.current = pendingCalls.length;
      setServiceCalls(pendingCalls);

      // sync prepared dishes map
      const initialChecked: Record<string, boolean> = {};
      allOrders.forEach(o => {
        o.items?.forEach(it => {
          if (it.is_prepared) {
            initialChecked[it.id] = true;
          }
        });
      });
      setCheckedDishIds(prev => ({ ...initialChecked, ...prev }));

      setOrders(allOrders);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders(false);

    const unsubOrders = DataStore.subscribeToOrders(slug, () => {
      fetchOrders(true);
    });

    const unsubCalls = DataStore.subscribeToServiceCalls(slug, () => {
      fetchOrders(true);
    });

    const interval = setInterval(() => fetchOrders(false), 8000);

    return () => {
      unsubOrders();
      unsubCalls();
      clearInterval(interval);
    };
  }, [slug, audioEnabled]);

  const handleResolveCall = async (callId: string) => {
    await DataStore.resolveServiceCall(callId);
    setServiceCalls(prev => prev.filter(c => c.id !== callId));
  };

  const toggleAudio = () => {
    const nextState = !audioEnabled;
    setAudioEnabled(nextState);
    audioManager.setMuted(!nextState);
    if (nextState) {
      audioManager.playNewOrderChime();
    }
  };

  const toggleDishChecked = async (orderId: string, dishId: string, currentVal: boolean) => {
    const newVal = !currentVal;
    setCheckedDishIds(prev => ({
      ...prev,
      [dishId]: newVal,
    }));
    await DataStore.updateOrderItemStatus(orderId, dishId, newVal ? 'READY' : 'COOKING');
    fetchOrders(false);
  };

  const cycleDishStatus = async (orderId: string, dishId: string, currentStatus?: ItemPrepStatus, isPrepared?: boolean) => {
    let effective: ItemPrepStatus = currentStatus || (isPrepared ? 'READY' : 'COOKING');
    let nextStatus: ItemPrepStatus = 'COOKING';
    if (effective === 'QUEUED' || effective === 'PENDING') {
      nextStatus = 'COOKING';
    } else if (effective === 'COOKING') {
      nextStatus = 'READY';
    } else if (effective === 'READY') {
      nextStatus = 'QUEUED';
    }
    setCheckedDishIds(prev => ({ ...prev, [dishId]: nextStatus === 'READY' }));
    await DataStore.updateOrderItemStatus(orderId, dishId, nextStatus);
    fetchOrders(false);
  };

  const promptDishStatusChange = (
    order: Order,
    item: OrderItem,
    newStatus: ItemPrepStatus,
    actionTitle?: string
  ) => {
    const currentStatus = item.item_status || (checkedDishIds[item.id] || item.is_prepared ? 'READY' : (order.status === 'PENDING' ? 'PENDING' : 'QUEUED'));
    setDishConfirmDialog({
      orderId: order.id,
      dishId: item.id,
      dishName: item.item_name,
      tableNumber: order.table_number,
      currentStatus,
      newStatus,
      actionTitle: actionTitle || `Set to ${getDishStatusBadgeInfo(newStatus).label}`,
    });
  };

  const confirmAndUpdateDishStatus = async () => {
    if (!dishConfirmDialog) return;
    const { orderId, dishId, newStatus } = dishConfirmDialog;
    setDishConfirmDialog(null);
    setDishPicker(null);

    setCheckedDishIds(prev => ({ ...prev, [dishId]: newStatus === 'SERVED' || newStatus === 'READY' }));
    await DataStore.updateOrderItemStatus(orderId, dishId, newStatus);
    if (newStatus === 'ON_THE_WAY' || newStatus === 'SERVED') {
      audioManager.playSuccessChime();
    } else if (newStatus === 'REJECTED') {
      audioManager.playCancelTone();
    }
    await fetchOrders(false);
  };

  const promptStatusChange = (order: Order, newStatus: OrderStatus, actionTitle?: string) => {
    setConfirmDialog({
      orderId: order.id,
      tableNumber: order.table_number,
      customerName: order.customer_name,
      currentStatus: order.status,
      newStatus,
      actionTitle: actionTitle || `Change status to ${newStatus}`,
    });
  };

  const confirmAndUpdateStatus = async () => {
    if (!confirmDialog) return;
    const { orderId, newStatus } = confirmDialog;
    setConfirmDialog(null);
    setStatusPickerOrder(null);
    await handleUpdateStatus(orderId, newStatus);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setProcessingOrderId(orderId);
      await DataStore.updateOrderStatus(orderId, newStatus);
      if (newStatus === 'CONFIRMED' || newStatus === 'SERVED' || newStatus === 'ON_THE_WAY') {
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
  const onTheWayOrders = orders.filter((o) => o.status === 'ON_THE_WAY' || o.status === 'READY');
  const servedOrders = orders.filter((o) => o.status === 'SERVED');

  const displayedOrders = orders.filter((o) => {
    if (activeTab === 'PENDING') return o.status === 'PENDING';
    if (activeTab === 'COOKING') return o.status === 'CONFIRMED' || o.status === 'PREPARING';
    if (activeTab === 'ON_THE_WAY') return o.status === 'ON_THE_WAY' || o.status === 'READY';
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

  const currency = (!restaurant?.currency || restaurant.currency === '$') ? '₹' : restaurant.currency;

  return (
    <AdminAuthGuard slug={slug}>
      <div className="min-h-screen bg-neutral-950 text-stone-100 flex flex-col font-sans select-none antialiased overflow-x-clip w-full">
      {/* 1. Permanently Fixed Top Header & Tabs Bar */}
      <div className="fixed top-0 inset-x-0 z-50 bg-neutral-900 border-b border-neutral-800 shadow-2xl backdrop-blur-md">
        {/* Audio / Voice Autoplay Permission Unlock Banner */}
        {!audioUnlocked && (
          <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-orange-400 text-stone-950 px-4 py-2 text-xs font-black flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 animate-bounce" />
              <span>Tap anywhere or click to activate live Kitchen Bell & Voice Announcements</span>
            </div>
            <button
              onClick={async () => {
                await audioManager.unlockAudio();
                setAudioUnlocked(true);
                audioManager.ringAndAnnounce('Kitchen audio and speech announcements active!');
              }}
              className="px-3.5 py-1.5 bg-stone-950 hover:bg-stone-900 text-white rounded-xl text-xs font-black shadow-md transition active:scale-95"
            >
              Enable Sound & Voice 🔊
            </button>
          </div>
        )}

        {/* Sleek Top Navigation Bar */}
        <header className="px-3.5 sm:px-6 py-3 sm:py-3.5 flex flex-wrap items-center justify-between gap-2.5 sm:gap-4 border-b border-neutral-800/80">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <Link
              href={`/admin/${slug}/dashboard`}
              className="p-2 sm:p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-stone-300 hover:text-white border border-neutral-700 transition shrink-0"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg text-white tracking-tight truncate">Kitchen Terminal</h1>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] sm:text-[11px] font-bold rounded-full border border-emerald-500/30 flex items-center gap-1.5 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-stone-400 truncate">
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
          <div className="flex items-center gap-2 shrink-0">
            {serviceCalls.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-neutral-950 rounded-xl text-xs font-black shadow-lg animate-bounce">
                <BellRing className="w-4 h-4 stroke-[2.5]" />
                <span>{serviceCalls.length} Bell Call{serviceCalls.length > 1 ? 's' : ''}</span>
              </div>
            )}

            <button
              onClick={toggleAudio}
              className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition ${
                audioEnabled
                  ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md'
                  : 'bg-neutral-800 text-stone-400 border border-neutral-700'
              }`}
            >
              {audioEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-bounce" />
                  <span className="hidden xs:inline">Audio ON</span>
                </>
              ) : (
                <>
                  <BellOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Muted</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                audioManager.unlockAudio();
                setAudioUnlocked(true);
                const nextSpeech = !speechEnabled;
                setSpeechEnabled(nextSpeech);
                if (nextSpeech) {
                  audioManager.ringAndAnnounce('Voice announcements active');
                }
              }}
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                speechEnabled
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                  : 'bg-neutral-800 text-stone-400 border border-neutral-700'
              }`}
              title="Toggle Voice Speech Announcements"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{speechEnabled ? 'Voice ON 🗣️' : 'Voice Off'}</span>
            </button>

            <button
              onClick={() => router.push(`/admin/${slug}/menu`)}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-neutral-850 hover:bg-neutral-800 text-stone-200 border border-neutral-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              <span className="hidden sm:inline">Menu & Stock</span>
            </button>

            <button
              onClick={() => fetchOrders(false)}
              className="p-1.5 sm:p-2 bg-neutral-850 hover:bg-neutral-800 text-stone-300 border border-neutral-700 rounded-xl transition"
              title="Refresh Orders"
            >
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </header>

        {/* 2. Status Metric Tabs (Fixed / Sticky with Header) */}
        <div className="bg-neutral-900/95 px-3.5 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-3 overflow-hidden">
          <div className="flex items-center gap-1.5 sm:gap-2 no-scrollbar w-full overflow-x-auto">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'PENDING'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm ring-2 ring-amber-400'
                  : 'bg-amber-950/40 border border-amber-500/40 text-amber-400 hover:bg-amber-900/40'
              }`}
            >
              <span className="relative flex h-2 w-2 shrink-0">
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'COOKING'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'bg-neutral-800 text-emerald-400 hover:bg-neutral-750'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span>Cooking Now</span>
              <span className="px-1.5 py-0.5 rounded-md bg-neutral-950/40 text-[10px] font-bold">
                {cookingOrders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('ON_THE_WAY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'ON_THE_WAY'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-neutral-950 font-black shadow-sm ring-2 ring-orange-400'
                  : 'bg-orange-950/40 border border-orange-500/40 text-orange-400 hover:bg-orange-900/40'
              }`}
            >
              <Rocket className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span>On the Way</span>
              <span className="px-1.5 py-0.5 rounded-md bg-neutral-950/40 text-[10px] font-bold">
                {onTheWayOrders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('SERVED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'SERVED'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'bg-neutral-800 text-blue-400 hover:bg-neutral-750'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Served</span>
              <span className="px-1.5 py-0.5 rounded-md bg-neutral-950/40 text-[10px] font-bold">
                {servedOrders.length}
              </span>
            </button>
          </div>

          <span className="hidden lg:inline text-xs text-stone-400 font-medium shrink-0">
            💡 Tap checkbox for Ready, or tap status pill (⏳ Queued / 🍳 Cooking / ✓ Ready) to cycle dish status
          </span>
        </div>
      </div>

      {/* 3. Redesigned Ticket Cards Grid */}
      <main className="flex-1 p-6 pt-32 sm:pt-28 max-w-7xl mx-auto w-full">
        {/* Live Table Service Bells Alert Section */}
        {serviceCalls.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-amber-950/40 via-neutral-900 to-amber-950/30 border border-amber-500/50 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-xs">
                  <BellRing className="w-4 h-4 animate-bounce" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-amber-400 flex items-center gap-2">
                    <span>Live Table Service Bells</span>
                    <span className="px-2 py-0.5 bg-amber-500 text-stone-950 text-[10px] font-black rounded-full">
                      {serviceCalls.length} Calling
                    </span>
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Customers ringing bell for food info, bill/pay, feedback, or doubts
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {serviceCalls.map((call) => {
                let typeLabel = 'Call Waiter';
                let icon = <UserCheck className="w-4 h-4 text-amber-400" />;
                let typeBadge = 'bg-amber-500/20 text-amber-300 border-amber-500/30';

                if (call.type === 'BILL') {
                  typeLabel = 'Request Bill / Pay';
                  icon = <CreditCard className="w-4 h-4 text-emerald-400" />;
                  typeBadge = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                } else if (call.type === 'FOOD_INFO') {
                  typeLabel = `Food Info: ${call.item_name || 'Dish'}`;
                  icon = <Utensils className="w-4 h-4 text-orange-400" />;
                  typeBadge = 'bg-orange-500/20 text-orange-300 border-orange-500/30';
                } else if (call.type === 'DOUBT') {
                  typeLabel = 'Doubt / Inquiry';
                  icon = <HelpCircle className="w-4 h-4 text-blue-400" />;
                  typeBadge = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
                } else if (call.type === 'FEEDBACK') {
                  typeLabel = 'Diner Feedback';
                  icon = <MessageSquare className="w-4 h-4 text-purple-400" />;
                  typeBadge = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
                } else if (call.type === 'WATER') {
                  typeLabel = 'Water / Cutlery';
                  icon = <Droplets className="w-4 h-4 text-cyan-400" />;
                  typeBadge = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
                }

                return (
                  <div
                    key={call.id}
                    className="bg-neutral-900 border border-amber-500/40 rounded-xl p-3.5 flex flex-col justify-between gap-3 shadow-md hover:border-amber-400 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 bg-amber-500 text-stone-950 font-black text-xs rounded-md">
                            Table #{call.table_number}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold flex items-center gap-1 ${typeBadge}`}>
                            {icon}
                            <span>{typeLabel}</span>
                          </span>
                        </div>
                        <span className="text-[10px] text-stone-400 font-mono">
                          {new Date(call.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {call.notes && (
                        <p className="text-xs text-stone-200 bg-neutral-950/80 p-2 rounded-lg border border-neutral-800 mt-2 font-medium">
                          &ldquo;{call.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          audioManager.unlockAudio();
                          setAudioUnlocked(true);
                          audioManager.ringAndAnnounce(getAnnouncementText(call));
                        }}
                        className="py-2 px-3 bg-neutral-800 hover:bg-neutral-750 text-amber-400 font-bold text-xs rounded-lg border border-neutral-700 transition active:scale-95 flex items-center justify-center gap-1 shrink-0"
                        title="Speak this table call aloud"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Speak</span>
                      </button>

                      {isTableSnoozed(call.table_number) ? (
                        <button
                          type="button"
                          onClick={() => handleUnsnoozeTable(call.table_number)}
                          className="py-2 px-2.5 bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 font-bold text-xs rounded-lg transition active:scale-95 flex items-center gap-1 shrink-0"
                          title="Unsnooze table audio alerts"
                        >
                          <BellOff className="w-3.5 h-3.5 text-rose-400" />
                          <span>Unsnooze</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSnoozeTable(call.table_number)}
                          className="py-2 px-2.5 bg-neutral-800 hover:bg-neutral-750 text-stone-400 hover:text-stone-200 font-bold text-xs rounded-lg border border-neutral-700 transition active:scale-95 flex items-center gap-1 shrink-0"
                          title={`Snooze audio alerts from Table #${call.table_number} for 5 minutes`}
                        >
                          <BellOff className="w-3.5 h-3.5 text-stone-400" />
                          <span className="hidden sm:inline">Snooze (5m)</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleResolveCall(call.id)}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-lg shadow-sm transition active:scale-98 flex items-center justify-center gap-1.5 min-w-[120px]"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Mark Attended / Resolved</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
              const isOnTheWay = order.status === 'ON_THE_WAY' || order.status === 'READY';
              const isServed = order.status === 'SERVED';
              const isProcessing = processingOrderId === order.id;
              const elapsedMins = getElapsedMinutes(order.created_at);

              const isUrgent = elapsedMins >= 10;
              const isWarning = elapsedMins >= 5 && elapsedMins < 10;

              const totalItemsCount = order.items?.length || 0;
              const preparedItemsCount = order.items?.filter(it => checkedDishIds[it.id] || it.is_prepared).length || 0;

              return (
                <div
                  key={order.id}
                  className={`bg-neutral-900 rounded-3xl border flex flex-col justify-between overflow-hidden shadow-xl transition-all duration-200 ${
                    isPending
                      ? 'border-amber-500/70 shadow-amber-500/5'
                      : isOnTheWay
                      ? 'border-orange-500/70 shadow-orange-500/10'
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

                  {/* Body: Clean Checklist with Status Pills */}
                  <div className="p-5 flex-1 space-y-3">
                    <div className="divide-y divide-neutral-800/60">
                      {order.items?.map((item) => {
                        const isChecked = !!(checkedDishIds[item.id] || item.is_prepared);
                        const itemStatus: ItemPrepStatus = item.item_status || (isChecked ? 'READY' : (isPending ? 'PENDING' : 'QUEUED'));
                        const badgeInfo = getDishStatusBadgeInfo(itemStatus);
                        const isRejected = itemStatus === 'REJECTED';

                        return (
                          <div
                            key={item.id}
                            className={`py-2.5 first:pt-0 last:pb-0 transition ${
                              isRejected 
                                ? 'opacity-70 bg-rose-950/10 -mx-1.5 px-1.5 rounded-xl' 
                                : ''
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              {/* Quantity + Name */}
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <span className={`px-2 py-0.5 font-black text-xs rounded-lg shrink-0 ${
                                  isRejected ? 'bg-rose-950 text-rose-400 border border-rose-900/40' : 'bg-neutral-800 text-amber-400'
                                }`}>
                                  {item.quantity}×
                                </span>

                                <div className="min-w-0 flex-1">
                                  <span
                                    className={`font-bold text-sm block leading-snug truncate ${
                                      isRejected 
                                        ? 'line-through text-rose-400/80' 
                                        : 'text-white'
                                    }`}
                                  >
                                    {item.item_name}
                                  </span>
                                  {translateFoodName(item.item_name, true) !== item.item_name && (
                                    <span className="text-[11px] text-stone-400 font-medium block leading-tight mt-0.5 truncate">
                                      {translateFoodName(item.item_name, true)}
                                    </span>
                                  )}
                                  {isRejected && (
                                    <span className="text-[10px] text-rose-400 font-bold block mt-0.5">
                                      Declined / Sold Out
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Interactive Single Pill Status Dropdown & Price */}
                              <div className="flex items-center gap-2.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setDishPicker({
                                    orderId: order.id,
                                    dishId: item.id,
                                    dishName: item.item_name,
                                    tableNumber: order.table_number,
                                    currentStatus: itemStatus,
                                  })}
                                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-xs hover:ring-1 hover:ring-amber-500/40 ${badgeInfo.color}`}
                                  title="Tap to change dish status"
                                >
                                  <span>{badgeInfo.icon}</span>
                                  <span>{badgeInfo.label}</span>
                                  <span className="text-[9px] opacity-60">▾</span>
                                </button>

                                <span className={`text-xs font-mono font-bold ${isRejected ? 'line-through text-stone-500' : 'text-stone-300'}`}>
                                  {currency}{(item.item_price * item.quantity).toFixed(0)}
                                </span>
                              </div>
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
                    <div className="flex items-center justify-between text-xs text-stone-400 px-0.5">
                      <span className="text-stone-400 text-xs font-semibold">Total Amount</span>
                      <span className="text-white text-base font-black font-mono">{currency}{order.total_amount.toFixed(0)}</span>
                    </div>

                    {/* Pending Action Buttons */}
                    {isPending && (
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          disabled={isProcessing}
                          onClick={() => promptStatusChange(order, 'REJECTED', 'Reject / Decline Order')}
                          className="py-2.5 px-3 bg-neutral-800 hover:bg-rose-950 border border-neutral-700 hover:border-rose-800 text-rose-400 rounded-xl font-bold text-xs transition active:scale-95 flex items-center justify-center gap-1"
                        >
                          <X className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                        <button
                          disabled={isProcessing}
                          onClick={() => promptStatusChange(order, 'CONFIRMED', 'Accept & Confirm Order')}
                          className="col-span-2 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-neutral-950 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>Accept & Confirm</span>
                        </button>
                      </div>
                    )}

                    {/* Cooking / Preparing Action Buttons */}
                    {isCooking && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs px-0.5 text-stone-400">
                          <span className="text-amber-400 font-medium flex items-center gap-1.5 text-[11px]">
                            <Flame className="w-3.5 h-3.5" />
                            {preparedItemsCount} of {totalItemsCount} dishes ready
                          </span>
                          {preparedItemsCount === totalItemsCount && totalItemsCount > 0 && (
                            <span className="text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              ✓ All Ready
                            </span>
                          )}
                        </div>

                        {order.status === 'CONFIRMED' ? (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              disabled={isProcessing}
                              onClick={() => promptStatusChange(order, 'PREPARING', 'Move to Stove / Cooking')}
                              className="py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl font-black text-xs transition active:scale-95 flex items-center justify-center gap-1.5 shadow-md"
                            >
                              <Flame className="w-3.5 h-3.5 fill-neutral-950" />
                              <span>On Stove</span>
                            </button>
                            <button
                              disabled={isProcessing}
                              onClick={() => promptStatusChange(order, 'ON_THE_WAY', 'Mark Cooked & On the Way')}
                              className="py-2.5 px-3 bg-neutral-800 hover:bg-neutral-750 text-orange-400 border border-neutral-700 rounded-xl font-bold text-xs transition active:scale-95 flex items-center justify-center gap-1.5"
                            >
                              <Rocket className="w-3.5 h-3.5 text-orange-400" />
                              <span>On Way</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            disabled={isProcessing}
                            onClick={() => promptStatusChange(order, 'ON_THE_WAY', 'Mark Cooked & On the Way')}
                            className="w-full py-2.5 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-neutral-950 font-black rounded-xl text-xs transition active:scale-95 flex items-center justify-center gap-2 shadow-lg"
                          >
                            <Rocket className="w-4 h-4" />
                            <span>Food Cooked • On the Way</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* On the Way Active State */}
                    {isOnTheWay && (
                      <div className="space-y-2">
                        <div className="py-2 px-3 bg-orange-500/10 border border-orange-500/30 rounded-xl text-xs text-orange-400 font-bold flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Rocket className="w-4 h-4 text-orange-400 animate-pulse" />
                            <span>Out for Delivery to Table #{order.table_number}</span>
                          </div>
                        </div>

                        <button
                          disabled={isProcessing}
                          onClick={() => promptStatusChange(order, 'SERVED', 'Mark Order as Delivered & Served')}
                          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-1.5"
                        >
                          <Utensils className="w-4 h-4" />
                          <span>Delivered • Mark as Served</span>
                        </button>
                      </div>
                    )}

                    {/* Served Badge & Diner Feedback */}
                    {isServed && (
                      <div className="space-y-2">
                        <div className="py-2 px-3 bg-neutral-900 border border-neutral-800 text-blue-400 font-bold text-xs rounded-xl text-center flex items-center justify-center gap-1.5">
                          <Check className="w-4 h-4" />
                          <span>Delivered to Table #{order.table_number}</span>
                        </div>

                        {/* Customer Feedback Card if submitted */}
                        {order.feedback && (
                          <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-amber-400 font-black tracking-wider">
                                {'★'.repeat(order.feedback.rating)}{'☆'.repeat(5 - order.feedback.rating)}
                              </span>
                              <span className="text-[10px] text-stone-500 font-semibold">Diner Rating</span>
                            </div>
                            {order.feedback.comment && (
                              <p className="text-stone-300 italic text-[11px]">&ldquo;{order.feedback.comment}&rdquo;</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Manual Status Switcher & Undo Button for ANY Status */}
                    <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setStatusPickerOrder(order)}
                        className="text-[11px] text-stone-400 hover:text-amber-400 font-medium transition flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-neutral-800 active:scale-95"
                        title="Change to any status or undo an accidental change"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
                        <span>Undo / Switch Status</span>
                      </button>

                      <span className="text-[10px] text-stone-500 font-mono">
                        #{order.id.slice(-6).toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Confirmation Modal for ANY Kitchen Status Change */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-neutral-900 border border-neutral-700/80 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto shadow-md">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h3 className="font-black text-lg text-white">
                Confirm Status Change?
              </h3>
              <p className="text-xs text-stone-400 mt-1">
                Table #{confirmDialog.tableNumber} • {confirmDialog.customerName}
              </p>
            </div>

            {/* Status Transition Visual */}
            <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800 flex items-center justify-center gap-2.5 text-xs font-bold">
              <span className={`px-2.5 py-1 rounded-lg border ${getStatusBadgeInfo(confirmDialog.currentStatus).color}`}>
                {getStatusBadgeInfo(confirmDialog.currentStatus).label}
              </span>
              <ArrowRight className="w-4 h-4 text-stone-500 shrink-0" />
              <span className={`px-2.5 py-1 rounded-lg border ${getStatusBadgeInfo(confirmDialog.newStatus).color}`}>
                {getStatusBadgeInfo(confirmDialog.newStatus).label}
              </span>
            </div>

            <p className="text-[11px] text-stone-400 leading-relaxed">
              This will update Table #{confirmDialog.tableNumber}&apos;s live tracking screen in real-time.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="py-3 px-4 bg-neutral-800 hover:bg-neutral-750 text-stone-300 font-bold text-xs rounded-xl border border-neutral-700 transition active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processingOrderId === confirmDialog.orderId}
                onClick={confirmAndUpdateStatus}
                className="py-3 px-4 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs rounded-xl shadow-lg transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Confirm Change</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Any Status / Undo Picker Modal */}
      {statusPickerOrder && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-neutral-900 border border-neutral-700/80 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">
                    Undo or Switch Status
                  </h3>
                  <p className="text-xs text-stone-400">
                    Table #{statusPickerOrder.table_number} • #{statusPickerOrder.id.slice(-6).toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStatusPickerOrder(null)}
                className="p-1.5 rounded-lg bg-neutral-800 text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-300">
              Select any status to move this ticket, or undo an accidental action:
            </p>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {ALL_KITCHEN_STATUS_OPTIONS.map((opt) => {
                const isCurrent = statusPickerOrder.status === opt.status;

                return (
                  <button
                    key={opt.status}
                    type="button"
                    onClick={() => promptStatusChange(statusPickerOrder, opt.status, `Switch to ${opt.label}`)}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all group ${
                      isCurrent
                        ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/40'
                        : 'bg-neutral-950/70 border-neutral-800 hover:bg-neutral-850 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{opt.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white">{opt.label}</span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 text-[9px] bg-amber-500 text-neutral-950 font-black rounded-full uppercase">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-400 mt-0.5">{opt.desc}</p>
                      </div>
                    </div>

                    <span className="text-xs text-stone-500 font-bold group-hover:text-amber-400 transition">
                      Select &rarr;
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Dish Status Change */}
      {dishConfirmDialog && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-neutral-900 border border-neutral-700/80 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-md border ${
              dishConfirmDialog.newStatus === 'REJECTED'
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}>
              {getDishStatusBadgeInfo(dishConfirmDialog.newStatus).icon}
            </div>

            <div>
              <h3 className="font-black text-lg text-white">
                {dishConfirmDialog.newStatus === 'REJECTED' ? 'Reject this Food Item?' : 'Update Dish Status?'}
              </h3>
              <p className="text-xs text-amber-400 font-bold mt-1">
                Table #{dishConfirmDialog.tableNumber} • {dishConfirmDialog.dishName}
              </p>
              {translateFoodName(dishConfirmDialog.dishName, true) !== dishConfirmDialog.dishName && (
                <p className="text-[11px] text-stone-400 mt-0.5">
                  ({translateFoodName(dishConfirmDialog.dishName, true)})
                </p>
              )}
            </div>

            {/* Transition Visual */}
            <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800 flex items-center justify-center gap-2 text-xs font-bold">
              <span className={`px-2.5 py-1 rounded-lg border ${getDishStatusBadgeInfo(dishConfirmDialog.currentStatus).color}`}>
                {getDishStatusBadgeInfo(dishConfirmDialog.currentStatus).icon} {getDishStatusBadgeInfo(dishConfirmDialog.currentStatus).label}
              </span>
              <ArrowRight className="w-4 h-4 text-stone-500 shrink-0" />
              <span className={`px-2.5 py-1 rounded-lg border ${getDishStatusBadgeInfo(dishConfirmDialog.newStatus).color}`}>
                {getDishStatusBadgeInfo(dishConfirmDialog.newStatus).icon} {getDishStatusBadgeInfo(dishConfirmDialog.newStatus).label}
              </span>
            </div>

            <p className="text-[11px] text-stone-400 leading-relaxed">
              {dishConfirmDialog.newStatus === 'REJECTED'
                ? 'The diner will immediately see that this dish was declined/sold out.'
                : 'The diner will instantly see this dish update on their tracking screen.'}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDishConfirmDialog(null)}
                className="py-3 px-4 bg-neutral-800 hover:bg-neutral-750 text-stone-300 font-bold text-xs rounded-xl border border-neutral-700 transition active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAndUpdateDishStatus}
                className={`py-3 px-4 font-black text-xs rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-1.5 ${
                  dishConfirmDialog.newStatus === 'REJECTED'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-amber-500 hover:bg-amber-400 text-neutral-950'
                }`}
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Confirm</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dish Status Picker Modal */}
      {dishPicker && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-neutral-900 border border-neutral-700/80 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl">
                  🍽️
                </div>
                <div>
                  <h3 className="font-black text-base text-white">
                    Update Dish Status
                  </h3>
                  <p className="text-xs text-amber-400 font-bold truncate max-w-[220px]">
                    Table #{dishPicker.tableNumber} • {dishPicker.dishName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDishPicker(null)}
                className="p-1.5 rounded-lg bg-neutral-800 text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-300">
              Select status for <strong className="text-white">{dishPicker.dishName}</strong>:
            </p>

            <div className="space-y-2">
              {ALL_DISH_STATUS_OPTIONS.map((opt) => {
                const isCurrent = dishPicker.currentStatus === opt.status;

                return (
                  <button
                    key={opt.status}
                    type="button"
                    onClick={() => {
                      const order = orders.find(o => o.id === dishPicker.orderId);
                      const item = order?.items?.find(it => it.id === dishPicker.dishId);
                      if (order && item) {
                        setDishPicker(null);
                        promptDishStatusChange(order, item, opt.status, `Set to ${opt.label}`);
                      }
                    }}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all group ${
                      isCurrent
                        ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/40'
                        : 'bg-neutral-950/70 border-neutral-800 hover:bg-neutral-850 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{opt.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white">{opt.label}</span>
                          <span className="text-[11px] text-amber-400/80 font-normal">({opt.hindiLabel})</span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 text-[9px] bg-amber-500 text-neutral-950 font-black rounded-full uppercase">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-400 mt-0.5">{opt.desc}</p>
                      </div>
                    </div>

                    <span className="text-xs text-stone-500 font-bold group-hover:text-amber-400 transition">
                      Select &rarr;
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
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
