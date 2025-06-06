import prisma from '@/lib/prisma'; // Assuming prisma client is at src/lib/prisma
import { NotificationType as PrismaNotificationType } from '@prisma/client'; // Import the enum for type safety

// Define an interface for the arguments, mirroring NotificationCreateInput but making some fields optional
// and adding `recipientUserId` explicitly.
export interface NotificationCreateArgs {
  recipientUserId: string;
  type: PrismaNotificationType; // Use the Prisma enum type
  actorId?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  communityId?: string | null;
  title?: string | null; // Optional: if pre-generating, otherwise client can construct
  message?: string | null; // Optional: if pre-generating
  data?: Record<string, any> | null; // JSON data
}

/**
 * Creates a notification for a user if their settings allow for it.
 * This function is intended to be called from various API routes after an action
 * that should trigger a notification.
 *
 * @param args - Arguments for creating the notification.
 * @returns The created Notification object or null if not created due to settings.
 */
export async function createNotification(args: NotificationCreateArgs): Promise<import('@prisma/client').Notification | null> {
  const {
    recipientUserId,
    type,
    actorId,
    relatedEntityType,
    relatedEntityId,
    communityId,
    title,
    message,
    data,
  } = args;

  try {
    // 1. Fetch UserNotificationSettings for the recipientUserId, type, and communityId (if applicable).
    // Start by checking for a community-specific setting.
    let setting = null;
    if (communityId) {
      setting = await prisma.userNotificationSetting.findUnique({
        where: {
          userId_communityId_notificationType: {
            userId: recipientUserId,
            communityId: communityId,
            notificationType: type,
          },
        },
      });
    }

    // If no community-specific setting, check for a global setting for this type.
    if (!setting) {
      setting = await prisma.userNotificationSetting.findUnique({
        where: {
          userId_communityId_notificationType: {
            userId: recipientUserId,
            communityId: null, // Global setting explicitly has communityId as null
            notificationType: type,
          },
        },
      });
    }

    // 2. Check if inAppEnabled is true based on settings.
    // Default to true if no specific setting is found (i.e., user hasn't opted out).
    const inAppEnabled = setting ? setting.inAppEnabled : true;

    if (inAppEnabled) {
      // 3. If true, create a Notification record in the database.
      const notificationData: any = {
        userId: recipientUserId,
        type,
        actorId: actorId || null,
        relatedEntityType: relatedEntityType || null,
        relatedEntityId: relatedEntityId || null,
        communityId: communityId || null,
        title: title || null, // Title might be constructed by client based on type/data
        message: message || null, // Message might be constructed by client
        data: data || undefined, // Prisma expects 'undefined' for Json? if null
        isRead: false,
      };

      const newNotification = await prisma.notification.create({
        data: notificationData,
      });
      console.log(`Notification created for user ${recipientUserId}, type ${type}`);
      return newNotification;
    } else {
      console.log(`In-app notification for type ${type} disabled for user ${recipientUserId}.`);
      return null;
    }

    // 4. (Future: Handle email/push notification queuing here based on settings).
    // if (setting ? setting.emailEnabled : true) { /* queue email */ }
    // if (setting ? setting.pushEnabled : false) { /* queue push notification */ }

  } catch (error) {
    console.error('Error in createNotification helper:', error);
    // Depending on desired behavior, you might want to throw the error
    // or just log it and return null to not block the main operation.
    return null;
  }
}
