import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(undefined);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user, token } = useAuth();

    useEffect(() => {
        if (user && token) {
            const apiURL = import.meta.env.VITE_API_URL || window.location.origin + '/api';
            const socketURL = apiURL.replace('/api', '');

            const newSocket = io(socketURL, {
                auth: { token },
                transports: ['websocket'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000
            });

            newSocket.on('connect', () => {
                console.log('Connected to WebSocket server');
                newSocket.emit('join:user', user._id || user.id);
            });

            newSocket.on('connect_error', (error) => {
                console.error('WebSocket connection error:', error);
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        }
    }, [user, token]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
