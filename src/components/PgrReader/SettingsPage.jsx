import { useState } from 'react';
import { ChevronLeft, Settings, Volume2, Zap } from 'lucide-react';
import '../../pages/ChapterSelect2.css';

export default function SettingsPage({ onBack }) {
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('pgr_player_name') || 'Commandant');
  const [voiceLang, setVoiceLang]   = useState(() => localStorage.getItem('pgr_voice_lang') || 'ja');

  return (
    <div className="cs2-root">
      {/* ── Top Bar ──────────────────────────────────────────────────── */}
      <div className="cs2-topbar">
        <button className="cs2-back-btn" onClick={onBack} title="Back to Archives">
          <ChevronLeft size={18} />
        </button>
        <div className="cs2-logo">
          <Zap size={16} className="cs2-logo-icon" />
          <span>STORY ARCHIVE</span>
        </div>
      </div>

      {/* ── Hero Strip ───────────────────────────────────────────────── */}
      <div className="cs2-hero">
        <div className="cs2-hero-bg" />
        <div className="cs2-hero-content">
          <div className="cs2-breadcrumb">
            <button className="cs2-bc-btn" onClick={onBack}>
              <ChevronLeft size={13} /><span>Archives</span>
            </button>
            <span className="cs2-bc-sep">›</span>
            <span className="cs2-bc-current">Settings</span>
          </div>
          <div className="cs2-hero-title-row">
            <h1 className="cs2-page-title">SETTINGS</h1>
          </div>
        </div>
        <div className="cs2-hero-line" style={{ background: 'linear-gradient(to right, #00d2ff, transparent)' }} />
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div className="cs2-body">
        <div style={{ maxWidth: '520px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

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
                }}
              >
                <option value="ja">🇯🇵 JP (Japanese)</option>
                <option value="zh">🇨🇳 CN (Mandarin)</option>
                <option value="ca">🇭🇰 Cant (Cantonese)</option>
                <option value="en">🇺🇸 EN (English)</option>
              </select>
            </div>
          </div>

          {/* About */}
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
