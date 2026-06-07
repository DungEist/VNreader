import { useState } from 'react';
import ChapterSelect from '../components/PgrReader/ChapterSelect';
import VnPlayer from '../components/PgrReader/VnPlayer';
import SettingsPage from '../components/PgrReader/SettingsPage';
import './PgrReaderPage.css';

export default function PgrReaderPage() {
  const [activeView, setActiveView]     = useState('select');
  const [activeStoryId, setActiveStoryId] = useState(null);
  const [activeLang, setActiveLang]     = useState(
    () => localStorage.getItem('pgr_voice_lang') || 'ja'
  );

  const handleStartStory = (storyId, lang) => {
    setActiveStoryId(storyId);
    if (lang) setActiveLang(lang);
    setActiveView('play');
  };

  const handleBackToSelect = () => {
    setActiveStoryId(null);
    setActiveView('select');
  };

  return (
    <div className="pgr-reader-page dark-theme">
      {activeView === 'select' && (
        <ChapterSelect 
          onStartStory={handleStartStory} 
          onOpenSettings={() => setActiveView('settings')}
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
        <SettingsPage 
          onBack={handleBackToSelect}
        />
      )}
    </div>
  );
}
