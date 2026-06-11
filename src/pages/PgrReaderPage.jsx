import { useState, useCallback } from 'react';
import ChapterSelect from '../components/PgrReader/ChapterSelect';
import VnPlayer from '../components/PgrReader/VnPlayer';
import SettingsPage from '../components/PgrReader/SettingsPage';
import './PgrReaderPage.css';
import './animations.css';

const VIEWS = ['select', 'play', 'settings'];

export default function PgrReaderPage() {
  const [activeView, setActiveView]       = useState('select');
  const [prevView, setPrevView]           = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const [activeStoryId, setActiveStoryId] = useState(null);
  const [activeLang, setActiveLang]       = useState(
    () => localStorage.getItem('pgr_voice_lang') || 'ja'
  );

  // Persist ChapterSelect nav state across view switches (play/settings → back)
  const [savedCategory, setSavedCategory] = useState(null);
  const [savedChapter, setSavedChapter]   = useState('');

  // ChapterSelect calls this whenever it navigates internally
  const handleNavChange = useCallback((category, chapter) => {
    setSavedCategory(category);
    setSavedChapter(chapter ?? '');
  }, []);

  const getSlideDir = (from, to) => {
    const fi = VIEWS.indexOf(from);
    const ti = VIEWS.indexOf(to);
    if (ti === -1 || fi === -1) return 'up';
    return ti > fi ? 'left' : 'right';
  };

  const navigateTo = (view, storyId = null, lang = null) => {
    if (view === activeView) return;
    setTransitioning(true);
    setTimeout(() => {
      setPrevView(activeView);
      if (storyId !== null) setActiveStoryId(storyId);
      if (lang) setActiveLang(lang);
      setActiveView(view);
      setTransitioning(false);
    }, 220);
  };

  const handleStartStory = (storyId, lang, category = null, chapter = '') => {
    // Also save context when Play is pressed (category/chapter may not have been
    // reported via onNavChange yet if user clicked Play on the same render cycle)
    if (category !== null) setSavedCategory(category);
    if (chapter)           setSavedChapter(chapter);
    navigateTo('play', storyId, lang);
  };

  const handleBackToSelect = () => navigateTo('select');
  const handleOpenSettings  = () => navigateTo('settings');

  const slideDir = getSlideDir(prevView, activeView);

  return (
    <div className="pgr-reader-page dark-theme">
      <div
        key={activeView}
        className={`view-frame view-enter-${slideDir}${transitioning ? ' view-exit' : ''}`}
      >
        {activeView === 'select' && (
          <ChapterSelect
            onStartStory={handleStartStory}
            onOpenSettings={handleOpenSettings}
            onNavChange={handleNavChange}
            initialCategory={savedCategory}
            initialChapter={savedChapter}
          />
        )}
        {activeView === 'play' && (
          <VnPlayer
            storyId={activeStoryId}
            onBack={handleBackToSelect}
            onNextStory={(storyId, lang) => handleStartStory(storyId, lang)}
            initialLang={activeLang}
          />
        )}
        {activeView === 'settings' && (
          <SettingsPage onBack={handleBackToSelect} />
        )}
      </div>
    </div>
  );
}
