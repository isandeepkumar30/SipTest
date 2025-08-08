import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, {
  AndroidImportance,
  AndroidColor,
  EventType,
} from '@notifee/react-native';
import { name as appName } from './app.json';
import App from './src/App';

// Handle background events from Notifee
notifee.onBackgroundEvent( async ( { type, detail } ) =>
{
  const { notification, pressAction } = detail;

  console.log( 'Notifee background event:', type, detail );

  if ( type === EventType.ACTION_PRESS && pressAction?.id === 'read' )
  {
    console.log( 'Mark as read action pressed' );
    await notifee.cancelNotification( notification.id );
  }
} );

// Handle background messages from FCM
messaging().setBackgroundMessageHandler( async remoteMessage =>
{
  console.log( 'FCM Message handled in the background!', remoteMessage );
  await DisplayNotification( remoteMessage );
} );

// Display notification function
const DisplayNotification = async remoteMessage =>
{
  try
  {
    console.log( 'Displaying notification for:', remoteMessage );

    const channelId = await notifee.createChannel( {
      id: 'default',
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
      actions: [
        {
          title: 'Mark as Read',
          pressAction: {
            id: 'read',
          },
        },
      ],
    } );

    await notifee.displayNotification( {
      title: remoteMessage.data?.title || remoteMessage.notification?.title || 'New Message',
      body: remoteMessage.data?.body || remoteMessage.notification?.body || 'You have a new message',
      android: {
        channelId,
        color: AndroidColor.RED,
        importance: AndroidImportance.HIGH,
        showTimestamp: true,
        timestamp: Date.now(),
        smallIcon: 'ic_launcher', // Make sure you have this icon
        largeIcon: remoteMessage.notification?.android?.imageUrl,
        pressAction: {
          id: 'default',
        },
      },
      data: remoteMessage.data,
    } );
  } catch ( error )
  {
    console.error( 'Error displaying notification:', error );
  }
};

// Register the main application component
AppRegistry.registerComponent( appName, () => App );