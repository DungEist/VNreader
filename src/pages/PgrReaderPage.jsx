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

  // Slide direction based on view order
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

  const handleStartStory  = (storyId, lang) => navigateTo('play', storyId, lang);
  const handleBackToSelect = ()              => navigateTo('select');
  const handleOpenSettings = ()             => navigateTo('settings');

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
          />
        )}
        {activeView === 'play' && (
          <VnPlayer
            storyId={activeStoryId}
            onBack={handleBackToSelect}
            onNextStory={handleStartStory}
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
