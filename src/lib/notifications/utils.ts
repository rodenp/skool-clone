import { Notification, NotificationType as PrismaNotificationType, User, Community } from '@prisma/client';

// Define a more specific Notification type for client-side use if needed,
// especially if 'data' field is structured.
export interface ClientNotification extends Notification {
  actor?: Partial<User> | null; // Assuming actor details might be populated
  community?: Partial<Community> | null; // Assuming community details might be populated
  // 'data' field is Json?, so its structure depends on the notification type
}

interface NotificationDisplayInfo {
  href: string;
  text: string; // This could be a more structured message object if using i18n
  icon?: React.ElementType; // Optional: for an icon related to the notification type
}

export function getNotificationLinkAndText(notification: ClientNotification): NotificationDisplayInfo {
  let href = '/app/notifications'; // Default link
  let text = notification.message || notification.title || 'New notification'; // Default text

  // Use a more specific display text based on type, potentially using notification.data
  // This is a simplified example; you'd likely have more detailed messages.

  switch (notification.type) {
    case PrismaNotificationType.POST_COMMENT:
      text = `${notification.actor?.name || 'Someone'} commented on your post.`;
      if (notification.relatedEntityType === 'post' && notification.relatedEntityId) {
        // Assume community slug is part of post data or fetched separately for link
        href = `/app/communities/${notification.community?.slug || notification.communityId}/posts/${notification.relatedEntityId}`;
        if (notification.data && typeof notification.data === 'object' && 'commentId' in notification.data) {
             // @ts-ignore
             href += `#comment-${notification.data.commentId}`;
        }
      } else if (notification.data && typeof notification.data === 'object' && 'postId' in notification.data) {
        // @ts-ignore
        href = `/app/posts/${notification.data.postId}`; // Fallback if no community context
      }
      break;
    case PrismaNotificationType.POST_LIKE:
      text = `${notification.actor?.name || 'Someone'} liked your post.`;
       if (notification.relatedEntityType === 'post' && notification.relatedEntityId) {
        href = `/app/communities/${notification.community?.slug || notification.communityId}/posts/${notification.relatedEntityId}`;
      }
      break;
    case PrismaNotificationType.COMMENT_REPLY:
      text = `${notification.actor?.name || 'Someone'} replied to your comment.`;
      // Link to the comment, usually needs postId and then highlight commentId
      if (notification.data && typeof notification.data === 'object' && 'postId' in notification.data && 'commentId' in notification.data) {
        // @ts-ignore
        href = `/app/communities/${notification.community?.slug || notification.communityId}/posts/${notification.data.postId}#comment-${notification.data.commentId}`;
      }
      break;
    case PrismaNotificationType.MENTION_IN_POST:
    case PrismaNotificationType.MENTION_IN_COMMENT:
      text = `${notification.actor?.name || 'Someone'} mentioned you.`;
      if (notification.relatedEntityType === 'post' && notification.relatedEntityId) {
        href = `/app/communities/${notification.community?.slug || notification.communityId}/posts/${notification.relatedEntityId}`;
      } else if (notification.relatedEntityType === 'comment' && notification.relatedEntityId && notification.data && typeof notification.data === 'object' && 'postId' in notification.data) {
         // @ts-ignore
        href = `/app/communities/${notification.community?.slug || notification.communityId}/posts/${notification.data.postId}#comment-${notification.relatedEntityId}`;
      }
      break;
    case PrismaNotificationType.EVENT_CREATED:
      text = `New event: "${notification.title || notification.data?.eventTitle || 'New Event'}" in ${notification.community?.name || 'your community'}.`;
      if (notification.relatedEntityType === 'event' && notification.relatedEntityId && notification.communityId) {
        href = `/app/communities/${notification.community?.slug || notification.communityId}/events/${notification.relatedEntityId}`;
      }
      break;
    case PrismaNotificationType.EVENT_REMINDER:
       text = `Reminder: "${notification.title || notification.data?.eventTitle || 'Event'}" is starting soon.`;
       if (notification.relatedEntityType === 'event' && notification.relatedEntityId && notification.communityId) {
        href = `/app/communities/${notification.community?.slug || notification.communityId}/events/${notification.relatedEntityId}`;
      }
      break;
    // Add more cases for other notification types
    default:
      // Use provided title/message if available and specific formatting isn't defined
      if (notification.title) text = notification.title;
      else if (notification.message) text = notification.message;
      else text = `You have a new notification of type: ${notification.type}.`;
      // Generic link to the notifications page if no specific entity link can be formed
      href = '/app/notifications';
  }

  return { href, text };
}

// Helper to get a user-friendly name for notification types (for settings page)
export function getFriendlyNotificationTypeName(type: PrismaNotificationType): string {
  switch (type) {
    case PrismaNotificationType.POST_LIKE: return "Likes on your posts";
    case PrismaNotificationType.POST_COMMENT: return "Comments on your posts";
    case PrismaNotificationType.COMMENT_REPLY: return "Replies to your comments";
    case PrismaNotificationType.COMMENT_LIKE: return "Likes on your comments";
    case PrismaNotificationType.MENTION_IN_POST: return "Mentions in posts";
    case PrismaNotificationType.MENTION_IN_COMMENT: return "Mentions in comments";
    case PrismaNotificationType.ADMIN_ANNOUNCEMENT: return "Admin announcements";
    case PrismaNotificationType.COMMUNITY_INVITE: return "Community invites";
    case PrismaNotificationType.NEW_MEMBER_JOINED_COMMUNITY: return "New member in your community";
    case PrismaNotificationType.ROLE_CHANGE: return "Role changes";
    case PrismaNotificationType.EVENT_CREATED: return "New events in your community";
    case PrismaNotificationType.EVENT_UPDATED: return "Event updates";
    case PrismaNotificationType.EVENT_REMINDER: return "Event reminders";
    case PrismaNotificationType.EVENT_RSVP_CONFIRMATION: return "Event RSVP confirmations";
    case PrismaNotificationType.COURSE_ENROLLMENT: return "New course enrollments";
    case PrismaNotificationType.NEW_LESSON_PUBLISHED: return "New lessons in enrolled courses";
    case PrismaNotificationType.COURSE_COMPLETED: return "Course completions";
    case PrismaNotificationType.BADGE_EARNED: return "Badges earned";
    case PrismaNotificationType.ACHIEVEMENT_UNLOCKED: return "Achievements unlocked";
    case PrismaNotificationType.LEVEL_UP: return "Level ups";
    case PrismaNotificationType.SUBSCRIPTION_STARTED: return "New subscription started";
    case PrismaNotificationType.SUBSCRIPTION_ENDING_SOON: return "Subscription ending soon";
    case PrismaNotificationType.PAYMENT_SUCCESSFUL: return "Successful payments";
    case PrismaNotificationType.PAYMENT_FAILED: return "Failed payments";
    case PrismaNotificationType.NEW_CHAT_MESSAGE: return "New chat messages";
    case PrismaNotificationType.PASSWORD_RESET_REQUEST: return "Password reset requests";
    case PrismaNotificationType.EMAIL_VERIFICATION: return "Email verifications";
    case PrismaNotificationType.NEW_LOGIN_DETECTED: return "New login alerts";
    case PrismaNotificationType.SYSTEM_ALERT: return "System alerts";
    case PrismaNotificationType.FEATURE_UPDATE: return "Feature updates";
    default:
      // Make the enum value more readable
      return type.toString().replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }
}
