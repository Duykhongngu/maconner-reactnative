import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';

import { Platform } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '~/firebase.config';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const useNotifications = () => {
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    registerForPushNotificationsAsync();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      // Xử lý khi nhận được thông báo trong khi app đang mở
      console.log('Received notification:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      // Xử lý khi người dùng nhấn vào thông báo
      console.log('Notification response:', response);
      // Thêm logic điều hướng tới màn hình chat nếu cần
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);
};

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  try {
    // Skip Device.isDevice check temporarily to avoid ExpoDevice error
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
    
    try {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: '344399a1-a42e-47e7-84a8-a7936cdc467a' 
      })).data;

      // Lưu token vào Firestore
      const currentUser = auth.currentUser;
      if (currentUser) {
        await setDoc(doc(db, 'userTokens', currentUser.uid), {
          expoPushToken: token,
          updatedAt: new Date(),
        }, { merge: true });
      }
    } catch (error) {
      console.log('Error getting push token:', error);
    }
  } catch (error) {
    console.log('Error getting notification permissions:', error);
  }

  return token;
} 