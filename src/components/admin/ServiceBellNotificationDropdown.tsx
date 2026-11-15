'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ServiceCall } from '@/types/database';
import { DataStore } from '@/lib/store';
import { audioManager } from '@/lib/audio';
import { 
  Bell, 
  BellRing, 
  Check, 
  Volume2, 
  Clock, 
  Droplets, 
  CreditCard, 
  Utensils, 
  ChefHat, 
  HelpCircle, 
  MessageSquare, 
  UserCheck, 
  ArrowRight, 
  X,
  ExternalLink
} from 'lucide-react';

interface ServiceBellNotificationDropdownProps {
  slug: string;
  onCallResolved?: (callId?: string) => void | Promise<void>;
  className?: string;
}

export function ServiceBellNotificationDropdown({ 
  slug, 
  onCallResolved,
  className = '' 
}: ServiceBellNotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [serviceCalls, setServiceCalls] = useState<ServiceCall[]>([]);
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update timer every second
  useEffect(() => {
    const timer = setInterval(() => setNowTimestamp(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch calls
  const fetchCalls = async () => {
    const res = await DataStore.getRestaurant(slug);
    if (res) {
      setRestaurantId(res.id);
      const calls = await DataStore.getServiceCalls(res.id);
      setServiceCalls(calls.filter(c => c.status === 'PENDING'));
    }
  };

  useEffect(() => {
    fetchCalls();
    const unsub = DataStore.subscribeToServiceCalls(slug, () => {
      fetchCalls();
    });
    return () => {
      unsub();
    };
  }, [slug]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleResolve = async (e: React.MouseEvent, callId: string) => {
    e.stopPropagation();
    await DataStore.resolveServiceCall(callId, 'Floor Waiter');
    audioManager.playSuccessChime();
    setServiceCalls(prev => prev.filter(c => c.id !== callId));
    if (onCallResolved) {
      onCallResolved(callId);
    }
  };

  const handleSpeak = (e: React.MouseEvent, call: ServiceCall) => {
    e.stopPropagation();
    audioManager.unlockAudio();
    let text = `Table ${call.table_number}: Calling waiter.`;
    if (call.type === 'WATER') text = `Table ${call.table_number}: Requesting water or cutlery.`;
    else if (call.type === 'BILL') text = `Table ${call.table_number}: Requesting bill and payment.`;
    else if (call.type === 'CLEAN') text = `Table ${call.table_number}: Requesting table clean.`;
    else if (call.type === 'DOUBT') text = `Table ${call.table_number}: Customer has a question.`;
    else if (call.type === 'FOOD_INFO') text = `Table ${call.table_number}: Food inquiry for ${call.item_name || 'dish'}.`;
    if (call.notes) text += ` Note: ${call.notes}`;
    audioManager.ringAndAnnounce(text);
  };

  const formatTimer = (isoString: string) => {
    const diffSeconds = Math.max(0, Math.floor((nowTimestamp - new Date(isoString).getTime()) / 1000));
    const mins = Math.floor(diffSeconds / 60);
    const secs = diffSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getReasonBadge = (call: ServiceCall) => {
    switch (call.type) {
      case 'WATER':
        return {
          label: 'Water & Cutlery',
          hindi: 'पानी व चम्मच',
          icon: <Droplets className="w-3.5 h-3.5 text-cyan-400" />,
          color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
        };
      case 'BILL':
        return {
          label: 'Bill / Pay',
          hindi: 'बिल मंगवाएं',
          icon: <CreditCard className="w-3.5 h-3.5 text-emerald-400" />,
          color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
        };
      case 'CLEAN':
        return {
          label: 'Clean Table',
          hindi: 'सफाई व नैपकिन',
          icon: <Utensils className="w-3.5 h-3.5 text-purple-400" />,
          color: 'bg-purple-500/15 text-purple-300 border-purple-500/30'
        };
      case 'FOOD_INFO':
        return {
          label: `Food Info: ${call.item_name || 'Dish'}`,
          hindi: 'भोजन जानकारी',
          icon: <ChefHat className="w-3.5 h-3.5 text-orange-400" />,
          color: 'bg-orange-500/15 text-orange-300 border-orange-500/30'
        };
      case 'DOUBT':
        return {
          label: 'Question',
          hindi: 'शंका या सवाल',
          icon: <HelpCircle className="w-3.5 h-3.5 text-blue-400" />,
          color: 'bg-blue-500/15 text-blue-300 border-blue-500/30'
        };
      case 'FEEDBACK':
        return {
          label: 'Feedback',
          hindi: 'ग्राहक फीडबैक',
          icon: <MessageSquare className="w-3.5 h-3.5 text-pink-400" />,
          color: 'bg-pink-500/15 text-pink-300 border-pink-500/30'
        };
      case 'WAITER':
      default:
        return {
          label: 'Call Waiter',
          hindi: 'वेटर को बुलाएं',
          icon: <UserCheck className="w-3.5 h-3.5 text-amber-400" />,
          color: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
        };
    }
  };

  // Sort chronologically (oldest at top: Priority #1)
  const sortedCalls = [...serviceCalls].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Notification Bell Button with Live Count */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Table Service Bells Notification"
        className={`relative p-2 sm:p-2.5 rounded-xl border transition-all duration-200 flex items-center justify-center ${
          sortedCalls.length > 0
            ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/60 text-amber-300 shadow-md shadow-amber-500/10'
            : isOpen
            ? 'bg-neutral-800 border-amber-400 text-amber-300 shadow-sm ring-1 ring-amber-400/40'
            : 'bg-neutral-850 hover:bg-neutral-800 border-neutral-700/80 text-stone-300 hover:text-white'
        }`}
      >
        {sortedCalls.length > 0 ? (
          <BellRing className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 animate-bounce" />
        ) : (
          <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-stone-400" />
        )}

        {/* Floating Count Badge */}
        {sortedCalls.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-rose-600 text-white text-[11px] font-black rounded-full flex items-center justify-center border-2 border-neutral-900 shadow-md animate-pulse">
            {sortedCalls.length}
          </span>
        )}
      </button>

      {/* Dropdown Popover List - Fully Responsive across all Mobile & Desktop screens */}
      {isOpen && (
        <>
          {/* Mobile backdrop overlay to dismiss on touch */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2.5 w-auto sm:w-[380px] max-w-[calc(100vw-1.5rem)] z-50 animate-in fade-in zoom-in-95 sm:zoom-in-100 duration-150">
            {/* Top pointer arrow on desktop pointing to the bell button */}
            <div className="hidden sm:block absolute -top-1.5 right-3.5 w-3 h-3 bg-neutral-850 border-t border-l border-neutral-750 rotate-45 z-10" />

            <div className="bg-neutral-900 border border-neutral-750 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[82vh]">
              {/* Dropdown Header */}
              <div className="p-3.5 bg-neutral-850/95 border-b border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    sortedCalls.length > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-neutral-800 text-stone-400'
                  }`}>
                    {sortedCalls.length > 0 ? (
                      <BellRing className="w-4 h-4 animate-bounce" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-black text-xs sm:text-sm text-white flex items-center gap-2">
                      <span>Table Service Bells</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        sortedCalls.length > 0 
                          ? 'bg-amber-500 text-neutral-950 font-black animate-pulse' 
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {sortedCalls.length > 0 ? `${sortedCalls.length} Calling` : '0 Active'}
                      </span>
                    </h4>
                    <p className="text-[10px] text-stone-400">
                      {sortedCalls.length > 0 ? 'Oldest requests appear first in queue' : 'All tables currently attended'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-neutral-750 text-stone-400 hover:text-white transition"
                  title="Close popover"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* List of Ringing Calls */}
              <div className="max-h-[380px] overflow-y-auto divide-y divide-neutral-800/80 p-2 space-y-2">
                {sortedCalls.length === 0 ? (
                  <div className="py-7 px-4 text-center space-y-2.5">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400 shadow-xs">
                      <Check className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">All Tables Attended</p>
                      <p className="text-[11px] text-stone-400 max-w-[260px] mx-auto leading-relaxed mt-0.5">
                        No diners waiting for service. When a table rings from their QR code, it will alert here instantly.
                      </p>
                    </div>
                  </div>
                ) : (
                  sortedCalls.map((call, idx) => {
                    const isFirst = idx === 0;
                    const badge = getReasonBadge(call);
                    const diffSeconds = Math.max(0, Math.floor((nowTimestamp - new Date(call.created_at).getTime()) / 1000));
                    const mins = Math.floor(diffSeconds / 60);
                    const isUrgent = mins >= 4;
                    const isWarning = mins >= 2 && mins < 4;

                    return (
                      <div
                        key={call.id}
                        className={`p-3 rounded-xl transition border ${
                          isFirst
                            ? 'bg-amber-950/25 border-amber-500/40 ring-1 ring-amber-500/20'
                            : isUrgent
                            ? 'bg-rose-950/20 border-rose-500/40'
                            : 'bg-neutral-950/50 border-neutral-800/80 hover:border-neutral-700'
                        }`}
                      >
                        {/* Top Row: Stand + Rank + Reason + Timer */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2.5 py-0.5 bg-amber-500 text-neutral-950 font-black text-xs rounded-lg shadow-xs">
                              Table #{call.table_number}
                            </span>

                            <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 ${badge.color}`}>
                              {badge.icon}
                              <span>{badge.label}</span>
                            </span>

                            {isFirst ? (
                              <span className="px-1.5 py-0.2 bg-amber-400 text-neutral-950 font-black text-[9px] rounded-md uppercase">
                                #1 Priority
                              </span>
                            ) : (
                              <span className="text-[10px] text-stone-500 font-bold">
                                #{idx + 1}
                              </span>
                            )}
                          </div>

                          {/* Timer */}
                          <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                            isUrgent
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                              : isWarning
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-neutral-800 text-stone-400'
                          }`}>
                            <Clock className="w-3 h-3" />
                            <span>{formatTimer(call.created_at)}</span>
                          </span>
                        </div>

                        {/* Optional Note */}
                        {call.notes && (
                          <p className="mt-1.5 text-[11px] text-amber-200/90 bg-neutral-900/90 px-2 py-1 rounded-lg border border-neutral-800 font-medium line-clamp-2">
                            &ldquo;{call.notes}&rdquo;
                          </p>
                        )}

                        {/* Action Buttons */}
                        <div className="mt-2.5 pt-2 border-t border-neutral-800 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleSpeak(e, call)}
                            className="p-1.5 bg-neutral-800 hover:bg-neutral-750 text-amber-400 rounded-lg border border-neutral-700 transition"
                            title="Speak table call aloud"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleResolve(e, call.id)}
                            className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-lg transition active:scale-95 flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Send Waiter to Table #{call.table_number}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Dropdown Footer: Link to Dedicated Separate Page */}
              <div className="p-2.5 bg-neutral-850/80 border-t border-neutral-800 flex items-center justify-between">
                {sortedCalls.length === 0 ? (
                  <Link
                    href={`/admin/${slug}/bells`}
                    onClick={() => setIsOpen(false)}
                    className="w-full py-2 px-3 bg-neutral-800 hover:bg-neutral-750 text-stone-300 hover:text-white font-bold text-xs rounded-xl border border-neutral-700/80 transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>Open Full Service Bells Page</span>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                  </Link>
                ) : (
                  <Link
                    href={`/admin/${slug}/bells`}
                    onClick={() => setIsOpen(false)}
                    className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-98"
                  >
                    <span>Open Full Waiter Dispatch Center ({sortedCalls.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </>
      )}
  </div>
);
}
