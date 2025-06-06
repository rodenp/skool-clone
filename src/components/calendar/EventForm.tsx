'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CalendarEvent } from '@/app/app/calendar/page'; // Import the Event type
// You might want to use the ui/calendar for date picking here
// import { Calendar as UiCalendar } from "@/components/ui/calendar";
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// import { CalendarIcon } from "lucide-react";
// import { format } from "date-fns";

interface EventFormProps {
  communityId: string; // To associate event with a community
  // currentUserId: string; // Already available in the API via session
  eventToEdit?: CalendarEvent | null;
  onSubmitSuccess: (event: CalendarEvent) => void;
  onCancel: () => void;
}

const EventForm: React.FC<EventFormProps> = ({
  communityId,
  eventToEdit,
  onSubmitSuccess,
  onCancel,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(''); // Store as YYYY-MM-DD
  const [startTime, setStartTime] = useState(''); // Store as HH:MM
  const [endDate, setEndDate] = useState('');     // Store as YYYY-MM-DD
  const [endTime, setEndTime] = useState('');       // Store as HH:MM
  const [location, setLocation] = useState('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setDescription(eventToEdit.description || '');
      setLocation(eventToEdit.location || '');

      const start = new Date(eventToEdit.startDate);
      const end = new Date(eventToEdit.endDate);

      setStartDate(start.toISOString().split('T')[0]);
      setStartTime(start.toTimeString().substring(0, 5)); // HH:MM
      setEndDate(end.toISOString().split('T')[0]);
      setEndTime(end.toTimeString().substring(0, 5)); // HH:MM
    } else {
      // Reset form for new event
      setTitle('');
      setDescription('');
      const now = new Date();
      const defaultStartTime = new Date(now.getTime() + (60 * 60 * 1000)); // 1 hour from now
      const defaultEndTime = new Date(now.getTime() + (2 * 60 * 60 * 1000)); // 2 hours from now
      setStartDate(defaultStartTime.toISOString().split('T')[0]);
      setStartTime(defaultStartTime.toTimeString().substring(0,5));
      setEndDate(defaultEndTime.toISOString().split('T')[0]);
      setEndTime(defaultEndTime.toTimeString().substring(0,5));
      setLocation('');
    }
  }, [eventToEdit]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!startDate || !startTime || !endDate || !endTime) {
        setError('All date and time fields are required.');
        return;
    }

    const combinedStartDateTime = new Date(`${startDate}T${startTime}`);
    const combinedEndDateTime = new Date(`${endDate}T${endTime}`);

    if (isNaN(combinedStartDateTime.getTime()) || isNaN(combinedEndDateTime.getTime())) {
        setError('Invalid date or time values.');
        return;
    }

    if (combinedStartDateTime >= combinedEndDateTime) {
      setError('End date and time must be after start date and time.');
      return;
    }

    setIsLoading(true);

    const eventData = {
      title,
      description,
      startDate: combinedStartDateTime.toISOString(),
      endDate: combinedEndDateTime.toISOString(),
      location,
      // userId is handled by the backend (from session)
      // communityId is passed for new events
    };

    try {
      let response;
      if (eventToEdit) {
        response = await fetch(`/api/events/${eventToEdit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData),
        });
      } else {
        response = await fetch(`/api/communities/${communityId}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...eventData, communityId }),
        });
      }

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || `Failed to ${eventToEdit ? 'update' : 'create'} event.`);
      }
      onSubmitSuccess(responseData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div>
        <Label htmlFor="title">Event Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={isLoading} />
      </div>
      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} disabled={isLoading} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">Start Date</Label>
          <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required disabled={isLoading} />
        </div>
        <div>
          <Label htmlFor="startTime">Start Time</Label>
          <Input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required disabled={isLoading} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="endDate">End Date</Label>
          <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required disabled={isLoading} />
        </div>
        <div>
          <Label htmlFor="endTime">End Time</Label>
          <Input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required disabled={isLoading} />
        </div>
      </div>
      <div>
        <Label htmlFor="location">Location (Optional)</Label>
        <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Conference Room A or Online URL" disabled={isLoading} />
      </div>
      <div className="flex justify-end space-x-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (eventToEdit ? 'Saving...' : 'Creating...') : (eventToEdit ? 'Save Changes' : 'Create Event')}
        </Button>
      </div>
    </form>
  );
};

export default EventForm;
