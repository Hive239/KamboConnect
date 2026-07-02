import React, { useState } from 'react';
import { User } from '@/entities/User';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Shield, Bell, Trash2, Loader2, Check } from "@/lib/icons";

export default function AccountSettings({ user }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user.full_name || '',
    preferences: {
      notifications: user.preferences?.notifications ?? true,
      email_updates: user.preferences?.email_updates ?? false,
      ...user.preferences
    }
  });

  const handleToggleChange = async (key, value) => {
    const newPreferences = {
      ...formData.preferences,
      [key]: value
    };
    
    setFormData(prev => ({
      ...prev,
      preferences: newPreferences
    }));

    // Save immediately when toggling
    try {
      setIsUpdating(true);
      await User.updateMyUserData({
        preferences: newPreferences
      });
    } catch (error) {
      console.error('Failed to update preferences:', error);
      // Revert the change if save failed
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [key]: !value
        }
      }));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      await User.updateMyUserData({
        full_name: formData.full_name
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({...prev, full_name: e.target.value}))}
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={user.email} disabled />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-muted-foreground" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <Label htmlFor="booking-updates" className="font-normal cursor-pointer">
                Booking updates and confirmations
              </Label>
              <p className="text-sm text-muted-foreground mt-1">Get notified about booking requests and changes</p>
            </div>
            <div className="flex items-center gap-2">
              {isUpdating && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              <Switch 
                id="booking-updates" 
                checked={formData.preferences.notifications}
                onCheckedChange={(value) => handleToggleChange('notifications', value)}
                disabled={isUpdating}
              />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <Label htmlFor="community-digest" className="font-normal cursor-pointer">
                Community news and updates
              </Label>
              <p className="text-sm text-muted-foreground mt-1">Receive newsletters and community announcements</p>
            </div>
            <div className="flex items-center gap-2">
              {isUpdating && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              <Switch 
                id="community-digest" 
                checked={formData.preferences.email_updates}
                onCheckedChange={(value) => handleToggleChange('email_updates', value)}
                disabled={isUpdating}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-muted-foreground" />
            Account Security
          </CardTitle>
        </CardHeader>
        <CardContent>
            <Button variant="outline">Change Password</Button>
        </CardContent>
      </Card>

      <Card className="border-red-300 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <Trash2 className="w-5 h-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-red-700 text-sm">Permanently delete your account and all associated data.</p>
          <Button variant="destructive">Delete Account</Button>
        </CardContent>
      </Card>
    </div>
  );
}