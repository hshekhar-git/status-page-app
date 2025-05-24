'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from './StatusBadge';
import { Service, ServiceStatus } from '@/types';
import { apiClient } from '@/lib/api';
import { ExternalLink, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ServiceCardProps {
    service: Service;
    onUpdate?: () => void;
}

export function ServiceCard({ service, onUpdate }: ServiceCardProps) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<ServiceStatus>(service.status);

    const handleStatusUpdate = async () => {
        if (selectedStatus === service.status) return;

        setIsUpdating(true);
        try {
            await apiClient.updateServiceStatus(service.id, selectedStatus);
            toast.success('Service status updated successfully');
            onUpdate?.();
        } catch (error) {
            console.error('Failed to update service status:', error);
            toast.error('Failed to update service status');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this service?')) return;

        try {
            await apiClient.deleteService(service.id);
            toast.success('Service deleted successfully');
            onUpdate?.();
        } catch (error) {
            console.error('Failed to delete service:', error);
            toast.error('Failed to delete service');
        }
    };

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            {service.name}
                            {service.url && (
                                <a
                                    href={service.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            )}
                        </CardTitle>
                        {service.description && (
                            <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <StatusBadge status={service.status} showDot />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDelete}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2">
                    <Select value={selectedStatus} onValueChange={(value: ServiceStatus) => setSelectedStatus(value)}>
                        <SelectTrigger className="w-48">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="operational">Operational</SelectItem>
                            <SelectItem value="degraded_performance">Degraded Performance</SelectItem>
                            <SelectItem value="partial_outage">Partial Outage</SelectItem>
                            <SelectItem value="major_outage">Major Outage</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        onClick={handleStatusUpdate}
                        disabled={isUpdating || selectedStatus === service.status}
                        size="sm"
                    >
                        {isUpdating ? 'Updating...' : 'Update'}
                    </Button>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                    Last updated: {new Date(service.updated_at).toLocaleString()}
                </div>
            </CardContent>
        </Card>
    );
}