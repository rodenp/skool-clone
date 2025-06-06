'use client';

import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { NotificationType as PrismaNotificationType } from '@prisma/client';
import { getFriendlyNotificationTypeName } from '@/lib/notifications/utils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch'; // Assuming Switch component
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Assuming Select
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface UserNotificationSettingData {
  userId: string;
  communityId?: string | null; // null for global settings
  notificationType: PrismaNotificationType;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  pushEnabled: boolean;
  digestFrequency?: string | null;
  // These might not be present for default/unsaved settings
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface NotificationSettingsFormProps {
  currentUserId: string;
}

const NotificationSettingsForm: React.FC<NotificationSettingsFormProps> = ({ currentUserId }) => {
  const [settings, setSettings] = useState<UserNotificationSettingData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    if (!currentUserId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/users/${currentUserId}/notification-settings`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch notification settings.');
      }
      const data: UserNotificationSettingData[] = await response.json();
      setSettings(data);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
      setSettings([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSettingChange = (
    type: PrismaNotificationType,
    field: 'emailEnabled' | 'inAppEnabled' | 'pushEnabled' | 'digestFrequency',
    value: boolean | string,
    communityId: string | null = null // For per-community settings in future
  ) => {
    setSettings(prevSettings => {
      const settingIndex = prevSettings.findIndex(
        s => s.notificationType === type && s.communityId === communityId
      );
      if (settingIndex > -1) {
        const updatedSettings = [...prevSettings];
        updatedSettings[settingIndex] = {
          ...updatedSettings[settingIndex],
          [field]: value,
        };
        return updatedSettings;
      } else {
        // This case should ideally not happen if API returns all types with defaults
        // But as a fallback, create a new setting object in local state
        const newSetting: UserNotificationSettingData = {
          userId: currentUserId,
          communityId,
          notificationType: type,
          emailEnabled: field === 'emailEnabled' ? (value as boolean) : true,
          inAppEnabled: field === 'inAppEnabled' ? (value as boolean) : true,
          pushEnabled: field === 'pushEnabled' ? (value as boolean) : false,
          digestFrequency: field === 'digestFrequency' ? (value as string) : null,
        };
        return [...prevSettings, newSetting];
      }
    });
    setSuccessMessage(null); // Clear success message on change
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    // Filter out settings that are just defaults and haven't been "saved" (don't have an ID or changed from default)
    // Or, send all settings as the API uses upsert.
    // For simplicity, we send all settings that are in the state.
    // The API expects an array of settings objects.
    const settingsToSave = settings.map(s => ({
        notificationType: s.notificationType,
        communityId: s.communityId, // Will be null for global settings
        emailEnabled: s.emailEnabled,
        inAppEnabled: s.inAppEnabled,
        pushEnabled: s.pushEnabled,
        digestFrequency: s.digestFrequency,
    }));

    try {
      const response = await fetch(`/api/users/${currentUserId}/notification-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsToSave),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings.');
      }
      setSuccessMessage('Notification settings saved successfully!');
      fetchSettings(); // Re-fetch to ensure UI reflects DB state (e.g., new IDs, timestamps)
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  // For now, only global settings are shown. Grouping by communityId would be a UI enhancement.
  const globalSettings = settings.filter(s => s.communityId === null);

  if (isLoading) {
    return <div className="p-4 text-center">Loading notification settings...</div>;
  }
  if (error && globalSettings.length === 0) { // Show error only if settings could not be loaded at all
    return (
      <Alert variant="destructive">
        <AlertTitle>Error Loading Settings</AlertTitle>
        <AlertDescription>{error} <Button variant="link" size="sm" onClick={fetchSettings}>Try again</Button></AlertDescription>
      </Alert>
    );
  }


  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && !isSaving && ( // Show general errors not related to saving if not currently saving
         <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
         </Alert>
      )}
      {successMessage && (
        <Alert variant="default" className="bg-green-50 dark:bg-green-900/30 border-green-600 dark:border-green-500">
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Global Notification Preferences</CardTitle>
          <CardDescription>These settings apply by default unless overridden by community-specific settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {globalSettings.length === 0 && !isLoading && <p>No global settings to display. This might be an error.</p>}
          {globalSettings.map((setting) => (
            <div key={setting.notificationType} className="p-4 border rounded-lg dark:border-gray-700 space-y-3">
              <h4 className="font-medium text-gray-800 dark:text-gray-200">{getFriendlyNotificationTypeName(setting.notificationType)}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 items-center">
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`inApp-${setting.notificationType}`}
                    checked={setting.inAppEnabled}
                    onCheckedChange={(value) => handleSettingChange(setting.notificationType, 'inAppEnabled', value)}
                    disabled={isSaving}
                  />
                  <Label htmlFor={`inApp-${setting.notificationType}`} className="text-sm">In-App</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`email-${setting.notificationType}`}
                    checked={setting.emailEnabled}
                    onCheckedChange={(value) => handleSettingChange(setting.notificationType, 'emailEnabled', value)}
                    disabled={isSaving}
                  />
                  <Label htmlFor={`email-${setting.notificationType}`} className="text-sm">Email</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`push-${setting.notificationType}`}
                    checked={setting.pushEnabled}
                    onCheckedChange={(value) => handleSettingChange(setting.notificationType, 'pushEnabled', value)}
                    disabled={isSaving}
                  />
                  <Label htmlFor={`push-${setting.notificationType}`} className="text-sm">Push (Mobile)</Label>
                </div>
                {/* Example for digestFrequency, might only apply to certain types */}
                {/* {['ACTIVITY_SUMMARY', 'POST_DIGEST'].includes(setting.notificationType) && (
                  <div className="md:col-span-3">
                    <Label htmlFor={`digest-${setting.notificationType}`} className="text-sm">Digest Frequency</Label>
                    <Select
                      value={setting.digestFrequency || 'never'}
                      onValueChange={(value) => handleSettingChange(setting.notificationType, 'digestFrequency', value)}
                      disabled={isSaving}
                    >
                      <SelectTrigger id={`digest-${setting.notificationType}`} className="w-full md:w-1/2 mt-1">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never">Never</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )} */}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Placeholder for per-community settings - requires more complex UI to select community etc. */}
      {/* <Card>
          <CardHeader><CardTitle>Per-Community Settings</CardTitle></CardHeader>
          <CardContent><p>Community-specific overrides will be managed here.</p></CardContent>
      </Card> */}

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isSaving || isLoading}>
          {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Preferences'}
        </Button>
      </div>
    </form>
  );
};

export default NotificationSettingsForm;
