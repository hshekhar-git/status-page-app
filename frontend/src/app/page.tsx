import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, BarChart3, Bell, Users } from 'lucide-react';

export default function HomePage() {
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Status Page</h1>
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Keep Your Users Informed
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Build trust with your customers by providing real-time status updates
            and transparent incident communication.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/sign-up">Start Free Trial</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/status/demo">View Demo</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Everything you need</h2>
          <p className="text-muted-foreground">
            Powerful features to manage your service status and communicate with users.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index}>
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

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2025 Status Page. Built with Next.js and ShadCN UI.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}