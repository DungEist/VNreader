import React, { useState, useEffect, useRef } from 'react';
import { Settings, Save, Home, SkipForward, PlayCircle, PauseCircle, History, X, ChevronDown, Menu, LogOut, RotateCcw, HelpCircle } from 'lucide-react';
import { Story, ReaderSettings, SaveState, Choice, HistoryEntry } from '../types';
import { useTypewriter } from '../hooks/useTypewriter';
import { useStoryAudio } from '../hooks/useStoryAudio';
import { saveSettings } from '../utils/storage';
import SettingsModal from './SettingsModal';
import SaveLoadModal from './SaveLoadModal';

// --- VISUAL LAYER ---
const VisualStage: React.FC<{ background?: string, characters: any[] }> = ({ background, characters }) => {
    const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        e.currentTarget.style.display = 'none';
    };

    return (
        <div className="absolute inset-0 z-0 bg-black overflow-hidden select-none pointer-events-none">
            {/* Background with subtle zoom effect for liveliness */}
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
                <div className="absolute inset-0 bg-black/10"></div> {/* Vignette overlay */}
            </div>
            
            {/* Characters */}
            {characters.map((char, idx) => (
                <img 
                    key={`${char.image}-${idx}`}
                    src={char.image}
                    className="absolute bottom-0 max-h-[85vh] h-auto w-auto object-contain transition-all duration-500 ease-out z-10"
                    style={{ 
                        left: char.position === 'left' ? '20%' : char.position === 'right' ? '80%' : '50%', 
                        transform: 'translateX(-50%)',
                        filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.5))'
                    }}
                    alt="char"
                    onError={handleImgError}
                />
            ))}
        </div>
    );
};

