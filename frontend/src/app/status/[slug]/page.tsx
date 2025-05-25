'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStatusPageUpdates } from '@/components/providers/WebSocketProvider';
import { apiClient } from '@/lib/api';
import { Clock, ExternalLink, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Service, Incident, Organization } from '@/types';
import { WebSocketStatus } from '@/components/ui/web-socket-status';

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

    // Load data function
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            console.log('🔄 Loading status page data for:', slug);
            const response = await apiClient.getPublicStatus(slug);
            console.log('✅ Status page data loaded:', response);
            setData(response);
            setError(null);
        } catch (error) {
            console.error('❌ Error loading status page:', error);
            setError('Failed to load status page');
        } finally {
            setLoading(false);
        }
    }, [slug]);

    // Use the custom hook for WebSocket updates
    const { lastUpdated } = useStatusPageUpdates(loadData);

    // Load initial data
    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRefresh = () => {
        loadData();
    };

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
                    <WebSocketStatus size="sm" />
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
                    <p>Last updated: {lastUpdated.toLocaleString()}</p>
                    <p className="mt-1">
                        Powered by {organization?.name} Status Page
                    </p>
                </div>
            </div>
        </div>
    );
}