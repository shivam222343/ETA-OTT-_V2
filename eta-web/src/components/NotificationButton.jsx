import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import NotificationSidebar from './NotificationSidebar';
import apiClient from '../api/axios.config';
import { useSocket } from '../contexts/SocketContext';

export default function NotificationButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const socket = useSocket();

    useEffect(() => {
        fetchUnreadCount();
    }, []);

    useEffect(() => {
        if (socket) {
            const handleNew = () => {
                setUnreadCount(prev => prev + 1);
            };
            socket.on('notification:new', handleNew);

            return () => {
                socket.off('notification:new', handleNew);
            };
        }
    }, [socket]);

    const fetchUnreadCount = async () => {
        try {
            const response = await apiClient.get('/notifications?limit=1');
            setUnreadCount(response.data.data.unreadCount || 0);
        } catch (error) {
            console.error('Fetch unread count error:', error);
        }
    };

    return (
        <>
            <button
                onClick={() => {
                    setIsOpen(true);
                }}
                className="p-2.5 bg-secondary/50 rounded-xl relative hover:bg-secondary transition-colors group"
            >
                <Bell className="w-5 h-5 group-hover:shake transition-opacity" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] px-1.5 items-center justify-center bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-background shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-in zoom-in duration-300">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            <NotificationSidebar
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                onUnreadCountChange={(count) => setUnreadCount(count)}
            />
        </>
    );
}
