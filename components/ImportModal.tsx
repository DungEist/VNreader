import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Story } from '../types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (story: Story) => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [jsonContent, setJsonContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImport = () => {
    try {
      if (!jsonContent.trim()) {
        setError("Vui lòng nhập nội dung JSON.");
        return;
      }

      const parsed = JSON.parse(jsonContent);

      // Validate cơ bản
      if (!parsed.id || !parsed.title || !parsed.scenes || !parsed.startSceneId) {
        throw new Error("Cấu trúc JSON không hợp lệ. Thiếu id, title, scenes hoặc startSceneId.");
      }

      if (!parsed.scenes[parsed.startSceneId]) {
         throw new Error(`Scene bắt đầu '${parsed.startSceneId}' không tồn tại trong danh sách scenes.`);
      }

      onImport(parsed as Story);
      onClose();
    } catch (err: any) {
      setError(err.message || "Lỗi khi phân tích JSON.");
    }
  };

  const loadTemplate = () => {
    const template = {
      id: "my-new-story",
      title: "Tiêu đề truyện mới",
      startSceneId: "scene1",
      scenes: {
        "scene1": {
          id: "scene1",
          text: "Nội dung cảnh đầu tiên...",
          characterName: "Tên nhân vật",
          choices: [
            { text: "Lựa chọn tiếp theo", nextSceneId: "scene2" }
          ]
        },
        "scene2": {
          id: "scene2",
          text: "Kết thúc.",
          choices: []
        }
      }
    };
    setJsonContent(JSON.stringify(template, null, 2));
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-4xl h-[90vh] rounded-lg shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
        
        <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gray-800 rounded-t-lg">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Upload className="text-blue-500" /> Nhập Cốt Truyện
            </h2>
            <p className="text-gray-400 text-sm mt-1">Dán mã JSON của cốt truyện vào bên dưới.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 p-6 flex flex-col gap-4 overflow-hidden">
          <div className="flex gap-2 mb-2">
            <button 
              onClick={loadTemplate} 
              className="text-xs flex items-center gap-1 bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-white transition-colors"
            >
              <FileText size={12} /> Tải mẫu JSON chuẩn
            </button>
          </div>
          
          <textarea
            className="flex-1 w-full bg-gray-950 border border-gray-700 rounded-lg p-4 font-mono text-sm text-green-400 focus:outline-none focus:border-blue-500 resize-none"
            placeholder='{ "title": "...", "scenes": { ... } }'
            value={jsonContent}
            onChange={(e) => setJsonContent(e.target.value)}
            spellCheck={false}
          />
          
          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-900/20 p-3 rounded border border-red-900/50">
              <AlertCircle size={18} />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-700 bg-gray-800 rounded-b-lg flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors">
            Hủy
          </button>
          <button 
            onClick={handleImport}
            className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-all"
          >
            <CheckCircle size={18} /> Xác nhận
          </button>
        </div>

      </div>
    </div>
  );
};

export default ImportModal;