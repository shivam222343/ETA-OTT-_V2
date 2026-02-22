import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare, X, Send, Bot, User,
    Loader2, Sparkles, Globe, Trash2,
    Maximize2
} from 'lucide-react';

// --- Ported Formatting Helpers from AITutor ---

const highlightCode = (code, lang) => {
    if (!code) return code;
    const colors = {
        keyword: 'text-[#ff7b72] font-semibold',
        function: 'text-[#d2a8ff]',
        string: 'text-[#a5d6ff]',
        comment: 'text-[#8b949e] italic',
        number: 'text-[#6e7681]',
        builtin: 'text-[#ffa657]',
        operator: 'text-[#ff7b72]',
        bracket: 'text-[#f0f6fc]',
        variable: 'text-[#c9d1d9]'
    };

    const tokens = [
        { type: 'comment', regex: /(\/\/.*|#.*|\/\*[\s\S]*?\*\/)/g },
        { type: 'string', regex: /(".*?"|'.*?'|`[\s\S]*?`)/g },
        { type: 'number', regex: /(\b\d+(\.\d+)?\b)/g },
        { type: 'keyword', regex: /\b(const|let|var|function|return|if|else|for|while|import|export|class|extends|async|await|try|catch|finally|from|new|this|super|def|elif|lambda|in|is|not|and|or|case|switch|break|continue|default|type|interface|enum|public|private|protected|static|readonly|void|bool|string|number)\b/g },
        { type: 'function', regex: /\b([a-zA-Z_]\w*)(?=\s*\()/g },
        { type: 'builtin', regex: /\b(console|window|document|Math|JSON|Object|Array|Promise|print|len|range|enumerate|map|filter|zip)\b/g },
        { type: 'operator', regex: /(=>|===|==|=|\+|\-|\*|\/|%|<|>|&|\||!|\?)/g },
        { type: 'bracket', regex: /([\(\)\{\}\[\]])/g }
    ];

    let parts = [{ text: code, type: 'variable' }];
    tokens.forEach(token => {
        for (let i = 0; i < parts.length; i++) {
            if (parts[i].type !== 'variable') continue;
            const matches = parts[i].text.split(token.regex);
            if (matches.length <= 1) continue;
            const newParts = [];
            matches.forEach((content, index) => {
                if (index % 2 === 1) newParts.push({ text: content, type: token.type });
                else if (content) newParts.push({ text: content, type: 'variable' });
            });
            parts.splice(i, 1, ...newParts);
            i += newParts.length - 1;
        }
    });

    return parts.map((p, i) => (
        <span key={i} className={colors[p.type] || colors.variable}>{p.text}</span>
    ));
};

const parseInlineStyles = (text) => {
    const parts = text.split(/(`[^`]+`)/g);
    return parts.map((part, partIndex) => {
        if (part.startsWith('`') && part.endsWith('`')) {
            return (
                <code key={partIndex} className="px-1.5 py-0.5 mx-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-[12px] font-mono border border-blue-200 dark:border-blue-800">
                    {part.slice(1, -1)}
                </code>
            );
        }

        const urlParts = part.split(/(https?:\/\/[^\s]+)/g);
        return urlParts.map((urlPart, urlIndex) => {
            if (urlPart.match(/^https?:\/\/[^\s]+$/)) {
                return (
                    <a key={`${partIndex}-${urlIndex}`} href={urlPart} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium break-all">
                        {urlPart}
                    </a>
                );
            }
            const subParts = urlPart.split(/(\*\*[^*]+\*\*|==[^=]+==|->)/g);
            return subParts.map((subPart, subIndex) => {
                if (subPart.startsWith('**') && subPart.endsWith('**')) {
                    return <strong key={subIndex} className="font-bold text-primary">{subPart.slice(2, -2)}</strong>;
                }
                if (subPart.startsWith('==') && subPart.endsWith('==')) {
                    return <mark key={subIndex} className="bg-yellow-200 dark:bg-yellow-600/30 text-foreground px-1 rounded">{subPart.slice(2, -2)}</mark>;
                }
                if (subPart === '->') return <span key={subIndex} className="text-primary font-bold mx-1">➜</span>;
                return subPart;
            });
        });
    });
};

const formatMessage = (content) => {
    if (!content) return null;
    const lines = content.split('\n');
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeLines = [];
    const elements = [];

    lines.forEach((line, lineIndex) => {
        const trimmedLine = line.trim();
        if (line.startsWith('```')) {
            if (!inCodeBlock) {
                inCodeBlock = true;
                codeLanguage = trimmedLine.substring(3).trim() || 'javascript';
                codeLines = [];
            } else {
                inCodeBlock = false;
                const codeString = codeLines.join('\n');
                elements.push(
                    <div key={`code-${lineIndex}`} className="my-4 rounded-xl overflow-hidden border border-border bg-slate-950 shadow-xl">
                        <div className="bg-muted px-3 py-1.5 flex items-center justify-between border-b border-border">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">{codeLanguage}</span>
                            <button onClick={() => { navigator.clipboard.writeText(codeString); toast.success('Copied!'); }} className="text-[10px] hover:text-primary"><Maximize2 className="w-3 h-3" /></button>
                        </div>
                        <pre className="p-4 overflow-x-auto text-[12px] leading-relaxed">
                            {codeLines.map((l, i) => <div key={i} className="flex gap-4"><span className="text-white/10 w-4 text-right">{i + 1}</span>{highlightCode(l, codeLanguage)}</div>)}
                        </pre>
                    </div>
                );
            }
            return;
        }
        if (inCodeBlock) { codeLines.push(line); return; }

        if (trimmedLine.startsWith('### ')) {
            elements.push(<h3 key={lineIndex} className="text-lg font-black text-primary mt-6 mb-2 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-primary rounded-full" />
                {trimmedLine.replace(/^### /, '')}
            </h3>);
        } else if (trimmedLine.startsWith('#### ')) {
            elements.push(<h4 key={lineIndex} className="text-[12px] font-bold text-blue-500 uppercase tracking-widest mt-4 mb-2">{trimmedLine.replace(/^#### /, '')}</h4>);
        } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
            elements.push(<div key={lineIndex} className="flex gap-2 ml-2 mb-2 items-start"><span className="text-primary mt-1.5 text-[6px]">●</span><span className="text-sm text-muted-foreground leading-relaxed">{parseInlineStyles(trimmedLine.substring(2))}</span></div>);
        } else if (/^\d+\.\s/.test(trimmedLine)) {
            const num = trimmedLine.match(/^\d+/)[0];
            elements.push(<div key={lineIndex} className="flex gap-2 ml-2 mb-2 items-start"><span className="text-primary font-bold text-sm min-w-[15px]">{num}.</span><span className="text-sm text-muted-foreground leading-relaxed">{parseInlineStyles(trimmedLine.replace(/^\d+\.\s/, ''))}</span></div>);
        } else if (!trimmedLine) {
            elements.push(<div key={lineIndex} className="h-2" />);
        } else {
            elements.push(<p key={lineIndex} className="mb-3 text-sm text-muted-foreground leading-relaxed">{parseInlineStyles(line)}</p>);
        }
    });
    return <>{elements}</>;
};
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/axios.config';
import toast from 'react-hot-toast';

export default function GlobalAITutor() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchingHistory, setFetchingHistory] = useState(false);
    const [language, setLanguage] = useState('english');
    const scrollRef = useRef(null);

    // Only show for logged in users
    if (!user) return null;

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            fetchHistory();
        }
    }, [isOpen]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

    const fetchHistory = async () => {
        setFetchingHistory(true);
        try {
            const response = await apiClient.get('/ai/platform-history');
            if (response.data.success) {
                setMessages(response.data.data.history || []);
            }
        } catch (error) {
            console.error('Failed to fetch platform chat history:', error);
        } finally {
            setFetchingHistory(false);
        }
    };

    const handleSend = async (e) => {
        if (e) e.preventDefault();
        const query = input.trim();
        if (!query || loading) return;

        const userMsg = { role: 'user', content: query, createdAt: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const response = await apiClient.post('/ai/platform-ask', {
                query,
                language
            });

            if (response.data.success) {
                const assistantMsg = {
                    role: 'assistant',
                    content: response.data.data.answer,
                    createdAt: new Date()
                };
                setMessages(prev => [...prev, assistantMsg]);
            }
        } catch (error) {
            toast.error('Platform Assistant is busy. Try again later.');
            setMessages(prev => prev.slice(0, -1)); // Remove user message on failure
        } finally {
            setLoading(false);
        }
    };

    const clearHistory = async () => {
        if (!window.confirm('Are you sure you want to clear your chat history?')) return;

        try {
            const response = await apiClient.delete('/ai/platform-history');
            if (response.data.success) {
                setMessages([]);
                toast.success('Chat history cleared');
            }
        } catch (error) {
            toast.error('Failed to clear history');
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999]">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9, transformOrigin: 'bottom right' }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="absolute bottom-20 right-0 w-[380px] h-[550px] bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col backdrop-blur-xl bg-card/95"
                    >
                        {/* Header */}
                        <div className="p-5 bg-gradient-to-r from-primary/20 to-blue-500/20 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">Eta Platform Guide</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Online Assistant</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Chat Messages */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
                        >
                            {fetchingHistory && (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                </div>
                            )}

                            {messages.length === 0 && !fetchingHistory && (
                                <div className="text-center py-10 px-6">
                                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Bot className="w-8 h-8 text-primary" />
                                    </div>
                                    <h4 className="font-bold mb-2">Namaste! Kaise madad karu?</h4>
                                    <p className="text-xs text-muted-foreground">
                                        I am your Eta Platform Guide. Ask me anything about how the platform works, features, or navigation!
                                    </p>
                                </div>
                            )}

                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-secondary text-primary border border-border'
                                            }`}>
                                            {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                        </div>
                                        <div className={`p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                            ? 'bg-primary text-white rounded-tr-none shadow-lg shadow-primary/10'
                                            : 'bg-secondary text-foreground rounded-tl-none border border-border'
                                            }`}>
                                            <div className="prose prose-sm prose-invert max-w-none">
                                                {msg.role === 'user' ? msg.content : formatMessage(msg.content)}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {loading && (
                                <div className="flex justify-start">
                                    <div className="flex gap-2 items-center text-primary">
                                        <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center">
                                            <Bot className="w-4 h-4" />
                                        </div>
                                        <div className="flex gap-1.5 p-3 bg-secondary rounded-2xl rounded-tl-none border border-border">
                                            <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-primary" />
                                            <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-primary" />
                                            <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-border bg-background/50">
                            <form onSubmit={handleSend} className="relative flex items-center gap-2">
                                <div className="flex-1 relative">
                                    <textarea
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSend();
                                            }
                                        }}
                                        placeholder="Type your query here..."
                                        rows="1"
                                        className="w-full bg-secondary border border-border rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none max-h-32"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Globe className={`w-4 h-4 transition-colors ${language === 'hindi' ? 'text-primary' : 'text-muted-foreground'}`} />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={!input.trim() || loading}
                                    className="p-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                            <div className="mt-3 flex items-center justify-between">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setLanguage('english')}
                                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${language === 'english' ? 'bg-primary text-white border-primary' : 'bg-secondary text-muted-foreground border-border'
                                            }`}
                                    >
                                        English
                                    </button>
                                    <button
                                        onClick={() => setLanguage('hindi')}
                                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${language === 'hindi' ? 'bg-primary text-white border-primary' : 'bg-secondary text-muted-foreground border-border'
                                            }`}
                                    >
                                        Hinglish
                                    </button>
                                </div>
                                <button
                                    onClick={clearHistory}
                                    className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Neon Icon Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${isOpen
                    ? 'bg-red-500 text-white shadow-red-500/40 rotate-180'
                    : 'bg-primary text-white shadow-primary/40'
                    } relative group`}
            >
                {/* Neon Highlight Ring */}
                <div className="absolute inset-[-4px] rounded-full border-2 border-primary opacity-50 group-hover:opacity-100 animate-pulse transition-opacity" />
                <div className="absolute inset-[-8px] rounded-full border border-primary/30 opacity-30 group-hover:opacity-60 animate-ping transition-opacity" />

                {isOpen ? <X className="w-8 h-8" /> : <MessageSquare className="w-8 h-8" />}
            </motion.button>
        </div>
    );
}
