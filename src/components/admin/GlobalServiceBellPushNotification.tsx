'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ServiceCall } from '@/types/database';
import { DataStore } from '@/lib/store';
import { audioManager } from '@/lib/audio';
import {
  BellRing,
  Volume2,
  Check,
  X,
  ExternalLink,
  CreditCard,
  Droplets,
  ChefHat,
  HelpCircle,
  Utensils,
  UserCheck,
  MessageSquare
} from 'lucide-react';

interface GlobalServiceBellPushNotificationProps {
  slug: string;
}

interface ToastNotification {
  id: string;
  call: ServiceCall;
  receivedAt: number;
}

function getServiceCallDetails(call: ServiceCall) {
  switch (call.type) {
    case 'WATER':
      return {
        label: 'Water & Cutlery',
        hindi: 'पानी एवं चम्मच',
        icon: <Droplets className="w-4 h-4 text-cyan-400" />,
        badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      };
    case 'BILL':
      return {
        label: 'Request Bill / Pay',
        hindi: 'बिल मंगवाएं / भुगतान',
        icon: <CreditCard className="w-4 h-4 text-emerald-400" />,
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      };
    case 'CLEAN':
      return {
        label: 'Clean Table / Napkins',
        hindi: 'टेबल सफाई व नैपकिन',
        icon: <Utensils className="w-4 h-4 text-purple-400" />,
        badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      };
    case 'FOOD_INFO':
      return {
        label: `Food Info: ${call.item_name || 'Dish'}`,
        hindi: `भोजन जानकारी: ${call.item_name || 'व्यंजन'}`,
        icon: <ChefHat className="w-4 h-4 text-orange-400" />,
        badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
      };
    case 'DOUBT':
      return {
        label: 'Question / Doubt',
        hindi: 'शंका या सवाल',
        icon: <HelpCircle className="w-4 h-4 text-blue-400" />,
        badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      };
    case 'FEEDBACK':
      return {
        label: 'Feedback / Manager',
        hindi: 'ग्राहक फीडबैक',
        icon: <MessageSquare className="w-4 h-4 text-pink-400" />,
        badgeClass: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
      };
    case 'WAITER':
    default:
      return {
        label: 'Call Waiter',
        hindi: 'वेटर को बुलाएं',
        icon: <UserCheck className="w-4 h-4 text-amber-400" />,
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      };
  }
}

function getAnnouncementText(call: ServiceCall): string {
  if (call.type === 'BILL') {
    return `Table ${call.table_number}: Requesting bill and payment.${call.notes ? ' ' + call.notes : ''}`;
  }
  if (call.type === 'WATER') {
    return `Table ${call.table_number}: Requesting water or cutlery.${call.notes ? ' ' + call.notes : ''}`;
  }
  if (call.type === 'FOOD_INFO') {
    return `Table ${call.table_number}: Food info requested for ${call.item_name || 'dish'}.${call.notes ? ' ' + call.notes : ''}`;
  }
  if (call.type === 'CLEAN') {
    return `Table ${call.table_number}: Requesting table clean and napkins.${call.notes ? ' ' + call.notes : ''}`;
  }
  if (call.type === 'DOUBT') {
    return `Table ${call.table_number}: Customer has a question.${call.notes ? ' ' + call.notes : ''}`;
  }
  return `Table ${call.table_number}: Calling waiter.${call.notes ? ' ' + call.notes : ''}`;
}