// --- DIALOGUE BOX (Redesigned) ---
const DialogueBox: React.FC<{ 
    text: string, 
    name?: string, 
    isTyping: boolean, 
    onAdvance: () => void,
    onContentClick: (e: React.MouseEvent) => void,
    settings: ReaderSettings 
}> = ({ text, name, isTyping, onAdvance, onContentClick, settings }) => (
    <div className="absolute bottom-0 left-0 w-full pb-8 pt-24 px-4 z-20 flex justify-center bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none">
        <div 
            className="w-full max-w-4xl pointer-events-auto cursor-pointer group relative" 
            onClick={(e) => {
                // Check if user clicked on a glossary term
                const target = e.target as HTMLElement;
                if (target.closest('.vn-glossary-term')) {
                    onContentClick(e);
                    return;
                }
                onAdvance();
            }}
        >
            {/* Character Name Tag - Floating above */}
            {name && (
                <div className="absolute -top-6 left-0 z-10 animate-in slide-in-from-left-2 fade-in duration-300">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 text-blue-200 font-bold text-lg px-6 py-1 rounded-t-lg rounded-br-lg shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
                        {name}
                    </div>
                </div>
            )}

            {/* Text Box */}
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
                
                {/* Typing Indicator / Next Indicator */}
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

// --- SCROLL VIEW COMPONENT (NEW) ---
const ScrollView: React.FC<{
    history: HistoryEntry[],
    currentText: string,
    currentName?: string,
    isTyping: boolean,
    choices: Choice[],
    isWaitingForChoice: boolean,
    onAdvance: () => void,
    onChoice: (c: Choice) => void,
    onContentClick: (e: React.MouseEvent) => void,
    settings: ReaderSettings
}> = ({ 
    history, currentText, currentName, isTyping, choices, isWaitingForChoice, 
    onAdvance, onChoice, onContentClick, settings 
}) => {
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto scroll to bottom when content updates
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history.length, currentText, isTyping, choices]);

    const getFontStyle = () => {
        const sizeClass = settings.fontSize === 'xlarge' ? 'text-2xl' : settings.fontSize === 'large' ? 'text-xl' : settings.fontSize === 'medium' ? 'text-lg' : 'text-base';
        const fontClass = settings.fontFamily === 'serif' ? 'font-serif' : settings.fontFamily === 'mono' ? 'font-mono' : 'font-sans';
        return `${sizeClass} ${fontClass}`;
    };

    return (
        <div 
            className="absolute inset-0 z-20 overflow-y-auto px-4 pb-32 pt-20 flex flex-col items-center"
            onClick={(e) => {
                const target = e.target as HTMLElement;
                if (!target.closest('button') && !target.closest('.vn-glossary-term')) {
                    onAdvance();
                }
            }}
        >
            <div className="w-full max-w-3xl space-y-6">
                {/* RENDER HISTORY */}
                {history.map((entry, idx) => (
                    <div key={idx} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {entry.type === 'choice' ? (
                            <div className="flex justify-end">
                                <div className="bg-blue-900/40 text-blue-200 px-4 py-2 rounded-l-xl rounded-tr-xl text-sm border border-blue-500/30 italic">
                                    Đã chọn: {entry.text}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1 items-start">
                                {entry.characterName && (
                                    <div className="text-blue-300 font-bold text-sm px-2 drop-shadow-md">{entry.characterName}</div>
                                )}
                                <div 
                                    className={`bg-black/60 backdrop-blur-md text-gray-200 px-6 py-4 rounded-2xl border border-white/10 shadow-lg ${getFontStyle()}`}
                                    onClick={onContentClick}
                                    dangerouslySetInnerHTML={{ __html: entry.text }}
                                />
                            </div>
                        )}
                    </div>
                ))}

                {/* RENDER CURRENT TYPING TEXT */}
                <div className="flex flex-col gap-1 items-start min-h-[80px]">
                    {currentName && (
                        <div className="text-blue-300 font-bold text-sm px-2 drop-shadow-md">{currentName}</div>
                    )}
                    <div 
                        className={`bg-black/70 backdrop-blur-md text-white px-6 py-4 rounded-2xl border border-blue-500/30 shadow-xl w-full relative ${getFontStyle()}`}
                        onClick={onContentClick}
                    >
                         <div dangerouslySetInnerHTML={{ __html: currentText }} />
                         {!isTyping && !isWaitingForChoice && (
                             <div className="absolute bottom-2 right-4 text-blue-400 animate-bounce">
                                 <ChevronDown size={20}/>
                             </div>
                         )}
                    </div>
                </div>

                {/* RENDER CHOICES INLINE */}
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

// --- CHOICE MENU (Overlay for VN Mode) ---
const ChoiceMenu: React.FC<{ choices: Choice[], onSelect: (c: Choice) => void }> = ({ choices, onSelect }) => (
    // Removed bg-black/70 and backdrop-blur-sm. 
    // Kept z-30 to stay above DialogueBox.
    <div className="absolute inset-0 z-30 flex items-center justify-center p-6 animate-in fade-in duration-500 pointer-events-none">
        <div className="flex flex-col gap-4 w-full max-w-lg pointer-events-auto">
            {/* Removed the 'Đưa ra quyết định' header */}
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

// --- MENU BUTTONS (Minimalist) ---
const ControlBar: React.FC<{
    onMenu: () => void,
    onHistory: () => void,
    onAutoPlay: () => void,
    isAutoPlay: boolean
}> = ({ onMenu, onHistory, onAutoPlay, isAutoPlay }) => (
    <div className="absolute top-0 right-0 p-6 z-40 flex gap-3">
        <button 
            onClick={onAutoPlay} 
            className={`p-3 rounded-full backdrop-blur-md border border-white/10 transition-all hover:scale-110 ${isAutoPlay ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'bg-black/30 text-white/70 hover:bg-black/50 hover:text-white'}`}
            title="Tự động chạy"
        >
            {isAutoPlay ? <PauseCircle size={20} /> : <PlayCircle size={20} />}
        </button>
        <button 
            onClick={onHistory} 
            className="p-3 bg-black/30 hover:bg-black/50 text-white/70 hover:text-white rounded-full backdrop-blur-md border border-white/10 transition-all hover:scale-110"
            title="Lịch sử hội thoại"
        >
            <History size={20} />
        </button>
        <button 
            onClick={onMenu} 
            className="p-3 bg-black/30 hover:bg-black/50 text-white/70 hover:text-white rounded-full backdrop-blur-md border border-white/10 transition-all hover:scale-110"
            title="Menu"
        >
            <Menu size={20} />
        </button>
    </div>
);

// --- PAUSE/MENU MODAL ---
const InGameMenu: React.FC<{
    isOpen: boolean,
    onClose: () => void,
    onSave: () => void,
    onLoad: () => void,
    onSettings: () => void,
    onExit: () => void
}> = ({ isOpen, onClose, onSave, onLoad, onSettings, onExit }) => {
    if (!isOpen) return null;
    return (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200">
            <div className="bg-gray-900 border border-white/10 p-8 rounded-2xl shadow-2xl min-w-[300px] space-y-4">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Menu Game</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X/></button>
                </div>
                <button onClick={onSave} className="w-full flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-left text-gray-200 transition-colors"><Save size={18}/> Lưu Game</button>
                <button onClick={onLoad} className="w-full flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-left text-gray-200 transition-colors"><SkipForward size={18}/> Tải Game</button>
                <button onClick={onSettings} className="w-full flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-left text-gray-200 transition-colors"><Settings size={18}/> Cài Đặt</button>
                <div className="h-px bg-gray-700 my-2"></div>
                <button onClick={onExit} className="w-full flex items-center gap-3 p-3 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-lg text-left transition-colors"><LogOut size={18}/> Thoát Game</button>
            </div>
        </div>
    );
}

// --- MAIN COMPONENT ---

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
    // --- STATE ---
    const [sceneId, setSceneId] = useState(initialSceneId || story.startSceneId);
    const [dialogueIndex, setDialogueIndex] = useState(initialGameState?.currentDialogueIndex || 0);
    const [history, setHistory] = useState(initialGameState?.history || []);
    const [isTextFinished, setIsTextFinished] = useState(false); // New state to track if typewriter is done
    
    // UI State
    const [showHistory, setShowHistory] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [saveMode, setSaveMode] = useState<'save' | 'load' | null>(null);
    const [autoPlay, setAutoPlay] = useState(false);

    // Glossary State
    const [activeGlossary, setActiveGlossary] = useState<{ term: string, note: string } | null>(null);

    // Jump State Reference to handle Typewriter race condition
    const isRestoringRef = useRef(false);

    // Get current scene data (with safety fallback)
    const scene = story.scenes[sceneId] || { 
        id: 'error', 
        text: 'Lỗi: Không tìm thấy cảnh này (ID: ' + sceneId + '). File cốt truyện có thể bị hỏng.', 
        choices: [{ text: "Quay về màn hình chính", nextSceneId: "__EXIT__" }] 
    };

    // Resolve current dialogue chunk
    const dialogueList = scene.dialogues || [{ text: scene.text, characterName: scene.characterName, voice: scene.voice }];
    const safeIndex = Math.min(Math.max(0, dialogueIndex), dialogueList.length - 1);
    const currentDialogue = dialogueList[safeIndex] || { text: "..." };

    // Determine Logic State
    const isLastDialogue = safeIndex >= dialogueList.length - 1;
    const hasChoices = scene.choices && scene.choices.length > 0;
    const isWaitingForChoice = isLastDialogue && hasChoices;

    // --- HOOKS ---
    const { displayedText, isTyping, forceComplete } = useTypewriter(
        currentDialogue.text, 
        settings.textSpeed === 'instant' ? 0 : (settings.textSpeed === 'fast' ? 15 : settings.textSpeed === 'slow' ? 60 : 30),
        () => setIsTextFinished(true) // Set finished when Typewriter completes
    );

    const { playSfx } = useStoryAudio(
        scene.bgm, 
        currentDialogue.voice, 
        settings
    );

    // --- EFFECTS ---

    // Handle Typewriter Restoration Race Condition
    useEffect(() => {
        // If we are restoring state (jumping), force complete immediately
        if (isRestoringRef.current) {
             forceComplete();
             setIsTextFinished(true);
             isRestoringRef.current = false;
        } 
        // Note: We removed the 'else { setIsTextFinished(false) }' block.
        // The reset to false is now handled explicitly in handleAdvance/handleChoice
        // to prevent UI flickering during the React render cycle.
    }, [currentDialogue.text, forceComplete]); 

    // Handle AutoPlay
    useEffect(() => {
        if (autoPlay && isTextFinished && !isWaitingForChoice && !showHistory && !showSettings && !saveMode && !showMenu && !activeGlossary) {
            const timer = setTimeout(() => handleAdvance(), settings.autoPlaySpeed);
            return () => clearTimeout(timer);
        }
    }, [autoPlay, isTextFinished, isWaitingForChoice, showHistory, showSettings, saveMode, showMenu, activeGlossary]);

    // Play SFX on scene enter
    useEffect(() => {
        if(scene.sfx) playSfx(scene.sfx);
    }, [sceneId]);

    // --- ACTIONS ---
    const addToHistory = () => {
        setHistory(prev => [...prev, { 
            text: currentDialogue.text, 
            characterName: currentDialogue.characterName, 
            voice: currentDialogue.voice,
            // Capture state for jump back
            sceneId: sceneId,
            dialogueIndex: safeIndex
        }]);
    };

    const handleAdvance = () => {
        if (showHistory || showSettings || saveMode || showMenu || activeGlossary) return;

        if (isTyping) {
            forceComplete();
            return;
        }

        if (isWaitingForChoice) return;

        addToHistory();
        setIsTextFinished(false); // CRITICAL: Reset immediately to prevent flash

        if (!isLastDialogue) {
            setDialogueIndex(prev => prev + 1);
        } else {
            if (scene.nextSceneId) {
                if (scene.nextSceneId === '__EXIT__') onExit();
                else {
                    setSceneId(scene.nextSceneId);
                    setDialogueIndex(0);
                }
            }
        }
    };

    const handleChoice = (c: Choice) => {
        if (c.sound) playSfx(c.sound);
        addToHistory();
        setHistory(prev => [...prev, { text: c.text, characterName: 'Quyết định', type: 'choice', sceneId: sceneId, dialogueIndex: safeIndex }]);
        setIsTextFinished(false); // CRITICAL: Reset immediately

        if (c.nextSceneId === '__EXIT__') onExit();
        else {
            setSceneId(c.nextSceneId);
            setDialogueIndex(0);
        }
    };

    const handleLoadGame = (save: SaveState) => {
        if(save.storyId !== story.id) { 
            if(!confirm("File save này thuộc về cốt truyện khác. Bạn có muốn thử load không? (Có thể gây lỗi)")) return;
        }
        isRestoringRef.current = true; // Flag as restoring
        setSceneId(save.currentSceneId);
        setDialogueIndex(save.currentDialogueIndex || 0);
        setHistory(save.history || []);
        setSaveMode(null);
        setShowMenu(false);
        setAutoPlay(false);
    };

    // --- GLOSSARY HANDLER ---
    const handleContentClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        const glossaryTerm = target.closest('.vn-glossary-term') as HTMLElement;
        
        if (glossaryTerm) {
            e.stopPropagation();
            const note = glossaryTerm.dataset.note;
            const term = glossaryTerm.innerText;
            if (note) {
                setActiveGlossary({ term, note });
            }
        }
    };

    // --- JUMP HANDLER ---
    const jumpToHistory = (entry: HistoryEntry) => {
        if (!entry.sceneId) return;
        
        // Removed Confirmation Dialog as requested
        
        // Cut history to the point of jump
        const entryIndex = history.indexOf(entry);
        const newHistory = entryIndex >= 0 ? history.slice(0, entryIndex) : history;
        
        // Set restoring flag to avoid typing animation
        isRestoringRef.current = true;

        setHistory(newHistory);
        setSceneId(entry.sceneId);
        setDialogueIndex(entry.dialogueIndex || 0);
        
        setShowHistory(false);
        setAutoPlay(false);
    };

    // Helper for characters
    const characters = Array.isArray(scene.characters) 
        ? scene.characters 
        : (scene.characterImage && scene.characterImage !== 'none' ? [{ image: scene.characterImage, position: scene.characterPosition || 'center' }] : []);

    // Check display mode from settings (default 'vn' if undefined)
    const isScrollMode = settings.displayMode === 'scroll';

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden font-sans select-none">
            <VisualStage background={scene.backgroundImage} characters={characters} />
            
            <ControlBar 
                onMenu={() => setShowMenu(true)} 
                onHistory={() => setShowHistory(true)} 
                onAutoPlay={() => setAutoPlay(!autoPlay)}
                isAutoPlay={autoPlay}
            />

            {isScrollMode ? (
                /* --- SCROLL MODE --- */
                <ScrollView 
                    history={history}
                    currentText={displayedText}
                    currentName={currentDialogue.characterName}
                    isTyping={isTyping}
                    choices={scene.choices}
                    isWaitingForChoice={isWaitingForChoice && isTextFinished}
                    onAdvance={handleAdvance}
                    onChoice={handleChoice}
                    onContentClick={handleContentClick}
                    settings={settings}
                />
            ) : (
                /* --- CLASSIC VN MODE --- */
                <>
                    <DialogueBox 
                        text={displayedText} 
                        name={currentDialogue.characterName} 
                        isTyping={isTyping} 
                        onAdvance={handleAdvance}
                        onContentClick={handleContentClick}
                        settings={settings}
                    />

                    {isWaitingForChoice && isTextFinished && (
                        <ChoiceMenu choices={scene.choices} onSelect={handleChoice} />
                    )}
                </>
            )}

            <InGameMenu 
                isOpen={showMenu}
                onClose={() => setShowMenu(false)}
                onSave={() => setSaveMode('save')}
                onLoad={() => setSaveMode('load')}
                onSettings={() => setShowSettings(true)}
                onExit={onExit}
            />

            {/* Glossary Modal */}
            {activeGlossary && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-gray-900 border border-blue-500/50 p-6 rounded-lg max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button 
                            onClick={() => setActiveGlossary(null)} 
                            className="absolute top-2 right-2 text-gray-400 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                        <h3 className="text-lg font-bold text-blue-400 mb-2 border-b border-gray-700 pb-2 flex items-center gap-2">
                             <HelpCircle size={18}/> {activeGlossary.term}
                        </h3>
                        <p className="text-gray-200 leading-relaxed text-sm whitespace-pre-line">
                            {activeGlossary.note}
                        </p>
                    </div>
                </div>
            )}

            {/* History Modal (Only needed for VN mode usually, but kept accessible in Scroll Mode too via button) */}
            {showHistory && (
                <div className="fixed inset-0 z-50 bg-black/95 flex flex-col p-8 animate-in slide-in-from-right-10">
                    <div className="max-w-4xl mx-auto w-full flex flex-col h-full">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
                            <h2 className="text-2xl font-bold text-gray-200 flex gap-2"><History/> Nhật ký thoại</h2>
                            <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-gray-800 rounded-full"><X className="text-gray-400"/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar">
                            {history.length === 0 && <div className="text-gray-500 italic text-center mt-20">Trang nhật ký còn trống.</div>}
                            {history.map((h, i) => (
                                <div key={i} className="flex flex-col gap-1 group relative pl-2 border-l-2 border-transparent hover:border-blue-800/50 transition-colors">
                                    {h.type === 'choice' ? (
                                        <div className="text-yellow-500 italic text-sm self-center my-2 border border-yellow-500/30 px-4 py-1 rounded-full bg-yellow-500/10">
                                            Đã chọn: {h.text}
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1" onClick={handleContentClick}>
                                                {h.characterName && <div className="text-blue-400 font-bold text-sm">{h.characterName}</div>}
                                                {/* Enable Glossary Clicks in History too */}
                                                <div 
                                                    className="text-gray-300 bg-gray-900/50 p-3 rounded-lg border border-gray-800 hover:bg-gray-800/80 transition-colors" 
                                                    dangerouslySetInnerHTML={{__html: h.text}}
                                                />
                                            </div>
                                            
                                            {/* Jump Button */}
                                            {h.sceneId && (
                                                <button 
                                                    onClick={() => jumpToHistory(h)}
                                                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-full transition-all"
                                                    title="Quay lại thời điểm này"
                                                >
                                                    <RotateCcw size={18} />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} settings={settings} onUpdateSettings={(s) => { onSettingsChange(s); saveSettings(s); }} />
            
            {saveMode && (
                <SaveLoadModal 
                    isOpen={true} 
                    mode={saveMode} 
                    onClose={() => setSaveMode(null)} 
                    currentStory={story} 
                    currentSceneId={sceneId}
                    extraSaveData={{ currentDialogueIndex: dialogueIndex, history }}
                    onLoadGame={handleLoadGame}
                />
            )}
        </div>
    );
};

export default GamePlayer;