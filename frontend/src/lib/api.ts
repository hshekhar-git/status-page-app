import { Service, Incident, Organization, ApiResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

class ApiClient {
    private getAuthHeaders(): HeadersInit {
        return {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test', // For testing - will use Clerk token later
            'X-Organization-ID': '68323d8ecfc5cd8248620005', // Default test org
        };
    }

    async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;
        const config: RequestInit = {
            headers: this.getAuthHeaders(),
            ...options,
        };

        const response = await fetch(url, config);

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`API Error: ${response.status} - ${error}`);
        }

        return response.json();
    }

    // Organizations
    async getOrganizations(): Promise<ApiResponse<Organization[]>> {
        return this.request('/organizations');
    }

    async createOrganization(org: Partial<Organization>): Promise<ApiResponse<Organization>> {
        return this.request('/organizations', {
            method: 'POST',
            body: JSON.stringify(org),
        });
    }

    // Services
    async getServices(): Promise<ApiResponse<Service[]>> {
        return this.request('/services');
    }

    async createService(service: Partial<Service>): Promise<ApiResponse<Service>> {
        return this.request('/services', {
            method: 'POST',
            body: JSON.stringify(service),
        });
    }

    async updateServiceStatus(serviceId: string, status: string, message?: string): Promise<ApiResponse<Service>> {
        return this.request(`/services/${serviceId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status, message }),
        });
    }

    async deleteService(serviceId: string): Promise<ApiResponse<unknown>> {
        return this.request(`/services/${serviceId}`, {
            method: 'DELETE',
        });
    }

    // Incidents
    async getIncidents(): Promise<ApiResponse<Incident[]>> {
        return this.request('/incidents');
    }

    async createIncident(incident: Partial<Incident>): Promise<ApiResponse<Incident>> {
        return this.request('/incidents', {
            method: 'POST',
            body: JSON.stringify(incident),
        });
    }

    async updateIncident(incidentId: string, incident: Partial<Incident>): Promise<ApiResponse<Incident>> {
        return this.request(`/incidents/${incidentId}`, {
            method: 'PUT',
            body: JSON.stringify(incident),
        });
    }

    // Public API
    async getPublicStatus(slug: string): Promise<{
        organization: Organization;
        services: Service[];
        incidents: Incident[];
    }> {
        const response = await fetch(`${API_BASE_URL}/public/status/${slug}`);

        console.log("🚀 ~ ApiClient ~ getPublicStatus ~ response:", response);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('ORGANIZATION_NOT_FOUND');
            }
            throw new Error(`API Error: ${response.status}`);
        }

        return response.json();
  }
}

export const apiClient = new ApiClient();