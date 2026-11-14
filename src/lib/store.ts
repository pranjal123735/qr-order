import { supabase, isSupabaseConfigured } from './supabase';
import { 
  Restaurant, 
  Category, 
  MenuItem, 
  Order, 
  OrderItem, 
  OrderStatus,
  ServiceCall 
} from '@/types/database';
import { 
  INITIAL_RESTAURANT, 
  INITIAL_CATEGORIES, 
  INITIAL_MENU_ITEMS, 
  INITIAL_ORDERS 
} from './mockData';

// Safe Browser Broadcast Channel + Storage Event for 100% reliable local real-time sync across tabs and windows
class CrossTabSync {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(event: { type: string; payload: unknown }) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      if ('BroadcastChannel' in window) {
        try {
          this.channel = new BroadcastChannel('qr_order_realtime_sync');
          this.channel.onmessage = (event) => {
            this.listeners.forEach(fn => fn(event.data));
          };
        } catch (err) {
          console.warn('BroadcastChannel not initialized:', err);
        }
      }

      // Also listen to storage events for multi-window and background tab reliability
      window.addEventListener('storage', (e) => {
        if (e.key === 'qr_cross_tab_sync_event' && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            if (data && data.type) {
              this.listeners.forEach(fn => fn(data));
            }
          } catch {
            // ignore
          }
        }
      });
    }
  }

  public emit(type: string, payload: unknown) {
    if (this.channel) {
      try {
        this.channel.postMessage({ type, payload });
      } catch (err) {
        console.warn('BroadcastChannel emit error:', err);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('qr_cross_tab_sync_event', JSON.stringify({ type, payload, _ts: Date.now() }));
      } catch {
        // ignore
      }
    }

    // Also trigger locally in current window
    this.listeners.forEach(fn => fn({ type, payload }));
  }

  public subscribe(fn: (event: { type: string; payload: unknown }) => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }
}

export const localSync = new CrossTabSync();

