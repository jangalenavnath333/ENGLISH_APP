import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Behavior when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function setupDailyReminder() {
  if (!Device.isDevice) {
    console.log('Must use physical device for Push Notifications');
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return;
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // 1. Cancel all previously scheduled notifications
  // (Because the user just opened the app, they don't need a reminder today)
  await Notifications.cancelAllScheduledNotificationsAsync();

  // 2. Schedule a new notification for TOMORROW at 8:00 PM
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(20, 0, 0, 0); // 20:00 = 8:00 PM

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Bolu English 📚",
      body: "आज तुम्ही ॲप वापरलात का? तुमचा आजचा टास्क पूर्ण करायला विसरू नका!",
      sound: true,
    },
    trigger: tomorrow,
  });

  console.log("Daily reminder scheduled for:", tomorrow.toLocaleString());
}
