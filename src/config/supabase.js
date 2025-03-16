import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error('Missing required Supabase environment variables');
}

// Create a Supabase client with timeouts
const options = {
    auth: {
        autoRefreshToken: true,
        persistSession: false
    },
    global: {
        headers: { 'x-my-custom-header': 'bhuktafoods-backend' },
    },
    db: {
        schema: 'public'
    },
    realtime: {
        timeout: 8000 // 8 seconds
    }
};

// Regular client for user operations with optimized settings for serverless
export const supabase = createClient(supabaseUrl, supabaseAnonKey, options);

// Admin client for administrative operations with optimized settings for serverless
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, options);

// Database table names
export const TABLES = {
  PROFILES: 'profiles',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  SUBSCRIPTIONS: 'subscriptions',
  USER_SUBSCRIPTIONS: 'user_subscriptions'
}; 