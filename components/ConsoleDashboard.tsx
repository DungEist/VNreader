import React, { useState, useEffect } from 'react';
import { PenTool, MonitorPlay, Terminal, BookOpen, Layers, PlusCircle, Server, Trash2, Edit, Upload, RefreshCw, FileJson } from 'lucide-react';
import { Story } from '../types';
import { serverFetchAllStories, serverSaveStory, serverDeleteStory } from '../utils/mockServer';
import ImportModal from './ImportModal';

interface ConsoleDashboardProps {
    onOpenEditor: (story?: Story) => void;
    onOpenReader: () => void;
}

const ConsoleDashboard: React.FC<ConsoleDashboardProps> = ({ onOpenEditor, onOpenReader }) => {
    const [serverFiles, setServerFiles] = useState<Story[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);

    // Load files from "Server" on mount
    useEffect(() => {
        loadServerFiles();
    }, []);

    const loadServerFiles = async () => {
        setIsLoading(true);
        const files = await serverFetchAllStories();
        setServerFiles(files);
        setIsLoading(false);
    };

    const handleDelete = async (id: string, title: string) => {
        if (confirm(`Bạn có chắc chắn muốn xóa project "${title}" khỏi server không? Hành động này không thể hoàn tác.`)) {
            const success = await serverDeleteStory(id);
            if (success) loadServerFiles();
            else alert("Lỗi khi xóa file.");
        }
    };

    const handleImportSuccess = async (importedStory: Story) => {
        // Khi import xong, lưu ngay lên server
        const success = await serverSaveStory(importedStory);
        if (success) {
            alert("Đã import và lưu lên server thành công!");
            loadServerFiles();
        } else {
            alert("Lỗi khi lưu file import lên server.");
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-gray-200 flex flex-col font-mono">
            {/* Top Bar */}
            <div className="bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Terminal className="text-green-500" />
                    <h1 className="font-bold text-lg tracking-wider">VN_CONSOLE_V2.1 <span className="text-gray-600 text-xs">| SERVER CONNECTED</span></h1>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setShowImportModal(true)}
                        className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-colors border border-gray-700"
                    >
                        <Upload size={14}/> IMPORT JSON
                    </button>
                    <button 
                        onClick={() => loadServerFiles()}
                        className="bg-gray-800 hover:bg-gray-700 text-blue-400 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-colors border border-gray-700"
                    >
                        <RefreshCw size={14} className={isLoading ? "animate-spin" : ""}/> REFRESH
                    </button>
                </div>
            </div>

            <div className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-[1600px] mx-auto w-full">
                
                {/* LEFT PANEL: READER CONTROL */}
                <div className="space-y-6 lg:col-span-1">
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 hover:border-blue-500/50 transition-colors group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <MonitorPlay size={120} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                            <MonitorPlay className="text-blue-500"/> Web Reader
                        </h2>
                        <p className="text-gray-400 mb-6 max-w-md">
                            Khởi chạy giao diện người đọc. Kiểm tra hiển thị thực tế của cốt truyện.
                        </p>
                        <button 
                            onClick={onOpenReader}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-all hover:translate-x-1"
                        >
                            LAUNCH APP <MonitorPlay size={16}/>
                        </button>
                    </div>

                    <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6">
                        <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 flex items-center gap-2"><Layers size={16}/> System Status</h3>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="bg-gray-950 p-3 rounded border border-gray-800">
                                <div className="text-gray-500">Storage Engine</div>
                                <div className="text-green-400 font-bold">MOCK SERVER</div>
                            </div>
                            <div className="bg-gray-950 p-3 rounded border border-gray-800">
                                <div className="text-gray-500">Total Projects</div>
                                <div className="text-blue-400 font-bold">{serverFiles.length} items</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL: SERVER FILE MANAGER */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl flex flex-col overflow-hidden lg:col-span-2">
                    <div className="p-6 border-b border-gray-800 bg-gray-800/50 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Server className="text-purple-500"/> Server File Manager
                        </h2>
                        <button 
                            onClick={() => onOpenEditor()}
                            className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-green-900/20"
                        >
                            <PlusCircle size={16}/> New Project
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {/* Header Row */}
                        <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-800">
                            <div className="col-span-6">Project Name</div>
                            <div className="col-span-2 text-center">Scenes</div>
                            <div className="col-span-4 text-right">Actions</div>
                        </div>

                        {/* Server Files List */}
                        {isLoading ? (
                            <div className="text-center py-10 text-gray-500 text-sm">Connecting to server...</div>
                        ) : serverFiles.length === 0 ? (
                            <div className="text-center py-10 text-gray-500 text-sm border border-dashed border-gray-800 rounded-lg">
                                Server is empty. Create a new project or Import JSON.
                            </div>
                        ) : (
                            serverFiles.map((file) => (
                                <div key={file.id} className="grid grid-cols-12 gap-4 items-center p-4 bg-gray-950 border border-gray-800 rounded-lg hover:border-blue-500/30 hover:bg-gray-900 transition-all group">
                                    <div className="col-span-6 flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-900/20 rounded flex items-center justify-center text-blue-500">
                                            <FileJson size={16}/>
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-200 group-hover:text-blue-400 transition-colors">{file.title}</div>
                                            <div className="text-[10px] text-gray-600 font-mono">{file.id}</div>
                                        </div>
                                    </div>
                                    <div className="col-span-2 text-center text-gray-400 font-mono text-xs">
                                        {Object.keys(file.scenes).length}
                                    </div>
                                    <div className="col-span-4 flex justify-end gap-2">
                                        <button 
                                            onClick={() => onOpenEditor(file)}
                                            className="px-3 py-1.5 bg-gray-800 hover:bg-blue-600 hover:text-white text-gray-300 rounded text-xs font-bold transition-colors flex items-center gap-1"
                                        >
                                            <Edit size={12}/> Edit
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(file.id, file.title)}
                                            className="p-2 bg-gray-800 hover:bg-red-900/50 hover:text-red-400 text-gray-500 rounded transition-colors"
                                            title="Delete File"
                                        >
                                            <Trash2 size={14}/>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <ImportModal 
                isOpen={showImportModal} 
                onClose={() => setShowImportModal(false)}
                onImport={handleImportSuccess}
            />
        </div>
    );
};

export default ConsoleDashboard;