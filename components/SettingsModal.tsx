import React from 'react';
import { X, Type, Monitor, Volume2, Music, Mic, Zap, LayoutTemplate, ScrollText } from 'lucide-react';
import { ReaderSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ReaderSettings;
  onUpdateSettings: (newSettings: ReaderSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onUpdateSettings }) => {
  if (!isOpen) return null;

  const handleChange = <K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) => {
    onUpdateSettings({ ...settings, [key]: value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-md rounded-lg shadow-2xl p-6 relative animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
        
        <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
          <Monitor size={24} className="text-blue-500" /> Cài đặt
        </h2>

        <div className="space-y-6">
          {/* Audio Settings */}
          <div className="space-y-4">
             <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Âm thanh</h3>
             
             <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Music size={16} /> Nhạc nền (BGM)
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.bgmVolume}
                  onChange={(e) => handleChange('bgmVolume', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                />
             </div>

             <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Volume2 size={16} /> Hiệu ứng (SFX)
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.sfxVolume}
                  onChange={(e) => handleChange('sfxVolume', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                />
             </div>

             <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Mic size={16} /> Lồng tiếng (Voice)
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.voiceVolume}
                  onChange={(e) => handleChange('voiceVolume', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                />
             </div>
          </div>

          <hr className="border-gray-800" />

          {/* Display Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Hiển thị & Tự động</h3>

            {/* Display Mode Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Chế độ đọc</label>
              <div className="grid grid-cols-2 gap-3">
                 <button 
                    onClick={() => handleChange('displayMode', 'vn')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${settings.displayMode === 'vn' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}
                 >
                    <LayoutTemplate size={18} /> VN Classic
                 </button>
                 <button 
                    onClick={() => handleChange('displayMode', 'scroll')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${settings.displayMode === 'scroll' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}
                 >
                    <ScrollText size={18} /> Scroll Mode
                 </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Type size={16} /> Cỡ chữ
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['small', 'medium', 'large', 'xlarge'].map((size) => (
                  <button
                    key={size}
                    onClick={() => handleChange('fontSize', size as any)}
                    className={`px-3 py-2 rounded border text-sm capitalize transition-all ${
                      settings.fontSize === size 
                        ? 'bg-blue-600 border-blue-500 text-white' 
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {size === 'xlarge' ? 'XL' : size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Kiểu chữ</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleChange('fontFamily', 'sans')}
                  className={`px-3 py-2 rounded border font-sans ${
                    settings.fontFamily === 'sans' ? 'bg-blue-600 border-blue-500' : 'bg-gray-800 border-gray-700'
                  }`}
                >
                  Sans
                </button>
                <button
                  onClick={() => handleChange('fontFamily', 'serif')}
                  className={`px-3 py-2 rounded border font-serif ${
                    settings.fontFamily === 'serif' ? 'bg-blue-600 border-blue-500' : 'bg-gray-800 border-gray-700'
                  }`}
                >
                  Serif
                </button>
                <button
                  onClick={() => handleChange('fontFamily', 'mono')}
                  className={`px-3 py-2 rounded border font-mono ${
                    settings.fontFamily === 'mono' ? 'bg-blue-600 border-blue-500' : 'bg-gray-800 border-gray-700'
                  }`}
                >
                  Mono
                </button>
              </div>
            </div>

            <div>
               <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Zap size={16} /> Tốc độ Auto Play: {settings.autoPlaySpeed / 1000}s
               </label>
               <input
                  type="range"
                  min="500"
                  max="5000"
                  step="500"
                  value={settings.autoPlaySpeed}
                  onChange={(e) => handleChange('autoPlaySpeed', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Nhanh (0.5s)</span>
                  <span>Chậm (5s)</span>
                </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Độ đậm nền văn bản</label>
              <input
                type="range"
                min="0.2"
                max="1"
                step="0.1"
                value={settings.overlayOpacity}
                onChange={(e) => handleChange('overlayOpacity', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-800">
           <div 
             className="p-4 rounded-lg text-white transition-all duration-300"
             style={{
               backgroundColor: `rgba(0, 0, 0, ${settings.overlayOpacity})`,
               fontFamily: settings.fontFamily === 'serif' ? 'Merriweather, serif' : settings.fontFamily === 'mono' ? 'Fira Code, monospace' : 'Roboto, sans-serif',
               fontSize: settings.fontSize === 'small' ? '14px' : settings.fontSize === 'medium' ? '16px' : settings.fontSize === 'large' ? '20px' : '24px',
             }}
           >
             Đây là văn bản xem trước.
           </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;