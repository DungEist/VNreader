import { Story } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

// --- SUPABASE API IMPLEMENTATION ---

// Lấy danh sách tất cả các truyện từ Supabase
export const serverFetchAllStories = async (): Promise<Story[]> => {
    if (!isSupabaseConfigured) {
        console.warn("Supabase chưa được cấu hình. Trả về danh sách rỗng.");
        return [];
    }

    try {
        // Chỉ lấy các trường meta để hiển thị list cho nhẹ, data chi tiết load sau hoặc load luôn tuỳ logic
        // Ở đây ta load hết để app chạy đơn giản như logic cũ
        const { data, error } = await supabase
            .from('stories')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) {
            console.error("Supabase Fetch Error:", JSON.stringify(error, null, 2));
            throw error;
        }

        // Map dữ liệu từ DB (column) vào cấu trúc Story object
        return (data || []).map((row: any) => {
            // Merge các trường cột vào trong cục data json để đảm bảo đồng bộ
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
        console.error("Error fetching stories:", e);
        return [];
    }
};

// Lưu (Tạo mới hoặc Cập nhật) truyện lên Supabase
export const serverSaveStory = async (story: Story): Promise<boolean> => {
    if (!isSupabaseConfigured) {
        alert("Chưa cấu hình Supabase! Không thể lưu lên server.");
        return false;
    }

    try {
        // Tách các trường meta ra để lưu vào cột (giúp search/filter nhanh hơn)
        const { id, title, author, description, thumbnail, ...restData } = story;

        // Cục 'data' sẽ chứa scenes, chapters, settings...
        // Chúng ta vẫn lưu id, title... vào trong data json để backup
        const payload = {
            id,
            title,
            author,
            description,
            thumbnail, // Lưu ảnh bìa vào cột riêng
            data: story, // Lưu full object vào JSONB
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('stories')
            .upsert(payload, { onConflict: 'id' });

        if (error) {
            console.error("Supabase Save Error:", JSON.stringify(error, null, 2));
            return false;
        }
        return true;
    } catch (e) {
        console.error("Error saving story:", e);
        return false;
    }
};

// Xóa truyện khỏi Supabase
export const serverDeleteStory = async (storyId: string): Promise<boolean> => {
    if (!isSupabaseConfigured) {
        alert("Chưa cấu hình Supabase! Không thể xóa.");
        return false;
    }

    try {
        const { error } = await supabase
            .from('stories')
            .delete()
            .eq('id', storyId);

        if (error) {
            console.error("Supabase Delete Error:", JSON.stringify(error, null, 2));
            return false;
        }
        return true;
    } catch (e) {
        console.error("Error deleting story:", e);
        return false;
    }
};