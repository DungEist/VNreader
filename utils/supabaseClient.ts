import { createClient } from '@supabase/supabase-js';

// Lấy biến môi trường
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

// Kiểm tra xem biến có tồn tại không
const isConfigured = supabaseUrl && supabaseKey && supabaseUrl.startsWith('http');

if (!isConfigured) {
    console.warn("⚠️ CẢNH BÁO: Chưa cấu hình VITE_SUPABASE_URL hoặc VITE_SUPABASE_KEY. Web sẽ chạy chế độ Offline (không lưu được).");
}

// Nếu có cấu hình thì tạo client, nếu không thì trả về null (để không crash app)
export const supabase = isConfigured 
    ? createClient(supabaseUrl, supabaseKey) 
    : null;