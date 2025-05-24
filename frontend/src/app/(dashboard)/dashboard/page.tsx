'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Service, Incident } from '@/types';
import { apiClient } from '@/lib/api';
import { useWebSocket } from '@/components/providers/WebSocketProvider';
import {
    Activity,
    AlertTriangle,
    Server,
    TrendingUp
} from 'lucide-react';
import { StatusBadge } from '@/components/dashboard/StatusBadge';

export default function DashboardPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    const { lastMessage } = useWebSocket();

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (lastMessage?.type === 'status_update' || lastMessage?.type === 'incident_update') {
            loadData();
        }
    }, [lastMessage]);

    const loadData = async () => {
        try {
            const [servicesRes, incidentsRes] = await Promise.all([
                apiClient.getServices(),
                apiClient.getIncidents(),
            ]);
            setServices(servicesRes.services || []);
            setIncidents(incidentsRes.incidents || []);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getOverallStatus = () => {
        if (services.length === 0) return 'operational';
        if (services.some(s => s.status === 'major_outage')) return 'major_outage';
        if (services.some(s => s.status === 'partial_outage')) return 'partial_outage';
        if (services.some(s => s.status === 'degraded_performance')) return 'degraded_performance';
        return 'operational';
    };

    const activeIncidents = incidents.filter(i => i.status !== 'resolved');
    const operationalServices = services.filter(s => s.status === 'operational').length;
    const overallStatus = getOverallStatus();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground">Monitor your services and incidents</p>
                </div>
                <div className="flex gap-2">
                    <Button asChild>
                        <a href="/dashboard/services">Manage Services</a>
                    </Button>
                    <Button variant="outline" asChild>
                        <a href="/dashboard/incidents">View Incidents</a>
                    </Button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overall Status</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <StatusBadge status={overallStatus} />
                        <p className="text-xs text-muted-foreground mt-2">
                            {overallStatus === 'operational' ? 'All systems operational' : 'Issues detected'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Services</CardTitle>
                        <Server className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{services.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {operationalServices} operational
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeIncidents.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {incidents.length - activeIncidents.length} resolved
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">99.9%</div>
                        <p className="text-xs text-muted-foreground">Last 30 days</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Services */}
            {services.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">Services Overview</h2>
                        <Button variant="outline" size="sm" asChild>
                            <a href="/dashboard/services">View All</a>
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {services.slice(0, 6).map(service => (
                            <Card key={service.id}>
                                <CardContent className="py-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium">{service.name}</h3>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {service.description || 'No description'}
                                            </p>
                                        </div>
                                        <StatusBadge status={service.status} showDot />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Active Incidents */}
            {activeIncidents.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold mb-4">Active Incidents</h2>
                    <div className="space-y-4">
                        {activeIncidents.map(incident => (
                            <Card key={incident.id} className="border-l-4 border-l-red-500">
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        {incident.title}
                                        <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded">
                                            {incident.status.replace('_', ' ')}
                                        </span>
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        Started: {new Date(incident.created_at).toLocaleString()}
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm">{incident.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {services.length === 0 && (
                <Card>
                    <CardContent className="py-8">
                        <div className="text-center">
                            <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">No services yet</h3>
                            <p className="text-muted-foreground mb-4">
                                Get started by adding your first service to monitor.
                            </p>
                            <Button asChild>
                                <a href="/dashboard/services">Add Your First Service</a>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}