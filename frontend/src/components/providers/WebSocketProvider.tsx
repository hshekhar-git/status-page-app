'use client';

import React, { createContext, useContext, useEffect, useRef, ReactNode, useState, useCallback } from 'react';

type WebSocketMessage = {
    type: string;
    data: unknown;
};

type WebSocketContextType = {
    sendMessage: (message: WebSocketMessage) => void;
    lastMessage: WebSocketMessage | null;
    isConnected: boolean;
    connectionState: 'connecting' | 'connected' | 'disconnected' | 'error';
    retryCount: number;
    forceReconnect: () => void;
};

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
    children: ReactNode;
    onMessage?: (message: WebSocketMessage) => void;
    autoReconnect?: boolean;
    maxRetries?: number;
    debug?: boolean;
}

export function WebSocketProvider({
    children,
    onMessage,
    autoReconnect = true,
    maxRetries = 5,
    debug = true
}: WebSocketProviderProps) {
    const wsRef = useRef<WebSocket | null>(null);
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const isUnmountedRef = useRef(false);
    const retryCountRef = useRef(0);

    const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
    const [retryCount, setRetryCount] = useState(0);

    const log = useCallback((message: string, ...args: unknown[]) => {
        if (debug) {
            console.log(`[WebSocket] ${message}`, ...args);
        }
    }, [debug]);

    const connectWebSocket = useCallback(() => {
        if (isUnmountedRef.current) return;

        try {
            const wsUrl = process.env.NEXT_PUBLIC_WS_URL!;
            log('🔌 Connecting to WebSocket:', wsUrl);
            setConnectionState('connecting');

            // Close existing connection if any
            if (wsRef.current) {
                wsRef.current.close();
            }

            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                if (isUnmountedRef.current) return;
                log('✅ WebSocket connected successfully');
                setIsConnected(true);
                setConnectionState('connected');
                retryCountRef.current = 0;
                setRetryCount(0);
            };

            wsRef.current.onmessage = (event) => {
                if (isUnmountedRef.current) return;

                try {
                    const message = JSON.parse(event.data);
                    log('📨 WebSocket message received:', message);

                    setLastMessage(message);

                    // Call custom onMessage handler if provided
                    if (onMessage) {
                        onMessage(message);
                    }
                } catch (error) {
                    console.error('[WebSocket] Failed to parse message:', error);
                }
            };

            wsRef.current.onclose = (event) => {
                if (isUnmountedRef.current) return;

                log('❌ WebSocket disconnected:', event.code, event.reason);
                setIsConnected(false);
                setConnectionState('disconnected');

                // Auto-retry connection with exponential backoff
                if (autoReconnect && retryCountRef.current < maxRetries) {
                    const retryDelay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
                    log(`🔄 Retrying WebSocket connection in ${retryDelay}ms... (attempt ${retryCountRef.current + 1}/${maxRetries})`);

                    retryTimeoutRef.current = setTimeout(() => {
                        if (!isUnmountedRef.current) {
                            retryCountRef.current += 1;
                            setRetryCount(retryCountRef.current);
                            connectWebSocket();
                        }
                    }, retryDelay);
                } else if (retryCountRef.current >= maxRetries) {
                    log('❌ Max WebSocket retry attempts reached');
                    setConnectionState('error');
                }
            };

            wsRef.current.onerror = (error) => {
                log('❌ WebSocket error:', error);
                if (!isUnmountedRef.current) {
                    setIsConnected(false);
                    setConnectionState('error');
                }
            };

        } catch (err) {
            log('❌ WebSocket connection error:', err);
            if (!isUnmountedRef.current) {
                setIsConnected(false);
                setConnectionState('error');
            }
        }
    }, [autoReconnect, maxRetries, onMessage, log]);

    const forceReconnect = useCallback(() => {
        log('🔄 Force reconnecting WebSocket...');
        retryCountRef.current = 0;
        setRetryCount(0);
        connectWebSocket();
    }, [connectWebSocket, log]);

    const sendMessage = useCallback((message: WebSocketMessage) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
            log('📤 Sent WebSocket message:', message);
        } else {
            log('⚠️ Cannot send message - WebSocket not connected');
        }
    }, [log]);

    // Initial connection
    useEffect(() => {
        connectWebSocket();

        return () => {
            isUnmountedRef.current = true;

            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }

            if (healthCheckIntervalRef.current) {
                clearInterval(healthCheckIntervalRef.current);
            }

            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [connectWebSocket]);

    // Health check and periodic reconnection
    useEffect(() => {
        if (!autoReconnect) return;

        healthCheckIntervalRef.current = setInterval(() => {
            // If WebSocket is disconnected and we haven't reached max retries, try to reconnect
            if (!isConnected && retryCountRef.current < maxRetries && connectionState !== 'connecting') {
                log('🔄 Health check: attempting reconnection...');
                connectWebSocket();
            }
        }, 30000); // Check every 30 seconds

        return () => {
            if (healthCheckIntervalRef.current) {
                clearInterval(healthCheckIntervalRef.current);
            }
        };
    }, [isConnected, maxRetries, connectionState, autoReconnect, connectWebSocket, log]);

    const contextValue: WebSocketContextType = {
        sendMessage,
        lastMessage,
        isConnected,
        connectionState,
        retryCount,
        forceReconnect,
    };

    return (
        <WebSocketContext.Provider value={contextValue}>
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

// Custom hook for handling status page updates
export const useStatusPageUpdates = (loadData: () => Promise<void>) => {
    const { lastMessage } = useWebSocket();
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    useEffect(() => {
        if (!lastMessage) return;

        // Handle all types of updates that should refresh the status page
        const updateTriggerTypes = [
            'status_update',      // Service status changed
            'service_created',    // New service added
            'service_deleted',    // Service deleted
            'incident_created',   // New incident created
            'incident_updated',   // Incident updated
            'incident_update',    // Legacy incident update
        ];

        if (updateTriggerTypes.includes(lastMessage.type)) {
            console.log(`🔄 Refreshing status page data for: ${lastMessage.type}`);

            // Add a small delay to ensure backend operations are completed
            setTimeout(() => {
                loadData();
                setLastUpdated(new Date());
            }, 100);
        }
    }, [lastMessage, loadData]);

    return { lastUpdated };
};