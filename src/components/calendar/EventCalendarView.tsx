'use client';

import React, { useState, useEffect } from 'react';
import { Calendar as UiCalendar } from "@/components/ui/calendar"; // The date picker
import { CalendarEvent } from '@/app/app/calendar/page'; // Import the Event type
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EventCalendarViewProps {
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  // Callback to inform parent about month/date changes to refetch events
  onDateOrMonthChange: (newDate: Date) => void;
  initialDisplayDate?: Date;
}

const EventCalendarView: React.FC<EventCalendarViewProps> = ({
  events,
  onSelectEvent,
  onDateOrMonthChange,
  initialDisplayDate = new Date(),
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDisplayDate);
  const [currentMonth, setCurrentMonth] = useState<Date>(initialDisplayDate);

  useEffect(() => {
    // When the component initially loads with a specific month's events,
    // ensure the calendar UI also shows that month.
    setSelectedDate(initialDisplayDate);
    setCurrentMonth(initialDisplayDate);
  }, [initialDisplayDate]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      // If you want to filter events strictly to the selected day:
      // onDateOrMonthChange(date); // This would trigger a refetch for just that day.
      // For now, we assume parent fetches for the whole month, and we filter client-side by day.
    }
  };

  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month);
    // Inform parent component that the month has changed, so it can fetch new events
    onDateOrMonthChange(month);
    setSelectedDate(undefined); // Clear selected day when month changes
  };

  // Filter events to show only those for the selectedDate, if a date is selected.
  // Otherwise, show all events for the currently loaded month.
  const eventsToDisplay = selectedDate
    ? events.filter(event => {
        const eventStartDate = new Date(event.startDate);
        return (
          eventStartDate.getFullYear() === selectedDate.getFullYear() &&
          eventStartDate.getMonth() === selectedDate.getMonth() &&
          eventStartDate.getDate() === selectedDate.getDate()
        );
      })
    : events; // If no date selected, show all events for the current month view

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <UiCalendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          month={currentMonth}
          onMonthChange={handleMonthChange}
          className="rounded-md border dark:border-gray-700"
          // Modifiers to show dots on days with events (basic example)
          modifiers={{
            eventDays: events.map(event => new Date(event.startDate))
          }}
          modifiersClassNames={{
            eventDays: 'bg-blue-100 dark:bg-blue-900 rounded-full' // Example styling for days with events
          }}
          // To customize day cell rendering to show dots for events:
          // components={{
          //   DayContent: (props) => {
          //     const dayEvents = events.filter(event =>
          //       new Date(event.startDate).toDateString() === props.date.toDateString()
          //     );
          //     return (
          //       <div className="relative">
          //         {props.date.getDate()}
          //         {dayEvents.length > 0 && <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-1 w-1 bg-blue-500 rounded-full"></span>}
          //       </div>
          //     );
          //   }
          // }}
        />
      </div>
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate
                ? `Events for ${selectedDate.toLocaleDateString()}`
                : `Events in ${currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eventsToDisplay.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">
                {selectedDate ? "No events for this day." : "No events this month, or select a day."}
              </p>
            ) : (
              <ul className="space-y-3 max-h-[300px] lg:max-h-[400px] overflow-y-auto">
                {eventsToDisplay.map((event) => (
                  <li
                    key={event.id}
                    onClick={() => onSelectEvent(event)}
                    className="p-3 border rounded-md hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  >
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">{event.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                      {new Date(event.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {event.location && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        <Badge variant="secondary" className="mr-1">Location:</Badge> {event.location}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EventCalendarView;
