export type ServiceStatus =
    | 'operational'
    | 'degraded_performance'
    | 'partial_outage'
    | 'major_outage'
    | 'maintenance';

export type IncidentStatus =
    | 'investigating'
    | 'identified'
    | 'monitoring'
    | 'resolved';

export interface Service {
    id: string;
    organization_id: string;
    name: string;
    description: string;
    status: ServiceStatus;
    url?: string;
    created_at: string;
    updated_at: string;
}

export interface Incident {
    id: string;
    organization_id: string;
    title: string;
    description: string;
    status: IncidentStatus;
    type: string;
    affected_services: string[];
    created_at: string;
    updated_at: string;
    created_by: string;
}

export interface Organization {
    id: string;
    name: string;
    slug: string;
    description: string;
    created_at: string;
    updated_at: string;
    members: Member[];
}

export interface Member {
    user_id: string;
    role: string;
    email: string;
}

export interface ApiResponse<T> {
    [key: string]: T;
}