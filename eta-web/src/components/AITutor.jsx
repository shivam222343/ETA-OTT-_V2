import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Volume2, Sparkles, AlertCircle, ArrowUpRight, CheckCircle2, Maximize2, Globe, Mic, MicOff } from 'lucide-react';
import apiClient from '../api/axios.config';
import toast from 'react-hot-toast';

const formatMessage = (content) => {
    if (!content) return null;

    // Split by double asterisks for bold
    const parts = content.split(/(\*\*.*?\*\*)/g);

    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            // Bold text - render with primary color
            return (
                <strong key={index} className="font-bold text-primary">
                    {part.slice(2, -2)}
                </strong>
            );
        } else {
            // Normal text - handle newlines
            return part.split('\n').map((line, i) => (
                <span key={`${index}-${i}`}>
                    {line}
                    {i < part.split('\n').length - 1 && <br />}
                </span>
            ));
        }
    });
};

const Typewriter = ({ text, onComplete, onUpdate }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (currentIndex < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText(prev => prev + text[currentIndex]);
                setCurrentIndex(prev => prev + 1);
                if (onUpdate) onUpdate();
            }, 50); // 50ms to match speaking pace roughly

            return () => clearTimeout(timeout);
        } else {
            if (onComplete) onComplete();
        }
    }, [currentIndex, text, onComplete, onUpdate]);

    return <>{formatMessage(displayedText)}<span className="animate-pulse">|</span></>;
};

