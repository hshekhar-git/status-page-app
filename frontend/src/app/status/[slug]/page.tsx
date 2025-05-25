'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { Clock, ExternalLink, AlertCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Service, Incident, Organization } from '@/types';

interface StatusPageData {
    organization: Organization;
    services: Service[];
    incidents: Incident[];
}

export default function PublicStatusPage() {
    const params = useParams();
    const slug = params.slug as string;

    const [data, setData] = useState<StatusPageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [wsConnected, setWsConnected] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    // Use refs to avoid stale closures
    const wsRef = useRef<WebSocket | null>(null);
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const retryCountRef = useRef(0);
    const isUnmountedRef = useRef(false);

    // Load initial data function wrapped in useCallback
    const loadData = useCallback(async () => {
        if (isUnmountedRef.current) return;

        try {
            setLoading(true);
            console.log('🔄 Loading status page data for:', slug);
            const response = await apiClient.getPublicStatus(slug);
            console.log('✅ Status page data loaded:', response);

            if (!isUnmountedRef.current) {
                setData(response);
                setError(null);
            }
        } catch (error) {
            console.error('❌ Error loading status page:', error);
            if (!isUnmountedRef.current) {
                setError('Failed to load status page');
            }
        } finally {
            if (!isUnmountedRef.current) {
                setLoading(false);
            }
        }
    }, [slug]);

    // WebSocket connection function
    const connectWebSocket = useCallback(() => {
        if (isUnmountedRef.current) return;

        try {
            const wsUrl = process.env.NEXT_PUBLIC_WS_URL!;
            console.log('🔌 Connecting to WebSocket:', wsUrl);

            // Close existing connection if any
            if (wsRef.current) {
                wsRef.current.close();
            }

            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                if (isUnmountedRef.current) return;
                console.log('✅ WebSocket connected to public status page');
                setWsConnected(true);
                retryCountRef.current = 0;
            };

            wsRef.current.onmessage = (event) => {
                if (isUnmountedRef.current) return;

                try {
                    const message = JSON.parse(event.data);
                    console.log('📨 WebSocket message received:', message);

                    // Handle ALL types of updates that should refresh the status page
                    const updateTriggerTypes = [
                        'status_update',      // Service status changed
                        'service_created',    // New service added
                        'service_deleted',    // Service deleted
                        'incident_created',   // New incident created
                        'incident_updated',   // Incident updated
                        'incident_update',    // Legacy incident update (keep for compatibility)
                    ];

                    if (updateTriggerTypes.includes(message.type)) {
                        console.log(`🔄 Refreshing status page data for: ${message.type}`);

                        // Add a small delay to ensure backend operations are completed
                        setTimeout(() => {
                            if (!isUnmountedRef.current) {
                                loadData();
                                setLastUpdated(new Date());
                            }
                        }, 100);
                    } else {
                        console.log(`ℹ️ Ignoring WebSocket message type: ${message.type}`);
                    }
                } catch (error) {
                    console.error('❌ Failed to parse WebSocket message:', error);
                }
            };

            wsRef.current.onclose = (event) => {
                if (isUnmountedRef.current) return;

                console.log('❌ WebSocket disconnected:', event.code, event.reason);
                setWsConnected(false);

                // Auto-retry connection with exponential backoff (max 5 retries)
                if (retryCountRef.current < 5) {
                    const retryDelay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
                    console.log(`🔄 Retrying WebSocket connection in ${retryDelay}ms... (attempt ${retryCountRef.current + 1}/5)`);

                    retryTimeoutRef.current = setTimeout(() => {
                        if (!isUnmountedRef.current) {
                            retryCountRef.current += 1;
                            connectWebSocket();
                        }
                    }, retryDelay);
                } else {
                    console.log('❌ Max WebSocket retry attempts reached');
                }
            };

            wsRef.current.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                if (!isUnmountedRef.current) {
                    setWsConnected(false);
                }
            };

        } catch (err) {
            console.error('❌ WebSocket connection error:', err);
            if (!isUnmountedRef.current) {
                setWsConnected(false);
            }
        }
    }, [loadData]);

    // Initialize WebSocket connection
    useEffect(() => {
        connectWebSocket();

        // Cleanup on unmount
        return () => {
            isUnmountedRef.current = true;

            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }

            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [connectWebSocket]);

    // Load initial data
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Manual refresh with WebSocket reconnection
    const handleRefresh = useCallback(() => {
        console.log('🔄 Manual refresh triggered');
        loadData();
        setLastUpdated(new Date());

        // If WebSocket is not connected, try to reconnect
        if (!wsConnected) {
            console.log('🔌 Attempting to reconnect WebSocket...');
            retryCountRef.current = 0; // Reset retry count
            connectWebSocket();
        }
    }, [loadData, wsConnected, connectWebSocket]);

    // Periodic health check (every 30 seconds)
    useEffect(() => {
        const healthCheckInterval = setInterval(() => {
            // If WebSocket is disconnected and we haven't reached max retries, try to reconnect
            if (!wsConnected && retryCountRef.current < 5) {
                console.log('🔄 Periodic WebSocket reconnection attempt...');
                connectWebSocket();
            }

            // Refresh data every 5 minutes as a fallback
            const now = new Date();
            const timeSinceUpdate = now.getTime() - lastUpdated.getTime();
            if (timeSinceUpdate > 5 * 60 * 1000) { // 5 minutes
                console.log('🔄 Periodic data refresh (fallback)...');
                loadData();
                setLastUpdated(now);
            }
        }, 30000); // Check every 30 seconds

        return () => clearInterval(healthCheckInterval);
    }, [wsConnected, lastUpdated, connectWebSocket, loadData]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading status page...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 py-8 max-w-4xl">
                    <div className="text-center py-16">
                        <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h1 className="text-2xl font-bold mb-2">Status Page Not Found</h1>
                        <p className="text-muted-foreground mb-6">
                            The status page &quot;{slug}&quot; doesn&#39;t exist or hasn&#39;t been configured yet.
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            <Button asChild>
                                <Link href="/">Go Home</Link>
                            </Button>
                            <Button variant="outline" onClick={handleRefresh}>
                                Try Again
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const { organization, services, incidents } = data;

    const getOverallStatus = () => {
        if (services.length === 0) return 'operational';
        if (services.some(s => s.status === 'major_outage')) return 'major_outage';
        if (services.some(s => s.status === 'partial_outage')) return 'partial_outage';
        if (services.some(s => s.status === 'degraded_performance')) return 'degraded_performance';
        return 'operational';
    };

    const activeIncidents = incidents.filter(i => i.status !== 'resolved');
    const overallStatus = getOverallStatus();

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Connection Status */}
                <div className="fixed top-4 right-4 z-50">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs shadow-lg transition-colors ${wsConnected
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-red-100 text-red-700 border border-red-200'
                        }`}>
                        {wsConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                        <span>{wsConnected ? 'Live Updates' : 'Offline'}</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-1 ml-1 hover:bg-white/20"
                            onClick={handleRefresh}
                            title="Refresh data and reconnect"
                        >
                            <RefreshCw className="h-3 w-3" />
                        </Button>
                    </div>
                </div>

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2">{organization.name}</h1>
                    {organization.description && (
                        <p className="text-muted-foreground mb-4">{organization.description}</p>
                    )}

                    <div className="inline-flex items-center gap-2 text-lg">
                        <StatusBadge status={overallStatus} showDot />
                        <span className="font-medium">
                            {overallStatus === 'operational' ? 'All Systems Operational' : 'Service Issues Detected'}
                        </span>
                    </div>
                </div>

                {/* Active Incidents */}
                {activeIncidents.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                            Active Incidents
                            <Badge variant="destructive">{activeIncidents.length}</Badge>
                        </h2>
                        <div className="space-y-4">
                            {activeIncidents.map(incident => (
                                <Card key={incident.id} className="border-l-4 border-l-red-500 animate-in slide-in-from-left duration-300">
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between">
                                            {incident.title}
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline">{incident.type}</Badge>
                                                <Badge className="bg-red-100 text-red-800">
                                                    {incident.status.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                        </CardTitle>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            Started: {format(new Date(incident.created_at), 'MMM dd, yyyy HH:mm')}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p>{incident.description}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Services Status */}
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Services</h2>
                    {services.length > 0 ? (
                        <div className="space-y-3">
                            {services.map(service => (
                                <Card key={service.id} className="hover:shadow-sm transition-all duration-200">
                                    <CardContent className="py-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-medium">{service?.name}</h3>
                                                    {service?.url && (
                                                        <a
                                                            href={service?.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-muted-foreground hover:text-foreground transition-colors"
                                                        >
                                                            <ExternalLink className="h-3 w-3" />
                                                        </a>
                                                    )}
                                                </div>
                                                {service?.description && (
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {service?.description}
                                                    </p>
                                                )}
                                            </div>
                                            <StatusBadge status={service?.status} />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="py-8 text-center">
                                <p className="text-muted-foreground">No services configured yet.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-12 text-center text-sm text-muted-foreground border-t pt-6">
                    <div className="flex items-center justify-center gap-4 mb-2">
                        <p>Last updated: {lastUpdated.toLocaleString()}</p>
                        <div className={`flex items-center gap-1 ${wsConnected ? 'text-green-600' : 'text-red-600'}`}>
                            {wsConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                            <span className="text-xs">{wsConnected ? 'Live' : 'Offline'}</span>
                        </div>
                    </div>
                    <p>Powered by {organization?.name} Status Page</p>
                </div>
            </div>
        </div>
    );
}