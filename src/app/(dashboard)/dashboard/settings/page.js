'use client';

import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  User, 
  Moon, 
  Sun, 
  Bell, 
  Users, 
  Download,
  Palette,
  Laptop
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from 'next-themes';
import { Skeleton } from '@/components/ui/skeleton';

// Fetch user data from your database
async function fetchUserData() {
  const response = await fetch('/api/user/profile');
  if (!response.ok) {
    throw new Error('Failed to fetch user data');
  }
  return response.json();
}

// Fetch notification preferences
async function fetchNotificationPreferences() {
  const response = await fetch('/api/user/notifications');
  if (!response.ok) {
    throw new Error('Failed to fetch notification preferences');
  }
  return response.json();
}

// Update notification preferences
async function updateNotificationPreferences(data) {
  const response = await fetch('/api/user/notifications', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to update notification preferences');
  }
  return response.json();
}

// Export data
async function exportData() {
  const response = await fetch('/api/user/export');
  if (!response.ok) {
    throw new Error('Failed to export data');
  }
  return response.blob();
}

export default function SettingsPage() {
  const { user } = useUser();
  const { userId } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const queryClient = useQueryClient();

  // After mounting, we have access to the theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch user data
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: fetchUserData,
  });

  // Fetch notification preferences
  const { data: notificationData, isLoading: notificationsLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotificationPreferences,
  });

  // Notifications update mutation
  const notificationsMutation = useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['notifications']);
      toast.success('Notification preferences updated');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update preferences');
    },
  });

  const handleNotificationChange = (key, value) => {
    const newPreferences = {
      emailNotifications: notificationData?.emailNotifications ?? true,
      taskAssignments: notificationData?.taskAssignments ?? true,
      dueDateReminders: notificationData?.dueDateReminders ?? true,
      projectUpdates: notificationData?.projectUpdates ?? false,
      [key]: value,
    };
    
    notificationsMutation.mutate(newPreferences);
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/user/export');
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to export data');
      }
      
      // Get the filename from Content-Disposition header or create one
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `project-export-${new Date().toISOString().split('T')[0]}.csv`;
      
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+)"?/);
        if (match) filename = match[1];
      }
      
      // Get the blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error.message || 'Failed to export data');
    }
  };

  if (userLoading || notificationsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="w-48 h-8" />
        <Card>
          <CardHeader>
            <Skeleton className="w-32 h-6" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="w-full h-10" />
            <Skeleton className="w-full h-10" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 mx-auto space-y-6 max-w-7xl sm:px-6 lg:px-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white lg:text-3xl">
          Settings
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 lg:text-base">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Data
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab - Updated with Google Profile Picture */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Your account information synced from Google
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                {/* Profile Picture from Google */}
                <div className="flex-shrink-0">
                  {user?.imageUrl ? (
                    <img 
                      src={user.imageUrl} 
                      alt={user.fullName || 'Profile'} 
                      className="object-cover w-24 h-24 border-4 rounded-full border-primary-100 dark:border-primary-900 sm:w-28 sm:h-28"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-24 h-24 rounded-full bg-primary-100 dark:bg-primary-900 sm:w-28 sm:h-28">
                      <span className="text-3xl font-semibold text-primary-600 dark:text-primary-300 sm:text-4xl">
                        {user?.firstName?.charAt(0) || user?.emailAddresses[0]?.emailAddress?.charAt(0) || 'U'}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* User Info - Read Only */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm text-gray-500 dark:text-gray-400">Full Name</Label>
                    <p className="text-lg font-medium text-gray-900 dark:text-white sm:text-xl">
                      {user?.fullName || userData?.name || 'User'}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-gray-500 dark:text-gray-400">Email Address</Label>
                    <p className="text-base text-gray-700 dark:text-gray-300">
                      {user?.primaryEmailAddress?.emailAddress || userData?.email}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-gray-500 dark:text-gray-400">Account Provider</Label>
                    <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Signed in with Google
                    </p>
                  </div>
                </div>
              </div>

              {/* Account Creation Date */}
              <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Member since: {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how the dashboard looks for you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Theme</Label>
                  <p className="text-sm text-muted-foreground">Select your preferred theme</p>
                </div>
                <Select 
                  value={mounted ? theme : 'system'} 
                  onValueChange={setTheme}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="w-4 h-4" />
                        <span>Light</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="w-4 h-4" />
                        <span>Dark</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Laptop className="w-4 h-4" />
                        <span>System</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="space-y-0.5">
                  <Label>Compact View</Label>
                  <p className="text-sm text-muted-foreground">Reduce spacing between elements</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose what updates you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch
                  checked={notificationData?.emailNotifications ?? true}
                  onCheckedChange={(checked) => handleNotificationChange('emailNotifications', checked)}
                  disabled={notificationsMutation.isLoading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Task Assignments</Label>
                  <p className="text-sm text-muted-foreground">Get notified when you're assigned to a task</p>
                </div>
                <Switch
                  checked={notificationData?.taskAssignments ?? true}
                  onCheckedChange={(checked) => handleNotificationChange('taskAssignments', checked)}
                  disabled={notificationsMutation.isLoading || !notificationData?.emailNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Due Date Reminders</Label>
                  <p className="text-sm text-muted-foreground">Get reminders before tasks are due</p>
                </div>
                <Switch
                  checked={notificationData?.dueDateReminders ?? true}
                  onCheckedChange={(checked) => handleNotificationChange('dueDateReminders', checked)}
                  disabled={notificationsMutation.isLoading || !notificationData?.emailNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Project Updates</Label>
                  <p className="text-sm text-muted-foreground">Get updates when projects change</p>
                </div>
                <Switch
                  checked={notificationData?.projectUpdates ?? false}
                  onCheckedChange={(checked) => handleNotificationChange('projectUpdates', checked)}
                  disabled={notificationsMutation.isLoading || !notificationData?.emailNotifications}
                />
              </div>

              {notificationsMutation.isLoading && (
                <p className="text-sm text-primary">Updating preferences...</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage your team members and their roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900">
                      {user?.imageUrl ? (
                        <img 
                          src={user.imageUrl} 
                          alt={user.fullName || 'User'} 
                          className="object-cover w-8 h-8 rounded-full"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-primary-600 dark:text-primary-300">
                          {user?.firstName?.charAt(0) || 'U'}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{user?.fullName || 'You'}</p>
                      <p className="text-sm text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 text-xs rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
                    Owner
                  </span>
                </div>

                <div className="py-6 text-center">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-medium text-foreground">No other team members</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Get started by inviting team members to collaborate
                  </p>
                  <Button className="mt-4" variant="outline" disabled>
                    Invite Team Member (Coming Soon)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Export Your Data</CardTitle>
              <CardDescription>
                Download all your projects and tasks for backup or analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg border-border">
                <div className="space-y-1">
                  <h4 className="font-medium text-foreground">Export Projects & Tasks</h4>
                  <p className="text-sm text-muted-foreground">
                    Download all your data as a CSV file
                  </p>
                </div>
                <Button onClick={handleExport} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg border-border">
                <div className="space-y-1">
                  <h4 className="font-medium text-foreground">Account Information</h4>
                  <p className="text-sm text-muted-foreground">
                    View your account details and activity
                  </p>
                </div>
                <Button variant="outline" disabled>
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}