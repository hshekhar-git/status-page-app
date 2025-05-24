'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import {
//     Card,
//     CardContent,
//     CardHeader,
//     CardTitle,
// } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Service, Incident, IncidentStatus } from '@/types';
import { apiClient } from '@/lib/api';
import { Plus, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface IncidentFormProps {
    services: Service[];
    incident?: Incident;
    onSubmit: () => void;
    trigger?: React.ReactNode;
}

export function IncidentForm({  incident, onSubmit, trigger }: IncidentFormProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: incident?.title || '',
        description: incident?.description || '',
        status: incident?.status || 'investigating' as IncidentStatus,
        type: incident?.type || 'incident',
        affected_services: incident?.affected_services || [],
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) return;

        setIsSubmitting(true);
        try {
            if (incident) {
                await apiClient.updateIncident(incident.id, formData);
                toast.success('Incident updated successfully');
            } else {
                await apiClient.createIncident(formData);
                toast.success('Incident created successfully');
            }
            setFormData({
                title: '',
                description: '',
                status: 'investigating',
                type: 'incident',
                affected_services: [],
            });
            setOpen(false);
            onSubmit();
        } catch (error) {
            console.error('Failed to save incident:', error);
            toast.error('Failed to save incident');
        } finally {
            setIsSubmitting(false);
        }
    };

    const defaultTrigger = (
        <Button>
            <Plus className="h-4 w-4 mr-2" />
            Report Incident
        </Button>
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || defaultTrigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            {incident ? 'Update Incident' : 'Report New Incident'}
                        </DialogTitle>
                        <DialogDescription>
                            {incident ? 'Update the incident details below.' : 'Report a new incident or maintenance.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Title *</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Brief description of the issue"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Detailed description of the incident"
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value: IncidentStatus) =>
                                        setFormData({ ...formData, status: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="investigating">Investigating</SelectItem>
                                        <SelectItem value="identified">Identified</SelectItem>
                                        <SelectItem value="monitoring">Monitoring</SelectItem>
                                        <SelectItem value="resolved">Resolved</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="type">Type</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, type: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="incident">Incident</SelectItem>
                                        <SelectItem value="maintenance">Maintenance</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting || !formData.title.trim()}>
                            {isSubmitting ? 'Saving...' : incident ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}