import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import notifee, { AndroidColor, AndroidImportance } from '@notifee/react-native';

export async function requestUserPermission ()
{
  try
  {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if ( enabled )
    {
      console.log( 'Authorization status:', authStatus );
      getFCMToken();
    }
  } catch ( error )
  {
    console.error( 'Error requesting permission:', error );
  }
}

export const getFCMToken = async () =>
{
  let FCMToken = await AsyncStorage.getItem( 'FcmToken' );
  console.log( FCMToken, 'the old Token' );
  if ( !FCMToken )
  {
    try
    {
      await messaging().registerDeviceForRemoteMessages();
      const FCMToken = await messaging().getToken();

      if ( FCMToken )
      {
        console.log( 'the New Generate FCM token status get:', FCMToken );
        await AsyncStorage.setItem( 'FcmToken', FCMToken );
      }
    } catch ( error )
    {
      console.log( error, 'error raised in FCM Token' );
    }
  }
};

export const NotificationListener = async () =>
{
  messaging().onNotificationOpenedApp(
    async ( remoteMessage: FirebaseMessagingTypes.RemoteMessage ) =>
    {
      console.log(
        'Notification caused app to open from background state:',
        remoteMessage.notification,
      );
    },
  );

  messaging().onMessage(
    async ( remoteMessage: FirebaseMessagingTypes.RemoteMessage ) =>
    {
      console.log( 'received in foreground remoteMessage', remoteMessage );
      DisplayNotification( remoteMessage );
    },
  );

  messaging()
    .getInitialNotification()
    .then( remoteMessage =>
    {
      if ( remoteMessage )
      {
        console.log(
          'Notification caused app to open from quit state:',
          remoteMessage.notification,
        );
      }
    } );
};

export const DisplayNotification = async ( RemoteMessage: any ) =>
{
  const channelId = await notifee.createChannel( {
    id: 'default',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
    badge: false,
  } );

  await notifee.displayNotification( {
    title: RemoteMessage.data.title,
    body: RemoteMessage.data.body,
    android: {
      channelId,
      color: AndroidColor.RED,
      colorized: true,
      timestamp: Date.now(),
      showTimestamp: true,
      importance: AndroidImportance.HIGH,
    },
  } );
};