import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

// For deployment: VITE_API_URL is "/api" (relative), so Socket.IO connects to same origin
// For local dev: VITE_API_URL is "http://localhost:5000/api", extract just the origin
const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = rawApiUrl.startsWith('http')
    ? new URL(rawApiUrl).origin
    : ''; // empty string = same origin (works with Nginx proxy)

export const useSocket = () => {
    const [socket, setSocket] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || !user) return;

        const newSocket = io(SOCKET_URL, {
            auth: { token }
        });

        // Join user-specific room automatically
        newSocket.emit('join:user', user._id);
        console.log(`Connected to socket and joined room for user: ${user._id}`);

        setSocket(newSocket);

        return () => {
            console.log('Closing socket connection');
            newSocket.close();
        };
    }, [user]);

    return socket;
};
