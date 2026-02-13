import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { Network, ZoomIn, ZoomOut, RefreshCw, Layers, Info, X } from 'lucide-react';
import apiClient from '../../api/axios.config';
import Loader from '../Loader';

export default function CourseKnowledgeGraph({ courseId, isOpen, onClose }) {
    const [loading, setLoading] = useState(true);
    const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
    const [selectedNode, setSelectedNode] = useState(null);
    const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
    const containerRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            fetchGraphData();
        }
    }, [isOpen, courseId]);

    const fetchGraphData = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/content/course/${courseId}/graph`);
            setGraphData(response.data.data.graph);
        } catch (error) {
            console.error('Fetch graph error:', error);
        } finally {
            setLoading(false);
        }
    };

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

    if (!isOpen) return null;

    return (
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
                        </button>
                    </div>
                </div>

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
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