export function GlobalServiceBellPushNotification({ slug }: GlobalServiceBellPushNotificationProps) {
  const router = useRouter();
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [browserPerm, setBrowserPerm] = useState<NotificationPermission>('default');
  const knownCallIdsRef = useRef<Set<string>>(new Set());
  const isInitialMountRef = useRef<boolean>(true);

  // Check browser notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserPerm(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setBrowserPerm(perm);
      } catch (err) {
        console.warn('Error requesting notification permission:', err);
      }
    }
  };

  // Subscribe to service calls across any admin page
  useEffect(() => {
    let isCancelled = false;

    const checkServiceCalls = async () => {
      try {
        const res = await DataStore.getRestaurant(slug);
        if (!res || isCancelled) return;

        const allCalls = await DataStore.getServiceCalls(res.id);
        const pendingCalls = allCalls.filter(c => c.status === 'PENDING');

        // On first mount: record existing pending calls so we don't alert old calls
        if (isInitialMountRef.current) {
          pendingCalls.forEach(c => knownCallIdsRef.current.add(c.id));
          isInitialMountRef.current = false;
          return;
        }

        // On updates: detect brand new calls
        const brandNewCalls = pendingCalls.filter(c => !knownCallIdsRef.current.has(c.id));

        if (brandNewCalls.length > 0) {
          brandNewCalls.forEach(call => {
            knownCallIdsRef.current.add(call.id);

            // 1. Play audio chime & voice announcement
            audioManager.unlockAudio();
            const speakText = getAnnouncementText(call);
            audioManager.ringAndAnnounce(speakText);

            // 2. Trigger browser OS native notification if permitted
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              try {
                const details = getServiceCallDetails(call);
                const notif = new Notification(`🔔 Table #${call.table_number}: ${details.label}`, {
                  body: call.notes ? `"${call.notes}"` : `Table #${call.table_number} is requesting table service.`,
                  icon: '/favicon.ico',
                  tag: `service-call-${call.id}`,
                });
                notif.onclick = () => {
                  window.focus();
                  router.push(`/admin/${slug}/bells`);
                };
              } catch (e) {
                console.warn('Native notification failed:', e);
              }
            }

            // 3. Add to visible on-screen push notification toasts
            const toastId = `${call.id}-${Date.now()}`;
            setToasts(prev => [
              ...prev.filter(t => t.call.id !== call.id),
              { id: toastId, call, receivedAt: Date.now() },
            ]);

            // Auto-dismiss after 15 seconds
            setTimeout(() => {
              setToasts(prev => prev.filter(t => t.id !== toastId));
            }, 15000);
          });
        }
      } catch (err) {
        console.warn('Error checking service calls in global notification:', err);
      }
    };

    checkServiceCalls();
    const unsub = DataStore.subscribeToServiceCalls(slug, () => {
      checkServiceCalls();
    });

    return () => {
      isCancelled = true;
      unsub();
    };
  }, [slug, router]);

  const handleDismiss = (toastId: string) => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
  };

  const handleResolve = async (callId: string, toastId: string) => {
    try {
      await DataStore.resolveServiceCall(callId, 'Floor Waiter');
      audioManager.playSuccessChime();
    } catch (e) {
      console.warn('Resolve error:', e);
    }
    handleDismiss(toastId);
  };

  if (toasts.length === 0) return null;

  return (
    <aside 
      aria-label="Live Service Bell Alerts"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm sm:max-w-md w-[calc(100vw-2rem)] pointer-events-none"
    >
      {toasts.map(toast => {
        const { call } = toast;
        const details = getServiceCallDetails(call);

        return (
          <div
            key={toast.id}
            className="pointer-events-auto bg-neutral-900/98 backdrop-blur-md border-2 border-amber-500 rounded-2xl p-4 shadow-2xl shadow-amber-500/20 text-white animate-in slide-in-from-top-3 fade-in duration-200 ring-4 ring-amber-500/10 flex flex-col gap-3"
            role="alert"
          >
            {/* Header: Table number, Badge, and Close button */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center font-black shadow-md shadow-amber-500/30 shrink-0">
                  <BellRing className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-black text-amber-400">
                      Table #{call.table_number} Calling
                    </span>
                    <span className="text-[10px] font-mono text-stone-400 bg-neutral-800 px-1.5 py-0.5 rounded">
                      Just now
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-bold ${details.badgeClass}`}>
                      {details.icon}
                      <span>{details.label}</span>
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDismiss(toast.id)}
                className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition"
                title="Dismiss Notification"
                aria-label="Dismiss Notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Note text if provided by customer */}
            {call.notes && (
              <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-2.5 text-xs text-stone-200 italic">
                &ldquo;{call.notes}&rdquo;
              </div>
            )}

            {/* Quick Actions Row */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  audioManager.unlockAudio();
                  const speakText = getAnnouncementText(call);
                  audioManager.ringAndAnnounce(speakText);
                }}
                className="p-2 bg-neutral-800 hover:bg-neutral-750 text-amber-400 rounded-xl border border-neutral-700 transition"
                title="Speak announcement again"
                aria-label="Speak announcement again"
              >
                <Volume2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => handleResolve(call.id, toast.id)}
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition active:scale-98 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Send Waiter / Attend</span>
              </button>

              <Link
                href={`/admin/${slug}/bells`}
                onClick={() => handleDismiss(toast.id)}
                className="py-2 px-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs rounded-xl shadow-md transition active:scale-98 flex items-center justify-center gap-1"
                title="Open Bells Dispatch Page"
              >
                <span>Bells</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        );
      })}

      {/* Discrete prompt to enable desktop push notification if browser permissions not yet granted */}
      {browserPerm === 'default' && (
        <div className="pointer-events-auto bg-neutral-900/90 border border-neutral-800 rounded-xl p-2.5 text-xs text-stone-300 flex items-center justify-between gap-2 shadow-lg">
          <span className="text-[11px]">🔔 Want browser push alerts when diners ring?</span>
          <button
            type="button"
            onClick={requestNotificationPermission}
            className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-[10px] rounded-lg shrink-0"
          >
            Enable
          </button>
        </div>
      )}
    </aside>
  );
}
