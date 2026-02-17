import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Volume2, Sparkles, AlertCircle, ArrowUpRight, CheckCircle2, Maximize2, Globe, Mic, MicOff, Youtube, Play, Square } from 'lucide-react';
import ReactPlayer from 'react-player';
import apiClient from '../api/axios.config';
import toast from 'react-hot-toast';
import GroqKeyModal from './GroqKeyModal';

const highlightCode = (code, lang) => {
    if (!code) return code;

    // Premium JetBrains/VSCode inspired color palette
    const colors = {
        keyword: 'text-[#ff7b72] font-semibold', // Salmon red
        function: 'text-[#d2a8ff]',           // Lavender purple
        string: 'text-[#a5d6ff]',             // Sky blue
        comment: 'text-[#8b949e] italic',     // Muted gray
        number: 'text-[#6e7681]',             // Slate gray
        builtin: 'text-[#ffa657]',            // Orange
        operator: 'text-[#ff7b72]',           // Same as keyword
        bracket: 'text-[#f0f6fc]',            // Bright white
        variable: 'text-[#c9d1d9]'            // Default text
    };

    // Simple but effective regex tokenizer
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

    // Split text into parts and highlight
    const parts = [{ text: code, type: 'variable' }];

    tokens.forEach(token => {
        for (let i = 0; i < parts.length; i++) {
            if (parts[i].type !== 'variable') continue;

            const matches = parts[i].text.split(token.regex);
            if (matches.length <= 1) continue;

            const newParts = [];
            matches.forEach((content, index) => {
                if (index % 2 === 1) {
                    newParts.push({ text: content, type: token.type });
                } else if (content) {
                    newParts.push({ text: content, type: 'variable' });
                }
            });

            parts.splice(i, 1, ...newParts);
            i += newParts.length - 1;
        }
    });

    return parts.map((p, i) => (
        <span key={i} className={colors[p.type] || colors.variable}>
            {p.text}
        </span>
    ));
};

