import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Play, Youtube, Clock, Eye, Calendar, Sparkles, Filter, Info, MoreVertical, Share2, RefreshCcw } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import apiClient from '../../api/axios.config';
import toast from 'react-hot-toast';
import Loader from '../Loader';

const VideoSkeleton = memo(() => (
    <div className="space-y-4 animate-pulse group">
        {/* Navy blue for dark, gray for light */}
        <div className="relative aspect-video bg-slate-200 dark:bg-blue-900/20 rounded-2xl border border-slate-300 dark:border-white/5" />
        <div className="flex gap-4 px-1">
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-blue-900/20 flex-shrink-0" />
            <div className="flex-1 space-y-3">
                <div className="h-4 bg-slate-200 dark:bg-blue-900/20 rounded w-5/6" />
                <div className="h-3 bg-slate-200 dark:bg-blue-900/20 rounded w-1/2" />
            </div>
        </div>
    </div>
));

VideoSkeleton.displayName = 'VideoSkeleton';

const VideoCard = memo(({ video, onPlay, preparingId }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`flex flex-col gap-3 group cursor-pointer ${preparingId === video.id ? 'opacity-50 pointer-events-none' : ''}`}
        onClick={() => onPlay(video)}
    >
        {/* Thumbnail Area */}
        <div className="relative aspect-video rounded-xl overflow-hidden bg-secondary shadow-sm">
            <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />

            {/* Duration Badge */}
            <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/80 rounded text-[11px] font-medium text-white backdrop-blur-sm">
                {video.duration}
            </div>

            {/* Hover Play Overlay */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform duration-300">
                    {preparingId === video.id ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Play className="w-6 h-6 fill-current ml-1" />
                    )}
                </div>
            </div>

            {/* YouTube Icon Badge */}
            <div className="absolute top-2 right-2 p-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
                <Youtube className="w-3.5 h-3.5 text-white" />
            </div>
        </div>

        {/* Info Area (Below Thumbnail) */}
        <div className="flex gap-3 px-1">
            <div className="flex-shrink-0 mt-1">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary/20 to-primary/10 flex items-center justify-center border border-primary/10">
                    <span className="text-[10px] font-bold text-primary uppercase">
                        {video.author?.[0] || 'Y'}
                    </span>
                </div>
            </div>

            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[15px] leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                    {video.title}
                </h3>

                <div className="mt-1.5 space-y-0.5">
                    <p className="text-[13px] text-muted-foreground hover:text-foreground transition-colors font-medium">
                        {video.author}
                    </p>
                    <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                        <span>{video.views?.toLocaleString()} views</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
                        <span>{video.ago}</span>
                    </div>
                </div>
            </div>

            <button className="flex-shrink-0 mt-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted rounded-full">
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>
        </div>
    </motion.div>
));

VideoCard.displayName = 'VideoCard';

