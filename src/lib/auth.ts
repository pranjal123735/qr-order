import { supabase, isSupabaseConfigured } from './supabase';
import { DataStore, localSync } from './store';
import { Restaurant } from '@/types/database';
import { INITIAL_RESTAURANT } from './mockData';

export interface OwnerUser {
  id: string;
  email: string;
  restaurant_id: string;
  restaurant_slug: string;
  restaurant_name: string;
  created_at: string;
}

// Default demo account
export const DEMO_OWNER: OwnerUser = {
  id: 'usr-demo-owner',
  email: 'owner@rusticgrill.com',
  restaurant_id: INITIAL_RESTAURANT.id,
  restaurant_slug: INITIAL_RESTAURANT.slug,
  restaurant_name: INITIAL_RESTAURANT.name,
  created_at: new Date().toISOString(),
};

function getStoredOwner(): OwnerUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('qr_auth_current_owner');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStoredOwner(user: OwnerUser | null): void {
  if (typeof window === 'undefined') return;
  if (!user) {
    localStorage.removeItem('qr_auth_current_owner');
  } else {
    localStorage.setItem('qr_auth_current_owner', JSON.stringify(user));
  }
}

export const AuthService = {
  // 1. Get current logged-in owner
  getCurrentOwner(): OwnerUser | null {
    return getStoredOwner();
  },

  // 2. Register new restaurant with owner credentials
  async registerRestaurantOwner(params: {
    email: string;
    password: string;
    restaurantName: string;
    slug: string;
    currency: string;
    tagline?: string;
  }): Promise<{ success: boolean; user?: OwnerUser; error?: string }> {
    const cleanEmail = params.email.toLowerCase().trim();
    const cleanSlug = params.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    // Check if slug or email exists in local store
    const existingList = await DataStore.getAllRestaurants();
    if (existingList.some(r => r.slug === cleanSlug)) {
      return { success: false, error: 'A restaurant with this URL slug already exists. Please choose a different slug.' };
    }

    try {
      // 1. Create the restaurant
      const restaurant = await DataStore.createRestaurant({
        name: params.restaurantName,
        slug: cleanSlug,
        tagline: params.tagline,
        currency: (!params.currency || params.currency === '$') ? '₹' : params.currency,
      });

      // 2. Create the user
      const newUser: OwnerUser = {
        id: 'usr-' + Math.random().toString(36).substring(2, 9),
        email: cleanEmail,
        restaurant_id: restaurant.id,
        restaurant_slug: restaurant.slug,
        restaurant_name: restaurant.name,
        created_at: new Date().toISOString(),
      };

      // If Supabase configured, attempt Supabase Auth
      if (isSupabaseConfigured && supabase) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: params.password,
          options: {
            data: {
              restaurant_id: restaurant.id,
              restaurant_slug: restaurant.slug,
            },
          },
        });
        if (authError) {
          console.warn('Supabase auth signup notice:', authError.message);
        } else if (authData.user) {
          newUser.id = authData.user.id;
        }
      }

      // Store in users registry
      if (typeof window !== 'undefined') {
        const usersRaw = localStorage.getItem('qr_auth_users') || '[]';
        const users: Array<OwnerUser & { passwordHash: string }> = JSON.parse(usersRaw);
        users.push({ ...newUser, passwordHash: params.password });
        localStorage.setItem('qr_auth_users', JSON.stringify(users));
      }

      // Automatically sign in
      setStoredOwner(newUser);
      localSync.emit('AUTH_STATE_CHANGED', newUser);

      return { success: true, user: newUser };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
      return { success: false, error: msg };
    }
  },

  // 3. Log in restaurant owner
  async login(
    email: string, 
    password: string
  ): Promise<{ success: boolean; user?: OwnerUser; error?: string }> {
    const cleanEmail = email.toLowerCase().trim();

    // Check demo credentials
    if (cleanEmail === 'owner@rusticgrill.com' || cleanEmail === 'demo') {
      setStoredOwner(DEMO_OWNER);
      localSync.emit('AUTH_STATE_CHANGED', DEMO_OWNER);
      return { success: true, user: DEMO_OWNER };
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (error) {
        return { success: false, error: error.message };
      }
      if (data.user) {
        const restId = data.user.user_metadata?.restaurant_id || INITIAL_RESTAURANT.id;
        const restSlug = data.user.user_metadata?.restaurant_slug || INITIAL_RESTAURANT.slug;
        const loggedUser: OwnerUser = {
          id: data.user.id,
          email: cleanEmail,
          restaurant_id: restId,
          restaurant_slug: restSlug,
          restaurant_name: restSlug,
          created_at: data.user.created_at,
        };
        setStoredOwner(loggedUser);
        localSync.emit('AUTH_STATE_CHANGED', loggedUser);
        return { success: true, user: loggedUser };
      }
    }

    // Local authentication lookup
    if (typeof window !== 'undefined') {
      const usersRaw = localStorage.getItem('qr_auth_users') || '[]';
      const users: Array<OwnerUser & { passwordHash: string }> = JSON.parse(usersRaw);
      const matched = users.find(u => u.email === cleanEmail && u.passwordHash === password);
      if (matched) {
        const { passwordHash, ...safeUser } = matched;
        setStoredOwner(safeUser);
        localSync.emit('AUTH_STATE_CHANGED', safeUser);
        return { success: true, user: safeUser };
      }
    }

    return { success: false, error: 'Invalid email or password. Please check your credentials or click "Demo Login".' };
  },

  // 4. Logout
  logout(): void {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut().catch(console.warn);
    }
    setStoredOwner(null);
    localSync.emit('AUTH_STATE_CHANGED', null);
  },
};
