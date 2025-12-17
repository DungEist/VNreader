import { SaveState, ReaderSettings, Story } from '../types';

const STORAGE_KEYS = {
  SAVES: 'vn_reader_saves',
  SETTINGS: 'vn_reader_settings',
  ACTIVE_STORY: 'vn_reader_active_story_cache' // New key for caching the imported story
};

export const getSaves = (): SaveState[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SAVES);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Error loading saves", e);
    return [];
  }
};

export const saveGame = (save: SaveState) => {
  const saves = getSaves();
  // Nếu save ID đã tồn tại, ghi đè. Nếu không, thêm mới.
  const existingIndex = saves.findIndex(s => s.id === save.id);
  
  if (existingIndex >= 0) {
    saves[existingIndex] = save;
  } else {
    saves.push(save);
  }
  
  localStorage.setItem(STORAGE_KEYS.SAVES, JSON.stringify(saves));
};

export const deleteSave = (id: string) => {
  const saves = getSaves().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEYS.SAVES, JSON.stringify(saves));
};

export const loadSettings = (): Partial<ReaderSettings> => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

export const saveSettings = (settings: ReaderSettings) => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
};

// --- NEW FUNCTIONS FOR STORY CACHING ---

export const saveActiveStoryToCache = (story: Story) => {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_STORY, JSON.stringify(story));
  } catch (e) {
    console.warn("Story too large to cache in localStorage", e);
  }
};

export const loadActiveStoryFromCache = (): Story | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_STORY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const clearActiveStoryCache = () => {
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_STORY);
};