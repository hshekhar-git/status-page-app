'use client';

import { useAuth, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    LayoutDashboard,
    Server,
    AlertTriangle,
    Settings,
    ExternalLink
} from 'lucide-react';
import { WebSocketStatus } from '@/components/ui/web-socket-status';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Services', href: '/dashboard/services', icon: Server },
        { name: 'Incidents', href: '/dashboard/incidents', icon: AlertTriangle },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Sidebar */}
            <div className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r">
                <div className="flex h-16 items-center justify-between px-6">
                    <h1 className="text-xl font-bold">Status Page</h1>
                    <WebSocketStatus size="sm" showRetryButton={false} />
                </div>

                <nav className="mt-6 px-3">
                    <div className="space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive
                                            ? 'bg-accent text-accent-foreground'
                                            : 'hover:bg-accent hover:text-accent-foreground'
                                        }`}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                <div className="absolute bottom-4 left-4 right-4">
                    <Button variant="outline" className="w-full justify-start" asChild>
                        <Link href="/status/demo" target="_blank" >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Public Page
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="pl-64">
                {/* Header */}
                <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex h-16 items-center justify-between px-6">
                        <div></div>
                        <UserButton />
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isLoaded, isSignedIn } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.push('/sign-in');
        }
    }, [isLoaded, isSignedIn, router]);

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (!isSignedIn) {
        return null;
    }

    return <DashboardLayoutContent>{children}</DashboardLayoutContent>;
}