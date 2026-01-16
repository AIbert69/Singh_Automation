/**
 * Notifications Hook for Sam Agent 2.0
 * Handles push notifications for daily briefings and opportunity alerts
 */

import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationSettings {
  enabled: boolean;
  dailyBriefingTime: string; // "07:00"
  highScoreAlerts: boolean;
  minScoreForAlert: number;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  dailyBriefingTime: '07:00',
  highScoreAlerts: true,
  minScoreForAlert: 70,
};

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Register for push notifications
    registerForPushNotificationsAsync().then(token => {
      if (token) setExpoPushToken(token);
    });

    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(
      notification => {
        setNotification(notification);
      }
    );

    // Listen for notification responses (when user taps notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      response => {
        const data = response.notification.request.content.data;
        // Handle navigation based on notification type
        if (data.type === 'briefing') {
          // Navigate to briefing screen
        } else if (data.type === 'opportunity') {
          // Navigate to opportunity detail
        }
      }
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Schedule daily briefing notification
  const scheduleDailyBriefing = async (time: string) => {
    // Cancel existing scheduled notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (!settings.enabled) return;

    const [hours, minutes] = time.split(':').map(Number);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "📋 Your Daily Briefing is Ready",
        body: "Good morning! Check out today's government contracting opportunities.",
        data: { type: 'briefing' },
      },
      trigger: {
        hour: hours,
        minute: minutes,
        repeats: true,
      },
    });
  };

  // Send immediate notification for high-score opportunity
  const notifyHighScoreOpportunity = async (opportunity: {
    title: string;
    score: number;
    agency: string;
  }) => {
    if (!settings.enabled || !settings.highScoreAlerts) return;
    if (opportunity.score < settings.minScoreForAlert) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🎯 High-Score Opportunity: ${opportunity.score}/100`,
        body: `${opportunity.title} - ${opportunity.agency}`,
        data: { type: 'opportunity', score: opportunity.score },
      },
      trigger: null, // Immediate
    });
  };

  // Update notification settings
  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    // Reschedule daily briefing if time changed
    if (newSettings.dailyBriefingTime) {
      await scheduleDailyBriefing(newSettings.dailyBriefingTime);
    }

    // Save settings to storage (would use AsyncStorage in production)
  };

  return {
    expoPushToken,
    notification,
    settings,
    updateSettings,
    scheduleDailyBriefing,
    notifyHighScoreOpportunity,
  };
}

// Helper function to register for push notifications
async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    token = tokenData.data;
  } catch (error) {
    console.error('Error getting push token:', error);
  }

  return token;
}

export default useNotifications;
