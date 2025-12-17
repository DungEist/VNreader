import { createClient } from '@supabase/supabase-js';

// Safe access to import.meta.env to prevent runtime crashes if env is undefined
const meta = import.meta as any;
const env = meta && meta.env ? meta.env : {};

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

// Check if credentials exist
export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

if (!isSupabaseConfigured) {
  console.warn("Chưa cấu hình VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY. Vui lòng kiểm tra file .env");
}

// Initialize Supabase client
// Use placeholder strings to prevent createClient from crashing immediately if env vars are missing
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseKey || 'placeholder-key'
);