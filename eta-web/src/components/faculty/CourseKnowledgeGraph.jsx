<<<<<<< HEAD
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { Network, ZoomIn, ZoomOut, RefreshCw, Layers, Info, X } from 'lucide-react';
=======
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ForceGraph2D from 'react-force-graph-2d';
import { Network, ZoomIn, ZoomOut, RefreshCw, Layers, Info, X, Maximize2, GitGraph, Box } from 'lucide-react';
>>>>>>> upstream/main
import apiClient from '../../api/axios.config';
import Loader from '../Loader';

export default function CourseKnowledgeGraph({ courseId, isOpen, onClose }) {
    const [loading, setLoading] = useState(true);
<<<<<<< HEAD
    const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
    const [selectedNode, setSelectedNode] = useState(null);
    const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
    const containerRef = useRef(null);
=======
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    const [selectedNode, setSelectedNode] = useState(null);
    const [layoutMode, setLayoutMode] = useState('force'); // 'force' or 'dag'
    const fgRef = useRef();
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
>>>>>>> upstream/main

    useEffect(() => {
        if (isOpen) {
            fetchGraphData();
        }
    }, [isOpen, courseId]);

<<<<<<< HEAD
=======
    useEffect(() => {
        if (containerRef.current) {
            const updateDimensions = () => {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                });
            };
            updateDimensions();
            window.addEventListener('resize', updateDimensions);
            return () => window.removeEventListener('resize', updateDimensions);
        }
    }, [isOpen]);

