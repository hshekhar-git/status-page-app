'use client';

import React, { createContext, useContext, useEffect, useRef, ReactNode, useState } from 'react';

type WebSocketMessage = {
    type: string;
    data: unknown;
};

type WebSocketContextType = {
    sendMessage: (message: WebSocketMessage) => void;
    lastMessage: WebSocketMessage | null;
    isConnected: boolean;
};

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
    const ws = useRef<WebSocket | null>(null);
    const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL!;
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
            console.log('WebSocket connected');
            setIsConnected(true);
        };

        ws.current.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                setLastMessage(message);
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        };

        ws.current.onclose = () => {
            console.log('WebSocket disconnected');
            setIsConnected(false);
        };

        ws.current.onerror = (error) => {
            console.error('WebSocket error:', error);
            setIsConnected(false);
        };

        return () => {
            ws.current?.close();
        };
    }, []);

    const sendMessage = (message: WebSocketMessage) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(message));
        }
    };

    return (
        <WebSocketContext.Provider value={{ sendMessage, lastMessage, isConnected }}>
            {children}
        </WebSocketContext.Provider>
    );
}

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within WebSocketProvider');
    }
    return context;
};