'use client';

import Link from 'next/link';
import { useAuth, UserButton } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, BarChart3, Bell, Users, ArrowRight, LayoutDashboard, Eye, AlertTriangle, Activity } from 'lucide-react';
import { Service, Incident, ServiceStatus } from '@/types';
import { apiClient } from '@/lib/api';

interface DashboardStats {
  totalServices: number;
  activeIncidents: number;
  overallStatus: ServiceStatus;
  statusLabel: string;
  statusColor: string;
}

export default function HomePage() {
  const { isSignedIn, isLoaded } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalServices: 0,
    activeIncidents: 0,
    overallStatus: 'operational',
    statusLabel: 'Loading...',
    statusColor: 'text-gray-500'
  });
  const [loading, setLoading] = useState(true);

  const features = [
    {
      icon: CheckCircle,
      title: 'Real-time Status Updates',
      description: 'Keep your users informed with instant status updates and incident reports.',
    },
    {
      icon: BarChart3,
      title: 'Service Monitoring',
      description: 'Monitor multiple services and track their uptime and performance.',
    },
    {
      icon: Bell,
      title: 'Incident Management',
      description: 'Manage incidents efficiently with status updates and timeline tracking.',
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Work together with your team to resolve issues and maintain services.',
    },
  ];

  const loadDashboardStats = async () => {
    try {
      setLoading(true);

      const [servicesRes, incidentsRes] = await Promise.all([
        apiClient.getServices().catch(() => ({ services: [] })),
        apiClient.getIncidents().catch(() => ({ incidents: [] }))
      ]);

      const services = servicesRes.services || [];
      const incidents = incidentsRes.incidents || [];

      const activeIncidents = incidents.filter((incident: Incident) =>
        incident.status !== 'resolved'
      );

      const overallStatus = calculateOverallStatus(services);
      const { statusLabel, statusColor } = getStatusDisplay(overallStatus);

      setStats({
        totalServices: services.length,
        activeIncidents: activeIncidents.length,
        overallStatus,
        statusLabel,
        statusColor
      });
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
      setStats({
        totalServices: 0,
        activeIncidents: 0,
        overallStatus: 'operational',
        statusLabel: 'Unable to load',
        statusColor: 'text-gray-500'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      loadDashboardStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  const calculateOverallStatus = (services: Service[]): ServiceStatus => {
    if (services.length === 0) return 'operational';

    if (services.some(s => s.status === 'major_outage')) return 'major_outage';
    if (services.some(s => s.status === 'partial_outage')) return 'partial_outage';
    if (services.some(s => s.status === 'degraded_performance')) return 'degraded_performance';
    if (services.some(s => s.status === 'maintenance')) return 'maintenance';

    return 'operational';
  };

  const getStatusDisplay = (status: ServiceStatus) => {
    const statusConfig = {
      operational: {
        label: 'All Systems Operational',
        color: 'text-green-600',
        icon: CheckCircle,
        iconColor: 'text-green-500'
      },
      degraded_performance: {
        label: 'Degraded Performance',
        color: 'text-yellow-600',
        icon: AlertTriangle,
        iconColor: 'text-yellow-500'
      },
      partial_outage: {
        label: 'Partial Outage',
        color: 'text-orange-600',
        icon: AlertTriangle,
        iconColor: 'text-orange-500'
      },
      major_outage: {
        label: 'Major Outage',
        color: 'text-red-600',
        icon: AlertTriangle,
        iconColor: 'text-red-500'
      },
      maintenance: {
        label: 'Under Maintenance',
        color: 'text-blue-600',
        icon: Activity,
        iconColor: 'text-blue-500'
      },
    };

    return {
      statusLabel: statusConfig[status].label,
      statusColor: statusConfig[status].color,
      StatusIcon: statusConfig[status].icon,
      iconColor: statusConfig[status].iconColor
    };
  };

  // Show loading state while checking auth
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const { StatusIcon, iconColor } = getStatusDisplay(stats.overallStatus);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold hover:text-primary transition-colors">
              Status Page
            </Link>
            <div className="flex items-center gap-2">
              {isSignedIn ? (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/dashboard" className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link href="/status/demo" className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      View Demo
                    </Link>
                  </Button>
                  <UserButton />
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/sign-in">Sign In</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/sign-up">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto">
          {isSignedIn ? (
            <>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Welcome Back! 👋
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Ready to manage your services and keep your users informed?
                Access your dashboard or explore the demo to see all features in action.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button size="lg" asChild>
                  <Link href="/dashboard" className="flex items-center gap-2">
                    <LayoutDashboard className="h-5 w-5" />
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/status/demo" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    View Demo
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Keep Your Users Informed
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Build trust with your customers by providing real-time status updates
                and transparent incident communication.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button size="lg" asChild>
                  <Link href="/sign-up" className="flex items-center gap-2">
                    Start Free Trial
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/status/demo" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    View Demo
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Real-time Stats for Logged In Users */}
      {isSignedIn && (
        <div className="container mx-auto px-4 pb-16">
          <div className="max-w-4xl mx-auto">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="text-center animate-pulse">
                    <CardHeader>
                      <div className="h-8 w-8 bg-gray-200 rounded mx-auto mb-2"></div>
                      <div className="h-5 bg-gray-200 rounded mx-auto w-24"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-8 bg-gray-200 rounded mx-auto w-16 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mx-auto w-32"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="text-center hover:shadow-md transition-shadow">
                  <CardHeader>
                    <StatusIcon className={`h-8 w-8 mx-auto ${iconColor}`} />
                    <CardTitle className="text-lg">System Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-lg font-bold ${stats.statusColor}`}>
                      {stats.statusLabel}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {stats.totalServices === 0 ? (
                        <Link href="/dashboard/services" className="text-primary hover:underline">
                          Add your first service
                        </Link>
                      ) : (
                        `${stats.totalServices} services monitored`
                      )}
                    </p>
                  </CardContent>
                </Card>

                <Card className="text-center hover:shadow-md transition-shadow">
                  <CardHeader>
                    <BarChart3 className="h-8 w-8 text-blue-500 mx-auto" />
                    <CardTitle className="text-lg">Your Services</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{stats.totalServices}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {stats.totalServices === 0 ? (
                        <Link href="/dashboard/services" className="text-primary hover:underline">
                          Add your first service
                        </Link>
                      ) : (
                        <Link href="/dashboard/services" className="text-primary hover:underline">
                          Manage services
                        </Link>
                      )}
                    </p>
                  </CardContent>
                </Card>

                <Card className="text-center hover:shadow-md transition-shadow">
                  <CardHeader>
                    <Bell className={`h-8 w-8 mx-auto ${stats.activeIncidents > 0 ? 'text-red-500' : 'text-gray-400'
                      }`} />
                    <CardTitle className="text-lg">Active Incidents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-2xl font-bold ${stats.activeIncidents > 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                      {stats.activeIncidents}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {stats.activeIncidents === 0 ? (
                        'No ongoing issues'
                      ) : (
                        <Link href="/dashboard/incidents" className="text-primary hover:underline">
                          View active incidents
                        </Link>
                      )}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Quick Actions Button */}
            {!loading && stats.totalServices === 0 && (
              <div className="mt-8 text-center">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="py-6">
                    <h3 className="text-lg font-semibold mb-2">Get Started</h3>
                    <p className="text-muted-foreground mb-4">
                      Add your first service to begin monitoring and create your status page.
                    </p>
                    <Button asChild>
                      <Link href="/dashboard/services">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Add Your First Service
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Features */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            {isSignedIn ? 'Features at Your Fingertips' : 'Everything You Need'}
          </h2>
          <p className="text-muted-foreground">
            {isSignedIn
              ? 'Explore all the powerful tools available in your dashboard.'
              : 'Powerful features to manage your service status and communicate with users.'
            }
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <feature.icon className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section for Non-logged in users */}
      {!isSignedIn && (
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-2xl mx-auto">
            <Card className="bg-primary/5 border-primary/10">
              <CardContent className="py-8">
                <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
                <p className="text-muted-foreground mb-6">
                  Join thousands of companies using our status page to build trust
                  and maintain transparency with their users.
                </p>
                <div className="flex items-center justify-center gap-4">
                  <Button size="lg" asChild>
                    <Link href="/sign-up">Create Your Status Page</Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href="/status/demo">See Demo First</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Quick Actions for Logged In Users with services */}
      {isSignedIn && !loading && stats.totalServices > 0 && (
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-2xl mx-auto">
            <Card className="bg-primary/5 border-primary/10">
              <CardContent className="py-8">
                <h3 className="text-2xl font-bold mb-4">Quick Actions</h3>
                <p className="text-muted-foreground mb-6">
                  Manage your services and incidents efficiently.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button variant="outline" asChild className="h-auto p-4">
                    <Link href="/dashboard/services" className="flex flex-col items-center gap-2">
                      <BarChart3 className="h-6 w-6" />
                      <span>Manage Services</span>
                      <span className="text-xs text-muted-foreground">
                        {stats.totalServices} services
                      </span>
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="h-auto p-4">
                    <Link href="/dashboard/incidents" className="flex flex-col items-center gap-2">
                      <Bell className="h-6 w-6" />
                      <span>Report Incident</span>
                      <span className="text-xs text-muted-foreground">
                        {stats.activeIncidents} active
                      </span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2025 Status Page. Built with Next.js and ShadCN UI.</p>
            {isSignedIn && (
              <p className="mt-2 text-sm">
                Need help? Check out our{' '}
                <Link href="/dashboard/settings" className="text-primary hover:underline">
                  settings
                </Link>{' '}
                or{' '}
                <Link href="/status/demo" className="text-primary hover:underline">
                  view the demo
                </Link>
                .
              </p>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}