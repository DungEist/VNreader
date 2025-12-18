
import { Story, AppConfig } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

// --- SUPABASE API IMPLEMENTATION ---

export const serverFetchAllStories = async (): Promise<Story[]> => {
    if (!isSupabaseConfigured) {
        console.warn("Supabase chưa được cấu hình. Trả về danh sách rỗng.");
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('stories')
            .select('*')
            .neq('id', 'global_app_config') // Loại bỏ config ra khỏi danh sách truyện
            .order('updated_at', { ascending: false });

        if (error) {
            console.error("Supabase Fetch Error:", JSON.stringify(error, null, 2));
            throw error;
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
        console.error("Error fetching stories:", e);
        return [];
    }
};

export const serverSaveStory = async (story: Story): Promise<boolean> => {
    if (!isSupabaseConfigured) {
        alert("Chưa cấu hình Supabase! Không thể lưu lên server.");
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

// --- GLOBAL CONFIG HANDLING ---

export const DEFAULT_APP_CONFIG: AppConfig = {
  bugReportUrl: 'https://www.facebook.com/ningbasementofficial',
  fbUrl: 'https://www.facebook.com/ningbasementofficial',
  xUrl: 'https://x.com/Dung_Eist',
  mailUrl: 'mailto:ningsbasement@gmail.com',
  donateImageUrl: 'https://media.discordapp.net/attachments/1097907253211836523/1450504491333058680/image.png?ex=69441893&is=6942c713&hm=3720f56eadf7aec0ce5b34157662b565a362181890f57a14a6ff945d6b8c41ed&=&format=webp&quality=lossless&width=1184&height=666'
};

export const serverFetchConfig = async (): Promise<AppConfig> => {
  if (!isSupabaseConfigured) return DEFAULT_APP_CONFIG;
  try {
    const { data, error } = await supabase
      .from('stories')
      .select('data')
      .eq('id', 'global_app_config')
      .single();

    if (error || !data) return DEFAULT_APP_CONFIG;
    return data.data as AppConfig;
  } catch (e) {
    return DEFAULT_APP_CONFIG;
  }
};

export const serverSaveConfig = async (config: AppConfig): Promise<boolean> => {
  if (!isSupabaseConfigured) return false;
  try {
    const payload = {
      id: 'global_app_config',
      title: 'Global App Config',
      data: config,
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase
      .from('stories')
      .upsert(payload, { onConflict: 'id' });
    
    return !error;
  } catch (e) {
    return false;
  }
};
