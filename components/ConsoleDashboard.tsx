
import React, { useState, useEffect } from 'react';
import { PenTool, MonitorPlay, Terminal, BookOpen, Layers, PlusCircle, Server, Trash2, Edit, Upload, RefreshCw, FileJson, Search, ChevronDown, Loader2, Settings as SettingsIcon, Globe, Heart, MessageCircle, Facebook, Twitter, Mail, Save } from 'lucide-react';
import { Story, AppConfig } from '../types';
import { serverFetchAllStories, serverSaveStory, serverDeleteStory, serverFetchConfig, serverSaveConfig, DEFAULT_APP_CONFIG } from '../utils/mockServer';
import ImportModal from './ImportModal';

interface ConsoleDashboardProps {
    onOpenEditor: (story?: Story) => void;
    onOpenReader: () => void;
}

const ConsoleDashboard: React.FC<ConsoleDashboardProps> = ({ onOpenEditor, onOpenReader }) => {
    const [activeTab, setActiveTab] = useState<'files' | 'settings'>('files');
    const [serverFiles, setServerFiles] = useState<Story[]>([]);
    const [appConfig, setAppConfig] = useState<AppConfig>(DEFAULT_APP_CONFIG);
    const [isLoading, setIsLoading] = useState(false);
    const [isSavingConfig, setIsSavingConfig] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const [files, config] = await Promise.all([
            serverFetchAllStories(),
            serverFetchConfig()
        ]);
        setServerFiles(files);
        setAppConfig(config);
        setIsLoading(false);
    };

    const handleDelete = async (id: string, title: string) => {
        if (confirm(`Bạn có chắc chắn muốn xóa project "${title}" khỏi server không?`)) {
            const success = await serverDeleteStory(id);
            if (success) loadData();
            else alert("Lỗi khi xóa file.");
        }
    };

    const handleImportSuccess = async (importedStory: Story) => {
        const success = await serverSaveStory(importedStory);
        if (success) {
            alert("Đã import thành công!");
            loadData();
        } else {
            alert("Lỗi khi lưu file import.");
        }
    };

    const handleSaveConfig = async () => {
        setIsSavingConfig(true);
        const success = await serverSaveConfig(appConfig);
        if (success) {
            alert("Đã lưu cấu hình hệ thống thành công!");
        } else {
            alert("Lỗi khi lưu cấu hình.");
        }
        setIsSavingConfig(false);
    };

    const filteredFiles = serverFiles.filter(f => 
        f.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (f.author && f.author.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="h-screen bg-neutral-950 text-gray-200 flex flex-col font-mono overflow-hidden">
            {/* Top Bar */}
            <div className="bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between z-20 shadow-lg">
                <div className="flex items-center gap-3">
                    <Terminal className="text-green-500" />
                    <h1 className="font-bold text-lg tracking-wider">VN_CONSOLE_V2.5 <span className="text-gray-600 text-xs hidden sm:inline">| DATABASE_READY</span></h1>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowImportModal(true)} className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 border border-gray-700 transition-all"><Upload size={14}/> IMPORT STORY</button>
                    <button onClick={() => loadData()} className="bg-gray-800 hover:bg-gray-700 text-blue-400 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 border border-gray-700 transition-all"><RefreshCw size={14} className={isLoading ? "animate-spin" : ""}/> REFRESH</button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden p-4 md:p-8 flex flex-col lg:flex-row gap-6 max-w-[1600px] mx-auto w-full">
                
                {/* LEFT PANEL: QUICK ACTIONS */}
                <div className="lg:w-80 flex flex-col gap-6 shrink-0">
                    <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-6 group transition-all hover:bg-blue-600/20">
                        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><MonitorPlay className="text-blue-500"/> Web Reader</h2>
                        <p className="text-[10px] text-gray-400 mb-6 leading-relaxed">Khởi chạy giao diện người đọc dành cho người dùng cuối.</p>
                        <button onClick={onOpenReader} className="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition-transform active:scale-95">LAUNCH READER <ChevronDown size={14} className="-rotate-90"/></button>
                    </div>

                    <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-2 space-y-1">
                        <button 
                            onClick={() => setActiveTab('files')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition-all ${activeTab === 'files' ? 'bg-gray-800 text-blue-400 border border-gray-700' : 'text-gray-500 hover:bg-gray-800/50'}`}
                        >
                            <Server size={16}/> FILE MANAGER
                        </button>
                        <button 
                            onClick={() => setActiveTab('settings')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition-all ${activeTab === 'settings' ? 'bg-gray-800 text-blue-400 border border-gray-700' : 'text-gray-500 hover:bg-gray-800/50'}`}
                        >
                            <SettingsIcon size={16}/> SYSTEM SETTINGS
                        </button>
                    </div>
                </div>

                {/* MAIN CONTENT AREA */}
                <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl flex flex-col overflow-hidden shadow-2xl">
                    
                    {activeTab === 'files' ? (
                        <>
                            <div className="p-6 border-b border-gray-800 bg-gray-800/30 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                                <h2 className="text-lg font-bold text-white flex items-center gap-3">
                                    <Server className="text-purple-500" size={20}/> 
                                    <span>File Manager</span>
                                    <span className="bg-gray-800 text-gray-500 text-[10px] px-2 py-0.5 rounded-full font-mono">{filteredFiles.length} projects</span>
                                </h2>
                                
                                <div className="flex gap-3 w-full sm:w-auto">
                                    <div className="relative flex-1 sm:w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                                        <input 
                                            type="text" 
                                            placeholder="Lọc project..." 
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full bg-black/40 border border-gray-700 rounded-lg pl-9 pr-4 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                    <button onClick={() => onOpenEditor()} className="bg-green-700 hover:bg-green-600 text-white px-4 py-1.5 rounded text-xs font-bold flex items-center gap-2 shrink-0 transition-colors shadow-lg shadow-green-900/20"><PlusCircle size={14}/> NEW STORY</button>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                <div className="space-y-3 pb-4">
                                    {isLoading ? (
                                        <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
                                            <Loader2 className="animate-spin" size={32}/>
                                            <span className="text-xs font-bold animate-pulse">CONNECTING_TO_DATABASE...</span>
                                        </div>
                                    ) : filteredFiles.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-gray-800 rounded-xl bg-black/10">
                                            <FileJson size={48} className="text-gray-700 mb-4" />
                                            <p className="text-sm text-gray-500">Không tìm thấy cốt truyện nào.</p>
                                        </div>
                                    ) : (
                                        filteredFiles.map((file) => (
                                            <div key={file.id} className="group bg-gray-950/60 border border-gray-800 rounded-lg p-4 flex flex-col sm:flex-row gap-4 items-center transition-all hover:bg-gray-900/80 hover:border-blue-500/40 hover:translate-x-1 shadow-sm">
                                                <div className="flex-1 flex items-center gap-4 w-full">
                                                    <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center text-blue-500 border border-gray-800 shrink-0 shadow-inner group-hover:border-blue-500/20">
                                                        {file.thumbnail ? (
                                                            <img src={file.thumbnail} className="w-full h-full object-cover rounded-lg opacity-80 group-hover:opacity-100 transition-opacity" />
                                                        ) : (
                                                            <FileJson size={20}/>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-bold text-gray-100 group-hover:text-blue-400 transition-colors truncate text-sm">{file.title}</div>
                                                        <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-gray-600">
                                                            <span>ID: {file.id}</span>
                                                            <span>•</span>
                                                            <span className="text-purple-500/70">{Object.keys(file.scenes).length} SCENES</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end border-t border-gray-800 sm:border-t-0 pt-3 sm:pt-0">
                                                    <button onClick={() => onOpenEditor(file)} className="flex-1 sm:flex-none px-4 py-1.5 bg-gray-800 hover:bg-blue-600 hover:text-white text-gray-300 rounded text-[10px] font-bold transition-all flex items-center justify-center gap-2"><Edit size={12}/> EDIT</button>
                                                    <button onClick={() => handleDelete(file.id, file.title)} className="p-2 bg-gray-800/40 hover:bg-red-900/30 hover:text-red-400 text-gray-600 rounded transition-all"><Trash2 size={14}/></button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        /* SYSTEM SETTINGS TAB */
                        <div className="flex flex-col h-full">
                            <div className="p-6 border-b border-gray-800 bg-gray-800/30 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-white flex items-center gap-3">
                                    <SettingsIcon className="text-blue-500" size={20}/> 
                                    <span>System Configuration</span>
                                </h2>
                                <button 
                                    onClick={handleSaveConfig}
                                    disabled={isSavingConfig}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20 disabled:opacity-50"
                                >
                                    {isSavingConfig ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}
                                    SAVE CONFIGURATION
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                <div className="max-w-3xl space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                            <Globe size={14}/> Reader Footer Links
                                        </h3>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] text-gray-500 font-bold uppercase">Báo cáo lỗi (Bug Report URL)</label>
                                                <input 
                                                    type="text" 
                                                    className="w-full bg-black/40 border border-gray-800 rounded-lg px-4 py-2 text-xs text-blue-400 font-mono outline-none focus:border-blue-500"
                                                    value={appConfig.bugReportUrl}
                                                    onChange={(e) => setAppConfig({...appConfig, bugReportUrl: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                            <MessageCircle size={14}/> Contact & Social Media
                                        </h3>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] text-gray-500 font-bold uppercase">Facebook URL</label>
                                                <div className="flex gap-2">
                                                    <div className="bg-black/40 p-2.5 rounded border border-gray-800 flex items-center justify-center text-blue-500">
                                                        <Facebook size={16}/>
                                                    </div>
                                                    <input 
                                                        type="text" 
                                                        className="flex-1 bg-black/40 border border-gray-800 rounded-lg px-4 py-2 text-xs text-gray-300 font-mono outline-none focus:border-blue-500"
                                                        value={appConfig.fbUrl}
                                                        onChange={(e) => setAppConfig({...appConfig, fbUrl: e.target.value})}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] text-gray-500 font-bold uppercase">X (Twitter) URL</label>
                                                <div className="flex gap-2">
                                                    <div className="bg-black/40 p-2.5 rounded border border-gray-800 flex items-center justify-center text-gray-300">
                                                        <Twitter size={16}/>
                                                    </div>
                                                    <input 
                                                        type="text" 
                                                        className="flex-1 bg-black/40 border border-gray-800 rounded-lg px-4 py-2 text-xs text-gray-300 font-mono outline-none focus:border-blue-500"
                                                        value={appConfig.xUrl}
                                                        onChange={(e) => setAppConfig({...appConfig, xUrl: e.target.value})}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] text-gray-500 font-bold uppercase">Contact Email (mailto:)</label>
                                                <div className="flex gap-2">
                                                    <div className="bg-black/40 p-2.5 rounded border border-gray-800 flex items-center justify-center text-red-500">
                                                        <Mail size={16}/>
                                                    </div>
                                                    <input 
                                                        type="text" 
                                                        className="flex-1 bg-black/40 border border-gray-800 rounded-lg px-4 py-2 text-xs text-gray-300 font-mono outline-none focus:border-blue-500"
                                                        value={appConfig.mailUrl}
                                                        onChange={(e) => setAppConfig({...appConfig, mailUrl: e.target.value})}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                            <Heart size={14}/> Donation Settings
                                        </h3>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] text-gray-500 font-bold uppercase">Donation Image URL</label>
                                                <input 
                                                    type="text" 
                                                    className="w-full bg-black/40 border border-gray-800 rounded-lg px-4 py-2 text-xs text-gray-300 font-mono outline-none focus:border-blue-500"
                                                    value={appConfig.donateImageUrl}
                                                    onChange={(e) => setAppConfig({...appConfig, donateImageUrl: e.target.value})}
                                                />
                                                <div className="mt-2 aspect-video bg-black/50 border border-gray-800 rounded-xl overflow-hidden flex items-center justify-center">
                                                    {appConfig.donateImageUrl ? (
                                                        <img src={appConfig.donateImageUrl} className="max-w-full max-h-full object-contain" alt="Preview"/>
                                                    ) : (
                                                        <span className="text-[10px] text-gray-700 italic">No image URL provided</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} onImport={handleImportSuccess} />
        </div>
    );
};

export default ConsoleDashboard;
