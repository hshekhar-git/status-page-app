'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Service, Incident, IncidentStatus } from '@/types';
import { apiClient } from '@/lib/api';
import { useWebSocket } from '@/components/providers/WebSocketProvider';
import { IncidentForm } from '@/components/dashboard/IncidentForm';
import { Search, Clock, CheckCircle, AlertTriangle, Eye } from 'lucide-react';
import { format } from 'date-fns';

const statusConfig = {
    investigating: { label: 'Investigating', color: 'bg-red-500 text-white' },
    identified: { label: 'Identified', color: 'bg-orange-500 text-white' },
    monitoring: { label: 'Monitoring', color: 'bg-yellow-500 text-white' },
    resolved: { label: 'Resolved', color: 'bg-green-500 text-white' },
};

export default function IncidentsPage() {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const { lastMessage } = useWebSocket();

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (lastMessage?.type === 'incident_update') {
            loadData();
        }
    }, [lastMessage]);

    useEffect(() => {
        let filtered = incidents;

        if (searchQuery) {
            filtered = filtered.filter(incident =>
                incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                incident.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(incident => incident.status === statusFilter);
        }

        setFilteredIncidents(filtered);
    }, [incidents, searchQuery, statusFilter]);

    const loadData = async () => {
        try {
            const [incidentsRes, servicesRes] = await Promise.all([
                apiClient.getIncidents(),
                apiClient.getServices(),
            ]);
            setIncidents(incidentsRes.incidents || []);
            setServices(servicesRes.services || []);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleIncidentSubmit = async () => {
        await loadData();
    };

    const getStatusBadge = (status: IncidentStatus) => {
        const config = statusConfig[status];
        return (
            <Badge className={config.color}>
                {config.label}
            </Badge>
        );
    };

    const activeIncidents = incidents.filter(i => i.status !== 'resolved');
    const resolvedIncidents = incidents.filter(i => i.status === 'resolved');

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
                    <h1 className="text-3xl font-bold">Incidents</h1>
                    <p className="text-muted-foreground">Track and manage service incidents</p>
                </div>
                <IncidentForm
                    services={services}
                    onSubmit={handleIncidentSubmit}
                    key="create-incident-form"
                />
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeIncidents.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{resolvedIncidents.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{incidents.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            {incidents.length > 0 && (
                <div className="flex gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Search incidents..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="investigating">Investigating</SelectItem>
                            <SelectItem value="identified">Identified</SelectItem>
                            <SelectItem value="monitoring">Monitoring</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Incidents List */}
            {filteredIncidents.length > 0 ? (
                <div className="space-y-4">
                    {filteredIncidents.map(incident => {
                        // Find the current incident data to ensure we're using the latest version
                        const currentIncident = incidents.find(i => i.id === incident.id) || incident;

                        return (
                            <Card key={incident.id} className={`${incident.status !== 'resolved' ? 'border-l-4 border-l-red-500' : ''
                                }`}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="flex items-center gap-2">
                                                {incident.title}
                                                {getStatusBadge(incident.status as IncidentStatus)}
                                            </CardTitle>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {format(new Date(incident.created_at), 'MMM dd, yyyy HH:mm')}
                                                </div>
                                                <Badge variant="outline">{incident.type}</Badge>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <IncidentForm
                                                key={`edit-${incident.id}-${incident.updated_at || incident.created_at}`}
                                                services={services}
                                                incident={currentIncident}
                                                onSubmit={handleIncidentSubmit}
                                                trigger={
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        Edit
                                                    </Button>
                                                }
                                            />
                                        </div>
                                    </div>
                                </CardHeader>
                                {incident.description && (
                                    <CardContent>
                                        <p className="text-sm">{incident.description}</p>
                                    </CardContent>
                                )}
                            </Card>
                        );
                    })}
                </div>
            ) : incidents.length > 0 ? (
                <div className="text-center py-8">
                    <p className="text-muted-foreground">No incidents match your search.</p>
                </div>
            ) : (
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center">
                            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">No incidents yet</h3>
                            <p className="text-muted-foreground mb-4">
                                When issues occur, report them here to keep your users informed.
                            </p>
                            <IncidentForm
                                services={services}
                                onSubmit={handleIncidentSubmit}
                                key="empty-state-form"
                            />
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}