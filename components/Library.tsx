import React, { useState } from 'react';
import { Book, Play, RotateCcw, AlertCircle, Loader2 } from 'lucide-react';
import { STORY_CATALOG, CatalogItem } from '../constants';
import { Story } from '../types';

interface LibraryProps {
  onSelectStory: (story: Story) => void;
  onRequestContinue: () => void;
}

const Library: React.FC<LibraryProps> = ({ onSelectStory, onRequestContinue }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadStory = async (item: CatalogItem) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
        if (item.sourceType === 'embedded' && item.embeddedData) {
            await new Promise(r => setTimeout(r, 400)); // Fake load
            onSelectStory(item.embeddedData);
        } else if (item.sourceType === 'remote' && item.remoteUrl) {
            const res = await fetch(item.remoteUrl);
            if (!res.ok) throw new Error("Không thể tải file truyện.");
            const data = await res.json();
            onSelectStory(data);
        }
    } catch (err) {
        setErrorMsg("Đã xảy ra lỗi khi tải truyện này.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-900 text-white">
        {/* Header */}
        <div className="pt-16 pb-12 px-6 text-center bg-gray-900 border-b border-gray-800 relative overflow-hidden">
             <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/30 via-transparent to-transparent"></div>
             <h1 className="text-5xl font-black mb-4 relative z-10"><span className="text-blue-500">VN</span> Reader</h1>
             <p className="text-gray-400 max-w-xl mx-auto relative z-10">Thư viện Visual Novel trực tuyến. Chọn một tác phẩm để bắt đầu.</p>
             <button onClick={onRequestContinue} className="mt-8 bg-gray-800 hover:bg-gray-700 border border-gray-700 px-6 py-2 rounded-full inline-flex items-center gap-2 transition-all relative z-10">
                <RotateCcw size={16} className="text-green-500"/> Tiếp tục đọc
             </button>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-12 w-full flex-1">
            {errorMsg && (
                <div className="bg-red-900/20 border border-red-800 text-red-200 p-4 rounded-lg mb-8 flex items-center gap-3">
                    <AlertCircle /> {errorMsg}
                </div>
            )}
            
            {isLoading ? (
                <div className="text-center py-20 text-blue-500"><Loader2 size={48} className="animate-spin mx-auto mb-4"/>Đang tải dữ liệu...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {STORY_CATALOG.map(item => (
                        <div key={item.id} onClick={() => loadStory(item)} className="group bg-gray-800 rounded-xl overflow-hidden cursor-pointer hover:-translate-y-1 transition-all hover:shadow-2xl hover:shadow-blue-900/20 border border-gray-700 hover:border-blue-500/50">
                            <div className="aspect-video bg-gray-900 relative">
                                {item.thumbnail ? <img src={item.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/> : <div className="w-full h-full flex items-center justify-center"><Book size={48} className="text-gray-700"/></div>}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="bg-blue-600 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2"><Play size={16} fill="currentColor"/> Đọc ngay</span>
                                </div>
                            </div>
                            <div className="p-5">
                                <h3 className="font-bold text-lg mb-1 group-hover:text-blue-400 transition-colors">{item.title}</h3>
                                <div className="text-xs font-bold text-gray-500 uppercase mb-2">{item.author}</div>
                                <p className="text-sm text-gray-400 line-clamp-2">{item.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
        <div className="text-center py-6 text-gray-700 text-xs uppercase font-bold tracking-widest">VN Web Reader Build 2.0</div>
    </div>
  );
};

export default Library;