export default function AITutor({ courseId, contentId, selectedText, visualContext }) {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: "Hello! I'm your Eta AI Tutor. If you have any doubts about this content, just ask! You can also select text and I'll explain it.",
            id: 'welcome'
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [speaking, setSpeaking] = useState(null); // ID of message being spoken
    const [voices, setVoices] = useState([]);
    const [selectedVoice, setSelectedVoice] = useState(null);
    const scrollRef = useRef(null);
    const recognitionRef = useRef(null);
    const audioRef = useRef(null);

    useEffect(() => {
        // Initialize Speech Recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                setIsListening(false);
                toast.success('Voice captured!');
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
                if (event.error !== 'no-speech') {
                    toast.error(`Voice input error: ${event.error}`);
                }
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }

        const loadVoices = () => {
            const browserVoices = window.speechSynthesis.getVoices();

            const expertVoices = [
                { name: 'Expert AI (Indian)', lang: 'en-IN', id: 'Aditi', isExpert: true },
                { name: 'Expert AI (US)', lang: 'en-US', id: 'Joanna', isExpert: true },
                { name: 'Expert AI (UK)', lang: 'en-GB', id: 'Amy', isExpert: true }
            ];

            const allVoices = [...expertVoices, ...browserVoices];
            setVoices(allVoices);

            const defaultVoice = expertVoices[0] ||
                browserVoices.find(v => v.lang === 'en-IN') ||
                browserVoices.find(v => v.lang.startsWith('en')) ||
                browserVoices[0];
            setSelectedVoice(defaultVoice);
        };

        loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }

        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            if (!recognitionRef.current) {
                toast.error('Voice input is not supported in this browser.');
                return;
            }
            try {
                recognitionRef.current.start();
                setIsListening(true);
                toast('Listening...', { icon: '🎤' });
            } catch (err) {
                console.error('Mic start error:', err);
                setIsListening(false);
            }
        }
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading, messages.reduce((acc, m) => acc + (m.isTyping ? 1 : 0), 0)]); // Scroll on typing updates too

    const handleSend = async (e, overrideQuery = null) => {
        if (e) e.preventDefault();

        const userQuery = (overrideQuery || input).trim();
        if (!userQuery || loading) return;

        const userMsgId = Date.now().toString();

        setMessages(prev => [...prev, { role: 'user', content: userQuery, id: userMsgId }]);
        setInput('');
        setLoading(true);

        try {
            const response = await apiClient.post('/doubts/ask', {
                query: userQuery,
                selectedText: selectedText,
                visualContext: visualContext,
                courseId: courseId,
                contentId: contentId
            });

            const { doubt } = response.data.data;

            const aiMsgId = (Date.now() + 1).toString();
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: doubt.aiResponse,
                id: aiMsgId,
                confidence: doubt.confidence,
                doubtId: doubt._id,
                isTyping: true // Enable typing effect
            }]);

            speak(doubt.aiResponse, aiMsgId);

        } catch (error) {
            console.error('AI Tutor error:', error);
            toast.error('Failed to get answer from AI Tutor');
        } finally {
            setLoading(false);
        }
    };

    const handleTypingComplete = (id) => {
        setMessages(prev => prev.map(msg =>
            msg.id === id ? { ...msg, isTyping: false } : msg
        ));
    };

    const speak = async (text, id) => {
        // Stop any active playback first
        window.speechSynthesis.cancel();
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        // If clicking the active speaker, toggle off (stop)
        if (speaking === id) {
            setSpeaking(null);
            return;
        }

        if (selectedVoice?.isExpert) {
            try {
                setSpeaking(id);
                const response = await apiClient.post('/ai/tts', {
                    text,
                    voiceId: selectedVoice.id
                }, {
                    responseType: 'blob'
                });

                const audioUrl = URL.createObjectURL(response.data);
                const audio = new Audio(audioUrl);
                audioRef.current = audio;

                audio.onended = () => {
                    setSpeaking(null);
                    URL.revokeObjectURL(audioUrl);
                };

                audio.onerror = () => setSpeaking(null);
                audio.play();
                return;
            } catch (error) {
                console.warn('Expert TTS failed, falling back to browser:', error.message);
            }
        }

        if (!window.speechSynthesis) return;

        const utterance = new SpeechSynthesisUtterance(text);
        if (selectedVoice && !selectedVoice.isExpert) {
            utterance.voice = selectedVoice;
        }
        utterance.rate = 0.9;
        utterance.pitch = 1.0;

        utterance.onstart = () => setSpeaking(id);
        utterance.onend = () => setSpeaking(null);
        utterance.onerror = () => setSpeaking(null);

        window.speechSynthesis.speak(utterance);
    };

    const handleEscalate = async (doubtId, msgId) => {
        try {
            await apiClient.post(`/doubts/${doubtId}/escalate`);
            toast.success('Escalated to your mentor!');

            setMessages(prev => prev.map(msg =>
                msg.id === msgId ? { ...msg, escalated: true, status: 'escalated' } : msg
            ));
        } catch (error) {
            toast.error('Failed to escalate doubt');
        }
    };

    return (
        <div className="flex flex-col h-full bg-background border-l w-full max-w-md">
            {/* Header */}
            <div className="p-4 border-b bg-primary/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">Eta AI Tutor</h3>
                        <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Live Tutor</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative group">
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-background border border-border rounded-lg text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                            <Globe className="w-3.5 h-3.5" />
                            <select
                                value={selectedVoice?.name || ''}
                                onChange={(e) => {
                                    const voice = voices.find(v => v.name === e.target.value);
                                    setSelectedVoice(voice);
                                    toast.success(`Voice changed to ${voice.name}`);
                                }}
                                className="bg-transparent border-none text-[10px] font-bold focus:ring-0 cursor-pointer appearance-none pr-4 max-w-[120px]"
                            >
                                {voices
                                    .filter(v => v.lang.startsWith('en'))
                                    .map(v => (
                                        <option key={v.isExpert ? `expert-${v.id}` : v.name} value={v.name}>
                                            {v.isExpert ? '✨ ' + v.name :
                                                v.lang === 'en-IN' ? '🇮🇳 India' :
                                                    v.lang === 'en-US' ? '🇺🇸 USA' :
                                                        v.lang === 'en-GB' ? '🇬🇧 UK' :
                                                            v.name.split(' ')[0]}
                                        </option>
                                    ))
                                }
                            </select>
                        </div>
                    </div>
                    <Sparkles className="w-4 h-4 text-primary opacity-50" />
                </div>
            </div>

            {/* Chat Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth"
            >
                {messages.map((msg) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-secondary' : 'bg-primary/10'
                                }`}>
                                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-primary" />}
                            </div>

                            <div className="space-y-2">
                                <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                                    : 'bg-muted rounded-tl-none border border-border/50'
                                    }`}>

                                    {msg.role === 'assistant' && msg.isTyping ? (
                                        <Typewriter
                                            text={msg.content}
                                            onUpdate={() => scrollRef.current && (scrollRef.current.scrollTop = scrollRef.current.scrollHeight)}
                                            onComplete={() => handleTypingComplete(msg.id)}
                                        />
                                    ) : (
                                        formatMessage(msg.content)
                                    )}

                                    {msg.role === 'assistant' && msg.id !== 'welcome' && !msg.isTyping && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <div className={`w-1.5 h-1.5 rounded-full ${msg.confidence >= 85 ? 'bg-green-500' :
                                                    msg.confidence >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                                                    }`} />
                                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                                    Confidence: {msg.confidence}%
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => speak(msg.content, msg.id)}
                                                className={`p-1.5 rounded-lg transition-colors ${speaking === msg.id ? 'bg-primary text-white' : 'hover:bg-primary/10 text-primary'}`}
                                            >
                                                <Volume2 className={`w-3.5 h-3.5 ${speaking === msg.id ? 'animate-pulse' : ''}`} />
                                            </button>
                                        </motion.div>
                                    )}
                                </div>

                                {/* Escalation UI - Enhanced Visibility and Color Coding */}
                                {msg.role === 'assistant' && msg.id !== 'welcome' && !msg.escalated && !msg.isTyping && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`rounded-xl p-3 space-y-2 border ${msg.confidence < 70 ? 'bg-red-500/5 border-red-500/20' :
                                            msg.confidence < 85 ? 'bg-yellow-500/5 border-yellow-500/20' :
                                                'bg-green-500/5 border-green-500/10'
                                            }`}
                                    >
                                        <div className={`flex items-start gap-2 text-xs font-medium ${msg.confidence < 70 ? 'text-red-600' :
                                            msg.confidence < 85 ? 'text-yellow-700' :
                                                'text-green-700'
                                            }`}>
                                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                            <span>
                                                {msg.confidence < 70 ? "The AI is quite unsure. Verify with a mentor." :
                                                    msg.confidence < 85 ? "The AI is mostly sure, but human review helps." :
                                                        "Everything looks correct. Still want a mentor to check?"}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleEscalate(msg.doubtId, msg.id)}
                                            className={`w-full py-1.5 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm ${msg.confidence < 70 ? 'bg-red-500 hover:bg-red-600' :
                                                msg.confidence < 85 ? 'bg-yellow-600 hover:bg-yellow-700' :
                                                    'bg-green-600 hover:bg-green-700'
                                                }`}
                                        >
                                            <ArrowUpRight className="w-3 h-3" />
                                            Escalate to Mentor
                                        </button>
                                    </motion.div>
                                )}

                                {msg.escalated && (
                                    <div className="flex items-center gap-2 text-[10px] text-orange-500 bg-orange-500/5 border border-orange-500/10 rounded-lg p-2 font-bold uppercase tracking-widest">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Sent to Mentor
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="flex gap-3 max-w-[85%] items-center">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-primary" />
                            </div>
                            <div className="bg-muted p-3 rounded-2xl rounded-tl-none border border-border/50">
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-card border-t border-border">
                {visualContext && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-3 px-3 py-1.5 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between"
                    >
                        <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest">
                            <Maximize2 className="w-3 h-3" />
                            Visual Focus Active
                        </div>
                        {!input && (
                            <button
                                onClick={() => handleSend(null, 'Explain this area')}
                                className="text-[10px] bg-primary text-white px-3 py-1 rounded-full font-bold hover:scale-105 transition-all shadow-sm"
                            >
                                Explain it
                            </button>
                        )}
                    </motion.div>
                )}
                <div className="flex items-center gap-2">
                    <form onSubmit={handleSend} className="relative flex-1">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isListening ? "Listening..." : "Ask me anything..."}
                            className={`w-full bg-secondary border-none rounded-2xl py-3 pl-4 pr-12 text-sm transition-all shadow-inner ${isListening ? 'ring-2 ring-red-500/50' : 'focus:ring-2 focus:ring-primary/20'
                                }`}
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all shadow-md"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                    <button
                        type="button"
                        onClick={toggleListening}
                        disabled={loading}
                        className={`p-3 rounded-2xl transition-all shadow-md flex items-center justify-center ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary'
                            }`}
                        title="Voice Input"
                    >
                        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                </div>
                <div className="mt-2 text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-primary" />
                    Powered by Groq Llama • Learned through Knowledge Graph
                </div>
            </div>
        </div>
    );
}
