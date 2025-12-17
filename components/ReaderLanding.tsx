import React, { useState, useEffect } from 'react';
import { Play, BookOpen, Clock, Loader2, Search, ServerCrash, LayoutGrid, RotateCcw, Save, Trash2, BookText } from 'lucide-react';
import { Story, SaveState } from '../types';
import { serverFetchAllStories } from '../utils/mockServer';
import { getSaves, deleteSave } from '../utils/storage';

interface ReaderLandingProps {
  onLoadStory: (story: Story) => void;
  cachedStory: Story | null;
  onClearCache: () => void;
  onLoadSave: (save: SaveState) => void;
}

// Helper: Loại bỏ các thẻ HTML để chỉ hiển thị text thuần, tránh lộ code glossary
const stripHtml = (html: string | undefined) => {
    if (!html) return "";
    return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ');
};

const ReaderLanding: React.FC<ReaderLandingProps> = ({ onLoadStory, cachedStory, onClearCache, onLoadSave }) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [saves, setSaves] = useState<SaveState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await serverFetchAllStories();
      setStories(data);
      const localSaves = getSaves().sort((a, b) => b.timestamp - a.timestamp);
      setSaves(localSaves);
    } catch (e) {
      console.error("Failed to fetch stories", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteSave = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if(confirm("Bạn có chắc chắn muốn xóa bản lưu này?")) {
          deleteSave(id);
          setSaves(getSaves().sort((a, b) => b.timestamp - a.timestamp));
      }
  };

  const filteredStories = stories.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.author && s.author.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="h-screen overflow-y-auto bg-[#0a0a0a] text-gray-100 font-sans selection:bg-blue-500/30 custom-scrollbar scroll-smooth">
      
      {/* STICKY HEADER */}
      <header className="sticky top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
              <BookText size={20} className="text-white" />
           </div>
           <div>
              <h1 className="text-xl font-bold tracking-tight">VN Reader Pro</h1>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Premium Reading Experience</p>
           </div>
        </div>

        <div className="relative hidden md:block w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="text" 
              placeholder="Tìm kiếm tác phẩm..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
            />
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="pt-8 pb-20 px-6 max-w-7xl mx-auto space-y-16">
        
        {/* SECTION: CONTINUE READING */}
        {cachedStory && (
           <section className="animate-in fade-in slide-in-from-top-4 duration-700">
               <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                     <RotateCcw size={16} className="text-blue-500" /> Tiếp tục hành trình
                  </h2>
               </div>
               <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-blue-900/20 border border-white/10 rounded-3xl p-6 md:p-10 flex flex-col md:flex-row items-start md:items-center gap-8 shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/10 transition-all duration-1000"></div>
                   
                   <div className="w-24 h-32 md:w-32 md:h-44 bg-gray-800 rounded-2xl flex items-center justify-center shadow-2xl shrink-0 border border-white/10 overflow-hidden transform group-hover:scale-105 transition-transform duration-500">
                      {cachedStory.thumbnail ? (
                          <img src={cachedStory.thumbnail} className="w-full h-full object-cover" alt="thumb"/>
                      ) : (
                          <div className="flex flex-col items-center text-gray-600">
                            <Clock size={40} />
                            <span className="text-[10px] mt-2 font-bold uppercase">No Cover</span>
                          </div>
                      )}
                   </div>
                   
                   <div className="flex-1 z-10">
                      <div className="flex items-center gap-3 mb-3">
                          <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase rounded-full border border-blue-500/20">Resume Play</span>
                          <span className="text-xs text-gray-500 font-medium">{cachedStory.scenes ? Object.keys(cachedStory.scenes).length : 0} Chapters/Scenes</span>
                      </div>
                      <h3 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight group-hover:text-blue-400 transition-colors">
                        {cachedStory.title}
                      </h3>
                      <p className="text-gray-400 text-base md:text-lg max-w-2xl line-clamp-2 leading-relaxed opacity-80">
                          {stripHtml(cachedStory.description) || "Chào mừng bạn quay trở lại với thế giới Visual Novel."}
                      </p>
                   </div>

                   <div className="flex items-center gap-4 z-10 w-full md:w-auto mt-4 md:mt-0">
                     <button 
                        onClick={() => onLoadStory(cachedStory)}
                        className="flex-1 md:flex-none px-10 py-4 bg-white text-black hover:bg-blue-50 font-black rounded-2xl shadow-xl shadow-white/5 flex items-center justify-center gap-3 transition-all active:scale-95 hover:shadow-blue-500/20"
                     >
                        <Play size={20} fill="currentColor" /> ĐỌC TIẾP
                     </button>
                     <button 
                        onClick={onClearCache}
                        className="p-4 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all border border-transparent hover:border-red-500/20"
                        title="Bỏ qua truyện này"
                     >
                        <Trash2 size={20} />
                     </button>
                   </div>
               </div>
           </section>
        )}

        {/* SECTION: LOCAL SAVES (HORIZONTAL SCROLL) */}
        {saves.length > 0 && (
            <section className="animate-in fade-in slide-in-from-top-4 duration-700 delay-100">
                <h2 className="text-sm font-black text-gray-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <Save size={16} className="text-green-500" /> Các bản lưu gần đây
               </h2>
               <div className="flex gap-6 overflow-x-auto pb-6 pt-2 px-2 -mx-2 custom-scrollbar snap-x">
                   {saves.map(save => (
                       <div 
                         key={save.id} 
                         onClick={() => onLoadSave(save)}
                         className="group flex-none w-[320px] bg-[#141414] border border-white/5 rounded-2xl p-5 cursor-pointer hover:border-blue-500/40 hover:bg-gray-900 transition-all relative flex flex-col gap-4 shadow-lg hover:shadow-blue-900/10 snap-start"
                       >
                           <div className="flex justify-between items-center">
                               <div className="text-[10px] text-blue-400 font-black bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/20">
                                   {new Date(save.timestamp).toLocaleDateString('vi-VN')}
                               </div>
                               <button 
                                  onClick={(e) => handleDeleteSave(save.id, e)} 
                                  className="text-gray-600 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 rounded-lg"
                               >
                                   <Trash2 size={16} />
                               </button>
                           </div>
                           
                           <div>
                              <h4 className="font-black text-gray-100 text-lg truncate mb-1">{save.storyTitle}</h4>
                              {(save.chapterTitle || save.episodeTitle) && (
                                  <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wider truncate flex items-center gap-2">
                                      {save.chapterTitle && <span className="text-blue-500/70">{save.chapterTitle}</span>}
                                      {save.episodeTitle && <><span className="w-1 h-1 bg-gray-700 rounded-full"></span><span>{save.episodeTitle}</span></>}
                                  </div>
                              )}
                           </div>

                           <div className="bg-black/40 rounded-xl p-4 border border-white/5 h-24 overflow-hidden relative">
                               <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed italic">
                                   "{stripHtml(save.previewText)}"
                               </p>
                               <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/60 to-transparent"></div>
                           </div>

                           <div className="pt-2 flex items-center justify-between text-xs font-bold">
                               <span className="text-gray-600 group-hover:text-blue-400 transition-colors flex items-center gap-2">
                                  <Play size={12} fill="currentColor"/> QUAY LẠI
                               </span>
                               <span className="text-[10px] text-gray-700 font-mono">SAVE_ID: {save.id.slice(-4)}</span>
                           </div>
                       </div>
                   ))}
               </div>
            </section>
        )}

        {/* SECTION: FULL LIBRARY (GRID) */}
        <section className="animate-in fade-in slide-in-from-top-4 duration-700 delay-200">
            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                <h2 className="text-sm font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                   <LayoutGrid size={16} className="text-purple-500" /> Tất cả tác phẩm
                </h2>
                <div className="hidden sm:flex items-center gap-4 text-[10px] font-bold text-gray-600 tracking-widest">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> DB_CONNECTED</span>
                    <span>VER: 2.5.0</span>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 text-gray-500">
                    <Loader2 size={48} className="animate-spin mb-6 text-blue-500 opacity-50" />
                    <p className="text-sm font-bold uppercase tracking-widest animate-pulse">Đang đồng bộ thư viện...</p>
                </div>
            ) : filteredStories.length === 0 ? (
                <div className="text-center py-32 bg-white/5 border border-dashed border-white/10 rounded-[2rem]">
                    <div className="inline-flex p-6 bg-gray-900 rounded-3xl mb-6 text-gray-700 shadow-inner">
                        {stories.length === 0 ? <ServerCrash size={48} /> : <Search size={48} />}
                    </div>
                    <h3 className="text-2xl font-black text-gray-300 mb-2">
                        {stories.length === 0 ? "Thư viện hiện đang trống" : "Không tìm thấy tác phẩm"}
                    </h3>
                    <p className="text-gray-500 max-w-sm mx-auto text-sm leading-relaxed">
                        Vui lòng liên hệ với quản trị viên để cập nhật danh sách tác phẩm mới.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filteredStories.map((story) => (
                        <div 
                            key={story.id} 
                            onClick={() => onLoadStory(story)}
                            className="group relative bg-[#111] border border-white/5 rounded-[2rem] overflow-hidden cursor-pointer hover:border-blue-500/30 transition-all hover:shadow-2xl hover:shadow-blue-900/20 hover:-translate-y-2 flex flex-col"
                        >
                            {/* Card Media */}
                            <div className="aspect-[3/4] bg-gray-900 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent z-10 opacity-80"></div>
                                {story.thumbnail ? (
                                    <img 
                                        src={story.thumbnail} 
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s] ease-out opacity-90 group-hover:opacity-100"
                                        alt="cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-700">
                                        <BookOpen size={64} className="opacity-20" />
                                    </div>
                                )}
                                
                                <div className="absolute top-4 right-4 z-20">
                                    <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-black uppercase rounded-xl tracking-widest shadow-2xl">
                                        {story.scenes ? Object.keys(story.scenes).length : 0} Pgs
                                    </div>
                                </div>

                                <div className="absolute bottom-6 left-6 z-20 right-6">
                                    <h3 className="text-2xl font-black text-white mb-1 group-hover:text-blue-400 transition-colors line-clamp-2 drop-shadow-2xl">
                                      {story.title}
                                    </h3>
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                        <span className="truncate">{story.author || "Anonymous"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Card Content */}
                            <div className="p-6 pt-0 bg-[#111] flex-1 flex flex-col">
                                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-6 opacity-70 italic">
                                    {stripHtml(story.description) || "Một câu chuyện bí ẩn chưa có lời giải thích..."}
                                </p>
                                
                                <button className="mt-auto w-full py-4 bg-white/5 hover:bg-blue-600 border border-white/10 group-hover:border-blue-500/50 rounded-2xl text-xs font-black text-gray-300 group-hover:text-white transition-all flex items-center justify-center gap-3 active:scale-95">
                                    BẮT ĐẦU ĐỌC <Play size={14} fill="currentColor" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>

      </main>

      {/* MINIMAL FOOTER */}
      <footer className="border-t border-white/5 py-12 px-6 bg-[#050505]">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2 opacity-30">
                  <BookText size={16} />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">VN Reader Pro</span>
              </div>
              <p className="text-gray-700 text-[10px] font-bold uppercase tracking-widest">
                  © 2024 Developed for the ultimate visual novel experience.
              </p>
              <div className="flex gap-6 text-[10px] font-bold text-gray-700 uppercase tracking-widest">
                  <a href="#" className="hover:text-blue-500 transition-colors">Privacy</a>
                  <a href="#" className="hover:text-blue-500 transition-colors">Terms</a>
                  <a href="#" className="hover:text-blue-500 transition-colors">Support</a>
              </div>
          </div>
      </footer>
    </div>
  );
};

export default ReaderLanding;