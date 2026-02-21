import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell, X, Check, Trash2,
    MessageSquare, CheckCircle,
    XCircle, Building2, BellOff,
    MoreVertical, Info, ChevronDown, ChevronUp
} from 'lucide-react';
import apiClient from '../api/axios.config';
import { useSocket } from '../contexts/SocketContext';
import toast from 'react-hot-toast';
import { useInView } from 'react-intersection-observer';

function NotificationItem({ notification, onRead, onDelete }) {
    const [expanded, setExpanded] = useState(false);
    const { ref, inView } = useInView({
        triggerOnce: true,
        threshold: 0.5,
        skip: notification.read
    });

    useEffect(() => {
        if (inView && !notification.read) {
            onRead(notification._id);
        }
    }, [inView, notification.read, notification._id, onRead]);

    const getIcon = (type) => {
        switch (type) {
            case 'doubt_escalated': return <MessageSquare className="w-4 h-4 text-orange-500" />;
            case 'doubt_answered': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'institution_created': return <Building2 className="w-4 h-4 text-blue-500" />;
            case 'institution_approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'institution_rejected': return <XCircle className="w-4 h-4 text-red-500" />;
            default: return <Bell className="w-4 h-4 text-primary" />;
        }
    };

    const hasExtraContent = notification.metadata && (
        notification.metadata.query ||
        notification.metadata.selectedText ||
        notification.metadata.aiResponse
    );

    return (
        <motion.div
            ref={ref}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl border transition-all group relative ${notification.read
                ? 'bg-card border-border'
                : 'bg-primary/5 border-primary/20 shadow-sm'
                }`}
        >
            <div className="flex gap-4">
                <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${notification.read ? 'bg-muted' : 'bg-primary/10'
                    }`}>
                    {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0 pr-6">
                    <h4 className={`text-sm font-bold truncate ${notification.read ? 'text-foreground/80' : 'text-primary'}`}>
                        {notification.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                        {notification.message}
                    </p>

                    {hasExtraContent && (
                        <div className="mt-3">
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-primary hover:text-primary/70 transition-colors"
                            >
                                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                {expanded ? 'Hide Details' : 'View Details'}
                            </button>

                            <AnimatePresence>
                                {expanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="mt-3 space-y-3 p-3 bg-secondary/50 rounded-xl border border-border/50">
                                            {notification.metadata.query && (
                                                <div>
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Query</p>
                                                    <p className="text-xs italic">"{notification.metadata.query}"</p>
                                                </div>
                                            )}
                                            {notification.metadata.selectedText && (
                                                <div>
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Selected Text</p>
                                                    <div className="max-h-24 overflow-y-auto custom-scrollbar text-xs bg-card/50 p-2 rounded-lg border border-border/30 whitespace-pre-wrap">
                                                        {notification.metadata.selectedText}
                                                    </div>
                                                </div>
                                            )}
                                            {notification.metadata.aiResponse && (
                                                <div>
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">AI Response</p>
                                                    <div className="max-h-32 overflow-y-auto custom-scrollbar text-xs leading-relaxed whitespace-pre-wrap">
                                                        {notification.metadata.aiResponse}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-muted-foreground font-medium">
                            {new Date(notification.createdAt).toLocaleDateString()} at {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {!notification.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                    </div>
                </div>
            </div>

            {/* Item Actions */}
            <div className="absolute top-4 right-4 flex items-center gap-1 opacity-10 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                {!notification.read && (
                    <button
                        onClick={() => onRead(notification._id)}
                        className="p-1.5 hover:bg-primary/10 text-primary rounded-lg"
                        title="Mark as read"
                    >
                        <Check className="w-4 h-4" />
                    </button>
                )}
                <button
                    onClick={() => onDelete(notification._id)}
                    className="p-1.5 hover:bg-red-500/10 text-red-500 rounded-lg"
                    title="Delete"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
}

export default function NotificationSidebar({ isOpen, onClose, onUnreadCountChange }) {
    const socket = useSocket();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, pages: 1 });
    const [unreadCount, setUnreadCount] = useState(0);
    const sidebarRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            fetchNotifications(1);
        } else {
            // Fetch only unread count when closed but mounted
            fetchUnreadCountOnly();
        }
    }, [isOpen]);

    const fetchUnreadCountOnly = async () => {
        try {
            const response = await apiClient.get('/notifications?limit=1');
            setUnreadCount(response.data.data.unreadCount || 0);
        } catch (error) {
            console.error('Fetch unread count error:', error);
        }
    };

    useEffect(() => {
        if (onUnreadCountChange) {
            onUnreadCountChange(unreadCount);
        }
    }, [unreadCount, onUnreadCountChange]);

    useEffect(() => {
        if (socket) {
            const handleNewNotification = (notification) => {
                setNotifications(prev => [notification, ...prev]);
                setUnreadCount(prev => prev + 1);
                // Toast for real-time notification
                toast(notification.title, {
                    icon: '🔔',
                    position: 'top-right',
                });
            };

            socket.on('notification:new', handleNewNotification);

            return () => {
                socket.off('notification:new', handleNewNotification);
            };
        }
    }, [socket]);

    const fetchNotifications = async (page = 1, append = false) => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/notifications?page=${page}&limit=20`);
            const { notifications: newNotifs, pagination: pagin, unreadCount: count } = response.data.data;

            if (append) {
                setNotifications(prev => [...prev, ...newNotifs]);
            } else {
                setNotifications(newNotifs);
            }

            setPagination(pagin);
            setUnreadCount(count);
        } catch (error) {
            console.error('Fetch notifications error:', error);
            toast.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id) => {
        // Prevent redundant calls if already read locally (e.g. from inView and click)
        const target = notifications.find(n => n._id === id);
        if (!target || target.read) return;

        try {
            await apiClient.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Mark as read error:', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await apiClient.patch('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
            toast.success('All marked as read');
        } catch (error) {
            toast.error('Failed to mark all as read');
        }
    };

    const handleDelete = async (id) => {
        try {
            const target = notifications.find(n => n._id === id);
            await apiClient.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n._id !== id));
            if (target && !target.read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
            toast.success('Notification deleted');
        } catch (error) {
            toast.error('Failed to delete notification');
        }
    };

    const handleDeleteAll = async () => {
        if (!window.confirm('Are you sure you want to delete all notifications?')) return;
        try {
            await apiClient.delete('/notifications/delete-all');
            setNotifications([]);
            setUnreadCount(0);
            toast.success('All notifications deleted');
        } catch (error) {
            toast.error('Failed to delete all');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110]"
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-screen w-full max-w-md bg-card border-l border-border z-[120] shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-border flex items-center justify-between bg-card shrink-0">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-primary" />
                                    Notifications
                                    {unreadCount > 0 && (
                                        <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                                            {unreadCount}
                                        </span>
                                    )}
                                </h2>
                                <p className="text-xs text-muted-foreground mt-1">Real-time updates & alerts</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Actions */}
                        <div className="px-6 py-3 border-b border-border flex items-center justify-between bg-muted/30 shrink-0">
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                                disabled={unreadCount === 0}
                            >
                                <Check className="w-3 h-3" />
                                Mark all as read
                            </button>
                            <button
                                onClick={handleDeleteAll}
                                className="text-xs font-medium text-red-500 hover:underline flex items-center gap-1"
                                disabled={notifications.length === 0}
                            >
                                <Trash2 className="w-3 h-3" />
                                Clear all
                            </button>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {notifications.length === 0 && !loading ? (
                                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                        <BellOff className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="font-bold">No notifications yet</h3>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        We'll notify you when something important happens!
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {notifications.map((notification) => (
                                        <NotificationItem
                                            key={notification._id}
                                            notification={notification}
                                            onRead={handleMarkAsRead}
                                            onDelete={handleDelete}
                                        />
                                    ))}

                                    {pagination.page < pagination.pages && (
                                        <button
                                            onClick={() => fetchNotifications(pagination.page + 1, true)}
                                            className="w-full py-3 text-xs font-bold text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2"
                                            disabled={loading}
                                        >
                                            {loading ? 'Loading...' : 'Load more notifications'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer Info */}
                        <div className="p-4 bg-muted/20 border-t border-border flex items-center gap-2 text-[10px] text-muted-foreground shrink-0">
                            <Info className="w-3 h-3" />
                            Notifications are automatically cleared after 30 days.
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
