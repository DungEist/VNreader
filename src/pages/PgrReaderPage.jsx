import { useState } from 'react';
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

  // Preserve ChapterSelect navigation state so Exit returns to stage list
  const [savedCategory, setSavedCategory] = useState(null);
  const [savedChapter, setSavedChapter]   = useState('');

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

  // ChapterSelect calls this with navigation context when starting a story
  const handleStartStory = (storyId, lang, category = null, chapter = '') => {
    if (category !== null) setSavedCategory(category);
    if (chapter)           setSavedChapter(chapter);
    navigateTo('play', storyId, lang);
  };

  const handleBackToSelect = () => navigateTo('select');
  const handleOpenSettings  = (category = null, chapter = '') => {
    setSavedCategory(category);
    setSavedChapter(chapter);
    navigateTo('settings');
  };

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