// Helper to get or set local items in memory/localStorage
function getStored<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(`qr_store_${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`qr_store_${key}`, JSON.stringify(value));
  } catch (err) {
    console.warn('localStorage setItem failed:', err);
  }
}

export const DataStore = {
  // 1. Get All Restaurants (for Multi-Tenant Switcher / Directory)
  async getAllRestaurants(): Promise<Restaurant[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data as Restaurant[];
    }
    const all = getStored<Restaurant[]>('restaurants_list', [INITIAL_RESTAURANT]);
    return all;
  },

  // Create New Restaurant (Onboarding)
  async createRestaurant(params: {
    name: string;
    slug: string;
    tagline?: string;
    currency?: string;
    logo_url?: string;
    banner_url?: string;
  }): Promise<Restaurant> {
    const newId = 'rest-' + Math.random().toString(36).substring(2, 9);
    const newRest: Restaurant = {
      id: newId,
      name: params.name,
      slug: params.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      tagline: params.tagline || 'Fresh food delivered to your table',
      currency: params.currency || '₹',
      logo_url: params.logo_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&auto=format&fit=crop&q=80',
      banner_url: params.banner_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
      is_active: true,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('restaurants')
        .insert({
          name: newRest.name,
          slug: newRest.slug,
          tagline: newRest.tagline,
          currency: newRest.currency,
          logo_url: newRest.logo_url,
          banner_url: newRest.banner_url,
        })
        .select()
        .single();
      if (!error && data) {
        newRest.id = data.id;
      }
    }

    // Save in local storage list
    const current = getStored<Restaurant[]>('restaurants_list', [INITIAL_RESTAURANT]);
    const filtered = current.filter(r => r.slug !== newRest.slug);
    const updated = [newRest, ...filtered];
    setStored('restaurants_list', updated);

    // Seed default categories for this new restaurant
    const defaultCats: Category[] = [
      { id: `cat-${newRest.id}-1`, restaurant_id: newRest.id, name: 'Starters & Appetizers', sort_order: 1 },
      { id: `cat-${newRest.id}-2`, restaurant_id: newRest.id, name: 'Main Courses', sort_order: 2 },
      { id: `cat-${newRest.id}-3`, restaurant_id: newRest.id, name: 'Beverages', sort_order: 3 },
      { id: `cat-${newRest.id}-4`, restaurant_id: newRest.id, name: 'Desserts', sort_order: 4 },
    ];
    const existingCats = getStored<Category[]>('categories', INITIAL_CATEGORIES);
    setStored('categories', [...existingCats, ...defaultCats]);

    localSync.emit('RESTAURANT_CREATED', newRest);
    return newRest;
  },

  // Get Restaurant by Slug
  async getRestaurant(slug: string): Promise<Restaurant | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .single();
      if (!error && data) return data as Restaurant;
    }
    // Mock fallback
    const all = getStored<Restaurant[]>('restaurants_list', [INITIAL_RESTAURANT]);
    const match = all.find(r => r.slug === slug);
    if (match) return match;
    if (slug === 'demo' || slug === 'rustic-grill') {
      return INITIAL_RESTAURANT;
    }
    return null;
  },

  // 2. Get Categories (Strictly scoped to restaurant_id)
  async getCategories(restaurantId: string): Promise<Category[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('sort_order', { ascending: true });
      if (!error && data) return data as Category[];
    }
    const all = getStored<Category[]>('categories', INITIAL_CATEGORIES);
    return all.filter(c => c.restaurant_id === restaurantId);
  },

  // Ensure category exists or create it
  async ensureCategory(restaurantId: string, categoryName: string): Promise<Category> {
    const existing = await this.getCategories(restaurantId);
    const found = existing.find(c => c.name.toLowerCase().trim() === categoryName.toLowerCase().trim());
    if (found) return found;

    const newCat: Category = {
      id: `cat-${restaurantId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      restaurant_id: restaurantId,
      name: categoryName.trim(),
      sort_order: existing.length + 1,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          restaurant_id: newCat.restaurant_id,
          name: newCat.name,
          sort_order: newCat.sort_order,
        })
        .select()
        .single();
      if (!error && data) return data as Category;
    }

    const allCats = getStored<Category[]>('categories', INITIAL_CATEGORIES);
    const updated = [...allCats, newCat];
    setStored('categories', updated);
    localSync.emit('CATEGORIES_UPDATED', updated);
    return newCat;
  },

  // 3. Get Menu Items (Strictly scoped to restaurant_id)
  async getMenuItems(restaurantId: string): Promise<MenuItem[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('sort_order', { ascending: true });
      if (!error && data) return data as MenuItem[];
    }
    const all = getStored<MenuItem[]>('menu_items', INITIAL_MENU_ITEMS);
    return all.filter(it => it.restaurant_id === restaurantId);
  },

  // 4. Toggle Menu Item Availability (Sold Out switch)
  async toggleMenuItemAvailability(itemId: string, isAvailable: boolean): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: isAvailable })
        .eq('id', itemId);
      return !error;
    }
    // Mock store
    const items = getStored<MenuItem[]>('menu_items', INITIAL_MENU_ITEMS);
    const updated = items.map(it => it.id === itemId ? { ...it, is_available: isAvailable } : it);
    setStored('menu_items', updated);
    localSync.emit('MENU_UPDATED', updated);
    return true;
  },

  // Add / Edit Menu Item
  async saveMenuItem(item: Partial<MenuItem> & { restaurant_id: string }): Promise<MenuItem> {
    if (isSupabaseConfigured && supabase) {
      if (item.id) {
        const { data, error } = await supabase
          .from('menu_items')
          .update(item)
          .eq('id', item.id)
          .select()
          .single();
        if (!error && data) return data as MenuItem;
      } else {
        const { data, error } = await supabase
          .from('menu_items')
          .insert(item)
          .select()
          .single();
        if (!error && data) return data as MenuItem;
      }
    }
    const items = getStored<MenuItem[]>('menu_items', INITIAL_MENU_ITEMS);
    let result: MenuItem;
    if (item.id) {
      const idx = items.findIndex(it => it.id === item.id);
      result = { ...items[idx], ...item } as MenuItem;
      items[idx] = result;
    } else {
      result = {
        id: 'item-' + Date.now(),
        restaurant_id: item.restaurant_id,
        category_id: item.category_id || 'cat-1',
        name: item.name || 'New Item',
        description: item.description || '',
        price: Number(item.price) || 0,
        image_url: item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80',
        is_veg: Boolean(item.is_veg),
        is_available: true,
        sort_order: items.length + 1,
      };
      items.push(result);
    }
    setStored('menu_items', items);
    localSync.emit('MENU_UPDATED', items);
    return result;
  },

  // Bulk Save Menu Items (e.g. from AI Menu Scanner)
  async saveBulkMenuItems(items: Array<Omit<MenuItem, 'id'> & { id?: string }>): Promise<MenuItem[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('menu_items')
        .insert(items)
        .select();
      if (!error && data) return data as MenuItem[];
    }

    const currentItems = getStored<MenuItem[]>('menu_items', INITIAL_MENU_ITEMS);
    const createdItems: MenuItem[] = items.map((it, idx) => ({
      id: it.id || `item-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      restaurant_id: it.restaurant_id,
      category_id: it.category_id,
      name: it.name,
      description: it.description || '',
      price: Number(it.price) || 0,
      image_url: it.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80',
      is_veg: Boolean(it.is_veg),
      is_available: it.is_available ?? true,
      sort_order: currentItems.length + idx + 1,
      created_at: new Date().toISOString(),
    }));

    const updated = [...currentItems, ...createdItems];
    setStored('menu_items', updated);
    localSync.emit('MENU_UPDATED', updated);
    return createdItems;
  },

  // Delete Menu Item
  async deleteMenuItem(itemId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', itemId);
      return !error;
    }
    const current = getStored<MenuItem[]>('menu_items', INITIAL_MENU_ITEMS);
    const filtered = current.filter(it => it.id !== itemId);
    setStored('menu_items', filtered);
    localSync.emit('MENU_UPDATED', filtered);
    return true;
  },

  // 5. Create Order
  async createOrder(
    orderData: {
      restaurant_id: string;
      table_number: number;
      customer_name: string;
      customer_phone?: string;
      notes?: string;
      total_amount: number;
    },
    items: Array<{
      menu_item_id: string;
      item_name: string;
      item_price: number;
      quantity: number;
      notes?: string;
    }>
  ): Promise<Order> {
    const newOrderId = 'ord-' + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    const orderItems: OrderItem[] = items.map((it, idx) => ({
      id: `oi-${newOrderId}-${idx}`,
      order_id: newOrderId,
      menu_item_id: it.menu_item_id,
      item_name: it.item_name,
      item_price: it.item_price,
      quantity: it.quantity,
      notes: it.notes,
    }));

    const newOrder: Order = {
      id: newOrderId,
      restaurant_id: orderData.restaurant_id,
      table_number: orderData.table_number,
      customer_name: orderData.customer_name || 'Guest',
      customer_phone: orderData.customer_phone,
      status: 'PENDING',
      notes: orderData.notes,
      total_amount: orderData.total_amount,
      created_at: now,
      updated_at: now,
      items: orderItems,
    };

    if (isSupabaseConfigured && supabase) {
      const { data: createdOrder, error } = await supabase
        .from('orders')
        .insert({
          restaurant_id: orderData.restaurant_id,
          table_number: orderData.table_number,
          customer_name: orderData.customer_name,
          customer_phone: orderData.customer_phone,
          status: 'PENDING',
          notes: orderData.notes,
          total_amount: orderData.total_amount,
        })
        .select()
        .single();

      if (!error && createdOrder) {
        const orderItemsWithRealId = items.map(it => ({
          order_id: createdOrder.id,
          menu_item_id: it.menu_item_id,
          item_name: it.item_name,
          item_price: it.item_price,
          quantity: it.quantity,
          notes: it.notes,
        }));
        await supabase.from('order_items').insert(orderItemsWithRealId);
        newOrder.id = createdOrder.id;
      }
    }

    // Update local cache
    const currentOrders = getStored<Order[]>('orders', INITIAL_ORDERS);
    const updatedOrders = [newOrder, ...currentOrders];
    setStored('orders', updatedOrders);

    // Save in user active order session for that table
    setStored(`active_order_${orderData.restaurant_id}_table_${orderData.table_number}`, newOrder.id);

    // Broadcast in real-time
    localSync.emit('NEW_ORDER', newOrder);

    return newOrder;
  },

  // 6. Get Order by ID
  async getOrder(orderId: string): Promise<Order | null> {
    if (isSupabaseConfigured && supabase) {
      const { data: order, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .eq('id', orderId)
        .single();
      if (!error && order) return order as Order;
    }
    const orders = getStored<Order[]>('orders', INITIAL_ORDERS);
    return orders.find(o => o.id === orderId) || null;
  },

  // 7. Get All Orders for Restaurant (Strictly scoped to restaurant_id)
  async getOrders(restaurantId: string): Promise<Order[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });
      if (!error && data) return data as Order[];
    }
    const all = getStored<Order[]>('orders', INITIAL_ORDERS);
    return all.filter(o => o.restaurant_id === restaurantId);
  },

  // 8. Cancel Order (Permitted only if status is PENDING)
  async cancelOrder(orderId: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.getOrder(orderId);
    if (!existing) {
      return { success: false, message: 'Order not found.' };
    }
    if (existing.status !== 'PENDING') {
      return { 
        success: false, 
        message: 'Order has already been confirmed or prepared by the kitchen and cannot be cancelled.' 
      };
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .eq('status', 'PENDING');
      if (error) return { success: false, message: error.message };
    }

    const orders = getStored<Order[]>('orders', INITIAL_ORDERS);
    const updated = orders.map(o => 
      o.id === orderId ? { ...o, status: 'CANCELLED' as OrderStatus, updated_at: new Date().toISOString() } : o
    );
    setStored('orders', updated);
    localSync.emit('ORDER_STATUS_CHANGED', { orderId, status: 'CANCELLED' });

    return { success: true, message: 'Order was successfully cancelled.' };
  },

  // 9. Update Order Status (Kitchen Staff Action: CONFIRMED, PREPARING, SERVED, REJECTED)
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);
      if (error) return false;
    }

    const orders = getStored<Order[]>('orders', INITIAL_ORDERS);
    const updated = orders.map(o => 
      o.id === orderId ? { ...o, status, updated_at: new Date().toISOString() } : o
    );
    setStored('orders', updated);
    localSync.emit('ORDER_STATUS_CHANGED', { orderId, status });
    return true;
  },

  // 9b. Toggle individual item prepared state (Kitchen dish checklist live sync)
  async toggleOrderItemPrepared(orderId: string, itemId: string, isPrepared: boolean): Promise<boolean> {
    const orders = getStored<Order[]>('orders', INITIAL_ORDERS);
    const updated = orders.map(o => {
      if (o.id !== orderId) return o;
      const updatedItems = o.items?.map(it => 
        it.id === itemId 
          ? { ...it, is_prepared: isPrepared, item_status: (isPrepared ? 'READY' : 'COOKING') as import('@/types/database').ItemPrepStatus } 
          : it
      );
      return { ...o, items: updatedItems, updated_at: new Date().toISOString() };
    });
    setStored('orders', updated);
    localSync.emit('ORDER_UPDATED', { orderId, itemId, isPrepared });
    return true;
  },

  // 9b-2. Set precise dish status: 'PENDING' | 'QUEUED' | 'COOKING' | 'READY' | 'ON_THE_WAY' | 'SERVED' | 'REJECTED'
  async updateOrderItemStatus(orderId: string, itemId: string, status: import('@/types/database').ItemPrepStatus): Promise<boolean> {
    const isPrepared = status === 'READY' || status === 'ON_THE_WAY' || status === 'SERVED';
    
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('order_items')
          .update({ item_status: status, is_prepared: isPrepared })
          .eq('id', itemId);
      } catch (e) {
        console.warn('Could not update order_items in supabase:', e);
      }
    }

    const orders = getStored<Order[]>('orders', INITIAL_ORDERS);
    let newOrderStatus: import('@/types/database').OrderStatus | undefined = undefined;

    const updated = orders.map(o => {
      if (o.id !== orderId) return o;
      const updatedItems = o.items?.map(it => 
        it.id === itemId 
          ? { ...it, item_status: status, is_prepared: isPrepared } 
          : it
      ) || [];

      // Smart auto-adjustment of overall order status based on individual items
      const nonRejected = updatedItems.filter(it => it.item_status !== 'REJECTED');
      if (updatedItems.length > 0 && nonRejected.length === 0) {
        // Every single item was rejected
        newOrderStatus = 'REJECTED';
      } else if (nonRejected.length > 0 && nonRejected.every(it => it.item_status === 'SERVED')) {
        // All non-rejected items have been served
        newOrderStatus = 'SERVED';
      } else if (nonRejected.some(it => it.item_status === 'ON_THE_WAY') && ['PENDING', 'CONFIRMED', 'PREPARING'].includes(o.status)) {
        // At least one item is on the way
        newOrderStatus = 'ON_THE_WAY';
      } else if (nonRejected.some(it => it.item_status === 'COOKING') && ['PENDING', 'CONFIRMED'].includes(o.status)) {
        // At least one item is cooking
        newOrderStatus = 'PREPARING';
      }

      return { 
        ...o, 
        items: updatedItems, 
        status: newOrderStatus || o.status,
        updated_at: new Date().toISOString() 
      };
    });

    setStored('orders', updated);
    localSync.emit('ORDER_UPDATED', { orderId, itemId, itemStatus: status, isPrepared });
    localSync.emit('ORDER_STATUS_CHANGED', { orderId, status: newOrderStatus });
    return true;
  },

  // 9c. Submit diner feedback & per-dish ratings and remarks
  async submitOrderFeedback(orderId: string, feedback: import('@/types/database').OrderFeedback): Promise<boolean> {
    const orders = getStored<Order[]>('orders', INITIAL_ORDERS);
    const updated = orders.map(o => {
      if (o.id !== orderId) return o;
      const updatedItems = o.items?.map(it => {
        const itemReview = feedback.item_reviews?.[it.id];
        if (itemReview) {
          return {
            ...it,
            rating: itemReview.rating,
            remark: itemReview.remark,
          };
        }
        return it;
      });
      return {
        ...o,
        feedback,
        items: updatedItems,
        updated_at: new Date().toISOString(),
      };
    });
    setStored('orders', updated);
    localSync.emit('ORDER_UPDATED', { orderId, feedback });
    return true;
  },

  // 10. Realtime Subscriptions
  subscribeToOrders(restaurantIdOrSlug: string, onUpdate: () => void) {
    const unsubLocal = localSync.subscribe((event) => {
      if (['NEW_ORDER', 'ORDER_STATUS_CHANGED', 'ORDER_UPDATED'].includes(event.type)) {
        onUpdate();
      }
    });

    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      const channel = client
        .channel(`public:orders:${restaurantIdOrSlug}:${Math.random().toString(36).substring(2, 7)}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          () => {
            onUpdate();
          }
        )
        .subscribe();

      return () => {
        unsubLocal();
        client.removeChannel(channel);
      };
    }

    return unsubLocal;
  },

  subscribeToOrder(orderId: string, onUpdate: (order: Order) => void) {
    const unsubLocal = localSync.subscribe(async (event) => {
      if (event.type === 'ORDER_STATUS_CHANGED' || event.type === 'ORDER_UPDATED') {
        const payload = event.payload as { orderId: string };
        if (payload.orderId === orderId) {
          const fresh = await DataStore.getOrder(orderId);
          if (fresh) onUpdate(fresh);
        }
      }
    });

    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      const channel = client
        .channel(`public:order:${orderId}:${Math.random().toString(36).substring(2, 7)}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
          async () => {
            const fresh = await DataStore.getOrder(orderId);
            if (fresh) onUpdate(fresh);
          }
        )
        .subscribe();

      return () => {
        unsubLocal();
        client.removeChannel(channel);
      };
    }

    return unsubLocal;
  },

  subscribeToMenuItems(restaurantId: string, onUpdate: () => void) {
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      const channel = client
        .channel(`public:menu:${restaurantId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'menu_items', filter: `restaurant_id=eq.${restaurantId}` },
          () => onUpdate()
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    }

    return localSync.subscribe((event) => {
      if (event.type === 'MENU_UPDATED') {
        onUpdate();
      }
    });
  },

  // 11. Service Calls & Table Bell Rings (Cross-Device: Mobile -> Server -> Laptop)
  async createServiceCall(data: {
    restaurant_id: string;
    table_number: number;
    type: import('@/types/database').ServiceCallType;
    order_id?: string;
    item_name?: string;
    item_id?: string;
    notes?: string;
  }): Promise<ServiceCall> {
    let createdCall: ServiceCall = {
      id: 'call-' + Math.random().toString(36).substring(2, 9),
      restaurant_id: data.restaurant_id,
      table_number: Number(data.table_number),
      order_id: data.order_id,
      type: data.type,
      item_name: data.item_name,
      item_id: data.item_id,
      notes: data.notes,
      status: 'PENDING',
      created_at: new Date().toISOString(),
    };

    // 1. Post to Next.js API Server Route (bridges mobile phone to laptop kitchen terminal)
    try {
      const res = await fetch('/api/service-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.call) {
          createdCall = json.call;
        }
      }
    } catch (err) {
      console.warn('POST /api/service-calls network error, using local fallback:', err);
    }

    // 2. Local cache & BroadcastChannel
    const currentCalls = getStored<ServiceCall[]>('service_calls', []);
    const updated = [createdCall, ...currentCalls.filter(c => c.id !== createdCall.id)];
    setStored('service_calls', updated);
    localSync.emit('NEW_SERVICE_CALL', createdCall);

    return createdCall;
  },

  async getServiceCalls(restaurantId: string): Promise<ServiceCall[]> {
    // 1. Fetch from Next.js server API (Cross-Device synchronization)
    try {
      const res = await fetch(`/api/service-calls?restaurant_id=${encodeURIComponent(restaurantId)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.calls && Array.isArray(json.calls)) {
          setStored('service_calls', json.calls);
          return json.calls as ServiceCall[];
        }
      }
    } catch {
      // fallback to local cache
    }

    const calls = getStored<ServiceCall[]>('service_calls', []);
    return calls.filter(c => c.restaurant_id === restaurantId);
  },

  async resolveServiceCall(callId: string, waiterName?: string): Promise<boolean> {
    try {
      await fetch('/api/service-calls', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId, status: 'RESOLVED', waiterName }),
      });
    } catch {
      // fallback
    }

    const calls = getStored<ServiceCall[]>('service_calls', []);
    const resolvedAt = new Date().toISOString();
    const updated = calls.map(c => c.id === callId ? { ...c, status: 'RESOLVED' as const, resolved_at: resolvedAt, waiter_name: waiterName } : c);
    setStored('service_calls', updated);
    localSync.emit('SERVICE_CALL_RESOLVED', { callId, resolvedAt, waiterName });
    return true;
  },

  subscribeToServiceCalls(restaurantIdOrSlug: string, onUpdate: (payload?: unknown) => void) {
    const unsubLocal = localSync.subscribe((event) => {
      if (['NEW_SERVICE_CALL', 'SERVICE_CALL_RESOLVED'].includes(event.type)) {
        onUpdate(event.payload);
      }
    });

    // 2-second polling to ensure mobile bell rings reach laptop screen instantly
    const pollInterval = setInterval(async () => {
      try {
        const calls = await this.getServiceCalls(restaurantIdOrSlug);
        onUpdate({ calls });
      } catch {
        // ignore
      }
    }, 2000);

    return () => {
      unsubLocal();
      clearInterval(pollInterval);
    };
  },
};
