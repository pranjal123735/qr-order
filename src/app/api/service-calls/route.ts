import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ServiceCall } from '@/types/database';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Persistent server-side store across devices (Mobile -> Server -> Laptop)
const STORE_FILE = path.join(process.cwd(), '.service_calls.json');

// In-memory cache for ultra-fast response
let memoryCalls: ServiceCall[] = [];

function loadCallsFromFile(): ServiceCall[] {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const data = fs.readFileSync(STORE_FILE, 'utf-8');
      return JSON.parse(data) || [];
    }
  } catch (err) {
    console.warn('Failed reading .service_calls.json:', err);
  }
  return [];
}

function saveCallsToFile(calls: ServiceCall[]): void {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(calls, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed writing .service_calls.json:', err);
  }
}

// Initialize on server startup
memoryCalls = loadCallsFromFile();

// GET /api/service-calls?restaurant_id=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const restaurantId = searchParams.get('restaurant_id');

  // Synchronize memory cache with file
  const fileCalls = loadCallsFromFile();
  if (fileCalls.length > 0) {
    memoryCalls = fileCalls;
  }

  // If Supabase configured, attempt to query remote table as well
  if (isSupabaseConfigured && supabase && restaurantId) {
    try {
      const { data, error } = await supabase
        .from('service_calls')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        // Merge Supabase calls with local memory calls
        const map = new Map<string, ServiceCall>();
        memoryCalls.forEach(c => map.set(c.id, c));
        (data as ServiceCall[]).forEach(c => map.set(c.id, c));
        memoryCalls = Array.from(map.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
    } catch {
      // fallback to memory/file
    }
  }

  const filtered = restaurantId
    ? memoryCalls.filter(c => 
        c.restaurant_id === restaurantId ||
        c.restaurant_id === 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' ||
        restaurantId === 'rustic-grill' ||
        c.restaurant_id === 'rustic-grill'
      )
    : memoryCalls;

  return NextResponse.json({ calls: filtered });
}

// POST /api/service-calls (Mobile phone rings bell)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { restaurant_id, table_number, order_id, type, item_name, item_id, notes } = body;

    if (!restaurant_id || !table_number || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Refresh memory
    memoryCalls = loadCallsFromFile();

    // Anti-Spam Deduplication Guard (60s check)
    const existingActive = memoryCalls.find(
      c =>
        c.restaurant_id === restaurant_id &&
        c.table_number === table_number &&
        c.status === 'PENDING' &&
        (c.type === type || (item_id && c.item_id === item_id))
    );

    if (existingActive) {
      const elapsed = Date.now() - new Date(existingActive.created_at).getTime();
      if (elapsed < 60000) {
        return NextResponse.json({ call: existingActive, deduplicated: true });
      }
    }

    const newCall: ServiceCall = {
      id: 'call-' + Math.random().toString(36).substring(2, 9),
      restaurant_id,
      table_number: Number(table_number),
      order_id: order_id || undefined,
      type,
      item_name: item_name || undefined,
      item_id: item_id || undefined,
      notes: notes ? String(notes).trim() : undefined,
      status: 'PENDING',
      created_at: new Date().toISOString(),
    };

    memoryCalls.unshift(newCall);
    saveCallsToFile(memoryCalls);

    // If Supabase is configured, attempt insert
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('service_calls').insert(newCall);
      } catch {
        // ignore if table not created yet in Supabase
      }

      // If order_id exists, touch updated_at in orders table to trigger Supabase Realtime broadcast!
      if (order_id) {
        try {
          await supabase
            .from('orders')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', order_id);
        } catch {
          // ignore
        }
      }
    }

    return NextResponse.json({ call: newCall, success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/service-calls (Kitchen marks Attended/Resolved)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { callId, status } = body;

    if (!callId) {
      return NextResponse.json({ error: 'Missing callId' }, { status: 400 });
    }

    memoryCalls = loadCallsFromFile();
    const targetStatus = status || 'RESOLVED';

    memoryCalls = memoryCalls.map(c =>
      c.id === callId ? { ...c, status: targetStatus as 'PENDING' | 'RESOLVED' } : c
    );

    saveCallsToFile(memoryCalls);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('service_calls')
          .update({ status: targetStatus })
          .eq('id', callId);
      } catch {
        // ignore
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
