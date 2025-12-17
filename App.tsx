import React, { useState, useEffect } from 'react';
import ReaderLanding from './components/ReaderLanding';
import ChapterSelect from './components/ChapterSelect';
import GamePlayer from './components/GamePlayer';
import { Story, ReaderSettings, SaveState } from './types';
import { DEFAULT_SETTINGS, STORY_CATALOG } from './constants';
import { loadSettings, loadActiveStoryFromCache, saveActiveStoryToCache, clearActiveStoryCache } from './utils/storage';
import { serverFetchAllStories } from './utils/mockServer';

// Modes of the Application - Restricted to Reader features only
type AppMode = 'landing' | 'reader_chapters' | 'reader_game';

function App() {
  const [mode, setMode] = useState<AppMode>('landing');
  
  // Data State
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [cachedStory, setCachedStory] = useState<Story | null>(null);
  const [resumeData, setResumeData] = useState<Partial<SaveState> | undefined>(undefined);
  const [settings, setSettings] = useState<ReaderSettings>({ ...DEFAULT_SETTINGS, ...loadSettings() });
  const [isLoading, setIsLoading] = useState(false);

  // Load cached story on mount
  useEffect(() => {
    const cached = loadActiveStoryFromCache();
    if (cached) {
      setCachedStory(cached);
    }
  }, []);

  // --- NAVIGATION HANDLERS ---

  const handleStoryLoad = (story: Story) => {
    setActiveStory(story);
    saveActiveStoryToCache(story); 
    setResumeData(undefined);

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
    // 1. Check if it matches embedded stories
    let foundStory = STORY_CATALOG.find(s => s.embeddedData?.id === save.storyId)?.embeddedData;

    // 2. If not, check the mock server
    if (!foundStory) {
       const serverStories = await serverFetchAllStories();
       foundStory = serverStories.find(s => s.id === save.storyId);
    }

    if (foundStory) {
       setActiveStory(foundStory);
       saveActiveStoryToCache(foundStory);
       setResumeData(save); 
       setMode('reader_game');
    } else {
       alert("Không tìm thấy dữ liệu gốc của cốt truyện này. Có thể truyện đã bị xóa khỏi server.");
    }
    setIsLoading(false);
  };

  const goBackToLanding = () => {
    setMode('landing');
    setCachedStory(loadActiveStoryFromCache());
  };

  // --- RENDER ---

  return (
    <div className="font-sans text-white bg-black min-h-screen">
       
       {isLoading && (
         <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-black uppercase tracking-widest text-blue-400">Loading Journey...</span>
            </div>
         </div>
       )}

       {/* 1. READER LIBRARY (DEFAULT) */}
       {mode === 'landing' && (
          <div className="relative animate-in fade-in duration-500">
             <ReaderLanding 
                onLoadStory={handleStoryLoad} 
                cachedStory={cachedStory}
                onClearCache={handleClearCache}
                onLoadSave={handleLoadFromSave}
             />
          </div>
       )}

       {/* 2. READER: CHAPTERS */}
       {mode === 'reader_chapters' && activeStory && (
           <div className="relative animate-in fade-in duration-700">
               <ChapterSelect 
                  story={activeStory} 
                  onSelectEpisode={(sid) => { setResumeData({ currentSceneId: sid }); setMode('reader_game'); }} 
                  onBack={goBackToLanding} 
               />
           </div>
       )}

       {/* 3. READER: GAME PLAYER */}
       {mode === 'reader_game' && activeStory && (
           <div className="relative animate-in fade-in zoom-in-95 duration-1000">
             <GamePlayer
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
           </div>
       )}
    </div>
  );
}

export default App;