import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api$/, '');

export const useSocket = () => {
    const [socket, setSocket] = useState(null);
    const { user } = useAuth();
    const userId = user?.id || user?._id;

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || !userId) return;

        const newSocket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling']
        });

        // Join user-specific room automatically
        newSocket.emit('join:user', userId);
        console.log(`Connected to socket and joined room for user: ${userId}`);

        setSocket(newSocket);

        return () => {
            console.log('Closing socket connection');
            newSocket.close();
        };
    }, [userId]);

    return socket;
};
