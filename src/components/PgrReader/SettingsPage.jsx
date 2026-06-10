import { useState } from 'react';
import { ChevronLeft, Settings, Volume2 } from 'lucide-react';

export default function SettingsPage({ onBack }) {
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('pgr_player_name') || 'Commandant');
  const [voiceLang, setVoiceLang] = useState(() => localStorage.getItem('pgr_voice_lang') || 'ja');

  const handleSave = () => {
    localStorage.setItem('pgr_player_name', playerName);
    localStorage.setItem('pgr_voice_lang', voiceLang);
  };

  return (
    <div className="hs-root">
      <div className="hs-header">
        <div className="hs-header-left">
          <button className="hs-back-btn" onClick={onBack}>
            <ChevronLeft size={18} />
            <span>Archives</span>
          </button>
          <div className="hs-breadcrumb">
            <span className="hs-bc-current">🎖 Settings</span>
          </div>
        </div>
      </div>

      <div className="hs-content hs-settings-container">
        <div className="hs-settings-left-col" style={{ maxWidth: '520px', margin: '0 auto' }}>

          {/* Player Settings */}
          <div className="hs-settings-section">
            <h3 className="hs-settings-title"><Settings size={16} /> Player Configuration</h3>

            <div className="hs-settings-form-row">
              <label>Commandant Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value);
                  localStorage.setItem('pgr_player_name', e.target.value);
                }}
                maxLength={20}
                placeholder="Commandant"
              />
            </div>

            <div className="hs-settings-form-row">
              <label>BGM / Voice Language</label>
              <select
                value={voiceLang}
                onChange={(e) => {
                  setVoiceLang(e.target.value);
                  localStorage.setItem('pgr_voice_lang', e.target.value);
                  handleSave();
                }}
              >
                <option value="ja">🇯🇵 JP (Japanese)</option>
                <option value="zh">🇨🇳 CN (Mandarin)</option>
                <option value="ca">🇭🇰 Cant (Cantonese)</option>
                <option value="en">🇺🇸 EN (English)</option>
              </select>
            </div>
          </div>

          {/* About section */}
          <div className="hs-settings-section">
            <h3 className="hs-settings-title"><Volume2 size={16} /> About VnReader</h3>
            <p className="hs-section-desc">
              VnReader is a browser-based Punishing: Gray Raven story archive viewer.
              All story scripts, assets, and audio are served locally from your device.
            </p>
            <p className="hs-section-desc" style={{ marginTop: '8px', color: 'var(--accent-gold)', fontSize: '0.78rem' }}>
              Version 0.1.0 · Web Edition
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
