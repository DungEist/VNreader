
import React, { useState, useEffect } from 'react';
import ReaderLanding from './components/ReaderLanding';
import ChapterSelect from './components/ChapterSelect';
import GamePlayer from './components/GamePlayer';
import { Story, ReaderSettings, SaveState } from './types';
import { DEFAULT_SETTINGS, STORY_CATALOG } from './constants';
import { loadSettings, loadActiveStoryFromCache, saveActiveStoryToCache, clearActiveStoryCache } from './utils/storage';
import { serverFetchAllStories } from './utils/mockServer';

// Chế độ hoạt động rút gọn cho Reader
type AppMode = 'reader_landing' | 'reader_chapters' | 'reader_game';

function App() {
  const [mode, setMode] = useState<AppMode>('reader_landing');
  
  // Trạng thái dữ liệu
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [cachedStory, setCachedStory] = useState<Story | null>(null);
  const [resumeData, setResumeData] = useState<Partial<SaveState> | undefined>(undefined);
  const [settings, setSettings] = useState<ReaderSettings>({ ...DEFAULT_SETTINGS, ...loadSettings() });
  const [isLoading, setIsLoading] = useState(false);

  // Tải truyện đang đọc dở từ cache khi khởi tạo
  useEffect(() => {
    const cached = loadActiveStoryFromCache();
    if (cached) {
      setCachedStory(cached);
    }
  }, []);

  // --- XỬ LÝ ĐIỀU HƯỚNG ---

  const handleStoryLoad = (story: Story) => {
    setActiveStory(story);
    saveActiveStoryToCache(story); 
    setResumeData(undefined);

    // Nếu truyện có phân chương, đi tới màn hình chọn tập, ngược lại vào game luôn
    if (story.chapters && story.chapters.length > 0) {
        setMode('reader_chapters');
    } else {
        setMode('reader_game');
    }
  };

  const handleClearCache = () => {
    if(confirm("Bạn có chắc chắn muốn bỏ qua truyện đang đọc dở?")) {
      clearActiveStoryCache();
      setCachedStory(null);
      setActiveStory(null);
    }
  };

  const handleLoadFromSave = async (save: SaveState) => {
    setIsLoading(true);
    try {
        // Tìm truyện tương ứng với bản lưu từ server hoặc catalog
        const serverStories = await serverFetchAllStories();
        let foundStory = serverStories.find(s => s.id === save.storyId);

        if (!foundStory) {
           foundStory = STORY_CATALOG.find(s => s.embeddedData?.id === save.storyId)?.embeddedData;
        }

        if (foundStory) {
           setActiveStory(foundStory);
           saveActiveStoryToCache(foundStory);
           setResumeData(save); 
           setMode('reader_game');
        } else {
           alert("Không tìm thấy dữ liệu gốc của cốt truyện này.");
        }
    } catch (err) {
        alert("Lỗi khi tải bản lưu.");
    } finally {
        setIsLoading(false);
    }
  };

  const goBackToLanding = () => {
    setMode('reader_landing');
    setCachedStory(loadActiveStoryFromCache());
  };

  // --- RENDER ---

  return (
    <div className="font-sans text-white bg-black min-h-screen">
       
       {isLoading && (
         <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-black uppercase tracking-widest text-blue-400">Đang đồng bộ dữ liệu...</span>
            </div>
         </div>
       )}

       {/* 1. MÀN HÌNH CHÍNH: THƯ VIỆN TRUYỆN */}
       {mode === 'reader_landing' && (
            <ReaderLanding 
                onLoadStory={handleStoryLoad} 
                cachedStory={cachedStory}
                onClearCache={handleClearCache}
                onLoadSave={handleLoadFromSave}
            />
       )}

       {/* 2. CHỌN CHƯƠNG/TẬP */}
       {mode === 'reader_chapters' && activeStory && (
           <ChapterSelect 
              story={activeStory} 
              onSelectEpisode={(sid) => { setResumeData({ currentSceneId: sid }); setMode('reader_game'); }} 
              onBack={goBackToLanding} 
           />
       )}

       {/* 3. MÀN HÌNH CHƠI GAME */}
       {mode === 'reader_game' && activeStory && (
           <GamePlayer
                key={`game-${activeStory.id}-${resumeData?.currentSceneId || 'default'}`}
                story={activeStory}
                settings={settings}
                onSettingsChange={setSettings}
                onExit={() => {
                    if (activeStory.chapters && activeStory.chapters.length > 0) {
                        setMode('reader_chapters');
                    } else {
                        goBackToLanding();
                    }
                }}
                initialSceneId={resumeData?.currentSceneId}
                initialGameState={resumeData}
             />
       )}
    </div>
  );
}

export default App;
