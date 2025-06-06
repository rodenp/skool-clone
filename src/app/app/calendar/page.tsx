'use client'; // Making it a client component to manage state

import React, { useState, useEffect, useCallback } from 'react';
import { getCurrentUser } from '@/lib/auth'; // Assuming a way to get current user
import EventCalendarView from '@/components/calendar/EventCalendarView';
import EventDetailsCard from '@/components/calendar/EventDetailsCard';
import EventForm from '@/components/calendar/EventForm';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Define Event type (can be moved to a shared types file)
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string | null;
  startDate: string; // ISO string
  endDate: string;   // ISO string
  location?: string | null;
  userId: string; // creatorId
  communityId: string;
  creator?: { // Optional: if API includes creator details
    id: string;
    name?: string | null;
    username?: string | null;
  };
}

// Assume a default or selectable community ID for now
const DEFAULT_COMMUNITY_ID = "comm_1_test_id"; // Replace with actual logic later

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventForm, setShowEventForm] = useState<boolean>(false);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch current user (client-side)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // In a real app, this might come from a global context or a hook
        const user = await getCurrentUser();
        setCurrentUserId(user?.id || null);
      } catch (e) {
        console.error("Failed to fetch user", e);
        setCurrentUserId(null);
      }
    };
    fetchUser();
  }, []);

  const fetchEvents = useCallback(async (communityId: string) => {
    setLoading(true);
    setError(null);
    try {
      // Example: Fetch events for the current month
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1; // Month is 1-indexed for API if it expects YYYY-MM
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;

      const response = await fetch(`/api/communities/${communityId}/events?month=${monthStr}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to fetch events.');
      }
      const data: CalendarEvent[] = await response.json();
      setEvents(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch events for the default community when component mounts or userId is set
    // In a real app, communityId might come from user's selection or context
    // For this main page, we fetch events for the initial display month.
    // EventCalendarView's onDateOrMonthChange will trigger this for subsequent months.
    if (DEFAULT_COMMUNITY_ID) {
      fetchEvents(DEFAULT_COMMUNITY_ID, initialDisplayDate);
    } else {
      setLoading(false);
      setEvents([]);
    }
  }, [fetchEvents, initialDisplayDate]);

  const handleCreateNewEvent = () => {
    setSelectedEvent(null);
    setEventToEdit(null);
    setShowEventForm(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setSelectedEvent(null);
    setEventToEdit(event);
    setShowEventForm(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      const response = await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to delete event.');
      }
      fetchEvents(DEFAULT_COMMUNITY_ID); // Refresh events
      setSelectedEvent(null); // Close details card
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleFormSubmitSuccess = () => {
    setShowEventForm(false);
    setEventToEdit(null);
    fetchEvents(DEFAULT_COMMUNITY_ID); // Refresh events
  };

  const handleFormCancel = () => {
    setShowEventForm(false);
    setEventToEdit(null);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventForm(false);
  };

  const handleCloseDetails = () => {
    setSelectedEvent(null);
  };

  const handleDateOrMonthChangeForFetch = useCallback((newDate: Date) => {
    // This function is called by EventCalendarView when month changes in its UI
    // It will trigger a refetch of events for the new month.
    if (DEFAULT_COMMUNITY_ID) {
      fetchEvents(DEFAULT_COMMUNITY_ID, newDate);
    }
  }, [fetchEvents]);

  // Used to set the initial month for EventCalendarView and for fetching.
  const [initialDisplayDate, setInitialDisplayDate] = useState(new Date());


  return (
    <div className="container mx-auto p-4 space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Calendar</h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage community events. (Displaying for default community)
          </p>
        </div>
        {currentUserId && (
          <Button onClick={handleCreateNewEvent} className="mt-4 sm:mt-0">
            Create New Event
          </Button>
        )}
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error} <Button variant="link" onClick={() => fetchEvents(DEFAULT_COMMUNITY_ID)}>Try again</Button></AlertDescription>
        </Alert>
      )}

      {/* Main content area: Calendar View on one side, Details/Form on other or modal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Events for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && <p>Loading events...</p>}
              {!loading && !error && events.length === 0 && <p>No events scheduled for this month.</p>}
              {!loading && !error && (
                 <EventCalendarView
                    events={events}
                    onSelectEvent={handleSelectEvent}
                    onDateOrMonthChange={handleDateOrMonthChangeForFetch}
                    initialDisplayDate={initialDisplayDate}
                 />
              )}
               {/* Fallback messages if EventCalendarView itself doesn't show them */}
              {!loading && !error && events.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No events scheduled for this period.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1 space-y-6">
          {showEventForm && currentUserId && (
            <EventForm
              communityId={DEFAULT_COMMUNITY_ID}
              eventToEdit={eventToEdit}
              onSubmitSuccess={handleFormSubmitSuccess}
              onCancel={handleFormCancel}
            />
          )}

          {selectedEvent && !showEventForm && (
            <EventDetailsCard
              event={selectedEvent}
              currentUserId={currentUserId}
              onEdit={handleEditEvent}
              onDelete={handleDeleteEvent}
              onClose={handleCloseDetails}
            />
          )}
        </div>
      </div>
    </div>
  );
}
