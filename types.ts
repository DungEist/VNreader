// Cấu trúc dữ liệu cho cốt truyện
export interface Choice {
  text: string;
  nextSceneId: string;
  sound?: string; // Âm thanh khi chọn
}

export interface Character {
  image: string;
  position: 'left' | 'center' | 'right' | string; // Có thể mở rộng position sau này
  scale?: number;
}

export interface DialogueEntry {
  text: string;
  characterName?: string; // Override tên nhân vật cho dòng thoại này
  voice?: string; // Voice riêng cho dòng thoại này
}

export interface Scene {
  id: string;
  text: string; // Nội dung mặc định (hoặc dòng đầu tiên)
  characterName?: string; // Tên nhân vật đang nói
  
  // New: Mảng hội thoại nối tiếp. Nếu có dữ liệu, game sẽ chạy hết list này trước khi hiện choice/nextScene
  dialogues?: DialogueEntry[];

  // Legacy fields (giữ lại để tương thích ngược)
  characterImage?: string; 
  characterPosition?: 'left' | 'center' | 'right'; 
  
  // New: Hỗ trợ nhiều nhân vật
  characters?: Character[];
  
  // New: Link to Episode
  episodeId?: string; // ID của tập chứa cảnh này
  order?: number; // New: Thứ tự sắp xếp trong tập

  // New: Graph Coordinates
  x?: number;
  y?: number;

  portrait?: string; // URL ảnh đại diện/chân dung (Avatar)
  backgroundImage?: string; // URL hoặc mã màu
  bgm?: string; // URL nhạc nền
  sfx?: string; // URL hiệu ứng âm thanh
  voice?: string; // URL lồng tiếng
  choices: Choice[];
  nextSceneId?: string; // ID cảnh tiếp theo nếu không có lựa chọn (tuyến tính)
}

export interface Episode {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string; // Ảnh bìa tập
  startSceneId: string; // Scene bắt đầu của tập này
}

export interface Chapter {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string; // Ảnh bìa chương
  episodes: Episode[];
}

export interface Story {
  id: string;
  title: string;
  author?: string;
  description?: string;
  thumbnail?: string; // Ảnh bìa truyện
  startSceneId: string; // Scene mặc định nếu không chọn tập (hoặc tập 1)
  chapters?: Chapter[]; // Cấu trúc phân chương/tập
  scenes: Record<string, Scene>; // Map ID -> Scene để truy xuất nhanh
}

export interface HistoryEntry {
  type?: 'dialogue' | 'choice'; // Phân loại entry
  characterName?: string;
  text: string;
  voice?: string; // Optional: lưu lại voice để replay nếu cần
  
  // Jump functionality fields
  sceneId?: string;
  dialogueIndex?: number;
}

// Cấu trúc lưu game
export interface SaveState {
  id: string;
  timestamp: number;
  storyId: string; // Để đảm bảo load đúng truyện
  storyTitle: string;
  
  // New: Thông tin ngữ cảnh
  chapterTitle?: string;
  episodeTitle?: string;

  currentSceneId: string;
  currentDialogueIndex?: number; // New: Lưu vị trí dòng thoại trong cảnh
  previewText: string; // Text của scene hiện tại để hiển thị khi load
  // Trạng thái cần lưu trữ (Persistent State)
  currentBgm?: string;
  currentBackgroundImage?: string;
  
  // Legacy
  currentCharacterImage?: string;
  currentCharacterPosition?: 'left' | 'center' | 'right';
  
  // New
  currentCharacters?: Character[];
  
  // History
  history?: HistoryEntry[];
}

// Cấu hình hiển thị
export interface ReaderSettings {
  displayMode: 'vn' | 'scroll'; // 'vn' = Hộp thoại bên dưới, 'scroll' = Cuộn dọc toàn màn hình
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  fontFamily: 'sans' | 'serif' | 'mono';
  textSpeed: 'slow' | 'normal' | 'fast' | 'instant';
  overlayOpacity: number; // 0.1 đến 1.0
  bgmVolume: number; // 0.0 đến 1.0
  sfxVolume: number; // 0.0 đến 1.0
  voiceVolume: number; // 0.0 đến 1.0
  autoPlaySpeed: number; // Thời gian chờ (ms) sau khi hiện hết text
}