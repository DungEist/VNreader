import { createClient } from '@supabase/supabase-js';

// --- SỬA ĐỔI: Gọi trực tiếp import.meta.env để Vite nhận diện static replacement ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Kiểm tra cấu hình
export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

if (!isSupabaseConfigured) {
  console.warn("SUPABASE_CONFIG_MISSING: Vui lòng thiết lập VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY trong Environment Variables.");
  // Log ra để debug xem nó đang nhận là gì (ẩn bớt ký tự nếu cần)
  console.log("Current URL:", supabaseUrl ? "Found" : "Missing");
  console.log("Current Key:", supabaseKey ? "Found" : "Missing");
}

// Khởi tạo Supabase client
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseKey || 'placeholder-key'
);