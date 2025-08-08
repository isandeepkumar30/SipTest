import React, { useEffect, useState } from 'react';
import
{
  View,
  Text,
  StyleSheet,
  Alert,
  PermissionsAndroid,
  Platform,
  ToastAndroid,
  SafeAreaView,
} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, {
  AndroidImportance,
  AndroidColor,
  EventType,
} from '@notifee/react-native';
import CallDetectionService from './services/CallDetectionService';
import { CALL_STATES, getCallStateDescription } from './utils/CallStates';

const App = () =>
{
  const [fcmToken, setFcmToken] = useState( '' );
  const [callState, setCallState] = useState( CALL_STATES.IDLE );
  const [currentCallNumber, setCurrentCallNumber] = useState( '' );
  const [permissionsGranted, setPermissionsGranted] = useState( false );

  // Request all necessary permissions
  const requestPermissions = async () =>
  {
    if ( Platform.OS === 'android' )
    {
      try
      {
        const granted = await PermissionsAndroid.requestMultiple( [
          PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
          PermissionsAndroid.PERMISSIONS.PROCESS_OUTGOING_CALLS,
          PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        ] );

        const phoneStateGranted = granted[PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE] === PermissionsAndroid.RESULTS.GRANTED;
        const outgoingCallsGranted = granted[PermissionsAndroid.PERMISSIONS.PROCESS_OUTGOING_CALLS] === PermissionsAndroid.RESULTS.GRANTED;
        const callLogGranted = granted[PermissionsAndroid.PERMISSIONS.READ_CALL_LOG] === PermissionsAndroid.RESULTS.GRANTED;
        const notificationsGranted = granted[PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS] === PermissionsAndroid.RESULTS.GRANTED;

        const allGranted = phoneStateGranted && outgoingCallsGranted && callLogGranted;
        setPermissionsGranted( allGranted );

        if ( !allGranted )
        {
          Alert.alert(
            'Permissions Required',
            'This app requires phone state and call log permissions to function properly.',
          );
        }

        return allGranted;
      } catch ( err )
      {
        console.warn( 'Permission request failed:', err );
        return false;
      }
    }
    return true;
  };

  // Initialize FCM
  const initializeFCM = async () =>
  {
    try
    {
      // Request FCM permission
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if ( enabled )
      {
        console.log( 'FCM Authorization status:', authStatus );

        // Get FCM token
        const token = await messaging().getToken();
        setFcmToken( token );
        console.log( 'FCM Token:', token );

        // Listen to token refresh
        messaging().onTokenRefresh( token =>
        {
          setFcmToken( token );
          console.log( 'FCM Token refreshed:', token );
        } );

        // Handle foreground messages
        const unsubscribe = messaging().onMessage( async remoteMessage =>
        {
          console.log( 'FCM Message received in foreground:', remoteMessage );
          await displayNotification( remoteMessage );
        } );

        // Handle notification opened app
        messaging().onNotificationOpenedApp( remoteMessage =>
        {
          console.log( 'Notification caused app to open from background:', remoteMessage );
        } );

        // Check whether an initial notification is available
        messaging()
          .getInitialNotification()
          .then( remoteMessage =>
          {
            if ( remoteMessage )
            {
              console.log( 'Notification caused app to open from quit state:', remoteMessage );
            }
          } );

        return unsubscribe;
      } else
      {
        console.log( 'FCM permission not granted' );
      }
    } catch ( error )
    {
      console.error( 'FCM initialization error:', error );
    }
  };

  // Display notification using Notifee
  const displayNotification = async ( remoteMessage: any ) =>
  {
    try
    {
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
        },
      } );
    } catch ( error )
    {
      console.error( 'Error displaying notification:', error );
    }
  };

  // Initialize call detection
  const initializeCallDetection = async () =>
  {
    const started = await CallDetectionService.startCallDetection();

    if ( started )
    {
      const callListener = CallDetectionService.addListener( ( callData: any ) =>
      {
        console.log( 'Call State Changed:', callData );
        setCallState( callData.state );
        setCurrentCallNumber( callData.phoneNumber || '' );

        // Show toast for call state changes
        const stateDescription = getCallStateDescription( callData.state );
        ToastAndroid.show(
          `Call State: ${ stateDescription }${ callData.phoneNumber ? ` - ${ callData.phoneNumber }` : '' }`,
          ToastAndroid.LONG
        );

        // Handle different call states
        switch ( callData.state )
        {
          case CALL_STATES.RINGING:
            console.log( 'Incoming call from:', callData.phoneNumber );
            break;
          case CALL_STATES.OFFHOOK:
            console.log( 'Call answered' );
            break;
          case CALL_STATES.OUTGOING:
            console.log( 'Outgoing call to:', callData.phoneNumber );
            break;
          case CALL_STATES.IDLE:
            console.log( 'Call ended' );
            setCurrentCallNumber( '' );
            break;
        }
      } );

      return callListener;
    }
    return null;
  };

  // Initialize app
  useEffect( () =>
  {
    let fcmUnsubscribe = null;
    let callListener = null;

    const initializeApp = async () =>
    {
      try
      {

        const permissionsGranted = await requestPermissions();

        // Initialize FCM
        fcmUnsubscribe = await initializeFCM();

        // Initialize call detection if permissions are granted
        if ( permissionsGranted )
        {
          callListener = await initializeCallDetection();
        }

        // Handle Notifee background events
        notifee.onBackgroundEvent( async ( { type, detail } ) =>
        {
          const { notification, pressAction } = detail;

          if ( type === EventType.ACTION_PRESS && pressAction?.id === 'read' )
          {
            await notifee.cancelNotification( notification.id );
          }
        } );


        notifee.onForegroundEvent( ( { type, detail } ) =>
        {
          const { notification, pressAction } = detail;

          if ( type === EventType.ACTION_PRESS && pressAction?.id === 'read' )
          {
            notifee.cancelNotification( notification.id );
          }
        } );

      } catch ( error )
      {
        console.error( 'App initialization error:', error );
      }
    };

    initializeApp();


    return () =>
    {
      if ( fcmUnsubscribe )
      {
        fcmUnsubscribe();
      }
      if ( callListener )
      {
        CallDetectionService.removeListener( callListener );
      }
      CallDetectionService.stopCallDetection();
    };
  }, [] );

  const getCallStateColor = ( state: any ) =>
  {
    switch ( state )
    {
      case CALL_STATES.RINGING:
        return '#4CAF50'; // Green
      case CALL_STATES.OFFHOOK:
        return '#2196F3'; // Blue
      case CALL_STATES.OUTGOING:
        return '#FF9800'; // Orange
      case CALL_STATES.IDLE:
      default:
        return '#757575'; // Gray
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>App Status Dashboard</Text>

        {/* Permissions Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permissions</Text>
          <View style={[styles.statusItem, { backgroundColor: permissionsGranted ? '#4CAF50' : '#F44336' }]}>
            <Text style={styles.statusText}>
              {permissionsGranted ? 'All Permissions Granted' : 'Permissions Required'}
            </Text>
          </View>
        </View>

        {/* FCM Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Firebase Messaging</Text>
          <View style={[styles.statusItem, { backgroundColor: fcmToken ? '#4CAF50' : '#FF9800' }]}>
            <Text style={styles.statusText}>
              {fcmToken ? 'FCM Connected' : 'FCM Initializing...'}
            </Text>
          </View>
          {fcmToken ? (
            <Text style={styles.tokenText} numberOfLines={3}>
              Token: {fcmToken}
            </Text>
          ) : null}
        </View>

        {/* Call Detection Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Call Detection</Text>
          <View style={[styles.statusItem, { backgroundColor: getCallStateColor( callState ) }]}>
            <Text style={styles.statusText}>
              {getCallStateDescription( callState )}
            </Text>
          </View>
          {currentCallNumber ? (
            <Text style={styles.phoneNumber}>
              Phone Number: {currentCallNumber}
            </Text>
          ) : null}
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <Text style={styles.instruction}>
            • Make or receive phone calls to test call detection
          </Text>
          <Text style={styles.instruction}>
            • Send FCM notifications to test messaging
          </Text>
          <Text style={styles.instruction}>
            • Check console logs for detailed information
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create( {
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  section: {
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  statusItem: {
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tokenText: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
    fontFamily: 'monospace',
  },
  phoneNumber: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  instruction: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
} );

export default App;