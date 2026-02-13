import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Brain, Tag, Key, AlignLeft, Info } from 'lucide-react';
import Loader from '../Loader';

export default function ExtractedInfoModal({ isOpen, onClose, content }) {
    if (!isOpen || !content) return null;

    const data = content.extractedData || {};

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/30">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Info className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">AI Extracted Insights</h2>
                                <p className="text-xs text-muted-foreground mt-0.5">{content.title}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-secondary rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        {/* Summary Section */}
                        {data.summary && (
                            <section className="space-y-3">
                                <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                                    <AlignLeft className="w-4 h-4" />
                                    AI Summary
                                </div>
                                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 text-sm leading-relaxed">
                                    {data.summary}
                                </div>
                            </section>
                        )}

                        {/* Topics & Keywords */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {data.topics && data.topics.length > 0 && (
                                <section className="space-y-3">
                                    <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                                        <Tag className="w-4 h-4" />
                                        Core Topics
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {data.topics.map((topic, i) => (
                                            <span key={i} className="px-3 py-1.5 rounded-lg bg-secondary text-xs font-semibold border border-border hover:border-primary/30 transition-colors">
                                                {topic}
                                            </span>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {data.keywords && data.keywords.length > 0 && (
                                <section className="space-y-3">
                                    <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                                        <Key className="w-4 h-4" />
                                        Keywords
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {data.keywords.map((keyword, i) => (
                                            <span key={i} className="px-3 py-1.5 rounded-lg bg-primary/5 text-primary text-xs font-semibold border border-primary/10">
                                                {keyword}
                                            </span>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Concepts */}
                        {data.concepts && data.concepts.length > 0 && (
                            <section className="space-y-3">
                                <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                                    <Brain className="w-4 h-4" />
                                    Conceptual Framework
                                </div>
                                <div className="grid gap-3">
                                    {data.concepts.map((concept, i) => (
                                        <div key={i} className="p-4 rounded-xl border border-border bg-card/50 hover:bg-secondary/20 transition-colors group">
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className="font-bold text-sm group-hover:text-primary transition-colors">{concept.name}</h4>
                                                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase">
                                                    {(concept.importance * 10).toFixed(1)} Weight
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                {concept.description}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Text Preview */}
                        {data.text && (
                            <section className="space-y-3">
                                <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                                    <FileText className="w-4 h-4" />
                                    Processed Text Overlay
                                </div>
                                <div className="p-4 bg-secondary/50 rounded-xl border border-border text-[11px] font-mono text-muted-foreground leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                                    {data.text}
                                </div>
                            </section>
                        )}

                        {(!data.summary && (!data.topics || data.topics.length === 0)) && (
                            <div className="flex flex-col items-center justify-center p-12 text-center space-y-3 opacity-50 min-h-[300px]">
                                <Loader fullScreen={false} />
                                <p className="text-sm font-bold mt-4">Analysis in progress...</p>
                                <p className="text-xs">Our AI is still mining insights from this resource.</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-border bg-secondary/20 block text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                            Generated by Eta Intelligence Layer
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
