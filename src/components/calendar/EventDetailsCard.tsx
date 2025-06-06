'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarEvent } from '@/app/app/calendar/page'; // Import the Event type
import { Clock, MapPin, Edit3, Trash2, X } from 'lucide-react'; // Icons

interface EventDetailsCardProps {
  event: CalendarEvent;
  currentUserId?: string | null; // To check if user is creator for edit/delete
  onEdit: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
  onClose: () => void;
}

const EventDetailsCard: React.FC<EventDetailsCardProps> = ({
  event,
  currentUserId,
  onEdit,
  onDelete,
  onClose,
}) => {
  if (!event) return null;

  const isCreator = event.userId === currentUserId; // Check if the current user is the event creator

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString([], {
      dateStyle: 'medium', // e.g., "Sep 1, 2023"
      timeStyle: 'short',  // e.g., "10:00 AM"
    });
  };

  return (
    <Card className="shadow-lg relative">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">{event.title}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <X className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {event.description && (
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{event.description}</p>
        )}

        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>{formatDateTime(event.startDate)} - {formatDateTime(event.endDate)}</span>
        </div>

        {event.location && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{event.location}</span>
          </div>
        )}

        {event.creator?.name && (
             <CardDescription className="text-xs">Created by: {event.creator.name}</CardDescription>
        )}

      </CardContent>
      {isCreator && (
        <CardFooter className="flex justify-end space-x-2 border-t dark:border-gray-700 pt-4">
          <Button variant="outline" onClick={() => onEdit(event)}>
            <Edit3 className="h-4 w-4 mr-2" /> Edit
          </Button>
          <Button variant="destructive" onClick={() => onDelete(event.id)}>
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default EventDetailsCard;
