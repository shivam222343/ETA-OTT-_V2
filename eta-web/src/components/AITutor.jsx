import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Volume2, Sparkles, AlertCircle, ArrowUpRight, CheckCircle2, Maximize2, Globe, Mic, MicOff, Youtube, Play, Square } from 'lucide-react';
import ReactPlayer from 'react-player';
import apiClient from '../api/axios.config';
import toast from 'react-hot-toast';

const formatMessage = (content) => {
    if (!content) return null;

    // Clean up markers and video links so they don't show as raw text
    const cleanContent = content
        .replace(/\[\[(INTRO|CONCEPT|CODE|SUMMARY)\]\]/g, '')
        .replace(/\[\[VIDEO:\s*(https?:\/\/[^\]]+)\]\]/g, '')
        .replace(/https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/[^\s]+/g, '') // Remove standalone YouTube URLs
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
                    <div key={`code-${lineIndex}`} className="my-6 rounded-2xl overflow-hidden border border-border shadow-2xl bg-[#0d1117] w-full">
                        <div className="bg-[#161b22] px-4 py-2 border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex gap-1 shrink-0">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                                </div>
                                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest ml-2 truncate">
                                    {codeLanguage}
                                </span>
                            </div>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(codeString);
                                    toast.success('Code copied!');
                                }}
                                className="text-[10px] text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded shrink-0"
                            >
                                Copy
                            </button>
                        </div>
                        <div className="p-0 overflow-x-auto custom-scrollbar scrollbar-none sm:scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            <pre className="p-5 min-w-full w-fit">
                                <code className="text-[13px] font-mono leading-relaxed text-[#c9d1d9] block whitespace-pre">
                                    {codeLines.map((l, i) => (
                                        <div key={i} className="flex gap-4 min-w-fit">
                                            <span className="text-gray-600 select-none text-right min-w-[20px]">{i + 1}</span>
                                            <span className="flex-1 whitespace-pre">{l}</span>
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

        // Handle ### Headers (Bold for Title)
        if (trimmedLine.startsWith('### ')) {
            elements.push(
                <h3 key={lineIndex} className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-8 mb-4">
                    {trimmedLine.replace(/^### /, '')}
                </h3>
            );
            return;
        }

        // Handle #### Subheaders
        if (trimmedLine.startsWith('#### ')) {
            elements.push(
                <h4 key={lineIndex} className="text-base font-semibold text-blue-600 dark:text-blue-400 mt-6 mb-3">
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
                    <div className="p-3 bg-red-500/5 border-b flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1 bg-red-500 rounded-lg shrink-0">
                                <Youtube className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-red-600 truncate">Mastery Tutorial</span>
                        </div>
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

const SequentialFlow = ({ content, onComplete, scrollRef, speak }) => {
    const [visibleStages, setVisibleStages] = useState([]);
    const [currentStageIndex, setCurrentStageIndex] = useState(0);
    const [typingText, setTypingText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [codeTypingSpeed, setCodeTypingSpeed] = useState(45);

    const stages = useMemo(() => {
        const parts = [];
        const markers = ['[[INTRO]]', '[[CONCEPT]]', '[[CODE]]', '[[SUMMARY]]'];

        let lastIndex = 0;

        const findNextMarker = (index) => {
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

            const videoMatch = raw.match(/\[\[VIDEO:\s*(https?:\/\/[^\]]+)\]\]/);
            const cleanRaw = raw.replace(/\[\[VIDEO:\s*(https?:\/\/[^\]]+)\]\]/g, '').trim();

            parts.push({
                type: next.marker.replace(/\[\[|\]\]/g, ''),
                content: cleanRaw,
                video: videoMatch ? videoMatch[1] : null
            });

            next = endPos;
        }

        if (parts.length === 0) {
            const videoMatch = content.match(/\[\[VIDEO:\s*(https?:\/\/[^\]]+)\]\]/);
            const cleanContent = content.replace(/\[\[VIDEO:\s*(https?:\/\/[^\]]+)\]\]/g, '').trim();
            parts.push({
                type: 'CONCEPT',
                content: cleanContent,
                video: videoMatch ? videoMatch[1] : null
            });
        }

        // Ensure video is attached to the last stage for proper display
        const videoInAnyStage = parts.find(p => p.video);
        if (videoInAnyStage && parts.length > 0) {
            // Move video to last stage
            parts.forEach(p => p.video = null);
            parts[parts.length - 1].video = videoInAnyStage.video;
        }

        return parts;
    }, [content]);

    useEffect(() => {
        if (currentStageIndex < stages.length) {
            const stage = stages[currentStageIndex];
            setIsTyping(true);
            setTypingText('');

            if (stage.type === 'CODE') {
                const conceptStage = stages.find(s => s.type === 'CONCEPT');
                const conceptLength = conceptStage?.content.length || 100;
                const speed = Math.max(20, Math.min(80, Math.floor(conceptLength / 6)));
                setCodeTypingSpeed(speed);
            } else {
                setCodeTypingSpeed(45);
            }

            // Speak non-code stages while typing for simultaneous explanation
            if (stage.type !== 'CODE') {
                speak(stage.content, `stage-${currentStageIndex}`);
            }

            let charIndex = 0;
            const textToType = stage.content;
            const timer = setInterval(() => {
                if (charIndex < textToType.length) {
                    // Optimized batching: type more characters at once for longer text to reduce React work
                    let chunkSize = 1;
                    if (textToType.length > 800) chunkSize = 3;
                    else if (textToType.length > 400) chunkSize = 2;

                    const slice = textToType.substring(charIndex, charIndex + chunkSize);
                    setTypingText(prev => prev + slice);
                    charIndex += chunkSize;

                    if (scrollRef.current) {
                        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                    }
                } else {
                    clearInterval(timer);
                    setIsTyping(false);
                    setVisibleStages(prev => [...prev, { ...stage, finalContent: textToType }]);
                    setCurrentStageIndex(prev => prev + 1);
                }
            }, stage.type === 'CODE' ? codeTypingSpeed : 45);

            return () => clearInterval(timer);
        } else {
            if (onComplete) onComplete();
        }
    }, [currentStageIndex, stages, speak, onComplete, scrollRef]);

    return (
        <div className="space-y-4">
            {visibleStages.map((s, i) => (
                <StageItem
                    key={i}
                    type={s.type}
                    content={s.finalContent}
                    video={i === visibleStages.length - 1 ? s.video : null}
                    isFinal={i === visibleStages.length - 1}
                />
            ))}
            {isTyping && (
                <div className="mb-4">
                    {stages[currentStageIndex]?.type === 'CODE' && typingText.length < 50 ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground italic">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            Preparing code example...
                        </div>
                    ) : (
                        <>
                            {formatMessage(typingText)}
                            <span className="animate-pulse inline-block ml-1 border-r-2 border-primary h-4" />
                        </>
                    )}
                </div>
            )}
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

    // Localized dynamic welcome message
    useEffect(() => {
        if (messages.length === 0) {
            const resourceName = contentTitle ? `"${contentTitle}"` : 'this lesson';

            const welcomeText = targetLanguage === 'hindi'
                ? `[[INTRO]] Suno ${userName}! Aaj hum ${resourceName} ke baare mein seekhenge.\n\n[[CONCEPT]] Main aapka **personal AI Friend** hoon. Coding ho ya theory, main aapko ek dost ki tarah basic se advanced tak sab samjhaunga. Bina kisi tension ke puchiye!\n\n[[SUMMARY]] Chalo, start karein? Bataiye aaj aapka pehla sawal kya hai?`
                : `[[INTRO]] Hey ${userName}, let's master ${resourceName}!\n\n[[CONCEPT]] I'm your **personal AI Mentor**. Think of me as a friend who helps you out right before an exam. I'll break down even the hardest code into simple, chill concepts.\n\n[[SUMMARY]] Ready to dive in? What's on your mind today?`;

            const welcomeMsg = {
                role: 'assistant',
                content: welcomeText,
                id: 'welcome',
                isTyping: true
            };

            setMessages([welcomeMsg]);
        }
    }, [targetLanguage, userName, contentTitle, messages.length]);

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
                language: targetLanguage
            });

            const { doubt, source } = response.data.data;

            const aiMsgId = (Date.now() + 1).toString();
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: doubt.aiResponse,
                id: aiMsgId,
                doubtId: doubt._id,
                isTyping: true,
                confidence: doubt.confidence || 95,
                source: source
            }]);

        } catch (error) {
            console.error('AI Tutor error:', error);
            toast.error('Failed to get answer from AI Tutor');
        } finally {
            setLoading(false);
        }
    };

    const handleTypingComplete = useCallback((id) => {
        setMessages(prev => {
            const updated = prev.map(msg =>
                msg.id === id ? { ...msg, isTyping: false } : msg
            );

            const finishedMsg = updated.find(m => m.id === id);
            if (finishedMsg?.pendingVideo) {
                return [
                    ...updated,
                    {
                        role: 'assistant',
                        id: `v-${id}`,
                        suggestedVideo: finishedMsg.pendingVideo,
                        isVideoMessage: true
                    }
                ];
            }
            return updated;
        });
    }, []);

    const speak = useCallback(async (text, id) => {
        // Clean text for speech - remove markers, code blocks, and formatting
        const cleanText = text
            .replace(/\[\[VIDEO:\s*https?:\/\/[^\]]+\]\]/g, '') // Remove video URLs
            .replace(/\[\[(INTRO|CONCEPT|CODE|SUMMARY)\]\]/g, '') // Remove stage markers
            .replace(/```[\s\S]*?```/g, '... code snippet ... ') // Replace code blocks with placeholder
            .replace(/####\s+(.+)/g, '$1. ') // Convert h4 to spoken text
            .replace(/###\s+(.+)/g, '$1. ') // Convert h3 to spoken text
            .replace(/[#*`~]/g, '') // Remove markdown symbols
            .replace(/\n\s*[-*]\s+/g, '\n') // Clean bullet points
            .replace(/\*\*/g, '') // Remove bold markers
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();

        window.speechSynthesis.cancel();
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        if (speaking === id) {
            setSpeaking(null);
            return;
        }

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
        utterance.rate = 0.9;
        utterance.pitch = 1.0;

        utterance.onstart = () => setSpeaking(id);
        utterance.onend = () => setSpeaking(null);
        utterance.onerror = () => setSpeaking(null);

        window.speechSynthesis.speak(utterance);
    }, [speaking, selectedVoice, targetLanguage]);

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

                                    {msg.role === 'assistant' && msg.isTyping ? (
                                        <SequentialFlow
                                            content={msg.content}
                                            scrollRef={scrollRef}
                                            speak={speak}
                                            onComplete={() => handleTypingComplete(msg.id)}
                                        />
                                    ) : (
                                        <>
                                            {formatMessage(msg.content)}
                                            {/* Show video for completed messages */}
                                            {(() => {
                                                const videoMatch = msg.content.match(/\[\[VIDEO:\s*(https?:\/\/[^\]]+)\]\]/);
                                                if (videoMatch) {
                                                    return (
                                                        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-xl w-full max-w-full">
                                                            <div className="p-3 bg-red-500/5 border-b flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="p-1 bg-red-500 rounded-lg shrink-0">
                                                                        <Youtube className="w-4 h-4 text-white" />
                                                                    </div>
                                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-red-600 truncate">Mastery Tutorial</span>
                                                                </div>
                                                            </div>
                                                            <div className="w-full relative bg-black aspect-video">
                                                                <ReactPlayer
                                                                    url={videoMatch[1]}
                                                                    width="100%"
                                                                    height="100%"
                                                                    style={{ position: 'absolute', top: 0, left: 0 }}
                                                                    controls={true}
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </>
                                    )}

                                    {msg.role === 'assistant' && !msg.isTyping && (
                                        <div className="mt-4 flex flex-col gap-4">
                                            {/* Confidence & Actions Bar */}
                                            <div className="flex items-center justify-between border-t border-border/50 pt-4 mt-2">
                                                <div className="flex items-center gap-3">
                                                    {/* Confidence Meter */}
                                                    <div className="flex items-center gap-2 group cursor-help" title={`AI Confidence: ${msg.confidence || 95}%`}>
                                                        <div className="relative w-8 h-8 flex items-center justify-center">
                                                            <svg className="w-full h-full transform -rotate-90">
                                                                <circle
                                                                    cx="16" cy="16" r="14"
                                                                    fill="none" stroke="currentColor" strokeWidth="2"
                                                                    className="text-muted-foreground/10"
                                                                />
                                                                <circle
                                                                    cx="16" cy="16" r="14"
                                                                    fill="none" stroke="currentColor" strokeWidth="2"
                                                                    strokeDasharray={88}
                                                                    strokeDashoffset={88 - (88 * (msg.confidence || 95)) / 100}
                                                                    className={(msg.confidence || 95) > 90 ? "text-blue-500" : "text-yellow-500"}
                                                                />
                                                            </svg>
                                                            <span className="absolute text-[8px] font-bold">
                                                                {msg.confidence || 95}%
                                                            </span>
                                                        </div>
                                                        {msg.source === 'graph_db' && (
                                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
                                                                <CheckCircle2 className="w-3 h-3 text-blue-500" />
                                                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">Verified</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Escalation Button */}
                                                    {!msg.escalated && (
                                                        <button
                                                            onClick={() => handleEscalate(msg.doubtId, msg.id)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20 rounded-xl transition-all text-[10px] font-bold uppercase tracking-wider group"
                                                        >
                                                            <AlertCircle className="w-3 h-3 group-hover:rotate-12 transition-transform" />
                                                            Ask Mentor
                                                        </button>
                                                    )}
                                                    {msg.escalated && (
                                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-600 border border-green-500/20 rounded-xl text-[10px] font-bold uppercase tracking-wider">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            Escalated
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Voice Action */}
                                                <button
                                                    onClick={() => speak(msg.content, msg.id)}
                                                    className={`p-2 rounded-xl transition-all ${speaking === msg.id ? 'bg-primary text-white shadow-lg' : 'hover:bg-primary/10 text-primary'}`}
                                                    title="Listen again"
                                                >
                                                    <Volume2 className={`w-4 h-4 ${speaking === msg.id ? 'animate-pulse' : ''}`} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
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
                            <div className="py-2 px-4 flex items-center gap-2 text-muted-foreground italic text-xs">
                                <Loader2 className="w-3 h-3 animate-spin text-primary" />
                                Analyzing concept and preparing mentorship session...
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
        </div >
    );
}
