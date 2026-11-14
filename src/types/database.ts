export type OrderStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'ON_THE_WAY'
  | 'SERVED'
  | 'CANCELLED'
  | 'REJECTED';

export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  tagline?: string;
  logo_url?: string;
  banner_url?: string;
  currency: string;
  is_active: boolean;
  created_at?: string;
}

export interface TableItem {
  id: string;
  restaurant_id: string;
  table_number: number;
  capacity?: number;
  is_active: boolean;
  created_at?: string;
}

export interface Category {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
  created_at?: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_veg: boolean;
  is_available: boolean;
  sort_order: number;
  created_at?: string;
}

export type ItemPrepStatus = 'PENDING' | 'QUEUED' | 'COOKING' | 'READY';

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  item_name: string;
  item_price: number;
  quantity: number;
  notes?: string;
  is_prepared?: boolean;
  item_status?: ItemPrepStatus;
  rating?: number;
  remark?: string;
}

export interface OrderItemReview {
  item_id?: string;
  item_name?: string;
  rating: number; // 1 to 5 stars
  remark?: string;
}

export interface OrderFeedback {
  rating: number; // 1 to 5 stars overall
  food_look_rating?: number; // 1 to 5 for appearance & presentation
  comment: string;
  tags?: string[];
  created_at: string;
  item_reviews?: Record<string, OrderItemReview>;
}

export interface Order {
  id: string;
  restaurant_id: string;
  table_number: number;
  customer_name: string;
  customer_phone?: string;
  status: OrderStatus;
  notes?: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  feedback?: OrderFeedback;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

export type ServiceCallType = 
  | 'BILL' 
  | 'FOOD_INFO' 
  | 'FEEDBACK' 
  | 'DOUBT' 
  | 'WATER' 
  | 'WAITER';

export interface ServiceCall {
  id: string;
  restaurant_id: string;
  table_number: number;
  order_id?: string;
  type: ServiceCallType;
  item_name?: string;
  item_id?: string;
  notes?: string;
  status: 'PENDING' | 'RESOLVED';
  created_at: string;
}
