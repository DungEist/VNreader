
// Cấu trúc dữ liệu cho cốt truyện
export interface Choice {
  text: string;
  nextSceneId: string;
  sound?: string; // Âm thanh khi chọn
}

export interface Character {
  name?: string; // Tên định danh để liên kết với hội thoại
  image: string;
  position: 'left' | 'center' | 'right'; 
  scale?: number;
}

export interface DialogueEntry {
  text: string;
  characterName?: string; 
  voice?: string; 
}

export interface GlossaryEntry {
  id: string;
  term: string;
  definition: string;
}

export interface Scene {
  id: string;
  text: string; 
  characterName?: string; 
  dialogues?: DialogueEntry[];
  characterImage?: string; 
  characterPosition?: 'left' | 'center' | 'right'; 
  characters?: Character[];
  episodeId?: string; 
  order?: number; 
  x?: number;
  y?: number;
  portrait?: string; 
  backgroundImage?: string; 
  bgm?: string; 
  sfx?: string; 
  voice?: string; 
  choices: Choice[];
  nextSceneId?: string; 
  note?: string; // Trường ghi chú cho Dev
}

export interface Episode {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string; 
  startSceneId: string; 
}

export interface EpisodeFile {
  type: 'vn_episode_file';
  episode: Episode;
  scenes: Scene[];
}

export interface Chapter {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string; 
  episodes: Episode[];
}

export interface Story {
  id: string;
  title: string;
  author?: string;
  description?: string;
  thumbnail?: string; 
  startSceneId: string; 
  chapters?: Chapter[]; 
  scenes: Record<string, Scene>; 
  glossary?: Record<string, GlossaryEntry>; // Từ điển thuật ngữ
}

export interface AppConfig {
  bugReportUrl: string;
  fbUrl: string;
  xUrl: string;
  mailUrl: string;
  donateImageUrl: string;
}

export interface ChapterBundle {
  type: 'vn_chapter_bundle';
  version: string;
  chapter: Chapter;
  scenes: Record<string, Scene>;
}

export interface HistoryEntry {
  type?: 'dialogue' | 'choice'; 
  characterName?: string;
  text: string;
  voice?: string; 
  sceneId?: string;
  dialogueIndex?: number;
}

export interface SaveState {
  id: string;
  timestamp: number;
  storyId: string; 
  storyTitle: string;
  chapterTitle?: string;
  episodeTitle?: string;
  currentSceneId: string;
  currentDialogueIndex?: number; 
  previewText: string; 
  currentBgm?: string;
  currentBackgroundImage?: string;
  currentCharacters?: Character[];
  history?: HistoryEntry[];
}

export interface ReaderSettings {
  displayMode: 'vn' | 'scroll'; 
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  fontFamily: 'sans' | 'serif' | 'mono';
  textSpeed: 'slow' | 'normal' | 'fast' | 'instant';
  overlayOpacity: number; 
  bgmVolume: number; 
  sfxVolume: number; 
  voiceVolume: number; 
  autoPlaySpeed: number; 
}
