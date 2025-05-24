import { Badge } from '@/components/ui/badge';
import { ServiceStatus } from '@/types';

const statusConfig = {
    operational: {
        label: 'Operational',
        variant: 'default' as const,
        color: 'bg-green-500',
        textColor: 'text-green-700'
    },
    degraded_performance: {
        label: 'Degraded Performance',
        variant: 'secondary' as const,
        color: 'bg-yellow-500',
        textColor: 'text-yellow-700'
    },
    partial_outage: {
        label: 'Partial Outage',
        variant: 'destructive' as const,
        color: 'bg-orange-500',
        textColor: 'text-orange-700'
    },
    major_outage: {
        label: 'Major Outage',
        variant: 'destructive' as const,
        color: 'bg-red-500',
        textColor: 'text-red-700'
    },
    maintenance: {
        label: 'Maintenance',
        variant: 'outline' as const,
        color: 'bg-blue-500',
        textColor: 'text-blue-700'
    },
};

interface StatusBadgeProps {
    status: ServiceStatus;
    showDot?: boolean;
    className?: string;
}

export function StatusBadge({ status, showDot = false, className = '' }: StatusBadgeProps) {
    const config = statusConfig[status];

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {showDot && <div className={`w-2 h-2 rounded-full ${config.color}`} />}
            <Badge variant={config.variant} className={showDot ? '' : config.textColor}>
                {config.label}
            </Badge>
        </div>
    );
}