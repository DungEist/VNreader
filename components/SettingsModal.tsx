
import React from 'react';
import { X, Type, Monitor, Volume2, Music, Mic, Zap, LayoutTemplate, ScrollText, Check } from 'lucide-react';
import { ReaderSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ReaderSettings;
  onUpdateSettings: (newSettings: ReaderSettings) => void;
}

const fontSizeMap: Record<string, string> = {
  small: '12px',
  medium: '14px',
  large: '18px',
  xlarge: '22px'
};

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onUpdateSettings }) => {
  if (!isOpen) return null;

  const handleChange = <K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) => {
    onUpdateSettings({ ...settings, [key]: value });
  };

  const fontOptions = [
    { id: 'sans', name: 'Sans', class: 'font-sans' },
    { id: 'serif', name: 'Serif', class: 'font-serif' },
    { id: 'mono', name: 'Mono', class: 'font-mono' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#121212] border border-white/10 w-full max-w-sm rounded-2xl shadow-2xl flex flex-col relative animate-in fade-in zoom-in duration-200 overflow-hidden max-h-[95vh]">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
           <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Monitor size={18} className="text-blue-500" /> Cấu hình
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
          {/* Audio Settings */}
          <div className="space-y-3">
             <h3 className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Âm lượng</h3>
             <div className="grid grid-cols-1 gap-3">
                {[
                  { key: 'bgmVolume', icon: <Music size={12}/>, label: 'BGM' },
                  { key: 'sfxVolume', icon: <Volume2 size={12}/>, label: 'SFX' },
                  { key: 'voiceVolume', icon: <Mic size={12}/>, label: 'Voice' }
                ].map((item) => (
                  <div key={item.key}>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-bold text-gray-300 flex items-center gap-2">{item.icon} {item.label}</label>
                      <span className="text-[9px] font-mono text-blue-500">{Math.round((settings as any)[item.key] * 100)}%</span>
                    </div>
                    <input
                      type="range" min="0" max="1" step="0.05"
                      value={(settings as any)[item.key]}
                      onChange={(e) => handleChange(item.key as any, parseFloat(e.target.value))}
                      className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                ))}
             </div>
          </div>

          {/* Typography & Mode */}
          <div className="space-y-3 pt-2">
            <h3 className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Hiển thị</h3>
            
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => handleChange('displayMode', 'vn')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-[11px] font-bold transition-all ${settings.displayMode === 'vn' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-900 border-white/5 text-gray-500'}`}
              >
                <LayoutTemplate size={14} /> VN Classic
              </button>
              <button 
                onClick={() => handleChange('displayMode', 'scroll')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-[11px] font-bold transition-all ${settings.displayMode === 'scroll' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-900 border-white/5 text-gray-500'}`}
              >
                <ScrollText size={14} /> Scroll
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {fontOptions.map(font => (
                <button 
                  key={font.id}
                  onClick={() => handleChange('fontFamily', font.id as any)}
                  className={`flex items-center justify-center py-2 rounded-lg border text-[11px] transition-all ${settings.fontFamily === font.id ? 'bg-white/5 border-blue-500/50 text-blue-400 font-bold' : 'bg-gray-900 border-white/5 text-gray-500'}`}
                >
                  <span className={font.class}>{font.name}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {['S', 'M', 'L', 'XL'].map((size, idx) => {
                const sizeValue = ['small', 'medium', 'large', 'xlarge'][idx];
                return (
                  <button
                    key={sizeValue}
                    onClick={() => handleChange('fontSize', sizeValue as any)}
                    className={`py-2 rounded-lg border text-[10px] font-black transition-all ${
                      settings.fontSize === sizeValue ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-900 border-white/5 text-gray-500'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 bg-black/40 border-t border-white/5">
           <div 
             className="p-3 rounded-xl text-gray-100 shadow-inner border border-white/5 leading-snug line-clamp-2 italic opacity-60 text-center transition-all duration-300"
             style={{
               fontFamily: settings.fontFamily === 'serif' ? 'Merriweather, serif' : settings.fontFamily === 'mono' ? 'Fira Code, monospace' : 'Roboto, sans-serif',
               fontSize: fontSizeMap[settings.fontSize] || '14px',
             }}
           >
             "Dòng xem trước giao diện người đọc..."
           </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
