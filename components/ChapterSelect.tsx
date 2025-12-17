import React, { useState } from 'react';
import { Story, Chapter, Episode } from '../types';
import { ArrowLeft, Book, PlayCircle, ChevronDown, ChevronRight, List } from 'lucide-react';

interface ChapterSelectProps {
  story: Story;
  onSelectEpisode: (sceneId: string) => void;
  onBack: () => void;
}

const ChapterSelect: React.FC<ChapterSelectProps> = ({ story, onSelectEpisode, onBack }) => {
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(
    story.chapters && story.chapters.length > 0 ? story.chapters[0].id : null
  );

  const toggleChapter = (id: string) => {
    if (expandedChapterId === id) {
      setExpandedChapterId(null);
    } else {
      setExpandedChapterId(id);
    }
  };

  const chapters = story.chapters || [];

  return (
    <div className="min-h-screen bg-neutral-900 text-white font-sans flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4 shadow-lg flex items-center gap-4 z-10">
        <button onClick={onBack} className="p-2 hover:bg-gray-700 rounded-full transition-colors text-gray-300">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-blue-400">{story.title}</h1>
          <p className="text-xs text-gray-400">Chọn Chương & Tập</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {chapters.length === 0 && (
            <div className="text-center text-gray-500 mt-20">
              <List size={48} className="mx-auto mb-4 opacity-50" />
              <p>Truyện này chưa được phân chia chương tập.</p>
              <button 
                onClick={() => onSelectEpisode(story.startSceneId)}
                className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-bold transition-colors"
              >
                Bắt đầu đọc ngay
              </button>
            </div>
          )}

          {chapters.map((chapter) => (
            <div key={chapter.id} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-lg">
              {/* Chapter Header */}
              <button 
                onClick={() => toggleChapter(chapter.id)}
                className="w-full flex items-center justify-between p-6 bg-gray-800 hover:bg-gray-750 transition-colors text-left"
              >
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                    <Book size={24} className="text-yellow-500" />
                    {chapter.title}
                  </h2>
                  {chapter.description && (
                    <p className="text-gray-400 text-sm ml-8">{chapter.description}</p>
                  )}
                </div>
                <div className="text-gray-400">
                  {expandedChapterId === chapter.id ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
                </div>
              </button>

              {/* Episodes List */}
              {expandedChapterId === chapter.id && (
                <div className="bg-gray-900/50 border-t border-gray-700 p-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                  {chapter.episodes.map((episode) => (
                    <div 
                      key={episode.id}
                      onClick={() => onSelectEpisode(episode.startSceneId)}
                      className="group relative bg-gray-800 border border-gray-700 hover:border-blue-500 rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg hover:shadow-blue-900/20 hover:-translate-y-1"
                    >
                      <div className="flex gap-4">
                        {episode.thumbnail ? (
                           <div className="w-24 h-24 bg-black rounded object-cover overflow-hidden shrink-0">
                             <img src={episode.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                           </div>
                        ) : (
                           <div className="w-24 h-24 bg-gray-900 rounded flex items-center justify-center shrink-0 border border-gray-700">
                             <PlayCircle size={32} className="text-gray-600 group-hover:text-blue-500 transition-colors" />
                           </div>
                        )}
                        
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-200 group-hover:text-blue-400 transition-colors mb-1">
                            {episode.title}
                          </h3>
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {episode.description || "Không có mô tả."}
                          </p>
                        </div>
                      </div>
                      
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <PlayCircle size={24} className="text-blue-500" />
                      </div>
                    </div>
                  ))}
                  
                  {chapter.episodes.length === 0 && (
                    <div className="col-span-full text-center py-4 text-gray-500 text-sm italic">
                      Chưa có tập nào trong chương này.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

        </div>
      </div>
    </div>
  );
};

export default ChapterSelect;