import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error('Missing required Supabase environment variables');
}

// Regular client for user operations with optimized settings for serverless
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'x-my-custom-header': 'bhuktafoods-backend'
    }
  }
});

// Admin client for administrative operations with optimized settings for serverless
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      'x-my-custom-header': 'bhuktafoods-backend-admin'
    }
  }
});

// Database table names
export const TABLES = {
  PROFILES: 'profiles',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  SUBSCRIPTIONS: 'subscriptions',
  USER_SUBSCRIPTIONS: 'user_subscriptions'
}; 