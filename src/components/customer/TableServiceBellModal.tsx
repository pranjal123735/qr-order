'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  X, 
  CreditCard, 
  HelpCircle, 
  MessageSquare, 
  Droplets, 
  UserCheck, 
  CheckCircle2,
  Sparkles,
  Clock
} from 'lucide-react';
import { ServiceCallType } from '@/types/database';
import { DataStore } from '@/lib/store';
import { audioManager } from '@/lib/audio';
import { useLanguage } from '@/lib/i18n';

interface TableServiceBellModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  tableNumber: number;
  orderId?: string;
  initialType?: ServiceCallType;
  initialItemName?: string;
}

export function TableServiceBellModal({
  isOpen,
  onClose,
  restaurantId,
  tableNumber,
  orderId,
  initialType = 'WAITER',
  initialItemName,
}: TableServiceBellModalProps) {
  const { t } = useLanguage();
  const [selectedType, setSelectedType] = useState<ServiceCallType>(initialType);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  useEffect(() => {
    const checkCooldown = () => {
      try {
        const stored = localStorage.getItem(`tablebite_bell_cooldown_table_${tableNumber}`);
        if (stored) {
          const exp = parseInt(stored, 10);
          const diff = Math.ceil((exp - Date.now()) / 1000);
          if (diff > 0) {
            setCooldownSeconds(diff);
            return;
          }
        }
        setCooldownSeconds(0);
      } catch {
        setCooldownSeconds(0);
      }
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, [tableNumber, isOpen]);

  if (!isOpen) return null;

  const serviceOptions: { type: ServiceCallType; label: string; icon: React.ReactNode; desc: string; color: string }[] = [
    {
      type: 'BILL',
      label: t.call_reason_pay,
      icon: <CreditCard className="w-5 h-5 text-emerald-600" />,
      desc: 'Cash, UPI QR, or Card payment at table',
      color: 'hover:border-emerald-500 hover:bg-emerald-50/50',
    },
    {
      type: 'DOUBT',
      label: t.call_reason_doubt,
      icon: <HelpCircle className="w-5 h-5 text-blue-600" />,
      desc: 'Ask about food preparation or recommendations',
      color: 'hover:border-blue-500 hover:bg-blue-50/50',
    },
    {
      type: 'FEEDBACK',
      label: t.call_reason_feedback,
      icon: <MessageSquare className="w-5 h-5 text-purple-600" />,
      desc: 'Share immediate dining experience or speak with manager',
      color: 'hover:border-purple-500 hover:bg-purple-50/50',
    },
    {
      type: 'WATER',
      label: t.call_reason_water,
      icon: <Droplets className="w-5 h-5 text-cyan-600" />,
      desc: 'Water bottle refill, fresh glasses, or extra plates',
      color: 'hover:border-cyan-500 hover:bg-cyan-50/50',
    },
    {
      type: 'CLEAN',
      label: 'Clean Table / Napkins / Cutlery',
      icon: <Sparkles className="w-5 h-5 text-emerald-600" />,
      desc: 'Request table clean, napkins, or fresh plates',
      color: 'hover:border-emerald-500 hover:bg-emerald-50/50',
    },
    {
      type: 'WAITER',
      label: t.call_reason_general,
      icon: <UserCheck className="w-5 h-5 text-amber-600" />,
      desc: 'Call staff directly to your table',
      color: 'hover:border-amber-500 hover:bg-amber-50/50',
    },
  ];

  const handleRingBell = async () => {
    if (cooldownSeconds > 0) return;
    try {
      setIsSubmitting(true);
      // On customer mobile device: gentle confirmation chime only (never speak aloud in dining hall)
      audioManager.playSuccessChime();

      // Start 60-second cooldown timer
      const cooldownUntil = Date.now() + 60000;
      try {
        localStorage.setItem(`tablebite_bell_cooldown_table_${tableNumber}`, cooldownUntil.toString());
        setCooldownSeconds(60);
      } catch {
        // ignore
      }

      await DataStore.createServiceCall({
        restaurant_id: restaurantId,
        table_number: tableNumber,
        order_id: orderId,
        type: selectedType,
        item_name: initialItemName,
        notes: note.trim() || undefined,
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setNote('');
        onClose();
      }, 2200);
    } catch (err) {
      console.error('Failed to ring service bell:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/30 backdrop-blur-xs flex items-center justify-center shadow-xs">
              <BellRing className="w-5 h-5 text-stone-950 animate-bounce" />
            </div>
            <div>
              <h3 className="font-black text-base leading-tight">
                {t.call_staff_bell}
              </h3>
              <p className="text-[11px] font-bold text-amber-950/80">
                {t.table_number}{tableNumber} • Table Service
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 text-stone-950 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-stone-900">
          {isSuccess ? (
            <div className="py-8 text-center space-y-3 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
              </div>
              <h4 className="text-xl font-black text-stone-950">
                {t.bell_rung_success.replace('{table}', String(tableNumber))}
              </h4>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                {t.waiter_on_way}
              </p>
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs text-stone-600 leading-relaxed font-medium">
                  {t.call_staff_desc}
                </p>
              </div>

              {initialItemName && (
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-amber-900 font-bold">
                    Regarding dish: <strong>{initialItemName}</strong>
                  </span>
                </div>
              )}

              {/* Service Reason Options */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-wider text-stone-500">
                  Select Assistance Type
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {serviceOptions.map((opt) => {
                    const isSelected = selectedType === opt.type;
                    return (
                      <button
                        key={opt.type}
                        type="button"
                        onClick={() => setSelectedType(opt.type)}
                        className={`w-full p-3 rounded-2xl border text-left transition flex items-center gap-3 ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/80 shadow-xs ring-2 ring-amber-500/20'
                            : `border-stone-200 bg-stone-50/50 ${opt.color}`
                        }`}
                      >
                        <div className={`p-2 rounded-xl ${isSelected ? 'bg-amber-100' : 'bg-white shadow-2xs'}`}>
                          {opt.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-stone-900 truncate">
                            {opt.label}
                          </p>
                          <p className="text-[11px] text-stone-500 truncate">
                            {opt.desc}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Note */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-stone-500">
                  Additional Note (Optional)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Bring QR scanner for payment, less ice, or high chair..."
                  className="w-full px-3.5 py-2.5 text-xs bg-stone-50 text-stone-900 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Active Cooldown / Anti-Spam Notice */}
              {cooldownSeconds > 0 && (
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-300 flex items-start gap-2.5 animate-in fade-in">
                  <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5 animate-spin" />
                  <div className="text-xs">
                    <p className="font-black text-amber-950">
                      Staff Already Notified for Table #{tableNumber}
                    </p>
                    <p className="text-stone-600 text-[11px] mt-0.5">
                      To prevent kitchen disruption, you can ring again in <strong>{cooldownSeconds}s</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                disabled={isSubmitting || cooldownSeconds > 0}
                onClick={handleRingBell}
                className={`w-full py-4 text-xs font-black rounded-2xl transition flex items-center justify-center gap-2 ${
                  cooldownSeconds > 0
                    ? 'bg-stone-200 text-stone-500 cursor-not-allowed border border-stone-300'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 shadow-lg shadow-amber-500/25 active:scale-98'
                }`}
              >
                {cooldownSeconds > 0 ? (
                  <>
                    <Clock className="w-4 h-4 text-stone-500" />
                    <span>Ringing Cooldown ({cooldownSeconds}s remaining)</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4 stroke-[2.5]" />
                    <span>
                      {isSubmitting ? t.bell_ringing : `${t.btn_ring_bell} (Table #${tableNumber})`}
                    </span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
