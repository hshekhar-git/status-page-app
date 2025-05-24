'use client';

import { useEffect, useState } from 'react';
import { Service } from '@/types';
import { apiClient } from '@/lib/api';
import { useWebSocket } from '@/components/providers/WebSocketProvider';
import { ServiceCard } from '@/components/dashboard/ServiceCard';
import { CreateServiceDialog } from '@/components/dashboard/CreateServiceDialog';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function ServicesPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [filteredServices, setFilteredServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { lastMessage } = useWebSocket();

    useEffect(() => {
        loadServices();
    }, []);

    useEffect(() => {
        if (lastMessage?.type === 'status_update') {
            loadServices();
        }
    }, [lastMessage]);

    useEffect(() => {
        const filtered = services.filter(service =>
            service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            service.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredServices(filtered);
    }, [services, searchQuery]);

    const loadServices = async () => {
        try {
            const response = await apiClient.getServices();
            setServices(response.services || []);
        } catch (error) {
            console.error('Failed to load services:', error);
        } finally {
            setLoading(false);
        }
    };

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
                    <h1 className="text-3xl font-bold">Services</h1>
                    <p className="text-muted-foreground">Manage and monitor your services</p>
                </div>
                <CreateServiceDialog onServiceCreated={loadServices} />
            </div>

            {services.length > 0 && (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Search services..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 max-w-sm"
                    />
                </div>
            )}

            {filteredServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredServices.map(service => (
                        <ServiceCard
                            key={service.id}
                            service={service}
                            onUpdate={loadServices}
                        />
                    ))}
                </div>
            ) : services.length > 0 ? (
                <div className="text-center py-8">
                    <p className="text-muted-foreground">No services match your search.</p>
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="max-w-md mx-auto">
                        <h3 className="text-lg font-medium mb-2">No services yet</h3>
                        <p className="text-muted-foreground mb-4">
                            Get started by adding your first service to monitor its status.
                        </p>
                        <CreateServiceDialog onServiceCreated={loadServices} />
                    </div>
                </div>
            )}
        </div>
    );
}