const formatMessage = (content) => {
    if (!content) return null;

    // Clean up markers and video links
    const cleanContent = content
        .replace(/\[\[(INTRO|CONCEPT|CODE|SUMMARY)\]\]/g, '')
        .replace(/\[\[VIDEO:?\s*[^\]]*\]\]/g, '')
        .replace(/(Video|Relevant video|Suggested video):\s*https?:\/\/[^\s]+/gi, '')
        .replace(/https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/[^\s\[\]"'>]+/g, '')
        .replace(/https?:\/\/[^\s\[\]"'>]+/g, '')
        .trim();

    if (!cleanContent) return null;

    const lines = cleanContent.split('\n');
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeLines = [];
    const elements = [];

    lines.forEach((line, lineIndex) => {
        const trimmedLine = line.trim();

        // Handle code block start/end
        if (line.startsWith('```')) {
            if (!inCodeBlock) {
                inCodeBlock = true;
                codeLanguage = trimmedLine.substring(3).trim() || 'javascript';
                codeLines = [];
            } else {
                inCodeBlock = false;
                const codeString = codeLines.join('\n');
                elements.push(
                    <div key={`code-${lineIndex}`} className="my-6 rounded-2xl overflow-hidden border border-white/5 shadow-2xl bg-[#0d1117] w-full group">
                        <div className="bg-[#161b22] px-4 py-2.5 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex gap-1.5 shrink-0">
                                    <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                                    <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                                </div>
                                <div className="h-4 w-px bg-white/10 mx-1" />
                                <span className="text-[10px] font-mono font-black text-white/40 uppercase tracking-[0.2em]">
                                    {codeLanguage}
                                </span>
                            </div>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(codeString);
                                    toast.success('Snippet copied to clipboard!');
                                }}
                                className="text-[10px] font-bold text-white/40 hover:text-white transition-all flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-1 rounded-lg border border-white/5 hover:border-white/10"
                            >
                                <Maximize2 className="w-3 h-3" />
                                COPY
                            </button>
                        </div>
                        <div className="p-0 overflow-x-auto custom-scrollbar bg-slate-950/20">
                            <pre className="p-6 min-w-full w-fit">
                                <code className="text-[13px] font-mono leading-relaxed block whitespace-pre">
                                    {codeLines.map((l, i) => (
                                        <div key={i} className="flex gap-6 min-w-fit hover:bg-white/[0.02] -mx-6 px-6 transition-colors group/line">
                                            <span className="text-white/10 select-none text-right min-w-[24px] font-bold group-hover/line:text-white/30 transition-colors">{i + 1}</span>
                                            <span className="flex-1 whitespace-pre">{highlightCode(l, codeLanguage)}</span>
                                        </div>
                                    ))}
                                </code>
                            </pre>
                        </div>
                    </div>
                );
                codeLines = [];
                codeLanguage = '';
            }
            return;
        }

        if (inCodeBlock) {
            codeLines.push(line);
            return;
        }

        // Handle ### Headers (Premium Blue Styling)
        if (trimmedLine.startsWith('### ')) {
            elements.push(
                <div key={lineIndex} className="relative group mt-10 mb-6">
                    <h3 className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500 dark:from-blue-400 dark:to-blue-200 tracking-tight">
                        {trimmedLine.replace(/^### /, '')}
                    </h3>
                    <div className="absolute -bottom-2 left-0 w-12 h-1 bg-gradient-to-r from-blue-600 to-transparent rounded-full transform origin-left group-hover:scale-x-150 transition-transform duration-500" />
                </div>
            );
            return;
        }

        // Handle #### Subheaders (Semibold Blue)
        if (trimmedLine.startsWith('#### ')) {
            elements.push(
                <h4 key={lineIndex} className="text-sm font-bold text-blue-600/80 dark:text-blue-400 mt-8 mb-3 uppercase tracking-wider">
                    {trimmedLine.replace(/^#### /, '')}
                </h4>
            );
            return;
        }

        // Handle Bullet Points
        if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
            elements.push(
                <div key={lineIndex} className="flex gap-3 ml-2 mb-3 items-start">
                    <span className="text-blue-500 mt-2 text-[6px]">●</span>
                    <span className="flex-1 text-sm leading-relaxed text-muted-foreground">{parseInlineStyles(trimmedLine.substring(2))}</span>
                </div>
            );
            return;
        }

        // Handle Numbered Lists
        if (/^\d+\.\s/.test(trimmedLine)) {
            const num = trimmedLine.match(/^\d+/)[0];
            elements.push(
                <div key={lineIndex} className="flex gap-3 ml-2 mb-3 items-start">
                    <span className="text-blue-600 dark:text-blue-400 font-bold text-sm min-w-[20px]">{num}.</span>
                    <span className="flex-1 text-sm leading-relaxed text-muted-foreground">{parseInlineStyles(trimmedLine.replace(/^\d+\.\s/, ''))}</span>
                </div>
            );
            return;
        }

        if (!trimmedLine) {
            elements.push(<div key={lineIndex} className="h-4" />);
            return;
        }

        // Regular text
        elements.push(
            <p key={lineIndex} className="mb-4 text-sm leading-relaxed text-muted-foreground font-normal">
                {parseInlineStyles(line)}
            </p>
        );
    });

    return <>{elements}</>;
};

const parseInlineStyles = (text) => {
    // Handle inline code first `code`
    const parts = text.split(/(`[^`]+`)/g);

    return parts.map((part, partIndex) => {
        // Inline code
        if (part.startsWith('`') && part.endsWith('`')) {
            return (
                <code key={partIndex} className="px-1.5 py-0.5 mx-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-sm font-mono border border-blue-200 dark:border-blue-800">
                    {part.slice(1, -1)}
                </code>
            );
        }

        // Handle bold **text** and highlighted ==text==
        const subParts = part.split(/(\*\*[^*]+\*\*|==[^=]+==)/g);

        return subParts.map((subPart, subIndex) => {
            // Bold text
            if (subPart.startsWith('**') && subPart.endsWith('**')) {
                return (
                    <strong key={`${partIndex}-${subIndex}`} className="font-bold text-blue-700 dark:text-blue-300">
                        {subPart.slice(2, -2)}
                    </strong>
                );
            }

            // Highlighted text
            if (subPart.startsWith('==') && subPart.endsWith('==')) {
                return (
                    <mark key={`${partIndex}-${subIndex}`} className="bg-yellow-200 dark:bg-yellow-600/30 text-gray-900 dark:text-gray-100 px-1 rounded">
                        {subPart.slice(2, -2)}
                    </mark>
                );
            }

            return subPart;
        });
    });
};

const StageItem = memo(({ type, content, video, isFinal }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 last:mb-0 w-full overflow-hidden"
        >
            <div className="w-full overflow-hidden">
                {formatMessage(content)}
            </div>

            {isFinal && video && (
                <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-xl w-full max-w-full">
                    <div className="p-3 bg-blue-500/5 border-b flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1 bg-blue-500 rounded-lg shrink-0">
                                <Youtube className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 truncate">Recommended Tutorial</span>
                        </div>
                        <a
                            href={video}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 rounded-md text-[9px] font-bold text-blue-600 transition-colors"
                        >
                            <ArrowUpRight className="w-3 h-3" />
                            YOUTUBE
                        </a>
                    </div>
                    <div className="w-full relative bg-black aspect-video">
                        <ReactPlayer
                            url={video}
                            width="100%"
                            height="100%"
                            style={{ position: 'absolute', top: 0, left: 0 }}
                            controls={true}
                        />
                    </div>
                </div>
            )}
        </motion.div>
    );
});

const SequentialFlow = ({ content, onComplete, scrollRef, speak, messageId, suggestedVideo, shouldSpeak }) => {
    const stages = useMemo(() => {
        const parts = [];
        const markers = ['[[INTRO]]', '[[CONCEPT]]', '[[CODE]]', '[[SUMMARY]]'];

        let findNextMarker = (index) => {
            let earliest = -1;
            let foundMarker = '';
            markers.forEach(m => {
                const pos = content.indexOf(m, index);
                if (pos !== -1 && (earliest === -1 || pos < earliest)) {
                    earliest = pos;
                    foundMarker = m;
                }
            });
            return { pos: earliest, marker: foundMarker };
        };

        let next = findNextMarker(0);
        while (next.pos !== -1) {
            const endPos = findNextMarker(next.pos + next.marker.length);
            const raw = content.substring(next.pos + next.marker.length, endPos.pos === -1 ? content.length : endPos.pos).trim();

            const videoMatchInside = raw.match(/\[\[VIDEO:\s*(https?:\/\/[^\]]+)\]\]/);
            const videoMatchRaw = raw.match(/https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/[^\s]+/);

            const videoUrl = videoMatchInside ? videoMatchInside[1] : (videoMatchRaw ? videoMatchRaw[0] : null);
            const cleanRaw = raw.replace(/\[\[VIDEO:?\s*[^\]]*\]\]/g, '').replace(/https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/[^\s]+/g, '').trim();

            parts.push({
                type: next.marker.replace(/\[\[|\]\]/g, ''),
                content: cleanRaw,
                video: videoUrl
            });

            next = endPos;
        }

        if (parts.length === 0) {
            const videoMatchInside = content.match(/\[\[VIDEO:\s*(https?:\/\/[^\]]+)\]\]/);
            const videoMatchRaw = content.match(/https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/[^\s]+/);
            const videoUrl = videoMatchInside ? videoMatchInside[1] : (videoMatchRaw ? videoMatchRaw[0] : null);
            const cleanContent = content.replace(/\[\[VIDEO:?\s*[^\]]*\]\]/g, '').replace(/https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/[^\s]+/g, '').trim();

            parts.push({ type: 'CONCEPT', content: cleanContent, video: videoUrl });
        }

        // Consolidate videos: prioritize embedded video, fallback to suggestedVideo
        const videoInAnyStage = parts.find(p => p.video);
        if (videoInAnyStage && parts.length > 0) {
            // If AI embedded a video in text, use that
            parts.forEach(p => p.video = null);
            parts[parts.length - 1].video = videoInAnyStage.video;
        } else if (suggestedVideo && parts.length > 0) {
            // Otherwise use backend's suggested video
            parts[parts.length - 1].video = suggestedVideo.url;
        }

        return parts;
    }, [content, suggestedVideo]);

    // Fast sequential rendering without char-by-char typing
    useEffect(() => {
        // Speak full content immediately only during initial typing phase
        if (shouldSpeak) {
            speak(content, messageId);
        }

        // Signal completion immediately
        if (onComplete) onComplete();

        // Scroll to bottom
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [content, messageId, shouldSpeak]);

    return (
        <div className="space-y-4">
            {stages.map((s, i) => (
                <StageItem
                    key={i}
                    type={s.type}
                    content={s.content}
                    video={s.video}
                    isFinal={i === stages.length - 1}
                />
            ))}
        </div>
    );
};

export default function AITutor({ courseId, contentId, contentTitle, selectedText, visualContext, isParentActive = true }) {
    const { user } = useAuth();
    const userName = user?.profile?.name || 'Student';
    const [messages, setMessages] = useState([]);
    const hasSpokenWelcome = useRef(false);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [targetLanguage, setTargetLanguage] = useState(localStorage.getItem('ai_tutor_lang') || 'english'); // 'english' or 'hindi'
    const [speaking, setSpeaking] = useState(null); // ID of message being spoken
    const [voices, setVoices] = useState([]);
    const [selectedVoice, setSelectedVoice] = useState(null);
    const [showGroqModal, setShowGroqModal] = useState(false);
    const [groqModalReason, setGroqModalReason] = useState(null);
    const [interactionCount, setInteractionCount] = useState(parseInt(localStorage.getItem('ai_interaction_count') || '0'));
    const scrollRef = useRef(null);
    const recognitionRef = useRef(null);
    const audioRef = useRef(null);

    // Persist language selection
    useEffect(() => {
        localStorage.setItem('ai_tutor_lang', targetLanguage);
    }, [targetLanguage]);

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
                { name: 'Hritik (Premium Voice)', lang: 'en-IN/HI', id: 'cf9tC611hEQi8k5sX1Hr', isExpert: true, engine: 'elevenlabs' },
                { name: 'Expert AI (Indian)', lang: 'en-IN', id: 'Aditi', isExpert: true, engine: 'polly' },
                { name: 'Expert AI (US)', lang: 'en-US', id: 'Joanna', isExpert: true, engine: 'polly' },
                { name: 'Expert AI (UK)', lang: 'en-GB', id: 'Amy', isExpert: true, engine: 'polly' }
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
            window.speechSynthesis.cancel();
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    // Stop AI when parent tab is hidden
    useEffect(() => {
        if (!isParentActive) {
            stopAI();
        }
    }, [isParentActive]);

    // Localized dynamic welcome message removed (Rule 9/4)
    useEffect(() => {
        // Start empty for a cleaner interface
    }, []);

    // Effect to auto-select best voice when language changes
    useEffect(() => {
        if (!voices.length) return;

        if (targetLanguage === 'hindi') {
            const hritik = voices.find(v => v.id === 'cf9tC611hEQi8k5sX1Hr');
            const googleHindi = voices.find(v => v.lang.startsWith('hi'));

            if (googleHindi) setSelectedVoice(googleHindi);
            else if (hritik) setSelectedVoice(hritik);
        } else {
            // Default back to an Indian English or any valid English voice
            const aditi = voices.find(v => v.id === 'Aditi');
            const expertIn = voices.find(v => v.lang === 'en-IN' && v.isExpert);
            const anyEnIn = voices.find(v => v.lang === 'en-IN');
            const anyEn = voices.find(v => v.lang.startsWith('en'));

            setSelectedVoice(aditi || expertIn || anyEnIn || anyEn || voices[0]);
        }
    }, [targetLanguage, voices.length]);

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
                contentId: contentId,
                language: /hindi|samajha|kaise|kya|kyun|hindi|hinglish/i.test(userQuery) ? 'hindi' : targetLanguage
            });

            const { doubt, source, isSaved } = response.data.data;

            const aiMsgId = (Date.now() + 1).toString();
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: doubt.aiResponse,
                id: aiMsgId,
                doubtId: doubt._id,
                isTyping: true,
                confidence: doubt.confidence || 95,
                source: source,
                isSaved: isSaved,
                pendingVideo: doubt.suggestedVideo
            }]);

        } catch (error) {
            console.error('AI Tutor error:', error);

            if (error.response?.data?.errorCode) {
                const errorCode = error.response.data.errorCode;
                if (errorCode === 'API_LIMIT_REACHED' || errorCode === 'INVALID_API_KEY' || errorCode === 'NO_API_KEY') {
                    setGroqModalReason(errorCode);
                    setShowGroqModal(true);
                    return;
                }
            }

            toast.error(error.response?.data?.message || 'Failed to get answer from AI Tutor');
        } finally {
            const newCount = interactionCount + 1;
            setInteractionCount(newCount);
            localStorage.setItem('ai_interaction_count', newCount.toString());

            // Show modal every 5 interactions if not configured
            if (newCount % 5 === 0 && !user?.groqApiKey) {
                setShowGroqModal(true);
            }

            setLoading(false);
        }
    };

    const handleTypingComplete = useCallback((id) => {
        setMessages(prev => {
            return prev.map(msg =>
                msg.id === id ? { ...msg, isTyping: false } : msg
            );
        });
    }, []);

    const speak = useCallback(async (text, id) => {
        // Clean text for speech - remove markers, code blocks, and formatting
        const cleanText = text
            .replace(/\[\[VIDEO:?\s*[^\]]*\]\]/g, '') // Remove video markers
            .replace(/https?:\/\/[^\s\[\]"'>]+/g, '') // Remove raw URLs
            .replace(/\[\[(INTRO|CONCEPT|CODE|SUMMARY)\]\]/g, '') // Remove stage markers
            .replace(/```[\s\S]*?```/g, '... code snippet ... ') // Replace code blocks with placeholder
            .replace(/####\s+(.+)/g, '$1. ') // Convert h4 to spoken text
            .replace(/###\s+(.+)/g, '$1. ') // Convert h3 to spoken text
            .replace(/[#*`~]/g, '') // Remove markdown symbols
            .replace(/\n\s*[-*]\s+/g, '\n') // Clean bullet points
            .replace(/\*\*/g, '') // Remove bold markers
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();

        if (!cleanText) return;

        window.speechSynthesis.cancel();
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        // We use a local check instead of dependening on speaking state
        // to keep the speak function reference stable
        if (selectedVoice?.isExpert) {
            try {
                setSpeaking(id);
                const response = await apiClient.post('/ai/tts', {
                    text: cleanText,
                    voiceId: selectedVoice.id,
                    engine: selectedVoice.engine || 'polly'
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

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = targetLanguage === 'hindi' ? 'hi-IN' : 'en-US';
        if (selectedVoice && !selectedVoice.isExpert) {
            utterance.voice = selectedVoice;
        }
        utterance.rate = 1.1; // Slightly increased speed as requested
        utterance.pitch = 1.0;

        utterance.onstart = () => setSpeaking(id);
        utterance.onend = () => setSpeaking(null);
        utterance.onerror = () => setSpeaking(null);

        window.speechSynthesis.speak(utterance);
    }, [selectedVoice, targetLanguage]);

    const stopAI = () => {
        window.speechSynthesis.cancel();
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setSpeaking(null);
        setMessages(prev => prev.map(m => ({ ...m, isTyping: false })));
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
        <div className="flex flex-col h-full bg-background border-l w-full">
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
                            <Bot className="w-3.5 h-3.5" />
                            <select
                                value={targetLanguage}
                                onChange={(e) => setTargetLanguage(e.target.value)}
                                className="bg-transparent border-none text-[10px] font-bold uppercase focus:outline-none cursor-pointer"
                            >
                                <option value="english">English</option>
                                <option value="hindi">Hindi/हिन्दी</option>
                            </select>
                        </div>
                    </div>

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
                                className="bg-transparent border-none text-[10px] font-bold uppercase focus:outline-none cursor-pointer max-w-[80px] truncate"
                            >
                                {voices.map((v, idx) => {
                                    let label = v.name;
                                    const langCode = v.lang.split('-')[0].toUpperCase();
                                    const countryCode = v.lang.split('-')[1]?.toUpperCase() || '';

                                    if (v.isExpert) label = `✨ ${v.name}`;
                                    else {
                                        // Format: Name (Language-Country) e.g., Hindi-IN
                                        const cleanName = v.name.replace(/Google/g, '').replace(/Hindi/g, '').trim();
                                        label = `${cleanName || 'System'} (${langCode}${countryCode ? '-' + countryCode : ''})`;
                                    }

                                    return (
                                        <option key={idx} value={v.name}>
                                            {label}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    </div>
                </div>
                <Sparkles className="w-4 h-4 text-primary opacity-50" />
            </div>

            {/* Chat Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6 scroll-smooth custom-scrollbar"
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

                            <div className="space-y-2 max-w-full overflow-hidden">
                                <div className={`py-1 text-sm leading-relaxed transition-all duration-300 w-full overflow-hidden`}>

                                    {msg.role === 'assistant' ? (
                                        <div className="space-y-4">
                                            <SequentialFlow
                                                content={msg.content}
                                                scrollRef={scrollRef}
                                                speak={speak}
                                                messageId={msg.id}
                                                suggestedVideo={msg.pendingVideo}
                                                shouldSpeak={msg.isTyping}
                                                onComplete={() => msg.isTyping && handleTypingComplete(msg.id)}
                                            />

                                            {!msg.isTyping && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className={`p-4 rounded-2xl transition-all border ${msg.source === 'KNOWLEDGE_GRAPH'
                                                        ? 'bg-emerald-500/5 dark:bg-emerald-500/5 border-emerald-500/30'
                                                        : msg.isSaved
                                                            ? 'bg-amber-500/5 border-amber-500/30'
                                                            : 'bg-white/5 dark:bg-black/20 dark:border-white/5 border-white/10'
                                                        } backdrop-blur-md shadow-inner`}
                                                >
                                                    <div className="flex items-center justify-between flex-wrap gap-4">
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            {msg.source === 'KNOWLEDGE_GRAPH' ? (
                                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full group cursor-help" title="Verified answer from the institutional knowledge base">
                                                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                                                                    <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tight flex items-center gap-2">
                                                                        🟢 <span className="mt-0.5">Knowledge Graph Hit</span>
                                                                    </span>
                                                                </div>
                                                            ) : msg.isSaved ? (
                                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full group cursor-help" title="High confidence AI response saved for future learning">
                                                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
                                                                    <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-tight flex items-center gap-2">
                                                                        🟡 <span className="mt-0.5">Learned Resolution</span>
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full group cursor-help" title="Real-time AI response (not yet in database)">
                                                                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
                                                                    <span className="text-[11px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-tight flex items-center gap-2">
                                                                        🔴 <span className="mt-0.5">AI API Response</span>
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {msg.confidence && (
                                                                <div className={`px-2 py-1 rounded-lg text-[11px] font-bold ${msg.confidence >= 85 ? 'text-emerald-500' :
                                                                    msg.confidence >= 70 ? 'text-amber-500' :
                                                                        'text-rose-500'
                                                                    }`}>
                                                                    {Math.round(msg.confidence)}% Reliability
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            {!msg.escalated ? (
                                                                <button
                                                                    onClick={() => handleEscalate(msg.doubtId, msg.id)}
                                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-[11px] font-bold border ${msg.confidence >= 85 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500 hover:text-white' :
                                                                        msg.confidence >= 70 ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500 hover:text-white' :
                                                                            'bg-rose-500/10 text-rose-600 border-rose-500/20 hover:bg-rose-500 hover:text-white font-black animate-pulse'
                                                                        }`}
                                                                    title={msg.confidence < 70 ? "Low reliability - Highly recommended to escalate" : "Need more help? Escalate to your mentor"}
                                                                >
                                                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                                                    <span>{msg.confidence < 70 ? "Escalate to Mentor" : "Escalate"}</span>
                                                                </button>
                                                            ) : (
                                                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-full text-[11px] font-bold border border-emerald-500/20">
                                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                                    <span>Escalated</span>
                                                                </div>
                                                            )}

                                                            <button
                                                                onClick={() => speak(msg.content, msg.id)}
                                                                className={`p-2 rounded-xl transition-all ${speaking === msg.id ? 'bg-primary text-white shadow-lg' : 'hover:bg-primary/10 text-primary'}`}
                                                                title="Listen again"
                                                            >
                                                                <Volume2 className={`w-4 h-4 ${speaking === msg.id ? 'animate-pulse' : ''}`} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Auto-suggestion for low confidence */}
                                                    {msg.confidence < 70 && !msg.escalated && (
                                                        <div className="mt-3 py-2 px-3 bg-rose-500/10 rounded-lg border border-rose-500/20 flex items-center gap-2">
                                                            <AlertCircle className="w-3 h-3 text-rose-500" />
                                                            <span className="text-[11px] text-rose-600 font-medium italic">Confidence is low. Escalation recommended for accuracy.</span>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="py-2 px-4 bg-secondary text-foreground rounded-2xl shadow-sm border border-black/5">
                                            {formatMessage(msg.content)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
            {loading && (
                <div className="flex justify-start">
                    <div className="flex gap-3 max-w-[85%] items-center">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-primary" />
                        </div>
                        <div className="py-2 px-4 flex items-center gap-2 text-muted-foreground italic text-xs">
                            <Loader2 className="w-3 h-3 animate-spin text-primary" />
                            Analyzing and preparing context-aware response...
                        </div>
                    </div>
                </div>
            )}

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
                            className={`w-full bg-secondary border-none rounded-2xl py-3 pl-4 transition-all shadow-inner ${(speaking || messages.some(m => m.isTyping)) ? 'pr-20' : 'pr-12'
                                } ${isListening ? 'ring-2 ring-red-500/50' : 'focus:ring-2 focus:ring-primary/20'}`}
                            disabled={loading}
                        />
                        {(speaking || messages.some(m => m.isTyping)) ? (
                            <button
                                type="button"
                                onClick={stopAI}
                                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all shadow-md flex items-center gap-2 animate-in fade-in zoom-in duration-200"
                                title="Stop AI Explanation"
                            >
                                <Square className="w-3 h-3 fill-white" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Stop</span>
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={!input.trim() || loading}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all shadow-md"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        )}
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
            {/* Groq API Key Config Modal */}
            <GroqKeyModal
                isOpen={showGroqModal}
                onClose={() => setShowGroqModal(false)}
                onSave={() => {
                    setShowGroqModal(false);
                    toast.success('AI Session recharged! You can try asking again.');
                }}
                initialReason={groqModalReason}
            />
        </div >
    );
}
