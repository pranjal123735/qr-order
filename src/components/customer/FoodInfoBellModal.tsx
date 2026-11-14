'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  X, 
  Clock, 
  CheckCircle2, 
  Flame, 
  Sparkles, 
  Utensils, 
  ShieldCheck,
  Info
} from 'lucide-react';
import { OrderItem, MenuItem } from '@/types/database';
import { DataStore } from '@/lib/store';
import { audioManager } from '@/lib/audio';
import { useLanguage } from '@/lib/i18n';
import { translateFoodName, translateFoodDescription } from '@/lib/foodTranslations';

interface FoodInfoBellModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  tableNumber: number;
  orderId: string;
  item: OrderItem | null;
  menuItem?: MenuItem | null;
}

export function FoodInfoBellModal({
  isOpen,
  onClose,
  restaurantId,
  tableNumber,
  orderId,
  item,
  menuItem,
}: FoodInfoBellModalProps) {
  const { t, isHindi } = useLanguage();
  const [selectedQuickInquiry, setSelectedQuickInquiry] = useState<string>('prep_time');
  const [customInquiry, setCustomInquiry] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  const dishCooldownKey = item ? `tablebite_dish_cooldown_${item.id || item.item_name}` : '';

  useEffect(() => {
    if (!dishCooldownKey) return;
    const checkDishCooldown = () => {
      try {
        const stored = localStorage.getItem(dishCooldownKey);
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

    checkDishCooldown();
    const interval = setInterval(checkDishCooldown, 1000);
    return () => clearInterval(interval);
  }, [dishCooldownKey, isOpen]);

  if (!isOpen || !item) return null;

  const quickInquiries = [
    {
      id: 'prep_time',
      text: t.ask_prep_time,
      tag: 'Status & Time',
    },
    {
      id: 'spice_level',
      text: t.ask_spice_level,
      tag: 'Ingredients / Spices',
    },
    {
      id: 'cutlery',
      text: t.request_cutlery_sauce,
      tag: 'Sauce / Cutlery',
    },
  ];

  const handleRingKitchen = async () => {
    if (cooldownSeconds > 0) return;
    try {
      setIsSubmitting(true);
      // Play audio chime and speak what dish was selected
      await audioManager.unlockAudio();
      audioManager.ringAndAnnounce(`Kitchen bell rung for ${item.item_name}. Table ${tableNumber}.`);

      // 90 second cooldown for this dish
      const cooldownUntil = Date.now() + 90000;
      try {
        localStorage.setItem(dishCooldownKey, cooldownUntil.toString());
        setCooldownSeconds(90);
      } catch {
        // ignore
      }

      const activeInquiryObj = quickInquiries.find(q => q.id === selectedQuickInquiry);
      const chosenText = activeInquiryObj ? activeInquiryObj.text : '';
      const fullNote = customInquiry.trim() 
        ? `${chosenText ? chosenText + ' — ' : ''}${customInquiry.trim()}`
        : chosenText;

      await DataStore.createServiceCall({
        restaurant_id: restaurantId,
        table_number: tableNumber,
        order_id: orderId,
        type: 'FOOD_INFO',
        item_name: item.item_name,
        item_id: item.id,
        notes: fullNote,
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setCustomInquiry('');
        onClose();
      }, 2200);
    } catch (err) {
      console.error('Failed to ring kitchen for dish:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayName = isHindi ? translateFoodName(item.item_name, true) : item.item_name;
  const description = menuItem?.description 
    ? (isHindi ? translateFoodDescription(menuItem.description, true) : menuItem.description)
    : 'Freshly prepared by our culinary team with authentic spices.';

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with Dish Name & Ring Bell Theme */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-stone-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/30 backdrop-blur-xs flex items-center justify-center shadow-xs">
              <BellRing className="w-5 h-5 text-stone-950 animate-bounce" />
            </div>
            <div>
              <h3 className="font-black text-base leading-tight">
                {t.dish_info_title}
              </h3>
              <p className="text-[11px] font-bold text-amber-950/80">
                {t.table_number}{tableNumber} • {t.ring_kitchen_for_dish}
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

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-stone-900">
          {isSuccess ? (
            <div className="py-8 text-center space-y-3 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
              </div>
              <h4 className="text-xl font-black text-stone-950">
                🛎️ Kitchen Rung for {displayName}!
              </h4>
              <p className="text-xs text-stone-600 max-w-xs mx-auto">
                {t.bell_rung_success.replace('{table}', String(tableNumber))}
              </p>
            </div>
          ) : (
            <>
              {/* Dish Snapshot Card */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/90 flex items-start gap-3.5">
                {menuItem?.image_url ? (
                  <img
                    src={menuItem.image_url}
                    alt={displayName}
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-stone-200 shadow-xs"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <Utensils className="w-7 h-7" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-1.5 py-0.5 bg-stone-200 text-stone-900 font-black text-[11px] rounded">
                      {item.quantity}×
                    </span>
                    <h4 className="font-black text-sm text-stone-950 truncate">
                      {displayName}
                    </h4>
                    {menuItem && (
                      <span className={`w-3.5 h-3.5 border flex items-center justify-center rounded-xs shrink-0 ${
                        menuItem.is_veg ? 'border-emerald-600 text-emerald-600' : 'border-rose-600 text-rose-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${menuItem.is_veg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                    {description}
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    {item.is_prepared ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {t.cooked_and_ready}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded-md flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-700 animate-spin" />
                        {t.preparing_status}
                      </span>
                    )}
                    <span className="text-xs font-black text-stone-900">
                      ₹{(item.item_price * item.quantity).toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Inquiry Reason Prompt */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-wider text-stone-500">
                  Select What You Want to Ask the Kitchen
                </label>
                <div className="space-y-2">
                  {quickInquiries.map((q) => {
                    const isSelected = selectedQuickInquiry === q.id;
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setSelectedQuickInquiry(q.id)}
                        className={`w-full p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-500/20'
                            : 'border-stone-200 bg-stone-50/60 hover:bg-stone-100/70'
                        }`}
                      >
                        <span className="text-xs font-bold text-stone-900">
                          {q.text}
                        </span>
                        <span className="text-[10px] font-black px-2 py-0.5 bg-white rounded-md text-stone-600 border border-stone-200 shrink-0 ml-2">
                          {q.tag}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Note for Chef */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-stone-500">
                  Custom Request or Question
                </label>
                <input
                  type="text"
                  value={customInquiry}
                  onChange={(e) => setCustomInquiry(e.target.value)}
                  placeholder={t.dish_inquiry_placeholder}
                  className="w-full px-3.5 py-2.5 text-xs bg-stone-50 text-stone-900 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Anti-Spam / Dish Cooldown Notice */}
              {cooldownSeconds > 0 && (
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-300 flex items-start gap-2.5 animate-in fade-in">
                  <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5 animate-spin" />
                  <div className="text-xs">
                    <p className="font-black text-amber-950">
                      Chef Already Alerted for {displayName}
                    </p>
                    <p className="text-stone-600 text-[11px] mt-0.5">
                      Dish is actively cooking on the stove. You can inquire again in <strong>{cooldownSeconds}s</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Ring Bell CTA Button */}
              <button
                disabled={isSubmitting || cooldownSeconds > 0}
                onClick={handleRingKitchen}
                className={`w-full py-4 text-xs font-black rounded-2xl transition flex items-center justify-center gap-2 ${
                  cooldownSeconds > 0
                    ? 'bg-stone-200 text-stone-500 cursor-not-allowed border border-stone-300'
                    : 'bg-gradient-to-r from-amber-500 via-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 shadow-lg shadow-amber-500/25 active:scale-98'
                }`}
              >
                {cooldownSeconds > 0 ? (
                  <>
                    <Clock className="w-4 h-4 text-stone-500" />
                    <span>Inquiry Cooldown ({cooldownSeconds}s left)</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4 stroke-[2.5]" />
                    <span>
                      {isSubmitting ? t.bell_ringing : `${t.btn_send_dish_ring} 🛎️`}
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
