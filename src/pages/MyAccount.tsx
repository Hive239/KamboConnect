
import React, { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Settings } from "@/lib/icons";
import { Loader2 } from '@/lib/icons';
import ProfilePictureUpload from '../components/profile/ProfilePictureUpload';
import AccountSettings from '../components/profile/AccountSettings';
import SecuritySettings from '../components/account/SecuritySettings';
import DemoNotificationGenerator from '../components/profile/DemoNotificationGenerator';

export default function MyAccount() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (e) {
        console.error("Failed to fetch user", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground"/></div>;
  }

  if (!user) {
    return <div className="text-center py-12">Please log in to view your account.</div>;
  }

  return (
    <div className="bg-muted min-h-screen">
        <PageHeader icon={Settings} kicker="Account" title="My Account" subtitle="Manage your profile, settings, and notifications." />

        <div className="p-4 sm:p-6 space-y-6">
            <Card>
                <CardHeader>
                    <div>
                        <CardTitle className="text-2xl">{user.full_name}</CardTitle>
                        <CardDescription>{user.email}</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <ProfilePictureUpload user={user} onUpdate={handleProfileUpdate} />
                </CardContent>
            </Card>

            <AccountSettings user={user} />

            <SecuritySettings />

            <Card>
              <CardHeader>
                <CardTitle>Developer Tools</CardTitle>
                <CardDescription>Use these tools for demonstration purposes.</CardDescription>
              </CardHeader>
              <CardContent>
                <DemoNotificationGenerator />
              </CardContent>
            </Card>
        </div>
    </div>
  );
}
