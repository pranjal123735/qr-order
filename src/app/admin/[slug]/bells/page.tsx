'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Restaurant, ServiceCall } from '@/types/database';
import { DataStore } from '@/lib/store';
import { audioManager } from '@/lib/audio';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { ServiceBellNotificationDropdown } from '@/components/admin/ServiceBellNotificationDropdown';
import { 
  Bell, 
  BellOff, 
  BellRing, 
  Volume2, 
  Check, 
  Clock, 
  ChefHat, 
  Utensils, 
  RefreshCw, 
  ArrowLeft, 
  Timer, 
  CheckCircle2, 
  MessageSquare, 
  Send, 
  History, 
  Sparkles, 
  Filter,
  CreditCard,
  HelpCircle,
  Droplets,
  UserCheck,
  ExternalLink
} from 'lucide-react';

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
  if (call.type === 'CLEAN') {
    return `Table ${call.table_number}: Requesting table clean and napkins.${call.notes ? ' ' + call.notes : ''}`;
  }
  return `Table ${call.table_number}: Calling waiter to table.${call.notes ? ' ' + call.notes : ''}`;
}

function getServiceCallDetails(call: ServiceCall) {
  switch (call.type) {
    case 'WATER':
      return {
        label: 'Water & Cutlery',
        hindi: 'पानी एवं चम्मच',
        icon: <Droplets className="w-4 h-4 text-cyan-400" />,
        badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        cardBorder: 'border-cyan-500/40',
      };
    case 'BILL':
      return {
        label: 'Request Bill / Pay',
        hindi: 'बिल मंगवाएं / भुगतान',
        icon: <CreditCard className="w-4 h-4 text-emerald-400" />,
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        cardBorder: 'border-emerald-500/40',
      };
    case 'CLEAN':
      return {
        label: 'Clean Table / Napkins',
        hindi: 'टेबल सफाई व नैपकिन',
        icon: <Utensils className="w-4 h-4 text-purple-400" />,
        badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        cardBorder: 'border-purple-500/40',
      };
    case 'FOOD_INFO':
      return {
        label: `Food Info: ${call.item_name || 'Dish'}`,
        hindi: `भोजन जानकारी: ${call.item_name || 'व्यंजन'}`,
        icon: <ChefHat className="w-4 h-4 text-orange-400" />,
        badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
        cardBorder: 'border-orange-500/40',
      };
    case 'DOUBT':
      return {
        label: 'Question / Doubt',
        hindi: 'शंका या सवाल',
        icon: <HelpCircle className="w-4 h-4 text-blue-400" />,
        badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        cardBorder: 'border-blue-500/40',
      };
    case 'FEEDBACK':
      return {
        label: 'Diner Feedback',
        hindi: 'ग्राहक फीडबैक',
        icon: <MessageSquare className="w-4 h-4 text-pink-400" />,
        badgeClass: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
        cardBorder: 'border-pink-500/40',
      };
    case 'WAITER':
    default:
      return {
        label: 'Call Waiter',
        hindi: 'वेटर को बुलाएं',
        icon: <UserCheck className="w-4 h-4 text-amber-400" />,
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        cardBorder: 'border-amber-500/40',
      };
  }
}

