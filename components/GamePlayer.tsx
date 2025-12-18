
import React, { useState, useEffect, useRef } from 'react';
import { Settings, Save, Home, SkipForward, PlayCircle, PauseCircle, History, X, ChevronDown, Menu, LogOut, RotateCcw, HelpCircle, Download, CornerDownRight, Info } from 'lucide-react';
import { Story, ReaderSettings, SaveState, Choice, HistoryEntry, Scene, Character, GlossaryEntry } from '../types';
import { useTypewriter } from '../hooks/useTypewriter';
import { useStoryAudio } from '../hooks/useStoryAudio';
import { saveSettings } from '../utils/storage';
import SettingsModal from './SettingsModal';
import SaveLoadModal from './SaveLoadModal';

// --- VISUAL LAYER ---
const VisualStage: React.FC<{ 
    background?: string, 
    characters: Character[],
    activeName?: string 
}> = ({ background, characters, activeName }) => {
    const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        e.currentTarget.style.display = 'none';
    };

    return (
        <div className="absolute inset-0 z-0 bg-black overflow-hidden select-none pointer-events-none">
            <div className="absolute inset-0 animate-in fade-in duration-1000">
                {background ? (
                    <img 
                        src={background} 
                        className="w-full h-full object-cover transition-all duration-1000" 
                        alt="bg" 
                        onError={handleImgError}
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-b from-gray-900 to-black" />
                )}
                <div className="absolute inset-0 bg-black/10"></div>
            </div>
            
            {characters.map((char, idx) => {
                const isActive = activeName && char.name && activeName.toLowerCase().includes(char.name.toLowerCase());
                const brightness = isActive ? 'brightness(1.1) contrast(1.05)' : activeName ? 'brightness(0.5)' : 'brightness(1)';
                
                let left = '50%';
                if (char.position === 'left') left = '20%';
                if (char.position === 'right') left = '80%';
                if (char.position === 'center') left = '50%';

                return (
                    <img 
                        key={`${char.image}-${idx}`}
                        src={char.image}
                        className="absolute bottom-0 max-h-[85vh] h-auto w-auto object-contain transition-all duration-500 ease-out z-10"
                        style={{ 
                            left, 
                            transform: `translateX(-50%) ${isActive ? 'scale(1.02)' : 'scale(1)'}`,
                            filter: `${brightness} drop-shadow(0 0 20px rgba(0,0,0,0.5))`,
                            zIndex: isActive ? 20 : 10
                        }}
                        alt="char"
                        onError={handleImgError}
                    />
                );
            })}
        </div>
    );
};