export default function YouTubeFeed({ onPlay }) {
    const [query, setQuery] = useState('');
    const [videos, setVideos] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [preparingId, setPreparingId] = useState(null);
    const [activeView, setActiveView] = useState('recommendations');
    const [hasInteracted, setHasInteracted] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [refreshKey, setRefreshKey] = useState(0);
    const preparingIdRef = useRef(null);

    // Banner carousel state
    const [currentBanner, setCurrentBanner] = useState(0);
    const banners = [
        {
            title: "Discover Unlimited Knowledge",
            subtitle: "Access millions of educational videos curated for your learning journey",
            gradient: "from-blue-500/20 via-purple-500/20 to-pink-500/20",
            icon: "🎓"
        },
        {
            title: "AI-Powered Learning",
            subtitle: "Get instant answers and explanations with our advanced AI tutor",
            gradient: "from-green-500/20 via-teal-500/20 to-blue-500/20",
            icon: "🤖"
        },
        {
            title: "Personalized Recommendations",
            subtitle: "Smart suggestions based on your interests and academic profile",
            gradient: "from-orange-500/20 via-red-500/20 to-pink-500/20",
            icon: "✨"
        }
    ];

    // Auto-slide banners
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentBanner((prev) => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [banners.length]);

    const { ref, inView } = useInView({
        threshold: 0.1,
        rootMargin: '200px',
        triggerOnce: false
    });

    useEffect(() => {
        if (inView && !loading && !loadingMore && (videos.length > 0 || recommendations.length > 0)) {
            loadMore();
        }
    }, [inView]);

    useEffect(() => {
        fetchRecommendations();
    }, []);

    const fetchRecommendations = useCallback(async (append = false, refresh = false) => {
        if (append) setLoadingMore(true);
        else setLoading(true);

        try {
            const fetchPage = append ? page + 1 : 1;
            const response = await apiClient.get(`/youtube/recommendations?page=${fetchPage}${refresh ? '&refresh=true' : ''}`);

            if (append) {
                setPage(prev => prev + 1);
                setRecommendations(prev => {
                    const newVideos = response.data.data.videos.filter(
                        newV => !prev.some(oldV => oldV.id === newV.id)
                    );
                    return [...prev, ...newVideos];
                });
            } else {
                // If its a full load or refresh, replace the data
                setRecommendations(response.data.data.videos);
                setRefreshKey(prev => prev + 1); // Trigger grid animation
                if (!refresh) setPage(1); // Reset page on non-append load
            }
        } catch (error) {
            console.error('Fetch recommendations error:', error);
            if (!refresh) toast.error('Failed to load recommended videos');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [apiClient, page]);

    const handleSearch = useCallback(async (e, append = false, forceRefresh = false) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!query.trim()) return;

        if (!append && (searchLoading || loading)) return;

        if (append) {
            setLoadingMore(true);
        } else {
            if (forceRefresh || videos.length === 0) {
                setSearchLoading(true);
            }
        }

        setActiveView('search');
        setHasInteracted(true);

        try {
            const fetchPage = append ? page + 1 : 1;
            const response = await apiClient.get(`/youtube/search?q=${encodeURIComponent(query)}&page=${fetchPage}`);
            if (append) {
                setPage(prev => prev + 1);
                setVideos(prev => {
                    const newVideos = response.data.data.videos.filter(
                        newV => !prev.some(oldV => oldV.id === newV.id)
                    );
                    return [...prev, ...newVideos];
                });
            } else {
                setVideos(response.data.data.videos);
            }
        } catch (error) {
            console.error('Search videos error:', error);
        } finally {
            setSearchLoading(false);
            setLoadingMore(false);
        }
    }, [query, searchLoading, loading, videos.length, apiClient]);

    const handleRefresh = useCallback(() => {
        if (activeView === 'search') {
            handleSearch(null, false, true);
        } else {
            // Force refresh from backend bypassing cache
            fetchRecommendations(false, true);
        }
    }, [activeView, handleSearch, fetchRecommendations]);

    useEffect(() => {
        if (query.trim() && hasInteracted) {
            const timer = setTimeout(() => {
                handleSearch(null, false);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [query, hasInteracted, handleSearch]);

    const loadMore = useCallback(async () => {
        if (loadingMore || loading || searchLoading) return;
        if (activeView === 'search') {
            await handleSearch(null, true);
        } else {
            await fetchRecommendations(true);
        }
    }, [loadingMore, loading, searchLoading, activeView, handleSearch, fetchRecommendations]);

    const abortControllerRef = useRef(null);

    const handlePlay = useCallback(async (video) => {
        if (preparingIdRef.current) return;

        // Cancel existing if any
        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();

        preparingIdRef.current = video.id;
        setPreparingId(video.id);

        try {
            const response = await apiClient.post('/youtube/prepare', {
                url: video.url,
                title: video.title,
                thumbnail: video.thumbnail,
                duration: video.duration
            }, {
                signal: abortControllerRef.current.signal
            });

            if (onPlay) {
                onPlay(response.data.data.content);
            }
        } catch (error) {
            if (error.name === 'AbortError' || (error.code === 'ERR_CANCELED')) {
                console.log('Prepare request cancelled');
            } else {
                console.error('Prepare video error:', error);
                toast.error('Failed to prepare AI environment for this video');
            }
        } finally {
            preparingIdRef.current = null;
            setPreparingId(null);
            abortControllerRef.current = null;
        }
    }, [onPlay, apiClient]);

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // Components moved outside to avoid re-creation on every render

    return (
        <div className="space-y-8 pb-32">
            {/* Header with Top-Right Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 pt-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                        <Youtube className="w-6 h-6" />
                    </div>
                    <div className="space-y-0.5">
                        <h2 className="text-2xl font-black tracking-tighter">Knowledge Discovery</h2>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Live Repository</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto">
                    <button
                        onClick={handleRefresh}
                        className="p-3.5 rounded-xl bg-secondary/30 hover:bg-secondary border border-border/50 text-muted-foreground hover:text-primary transition-all shadow-sm"
                        title="Refresh Content"
                    >
                        <RefreshCcw className={`w-5 h-5 ${(loading || searchLoading) ? 'animate-spin' : ''}`} />
                    </button>

                    <form onSubmit={handleSearch} className="relative group w-64 md:w-80">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors">
                            <Search className="w-4 h-4" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search videos..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full bg-card border border-border rounded-lg py-2.5 pl-11 pr-4 text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/50 font-medium shadow-sm"
                        />
                    </form>
                </div>
            </div>

            {/* Sliding Banner Carousel */}
            <div className="px-4">
                <div className="relative h-48 rounded-3xl overflow-hidden border border-border/50 shadow-lg">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentBanner}
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            transition={{ duration: 0.5 }}
                            className={`absolute inset-0 bg-gradient-to-r ${banners[currentBanner].gradient} flex items-center justify-between p-8 md:p-12`}
                        >
                            <div className="flex-1 space-y-3 z-10">
                                <div className="text-5xl mb-2">{banners[currentBanner].icon}</div>
                                <h3 className="text-2xl md:text-3xl font-black tracking-tight">
                                    {banners[currentBanner].title}
                                </h3>
                                <p className="text-sm md:text-base text-muted-foreground max-w-md">
                                    {banners[currentBanner].subtitle}
                                </p>
                            </div>

                            {/* Decorative Elements */}
                            <div className="hidden md:block absolute right-8 top-1/2 -translate-y-1/2 opacity-10">
                                <Youtube className="w-32 h-32" />
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation Dots */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
                        {banners.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentBanner(index)}
                                className={`h-2 rounded-full transition-all ${index === currentBanner
                                    ? 'w-8 bg-primary'
                                    : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid Layout */}
            <div className="px-4">
                {activeView === 'search' && (
                    <div className="space-y-8">
                        <div className="flex items-center justify-between border-b border-border/50 pb-4">
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold tracking-tight">Search Results</h3>
                                <p className="text-xs text-muted-foreground">Top results for <span className="text-primary font-bold italic">"{query}"</span></p>
                            </div>
                            <button
                                onClick={() => { setActiveView('recommendations'); setQuery(''); }}
                                className="px-4 py-2 rounded-xl bg-secondary/50 text-xs font-bold hover:bg-red-500/10 hover:text-red-500 transition-all"
                            >
                                Clear Results
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-10">
                            {videos.map((video, index) => (
                                <VideoCard key={`${video.id}-${index}`} video={video} onPlay={handlePlay} preparingId={preparingId} />
                            ))}
                            {(searchLoading || loadingMore) && Array(8).fill(null).map((_, i) => <VideoSkeleton key={`skeleton-search-${i}`} />)}
                        </div>

                        {!searchLoading && videos.length === 0 && (
                            <div className="py-32 text-center space-y-4">
                                <div className="w-24 h-24 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Search className="w-10 h-10 text-muted-foreground/30" />
                                </div>
                                <h4 className="text-xl font-bold">No matches found</h4>
                                <p className="text-muted-foreground max-w-xs mx-auto">Try searching for broader terms or check the recommended feed.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeView === 'recommendations' && (
                    <div className="space-y-8">
                        <div className="flex items-center justify-between border-b border-border/50 pb-4">
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold tracking-tight">Personalized Discovery</h3>
                                <p className="text-xs text-muted-foreground italic">Based on your academic profile and interests.</p>
                            </div>
                        </div>

                        <motion.div
                            key={`grid-${refreshKey}`}
                            initial="hidden"
                            animate="visible"
                            variants={{
                                hidden: { opacity: 0 },
                                visible: {
                                    opacity: 1,
                                    transition: {
                                        staggerChildren: 0.05
                                    }
                                }
                            }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-10"
                        >
                            {recommendations.map((video, index) => (
                                <VideoCard key={`${video.id}-${index}-${page}`} video={video} onPlay={handlePlay} preparingId={preparingId} />
                            ))}
                            {(loading || loadingMore) && Array(8).fill(null).map((_, i) => (
                                <VideoSkeleton key={`skeleton-rec-${i}-${recommendations.length}`} />
                            ))}
                        </motion.div>

                        {!loading && recommendations.length === 0 && (
                            <div className="py-32 flex flex-col items-center justify-center text-center">
                                <Loader />
                                <p className="mt-8 text-muted-foreground font-bold tracking-widest uppercase text-[10px]">Initializing Neural Feed...</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Infinite Scroll Trigger */}
                <div ref={ref} className="h-20" />
            </div>
        </div>
    );

}
