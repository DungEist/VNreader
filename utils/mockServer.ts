import { Story } from '../types';
import { supabase } from './supabaseClient'; // Import cái biến supabase (có thể null)

export const serverFetchAllStories = async (): Promise<Story[]> => {
    // 🛑 CHẶN LỖI: Nếu chưa kết nối Supabase thì dừng luôn, không gọi lệnh để tránh crash
    if (!supabase) {
        console.error("Lỗi: Supabase chưa được khởi tạo (Thiếu Env Vars).");
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('stories')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) {
            console.error("Supabase Fetch Error:", error);
            return [];
        }

        return (data || []).map((row: any) => {
            const storyData = row.data || {};
            return {
                ...storyData,
                id: row.id,
                title: row.title,
                author: row.author,
                description: row.description,
                thumbnail: row.thumbnail
            } as Story;
        });
    } catch (e) {
        console.error("System Error:", e);
        return [];
    }
};

export const serverSaveStory = async (story: Story): Promise<boolean> => {
    // 🛑 CHẶN LỖI
    if (!supabase) {
        alert("Lỗi cấu hình: Chưa kết nối được Supabase (Kiểm tra biến môi trường VITE_...)");
        return false;
    }

    try {
        const { id, title, author, description, thumbnail, ...restData } = story;
        const payload = {
            id,
            title,
            author,
            description,
            thumbnail,
            data: story,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase.from('stories').upsert(payload, { onConflict: 'id' });

        if (error) {
            console.error("Supabase Save Error:", error);
            alert("Lỗi lưu: " + error.message);
            return false;
        }
        return true;
    } catch (e) {
        console.error("Error saving story:", e);
        return false;
    }
};

export const serverDeleteStory = async (storyId: string): Promise<boolean> => {
    if (!supabase) return false;
    try {
        const { error } = await supabase.from('stories').delete().eq('id', storyId);
        return !error;
    } catch { return false; }
};