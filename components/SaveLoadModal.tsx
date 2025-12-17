import React, { useEffect, useState } from 'react';
import { X, Save, Clock, Trash2 } from 'lucide-react';
import { SaveState, Story } from '../types';
import { getSaves, saveGame, deleteSave } from '../utils/storage';

interface SaveLoadModalProps {
  isOpen: boolean;
  mode: 'save' | 'load';
  onClose: () => void;
  currentStory?: Story;
  currentSceneId?: string;
  extraSaveData?: Partial<SaveState>; // New prop for visual/audio state
  onLoadGame?: (save: SaveState) => void;
}

const SaveLoadModal: React.FC<SaveLoadModalProps> = ({ 
  isOpen, 
  mode, 
  onClose, 
  currentStory, 
  currentSceneId,
  extraSaveData,
  onLoadGame
}) => {
  const [saves, setSaves] = useState<SaveState[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSaves(getSaves().sort((a, b) => b.timestamp - a.timestamp));
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!currentStory || !currentSceneId) return;
    
    // Tìm scene hiện tại để lấy text preview
    const currentScene = currentStory.scenes[currentSceneId];
    
    // Tìm thông tin Chapter và Episode
    let chapterTitle: string | undefined;
    let episodeTitle: string | undefined;

    if (currentScene && currentScene.episodeId && currentStory.chapters) {
      for (const chap of currentStory.chapters) {
        const ep = chap.episodes.find(e => e.id === currentScene.episodeId);
        if (ep) {
          chapterTitle = chap.title;
          episodeTitle = ep.title;
          break;
        }
      }
    }

    const newSave: SaveState = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      storyId: currentStory.id,
      storyTitle: currentStory.title,
      chapterTitle,
      episodeTitle,
      currentSceneId: currentSceneId,
      previewText: currentScene?.text.substring(0, 60) + "..." || "Không có nội dung",
      ...extraSaveData // Merge extra data like BGM, background, characters
    };

    saveGame(newSave);
    setSaves(getSaves().sort((a, b) => b.timestamp - a.timestamp));
    onClose();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Bạn có chắc chắn muốn xóa bản lưu này?")) {
      deleteSave(id);
      setSaves(getSaves().sort((a, b) => b.timestamp - a.timestamp));
    }
  };

  const handleLoad = (save: SaveState) => {
    if (onLoadGame) {
      onLoadGame(save);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-2xl h-[80vh] rounded-lg shadow-2xl flex flex-col relative animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Save className="text-green-500" /> 
            {mode === 'save' ? 'Lưu Game' : 'Tải Game'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {mode === 'save' && (
            <button 
              onClick={handleSave}
              className="w-full py-4 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-all flex flex-col items-center justify-center gap-2"
            >
              <Save size={32} />
              <span className="font-medium">Tạo bản lưu mới</span>
            </button>
          )}

          {saves.length === 0 && mode === 'load' && (
             <div className="text-center text-gray-500 mt-20">Chưa có bản lưu nào.</div>
          )}

          {saves.map((save) => (
            <div 
              key={save.id}
              onClick={() => mode === 'load' ? handleLoad(save) : null}
              className={`group bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-start justify-between transition-all ${
                mode === 'load' ? 'cursor-pointer hover:border-blue-500 hover:bg-gray-800/80' : ''
              }`}
            >
              <div>
                <div className="text-blue-400 text-xs font-mono mb-1 flex items-center gap-1">
                  <Clock size={12} />
                  {new Date(save.timestamp).toLocaleString('vi-VN')}
                </div>
                <h3 className="font-bold text-lg text-white mb-1">
                  {save.storyTitle} 
                  {(save.chapterTitle || save.episodeTitle) && (
                    <span className="text-sm font-normal text-gray-400 ml-2">
                      {save.chapterTitle ? `${save.chapterTitle}` : ''} 
                      {save.episodeTitle ? ` - ${save.episodeTitle}` : ''}
                    </span>
                  )}
                </h3>
                <p className="text-gray-400 text-sm line-clamp-2">{save.previewText}</p>
              </div>
              
              <button 
                onClick={(e) => handleDelete(save.id, e)}
                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                title="Xóa bản lưu"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SaveLoadModal;