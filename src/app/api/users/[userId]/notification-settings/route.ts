import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session'; // Placeholder for auth
import { NotificationType as PrismaNotificationType } from '@prisma/client'; // Import the enum

interface UserNotificationSettingsRouteContext {
  params: {
    userId: string;
  };
}

// GET /api/users/[userId]/notification-settings - Retrieve notification settings for a user
export async function GET(request: Request, { params }: UserNotificationSettingsRouteContext) {
  const { userId: routeUserId } = params;
  const sessionUser = await getCurrentUser();

  if (!sessionUser || !sessionUser.id || sessionUser.id !== routeUserId) {
    // Add admin check here if needed: && !sessionUser.isAdmin
    return NextResponse.json({ error: 'Unauthorized. You can only view your own settings.' }, { status: 403 });
  }

  try {
    // 1. Fetch all defined NotificationType enum values
    // Prisma's $Enums object can be used if available and client is generated,
    // otherwise, manual list or another source of truth for NotificationType values.
    // For robustness, especially if NotificationType enum grows, it's best to have a canonical list.
    // Here, we'll use the PrismaNotificationType enum directly.
    const allPossibleNotificationTypes = Object.values(PrismaNotificationType);


    // 2. Fetch user's explicitly customized settings
    const customSettings = await prisma.userNotificationSetting.findMany({
      where: { userId: routeUserId },
    });

    // 3. Merge custom settings with defaults for all notification types
    // This ensures the client gets a full list of all possible notification types
    // and their current effective settings (default or custom).

    const settingsMap = new Map<string, typeof customSettings[0]>();
    customSettings.forEach(setting => {
      // Key by notificationType and communityId (null for global)
      const key = `${setting.notificationType}-${setting.communityId || 'global'}`;
      settingsMap.set(key, setting);
    });

    const fullSettingsList = allPossibleNotificationTypes.map(typeValue => {
      const globalKey = `${typeValue}-global`;
      const globalSetting = settingsMap.get(globalKey);

      // For now, we are only returning global settings.
      // If per-community default generation is needed, it's more complex.
      // Client can interpret global settings as defaults for communities unless an override exists.

      if (globalSetting) {
        return globalSetting;
      } else {
        // Return default settings if no specific global setting exists for this type
        return {
          // id: will be generated if/when user saves this specific setting
          userId: routeUserId,
          communityId: null, // This is a global default representation
          notificationType: typeValue,
          emailEnabled: true, // Default value
          inAppEnabled: true, // Default value
          pushEnabled: false, // Default value
          digestFrequency: null, // Default value
          // createdAt, updatedAt would not exist for a purely default/unsaved entry
        };
      }
    });

    // Also include any per-community settings the user might have saved
    // These are distinct entries and don't "override" the global defaults in this list directly,
    // but client will get them and can apply logic.
    const perCommunityCustomSettings = customSettings.filter(s => s.communityId !== null);
    const finalSettings = [...fullSettingsList.filter(s => s.communityId === null), ...perCommunityCustomSettings];


    return NextResponse.json(finalSettings, { status: 200 });
  } catch (error: any) {
    console.error(`Error fetching notification settings for user ${routeUserId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch notification settings.', details: error.message }, { status: 500 });
  }
}

// PUT /api/users/[userId]/notification-settings - Update/create notification settings
export async function PUT(request: Request, { params }: UserNotificationSettingsRouteContext) {
  const { userId: routeUserId } = params;
  const sessionUser = await getCurrentUser();

  if (!sessionUser || !sessionUser.id || sessionUser.id !== routeUserId) {
    // Add admin check here if needed
    return NextResponse.json({ error: 'Unauthorized. You can only update your own settings.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    // Expects an array of settings objects
    const settingsToUpdate: Array<{
      notificationType: PrismaNotificationType; // Use Prisma enum type
      communityId?: string | null;
      emailEnabled?: boolean;
      inAppEnabled?: boolean;
      pushEnabled?: boolean;
      digestFrequency?: string | null;
    }> = body;

    if (!Array.isArray(settingsToUpdate)) {
      return NextResponse.json({ error: 'Invalid request body. Expected an array of settings.' }, { status: 400 });
    }

    const upsertResults = [];

    for (const setting of settingsToUpdate) {
      if (!setting.notificationType || !Object.values(PrismaNotificationType).includes(setting.notificationType)) {
        // Skip invalid notification types or return an error
        console.warn(`Invalid notificationType provided: ${setting.notificationType}`);
        // Or: return NextResponse.json({ error: `Invalid notificationType: ${setting.notificationType}` }, { status: 400 });
        continue;
      }

      const communityId = setting.communityId || null; // Ensure communityId is null for global, not undefined

      const dataToUpsert: any = {
        userId: routeUserId,
        notificationType: setting.notificationType,
        communityId: communityId,
      };
      if (setting.emailEnabled !== undefined) dataToUpsert.emailEnabled = setting.emailEnabled;
      if (setting.inAppEnabled !== undefined) dataToUpsert.inAppEnabled = setting.inAppEnabled;
      if (setting.pushEnabled !== undefined) dataToUpsert.pushEnabled = setting.pushEnabled;
      if (setting.digestFrequency !== undefined) dataToUpsert.digestFrequency = setting.digestFrequency;

      const updateData = { ...dataToUpsert };
      delete updateData.userId; // Not needed for update clause of upsert if part of where
      delete updateData.communityId;
      delete updateData.notificationType;


      const result = await prisma.userNotificationSetting.upsert({
        where: {
          userId_communityId_notificationType: {
            userId: routeUserId,
            communityId: communityId,
            notificationType: setting.notificationType,
          },
        },
        create: dataToUpsert,
        update: updateData,
      });
      upsertResults.push(result);
    }

    return NextResponse.json({ message: 'Notification settings updated successfully.', updatedSettings: upsertResults }, { status: 200 });

  } catch (error: any) {
    console.error(`Error updating notification settings for user ${routeUserId}:`, error);
    if (error.name === 'PrismaClientKnownRequestError' && error.code === 'P2002') { // Unique constraint failed
        return NextResponse.json({ error: 'Failed to update settings due to a conflict. Please try again.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update notification settings.', details: error.message }, { status: 500 });
  }
}
