'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Settings, Users, Globe, Bell } from 'lucide-react';

export default function SettingsPage() {
    const [orgSettings, setOrgSettings] = useState({
        name: 'Demo Company',
        slug: 'demo',
        description: 'Demo status page for testing',
    });

    const handleSaveOrg = async () => {
        // TODO: Implement organization settings save
        console.log('Saving organization settings:', orgSettings);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground">Manage your organization and status page settings</p>
            </div>

            {/* Organization Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Organization Settings
                    </CardTitle>
                    <CardDescription>
                        Update your organization information and status page details.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="org-name">Organization Name</Label>
                        <Input
                            id="org-name"
                            value={orgSettings.name}
                            onChange={(e) => setOrgSettings({ ...orgSettings, name: e.target.value })}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="org-slug">Status Page URL</Label>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                {typeof window !== 'undefined' ? window.location.origin : ''}/status/
                            </span>
                            <Input
                                id="org-slug"
                                value={orgSettings.slug}
                                onChange={(e) => setOrgSettings({ ...orgSettings, slug: e.target.value })}
                                className="flex-1"
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="org-description">Description</Label>
                        <Textarea
                            id="org-description"
                            value={orgSettings.description}
                            onChange={(e) => setOrgSettings({ ...orgSettings, description: e.target.value })}
                            rows={3}
                        />
                    </div>

                    <Button onClick={handleSaveOrg}>
                        Save Changes
                    </Button>
                </CardContent>
            </Card>

            {/* Team Management */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Team Members
                    </CardTitle>
                    <CardDescription>
                        Manage who has access to your status page dashboard.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                                <p className="font-medium">test@example.com</p>
                                <p className="text-sm text-muted-foreground">Admin</p>
                            </div>
                            <Badge>Owner</Badge>
                        </div>

                        <Button variant="outline" className="w-full">
                            Invite Team Member
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Public Status Page */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Public Status Page
                    </CardTitle>
                    <CardDescription>
                        Your public status page is live and accessible to your users.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Public URL</p>
                            <p className="text-sm text-muted-foreground">
                                {typeof window !== 'undefined' ? window.location.origin : ''}/status/{orgSettings.slug}
                            </p>
                        </div>
                        <Button variant="outline" asChild>
                            <a href={`/status/${orgSettings.slug}`} target="_blank">
                                View Page
                            </a>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notifications
                    </CardTitle>
                    <CardDescription>
                        Configure how you want to be notified about incidents and status changes.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Email Notifications</p>
                                <p className="text-sm text-muted-foreground">Get notified via email for incidents</p>
                            </div>
                            <Badge variant="outline">Coming Soon</Badge>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Slack Integration</p>
                                <p className="text-sm text-muted-foreground">Send notifications to Slack channels</p>
                            </div>
                            <Badge variant="outline">Coming Soon</Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}