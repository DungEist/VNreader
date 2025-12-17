import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, Play, Plus, Trash2, Image as ImageIcon, Music, 
  MessageSquare, User, Layout, Settings, ArrowRight, Download,
  CornerDownRight, ArrowLeft, ChevronRight, Copy, ChevronDown,
  Bold, Italic, Underline, Palette, Layers, List, File, Edit3, FolderOpen, MoreVertical, Book, X, Undo, Redo, Upload, GitBranch, Loader2, CloudUpload
} from 'lucide-react';
import { Story, Scene, Choice, Character, Chapter, Episode, DialogueEntry } from '../types';
import StoryGraph from './StoryGraph';
import { serverSaveStory } from '../utils/mockServer';

interface StoryEditorProps {
  initialStory?: Story;
  onExit: () => void;
  onPlay: (story: Story) => void;
}

const DEFAULT_SCENE: Scene = {
  id: '',
  text: '',
  choices: []
};

// Helper to generate truly unique IDs
const generateId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const StoryEditor: React.FC<StoryEditorProps> = ({ initialStory, onExit, onPlay }) => {
  // --- STATE ---
  const [story, setStory] = useState<Story>(initialStory || {
    id: generateId('story'),
    title: "Cốt truyện mới",
    author: "Tác giả",
    startSceneId: "start",
    scenes: {
      "start": {
        id: "start",
        text: "Xin chào! Đây là cảnh đầu tiên.",
        choices: [],
        dialogues: [{ text: "Xin chào! Đây là cảnh đầu tiên.", characterName: "Hệ thống" }]
      }
    }
  });

  const [isSaving, setIsSaving] = useState(false);

  // History State for Undo/Redo
  const [historyStack, setHistoryStack] = useState<Story[]>([]);
  const [redoStack, setRedoStack] = useState<Story[]>([]);

  // View Mode: Added 'graph'
  const [viewMode, setViewMode] = useState<'editor' | 'structure' | 'settings' | 'graph'>('structure');
  
  // Selection State
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  
  // UI Helpers
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [copySourceId, setCopySourceId] = useState<string>('');
  
  // Ref for the specific textarea currently being edited
  const activeTextAreaRef = useRef<HTMLTextAreaElement | null>(null);

  // Glossary Modal State
  const [glossaryModal, setGlossaryModal] = useState<{
    isOpen: boolean;
    text: string;
    note: string;
    selection: { index: number; start: number; end: number; fullText: string } | null;
  }>({
    isOpen: false,
    text: '',
    note: '',
    selection: null
  });

  // --- INITIALIZATION ---
  useEffect(() => {
    if (story.chapters && story.chapters.length > 0) {
        const firstChap = story.chapters[0];
        setExpandedChapters(new Set([firstChap.id]));
        if (firstChap.episodes.length > 0) {
            const firstEp = firstChap.episodes[0];
            setSelectedChapterId(firstChap.id);
            handleSelectEpisode(firstEp.id);
        } else {
            setViewMode('structure');
        }
    } else {
        setViewMode('structure');
    }
  }, []);

  // --- SERVER ACTIONS ---
  const handleSaveToServer = async () => {
      setIsSaving(true);
      const success = await serverSaveStory(story);
      setIsSaving(false);
      if (success) {
          // Optional: Show toast
      } else {
          alert("Lỗi khi lưu lên Server.");
      }
  };

  // --- UNDO / REDO LOGIC ---
  const recordHistory = () => {
    setHistoryStack(prev => {
        const newHistory = [...prev, story];
        // Limit history size to 30 steps because Base64 images are heavy
        return newHistory.length > 30 ? newHistory.slice(newHistory.length - 30) : newHistory;
    });
    setRedoStack([]); // Clear redo stack on new action
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

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const activeTag = (document.activeElement as HTMLElement)?.tagName;
        const isInputActive = activeTag === 'INPUT' || activeTag === 'TEXTAREA';

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
            if (isInputActive) return; 
            e.preventDefault();
            handleUndo();
        }

        if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') || 
            ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')) {
            if (isInputActive) return; 
            e.preventDefault();
            handleRedo();
        }

        // Ctrl + S to Save
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
            e.preventDefault();
            handleSaveToServer();
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyStack, redoStack, story]);


  // --- ASSET HANDLING (LOCAL FILES) ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, onComplete: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size to prevent browser crash on huge JSONs
    if (file.size > 2 * 1024 * 1024) {
        if(!confirm("File này lớn hơn 2MB. Việc sử dụng file lớn sẽ làm file cốt truyện (JSON) rất nặng và có thể gây lag. Bạn có muốn tiếp tục?")) return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
        if(ev.target?.result) {
            recordHistory(); // Record before applying heavy asset
            onComplete(ev.target.result as string);
        }
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be selected again if needed
    e.target.value = '';
  };


  // --- HELPERS ---
  const currentScene = selectedSceneId ? (story.scenes[selectedSceneId] || DEFAULT_SCENE) : DEFAULT_SCENE;
  const currentChapter = story.chapters?.find(c => c.id === selectedChapterId);
  const currentEpisode = currentChapter?.episodes.find(e => e.id === selectedEpisodeId);
  
  const episodeScenes: Scene[] = selectedEpisodeId 
    ? (Object.values(story.scenes) as Scene[])
        .filter((s) => s.episodeId === selectedEpisodeId)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];

  const updateStoryInfo = (field: keyof Story, value: string) => {
    setStory(prev => ({ ...prev, [field]: value }));
  };

  const handleSelectEpisode = (epId: string) => {
      setSelectedEpisodeId(epId);
      const parentChap = story.chapters?.find(c => c.episodes.some(e => e.id === epId));
      if (parentChap) setSelectedChapterId(parentChap.id);
      const ep = parentChap?.episodes.find(e => e.id === epId);
      if (ep) setSelectedSceneId(ep.startSceneId);
      setViewMode('editor');
  };
  
  const handleSelectSceneFromGraph = (sceneId: string) => {
      // Find which episode this scene belongs to
      const scene = story.scenes[sceneId];
      if (scene && scene.episodeId) {
          handleSelectEpisode(scene.episodeId);
          setSelectedSceneId(sceneId);
          // Switch back to editor to edit
          setViewMode('editor');
      } else {
          // If scene has no episode (legacy), just try to set it
          setSelectedSceneId(sceneId);
          setViewMode('editor');
      }
  };

  // --- GRAPH UPDATES ---
  const handleGraphUpdate = (updatedScenes: Record<string, Scene>) => {
      // Do not record history for every drag frame, might be too intensive.
      // But we should record on mouse up ideally. For now, direct update.
      setStory(prev => ({
          ...prev,
          scenes: { ...prev.scenes, ...updatedScenes }
      }));
  };

  const handleGraphConnect = (sourceId: string, targetId: string, choiceIndex?: number) => {
      recordHistory();
      setStory(prev => {
          const sourceScene = prev.scenes[sourceId];
          if (!sourceScene) return prev;

          // If connecting a specific choice
          if (choiceIndex !== undefined && sourceScene.choices && sourceScene.choices[choiceIndex]) {
             const newChoices = [...sourceScene.choices];
             newChoices[choiceIndex] = { ...newChoices[choiceIndex], nextSceneId: targetId };
             return {
                 ...prev,
                 scenes: {
                     ...prev.scenes,
                     [sourceId]: { ...sourceScene, choices: newChoices }
                 }
             };
          }

          // If source has no choices, set nextSceneId (Linear)
          if (!sourceScene.choices || sourceScene.choices.length === 0) {
              return {
                  ...prev,
                  scenes: {
                      ...prev.scenes,
                      [sourceId]: { ...sourceScene, nextSceneId: targetId }
                  }
              };
          } else {
              // Fallback: If connecting node-to-node but choices exist, append a new choice
              const newChoices = [...sourceScene.choices, { text: "Next", nextSceneId: targetId }];
              return {
                 ...prev,
                 scenes: {
                     ...prev.scenes,
                     [sourceId]: { ...sourceScene, choices: newChoices }
                 }
              };
          }
      });
  };

  const toggleChapterExpand = (chapId: string) => {
      const newSet = new Set(expandedChapters);
      if (newSet.has(chapId)) newSet.delete(chapId);
      else newSet.add(chapId);
      setExpandedChapters(newSet);
  };

  // --- SCENE CRUD ---
  const addChapter = () => {
    recordHistory();
    const newChapter: Chapter = { id: generateId('chap'), title: `Chương Mới`, episodes: [] };
    setStory(prev => ({ ...prev, chapters: [...(prev.chapters || []), newChapter] }));
    setExpandedChapters(prev => new Set(prev).add(newChapter.id));
  };

  const deleteChapter = (chapterId: string) => {
    if (window.confirm("Xóa chương này sẽ xóa tất cả các tập bên trong. Bạn chắc chứ?")) {
        recordHistory();
        setStory(prev => {
            const currentChapters = prev.chapters || [];
            return {
                ...prev,
                chapters: currentChapters.filter(c => String(c.id).trim() !== String(chapterId).trim())
            };
        });
        if (selectedChapterId === chapterId) {
            setSelectedChapterId(null);
            setSelectedEpisodeId(null);
            setViewMode('structure');
        }
    }
  };

  const updateChapter = (chapterId: string, field: keyof Chapter, value: string) => {
    setStory(prev => ({ ...prev, chapters: (prev.chapters || []).map(c => c.id === chapterId ? { ...c, [field]: value } : c) }));
  };

  const addEpisode = (chapterId: string) => {
    recordHistory();
    const episodeId = generateId('ep');
    const startSceneId = `scene_${episodeId}_start`;
    const startScene: Scene = { id: startSceneId, text: `Bắt đầu tập mới...`, choices: [], episodeId: episodeId, dialogues: [{ text: "Bắt đầu tập mới...", characterName: "" }] };
    const newEpisode: Episode = { id: episodeId, title: "Tập Mới", startSceneId: startSceneId };
    setStory(prev => {
        const updatedScenes = { ...prev.scenes, [startSceneId]: startScene };
        const updatedChapters = (prev.chapters || []).map(c => c.id === chapterId ? { ...c, episodes: [...c.episodes, newEpisode] } : c);
        return { ...prev, scenes: updatedScenes, chapters: updatedChapters };
    });
    setExpandedChapters(prev => new Set(prev).add(chapterId));
    setTimeout(() => handleSelectEpisode(episodeId), 50);
  };

  const deleteEpisode = (chapterId: string, episodeId: string) => {
    if (window.confirm("Xóa tập này?")) {
        recordHistory();
        setStory(prev => ({
            ...prev,
            chapters: (prev.chapters || []).map(c => 
                String(c.id).trim() === String(chapterId).trim()
                    ? { ...c, episodes: c.episodes.filter(e => String(e.id).trim() !== String(episodeId).trim()) } 
                    : c
            )
        }));
        if (selectedEpisodeId === episodeId) {
            setSelectedEpisodeId(null);
            setSelectedSceneId(null);
            setViewMode('structure');
        }
    }
  };

  const updateEpisode = (chapterId: string, episodeId: string, field: keyof Episode, value: string) => {
    setStory(prev => ({ ...prev, chapters: (prev.chapters || []).map(c => c.id === chapterId ? { ...c, episodes: c.episodes.map(e => e.id === episodeId ? { ...e, [field]: value } : e) } : c) }));
  };

  const addScene = () => {
    if (!selectedEpisodeId) { alert("Vui lòng chọn một tập trước khi thêm cảnh."); return; }
    recordHistory();
    const newId = generateId('scene');
    const currentOrder = episodeScenes.length;
    // New scene gets position relative to previous or default
    const prevScene = episodeScenes[episodeScenes.length - 1];
    const newX = prevScene && prevScene.x ? prevScene.x + 300 : 100;
    const newY = prevScene && prevScene.y ? prevScene.y : 100;

    const newScene: Scene = { 
        id: newId, 
        text: "...", 
        choices: [], 
        episodeId: selectedEpisodeId, 
        dialogues: [{ text: "...", characterName: "" }], 
        order: currentOrder,
        x: newX,
        y: newY
    };
    setStory(prev => {
      const updatedScenes = { ...prev.scenes, [newId]: newScene };
      if (selectedSceneId) {
          const current = prev.scenes[selectedSceneId];
          if (current && current.choices.length === 0 && !current.nextSceneId && current.episodeId === selectedEpisodeId) { updatedScenes[selectedSceneId] = { ...current, nextSceneId: newId }; }
      }
      return { ...prev, scenes: updatedScenes };
    });
    setSelectedSceneId(newId); setCopySourceId(selectedSceneId || ''); 
  };

  const deleteScene = (id: string) => {
     if (currentEpisode && currentEpisode.startSceneId === id) { alert("Không thể xóa cảnh bắt đầu của tập."); return; }
     if (!confirm("Xóa cảnh này?")) return;
     recordHistory();
     setStory(prev => { 
        const newScenes = { ...prev.scenes }; 
        delete newScenes[id]; 
        return { ...prev, scenes: newScenes }; 
     });
    const otherScene = episodeScenes.find(s => s.id !== id);
    if (otherScene) setSelectedSceneId(otherScene.id); else setSelectedSceneId(null);
  };
  const updateScene = (field: keyof Scene, value: any) => {
    if (!selectedSceneId) return;
    setStory(prev => ({ ...prev, scenes: { ...prev.scenes, [selectedSceneId]: { ...prev.scenes[selectedSceneId], [field]: value } } }));
  };

  // --- DIALOGUES ---
  const getDialogues = () => {
      if (currentScene.dialogues && currentScene.dialogues.length > 0) return currentScene.dialogues;
      return [{ text: currentScene.text, characterName: currentScene.characterName }];
  };
  const dialogues = getDialogues();
  const addDialogueLine = () => { 
      recordHistory();
      updateScene('dialogues', [...dialogues, { text: '...', characterName: currentScene.characterName }]); 
  };
  const updateDialogueLine = (index: number, field: keyof DialogueEntry, value: string) => {
    const newDialogues = [...dialogues];
    newDialogues[index] = { ...newDialogues[index], [field]: value };
    setStory(prev => {
        if (!selectedSceneId) return prev;
        const updatedScene = { ...prev.scenes[selectedSceneId], dialogues: newDialogues };
        if (index === 0) { if (field === 'text') updatedScene.text = value; if (field === 'characterName') updatedScene.characterName = value; }
        return { ...prev, scenes: { ...prev.scenes, [selectedSceneId]: updatedScene } };
    });
  };
  const deleteDialogueLine = (index: number) => {
    recordHistory();
    const newDialogues = [...dialogues]; newDialogues.splice(index, 1);
    setStory(prev => {
        if (!selectedSceneId) return prev;
        const updatedScene = { ...prev.scenes[selectedSceneId], dialogues: newDialogues };
        if (index === 0) { updatedScene.text = newDialogues.length > 0 ? newDialogues[0].text : ""; updatedScene.characterName = newDialogues.length > 0 ? newDialogues[0].characterName : undefined; }
        return { ...prev, scenes: { ...prev.scenes, [selectedSceneId]: updatedScene } };
    });
  };

  // --- FORMATTING ---
  const insertFormat = (tagStart: string, tagEnd: string) => {
    const el = activeTextAreaRef.current;
    if (!el || !selectedSceneId) { alert("Vui lòng click vào ô nội dung hội thoại cần định dạng trước."); return; }
    recordHistory(); 
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const newText = text.substring(0, start) + tagStart + text.substring(start, end) + tagEnd + text.substring(end);
    const index = Number(el.dataset.index);
    if (!isNaN(index)) {
        updateDialogueLine(index, 'text', newText);
        setTimeout(() => { el.focus(); const newCursor = start + tagStart.length + (end - start) + tagEnd.length; el.setSelectionRange(newCursor, newCursor); }, 0);
    }
  };

  const initiateGlossary = () => {
    const el = activeTextAreaRef.current;
    if (!el || !selectedSceneId) {
        alert("Vui lòng click vào ô nội dung hội thoại cần tạo ghi chú trước.");
        return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const fullText = el.value;
    const selectedText = fullText.substring(start, end);

    if (!selectedText) {
        alert("Vui lòng bôi đen từ cần tạo giải thích.");
        return;
    }
    const index = Number(el.dataset.index);
    if (isNaN(index)) return;

    setGlossaryModal({
        isOpen: true,
        text: selectedText,
        note: '',
        selection: { index, start, end, fullText }
    });
  };

  const applyGlossary = () => {
     const { selection, note, text: selectedText } = glossaryModal;
     if (!selection || !note.trim()) return;
     recordHistory(); 
     const tagStart = `<span class="vn-glossary-term" style="font-weight: bold; text-decoration: underline; text-decoration-style: dotted; text-decoration-color: #60a5fa; cursor: help; color: #93c5fd; pointer-events: auto;" data-note="${note.replace(/"/g, '&quot;')}">`;
     const tagEnd = `</span>`;
     const newText = selection.fullText.substring(0, selection.start) + tagStart + selectedText + tagEnd + selection.fullText.substring(selection.end);
     updateDialogueLine(selection.index, 'text', newText);
     setGlossaryModal(prev => ({ ...prev, isOpen: false }));
  };

  const ensureCharactersArray = () => { return currentScene.characters || ((currentScene.characterImage && currentScene.characterImage !== 'none') ? [{ image: currentScene.characterImage, position: currentScene.characterPosition || 'center' }] : []); };
  const currentCharacters = ensureCharactersArray();
  
  const addCharacter = () => { 
      recordHistory();
      updateScene('characters', [...ensureCharactersArray(), { image: '', position: 'center' }]); 
  };
  const updateCharacter = (index: number, field: keyof Character, value: string) => { const chars = [...ensureCharactersArray()]; chars[index] = { ...chars[index], [field]: value }; updateScene('characters', chars); };
  
  const removeCharacter = (index: number) => { 
      recordHistory();
      const chars = [...ensureCharactersArray()]; chars.splice(index, 1); updateScene('characters', chars); 
  };
  
  const copyAttributesFromScene = (sourceId: string) => {
      if (!sourceId || !story.scenes[sourceId]) return;
      recordHistory();
      const source = story.scenes[sourceId];
      setStory(prev => ({ ...prev, scenes: { ...prev.scenes, [selectedSceneId!]: { ...prev.scenes[selectedSceneId!], backgroundImage: source.backgroundImage, bgm: source.bgm, characterName: source.characterName, characters: source.characters ? [...source.characters] : [], portrait: source.portrait, } } }));
  };
  
  const handleExport = () => { navigator.clipboard.writeText(JSON.stringify(story, null, 2)); alert("Đã sao chép JSON vào bộ nhớ tạm!"); };
  const preventFocusLoss = (e: React.MouseEvent) => { e.preventDefault(); };

  return (
    <div className="flex flex-col h-screen bg-neutral-900 text-gray-100 font-sans">
      {/* HEADER */}
      <div className="bg-gray-800 border-b border-gray-700 p-3 flex justify-between items-center shadow-md z-20">
        <div className="flex items-center gap-4">
          <button onClick={onExit} className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white"><ArrowLeft size={20} /></button>
          <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Trình biên tập</span>
              <input value={story.title} onChange={(e) => updateStoryInfo('title', e.target.value)} className="bg-transparent border-none focus:ring-0 text-white font-bold text-lg p-0 w-64 placeholder-gray-600" />
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-1 bg-gray-900 rounded-lg p-1 mr-2 border border-gray-700">
             <button onClick={handleUndo} disabled={historyStack.length === 0} className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed" title="Hoàn tác (Ctrl + Z)"><Undo size={18} /></button>
             <div className="w-px h-4 bg-gray-700"></div>
             <button onClick={handleRedo} disabled={redoStack.length === 0} className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed" title="Làm lại (Ctrl + Y)"><Redo size={18} /></button>
          </div>
          
          <button 
             onClick={handleSaveToServer} 
             disabled={isSaving}
             className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded text-sm font-medium text-white shadow-lg shadow-green-900/20 disabled:opacity-50 transition-all"
          >
             {isSaving ? <Loader2 size={16} className="animate-spin"/> : <CloudUpload size={16} />}
             <span className="hidden md:inline">{isSaving ? 'Đang lưu...' : 'Lưu Server'}</span>
          </button>

          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium"><Download size={16} /> <span className="hidden md:inline">Export</span></button>
          <button onClick={() => onPlay(story)} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium shadow-lg shadow-blue-900/20"><Play size={16} /> <span className="hidden md:inline">Chơi Thử</span></button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <div className="w-72 bg-gray-900 border-r border-gray-700 flex flex-col">
           <div className="p-3 bg-gray-800/50 border-b border-gray-700 font-semibold text-xs text-gray-400 uppercase tracking-wider flex justify-between items-center">
               Cấu trúc truyện <button onClick={() => setViewMode('structure')} className="p-1 hover:bg-gray-700 rounded text-blue-400"><Edit3 size={14} /></button>
           </div>
           <div className="flex-1 overflow-y-auto p-2 space-y-1">
               {(!story.chapters || story.chapters.length === 0) && <div className="text-center text-gray-500 text-sm mt-4 px-2">Chưa có chương nào.<br/><button onClick={() => setViewMode('structure')} className="text-blue-400 hover:underline mt-2">Tạo Chương ngay</button></div>}
               {story.chapters?.map((chap, chapIdx) => (
                   <div key={`${chap.id}_${chapIdx}`} className="mb-1">
                       <div className="flex items-center group bg-transparent hover:bg-gray-800 rounded">
                           <button onClick={() => toggleChapterExpand(chap.id)} className="w-full flex items-center gap-2 p-2 text-left transition-colors">
                               {expandedChapters.has(chap.id) ? <ChevronDown size={14} className="text-gray-500"/> : <ChevronRight size={14} className="text-gray-500"/>}
                               <span className="font-bold text-sm text-gray-300 group-hover:text-white truncate flex-1">{chap.title}</span>
                           </button>
                       </div>
                       {expandedChapters.has(chap.id) && (
                           <div className="ml-4 border-l border-gray-700 pl-2 mt-1 space-y-1">
                               {chap.episodes.map((ep, epIdx) => (
                                   <div key={`${ep.id}_${epIdx}`} className={`flex items-center gap-1 p-1 rounded transition-all ${selectedEpisodeId === ep.id ? 'bg-blue-900/30 text-blue-300 border border-blue-500/30' : 'text-gray-400 hover:bg-gray-800 hover:text-white border border-transparent'}`}>
                                       <button onClick={() => handleSelectEpisode(ep.id)} className="flex-1 flex items-center gap-2 text-left text-sm">
                                           <File size={12} /><span className="truncate">{ep.title}</span>
                                       </button>
                                   </div>
                               ))}
                               {chap.episodes.length === 0 && <div className="text-xs text-gray-600 italic px-2 py-1">Trống (Vào quản lý để thêm tập)</div>}
                           </div>
                       )}
                   </div>
               ))}
           </div>
           <div className="p-3 border-t border-gray-700 space-y-2">
               <button onClick={() => setViewMode('structure')} className={`w-full flex items-center gap-2 p-2 rounded text-sm font-medium transition-colors ${viewMode === 'structure' ? 'bg-purple-900/30 text-purple-300' : 'hover:bg-gray-800 text-gray-400'}`}><Layers size={16} /> Quản lý Chương & Tập</button>
               <button onClick={() => setViewMode('settings')} className={`w-full flex items-center gap-2 p-2 rounded text-sm font-medium transition-colors ${viewMode === 'settings' ? 'bg-gray-700 text-white' : 'hover:bg-gray-800 text-gray-400'}`}><Settings size={16} /> Cài đặt chung</button>
               {/* NEW GRAPH BUTTON */}
               <button onClick={() => setViewMode('graph')} className={`w-full flex items-center gap-2 p-2 rounded text-sm font-medium transition-colors ${viewMode === 'graph' ? 'bg-green-700 text-white' : 'hover:bg-gray-800 text-gray-400'}`}><GitBranch size={16} /> Cây Cốt Truyện</button>
           </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex overflow-hidden bg-gray-900">
            {viewMode === 'editor' && selectedEpisodeId ? (
                <>
                    {/* Scene List */}
                    <div className="w-64 bg-gray-800/30 border-r border-gray-700 flex flex-col">
                        <div className="p-3 border-b border-gray-700 bg-gray-800/50"><h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Cảnh trong tập:</h3><div className="text-blue-300 font-bold truncate text-sm" title={currentEpisode?.title}>{currentEpisode?.title}</div></div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {episodeScenes.map((scene, index) => (
                                <div key={scene.id} className="flex items-stretch group">
                                    <button onClick={() => setSelectedSceneId(scene.id)} className={`flex-1 text-left p-3 border-b border-gray-800 transition-all relative ${selectedSceneId === scene.id ? 'bg-blue-600/10 border-blue-500/50 text-white' : 'bg-transparent border-transparent hover:bg-gray-800 text-gray-400'}`}>
                                        <div className="text-[10px] font-mono opacity-50 mb-0.5">{scene.id}</div>
                                        <div className="text-xs line-clamp-2 leading-relaxed">{scene.text || <span className="italic opacity-50">Chưa có nội dung...</span>}</div>
                                        {scene.id === currentEpisode?.startSceneId && <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full" title="Start Scene"></div>}
                                        {scene.dialogues && scene.dialogues.length > 0 && <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] text-green-400 bg-green-900/20 px-1 rounded"><List size={8}/> {scene.dialogues.length} dòng</div>}
                                    </button>
                                </div>
                            ))}
                            <button onClick={addScene} className="w-full py-3 mt-2 border border-dashed border-gray-700 text-gray-500 hover:border-blue-500 hover:text-blue-400 rounded text-xs flex items-center justify-center gap-2 transition-colors"><Plus size={14} /> Thêm Cảnh Mới</button>
                        </div>
                    </div>

                    {/* Scene Editor */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-900">
                        {selectedSceneId ? (
                            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
                                <div className="flex justify-between items-center pb-4 border-b border-gray-800">
                                    <div className="flex items-center gap-2"><span className="bg-gray-800 text-gray-400 px-2 py-1 rounded text-xs font-mono">ID: {selectedSceneId}</span>{currentEpisode?.startSceneId === selectedSceneId && <span className="bg-blue-900/50 text-blue-300 px-2 py-1 rounded text-xs font-bold">START SCENE</span>}</div>
                                    <div className="flex items-center gap-2">
                                        <select className="bg-gray-800 text-xs text-gray-300 border-none rounded py-1 pl-2 pr-6" value={copySourceId} onChange={(e) => setCopySourceId(e.target.value)}><option value="">-- Copy từ cảnh --</option>{episodeScenes.filter(s => s.id !== selectedSceneId).map(s => <option key={s.id} value={s.id}>{s.id}</option>)}</select>
                                        <button onClick={() => copyAttributesFromScene(copySourceId)} disabled={!copySourceId} className="p-1.5 bg-gray-700 hover:bg-blue-600 rounded text-white disabled:opacity-50"><Copy size={14} /></button>
                                        <div className="w-px h-4 bg-gray-700 mx-1"></div>
                                        <button onClick={() => deleteScene(selectedSceneId)} className="shrink-0 p-1.5 text-red-500 hover:bg-red-900/20 rounded z-50 cursor-pointer"><Trash2 size={16} className="pointer-events-none"/></button>
                                    </div>
                                </div>
                                
                                <div className="bg-gray-800/20 border border-gray-700 rounded-xl p-4 space-y-3">
                                   <div className="flex items-center justify-between border-b border-gray-700 pb-2 mb-2">
                                      <h4 className="text-sm font-bold text-white flex items-center gap-2"><MessageSquare size={16} className="text-blue-400"/> Nội dung hội thoại</h4>
                                      <div className="flex bg-gray-800 rounded p-0.5">
                                            <button onMouseDown={preventFocusLoss} onClick={() => insertFormat('<b>', '</b>')} className="p-1 hover:bg-gray-700 rounded text-gray-400" title="In đậm"><Bold size={14}/></button>
                                            <button onMouseDown={preventFocusLoss} onClick={() => insertFormat('<i>', '</i>')} className="p-1 hover:bg-gray-700 rounded text-gray-400" title="In nghiêng"><Italic size={14}/></button>
                                            <button onMouseDown={preventFocusLoss} onClick={() => insertFormat('<span style="color: #ef4444">', '</span>')} className="p-1 hover:bg-gray-700 rounded text-red-400" title="Màu đỏ"><Palette size={14}/></button>
                                            <div className="w-px h-4 bg-gray-700 mx-1 self-center"></div>
                                            <button onMouseDown={preventFocusLoss} onClick={initiateGlossary} className="p-1 hover:bg-gray-700 rounded text-blue-400" title="Thêm giải thích thuật ngữ (Glossary)"><Book size={14}/></button>
                                      </div>
                                   </div>
                                   <div className="space-y-3">
                                      {dialogues.map((d, idx) => (
                                          <div key={idx} className="flex gap-2 items-start relative group">
                                              <div className={`p-2 rounded text-xs font-mono mt-2 min-w-[24px] text-center ${idx === 0 ? 'bg-blue-900 text-blue-300 font-bold' : 'bg-gray-800 text-gray-500'}`}>{idx + 1}</div>
                                              <div className="flex-1 space-y-1">
                                                  <input className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-blue-300 placeholder-gray-600 mb-1 focus:border-blue-500 focus:outline-none" placeholder={`Tên nhân vật (Để trống = ${currentScene.characterName || 'Mặc định'})`} value={d.characterName || ''} onChange={(e) => updateDialogueLine(idx, 'characterName', e.target.value)} />
                                                  <textarea data-index={idx} className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-sm text-white resize-y min-h-[80px] focus:border-blue-500 focus:outline-none font-mono" placeholder="Lời thoại..." value={d.text} onChange={(e) => updateDialogueLine(idx, 'text', e.target.value)} onFocus={(e) => activeTextAreaRef.current = e.target} />
                                              </div>
                                              <div className="flex flex-col pt-2 opacity-100 sm:opacity-50 group-hover:opacity-100 transition-opacity">
                                                  <button onClick={() => deleteDialogueLine(idx)} className="text-gray-600 hover:text-red-500 p-1" title="Xóa dòng này"><Trash2 size={16} /></button>
                                              </div>
                                          </div>
                                      ))}
                                      <button onClick={addDialogueLine} className="w-full py-3 border border-dashed border-gray-700 text-gray-500 hover:border-indigo-500 hover:text-indigo-400 rounded text-sm flex items-center justify-center gap-2 mt-2"><Plus size={16} /> Thêm dòng thoại tiếp theo</button>
                                   </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="bg-gray-800/40 border border-gray-800 rounded-xl p-4 space-y-4">
                                        <h4 className="text-sm font-bold text-purple-400 flex items-center gap-2"><User size={16}/> Nhân vật (Mặc định)</h4>
                                        <input className="w-full bg-gray-900 border-gray-700 rounded p-2 text-sm text-white" placeholder="Tên người nói" value={currentScene.characterName || ''} onChange={(e) => updateScene('characterName', e.target.value)} />
                                        <div className="space-y-2">
                                            <label className="text-xs text-gray-500 uppercase">Hình ảnh (Sprites)</label>
                                            {currentCharacters.map((char, idx) => (
                                                <div key={idx} className="flex gap-2">
                                                    <div className="flex-1 flex gap-1">
                                                        <input className="flex-1 bg-gray-900 border-gray-700 rounded p-1.5 text-xs text-white" placeholder="URL hoặc Upload..." value={char.image} onChange={(e) => updateCharacter(idx, 'image', e.target.value)} />
                                                        <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 p-1.5 rounded text-gray-300" title="Upload ảnh Local">
                                                            <Upload size={14} />
                                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, (val) => updateCharacter(idx, 'image', val))} />
                                                        </label>
                                                    </div>
                                                    <select className="bg-gray-900 border-gray-700 rounded text-xs text-white" value={char.position} onChange={(e) => updateCharacter(idx, 'position', e.target.value)}><option value="left">Trái</option><option value="center">Giữa</option><option value="right">Phải</option></select>
                                                    <button onClick={() => removeCharacter(idx)} className="text-gray-500 hover:text-red-500"><Trash2 size={14}/></button>
                                                </div>
                                            ))}
                                            <button onClick={addCharacter} className="text-xs text-blue-400 hover:underline flex items-center gap-1"><Plus size={12}/> Thêm nhân vật</button>
                                        </div>
                                    </div>
                                    <div className="bg-gray-800/40 border border-gray-800 rounded-xl p-4 space-y-4">
                                        <h4 className="text-sm font-bold text-green-400 flex items-center gap-2"><ImageIcon size={16}/> Bối cảnh & Âm thanh</h4>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase block mb-1">Hình nền (Background)</label>
                                            <div className="flex gap-2 mb-2">
                                                <input className="flex-1 bg-gray-900 border-gray-700 rounded p-2 text-xs text-white" placeholder="URL Hình nền..." value={currentScene.backgroundImage || ''} onChange={(e) => updateScene('backgroundImage', e.target.value)} />
                                                <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 p-2 rounded text-gray-300 flex items-center" title="Upload ảnh nền">
                                                    <Upload size={16} />
                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, (val) => updateScene('backgroundImage', val))} />
                                                </label>
                                            </div>
                                            {currentScene.backgroundImage && <div className="h-16 w-full bg-black rounded overflow-hidden relative"><img src={currentScene.backgroundImage} className="w-full h-full object-cover opacity-50" /></div>}
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase block mb-1">Nhạc nền (BGM)</label>
                                            <div className="flex gap-2">
                                                <input className="flex-1 bg-gray-900 border-gray-700 rounded p-2 text-xs text-white" placeholder="URL Nhạc nền..." value={currentScene.bgm || ''} onChange={(e) => updateScene('bgm', e.target.value)} />
                                                <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 p-2 rounded text-gray-300 flex items-center" title="Upload nhạc">
                                                    <Upload size={16} />
                                                    <input type="file" className="hidden" accept="audio/*" onChange={(e) => handleFileUpload(e, (val) => updateScene('bgm', val))} />
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-800/40 border border-gray-800 rounded-xl p-4">
                                    <h4 className="text-sm font-bold text-yellow-400 flex items-center gap-2 mb-3"><CornerDownRight size={16}/> Điều hướng & Lựa chọn</h4>
                                    {currentScene.choices.length === 0 ? (
                                        <div className="flex items-center gap-2 bg-gray-900 p-2 rounded"><span className="text-xs text-gray-400 whitespace-nowrap">Cảnh tiếp theo:</span><select className="flex-1 bg-transparent border-none text-sm text-white focus:ring-0" value={currentScene.nextSceneId || ''} onChange={(e) => updateScene('nextSceneId', e.target.value)}><option value="">-- Chọn cảnh --</option><option value="__EXIT__">[ KẾT THÚC ]</option>{episodeScenes.map(s => <option key={s.id} value={s.id}>{s.id} - {s.text.substring(0,20)}...</option>)}</select></div>
                                    ) : (
                                        <div className="space-y-2">{currentScene.choices.map((c, idx) => (
                                            <div key={idx} className="flex gap-2 items-center bg-gray-900 p-2 rounded"><input className="flex-1 bg-transparent border-none text-sm text-white p-0" value={c.text} onChange={(e) => { const newChoices = [...currentScene.choices]; newChoices[idx].text = e.target.value; updateScene('choices', newChoices); }} placeholder="Nội dung lựa chọn" /><ArrowRight size={14} className="text-gray-600"/><select className="w-32 bg-gray-800 border-none text-xs text-gray-300 rounded" value={c.nextSceneId} onChange={(e) => { const newChoices = [...currentScene.choices]; newChoices[idx].nextSceneId = e.target.value; updateScene('choices', newChoices); }}>{episodeScenes.map(s => <option key={s.id} value={s.id}>{s.id}</option>)}<option value="__EXIT__">KẾT THÚC</option></select><button onClick={() => { const newChoices = [...currentScene.choices]; newChoices.splice(idx, 1); updateScene('choices', newChoices); }} className="text-red-500"><Trash2 size={14}/></button></div>
                                        ))}</div>
                                    )}
                                    <button onClick={() => updateScene('choices', [...currentScene.choices, { text: 'Lựa chọn mới', nextSceneId: selectedSceneId || '' }])} className="mt-3 text-xs flex items-center gap-1 text-gray-400 hover:text-white"><Plus size={12}/> Thêm lựa chọn</button>
                                </div>
                            </div>
                        ) : (<div className="h-full flex flex-col items-center justify-center text-gray-600"><p>Chọn một cảnh để chỉnh sửa</p></div>)}
                    </div>
                </>
            ) : viewMode === 'graph' ? (
                // --- NEW GRAPH VIEW ---
                <div className="flex-1 flex flex-col bg-neutral-950">
                    <div className="p-4 bg-gray-900 border-b border-gray-800 flex justify-between items-center z-10">
                        <h2 className="text-lg font-bold text-green-400 flex items-center gap-2"><GitBranch size={20}/> Cây Cốt Truyện (Visual Tree)</h2>
                        <div className="text-xs text-gray-500 flex items-center gap-4">
                             <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Click: Chọn</div>
                             <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> Kéo: Di chuyển</div>
                             <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Kéo dây: Nối cảnh</div>
                             <span>|</span>
                             {currentEpisode ? `Tập: ${currentEpisode.title}` : 'Toàn bộ truyện'}
                        </div>
                    </div>
                    {/* Render new node-based graph */}
                    <StoryGraph 
                        story={story} 
                        currentEpisodeId={currentEpisode?.id}
                        onSceneClick={handleSelectSceneFromGraph}
                        onSceneUpdate={handleGraphUpdate}
                        onSceneConnect={handleGraphConnect}
                    />
                </div>
            ) : viewMode === 'structure' ? (
                <div className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-8 text-center mb-8">
                             <h2 className="text-2xl font-bold text-blue-400 mb-2">Quản lý Cấu trúc Truyện</h2>
                             <button onClick={addChapter} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-bold shadow-lg shadow-blue-900/20 flex items-center gap-2 mx-auto"><Plus size={20} /> Thêm Chương Mới</button>
                        </div>
                        <div className="space-y-6">
                            {(story.chapters || []).map((chap, chapIdx) => (
                                <div key={`${chap.id}_${chapIdx}`} className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                                    <div className="p-4 bg-gray-700/50 flex flex-col gap-3 border-b border-gray-700 relative isolate">
                                        <div className="flex gap-4 items-center">
                                            <span className="bg-blue-900 text-blue-300 text-xs font-bold px-2 py-1 rounded shrink-0">CHƯƠNG</span>
                                            <input className="flex-1 min-w-0 bg-transparent text-lg font-bold text-white border-none focus:ring-0" value={chap.title} onChange={(e) => updateChapter(chap.id, 'title', e.target.value)} placeholder="Tên chương..." />
                                            <button type="button" onClick={(e) => { e.stopPropagation(); deleteChapter(chap.id); }} className="shrink-0 relative z-50 text-gray-500 hover:text-red-500 p-2 rounded hover:bg-gray-700 transition-colors cursor-pointer" title="Xóa chương"><Trash2 size={18} className="pointer-events-none" /></button>
                                        </div>
                                        {/* CHAPTER THUMBNAIL */}
                                        <div className="flex items-center gap-2 pl-14">
                                            <ImageIcon size={14} className="text-gray-500"/>
                                            <input className="flex-1 bg-gray-900/50 border border-gray-600 rounded px-2 py-1 text-xs text-gray-300" placeholder="URL ảnh bìa chương..." value={chap.thumbnail || ''} onChange={(e) => updateChapter(chap.id, 'thumbnail', e.target.value)} />
                                            <label className="cursor-pointer p-1 bg-gray-600 rounded hover:bg-gray-500">
                                                <Upload size={12}/>
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, (val) => updateChapter(chap.id, 'thumbnail', val))} />
                                            </label>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-900/50 space-y-3">
                                        {chap.episodes.map((ep, epIdx) => (
                                            <div key={`${ep.id}_${epIdx}`} className="flex flex-col gap-2 bg-gray-800 p-3 rounded border border-gray-700 ml-4 relative isolate">
                                                <div className="flex items-center gap-3">
                                                    <File size={16} className="text-gray-500 shrink-0"/>
                                                    <input className="flex-1 min-w-0 bg-transparent text-sm text-white border-none focus:ring-0" value={ep.title} onChange={(e) => updateEpisode(chap.id, ep.id, 'title', e.target.value)} placeholder="Tên tập..." />
                                                    <button onClick={(e) => { e.stopPropagation(); handleSelectEpisode(ep.id); }} onMouseDown={(e) => e.stopPropagation()} className="shrink-0 px-3 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded text-xs relative z-10">Sửa nội dung</button>
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); deleteEpisode(chap.id, ep.id); }} className="shrink-0 relative z-50 text-gray-600 hover:text-red-500 p-2 rounded hover:bg-gray-700 transition-colors cursor-pointer" title="Xóa tập"><Trash2 size={14} className="pointer-events-none" /></button>
                                                </div>
                                                {/* EPISODE THUMBNAIL */}
                                                <div className="flex items-center gap-2 pl-7 border-t border-gray-700/50 pt-2">
                                                    <span className="text-[10px] text-gray-500 uppercase">Ảnh bìa:</span>
                                                    <input className="flex-1 bg-gray-900/50 border border-gray-600 rounded px-2 py-1 text-xs text-gray-300" placeholder="URL ảnh bìa tập..." value={ep.thumbnail || ''} onChange={(e) => updateEpisode(chap.id, ep.id, 'thumbnail', e.target.value)} />
                                                    <label className="cursor-pointer p-1 bg-gray-600 rounded hover:bg-gray-500">
                                                        <Upload size={12}/>
                                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, (val) => updateEpisode(chap.id, ep.id, 'thumbnail', val))} />
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                        <button onClick={() => addEpisode(chap.id)} className="ml-4 text-xs text-blue-400 hover:underline flex items-center gap-1 mt-2"><Plus size={14}/> Thêm Tập mới</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 p-8 overflow-y-auto flex items-center justify-center">
                    <div className="max-w-lg w-full bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Settings size={20}/> Thông tin truyện</h2>
                        <div><label className="block text-xs text-gray-500 uppercase mb-1">Tác giả</label><input className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" value={story.author || ''} onChange={(e) => updateStoryInfo('author', e.target.value)} /></div>
                        <div><label className="block text-xs text-gray-500 uppercase mb-1">Mô tả</label><textarea className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white h-24" value={story.description || ''} onChange={(e) => updateStoryInfo('description', e.target.value)} /></div>
                        
                        {/* STORY THUMBNAIL */}
                        <div>
                            <label className="block text-xs text-gray-500 uppercase mb-1">Ảnh bìa truyện (Thumbnail)</label>
                            <div className="flex gap-2">
                                <input className="flex-1 bg-gray-900 border-gray-600 rounded p-2 text-white text-xs" value={story.thumbnail || ''} onChange={(e) => updateStoryInfo('thumbnail', e.target.value)} placeholder="URL ảnh bìa..." />
                                <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 px-3 rounded flex items-center justify-center">
                                    <Upload size={16}/>
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, (val) => updateStoryInfo('thumbnail', val))} />
                                </label>
                            </div>
                            {story.thumbnail && <div className="mt-2 h-32 bg-gray-900 rounded border border-gray-700 overflow-hidden"><img src={story.thumbnail} className="w-full h-full object-cover"/></div>}
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>

      {glossaryModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-gray-800 border border-gray-600 p-6 rounded-lg shadow-xl w-full max-w-md animate-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2"><Book size={20} className="text-blue-400"/> Thêm giải thích thuật ngữ</h3>
                    <button onClick={() => setGlossaryModal(prev => ({ ...prev, isOpen: false }))} className="text-gray-400 hover:text-white"><X size={20}/></button>
                </div>
                <div className="mb-4">
                    <label className="block text-xs text-gray-400 mb-1 font-bold uppercase">Từ được chọn:</label>
                    <div className="p-3 bg-gray-900 border border-gray-700 rounded text-blue-300 font-medium">{glossaryModal.text}</div>
                </div>
                <div className="mb-6">
                    <label className="block text-xs text-gray-400 mb-1 font-bold uppercase">Nội dung giải thích:</label>
                    <textarea 
                        className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-blue-500 outline-none h-32 resize-none"
                        placeholder="Nhập giải thích cho từ này..."
                        value={glossaryModal.note}
                        onChange={(e) => setGlossaryModal(prev => ({ ...prev, note: e.target.value }))}
                        autoFocus
                    />
                </div>
                <div className="flex justify-end gap-3 pt-2 border-t border-gray-700">
                    <button onClick={() => setGlossaryModal(prev => ({ ...prev, isOpen: false }))} className="px-4 py-2 rounded hover:bg-gray-700 text-gray-300 font-medium">Hủy bỏ</button>
                    <button onClick={applyGlossary} disabled={!glossaryModal.note.trim()} className="px-6 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20">Thêm Ghi Chú</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default StoryEditor;