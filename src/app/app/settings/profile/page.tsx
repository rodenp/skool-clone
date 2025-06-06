'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation'; // For potential redirect after unauth
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function EditProfilePage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [image, setImage] = useState('');

  const [initialUsername, setInitialUsername] = useState(''); // To compare if username changed for session update
  const [initialImage, setInitialImage] = useState('');       // To compare if image changed for session update
  const [initialName, setInitialName] = useState('');         // To compare if name changed for session update


  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '');
      setUsername(session.user.username || '');
      setBio(session.user.bio || ''); // Assuming bio is part of extended user session type
      setImage(session.user.image || '');

      setInitialName(session.user.name || '');
      setInitialUsername(session.user.username || '');
      setInitialImage(session.user.image || '');
    }
  }, [session]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    const payload: { name?: string; username?: string; bio?: string; image?: string } = {};
    if (name !== session?.user?.name) payload.name = name;
    if (username !== session?.user?.username) payload.username = username;
    if (bio !== (session?.user as any)?.bio) payload.bio = bio; // Cast if bio not in default type
    if (image !== session?.user?.image) payload.image = image;

    if (Object.keys(payload).length === 0) {
      setSuccessMessage("No changes to save.");
      setIsLoading(false);
      return;
    }
    // Ensure required fields are not emptied if they are mandatory by backend (e.g. username)
    if (payload.username !== undefined && payload.username.trim() === '') {
        setError("Username cannot be empty.");
        setIsLoading(false);
        return;
    }
     if (payload.name !== undefined && payload.name.trim() === '') {
        setError("Name cannot be empty."); // Assuming name is required
        setIsLoading(false);
        return;
    }


    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update profile.');
      }

      setSuccessMessage('Profile updated successfully!');

      // Update form fields with potentially sanitized/modified data from API response
      if (responseData.user) {
        setName(responseData.user.name || '');
        setUsername(responseData.user.username || '');
        setBio(responseData.user.bio || '');
        setImage(responseData.user.image || '');
      }

      // Check if key fields that affect session display have changed
      const sessionDataChanged =
        payload.name !== undefined ||
        payload.username !== undefined ||
        payload.image !== undefined;

      if (sessionDataChanged) {
        // Trigger a session update to reflect changes in header/avatar etc.
        // The update function from useSession can be used to refresh the session.
        // It will refetch the session and update it.
        await updateSession();
      }

    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (nameStr?: string | null, fallback = 'U') => {
    if (!nameStr) return fallback;
    return nameStr
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };


  if (status === 'loading') {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-500" />
        <p className="mt-2 text-gray-500">Loading session...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    // Redirect or show message if preferred. NextAuth might handle redirect via middleware too.
    // router.push('/app/login'); // Could cause hydration errors if called directly in render
    useEffect(() => { router.push('/app/login?callbackUrl=/app/settings/profile'); }, [router]);
    return (
         <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <Alert variant="destructive">
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
                Please <Link href="/app/login?callbackUrl=/app/settings/profile" className="font-semibold underline hover:text-blue-700">log in</Link> to edit your profile.
            </AlertDescription>
            </Alert>
        </div>
    );
  }

  // User is authenticated
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-2xl">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Edit Profile</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Update your personal information and preferences.
        </p>
      </header>

      <Card className="shadow-lg">
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {successMessage && (
              <Alert variant="default" className="bg-green-50 dark:bg-green-900/30 border-green-600 dark:border-green-500">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertTitle>Success!</AlertTitle>
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}

            <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20 text-2xl border">
                    <AvatarImage src={image || session?.user?.image || undefined} alt={name || username || 'User Avatar'} />
                    <AvatarFallback>{getInitials(name || username || session?.user?.name)}</AvatarFallback>
                </Avatar>
                <div className="w-full space-y-1">
                    <Label htmlFor="image">Avatar Image URL</Label>
                    <Input
                        id="image"
                        type="url"
                        placeholder="https://example.com/your-image.png"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        disabled={isLoading}
                        className="dark:bg-gray-700 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">Enter the URL of your avatar image.</p>
                </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                required
                className="dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                required
                className="dark:bg-gray-700 dark:text-white"
              />
               <p className="text-xs text-gray-500 dark:text-gray-400">Your unique username on the platform.</p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us a little about yourself..."
                rows={4}
                disabled={isLoading}
                className="dark:bg-gray-700 dark:text-white"
              />
            </div>
             <div className="space-y-1">
                <Label htmlFor="email">Email (cannot be changed here)</Label>
                <Input
                    id="email"
                    type="email"
                    value={session?.user?.email || ''}
                    disabled // Email usually not changed here, or via a separate verification process
                    readOnly
                    className="bg-gray-100 dark:bg-gray-800 dark:text-gray-400"
                />
                 <p className="text-xs text-gray-500 dark:text-gray-400">Your email address cannot be changed from this form.</p>
            </div>


          </CardContent>
          <CardFooter className="border-t dark:border-gray-700 p-6 flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
