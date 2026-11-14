'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { Restaurant } from '@/types/database';
import { DataStore } from '@/lib/store';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { 
  ArrowLeft, 
  Printer, 
  Flame, 
  BookOpen, 
  ExternalLink,
  Plus,
  Minus,
  Sparkles,
  Utensils
} from 'lucide-react';

function TableQRManagerContent() {
  const router = useRouter();
  const routeParams = useParams();
  const slug = (routeParams?.slug as string) || 'rustic-grill';

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [tableCount, setTableCount] = useState<number>(10);
  const [origin, setOrigin] = useState<string>('');

  useEffect(() => {
    async function load() {
      const res = await DataStore.getRestaurant(slug);
      if (res) setRestaurant(res);
    }
    load();
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, [slug]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const tables = Array.from({ length: tableCount }, (_, i) => i + 1);

  return (
    <AdminAuthGuard slug={slug}>
      <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col select-none print:bg-white print:text-black">
      {/* Screen-Only Header */}
      <header className="bg-stone-900 border-b border-stone-800 px-4 py-3 sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/admin/${slug}/live-orders`)}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-black text-lg text-white">Table QR Generator & Print</h1>
            <p className="text-xs text-stone-400">
              Generate scannable table cards for your dining room
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Table count adjuster */}
          <div className="flex items-center gap-2 bg-stone-800 px-3 py-1.5 rounded-xl border border-stone-700 text-xs">
            <span className="text-stone-400 font-semibold">Total Tables:</span>
            <button
              onClick={() => setTableCount(Math.max(1, tableCount - 1))}
              className="w-5 h-5 rounded bg-stone-700 hover:bg-stone-600 flex items-center justify-center font-bold"
            >
              -
            </button>
            <span className="font-bold text-amber-400 w-6 text-center">{tableCount}</span>
            <button
              onClick={() => setTableCount(tableCount + 1)}
              className="w-5 h-5 rounded bg-stone-700 hover:bg-stone-600 flex items-center justify-center font-bold"
            >
              +
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-black shadow transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print All QR Cards</span>
          </button>
        </div>
      </header>

      {/* Screen Info Notice */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-300 flex items-center justify-between print:hidden">
        <span>
          💡 <strong>Tip:</strong> Click <strong>&quot;Print All QR Cards&quot;</strong> to print standard 4×6 tabletop acrylic cards. Or click <strong>&quot;Test Table&quot;</strong> to open any table menu right now in a new tab!
        </span>
      </div>

      {/* Printable Grid */}
      <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 print:grid-cols-2 print:gap-4 print:p-0">
          {tables.map((tNum) => {
            const tableUrl = `${origin || ''}/r/${slug}?table=${tNum}`;

            return (
              <div
                key={tNum}
                className="bg-white text-stone-950 rounded-3xl p-6 border border-stone-200 shadow-md flex flex-col items-center text-center relative overflow-hidden print:border-2 print:border-black print:rounded-2xl print:shadow-none print:break-inside-avoid"
              >
                {/* Decorative header ribbon */}
                <div className="w-full pb-3 border-b border-stone-100 flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1.5 text-xs font-black tracking-wide text-stone-800 uppercase">
                    <Utensils className="w-3.5 h-3.5 text-amber-600" />
                    <span>{restaurant?.name || 'Rustic Grill'}</span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Dine-In
                  </span>
                </div>

                {/* Prominent Table Number */}
                <div className="mb-3">
                  <span className="text-xs uppercase font-extrabold tracking-widest text-stone-400">
                    Table Number
                  </span>
                  <div className="text-4xl font-black text-stone-950 tracking-tight">
                    #{tNum}
                  </div>
                </div>

                {/* Scannable QR Code */}
                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 shadow-inner my-2">
                  <QRCodeSVG
                    value={tableUrl}
                    size={160}
                    level="H"
                    includeMargin={false}
                  />
                </div>

                {/* Scan Instruction */}
                <div className="mt-3 text-center">
                  <p className="text-xs font-extrabold text-stone-800">
                    Scan with Phone Camera
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Browse menu & place your order
                  </p>
                </div>

                {/* Test button for screen view */}
                <div className="mt-4 pt-3 border-t border-stone-100 w-full flex items-center justify-center print:hidden">
                  <a
                    href={`/r/${slug}?table=${tNum}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                  >
                    <span>Table #{tNum}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
    </AdminAuthGuard>
  );
}

export default function TableQRManagerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-950 flex items-center justify-center text-stone-400">Loading Table QRs...</div>}>
      <TableQRManagerContent />
    </Suspense>
  );
}
