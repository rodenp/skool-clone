'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getCurrentUser } from '@/lib/auth';
import EventCalendarView from '@/components/calendar/EventCalendarView';
import EventDetailsCard from '@/components/calendar/EventDetailsCard';
import EventForm from '@/components/calendar/EventForm';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // CardDescription not used here.
import { Plus } from 'lucide-react';

// Define Event type (as it was previously)
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string | null;
  startDate: string; // ISO string
  endDate: string;   // ISO string
  location?: string | null;
  userId: string; // creatorId / authorId
  communityId: string;
  creator?: {
    id: string;
    name?: string | null;
    username?: string | null;
    image?: string | null; // Added for consistency if needed by other components
  };
}

// Assume a default or selectable community ID for now
const DEFAULT_COMMUNITY_ID = "comm_1_test_id"; // Replace with actual logic for selecting/defaulting community

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventForm, setShowEventForm] = useState<boolean>(false);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [displayDate, setDisplayDate] = useState(new Date());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // 1. Fetch currentUserId
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUserId(user?.id || null);
      } catch (e) {
        console.error("Failed to fetch user for calendar page", e);
        setCurrentUserId(null); // Ensure state is updated even on error
      }
    };
    fetchUser();
  }, []);

  // 2. Implement fetchEvents
  const fetchEvents = useCallback(async (communityIdToFetch: string, dateForMonth: Date) => {
    if (!communityIdToFetch) {
        setError("No community selected to fetch events for.");
        setIsLoading(false);
        setEvents([]); // Clear events if no community
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const year = dateForMonth.getFullYear();
      const month = dateForMonth.getMonth() + 1;
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;

      const response = await fetch(`/api/communities/${communityIdToFetch}/events?month=${monthStr}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to fetch events.');
      }
      const data: CalendarEvent[] = await response.json();
      setEvents(data);
    } catch (err: any) {
      setError(err.message);
      setEvents([]); // Clear events on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 3. useEffect to call fetchEvents
  useEffect(() => {
    // Fetch events for the default community when component mounts or displayDate changes.
    // Only fetch if a community ID is available.
    if (DEFAULT_COMMUNITY_ID) {
      fetchEvents(DEFAULT_COMMUNITY_ID, displayDate);
    } else {
      // Handle case where no default community ID is set (e.g., show a message or selector)
      setIsLoading(false);
      setEvents([]);
      // setError("Please select a community to view events."); // Optional: guide user
    }
  }, [displayDate, fetchEvents]); // Removed currentUserId from here unless API depends on it for filtering by user

  // 4. Implement handler functions
  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventForm(false);
  };

  const handleCloseDetails = () => {
    setSelectedEvent(null);
  };

  const handleShowCreateEventForm = () => {
    setEventToEdit(null);
    setSelectedEvent(null);
    setShowEventForm(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEventToEdit(event);
    setSelectedEvent(null);
    setShowEventForm(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    setError(null); // Clear previous errors
    try {
      const response = await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to delete event.');
      }
      // Refetch events for the current displayDate
      if (DEFAULT_COMMUNITY_ID) {
        fetchEvents(DEFAULT_COMMUNITY_ID, displayDate);
      }
      setSelectedEvent(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleFormSubmitSuccess = () => {
    setShowEventForm(false);
    setEventToEdit(null);
    if (DEFAULT_COMMUNITY_ID) {
      fetchEvents(DEFAULT_COMMUNITY_ID, displayDate); // Refetch events for current view
    }
  };

  const handleFormCancel = () => {
    setShowEventForm(false);
    setEventToEdit(null);
  };

  const handleDateOrMonthChangeForFetch = useCallback((newDate: Date) => {
    setDisplayDate(newDate); // This will trigger the useEffect to call fetchEvents
  }, []);


  // 5. Render the UI
  return (
    <div className="container mx-auto p-4 space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Calendar</h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage community events.
            {DEFAULT_COMMUNITY_ID ? `(Displaying for default community)` : "(No community selected)"}
          </p>
        </div>
        {currentUserId && DEFAULT_COMMUNITY_ID && ( // Only show if user and community context exists
          <Button onClick={handleShowCreateEventForm} className="mt-4 sm:mt-0">
            <Plus className="h-4 w-4 mr-2" /> Create Event
          </Button>
        )}
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error} <Button variant="link" onClick={() => DEFAULT_COMMUNITY_ID && fetchEvents(DEFAULT_COMMUNITY_ID, displayDate)}>Try again</Button></AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Events for {displayDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && <p className="text-gray-500 dark:text-gray-400">Loading events...</p>}
              {!isLoading && !error && events.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No events scheduled for this period.</p>
              )}
              {!isLoading && !error && events.length > 0 && (
                 <EventCalendarView
                    events={events}
                    onSelectEvent={handleSelectEvent}
                    onDateOrMonthChange={handleDateOrMonthChangeForFetch}
                    initialDisplayDate={displayDate}
                 />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1 space-y-6">
          {showEventForm && currentUserId && DEFAULT_COMMUNITY_ID && (
            <Card>
                <CardHeader><CardTitle>{eventToEdit ? "Edit Event" : "Create New Event"}</CardTitle></CardHeader>
                <CardContent>
                    <EventForm
                        communityId={DEFAULT_COMMUNITY_ID} // Pass the relevant communityId
                        eventToEdit={eventToEdit}
                        onSubmitSuccess={handleFormSubmitSuccess}
                        onCancel={handleFormCancel}
                    />
                </CardContent>
            </Card>
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