// --- DIALOGUE BOX ---
const DialogueBox: React.FC<{ 
    text: string, 
    name?: string, 
    isTyping: boolean, 
    onAdvance: () => void,
    onTermClick: (termId: string) => void,
    settings: ReaderSettings 
}> = ({ text, name, isTyping, onAdvance, onTermClick, settings }) => {
    const handleClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        const termElement = target.closest('.glossary-term') as HTMLElement;
        if (termElement && termElement.dataset.termId) {
            e.stopPropagation();
            onTermClick(termElement.dataset.termId);
        } else {
            onAdvance();
        }
    };

    return (
        <div className="absolute bottom-0 left-0 w-full pb-8 pt-24 px-4 z-30 flex justify-center bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none">
            <div 
                className="w-full max-w-4xl pointer-events-auto cursor-pointer group relative" 
                onClick={handleClick}
            >
                {name && (
                    <div className="absolute -top-6 left-0 z-10 animate-in slide-in-from-left-2 fade-in duration-300">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 text-blue-200 font-bold text-lg px-6 py-1 rounded-t-lg rounded-br-lg shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
                            {name}
                        </div>
                    </div>
                )}

                <div 
                    className="backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 min-h-[140px] shadow-2xl relative transition-all duration-300 hover:border-white/20 hover:bg-black/80"
                    style={{ backgroundColor: `rgba(10, 10, 10, ${Math.max(0.6, settings.overlayOpacity)})` }}
                >
                    <div 
                        className={`text-gray-100 leading-relaxed tracking-wide ${settings.fontFamily === 'serif' ? 'font-serif' : settings.fontFamily === 'mono' ? 'font-mono' : 'font-sans'}`}
                        style={{ 
                            fontSize: settings.fontSize === 'xlarge' ? '1.5rem' : settings.fontSize === 'large' ? '1.25rem' : '1.125rem',
                            textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                        }}
                        dangerouslySetInnerHTML={{ __html: text }}
                    />
                    
                    <div className="absolute bottom-4 right-6 text-white/50">
                        {!isTyping ? (
                            <ChevronDown size={24} className="animate-bounce text-blue-400" />
                        ) : (
                            <span className="inline-flex gap-1">
                                <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce"></span>
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- SCROLL VIEW COMPONENT ---
const ScrollView: React.FC<{
    history: HistoryEntry[],
    currentText: string,
    currentName?: string,
    isTyping: boolean,
    choices: Choice[],
    isWaitingForChoice: boolean,
    onAdvance: () => void,
    onChoice: (c: Choice) => void,
    onJump: (entry: HistoryEntry) => void,
    onTermClick: (termId: string) => void,
    settings: ReaderSettings
}> = ({ 
    history, currentText, currentName, isTyping, choices, isWaitingForChoice, 
    onAdvance, onChoice, onJump, onTermClick, settings 
}) => {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history.length, currentText, isTyping, choices]);

    const getFontStyle = () => {
        const sizeClass = settings.fontSize === 'xlarge' ? 'text-2xl' : settings.fontSize === 'large' ? 'text-xl' : settings.fontSize === 'medium' ? 'text-lg' : 'text-base';
        const fontClass = settings.fontFamily === 'serif' ? 'font-serif' : settings.fontFamily === 'mono' ? 'font-mono' : 'font-sans';
        return `${sizeClass} ${fontClass}`;
    };

    const handleTextContainerClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        const termElement = target.closest('.glossary-term') as HTMLElement;
        if (termElement && termElement.dataset.termId) {
            e.stopPropagation();
            onTermClick(termElement.dataset.termId);
            return;
        }

        if (!target.closest('button')) {
            onAdvance();
        }
    };

    return (
        <div 
            className="absolute inset-0 z-20 overflow-y-auto px-4 pb-32 pt-20 flex flex-col items-center"
            onClick={handleTextContainerClick}
        >
            <div className="w-full max-w-3xl space-y-6">
                {history.map((entry, idx) => (
                    <div key={idx} className="animate-in fade-in slide-in-from-bottom-2 duration-300 group/item relative">
                        {entry.type === 'choice' ? (
                            <div className="flex justify-end mb-2">
                                <div className="bg-blue-900/40 text-blue-200 px-4 py-1.5 rounded-l-xl rounded-tr-xl text-[11px] border border-blue-500/30 italic flex items-center gap-2">
                                    <CornerDownRight size={12}/> Đã chọn: {entry.text}
                                </div>
                            </div>
                        ) : (
                            <div className="relative">
                                {entry.characterName && (
                                    <div className="text-blue-400 font-black text-[10px] uppercase tracking-widest mb-1">{entry.characterName}</div>
                                )}
                                <div className="text-gray-300 leading-relaxed text-sm md:text-base border-l-2 border-white/5 pl-4 py-1" dangerouslySetInnerHTML={{ __html: entry.text }} />
                                
                                {entry.sceneId && (
                                    <button 
                                        onClick={() => onJump(entry)}
                                        className="absolute top-1/2 -translate-y-1/2 right-4 p-2 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2 text-[10px] font-bold"
                                    >
                                        <CornerDownRight size={14}/> QUAY LẠI CẢNH NÀY
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                <div className="flex flex-col gap-1 items-start min-h-[80px]">
                    {currentName && (
                        <div className="text-blue-300 font-bold text-sm px-2 drop-shadow-md">{currentName}</div>
                    )}
                    <div 
                        className={`bg-black/70 backdrop-blur-md text-white px-6 py-4 rounded-2xl border border-blue-500/30 shadow-xl w-full relative ${getFontStyle()}`}
                    >
                         <div dangerouslySetInnerHTML={{ __html: currentText }} />
                         {!isTyping && !isWaitingForChoice && (
                             <div className="absolute bottom-2 right-4 text-blue-400 animate-bounce">
                                 <ChevronDown size={20}/>
                             </div>
                         )}
                    </div>
                </div>

                {isWaitingForChoice && !isTyping && (
                    <div className="flex flex-col gap-3 py-4 animate-in fade-in slide-in-from-bottom-4">
                        {choices.map((c, idx) => (
                            <button 
                                key={idx}
                                onClick={(e) => { e.stopPropagation(); onChoice(c); }}
                                className="w-full bg-blue-900/80 hover:bg-blue-800 text-white py-4 px-6 rounded-xl font-medium border border-blue-500/50 hover:border-blue-400 shadow-lg transition-all hover:scale-[1.02]"
                            >
                                {c.text}
                            </button>
                        ))}
                    </div>
                )}
                
                <div ref={bottomRef} className="h-4"></div>
            </div>
        </div>
    );
};

// --- GLOSSARY POPUP ---
const GlossaryPopup: React.FC<{ entry: GlossaryEntry, onClose: () => void }> = ({ entry, onClose }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300" onClick={onClose}>
        <div 
            className="w-full max-w-sm bg-gray-900 border border-blue-500/50 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
        >
            <div className="bg-blue-600/20 border-b border-blue-500/20 p-4 flex items-center justify-between">
                <h3 className="text-blue-400 font-black flex items-center gap-2 uppercase tracking-widest text-sm">
                    <Info size={16}/> {entry.term}
                </h3>
                <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                    <X size={18}/>
                </button>
            </div>
            <div className="p-6">
                <p className="text-gray-300 leading-relaxed text-sm italic">
                    {entry.definition}
                </p>
            </div>
            <div className="p-4 bg-black/20 text-center">
                <button onClick={onClose} className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Đóng giải nghĩa</button>
            </div>
        </div>
    </div>
);

const ChoiceMenu: React.FC<{ choices: Choice[], onSelect: (c: Choice) => void }> = ({ choices, onSelect }) => (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-6 animate-in fade-in duration-500 pointer-events-none">
        <div className="flex flex-col gap-4 w-full max-w-lg pointer-events-auto">
            {choices.map((c, idx) => (
                <button 
                    key={idx} 
                    onClick={(e) => { e.stopPropagation(); onSelect(c); }}
                    className="group relative overflow-hidden bg-gray-900/90 hover:bg-blue-900/90 border border-white/20 hover:border-blue-400/50 text-white py-5 px-8 rounded-xl text-lg font-medium shadow-2xl transition-all hover:scale-105 active:scale-95 text-center backdrop-blur-md"
                >
                    <span className="relative z-10">{c.text}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </button>
            ))}
        </div>
    </div>
);

const ControlBar: React.FC<{
    onMenu: () => void,
    onHistory: () => void,
    onAutoPlay: () => void,
    isAutoPlay: boolean
}> = ({ onMenu, onHistory, onAutoPlay, isAutoPlay }) => (
    <div className="absolute top-0 right-0 p-6 z-40 flex gap-3">
        <button onClick={onAutoPlay} className={`p-3 rounded-full backdrop-blur-md border border-white/10 transition-all hover:scale-110 ${isAutoPlay ? 'bg-blue-600 text-white' : 'bg-black/30 text-white/70 hover:bg-black/50 hover:text-white'}`}>
            {isAutoPlay ? <PauseCircle size={20} /> : <PlayCircle size={20} />}
        </button>
        <button onClick={onHistory} className="p-3 bg-black/30 hover:bg-black/50 text-white/70 hover:text-white rounded-full backdrop-blur-md border border-white/10 transition-all hover:scale-110">
            <History size={20} />
        </button>
        <button onClick={onMenu} className="p-3 bg-black/30 hover:bg-black/50 text-white/70 hover:text-white rounded-full backdrop-blur-md border border-white/10 transition-all hover:scale-110">
            <Menu size={20} />
        </button>
    </div>
);

// --- OVERLAY: GAME MENU ---
const GameMenuOverlay: React.FC<{ 
    onClose: () => void, 
    onSave: () => void, 
    onLoad: () => void, 
    onSettings: () => void, 
    onExit: () => void 
}> = ({ onClose, onSave, onLoad, onSettings, onExit }) => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
        <div className="w-full max-w-xs space-y-4">
            <button onClick={onSave} className="w-full bg-white/10 hover:bg-white/20 border border-white/10 p-4 rounded-2xl flex items-center gap-4 text-white font-bold transition-all hover:scale-105 active:scale-95 shadow-xl">
                <div className="p-2 bg-blue-600 rounded-lg"><Save size={20}/></div> Lưu Game
            </button>
            <button onClick={onLoad} className="w-full bg-white/10 hover:bg-white/20 border border-white/10 p-4 rounded-2xl flex items-center gap-4 text-white font-bold transition-all hover:scale-105 active:scale-95 shadow-xl">
                <div className="p-2 bg-green-600 rounded-lg"><Download size={20}/></div> Tải Game
            </button>
            <button onClick={onSettings} className="w-full bg-white/10 hover:bg-white/20 border border-white/10 p-4 rounded-2xl flex items-center gap-4 text-white font-bold transition-all hover:scale-105 active:scale-95 shadow-xl">
                <div className="p-2 bg-purple-600 rounded-lg"><Settings size={20}/></div> Cài đặt
            </button>
            <button onClick={onExit} className="w-full bg-red-900/20 hover:bg-red-900/40 border border-red-500/30 p-4 rounded-2xl flex items-center gap-4 text-red-400 font-bold transition-all hover:scale-105 active:scale-95 shadow-xl">
                <div className="p-2 bg-red-600 rounded-lg text-white"><LogOut size={20}/></div> Thoát truyện
            </button>
            <button onClick={onClose} className="w-full py-4 text-gray-500 font-black uppercase text-xs tracking-[0.2em] hover:text-white transition-colors">
                Quay lại
            </button>
        </div>
    </div>
);

// --- OVERLAY: HISTORY BACKLOG ---
const HistoryOverlay: React.FC<{ history: HistoryEntry[], onClose: () => void, onJump: (entry: HistoryEntry) => void }> = ({ history, onClose, onJump }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, []);

    return (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-xl flex flex-col p-6 animate-in slide-in-from-bottom-full duration-500">
            <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
                <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
                    <History className="text-blue-500"/> Nhật ký hội thoại
                </h2>
                <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                    <X size={24}/>
                </button>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 px-4 custom-scrollbar pb-10">
                {history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-700">
                        <History size={48} className="opacity-10 mb-4"/>
                        <span className="text-xs font-bold uppercase tracking-widest">Không có dữ liệu lịch sử</span>
                    </div>
                ) : (
                    history.map((entry, idx) => (
                        <div key={idx} className="animate-in fade-in duration-300 group relative">
                            {entry.type === 'choice' ? (
                                <div className="flex justify-end mb-2">
                                    <div className="bg-blue-900/40 text-blue-200 px-4 py-1.5 rounded-l-xl rounded-tr-xl text-[11px] border border-blue-500/30 italic flex items-center gap-2">
                                        <CornerDownRight size={12}/> Đã chọn: {entry.text}
                                    </div>
                                </div>
                            ) : (
                                <div className="relative">
                                    {entry.characterName && (
                                        <div className="text-blue-400 font-black text-[10px] uppercase tracking-widest mb-1">{entry.characterName}</div>
                                    )}
                                    <div className="text-gray-300 leading-relaxed text-sm md:text-base border-l-2 border-white/5 pl-4 py-1" dangerouslySetInnerHTML={{ __html: entry.text }} />
                                    
                                    {entry.sceneId && (
                                        <button 
                                            onClick={() => onJump(entry)}
                                            className="absolute top-1/2 -translate-y-1/2 right-4 p-2 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2 text-[10px] font-bold"
                                        >
                                            <CornerDownRight size={14}/> QUAY LẠI CẢNH NÀY
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

interface GamePlayerProps {
    story: Story;
    initialSceneId?: string;
    initialGameState?: Partial<SaveState>;
    settings: ReaderSettings;
    onSettingsChange: (s: ReaderSettings) => void;
    onExit: () => void;
}

const GamePlayer: React.FC<GamePlayerProps> = ({ 
    story, initialSceneId, initialGameState, settings, onSettingsChange, onExit 
}) => {
    const [sceneId, setSceneId] = useState(initialSceneId || story.startSceneId);
    const [dialogueIndex, setDialogueIndex] = useState(initialGameState?.currentDialogueIndex || 0);
    const [history, setHistory] = useState(initialGameState?.history || []);
    const [isTextFinished, setIsTextFinished] = useState(false);
    
    const [showHistory, setShowHistory] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [saveMode, setSaveMode] = useState<'save' | 'load' | null>(null);
    const [autoPlay, setAutoPlay] = useState(false);
    const [activeTerm, setActiveTerm] = useState<GlossaryEntry | null>(null);
    const isRestoringRef = useRef(false);

    const scene: Scene = story.scenes[sceneId] || { 
        id: 'error', 
        text: 'Cảnh không tìm thấy.', 
        choices: [{ text: "Thoát", nextSceneId: "__EXIT__" }] 
    } as Scene;

    const dialogueList = scene.dialogues || [{ text: scene.text, characterName: scene.characterName, voice: scene.voice }];
    const safeIndex = Math.min(Math.max(0, dialogueIndex), dialogueList.length - 1);
    const currentDialogue = dialogueList[safeIndex] || { text: "..." };

    const isLastDialogue = safeIndex >= dialogueList.length - 1;
    const hasChoices = scene.choices && scene.choices.length > 0;
    const isWaitingForChoice = isLastDialogue && hasChoices;

    const { displayedText, isTyping, forceComplete } = useTypewriter(
        currentDialogue.text, 
        settings.textSpeed === 'instant' ? 0 : (settings.textSpeed === 'fast' ? 15 : settings.textSpeed === 'slow' ? 60 : 30),
        () => setIsTextFinished(true)
    );

    const { playSfx } = useStoryAudio(
        scene.bgm, 
        currentDialogue.voice, 
        settings
    );

    // SFX on scene change
    useEffect(() => {
        if (scene.sfx) {
            playSfx(scene.sfx);
        }
    }, [sceneId]);

    useEffect(() => {
        if (isRestoringRef.current) {
             forceComplete();
             setIsTextFinished(true);
             isRestoringRef.current = false;
        } 
    }, [currentDialogue.text, forceComplete]); 

    useEffect(() => {
        if (autoPlay && isTextFinished && !isWaitingForChoice && !showHistory && !showSettings && !saveMode && !showMenu && !activeTerm) {
            const timer = setTimeout(() => handleAdvance(), settings.autoPlaySpeed);
            return () => clearTimeout(timer);
        }
    }, [autoPlay, isTextFinished, isWaitingForChoice, showHistory, showSettings, saveMode, showMenu, activeTerm]);

    const addToHistory = () => {
        setHistory(prev => [...prev, { 
            type: 'dialogue',
            text: currentDialogue.text, 
            characterName: currentDialogue.characterName, 
            voice: currentDialogue.voice,
            sceneId: sceneId,
            dialogueIndex: safeIndex
        }]);
    };

    const handleAdvance = () => {
        if (showHistory || showSettings || saveMode || showMenu || activeTerm) return;
        if (isTyping) { forceComplete(); return; }
        if (isWaitingForChoice) return;

        addToHistory();
        setIsTextFinished(false);

        if (!isLastDialogue) {
            setDialogueIndex(prev => prev + 1);
        } else {
            if (scene.nextSceneId) {
                if (scene.nextSceneId === '__EXIT__') onExit();
                else { setSceneId(scene.nextSceneId); setDialogueIndex(0); }
            } else {
                const allScenes = Object.values(story.scenes) as Scene[];
                const episodeScenes = allScenes.filter(s => s.episodeId === scene.episodeId).sort((a,b) => (a.order || 0) - (b.order || 0));
                const currentIndex = episodeScenes.findIndex(s => s.id === scene.id);
                if (currentIndex >= 0 && currentIndex < episodeScenes.length - 1) {
                    setSceneId(episodeScenes[currentIndex + 1].id);
                    setDialogueIndex(0);
                } else onExit();
            }
        }
    };

    const handleChoice = (c: Choice) => {
        if (c.sound) playSfx(c.sound);
        
        // Record current dialogue to history before recording the choice
        addToHistory();
        
        // Record the choice itself
        setHistory(prev => [...prev, { 
            type: 'choice',
            text: c.text,
            sceneId: sceneId,
            dialogueIndex: safeIndex
        }]);

        setIsTextFinished(false);
        if (c.nextSceneId === '__EXIT__') onExit();
        else { setSceneId(c.nextSceneId); setDialogueIndex(0); }
    };

    const handleJumpToHistory = (entry: HistoryEntry) => {
        if (!entry.sceneId) return;
        
        isRestoringRef.current = true;
        setSceneId(entry.sceneId);
        setDialogueIndex(entry.dialogueIndex || 0);
        
        const entryIdx = history.findIndex(h => h.sceneId === entry.sceneId && h.dialogueIndex === entry.dialogueIndex);
        if (entryIdx >= 0) {
            setHistory(history.slice(0, entryIdx));
        }
        
        setShowHistory(false);
        setAutoPlay(false);
    };

    const handleTermClick = (termId: string) => {
        if (story.glossary && story.glossary[termId]) {
            setActiveTerm(story.glossary[termId]);
        }
    };

    const characters = scene.characters || (scene.characterImage ? [{ image: scene.characterImage, position: scene.characterPosition || 'center' }] : []);

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden font-sans select-none">
            <VisualStage 
                background={scene.backgroundImage} 
                characters={characters} 
                activeName={currentDialogue.characterName} 
            />
            
            <ControlBar 
                onMenu={() => setShowMenu(true)} 
                onHistory={() => setShowHistory(true)} 
                onAutoPlay={() => setAutoPlay(!autoPlay)}
                isAutoPlay={autoPlay}
            />

            {settings.displayMode === 'scroll' ? (
                <ScrollView 
                    history={history} currentText={displayedText} currentName={currentDialogue.characterName}
                    isTyping={isTyping} choices={scene.choices} isWaitingForChoice={isWaitingForChoice && isTextFinished}
                    onAdvance={handleAdvance} onChoice={handleChoice} onJump={handleJumpToHistory} onTermClick={handleTermClick} settings={settings}
                />
            ) : (
                <>
                    <DialogueBox 
                        text={displayedText} name={currentDialogue.characterName} isTyping={isTyping} 
                        onAdvance={handleAdvance} onTermClick={handleTermClick} settings={settings}
                    />
                    {isWaitingForChoice && isTextFinished && <ChoiceMenu choices={scene.choices} onSelect={handleChoice} />}
                </>
            )}

            {/* Overlays & Modals */}
            {activeTerm && <GlossaryPopup entry={activeTerm} onClose={() => setActiveTerm(null)} />}

            {showMenu && (
                <GameMenuOverlay 
                    onClose={() => setShowMenu(false)}
                    onSave={() => { setSaveMode('save'); setShowMenu(false); }}
                    onLoad={() => { setSaveMode('load'); setShowMenu(false); }}
                    onSettings={() => { setShowSettings(true); setShowMenu(false); }}
                    onExit={onExit}
                />
            )}

            {showHistory && (
                <HistoryOverlay 
                    history={history} 
                    onClose={() => setShowHistory(false)} 
                    onJump={handleJumpToHistory}
                />
            )}

            <SettingsModal 
                isOpen={showSettings} 
                onClose={() => setShowSettings(false)} 
                settings={settings} 
                onUpdateSettings={(s) => { onSettingsChange(s); saveSettings(s); }} 
            />

            {saveMode && (
                <SaveLoadModal 
                    isOpen={true} 
                    mode={saveMode} 
                    onClose={() => setSaveMode(null)} 
                    currentStory={story} 
                    currentSceneId={sceneId} 
                    extraSaveData={{ currentDialogueIndex: dialogueIndex, history }} 
                    onLoadGame={(s) => { 
                        setSceneId(s.currentSceneId); 
                        setDialogueIndex(s.currentDialogueIndex || 0); 
                        setHistory(s.history || []); 
                        setSaveMode(null); 
                    }} 
                />
            )}
        </div>
    );
};

export default GamePlayer;