>>>>>>> upstream/main
    const fetchGraphData = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/content/course/${courseId}/graph`);
<<<<<<< HEAD
            setGraphData(response.data.data.graph);
=======
            const data = response.data.data.graph;

            // Transform edges to links for ForceGraph
            const transformedData = {
                nodes: data.nodes.map(n => ({
                    ...n,
                    color: getNodeColor(n.type)
                })),
                links: data.edges.map(e => ({
                    source: e.source,
                    target: e.target,
                    type: e.type
                }))
            };

            setGraphData(transformedData);
>>>>>>> upstream/main
        } catch (error) {
            console.error('Fetch graph error:', error);
        } finally {
            setLoading(false);
        }
    };

<<<<<<< HEAD
    const handleZoom = (delta) => {
        setTransform(prev => ({ ...prev, k: Math.max(0.5, Math.min(2, prev.k + delta)) }));
    };

    const getNodeColor = (type) => {
        switch (type?.toLowerCase()) {
            case 'content': return '#3b82f6'; // blue
            case 'topic': return '#10b981';   // green
            case 'concept': return '#8b5cf6'; // purple
            case 'course': return '#f59e0b';  // amber
            case 'doubt': return '#ef4444';   // red
            default: return '#64748b';        // slate
        }
    };

    // Simple layout algorithm (circular for now, ideally force-directed)
    const layoutNodes = () => {
        const { nodes } = graphData;
        if (!nodes.length) return [];

        const width = 800;
        const height = 600;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 3;

        return nodes.map((node, i) => {
            const angle = (i / nodes.length) * 2 * Math.PI;
            return {
                ...node,
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            };
        });
    };

    const nodesWithPos = layoutNodes();

    // Find edges based on laid out nodes
    const positionedEdges = graphData.edges.map(edge => {
        const source = nodesWithPos.find(n => n.id === edge.source);
        const target = nodesWithPos.find(n => n.id === edge.target);
        return { ...edge, sourcePos: source, targetPos: target };
    }).filter(e => e.sourcePos && e.targetPos);
=======
    const getNodeColor = (type) => {
        const t = type?.toLowerCase();
        if (t === 'content') return '#3b82f6'; // blue
        if (t === 'topic') return '#10b981';   // green
        if (t === 'concept') return '#8b5cf6'; // purple
        if (t === 'course') return '#f59e0b';  // amber
        if (t === 'doubt') return '#ef4444';   // red
        return '#64748b';                      // slate
    };

    const handleNodeClick = (node) => {
        setSelectedNode(node);
        // Center view on node
        fgRef.current.centerAt(node.x, node.y, 400);
        fgRef.current.zoom(2.5, 400);
    };

    const handleZoom = (delta) => {
        if (!fgRef.current) return;
        const currentZoom = fgRef.current.zoom();
        fgRef.current.zoom(currentZoom + delta, 300);
    };

    const handleReset = () => {
        if (!fgRef.current) return;
        fgRef.current.zoomToFit(400, 50);
    };

    const toggleLayout = () => {
        setLayoutMode(prev => prev === 'force' ? 'dag' : 'force');
        // Reset view after layout change
        setTimeout(() => handleReset(), 200);
    };
>>>>>>> upstream/main

    if (!isOpen) return null;

    return (
<<<<<<< HEAD
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-card w-full h-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-border/50"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-card">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Network className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Knowledge Graph</h2>
                            <p className="text-xs text-muted-foreground">Visualizing course topics and connections</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={fetchGraphData} className="p-2 hover:bg-secondary rounded-lg transition-colors" title="Refresh">
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <div className="w-px h-4 bg-border mx-2" />
                        <button onClick={onClose} className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors">
                            <X className="w-5 h-5" />
=======
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl dark-theme-enforced">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-slate-900 w-full h-full max-w-7xl rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col border border-white/10 text-white"
            >
                {/* Header - Enforce Dark */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-slate-900/90 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/20 rounded-2xl shadow-inner border border-primary/30">
                            <Network className="w-6 h-6 text-primary-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight text-white">
                                {layoutMode === 'dag' ? 'Hierarchical Taxonomy' : 'Interactive Knowledge Graph'}
                            </h2>
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest opacity-80">
                                {layoutMode === 'dag' ? 'Top-Down Course Architecture' : 'Visualizing Neural Path & Concepts'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleLayout}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 font-bold text-xs uppercase tracking-wider ${layoutMode === 'dag'
                                    ? 'bg-primary text-white border-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]'
                                    : 'bg-slate-800 text-slate-300 border-white/5 hover:border-primary/50'
                                }`}
                        >
                            {layoutMode === 'dag' ? <GitGraph className="w-4 h-4" /> : <Box className="w-4 h-4" />}
                            <span>{layoutMode === 'dag' ? 'Hierarchical' : 'Free Flow'}</span>
                        </button>

                        <div className="w-px h-6 bg-white/10 mx-1" />

                        <button
                            onClick={fetchGraphData}
                            className="p-3 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10 group"
                            title="Sync Graph"
                        >
                            <RefreshCw className={`w-5 h-5 text-slate-400 group-hover:text-primary-400 transition-colors ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button onClick={onClose} className="p-3 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 rounded-xl transition-all border border-transparent hover:border-rose-500/20">
                            <X className="w-6 h-6" />
>>>>>>> upstream/main
                        </button>
                    </div>
                </div>

<<<<<<< HEAD
                <div className="flex-1 flex overflow-hidden bg-gray-50 dark:bg-gray-950 relative">
                    {/* SVG Graph Area */}
                    <div className="flex-1 relative cursor-grab active:cursor-grabbing" ref={containerRef}>
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader fullScreen={false} />
                            </div>
                        ) : (
                            <svg
                                className="w-full h-full"
                                viewBox="0 0 800 600"
                                style={{ transform: `scale(${transform.k}) translate(${transform.x}px, ${transform.y}px)` }}
                            >
                                {/* Edges */}
                                {positionedEdges.map((edge, i) => (
                                    <line
                                        key={`edge-${i}`}
                                        x1={edge.sourcePos.x}
                                        y1={edge.sourcePos.y}
                                        x2={edge.targetPos.x}
                                        y2={edge.targetPos.y}
                                        stroke="currentColor"
                                        strokeOpacity="0.2"
                                        strokeWidth="1"
                                        className="text-muted-foreground"
                                    />
                                ))}

                                {/* Nodes */}
                                {nodesWithPos.map((node) => (
                                    <motion.g
                                        key={node.id}
                                        whileHover={{ scale: 1.2 }}
                                        onClick={() => setSelectedNode(node)}
                                        className="cursor-pointer"
                                    >
                                        <circle
                                            cx={node.x}
                                            cy={node.y}
                                            r={selectedNode?.id === node.id ? 14 : 10}
                                            fill={getNodeColor(node.type)}
                                            className="shadow-sm"
                                        />
                                        <text
                                            x={node.x}
                                            y={node.y + 25}
                                            textAnchor="middle"
                                            className="text-[10px] font-medium fill-foreground pointer-events-none"
                                        >
                                            {node.label}
                                        </text>
                                    </motion.g>
                                ))}
                            </svg>
                        )}
                    </div>

                    {/* Sidebar Panel */}
                    <AnimatePresence>
                        {selectedNode && (
                            <motion.div
                                initial={{ x: 300, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: 300, opacity: 0 }}
                                className="w-80 bg-card border-l p-6 overflow-auto shadow-xl"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <span className="px-2 py-1 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                                        {selectedNode.type}
                                    </span>
                                    <button onClick={() => setSelectedNode(null)} className="p-1 hover:bg-secondary rounded">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <h3 className="text-xl font-bold mb-2">{selectedNode.label}</h3>
                                {selectedNode.difficulty && (
                                    <p className="text-xs text-muted-foreground mb-4 capitalize">
                                        Difficulty: {selectedNode.difficulty}
                                    </p>
                                )}

                                {selectedNode.type?.toLowerCase() === 'doubt' && (
                                    <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20 mb-6">
                                        <h4 className="text-sm font-bold flex items-center gap-2 mb-2 text-green-600">
                                            <Info className="w-4 h-4" />
                                            Verified Answer
                                        </h4>
                                        <p className="text-xs text-muted-foreground leading-relaxed italic">
                                            "{selectedNode.answer || 'No answer available in graph.'}"
                                        </p>
                                        {selectedNode.confidence && (
                                            <div className="mt-2 text-[10px] font-bold text-green-600 uppercase tracking-wider">
                                                Confidence: {selectedNode.confidence}%
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-6">
                                    <div className="p-4 bg-secondary/50 rounded-xl border border-border/50">
                                        <h4 className="text-sm font-bold flex items-center gap-2 mb-2">
                                            <Info className="w-4 h-4 text-primary" />
                                            Node Info
                                        </h4>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            This node represents a {selectedNode.type.toLowerCase()} in the course structure.
                                            It has {positionedEdges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length} active connections.
                                        </p>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                                            <Layers className="w-4 h-4 text-primary" />
                                            Connections
                                        </h4>
                                        <div className="space-y-2">
                                            {positionedEdges
                                                .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
                                                .map((e, idx) => {
                                                    const otherNode = e.source === selectedNode.id ? e.targetPos : e.sourcePos;
                                                    return (
                                                        <div key={idx} className="flex items-center justify-between text-xs p-2 hover:bg-secondary rounded transition-colors group">
                                                            <span>{otherNode.label}</span>
                                                            <span className="text-[10px] text-muted-foreground group-hover:text-primary">{e.type}</span>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Toolbar */}
                    <div className="absolute bottom-6 left-6 flex flex-col gap-2">
                        <button onClick={() => handleZoom(0.1)} className="p-3 bg-card shadow-xl rounded-xl border border-border/50 hover:bg-secondary transition-all">
                            <ZoomIn className="w-5 h-5 text-primary" />
                        </button>
                        <button onClick={() => handleZoom(-0.1)} className="p-3 bg-card shadow-xl rounded-xl border border-border/50 hover:bg-secondary transition-all">
                            <ZoomOut className="w-5 h-5 text-primary" />
                        </button>
                    </div>

                    {/* Legend */}
                    <div className="absolute top-6 left-6 p-4 bg-card/80 backdrop-blur shadow-lg rounded-xl flex flex-col gap-2 text-[10px] border border-border/50">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getNodeColor('content') }} />
                            <span>Content</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getNodeColor('topic') }} />
                            <span>Topic</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getNodeColor('concept') }} />
                            <span>Concept</span>
                        </div>
=======
                <div className="flex-1 flex overflow-hidden relative bg-slate-950">
                    {/* Graph Canvas */}
                    <div className="flex-1 relative bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-slate-950" ref={containerRef}>
                        {loading && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
                                <Loader fullScreen={false} />
                            </div>
                        )}

                        {!loading && (
                            <ForceGraph2D
                                ref={fgRef}
                                width={dimensions.width}
                                height={dimensions.height}
                                graphData={graphData}
                                nodeLabel="label"
                                nodeColor="color"
                                linkColor={() => 'rgba(255, 255, 255, 0.15)'}
                                nodeRelSize={7}
                                linkWidth={1.5}
                                linkDirectionalParticles={2}
                                linkDirectionalParticleSpeed={0.005}
                                onNodeClick={handleNodeClick}
                                dagMode={layoutMode === 'dag' ? 'td' : null}
                                dagLevelDistance={layoutMode === 'dag' ? 120 : null}
                                nodeCanvasObject={(node, ctx, globalScale) => {
                                    const label = node.label;
                                    const fontSize = 12 / globalScale;
                                    ctx.font = `${fontSize}px Inter, sans-serif`;

                                    // Node Circle
                                    ctx.beginPath();
                                    ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI, false);
                                    ctx.fillStyle = node.color;
                                    ctx.fill();

                                    // Bloom effect for special nodes
                                    if (node.type === 'doubt' || node.type === 'course') {
                                        ctx.shadowBlur = 15;
                                        ctx.shadowColor = node.color;
                                        ctx.stroke();
                                    }

                                    // Label background
                                    if (globalScale >= 1.5) {
                                        const textWidth = ctx.measureText(label).width;
                                        const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

                                        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                                        ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y + 10 - bckgDimensions[1] / 2, ...bckgDimensions);

                                        ctx.textAlign = 'center';
                                        ctx.textBaseline = 'middle';
                                        ctx.fillStyle = '#fff';
                                        ctx.fillText(label, node.x, node.y + 10);
                                    }
                                }}
                                coziness={1.5}
                                d3AlphaDecay={0.02}
                                d3VelocityDecay={0.3}
                            />
                        )}
                    </div>

                    {/* Node Details (Side Window Overlay) */}
                    <AnimatePresence>
                        {selectedNode && (
                            <>
                                {/* Backdrop for focus */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setSelectedNode(null)}
                                    className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] z-10 cursor-pointer"
                                />

                                <motion.div
                                    initial={{ x: '100%', opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: '100%', opacity: 0 }}
                                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                                    className="absolute right-0 top-0 bottom-0 w-[420px] bg-slate-900/95 backdrop-blur-3xl border-l border-white/10 shadow-[-20px_0_50px_rgba(0,0,0,0.7)] z-20 flex flex-col text-white"
                                >
                                    {/* Handle-like decoration */}
                                    <div className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 w-1.5 h-12 bg-white/20 rounded-l-full" />

                                    <div className="p-8 overflow-y-auto custom-scrollbar h-full">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-3">
                                                <div className="w-4 h-4 rounded-full shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)] animate-pulse" style={{ backgroundColor: selectedNode.color }} />
                                                <span className="px-3 py-1 rounded-lg bg-primary/20 text-primary-400 text-[10px] font-black uppercase tracking-[0.2em] border border-primary/30">
                                                    {selectedNode.type} PERSISTENCE
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => setSelectedNode(null)}
                                                className="p-3 hover:bg-white/10 rounded-2xl transition-all border border-transparent hover:border-white/5 active:scale-95 group"
                                            >
                                                <X className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                                            </button>
                                        </div>

                                        <div className="space-y-1 mb-8">
                                            <h3 className="text-3xl font-black leading-tight text-white tracking-tight">{selectedNode.label}</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <div className="w-1 h-1 bg-primary rounded-full" />
                                                Unique ID: {selectedNode.id}
                                            </p>
                                        </div>

                                        <div className="space-y-6">
                                            {/* DB Meta Data Explorer */}
                                            <div className="p-6 bg-slate-950/50 rounded-3xl border border-white/5 shadow-inner space-y-5">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-[10px] font-black flex items-center gap-2 text-primary-400 uppercase tracking-[0.2em]">
                                                        <Box className="w-3 h-3" />
                                                        Knowledge Attributes
                                                    </h4>
                                                </div>

                                                <div className="grid gap-4">
                                                    {Object.entries(selectedNode).map(([key, value]) => {
                                                        // Hide UI internals and redundant fields
                                                        if (['id', 'label', 'type', 'color', 'x', 'y', 'vx', 'vy', 'index', 'answer', 'fx', 'fy'].includes(key)) return null;
                                                        if (value === null || value === undefined || value === '') return null;

                                                        return (
                                                            <div key={key} className="group p-3 hover:bg-white/[0.03] rounded-2xl transition-all border border-transparent hover:border-white/5">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <div className="w-1 h-1 bg-white/30 rounded-full" />
                                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1')}</span>
                                                                </div>
                                                                <div className="text-xs text-slate-200 font-semibold break-words pl-3">
                                                                    {typeof value === 'object' ? (
                                                                        <pre className="text-[10px] opacity-70 overflow-x-auto text-slate-400">
                                                                            {JSON.stringify(value, null, 2)}
                                                                        </pre>
                                                                    ) : String(value)}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Pedagogical AI Context */}
                                            {selectedNode.type?.toLowerCase() === 'doubt' && (
                                                <div className="p-6 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 shadow-[inset_0_2px_20px_rgba(16,185,129,0.1)]">
                                                    <h4 className="text-xs font-black flex items-center gap-2 mb-4 text-emerald-400 uppercase tracking-widest">
                                                        <Info className="w-4 h-4" />
                                                        AI Resolved Context
                                                    </h4>
                                                    <div className="relative mb-4">
                                                        <div className="absolute -left-3 top-0 bottom-0 w-1 bg-emerald-500/30 rounded-full" />
                                                        <p className="text-sm text-slate-200 leading-relaxed italic font-medium pl-2">
                                                            "{selectedNode.answer || 'Knowledge fragment extracted from source material.'}"
                                                        </p>
                                                    </div>
                                                    {selectedNode.confidence && (
                                                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                                            <div className="flex flex-col">
                                                                <span className="text-[8px] text-slate-500 uppercase font-black">Adherence Score</span>
                                                                <div className="w-24 h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                                                                    <motion.div
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${selectedNode.confidence}%` }}
                                                                        className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <span className="text-lg font-black text-emerald-400">{selectedNode.confidence}%</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Graph Connectivity Topology */}
                                            <div className="p-6 bg-slate-950/30 rounded-3xl border border-white/5 space-y-4">
                                                <h4 className="text-xs font-black flex items-center gap-2 text-primary-400 uppercase tracking-widest">
                                                    <Layers className="w-4 h-4" />
                                                    Network Topology
                                                </h4>
                                                <div className="space-y-2">
                                                    {graphData.links
                                                        .filter(e => {
                                                            const sId = typeof e.source === 'object' ? e.source.id : e.source;
                                                            const tId = typeof e.target === 'object' ? e.target.id : e.target;
                                                            return sId === selectedNode.id || tId === selectedNode.id;
                                                        })
                                                        .map((link, idx) => {
                                                            const sId = typeof link.source === 'object' ? link.source.id : link.source;
                                                            const otherNodeId = sId === selectedNode.id
                                                                ? (typeof link.target === 'object' ? link.target.id : link.target)
                                                                : sId;
                                                            const otherNode = graphData.nodes.find(n => n.id === otherNodeId);

                                                            return (
                                                                <div key={idx} className="flex items-center justify-between p-4 bg-slate-900/60 rounded-2xl border border-white/[0.03] hover:border-primary/30 hover:bg-primary/5 transition-all group cursor-default">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-xs font-bold text-slate-300 group-hover:text-white">{otherNode?.label || 'Hidden context'}</span>
                                                                        <span className="text-[8px] text-slate-500 font-bold uppercase">{otherNode?.type || 'Node'}</span>
                                                                    </div>
                                                                    <span className="text-[9px] font-black text-primary-400/50 group-hover:text-primary-400 uppercase tracking-tighter bg-primary/10 px-2 py-1 rounded-md">{link.type}</span>
                                                                </div>
                                                            );
                                                        })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>

                    {/* Toolbar Overlay - Enforce Dark */}
                    <div className="absolute bottom-8 left-8 flex flex-col gap-3">
                        <button onClick={() => handleZoom(0.2)} className="p-4 bg-slate-900/80 backdrop-blur-xl shadow-2xl rounded-2xl border border-white/10 hover:bg-primary/20 transition-all group">
                            <ZoomIn className="w-6 h-6 text-slate-400 group-hover:text-primary-400" />
                        </button>
                        <button onClick={() => handleZoom(-0.2)} className="p-4 bg-slate-900/80 backdrop-blur-xl shadow-2xl rounded-2xl border border-white/10 hover:bg-primary/20 transition-all group">
                            <ZoomOut className="w-6 h-6 text-slate-400 group-hover:text-primary-400" />
                        </button>
                        <button onClick={handleReset} className="p-4 bg-slate-900/80 backdrop-blur-xl shadow-2xl rounded-2xl border border-white/10 hover:bg-primary/20 transition-all group">
                            <Maximize2 className="w-6 h-6 text-slate-400 group-hover:text-primary-400" />
                        </button>
                    </div>

                    {/* Legend Overlay - Enforce Dark */}
                    <div className="absolute top-8 left-8 p-5 bg-slate-900/50 backdrop-blur shadow-2xl rounded-3xl flex flex-col gap-4 border border-white/10 hover:bg-slate-900/80 transition-all">
                        {['Content', 'Topic', 'Concept', 'Course', 'Doubt'].map(type => (
                            <div key={type} className="flex items-center gap-3 group">
                                <div className="w-3 h-3 rounded-full shadow-sm group-hover:scale-125 transition-transform" style={{ backgroundColor: getNodeColor(type) }} />
                                <span className="text-[11px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest">{type}</span>
                            </div>
                        ))}
>>>>>>> upstream/main
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
