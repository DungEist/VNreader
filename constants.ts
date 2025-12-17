import { Story, ReaderSettings } from './types';

// --- DATA CỐT TRUYỆN MẪU (EMBEDDED) ---
export const DEMO_STORY: Story = {
  id: "demo-story",
  title: "Hướng Dẫn & Demo",
  author: "Admin",
  description: "Cốt truyện mẫu được tích hợp sẵn để kiểm tra các tính năng của trình đọc.",
  startSceneId: "welcome",
  scenes: {
    "welcome": {
      id: "welcome",
      characterName: "Hệ thống",
      text: "Chào mừng bạn đến với VN Web Reader.\n\nĐây là phiên bản dành cho người đọc. Các cốt truyện được tải trực tiếp từ máy chủ.",
      backgroundImage: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=1000",
      choices: [
        { text: "Khám phá tính năng", nextSceneId: "feature_1" },
        { text: "Kết thúc", nextSceneId: "__EXIT__" }
      ]
    },
    "feature_1": {
      id: "feature_1",
      text: "Ứng dụng hỗ trợ tải cốt truyện từ file JSON đặt trên server. Chỉ cần cấu hình đường dẫn trong code, người đọc sẽ thấy truyện xuất hiện ngoài trang chủ.",
      choices: [
         { text: "Quay lại", nextSceneId: "welcome" }
      ]
    }
  }
};

// --- CẤU HÌNH DANH SÁCH TRUYỆN TRÊN SERVER ---
// Người sở hữu web sẽ sửa file này để thêm truyện mới
export interface CatalogItem {
  id: string;
  title: string;
  author: string;
  thumbnail?: string; // URL ảnh bìa
  description: string;
  sourceType: 'embedded' | 'remote';
  embeddedData?: Story; // Dùng nếu sourceType = 'embedded'
  remoteUrl?: string;   // Dùng nếu sourceType = 'remote' (VD: '/stories/story1.json')
}

export const STORY_CATALOG: CatalogItem[] = [
  {
    id: "demo",
    title: "Hướng Dẫn Sử Dụng",
    author: "VN Team",
    thumbnail: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=500",
    description: "Tìm hiểu cách hoạt động của trình đọc Visual Novel này.",
    sourceType: 'embedded',
    embeddedData: DEMO_STORY
  },
  {
    id: "story-1",
    title: "Truyện Mẫu (Server File)",
    author: "Tác giả A",
    thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=500",
    description: "Ví dụ về cách tải truyện từ file JSON trên server. (Sẽ lỗi nếu không có file thực tế)",
    sourceType: 'remote',
    remoteUrl: '/stories/example.json' 
  },
  // Thêm các truyện khác vào đây...
];

export const DEFAULT_SETTINGS: ReaderSettings = {
  displayMode: 'vn',
  fontSize: 'medium',
  fontFamily: 'sans',
  textSpeed: 'normal',
  overlayOpacity: 0.7,
  bgmVolume: 0.5,
  sfxVolume: 0.5,
  voiceVolume: 1.0,
  autoPlaySpeed: 2000
};