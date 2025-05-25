'use client';

import { useWebSocket } from '@/components/providers/WebSocketProvider';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';

interface WebSocketStatusProps {
    className?: string;
    showRetryButton?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export function WebSocketStatus({
    className = '',
    showRetryButton = true,
    size = 'sm'
}: WebSocketStatusProps) {
    const { isConnected, connectionState, retryCount, forceReconnect } = useWebSocket();

    const getStatusConfig = () => {
        switch (connectionState) {
            case 'connected':
                return {
                    icon: Wifi,
                    text: 'Live ',
                    className: 'bg-green-100 text-green-700 border-green-200'
                };
            case 'connecting':
                return {
                    icon: RefreshCw,
                    text: 'Connecting...',
                    className: 'bg-yellow-100 text-yellow-700 border-yellow-200'
                };
            case 'error':
                return {
                    icon: AlertCircle,
                    text: `Failed (${retryCount} retries)`,
                    className: 'bg-red-100 text-red-700 border-red-200'
                };
            default:
                return {
                    icon: WifiOff,
                    text: 'Offline',
                    className: 'bg-red-100 text-red-700 border-red-200'
                };
        }
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    const sizeClasses = {
        sm: 'text-xs px-2 py-1',
        md: 'text-sm px-3 py-2',
        lg: 'text-base px-4 py-3'
    };

    return (
        <div className={`flex items-center gap-2 rounded-full border shadow-sm transition-colors ${config.className} ${sizeClasses[size]} ${className}`}>
            <Icon className={`${size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'} ${connectionState === 'connecting' ? 'animate-spin' : ''}`} />
            <span>{config.text}</span>
            {showRetryButton && !isConnected && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-1 ml-1 hover:bg-white/20"
                    onClick={forceReconnect}
                    title="Reconnect WebSocket"
                >
                    <RefreshCw className="h-3 w-3" />
                </Button>
            )}
        </div>
    );
}