function DedicatedBellsContent() {
  const router = useRouter();
  const routeParams = useParams();
  const slug = (routeParams?.slug as string) || 'rustic-grill';

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());

  // Service bells state
  const [serviceCalls, setServiceCalls] = useState<ServiceCall[]>([]);
  const [allServiceCalls, setAllServiceCalls] = useState<ServiceCall[]>([]);
  const [bellFilter, setBellFilter] = useState<'ACTIVE' | 'RESOLVED' | 'ALL'>('ACTIVE');
  const [bellTableFilter, setBellTableFilter] = useState<number | 'ALL'>('ALL');
  const [customWaiterNames, setCustomWaiterNames] = useState<Record<string, string>>({});
  const knownCallIdsRef = useRef<Set<string>>(new Set());

  // Anti-Abuse: Snoozed tables map
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
    const until = Date.now() + 5 * 60 * 1000;
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

  // Auto-unlock audio and speech on any user interaction
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

  // Digital clock & timer interval
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setNowTimestamp(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchCalls = async (shouldChime = false) => {
    const res = await DataStore.getRestaurant(slug);
    if (res) {
      setRestaurant(res);
      const calls = await DataStore.getServiceCalls(res.id);
      const pendingCalls = calls.filter(c => c.status === 'PENDING');
      const newCalls = pendingCalls.filter(c => !knownCallIdsRef.current.has(c.id));

      if (shouldChime && audioEnabled) {
        const eligibleCalls = newCalls.filter(c => !isTableSnoozed(c.table_number));
        if (eligibleCalls.length > 0) {
          const latestCall = eligibleCalls[0];
          const speakText = getAnnouncementText(latestCall);
          if (speechEnabled) {
            audioManager.ringAndAnnounce(speakText);
          } else {
            audioManager.playServiceBell();
          }
        }
      }

      pendingCalls.forEach(c => knownCallIdsRef.current.add(c.id));
      setServiceCalls(pendingCalls);
      setAllServiceCalls(calls);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCalls(false);
    const unsubCalls = DataStore.subscribeToServiceCalls(slug, () => {
      fetchCalls(true);
    });
    const interval = setInterval(() => fetchCalls(false), 8000);
    return () => {
      unsubCalls();
      clearInterval(interval);
    };
  }, [slug, audioEnabled]);

  const handleResolveCall = async (callId: string, waiterName?: string) => {
    await DataStore.resolveServiceCall(callId, waiterName);
    audioManager.playSuccessChime();
    setServiceCalls(prev => prev.filter(c => c.id !== callId));
    setAllServiceCalls(prev => prev.map(c => c.id === callId ? { 
      ...c, 
      status: 'RESOLVED', 
      resolved_at: new Date().toISOString(),
      waiter_name: waiterName || c.waiter_name 
    } : c));
  };

  const toggleAudio = () => {
    const nextState = !audioEnabled;
    setAudioEnabled(nextState);
    audioManager.setMuted(!nextState);
    if (nextState) {
      audioManager.playNewOrderChime();
    }
  };

  const formatElapsedTimer = (isoString: string) => {
    const diffSeconds = Math.max(0, Math.floor((nowTimestamp - new Date(isoString).getTime()) / 1000));
    const mins = Math.floor(diffSeconds / 60);
    const secs = diffSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const activeQueue = [...serviceCalls]
    .filter(c => bellTableFilter === 'ALL' || c.table_number === bellTableFilter)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const resolvedQueue = allServiceCalls
    .filter(c => c.status === 'RESOLVED')
    .filter(c => bellTableFilter === 'ALL' || c.table_number === bellTableFilter)
    .sort((a, b) => new Date(b.resolved_at || b.created_at).getTime() - new Date(a.resolved_at || a.created_at).getTime());

  const uniqueTables = Array.from(new Set(allServiceCalls.map(c => c.table_number))).sort((a, b) => a - b);

  return (
    <AdminAuthGuard slug={slug}>
      <div className="min-h-screen bg-neutral-950 text-stone-100 flex flex-col font-sans select-none antialiased overflow-x-clip w-full">
        {/* Top Navbar */}
        <header className="fixed top-0 inset-x-0 z-50 bg-neutral-900 border-b border-neutral-800 shadow-2xl backdrop-blur-md px-3.5 sm:px-6 py-3 flex items-center justify-between gap-3">
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
                <h1 className="font-extrabold text-base sm:text-lg text-white tracking-tight truncate">
                  Table Service Bells
                </h1>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] sm:text-[11px] font-bold rounded-full border border-amber-500/30 flex items-center gap-1.5 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Live Waiter Dispatch
                </span>
              </div>
              <p className="text-xs text-stone-400 truncate">
                {restaurant?.name || slug} • Table Calling Queue
              </p>
            </div>
          </div>

          {/* Digital Clock */}
          <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl font-mono text-xs">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-stone-400 font-medium">Clock:</span>
            <span className="text-amber-400 font-bold">{currentTime || '12:00:00'}</span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Notification Bell Dropdown with Count */}
            <ServiceBellNotificationDropdown slug={slug} onCallResolved={fetchCalls} />

            <button
              onClick={toggleAudio}
              className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition ${
                audioEnabled
                  ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md'
                  : 'bg-neutral-800 text-stone-400 border border-neutral-700'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">{audioEnabled ? 'Audio ON' : 'Muted'}</span>
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

            <Link
              href={`/admin/${slug}/live-orders`}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-neutral-850 hover:bg-neutral-800 text-stone-200 border border-neutral-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <ChefHat className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              <span className="hidden sm:inline">Kitchen Terminal</span>
            </Link>

            <button
              onClick={() => fetchCalls(false)}
              className="p-1.5 sm:p-2 bg-neutral-850 hover:bg-neutral-800 text-stone-300 border border-neutral-700 rounded-xl transition"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 pt-24 sm:pt-24 max-w-7xl mx-auto w-full space-y-6">
          {/* Audio Permission Banner */}
          {!audioUnlocked && (
            <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-orange-400 text-stone-950 px-4 py-2.5 rounded-2xl text-xs font-black flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 animate-bounce" />
                <span>Tap to activate live desk bell chime & voice announcements for table calls</span>
              </div>
              <button
                onClick={async () => {
                  await audioManager.unlockAudio();
                  setAudioUnlocked(true);
                  audioManager.ringAndAnnounce('Table service bell sound and announcements enabled!');
                }}
                className="px-3.5 py-1 bg-stone-950 hover:bg-stone-900 text-white rounded-xl text-xs font-black shadow-md transition active:scale-95"
              >
                Enable Sound 🔊
              </button>
            </div>
          )}

          {/* Hero Stats Card */}
          <div className="bg-gradient-to-r from-amber-950/40 via-neutral-900 to-amber-950/20 border border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-neutral-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20 shrink-0">
                  <BellRing className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      Table Service Bells & Waiter Dispatch
                    </h2>
                    <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold rounded-full">
                      टेबल सर्विस बेल ट्रैकर
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-1">
                    Live chronological queue: see which table rang the bell, for what reason, and dispatch waiters in exact sequence.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    audioManager.unlockAudio();
                    setAudioUnlocked(true);
                    if (activeQueue.length > 0) {
                      audioManager.ringAndAnnounce(`Priority 1 in queue: ${getAnnouncementText(activeQueue[0])}`);
                    } else {
                      audioManager.ringAndAnnounce('No service calls currently pending.');
                    }
                  }}
                  className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-750 text-amber-300 font-bold text-xs rounded-xl border border-neutral-700 transition active:scale-95 flex items-center gap-2 shadow-sm"
                >
                  <Volume2 className="w-4 h-4 text-amber-400" />
                  <span>Announce #1 in Queue 🗣️</span>
                </button>
              </div>
            </div>

            {/* Metric Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-neutral-800/80">
              <div className="bg-neutral-950/70 p-3.5 rounded-2xl border border-neutral-800">
                <span className="text-[11px] font-semibold text-stone-400 block">Active Waiting Queue</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-black text-amber-400">{serviceCalls.length}</span>
                  {serviceCalls.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  )}
                </div>
              </div>

              <div className="bg-neutral-950/70 p-3.5 rounded-2xl border border-neutral-800">
                <span className="text-[11px] font-semibold text-stone-400 block">Longest Wait Time</span>
                <div className="flex items-center gap-1.5 mt-1 font-mono">
                  <Clock className="w-4 h-4 text-stone-400" />
                  <span className={`text-xl font-black ${
                    activeQueue.length > 0 ? 'text-amber-400' : 'text-stone-500'
                  }`}>
                    {activeQueue.length > 0 ? formatElapsedTimer(activeQueue[0].created_at) : '00:00'}
                  </span>
                </div>
              </div>

              <div className="bg-neutral-950/70 p-3.5 rounded-2xl border border-neutral-800">
                <span className="text-[11px] font-semibold text-stone-400 block">Attended & Resolved</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-2xl font-black text-emerald-400">
                    {allServiceCalls.filter(c => c.status === 'RESOLVED').length}
                  </span>
                </div>
              </div>

              <div className="bg-neutral-950/70 p-3.5 rounded-2xl border border-neutral-800">
                <span className="text-[11px] font-semibold text-stone-400 block">Total Requests Today</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <Bell className="w-4 h-4 text-blue-400" />
                  <span className="text-2xl font-black text-white">
                    {allServiceCalls.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900/80 p-3 rounded-2xl border border-neutral-800">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setBellFilter('ACTIVE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  bellFilter === 'ACTIVE'
                    ? 'bg-amber-500 text-neutral-950 font-black shadow-sm'
                    : 'bg-neutral-800 text-stone-300 hover:bg-neutral-750'
                }`}
              >
                <Timer className="w-3.5 h-3.5" />
                <span>Active Queue</span>
                <span className="px-1.5 py-0.2 rounded-md bg-neutral-950/40 text-[10px]">
                  {serviceCalls.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setBellFilter('RESOLVED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  bellFilter === 'RESOLVED'
                    ? 'bg-emerald-500 text-neutral-950 font-black shadow-sm'
                    : 'bg-neutral-800 text-stone-300 hover:bg-neutral-750'
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Attended / Dispatched</span>
                <span className="px-1.5 py-0.2 rounded-md bg-neutral-950/40 text-[10px]">
                  {allServiceCalls.filter(c => c.status === 'RESOLVED').length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setBellFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  bellFilter === 'ALL'
                    ? 'bg-stone-200 text-neutral-950 font-black shadow-sm'
                    : 'bg-neutral-800 text-stone-300 hover:bg-neutral-750'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>All Calls</span>
                <span className="px-1.5 py-0.2 rounded-md bg-neutral-950/40 text-[10px]">
                  {allServiceCalls.length}
                </span>
              </button>
            </div>

            {/* Table Selector */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-stone-400 font-bold flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                <span>Filter Table:</span>
              </span>
              <select
                value={bellTableFilter}
                onChange={(e) => setBellTableFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                className="px-3 py-1.5 bg-neutral-950 border border-neutral-700 rounded-xl text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">All Tables</option>
                {uniqueTables.map(t => (
                  <option key={t} value={t}>Table #{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Bells List View */}
          {bellFilter === 'ACTIVE' && activeQueue.length === 0 ? (
            <div className="py-20 text-center bg-neutral-900/60 rounded-3xl border border-neutral-800/80 p-8 max-w-lg mx-auto space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-white">All Tables Attended!</h3>
              <p className="text-xs text-stone-400 max-w-sm mx-auto leading-relaxed">
                No tables are currently waiting for service. When diners ring their service bell on table QR codes, requests appear here in chronological order.
              </p>
            </div>
          ) : bellFilter === 'ACTIVE' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-stone-400 px-1">
                <span className="font-bold">
                  Chronological Queue ({activeQueue.length} Waiting • Oldest at top):
                </span>
                <span className="text-amber-400 font-semibold">
                  Send waiters following sequence numbers below
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {activeQueue.map((call, index) => {
                  const isFirst = index === 0;
                  const details = getServiceCallDetails(call);
                  const diffSeconds = Math.max(0, Math.floor((nowTimestamp - new Date(call.created_at).getTime()) / 1000));
                  const mins = Math.floor(diffSeconds / 60);
                  const isUrgent = mins >= 4;
                  const isWarning = mins >= 2 && mins < 4;

                  return (
                    <div
                      key={call.id}
                      className={`bg-neutral-900 rounded-3xl border transition-all duration-200 overflow-hidden shadow-xl ${
                        isFirst
                          ? 'border-amber-500 ring-2 ring-amber-500/30 shadow-amber-500/10'
                          : isUrgent
                          ? 'border-rose-500/80 shadow-rose-500/10'
                          : 'border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      {/* Priority Ribbon for #1 in Queue */}
                      {isFirst && (
                        <div className="bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500 text-neutral-950 font-black px-4 py-1.5 text-xs flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 fill-neutral-950" />
                            <span>#1 IN QUEUE • WAITING LONGEST (DISPATCH WAITER FIRST)</span>
                          </div>
                          <span className="text-[11px] font-mono font-black">
                            Waiting: {formatElapsedTimer(call.created_at)}
                          </span>
                        </div>
                      )}

                      <div className="p-5 sm:p-6 space-y-4">
                        {/* Table Stand + Reason + Timer */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="px-4 py-2 bg-amber-500 text-neutral-950 font-black text-base sm:text-lg rounded-2xl tracking-tight shadow-md flex items-center gap-2">
                              <span>TABLE #{call.table_number}</span>
                            </div>

                            {!isFirst && (
                              <span className="px-3 py-1 bg-neutral-800 text-stone-300 font-bold text-xs rounded-xl border border-neutral-700">
                                #{index + 1} In Queue
                              </span>
                            )}

                            <span className={`px-3 py-1 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${details.badgeClass}`}>
                              {details.icon}
                              <span>{details.label}</span>
                              <span className="opacity-75 font-normal">({details.hindi})</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className={`px-3 py-1 rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 border ${
                              isUrgent
                                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse font-black'
                                : isWarning
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            }`}>
                              <Clock className="w-3.5 h-3.5" />
                              <span>{formatElapsedTimer(call.created_at)} waiting</span>
                              {isUrgent && <span className="text-[10px] font-black uppercase ml-1">Urgent!</span>}
                            </div>

                            <span className="text-[11px] text-stone-400 font-mono">
                              {new Date(call.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        {/* Customer Note */}
                        {call.notes && (
                          <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800 text-xs text-amber-200/90 font-medium flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                            <div>
                              <span className="text-stone-400 text-[11px] font-bold block mb-0.5">Diner Note:</span>
                              <span>&ldquo;{call.notes}&rdquo;</span>
                            </div>
                          </div>
                        )}

                        {/* Waiter Dispatch Controls */}
                        <div className="pt-2 border-t border-neutral-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-xs text-stone-400 font-bold shrink-0 hidden sm:inline">
                              Assign:
                            </span>
                            <input
                              type="text"
                              placeholder="Waiter Name (e.g. Waiter Alex / Floor Team)"
                              value={customWaiterNames[call.id] || ''}
                              onChange={(e) => setCustomWaiterNames(prev => ({ ...prev, [call.id]: e.target.value }))}
                              className="flex-1 min-w-[160px] px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 transition"
                            />

                            <div className="hidden lg:flex items-center gap-1 shrink-0">
                              {['Waiter 1', 'Waiter 2', 'Staff'].map(w => (
                                <button
                                  key={w}
                                  type="button"
                                  onClick={() => setCustomWaiterNames(prev => ({ ...prev, [call.id]: w }))}
                                  className="px-2 py-1 text-[10px] bg-neutral-800 hover:bg-neutral-750 text-stone-300 rounded-lg border border-neutral-700 transition"
                                >
                                  {w}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                audioManager.unlockAudio();
                                setAudioUnlocked(true);
                                audioManager.ringAndAnnounce(getAnnouncementText(call));
                              }}
                              className="px-3 py-2 bg-neutral-800 hover:bg-neutral-750 text-amber-300 font-bold text-xs rounded-xl border border-neutral-700 transition active:scale-95 flex items-center gap-1.5"
                              title="Speak aloud"
                            >
                              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                              <span>Speak Aloud 🗣️</span>
                            </button>

                            {isTableSnoozed(call.table_number) ? (
                              <button
                                type="button"
                                onClick={() => handleUnsnoozeTable(call.table_number)}
                                className="px-3 py-2 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/50 font-bold text-xs rounded-xl transition active:scale-95 flex items-center gap-1.5"
                              >
                                <BellOff className="w-3.5 h-3.5 text-rose-400" />
                                <span>Unsnooze</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSnoozeTable(call.table_number)}
                                className="px-3 py-2 bg-neutral-800 hover:bg-neutral-750 text-stone-400 hover:text-stone-200 font-bold text-xs rounded-xl border border-neutral-700 transition active:scale-95 flex items-center gap-1.5"
                                title="Snooze table alerts for 5 minutes"
                              >
                                <BellOff className="w-3.5 h-3.5 text-stone-400" />
                                <span>Snooze (5m)</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleResolveCall(call.id, customWaiterNames[call.id] || 'Staff Waiter')}
                              className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-neutral-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
                            >
                              <Send className="w-4 h-4 stroke-[2.5]" />
                              <span>Send Waiter to Table #{call.table_number}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Attended / All History List */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-400 px-1">
                <span className="font-bold">
                  {bellFilter === 'RESOLVED' ? 'Attended Service Calls History' : 'All Service Calls Record'}
                </span>
                <span>
                  {(bellFilter === 'RESOLVED' ? resolvedQueue : allServiceCalls.filter(c => bellTableFilter === 'ALL' || c.table_number === bellTableFilter)).length} items
                </span>
              </div>

              <div className="space-y-2.5">
                {(bellFilter === 'RESOLVED' ? resolvedQueue : allServiceCalls.filter(c => bellTableFilter === 'ALL' || c.table_number === bellTableFilter))
                  .map((call) => {
                    const details = getServiceCallDetails(call);
                    const isResolved = call.status === 'RESOLVED';

                    return (
                      <div
                        key={call.id}
                        className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="px-3 py-1 bg-neutral-800 text-amber-400 font-black text-xs rounded-xl border border-neutral-700">
                            Table #{call.table_number}
                          </span>

                          <span className={`px-2.5 py-0.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 ${details.badgeClass}`}>
                            {details.icon}
                            <span>{details.label}</span>
                          </span>

                          {call.notes && (
                            <span className="text-xs text-stone-400 truncate max-w-xs">
                              &ldquo;{call.notes}&rdquo;
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs shrink-0 flex-wrap">
                          <span className="text-stone-500 font-mono">
                            Rung: {new Date(call.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>

                          {isResolved ? (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg font-bold">
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Attended {call.waiter_name ? `by ${call.waiter_name}` : ''}</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleResolveCall(call.id, 'Staff Waiter')}
                              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black rounded-lg transition"
                            >
                              Send Waiter Now
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </main>
      </div>
    </AdminAuthGuard>
  );
}

export default function DedicatedBellsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-950 flex items-center justify-center text-stone-400">Loading Table Service Bells...</div>}>
      <DedicatedBellsContent />
    </Suspense>
  );
}
