import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Story, Scene } from '../types';
import { ArrowDown, Move, MousePointer, Link2 } from 'lucide-react';

interface StoryGraphProps {
  story: Story;
  currentEpisodeId?: string; // Only show scenes from this episode
  onSceneClick: (id: string) => void;
  onSceneUpdate: (updatedScenes: Record<string, Scene>) => void;
  onSceneConnect: (sourceId: string, targetId: string, choiceIndex?: number) => void;
}

const GRID_SIZE = 20;
const NODE_WIDTH = 220;
const HEADER_HEIGHT = 36;
const BODY_BASE_HEIGHT = 60; // Minimum height for text area
const CHOICE_ROW_HEIGHT = 32;

const StoryGraph: React.FC<StoryGraphProps> = ({ 
    story, 
    currentEpisodeId,
    onSceneClick, 
    onSceneUpdate,
    onSceneConnect
}) => {
    // --- STATE ---
    // Filter scenes
    const scenes = useMemo(() => {
        const allScenes = Object.values(story.scenes) as Scene[];
        if (!currentEpisodeId) return allScenes;
        return allScenes.filter(s => s.episodeId === currentEpisodeId);
    }, [story.scenes, currentEpisodeId]);

    // Canvas State
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(1);
    const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
    
    // Node Drag State
    const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
    
    // Connection State
    const [connectingParams, setConnectingParams] = useState<{ sourceId: string, choiceIndex?: number } | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 }); // Local coordinate for connection line

    // Refs for drag math
    const dragStartPos = useRef({ x: 0, y: 0 }); // For canvas offset or node relative position
    const dragStartMouse = useRef({ x: 0, y: 0 }); // For click detection (distinguish drag vs click)
    const containerRef = useRef<HTMLDivElement>(null);

    // --- AUTO LAYOUT INITIALIZATION ---
    useEffect(() => {
        // If scenes don't have X/Y, give them a default grid layout to prevent stacking
        const unpositionedScenes = scenes.filter(s => s.x === undefined || s.y === undefined);
        if (unpositionedScenes.length > 0) {
            const updates: Record<string, Scene> = {};
            let currentX = 100;
            let currentY = 100;
            
            // Simple sort by order or id
            unpositionedScenes.sort((a,b) => (a.order || 0) - (b.order || 0)).forEach((s, idx) => {
                updates[s.id] = {
                    ...s,
                    x: currentX + (idx % 5) * 280,
                    y: currentY + Math.floor(idx / 5) * 200
                };
            });
            onSceneUpdate(updates);
        }
    }, [scenes.length]); // Run when scene count changes (e.g. added new scene)

    // --- MOUSE HANDLERS ---
    
    // Helper: Convert Screen ClientXY to Canvas Coordinate
    const getCanvasPos = (clientX: number, clientY: number) => {
        if (!containerRef.current) return { x: 0, y: 0 };
        const rect = containerRef.current.getBoundingClientRect();
        return {
            x: (clientX - rect.left - offset.x) / scale,
            y: (clientY - rect.top - offset.y) / scale
        };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        // Allow drag on background with Left Click (0) or Middle Click (1)
        // Nodes and Ports stop propagation, so this only fires on empty space
        if (e.button === 0 || e.button === 1) {
            e.preventDefault();
            setIsDraggingCanvas(true);
            dragStartPos.current = { x: e.clientX, y: e.clientY };
            return;
        }
    };

    const handleNodeMouseDown = (e: React.MouseEvent, sceneId: string) => {
        e.stopPropagation();
        setDraggingNodeId(sceneId);
        
        // Track start position to distinguish click vs drag later
        dragStartMouse.current = { x: e.clientX, y: e.clientY };

        const pos = getCanvasPos(e.clientX, e.clientY);
        const scene = story.scenes[sceneId];
        // Store offset from node top-left
        dragStartPos.current = { 
            x: pos.x - (scene.x || 0), 
            y: pos.y - (scene.y || 0) 
        };
    };

    const handlePortMouseDown = (e: React.MouseEvent, sceneId: string, choiceIndex?: number) => {
        e.stopPropagation();
        e.preventDefault();
        setConnectingParams({ sourceId: sceneId, choiceIndex });
        const pos = getCanvasPos(e.clientX, e.clientY);
        setMousePos(pos);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDraggingCanvas) {
            const dx = e.clientX - dragStartPos.current.x;
            const dy = e.clientY - dragStartPos.current.y;
            setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            dragStartPos.current = { x: e.clientX, y: e.clientY };
            return;
        }

        const pos = getCanvasPos(e.clientX, e.clientY);

        if (draggingNodeId) {
            // Update node position
            const newX = Math.round((pos.x - dragStartPos.current.x) / 10) * 10; // Snap grid
            const newY = Math.round((pos.y - dragStartPos.current.y) / 10) * 10;
            
            // We update local state via prop callback (StoryEditor should debounce this ideally)
            const updatedScene = { ...story.scenes[draggingNodeId], x: newX, y: newY };
            onSceneUpdate({ [draggingNodeId]: updatedScene });
        }

        if (connectingParams) {
            setMousePos(pos);
        }
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        setIsDraggingCanvas(false);
        setDraggingNodeId(null);
        
        // End connection logic is handled in handleNodeMouseUp
        if (connectingParams) {
            setConnectingParams(null); // Cancel connection if dropped on empty space
        }
    };

    const handleNodeMouseUp = (e: React.MouseEvent, targetId: string) => {
        e.stopPropagation();
        if (connectingParams && connectingParams.sourceId !== targetId) {
            onSceneConnect(connectingParams.sourceId, targetId, connectingParams.choiceIndex);
            setConnectingParams(null);
        }
        setDraggingNodeId(null);
    };

    const handleNodeClick = (e: React.MouseEvent, sceneId: string) => {
        e.stopPropagation();
        // Only trigger click if mouse hasn't moved significantly (threshold 5px)
        const dx = Math.abs(e.clientX - dragStartMouse.current.x);
        const dy = Math.abs(e.clientY - dragStartMouse.current.y);
        
        if (dx < 5 && dy < 5) {
            onSceneClick(sceneId);
        }
    };

    const handleWheel = (e: React.WheelEvent) => {
        // Zoom if Shift, Ctrl, or Meta key is pressed
        if (e.shiftKey || e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const zoomSensitivity = 0.001;
            const newScale = Math.min(Math.max(0.1, scale - e.deltaY * zoomSensitivity), 5);
            setScale(newScale);
        } else {
             // Otherwise Pan
             setOffset(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
        }
    };

    // --- RENDER HELPERS ---
    
    // Draw SVG Line with Bezier Curve
    const drawConnection = (x1: number, y1: number, x2: number, y2: number, color = "#555") => {
        const dist = Math.abs(x1 - x2);
        // More curvy if distance is small
        const curvature = Math.max(0.5, Math.min(0.8, dist / 400));
        
        const cp1x = x1 + dist * curvature;
        const cp1y = y1;
        const cp2x = x2 - dist * curvature;
        const cp2y = y2;
        
        return (
            <path 
                d={`M ${x1} ${y1} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${x2} ${y2}`} 
                stroke={color} 
                strokeWidth="2" 
                fill="none" 
                markerEnd="url(#arrowhead)"
            />
        );
    };

    // Helper to calculate Start point for connections based on Node structure
    const getOutputPoint = (scene: Scene, choiceIndex?: number) => {
        const baseX = (scene.x || 0) + NODE_WIDTH;
        let baseY = (scene.y || 0) + HEADER_HEIGHT + BODY_BASE_HEIGHT;
        
        if (choiceIndex !== undefined) {
             // Choice Output: Base Y + half row height + index offset
             return {
                 x: baseX,
                 y: baseY + (choiceIndex * CHOICE_ROW_HEIGHT) + (CHOICE_ROW_HEIGHT / 2)
             };
        } else {
            // Linear Output (Default): Center of right edge of body (roughly) or bottom right
            // If no choices, the linear port is at the bottom of the body text area
            // But wait, if choices exist, linear output usually doesn't apply.
            // Let's position "linear" output just below text body.
            return {
                x: baseX,
                y: baseY - (BODY_BASE_HEIGHT / 2) // Middle of text body
            };
        }
    };

    return (
        <div 
            ref={containerRef}
            className="w-full h-full bg-[#111] overflow-hidden relative cursor-grab active:cursor-grabbing select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
        >
            {/* Background Grid */}
            <div 
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                    backgroundImage: `
                        linear-gradient(to right, #333 1px, transparent 1px),
                        linear-gradient(to bottom, #333 1px, transparent 1px)
                    `,
                    backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
                    transformOrigin: '0 0'
                }}
            />

            {/* Canvas Content */}
            <div 
                style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                    transformOrigin: '0 0',
                    width: '0px', height: '0px' // wrapper to avoid layout issues
                }}
            >
                {/* 1. Connections Layer */}
                <svg className="overflow-visible absolute top-0 left-0 pointer-events-none" style={{ zIndex: 0 }}>
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
                        </marker>
                    </defs>
                    
                    {scenes.map(scene => {
                        // Linear connection
                        if ((!scene.choices || scene.choices.length === 0) && scene.nextSceneId && story.scenes[scene.nextSceneId]) {
                            const start = getOutputPoint(scene);
                            const target = story.scenes[scene.nextSceneId];
                            if (!target.x && !target.y) return null;
                            const endX = target.x || 0;
                            const endY = (target.y || 0) + HEADER_HEIGHT + (BODY_BASE_HEIGHT/2); // Connect to middle of target body
                            return <g key={`link-${scene.id}-next`}>{drawConnection(start.x, start.y, endX, endY, "#6b7280")}</g>;
                        }

                        // Choices connection
                        if (scene.choices && scene.choices.length > 0) {
                            return scene.choices.map((choice, idx) => {
                                const start = getOutputPoint(scene, idx);
                                
                                if (choice.nextSceneId && story.scenes[choice.nextSceneId]) {
                                    const target = story.scenes[choice.nextSceneId];
                                    const endX = target.x || 0;
                                    const endY = (target.y || 0) + HEADER_HEIGHT + (BODY_BASE_HEIGHT/2);
                                    return <g key={`link-${scene.id}-choice-${idx}`}>{drawConnection(start.x, start.y, endX, endY, "#3b82f6")}</g>;
                                } else if (choice.nextSceneId === '__EXIT__') {
                                    return <line key={`link-${scene.id}-exit-${idx}`} x1={start.x} y1={start.y} x2={start.x + 20} y2={start.y} stroke="#ef4444" strokeWidth="2"/>;
                                }
                                return null;
                            });
                        }
                        return null;
                    })}

                    {/* Active Dragging Connection Line */}
                    {connectingParams && (
                         <path 
                            d={`M ${getOutputPoint(story.scenes[connectingParams.sourceId], connectingParams.choiceIndex).x} ${getOutputPoint(story.scenes[connectingParams.sourceId], connectingParams.choiceIndex).y} L ${mousePos.x} ${mousePos.y}`} 
                            stroke="#10b981" 
                            strokeWidth="2" 
                            strokeDasharray="5,5"
                            fill="none" 
                        />
                    )}
                </svg>

                {/* 2. Nodes Layer */}
                {scenes.map(scene => (
                    <div 
                        key={scene.id}
                        onMouseDown={(e) => handleNodeMouseDown(e, scene.id)}
                        onMouseUp={(e) => handleNodeMouseUp(e, scene.id)}
                        onClick={(e) => handleNodeClick(e, scene.id)}
                        className={`absolute bg-gray-900 border rounded-lg shadow-xl group transition-all ${
                            draggingNodeId === scene.id ? 'border-blue-400 z-50 shadow-2xl' : 'border-gray-700 hover:border-gray-500 z-10'
                        }`}
                        style={{
                            left: scene.x || 0,
                            top: scene.y || 0,
                            width: NODE_WIDTH,
                            // Dynamic Height Calculation
                            height: HEADER_HEIGHT + BODY_BASE_HEIGHT + (scene.choices?.length ? scene.choices.length * CHOICE_ROW_HEIGHT : 0) + 10,
                            cursor: 'grab'
                        }}
                    >
                        {/* Header */}
                        <div 
                            className="bg-gray-800 rounded-t-lg px-3 py-2 flex justify-between items-center border-b border-gray-700"
                            style={{ height: HEADER_HEIGHT }}
                        >
                             <span className="text-[10px] font-mono text-gray-400 truncate max-w-[150px]" title={scene.id}>{scene.id}</span>
                             {scene.id === story.startSceneId || scene.id === story.chapters?.[0]?.episodes?.[0]?.startSceneId 
                                ? <span className="w-2 h-2 rounded-full bg-green-500" title="Start Scene"></span>
                                : null
                             }
                        </div>

                        {/* Body Text */}
                        <div className="p-3 relative" style={{ height: BODY_BASE_HEIGHT }}>
                             <div className="text-xs text-white line-clamp-3 pointer-events-none select-none">
                                 {scene.text || <span className="italic text-gray-600">No content...</span>}
                             </div>

                             {/* Linear Output Port (Only if no choices) */}
                             {(!scene.choices || scene.choices.length === 0) && (
                                 <div 
                                    onMouseDown={(e) => handlePortMouseDown(e, scene.id)}
                                    className="absolute top-1/2 right-0 w-3 h-3 bg-gray-600 hover:bg-green-500 rounded-full translate-x-1/2 -translate-y-1/2 border border-black cursor-crosshair transition-colors"
                                    title="Connect Linear Next"
                                 />
                             )}
                        </div>

                        {/* Choices List */}
                        {scene.choices && scene.choices.length > 0 && (
                            <div className="border-t border-gray-800 bg-black/20">
                                {scene.choices.map((choice, idx) => (
                                    <div 
                                        key={idx} 
                                        className="relative flex items-center px-3 border-b border-gray-800/50 last:border-0 hover:bg-white/5 transition-colors"
                                        style={{ height: CHOICE_ROW_HEIGHT }}
                                    >
                                        <span className="text-[10px] text-blue-300 truncate w-full pr-2" title={choice.text}>
                                            {choice.text}
                                        </span>
                                        {/* Choice Output Port */}
                                        <div 
                                            onMouseDown={(e) => handlePortMouseDown(e, scene.id, idx)}
                                            className="absolute top-1/2 right-0 w-3 h-3 bg-blue-700 hover:bg-blue-400 rounded-full translate-x-1/2 -translate-y-1/2 border border-black cursor-crosshair transition-colors z-20"
                                            title={`Connect Choice: ${choice.text}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Input Port (Visual Only) */}
                        <div className="absolute top-[50px] left-0 w-3 h-3 bg-gray-600 rounded-full -translate-x-1/2 border border-black"></div>
                    </div>
                ))}
            </div>
            
            {/* UI Overlay */}
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur px-3 py-2 rounded text-xs text-gray-400 pointer-events-none">
                Scale: {Math.round(scale * 100)}% | X: {Math.round(offset.x)} Y: {Math.round(offset.y)}
            </div>
        </div>
    );
};

export default StoryGraph;