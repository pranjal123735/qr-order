import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Persistent server store for individual order item statuses across devices
const STORE_FILE = path.join(process.cwd(), '.order_items_status.json');

export interface StoredItemStatus {
  orderId?: string;
  status: 'PENDING' | 'QUEUED' | 'COOKING' | 'READY' | 'ON_THE_WAY' | 'SERVED' | 'REJECTED';
  isPrepared: boolean;
  updatedAt: string;
}

function loadItemStatuses(): Record<string, StoredItemStatus> {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const data = fs.readFileSync(STORE_FILE, 'utf-8');
      return JSON.parse(data) || {};
    }
  } catch (err) {
    console.warn('Failed reading .order_items_status.json:', err);
  }
  return {};
}

function saveItemStatuses(map: Record<string, StoredItemStatus>): void {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(map, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed writing .order_items_status.json:', err);
  }
}

// In-memory cache
let memoryStatusMap: Record<string, StoredItemStatus> = loadItemStatuses();

// GET /api/orders/items
export async function GET() {
  memoryStatusMap = loadItemStatuses();
  return NextResponse.json({ statuses: memoryStatusMap });
}

// POST /api/orders/items
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, itemId, status } = body;

    if (!itemId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const isPrepared = status === 'READY' || status === 'ON_THE_WAY' || status === 'SERVED';

    memoryStatusMap = loadItemStatuses();
    memoryStatusMap[itemId] = {
      orderId: orderId || undefined,
      status,
      isPrepared,
      updatedAt: new Date().toISOString(),
    };
    saveItemStatuses(memoryStatusMap);

    // If Supabase is configured, persist the status in order_items.notes and touch orders.updated_at
    if (isSupabaseConfigured && supabase) {
      try {
        // 1. Fetch existing notes to preserve diner remarks
        const { data: itemData } = await supabase
          .from('order_items')
          .select('notes')
          .eq('id', itemId)
          .single();

        let cleanNotes = itemData?.notes || '';
        // Strip previous status tag
        cleanNotes = cleanNotes.replace(/__STATUS:[A-Z_]+__/g, '').trim();
        const updatedNotes = cleanNotes 
          ? `${cleanNotes} __STATUS:${status}__` 
          : `__STATUS:${status}__`;

        await supabase
          .from('order_items')
          .update({ notes: updatedNotes })
          .eq('id', itemId);

        // 2. Touch order updated_at to trigger Supabase Realtime across devices
        if (orderId) {
          await supabase
            .from('orders')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', orderId);
        }
      } catch (e) {
        console.warn('Supabase order_items sync notice:', e);
      }
    }

    return NextResponse.json({ success: true, item: memoryStatusMap[itemId] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
