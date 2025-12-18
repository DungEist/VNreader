
import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, Play, Plus, Trash2, Image as ImageIcon, Music, 
  MessageSquare, User, Layout, Settings, ArrowRight, Download,
  ArrowLeft, ChevronRight, Bold, Italic, Palette, Layers, File, Edit3, 
  ChevronDown, X, Undo, Redo, CloudUpload, Loader2, GitBranch, 
  Sparkles, ClipboardCopy, Volume2, PlayCircle, FileJson, AlertCircle, CheckCircle,
  FileUp, Package, ExternalLink, StickyNote, Book, Info, PlusCircle, MousePointer
} from 'lucide-react';
import { Story, Scene, Choice, Character, Chapter, Episode, DialogueEntry, GlossaryEntry } from '../types';
import StoryGraph from './StoryGraph';
import { serverSaveStory } from '../utils/mockServer';

interface StoryEditorProps {
  initialStory?: Story;
  onExit: () => void;
  onPlay: (story: Story, startSceneId?: string) => void;
}

const DEFAULT_SCENE: Scene = {
  id: '',
  text: '',
  choices: []
};

const generateId = (prefix: string) => {
  const shortRand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}_${shortRand}`;
};

const StoryEditor: React.FC<StoryEditorProps> = ({ initialStory, onExit, onPlay }) => {
  const [story, setStory] = useState<Story>(initialStory || {
    id: generateId('STORY'),
    title: "Cốt truyện mới",
    author: "Tác giả",
    startSceneId: "S_START",
    scenes: {
      "S_START": {
        id: "S_START",
        text: "Xin chào! Đây là cảnh đầu tiên.",
        choices: [],
        dialogues: [{ text: "Xin chào! Đây là cảnh đầu tiên.", characterName: "Hệ thống" }]
      }
    },
    glossary: {}
  });

  const [isSaving, setIsSaving] = useState(false);
  const [historyStack, setHistoryStack] = useState<Story[]>([]);
  const [redoStack, setRedoStack] = useState<Story[]>([]);
  const [viewMode, setViewMode] = useState<'editor' | 'structure' | 'settings' | 'graph' | 'glossary'>('structure');
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showSceneImportModal, setShowSceneImportModal] = useState(false);
  const [showTermPickerModal, setShowTermPickerModal] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  
  const activeTextAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const recordHistory = (stateToRecord = story) => {
    setHistoryStack(prev => [...prev.slice(-49), stateToRecord]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (historyStack.length === 0) return;
    const previousStory = historyStack[historyStack.length - 1];
    setRedoStack(prev => [story, ...prev]);
    setHistoryStack(prev => prev.slice(0, -1));
    setStory(previousStory);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextStory = redoStack[0];
    setHistoryStack(prev => [...prev, story]);
    setRedoStack(prev => prev.slice(1));
    setStory(nextStory);
  };

  const playPreview = (url: string | undefined) => {
    if (!url) return;
    if (!audioPreviewRef.current) audioPreviewRef.current = new Audio();
    audioPreviewRef.current.src = url;
    audioPreviewRef.current.play().catch(e => console.warn("Không thể phát âm thanh: ", e));
  };

  const copyAttributesFrom = (sourceId: string) => {
    if (!selectedSceneId || !story.scenes[sourceId]) return;
    recordHistory();
    const source = story.scenes[sourceId];
    setStory(prev => ({
      ...prev,
      scenes: {
        ...prev.scenes,
        [selectedSceneId]: {
          ...prev.scenes[selectedSceneId],
          characterName: source.characterName,
          characters: source.characters ? JSON.parse(JSON.stringify(source.characters)) : [],
          backgroundImage: source.backgroundImage,
          bgm: source.bgm,
          sfx: source.sfx,
          portrait: source.portrait
        }
      }
    }));
    setShowCopyModal(false);
  };

  const wrapText = (tag: string, style?: string) => {
    if (!activeTextAreaRef.current) return;
    const el = activeTextAreaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const selectedText = text.substring(start, end);
    
    let wrapped;
    if (tag === 'span' && style) {
      if (style.startsWith('term:')) {
         const termId = style.split(':')[1];
         wrapped = `<span class="glossary-term" data-term-id="${termId}">${selectedText}</span>`;
      } else {
         wrapped = `<span style="color: ${style}">${selectedText}</span>`;
      }
    } else {
      wrapped = `<${tag}>${selectedText}</${tag}>`;
    }
    
    const newText = text.substring(0, start) + wrapped + text.substring(end);
    const dialogueIdx = parseInt(el.dataset.idx || "0");
    updateDialogueLine(dialogueIdx, 'text', newText);
  };

  const handleTermPickerSelect = (termId: string) => {
      wrapText('span', `term:${termId}`);
      setShowTermPickerModal(false);
  };

  const addGlossaryEntry = () => {
      recordHistory();
      const newId = generateId('TERM');
      setStory(prev => ({
          ...prev,
          glossary: {
              ...(prev.glossary || {}),
              [newId]: { id: newId, term: "Thuật ngữ mới", definition: "Giải thích thuật ngữ..." }
          }
      }));
  };

  const updateGlossaryEntry = (id: string, field: keyof GlossaryEntry, value: string) => {
      recordHistory();
      setStory(prev => ({
          ...prev,
          glossary: {
              ...(prev.glossary || {}),
              [id]: { ...(prev.glossary || {})[id], [field]: value }
          }
      }));
  };

  const deleteGlossaryEntry = (id: string) => {
      if(!confirm("Xóa thuật ngữ này?")) return;
      recordHistory();
      setStory(prev => {
          const newGlossary = { ...(prev.glossary || {}) };
          delete newGlossary[id];
          return { ...prev, glossary: newGlossary };
      });
  };

  const currentScene = selectedSceneId ? (story.scenes[selectedSceneId] || DEFAULT_SCENE) : DEFAULT_SCENE;
  const episodeScenes: Scene[] = selectedEpisodeId ? (Object.values(story.scenes) as Scene[]).filter((s) => s.episodeId === selectedEpisodeId).sort((a, b) => (a.order || 0) - (b.order || 0)) : [];
  const currentChapter = story.chapters?.find(c => c.id === selectedChapterId);
  const currentEpisode = currentChapter?.episodes.find(e => e.id === selectedEpisodeId);

  const updateStoryInfo = (field: keyof Story, value: any) => { 
    recordHistory();
    setStory(prev => ({ ...prev, [field]: value })); 
  };

  const handleSelectEpisode = (epId: string) => {
      setSelectedEpisodeId(epId);
      const parentChap = story.chapters?.find(c => c.episodes.some(e => e.id === epId));
      if (parentChap) {
          setSelectedChapterId(parentChap.id);
          setExpandedChapters(prev => new Set(prev).add(parentChap.id));
      }
      const ep = parentChap?.episodes.find(e => e.id === epId);
      if (ep) setSelectedSceneId(ep.startSceneId);
      setViewMode('editor');
  };

  const updateScene = (field: keyof Scene, value: any) => {
    if (!selectedSceneId) return;
    recordHistory();
    setStory(prev => ({ ...prev, scenes: { ...prev.scenes, [selectedSceneId]: { ...prev.scenes[selectedSceneId], [field]: value } } }));
  };

  const addScene = () => { 
    if (!selectedEpisodeId) return; 
    recordHistory(); 
    const newId = generateId('S'); 
    const newScene: Scene = { id: newId, text: "...", choices: [], episodeId: selectedEpisodeId, dialogues: [{ text: "...", characterName: "" }], order: episodeScenes.length }; 
    
    setStory(prev => {
        const updatedScenes = { ...prev.scenes, [newId]: newScene };
        if (selectedSceneId) {
            const current = prev.scenes[selectedSceneId];
            if (current && (!current.choices || current.choices.length === 0) && !current.nextSceneId) {
                updatedScenes[selectedSceneId] = { ...current, nextSceneId: newId };
            }
        }
        return { ...prev, scenes: updatedScenes };
    }); 
    setSelectedSceneId(newId); 
  };

  const dialogues = currentScene.dialogues || [{ text: currentScene.text, characterName: currentScene.characterName }];
  const updateDialogueLine = (index: number, field: keyof DialogueEntry, value: string) => {
    recordHistory();
    const newDialogues = [...dialogues];
    newDialogues[index] = { ...newDialogues[index], [field]: value };
    setStory(prev => {
        if (!selectedSceneId) return prev;
        const updatedScene = { ...prev.scenes[selectedSceneId], dialogues: newDialogues };
        if (index === 0) { if (field === 'text') updatedScene.text = value; if (field === 'characterName') updatedScene.characterName = value; }
        return { ...prev, scenes: { ...prev.scenes, [selectedSceneId]: updatedScene } };
    });
  };

  const currentCharacters = currentScene.characters || [];
  const addCharacterSprite = () => { recordHistory(); updateScene('characters', [...currentCharacters, { name: '', image: '', position: 'center' }]); };
  const updateCharacterSprite = (index: number, field: keyof Character, value: any) => { recordHistory(); const chars = [...currentCharacters]; chars[index] = { ...chars[index], [field]: value }; updateScene('characters', chars); };
  const removeCharacterSprite = (index: number) => { recordHistory(); const chars = [...currentCharacters]; chars.splice(index, 1); updateScene('characters', chars); };

  const addDialogueLine = () => { recordHistory(); updateScene('dialogues', [...dialogues, { text: '...', characterName: dialogues[dialogues.length-1]?.characterName || '' }]); };
  const deleteDialogueLine = (index: number) => { recordHistory(); const newD = [...dialogues]; newD.splice(index, 1); updateScene('dialogues', newD); };

  const addChoice = () => { recordHistory(); updateScene('choices', [...(currentScene.choices || []), { text: 'Lựa chọn mới', nextSceneId: '' }]); };
  const updateChoice = (index: number, field: keyof Choice, value: string) => { recordHistory(); const newChoices = [...(currentScene.choices || [])]; newChoices[index] = { ...newChoices[index], [field]: value }; updateScene('choices', newChoices); };
  const deleteChoice = (index: number) => { recordHistory(); const newChoices = [...(currentScene.choices || [])]; newChoices.splice(index, 1); updateScene('choices', newChoices); };

  const handleSaveToServer = async () => {
      setIsSaving(true);
      await serverSaveStory(story);
      setIsSaving(false);
  };

  const addChapter = () => {
    recordHistory();
    const newChapter: Chapter = { id: generateId('CHAP'), title: "Chương mới", episodes: [] };
    setStory(prev => ({ ...prev, chapters: [...(prev.chapters || []), newChapter] }));
  };

  const updateChapterData = (chapterId: string, field: keyof Chapter, value: any) => {
    recordHistory();
    setStory(prev => ({ ...prev, chapters: (prev.chapters || []).map(c => c.id === chapterId ? { ...c, [field]: value } : c) }));
  };

  const deleteChapter = (chapterId: string) => {
    if (!confirm("Xóa chương này?")) return;
    recordHistory();
    setStory(prev => ({ ...prev, chapters: (prev.chapters || []).filter(c => c.id !== chapterId) }));
    if (selectedChapterId === chapterId) setSelectedChapterId(null);
  };

  const addEpisode = (chapterId: string) => {
    recordHistory();
    const newSceneId = generateId('S');
    const newEpisodeId = generateId('EP');
    const newEpisode: Episode = { id: newEpisodeId, title: "Tập mới", startSceneId: newSceneId };
    setStory(prev => {
      const newScenes = { ...prev.scenes };
      newScenes[newSceneId] = { id: newSceneId, text: "Cảnh khởi đầu tập mới...", choices: [], episodeId: newEpisodeId, dialogues: [{ text: "Cảnh khởi đầu tập mới...", characterName: "" }], order: 0 };
      return { ...prev, scenes: newScenes, chapters: (prev.chapters || []).map(c => c.id === chapterId ? { ...c, episodes: [...c.episodes, newEpisode] } : c) };
    });
  };

  const updateEpisodeData = (chapterId: string, episodeId: string, field: keyof Episode, value: any) => {
    recordHistory();
    setStory(prev => ({ ...prev, chapters: (prev.chapters || []).map(c => c.id === chapterId ? { ...c, episodes: c.episodes.map(e => e.id === episodeId ? { ...e, [field]: value } : e) } : c) }));
  };

  const deleteEpisode = (chapterId: string, episodeId: string) => {
    if (!confirm("Xóa tập này? Các cảnh thuộc tập này sẽ vẫn tồn tại trong hệ thống.")) return;
    recordHistory();
    setStory(prev => ({ ...prev, chapters: (prev.chapters || []).map(c => c.id === chapterId ? { ...c, episodes: c.episodes.filter(e => e.id !== episodeId) } : c) }));
    if (selectedEpisodeId === episodeId) setSelectedEpisodeId(null);
  };

  const handleSceneImport = () => {
    try {
      if (!selectedEpisodeId) return;
      const parsed = JSON.parse(importJsonText);
      const scenesToImport: Scene[] = Array.isArray(parsed) ? parsed : [parsed];
      
      recordHistory();
      setStory(prev => {
        const newScenes = { ...prev.scenes };
        scenesToImport.forEach((s, index) => {
          if (!s.text) return; 
          const id = (s.id && !newScenes[s.id]) ? s.id : generateId('S_IMP');
          const newScene: Scene = {
            ...s,
            id,
            episodeId: selectedEpisodeId,
            order: (Object.values(newScenes).filter(sc => sc.episodeId === selectedEpisodeId).length) + index
          };
          newScenes[id] = newScene;
        });
        return { ...prev, scenes: newScenes };
      });
      setShowSceneImportModal(false);
      setImportJsonText('');
      setImportError(null);
    } catch (e) {
      setImportError("Mã JSON không hợp lệ.");
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(story, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${story.title.replace(/\s+/g, '_')}_FullProject.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleExportEpisode = (episodeId: string) => {
    const ep = story.chapters?.flatMap(c => c.episodes).find(e => e.id === episodeId);
    if (!ep) return;
    const epScenes = Object.values(story.scenes).filter(s => s.episodeId === episodeId);
    const exportData = { type: 'vn_episode_file', episode: ep, scenes: epScenes };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `Episode_${ep.title.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportStoryFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.id && (parsed.scenes || parsed.chapters)) {
           recordHistory();
           setStory(parsed);
           alert("Đã nhập cốt truyện thành công!");
           setViewMode('structure');
        } else {
           alert("File không đúng định dạng VN Story Project.");
        }
      } catch (err) {
        alert("Lỗi khi đọc file JSON.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-900 text-gray-100 font-sans">
      {/* HEADER */}
      <div className="bg-gray-800 border-b border-gray-700 p-3 flex justify-between items-center z-20 shadow-md">
        <div className="flex items-center gap-4">
          <button onClick={onExit} className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-all"><ArrowLeft size={20} /></button>
          <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Dự án Visual Novel</span>
              <input value={story.title} onChange={(e) => updateStoryInfo('title', e.target.value)} className="bg-transparent border-none focus:ring-0 text-white font-bold text-lg p-0 w-64 placeholder-gray-600" />
          </div>
        </div>
        
        <div className="flex gap-2 items-center">
          <div className="flex bg-gray-900/50 rounded-lg p-1 mr-4 border border-gray-700">
             <button onClick={handleUndo} disabled={historyStack.length === 0} className="p-1.5 rounded hover:bg-gray-700 text-gray-400 disabled:opacity-20 transition-all"><Undo size={18} /></button>
             <button onClick={handleRedo} disabled={redoStack.length === 0} className="p-1.5 rounded hover:bg-gray-700 text-gray-400 disabled:opacity-20 transition-all"><Redo size={18} /></button>
          </div>
          <button onClick={handleExportJSON} className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium text-gray-200" title="Xuất toàn bộ Project"><Package size={16} /> Xuất Project</button>
          <button onClick={handleSaveToServer} disabled={isSaving} className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded text-sm font-medium text-white transition-all shadow-lg shadow-green-900/20">{isSaving ? <Loader2 size={16} className="animate-spin"/> : <CloudUpload size={16} />} Lưu Server</button>
          <button onClick={() => onPlay(story, selectedSceneId || undefined)} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium shadow-lg shadow-blue-900/20"><Play size={16} /> Chơi Thử</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <div className="w-72 bg-gray-900 border-r border-gray-700 flex flex-col">
           <div className="p-3 bg-gray-800/50 border-b border-gray-700 font-semibold text-xs text-gray-400 uppercase tracking-wider flex justify-between items-center">
               Cấu trúc dự án <button onClick={() => setViewMode('structure')} className="p-1 hover:bg-gray-700 rounded text-blue-400"><Edit3 size={14} /></button>
           </div>
           <div className="flex-1 overflow-y-auto p-2 space-y-1">
               {story.chapters?.map((chap) => (
                   <div key={chap.id} className="mb-1">
                       <button onClick={() => { setExpandedChapters(prev => { const n = new Set(prev); if(n.has(chap.id)) n.delete(chap.id); else n.add(chap.id); return n; }) }} className="w-full flex items-center gap-2 p-2 text-left hover:bg-gray-800 rounded transition-colors text-gray-300">
                           {expandedChapters.has(chap.id) ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                           <span className="font-bold text-sm truncate flex-1">{chap.title}</span>
                       </button>
                       {expandedChapters.has(chap.id) && (
                           <div className="ml-4 border-l border-gray-700 pl-2 mt-1 space-y-1">
                               {chap.episodes.map((ep) => (
                                   <button key={ep.id} onClick={() => handleSelectEpisode(ep.id)} className={`w-full flex items-center gap-2 p-1.5 text-left text-sm rounded ${selectedEpisodeId === ep.id ? 'bg-blue-900/30 text-blue-300' : 'text-gray-400 hover:bg-gray-800'}`}>
                                       <File size={12} /><span className="truncate">{ep.title}</span>
                                   </button>
                               ))}
                           </div>
                       )}
                   </div>
               ))}
           </div>
           <div className="p-3 border-t border-gray-700 space-y-2">
               <button onClick={() => setViewMode('structure')} className={`w-full flex items-center gap-3 p-2 rounded text-sm font-medium transition-colors ${viewMode === 'structure' ? 'bg-purple-900/30 text-purple-300 border border-purple-500/20' : 'text-gray-400 hover:bg-gray-800'}`}><Layers size={16} /> Quản lý Tập</button>
               <button onClick={() => setViewMode('glossary')} className={`w-full flex items-center gap-3 p-2 rounded text-sm font-medium transition-colors ${viewMode === 'glossary' ? 'bg-yellow-900/20 text-yellow-500 border border-yellow-500/20' : 'text-gray-400 hover:bg-gray-800'}`}><Book size={16} /> Từ điển thuật ngữ</button>
               <button onClick={() => setViewMode('graph')} className={`w-full flex items-center gap-3 p-2 rounded text-sm font-medium transition-colors ${viewMode === 'graph' ? 'bg-green-900/20 text-green-300 border border-green-500/20' : 'text-gray-400 hover:bg-gray-800'}`}><GitBranch size={16} /> Cây Cốt Truyện</button>
               <button onClick={() => setViewMode('settings')} className={`w-full flex items-center gap-3 p-2 rounded text-sm font-medium transition-colors ${viewMode === 'settings' ? 'bg-gray-700 text-white border border-gray-600' : 'text-gray-400 hover:bg-gray-800'}`}><Settings size={16} /> Thiết lập dự án</button>
           </div>
        </div>

        {/* MAIN PANEL */}
        <div className="flex-1 flex overflow-hidden bg-gray-900 relative">
            {viewMode === 'editor' ? (
                selectedEpisodeId ? (
                    <>
                        <div className="w-64 bg-gray-800/30 border-r border-gray-700 flex flex-col">
                            <div className="p-3 border-b border-gray-700 bg-gray-800/50 flex justify-between items-center">
                                <div>
                                    <h3 className="text-[10px] font-bold text-gray-500 uppercase">Danh sách cảnh</h3>
                                    <div className="text-blue-300 font-bold truncate text-sm max-w-[140px]">{currentEpisode?.title}</div>
                                </div>
                                <button onClick={() => setShowSceneImportModal(true)} title="Import cảnh (JSON)" className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-blue-400 transition-colors">
                                    <FileJson size={16} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                {episodeScenes.map((scene) => (
                                    <button key={scene.id} onClick={() => setSelectedSceneId(scene.id)} className={`w-full text-left p-3 border rounded-md mb-1 transition-all ${selectedSceneId === scene.id ? 'bg-blue-600/20 border-blue-500/50 text-white shadow-lg' : 'bg-transparent border-transparent text-gray-400 hover:bg-gray-800'}`}>
                                        <div className="text-[9px] font-mono opacity-40 mb-1">{scene.id}</div>
                                        <div className="text-xs line-clamp-2 leading-snug">{scene.text || "..."}</div>
                                    </button>
                                ))}
                                <button onClick={addScene} className="w-full py-3 mt-2 border border-dashed border-gray-700 text-gray-500 hover:text-blue-400 hover:border-blue-500/50 rounded-lg text-xs flex items-center justify-center gap-2 transition-all"><Plus size={14}/> THÊM CẢNH</button>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-gray-900 custom-scrollbar">
                            {selectedSceneId ? (
                                <div className="max-w-4xl mx-auto space-y-8 pb-32">
                                    <div className="flex justify-between items-center pb-4 border-b border-gray-800">
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col">
                                                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest">ID CẢNH</label>
                                                <input className="bg-gray-800 text-blue-400 px-2 py-1 rounded text-xs font-mono border border-transparent focus:border-blue-500 focus:ring-0" value={currentScene.id} onChange={(e) => {
                                                    const newId = e.target.value.replace(/\s+/g, '_').toUpperCase();
                                                    const oldId = currentScene.id;
                                                    setStory(prev => {
                                                        const newScenes = { ...prev.scenes };
                                                        const scene = { ...newScenes[oldId], id: newId };
                                                        delete newScenes[oldId];
                                                        newScenes[newId] = scene;
                                                        return { ...prev, scenes: newScenes };
                                                    });
                                                    setSelectedSceneId(newId);
                                                }} />
                                            </div>
                                            <div className="h-8 w-px bg-gray-700 mx-2"></div>
                                            <button onClick={() => setShowCopyModal(true)} className="flex items-center gap-2 text-xs text-gray-400 hover:text-blue-400 transition-colors px-3 py-1.5 bg-white/5 rounded-lg border border-white/5 hover:border-blue-500/30"><ClipboardCopy size={16}/> Sao chép thuộc tính</button>
                                            <button onClick={() => setShowNote(!showNote)} className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border transition-all ${showNote ? 'bg-blue-600 text-white border-blue-500' : 'text-gray-400 hover:text-blue-400 bg-white/5 border-white/5'}`}>
                                                <StickyNote size={16}/> {showNote ? 'Đóng Ghi chú' : 'Thêm Ghi chú'}
                                            </button>
                                        </div>
                                        <button onClick={() => { if(confirm("Xóa cảnh?")) { recordHistory(); setStory(prev => { const s = {...prev.scenes}; delete s[selectedSceneId]; return {...prev, scenes: s}; }); setSelectedSceneId(null); } }} className="p-2 text-red-500 hover:bg-red-900/20 rounded transition-all"><Trash2 size={18}/></button>
                                    </div>

                                    {showNote && (
                                        <div className="bg-blue-900/10 border border-blue-500/30 rounded-xl p-5 space-y-3 shadow-lg shadow-blue-900/10 animate-in slide-in-from-top-2">
                                            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-widest"><StickyNote size={14}/> Ghi chú nội bộ</div>
                                            <textarea className="w-full bg-black/40 border border-blue-500/20 rounded-lg p-3 text-sm text-blue-100/70 focus:border-blue-500/50 focus:ring-0 h-20 resize-none leading-relaxed" placeholder="Ghi chú về logic, nhân vật cho cảnh này..." value={currentScene.note || ''} onChange={(e) => updateScene('note', e.target.value)} />
                                        </div>
                                    )}

                                    <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-5 space-y-4 shadow-lg shadow-black/20">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-sm font-bold text-orange-400 flex items-center gap-2 uppercase tracking-wide"><User size={16}/> Chân dung nhân vật</h4>
                                            <button onClick={addCharacterSprite} className="text-[10px] bg-orange-600/20 text-orange-400 px-2 py-1 rounded hover:bg-orange-600 hover:text-white flex items-center gap-1 transition-all"><Plus size={12}/> Thêm chân dung</button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {currentCharacters.map((char, cidx) => (
                                                <div key={cidx} className="bg-black/20 p-4 rounded-lg border border-gray-700/50 space-y-3 relative group">
                                                    <button onClick={() => removeCharacterSprite(cidx)} className="absolute top-2 right-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><X size={14}/></button>
                                                    <div className="flex gap-2">
                                                        <div className="flex-1">
                                                            <label className="block text-[9px] text-gray-500 uppercase font-bold mb-1">Tên khớp hội thoại</label>
                                                            <input className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-orange-300 font-bold" placeholder="VD: Joe" value={char.name || ''} onChange={(e) => updateCharacterSprite(cidx, 'name', e.target.value)} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <label className="block text-[9px] text-gray-500 uppercase font-bold mb-1">Vị trí</label>
                                                            <select className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-white" value={char.position} onChange={(e) => updateCharacterSprite(cidx, 'position', e.target.value as any)}>
                                                                <option value="left">Trái</option>
                                                                <option value="center">Giữa</option>
                                                                <option value="right">Phải</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[9px] text-gray-500 uppercase font-bold mb-1">Ảnh (URL)</label>
                                                        <input className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs" value={char.image} onChange={(e) => updateCharacterSprite(cidx, 'image', e.target.value)} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-5 space-y-4 shadow-lg shadow-black/20">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-sm font-bold text-blue-400 flex items-center gap-2 uppercase tracking-wide"><MessageSquare size={16}/> Nội dung hội thoại</h4>
                                        </div>
                                        <div className="space-y-4">
                                            {dialogues.map((d, idx) => (
                                                <div key={idx} className="flex gap-3 items-start bg-black/20 p-4 rounded-lg border border-gray-700/50 group">
                                                    <div className="flex-1 space-y-3">
                                                        <div className="flex gap-4">
                                                            <div className="flex-1">
                                                                <label className="block text-[9px] text-gray-500 uppercase font-bold mb-1">Người nói</label>
                                                                <input className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-blue-300 font-bold" value={d.characterName || ''} onChange={(e) => updateDialogueLine(idx, 'characterName', e.target.value)} />
                                                            </div>
                                                            <div className="flex-1">
                                                                <label className="block text-[9px] text-gray-500 uppercase font-bold mb-1">Âm thanh thoại (URL)</label>
                                                                <div className="flex gap-2">
                                                                    <input className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs" value={d.voice || ''} onChange={(e) => updateDialogueLine(idx, 'voice', e.target.value)} />
                                                                    <button onClick={() => playPreview(d.voice)} className="p-1 text-blue-500 hover:text-blue-400"><PlayCircle size={18}/></button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="relative">
                                                            <div className="flex gap-1 mb-1 bg-gray-800/50 p-1 rounded-t border-t border-x border-gray-700">
                                                                <button onClick={() => wrapText('b')} className="p-1 hover:bg-gray-700 rounded text-gray-300 transition-colors" title="Đậm"><Bold size={14}/></button>
                                                                <button onClick={() => wrapText('i')} className="p-1 hover:bg-gray-700 rounded text-gray-300 transition-colors" title="Nghiêng"><Italic size={14}/></button>
                                                                <div className="w-px h-4 bg-gray-700 mx-1"></div>
                                                                <button onClick={() => wrapText('span', '#3b82f6')} className="p-1 hover:bg-gray-700 rounded text-blue-400 transition-colors" title="Màu xanh"><Palette size={14}/></button>
                                                                <button onClick={() => wrapText('span', '#ef4444')} className="p-1 hover:bg-gray-700 rounded text-red-400 transition-colors" title="Màu đỏ"><Palette size={14}/></button>
                                                                <div className="w-px h-4 bg-gray-700 mx-1"></div>
                                                                <button onClick={() => { activeTextAreaRef.current = document.querySelector(`textarea[data-idx="${idx}"]`); setShowTermPickerModal(true); }} className="p-1 hover:bg-gray-700 rounded text-yellow-500 transition-colors" title="Chèn thuật ngữ"><Book size={14}/></button>
                                                            </div>
                                                            <textarea data-idx={idx} ref={(el) => { if(el && activeTextAreaRef.current === null) activeTextAreaRef.current = el; }} onFocus={(e) => { activeTextAreaRef.current = e.currentTarget; }} className="w-full bg-gray-900 border border-gray-700 rounded-b p-2 text-sm text-white focus:border-blue-500/50 focus:ring-0 h-24 resize-none leading-relaxed custom-scrollbar" value={d.text} onChange={(e) => updateDialogueLine(idx, 'text', e.target.value)} />
                                                        </div>
                                                    </div>
                                                    <button onClick={() => deleteDialogueLine(idx)} className="text-gray-600 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all mt-6"><Trash2 size={16} /></button>
                                                </div>
                                            ))}
                                            <button onClick={addDialogueLine} className="w-full py-3 border border-dashed border-gray-700 text-gray-500 hover:text-blue-400 hover:border-blue-500/50 rounded text-sm flex items-center justify-center gap-2 transition-all"><Plus size={16} /> Thêm đoạn hội thoại</button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-5 space-y-4 shadow-lg shadow-black/20">
                                            <h4 className="text-sm font-bold text-orange-400 flex items-center gap-2 uppercase tracking-wide"><ImageIcon size={16}/> Bối cảnh hình ảnh</h4>
                                            <div>
                                                <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">URL Ảnh nền</label>
                                                <input className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-200" value={currentScene.backgroundImage || ''} onChange={(e) => updateScene('backgroundImage', e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-5 space-y-4 shadow-lg shadow-black/20">
                                            <h4 className="text-sm font-bold text-green-400 flex items-center gap-2 uppercase tracking-wide"><Music size={16}/> Âm thanh cảnh</h4>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Nhạc nền (BGM URL)</label>
                                                    <div className="flex gap-2">
                                                        <input className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-xs" value={currentScene.bgm || ''} onChange={(e) => updateScene('bgm', e.target.value)} />
                                                        <button onClick={() => playPreview(currentScene.bgm)} className="p-1 text-green-500 hover:text-green-400"><PlayCircle size={18}/></button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Hiệu ứng (SFX URL)</label>
                                                    <div className="flex gap-2">
                                                        <input className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-xs" value={currentScene.sfx || ''} onChange={(e) => updateScene('sfx', e.target.value)} />
                                                        <button onClick={() => playPreview(currentScene.sfx)} className="p-1 text-green-500 hover:text-green-400"><PlayCircle size={18}/></button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-800/60 border border-purple-500/30 rounded-2xl p-6 space-y-4 shadow-2xl border-t-4">
                                        <h4 className="text-sm font-bold text-purple-400 flex items-center gap-2 uppercase tracking-widest"><GitBranch size={16}/> Luồng & Lựa chọn</h4>
                                        <div className="grid grid-cols-1 gap-6">
                                            <div className="bg-black/30 p-5 rounded-xl border border-gray-700/50">
                                                <label className="block text-[10px] text-gray-500 uppercase font-bold mb-3">Chuyển cảnh mặc định</label>
                                                <div className="flex items-center gap-3">
                                                    <ArrowRight size={20} className="text-purple-500"/>
                                                    <select className="flex-1 bg-gray-900 border-gray-700 rounded-lg text-sm py-2 px-3 text-white focus:ring-1 focus:ring-purple-500" value={currentScene.nextSceneId || ''} onChange={(e) => updateScene('nextSceneId', e.target.value)}>
                                                        <option value="">-- Tự động tiếp --</option>
                                                        <option value="__EXIT__">KẾT THÚC</option>
                                                        {Object.keys(story.scenes).filter(id => id !== selectedSceneId).map(id => <option key={id} value={id}>{id}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center"><label className="text-[10px] text-gray-500 uppercase font-bold">Lựa chọn rẽ nhánh</label><button onClick={addChoice} className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"><Plus size={14}/> THÊM LỰA CHỌN</button></div>
                                                <div className="space-y-3">
                                                    {(currentScene.choices || []).map((choice, cidx) => (
                                                        <div key={cidx} className="bg-gray-900/80 p-4 rounded-xl border border-gray-700 shadow-sm flex flex-col gap-3">
                                                            <div className="flex gap-3">
                                                                <div className="flex-1">
                                                                    <label className="block text-[9px] text-gray-600 uppercase font-bold mb-1">Văn bản nút</label>
                                                                    <input className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500" value={choice.text} onChange={(e) => updateChoice(cidx, 'text', e.target.value)} />
                                                                </div>
                                                                <div className="w-48">
                                                                    <label className="block text-[9px] text-gray-600 uppercase font-bold mb-1">Dẫn tới</label>
                                                                    <select className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-blue-400 font-mono" value={choice.nextSceneId} onChange={(e) => updateChoice(cidx, 'nextSceneId', e.target.value)}>
                                                                        <option value="">Chọn cảnh...</option>
                                                                        <option value="__EXIT__">Kết thúc</option>
                                                                        {Object.keys(story.scenes).map(id => <option key={id} value={id}>{id}</option>)}
                                                                    </select>
                                                                </div>
                                                                <button onClick={() => deleteChoice(cidx)} className="mt-6 text-gray-600 hover:text-red-500 p-2"><Trash2 size={18}/></button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4">
                                    <Sparkles size={48} className="opacity-20" />
                                    <div className="text-sm font-bold uppercase tracking-widest opacity-40">Chọn một cảnh để chỉnh sửa</div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center text-gray-600 space-y-4">
                        <Layers size={48} className="opacity-20" />
                        <div className="text-sm font-bold uppercase tracking-widest opacity-40">Chọn một Tập từ menu bên trái để bắt đầu biên tập cảnh</div>
                    </div>
                )
            ) : viewMode === 'glossary' ? (
                <div className="flex-1 p-8 overflow-y-auto bg-gray-900 custom-scrollbar">
                    <div className="max-w-4xl mx-auto space-y-8 pb-20">
                        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl"><Book size={24}/></div>
                                <div><h2 className="text-2xl font-bold text-white">Từ điển thuật ngữ</h2><p className="text-sm text-gray-500">Định nghĩa các từ khóa quan trọng.</p></div>
                            </div>
                            <button onClick={addGlossaryEntry} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold flex items-center gap-2"><Plus size={18}/> THÊM THUẬT NGỮ</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Object.values(story.glossary || {}).map((entry) => (
                                <div key={entry.id} className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 space-y-4 hover:border-blue-500/30 transition-all group">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">{entry.id}</span>
                                        <button onClick={() => deleteGlossaryEntry(entry.id)} className="p-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                                    </div>
                                    <div className="space-y-4">
                                        <div><label className="block text-[10px] text-gray-500 uppercase font-black mb-1">Thuật ngữ</label><input className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-white text-sm font-bold focus:border-blue-500" value={entry.term} onChange={(e) => updateGlossaryEntry(entry.id, 'term', e.target.value)} /></div>
                                        <div><label className="block text-[10px] text-gray-500 uppercase font-black mb-1">Giải nghĩa</label><textarea className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-gray-300 text-xs h-24 resize-none focus:border-blue-500" value={entry.definition} onChange={(e) => updateGlossaryEntry(entry.id, 'definition', e.target.value)} /></div>
                                    </div>
                                </div>
                            ))}
                            {Object.keys(story.glossary || {}).length === 0 && (
                                <div className="col-span-full py-20 text-center bg-black/20 border border-dashed border-gray-800 rounded-3xl opacity-40"><Info size={48} className="mx-auto mb-4"/><p className="text-gray-600 italic">Chưa có thuật ngữ nào được định nghĩa.</p></div>
                            )}
                        </div>
                    </div>
                </div>
            ) : viewMode === 'graph' ? (
                <div className="flex-1 flex flex-col bg-neutral-950">
                    <StoryGraph story={story} currentEpisodeId={currentEpisode?.id} onSceneClick={(id) => { handleSelectEpisode(story.scenes[id]?.episodeId || ''); setSelectedSceneId(id); setViewMode('editor'); }} onSceneUpdate={(up) => { recordHistory(); setStory(prev => ({ ...prev, scenes: { ...prev.scenes, ...up } })); }} onSceneConnect={(s, t, c) => { recordHistory(); const source = story.scenes[s]; if (c !== undefined) { const nc = [...source.choices]; nc[c] = { ...nc[c], nextSceneId: t }; updateScene('choices', nc); } else { updateScene('nextSceneId', t); } }} />
                </div>
            ) : viewMode === 'structure' ? (
                <div className="flex-1 p-8 overflow-y-auto bg-gray-900 custom-scrollbar">
                    <div className="max-w-4xl mx-auto space-y-8 pb-20">
                        <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-10 text-center flex flex-col items-center gap-6 shadow-2xl">
                             <div className="w-20 h-20 bg-blue-600/20 rounded-3xl flex items-center justify-center text-blue-500 shadow-xl"><Layers size={40} /></div>
                             <h2 className="text-2xl font-bold text-white">Quản lý Chương & Tập phim</h2>
                             <button onClick={addChapter} className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold flex items-center gap-2 transition-all active:scale-95 shadow-xl shadow-blue-900/40"><Plus size={20} /> CHƯƠNG MỚI</button>
                        </div>
                        <div className="space-y-6">
                            {(story.chapters || []).map((chap) => (
                                <div key={chap.id} className="bg-gray-800/40 border border-gray-700 rounded-2xl p-6 space-y-4 hover:bg-gray-800/60 transition-all">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 space-y-2">
                                            <input className="w-full bg-transparent border-none text-xl font-bold text-white focus:ring-0 p-0" value={chap.title} onChange={(e) => updateChapterData(chap.id, 'title', e.target.value)} />
                                            <textarea className="w-full bg-transparent border-none text-sm text-gray-400 focus:ring-0 p-0 resize-none h-10" placeholder="Mô tả ngắn..." value={chap.description || ''} onChange={(e) => updateChapterData(chap.id, 'description', e.target.value)} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => addEpisode(chap.id)} className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><Plus size={18}/></button>
                                            <button onClick={() => deleteChapter(chap.id)} className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600 hover:text-white transition-all"><Trash2 size={18}/></button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        {chap.episodes.map((ep) => (
                                            <div key={ep.id} className="bg-black/20 border border-gray-700 rounded-xl p-4 flex gap-4 group hover:border-blue-500/50 transition-all">
                                                <div className="w-16 h-16 bg-gray-900 rounded-lg flex items-center justify-center border border-gray-700 overflow-hidden shadow-inner shrink-0">
                                                    {ep.thumbnail ? <img src={ep.thumbnail} className="w-full h-full object-cover" /> : <File size={24} className="text-gray-700"/>}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <input className="w-full bg-transparent border-none text-sm font-bold text-gray-200 focus:ring-0 p-0" value={ep.title} onChange={(e) => updateEpisodeData(chap.id, ep.id, 'title', e.target.value)} />
                                                    <div className="flex items-center gap-3 mt-2">
                                                        <button onClick={() => handleSelectEpisode(ep.id)} className="text-[10px] font-bold text-blue-500 hover:text-blue-400 uppercase tracking-widest transition-colors flex items-center gap-1"><Edit3 size={12}/> Biên tập</button>
                                                        <button onClick={() => handleExportEpisode(ep.id)} className="text-[10px] font-bold text-green-500 hover:text-green-400 uppercase tracking-widest flex items-center gap-1"><Download size={12}/> Export</button>
                                                        <button onClick={() => deleteEpisode(chap.id, ep.id)} className="text-[10px] font-bold text-gray-600 hover:text-red-500 uppercase tracking-widest ml-auto opacity-0 group-hover:opacity-100 transition-all">Xóa</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 p-8 overflow-y-auto flex items-start justify-center bg-gray-950 custom-scrollbar">
                    <div className="max-w-2xl w-full bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-6 shadow-2xl">
                        <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2 uppercase tracking-widest"><Settings size={20} className="text-blue-500"/> Thiết lập dự án</h2>
                            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs font-bold text-blue-400 transition-all border border-gray-700"><FileUp size={14}/> Import Project File</button>
                            <input type="file" ref={fileInputRef} onChange={handleImportStoryFile} className="hidden" accept=".json" />
                        </div>
                        <div className="space-y-6">
                            <div><label className="block text-[10px] text-gray-500 uppercase font-black mb-1 tracking-wider">Tiêu đề chính</label><input className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 transition-all" value={story.title} onChange={(e) => updateStoryInfo('title', e.target.value)} /></div>
                            <div><label className="block text-[10px] text-gray-500 uppercase font-black mb-1 tracking-wider">Tác giả</label><input className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 transition-all" value={story.author || ''} onChange={(e) => updateStoryInfo('author', e.target.value)} /></div>
                            <div><label className="block text-[10px] text-gray-500 uppercase font-black mb-1 tracking-wider">Mô tả</label><textarea className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white h-32 resize-none focus:border-blue-500 transition-all" value={story.description || ''} onChange={(e) => updateStoryInfo('description', e.target.value)} /></div>
                            <div><label className="block text-[10px] text-gray-500 uppercase font-black mb-1 tracking-wider">URL Ảnh bìa</label><input className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-xs focus:border-blue-500 transition-all" value={story.thumbnail || ''} onChange={(e) => updateStoryInfo('thumbnail', e.target.value)} /></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* MODALS */}
      {showTermPickerModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
              <div className="bg-gray-900 border border-gray-700 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
                  <div className="p-6 border-b border-gray-700 flex justify-between items-center"><h3 className="font-bold text-lg text-white flex items-center gap-2"><Book size={20} className="text-yellow-500"/> Chèn thuật ngữ</h3><button onClick={() => setShowTermPickerModal(false)} className="text-gray-400 hover:text-white"><X size={24}/></button></div>
                  <div className="p-6 overflow-y-auto space-y-2 custom-scrollbar">
                      <p className="text-xs text-gray-500 mb-4 italic">Bôi đen văn bản rồi chọn thuật ngữ tương ứng.</p>
                      {Object.values(story.glossary || {}).map(entry => (
                          <button key={entry.id} onClick={() => handleTermPickerSelect(entry.id)} className="w-full text-left p-3 rounded-xl border border-gray-800 bg-gray-800/30 hover:bg-yellow-600/10 hover:border-yellow-500 transition-all group flex items-center justify-between">
                              <div><div className="text-sm font-bold text-gray-100 group-hover:text-yellow-500">{entry.term}</div><div className="text-[10px] text-gray-500 line-clamp-1">{entry.definition}</div></div>
                              <PlusCircle size={18} className="text-gray-700 group-hover:text-yellow-500 transition-colors"/>
                          </button>
                      ))}
                      {Object.keys(story.glossary || {}).length === 0 && (
                          <div className="text-center py-10"><p className="text-sm text-gray-500 mb-4">Chưa có thuật ngữ nào.</p><button onClick={() => { setViewMode('glossary'); setShowTermPickerModal(false); }} className="text-xs font-bold text-blue-400 hover:underline uppercase">Đến quản lý từ điển</button></div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {showCopyModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
              <div className="bg-gray-900 border border-gray-700 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
                  <div className="p-6 border-b border-gray-700 flex justify-between items-center"><h3 className="font-bold text-lg text-white flex items-center gap-2"><ClipboardCopy size={20} className="text-blue-500"/> Chọn cảnh nguồn</h3><button onClick={() => setShowCopyModal(false)} className="text-gray-400 hover:text-white"><X size={24}/></button></div>
                  <div className="p-6 overflow-y-auto space-y-2 custom-scrollbar">
                      {Object.keys(story.scenes).filter(id => id !== selectedSceneId).map(id => (
                          <button key={id} onClick={() => copyAttributesFrom(id)} className="w-full text-left p-3 rounded-xl border border-gray-800 bg-gray-800/30 hover:bg-blue-600/10 hover:border-blue-500 transition-all group">
                              <div className="text-[10px] font-mono text-gray-600 group-hover:text-blue-400 mb-1">{id}</div>
                              <div className="text-sm font-medium text-gray-300 group-hover:text-white line-clamp-1">{story.scenes[id].text}</div>
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {showSceneImportModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
              <div className="bg-gray-900 border border-gray-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b border-gray-700 flex justify-between items-center"><h3 className="font-bold text-lg text-white flex items-center gap-2"><FileJson size={20} className="text-blue-500"/> Import Cảnh (JSON)</h3><button onClick={() => { setShowSceneImportModal(false); setImportError(null); }} className="text-gray-400 hover:text-white"><X size={24}/></button></div>
                  <div className="p-6 overflow-hidden flex flex-col gap-4">
                      <p className="text-xs text-gray-500">Dán mảng JSON các cảnh vào đây.</p>
                      <textarea className="flex-1 w-full bg-gray-950 border border-gray-700 rounded-lg p-4 font-mono text-xs text-green-400 focus:ring-1 focus:ring-blue-500 resize-none outline-none min-h-[300px]" placeholder='[ { "text": "...", "characterName": "..." }, ... ]' value={importJsonText} onChange={(e) => setImportJsonText(e.target.value)} />
                      {importError && <div className="flex items-center gap-2 text-red-400 bg-red-900/20 p-3 rounded-lg text-xs border border-red-500/30"><AlertCircle size={14}/> {importError}</div>}
                  </div>
                  <div className="p-6 border-t border-gray-700 flex justify-end gap-3"><button onClick={() => { setShowSceneImportModal(false); setImportError(null); }} className="px-4 py-2 rounded-lg text-gray-400 hover:bg-gray-800 transition-colors text-sm font-medium">Hủy</button><button onClick={handleSceneImport} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold shadow-lg flex items-center gap-2"><CheckCircle size={16}/> Xác nhận Import</button></div>
              </div>
          </div>
      )}
    </div>
  );
};

export default StoryEditor;
