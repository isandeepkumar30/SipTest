import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import BackgroundService from 'react-native-background-actions';
import NotesScreen from './components/NotesScreen/notesScreen';
import UpcomingScreen from './components/UpcomingScreen/upcomingScreen';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { runInAction } from 'mobx';
import { observer } from 'mobx-react';
import { fetchHomePageData, homePageStore } from './Store/HomePageStore/storeHomePage';
import { Pressable } from 'react-native';
import { LoginScreen } from './components/LoginScreen/loginFormScreen';
import { StudentList } from './components/HomeScreen/homeScreen';
import { styles } from './AppStyle';
import { authStore } from './Store/LogicAuthStore/authStore';

const sleep = ( time: number ): Promise<void> =>
  new Promise( resolve => setTimeout( () => resolve(), time ) );

// Import CallDetectionService
import CallDetectionService from './services/CallDetectionService';

import
{
  requestUserPermission,
  NotificationListener,
} from './utils/NotificationServiceFunction/notificationService';
import { callStore, fetchingPastEventsData } from './Store/CallLogsStore/callLogsStore';

import
{
  ActivityIndicator,
  View,
  Alert,
  Text,
  Modal,
  ToastAndroid,
  AppState,
} from 'react-native';
import { TwoFactorAuthorization } from './components/TwoFAuthorizationScreen/twofactorauthorization';
import LogoutButton from './utils/LogoutButton/logoutbutton';
import GetVersionName from './utils/GetVersionComponent/getVersion';

// Define call states based on your CallDetectionService
const CALL_STATES = {
  IDLE: 'IDLE',
  RINGING: 'RINGING',
  OFFHOOK: 'OFFHOOK',
  OUTGOING: 'OUTGOING'
} as const;

// ===== IMPROVED BACKGROUND TASK =====
const backgroundTask = async ( taskDataArguments: any ) =>
{
  const delay = taskDataArguments?.delay ?? 5000;
  console.log( 'Background task started with delay:', delay );

  while ( BackgroundService.isRunning() )
  {
    try
    {
      console.log( 'Background task running...' );

      // Keep call detection active
      const isCallDetectionActive = await CallDetectionService.isActive();
      if ( !isCallDetectionActive )
      {
        console.log( 'Restarting call detection in background...' );
        await CallDetectionService.startCallDetection();
      }

      // Check app state and handle accordingly
      const currentAppState = AppState.currentState;
      console.log( 'App state in background:', currentAppState );

      await sleep( delay );
    } catch ( error )
    {
      console.error( 'Background task error:', error );
      await sleep( delay );
    }
  }

  console.log( 'Background task stopped' );
};

// ===== BACKGROUND SERVICE OPTIONS =====
const backgroundOptions = {
  taskName: 'CallDetectionService',
  taskTitle: 'Call Detection Active',
  taskDesc: 'Monitoring calls for student information',
  taskIcon: {
    name: 'ic_launcher',
    type: 'mipmap',
  },
  color: '#b6488d',
  linkingURI: 'callervismaad://call',
  parameters: {
    delay: 5000,
  },
};

const getCallStateDescription = ( state: string ): string =>
{
  switch ( state )
  {
    case CALL_STATES.IDLE:
      return 'No Call';
    case CALL_STATES.RINGING:
      return 'Incoming Call';
    case CALL_STATES.OFFHOOK:
      return 'Call Active';
    case CALL_STATES.OUTGOING:
      return 'Outgoing Call';
    default:
      return 'Unknown';
  }
};

const MainStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

function MainScreens ()
{
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="studentList" component={StudentList} />
      <MainStack.Screen name="twoFactorAuthorization" component={TwoFactorAuthorization} />
      <MainStack.Screen
        name="NotesScreen"
        component={NotesScreen}
        options={{
          headerShown: true,
          headerTitleStyle: { color: '#fff' },
          headerTitleAlign: 'center',
          headerTitle: 'Student Notes',
          headerStyle: { backgroundColor: '#b6488d' },
          headerTintColor: 'white',
          headerShadowVisible: false,
          headerRight: () => <LogoutButton />,
        }}
      />
      <MainStack.Screen
        name="UpcomingNotesScreen"
        component={UpcomingScreen}
        options={{
          headerShown: true,
          headerTitleStyle: { color: '#fff' },
          headerTitleAlign: 'center',
          headerTitle: 'Event Calendar',
          headerStyle: { backgroundColor: '#b6488d' },
          headerTintColor: 'white',
          headerShadowVisible: false,
          headerRight: () => <LogoutButton />,
        }}
      />
    </MainStack.Navigator>
  );
}

const LoaderComponent = () => (
  <View style={styles.loaderContainer}>
    <ActivityIndicator size="large" color="#b6488d" />
  </View>
);

const App = observer( () =>
{
  // State management
  const [isBackgroundServiceStarted, setIsBackgroundServiceStarted] = useState( false );
  const [versionName, setVersionName] = useState<string>( '' );
  const [apiVersionName, setApiVersionName] = useState<string>( '' );
  const [loadingVersion, setLoadingVersion] = useState<boolean>( true );
  const [fcmToken, setFcmToken] = useState<string>( '' );
  const [callState, setCallState] = useState<string>( CALL_STATES.IDLE );
  const [currentCallNumber, setCurrentCallNumber] = useState<string>( '' );
  const [permissionsGranted, setPermissionsGranted] = useState<boolean>( false );
  const [isAppInitialized, setIsAppInitialized] = useState<boolean>( false );

  // Use refs to track service state and prevent memory leaks
  const backgroundServiceRef = useRef<boolean>( false );
  const appStateRef = useRef( AppState.currentState );
  const callListenerRef = useRef<any>( null );
  const fcmTokenIntervalRef = useRef<NodeJS.Timeout | null>( null );
  const appStateListenerRef = useRef<any>( null );
  const isCleaningUpRef = useRef<boolean>( false );

  // Version functions
  const fetchVersionName = useCallback( async (): Promise<void> =>
  {
    try
    {
      const version = await DeviceInfo.getVersion();
      setVersionName( version );
    } catch ( error )
    {
      console.error( 'Error fetching version name:', error );
      setVersionName( 'Unknown' );
    }
  }, [] );

  const fetchingVersionName = useCallback( async (): Promise<void> =>
  {
    setLoadingVersion( true );
    try
    {
      const apiUrlFromStorage = 'https://sipabacuslms.co.nz/api/';
      if ( apiUrlFromStorage )
      {
        const response = await fetch( apiUrlFromStorage + 'app-lts-version', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        } );

        if ( response.ok )
        {
          const responseData = await response.json();
          setApiVersionName( responseData.lts_version || 'Unknown Version' );
        } else
        {
          const errorMessage = `Error: ${ response.status } - ${ response.statusText }`;
          if ( ToastAndroid?.show )
          {
            ToastAndroid.show( errorMessage, ToastAndroid.LONG );
          }
          console.error( errorMessage );
          setApiVersionName( 'Unknown Version' );
        }
      }
    } catch ( error )
    {
      console.error( 'Error fetching API version:', error );
      if ( ToastAndroid?.show )
      {
        ToastAndroid.show( 'An error occurred while fetching data.', ToastAndroid.LONG );
      }
      setApiVersionName( 'Unknown Version' );
    } finally
    {
      setLoadingVersion( false );
    }
  }, [] );

  // Initialize FCM
  const initializeFCM = useCallback( async (): Promise<void> =>
  {
    try
    {
      console.log( 'Initializing FCM...' );
      await requestUserPermission();
      await NotificationListener();
      console.log( 'FCM initialized successfully' );
    } catch ( error )
    {
      console.error( 'FCM initialization error:', error );
    }
  }, [] );

  // Initialize call detection service
  const initializeCallDetectionService = useCallback( async (): Promise<boolean> =>
  {
    try
    {
      console.log( 'Initializing call detection service...' );

      const permissionStatus = await CallDetectionService.checkAllPermissions();
      console.log( 'Current permission status:', permissionStatus );

      const hasPermissions = await CallDetectionService.requestPermissions();
      console.log( 'Call detection permissions granted:', hasPermissions );

      if ( !hasPermissions )
      {
        Alert.alert(
          'Permissions Required',
          'This app requires phone and notification permissions for call detection. Background service will not work without these permissions.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setPermissionsGranted( false )
            },
            {
              text: 'Retry',
              onPress: async () =>
              {
                const retryPermissions = await CallDetectionService.requestPermissions();
                if ( retryPermissions )
                {
                  await initializeCallDetectionService();
                }
              }
            }
          ]
        );
        setPermissionsGranted( false );
        return false;
      }

      const started = await CallDetectionService.startCallDetection();
      console.log( 'Call detection started:', started );

      if ( started )
      {
        setPermissionsGranted( true );

        // Remove existing listener if any
        if ( callListenerRef.current )
        {
          CallDetectionService.removeListener( callListenerRef.current );
        }

        // Add new listener
        const listener = CallDetectionService.addListener( ( callData: any ) =>
        {
          console.log( 'Call State Changed in App:', callData );

          if ( callData?.state )
          {
            setCallState( callData.state );
          }

          if ( callData?.phoneNumber )
          {
            setCurrentCallNumber( callData.phoneNumber );
          } else if ( callData?.state === CALL_STATES.IDLE )
          {
            setCurrentCallNumber( '' );
          }

          // Handle different call states
          switch ( callData?.state )
          {
            case CALL_STATES.RINGING:
              if ( callData?.phoneNumber )
              {
                fetchingPastEventsData( callData.phoneNumber, 'RINGING' );
              }
              break;

            case CALL_STATES.OFFHOOK:
              if ( callData?.phoneNumber )
              {
                fetchingPastEventsData( callData.phoneNumber, 'OFFHOOK' );
              }
              break;

            case CALL_STATES.OUTGOING:
              if ( callData?.phoneNumber )
              {
                fetchingPastEventsData( callData.phoneNumber, 'OUTGOING' );
              }
              break;

            case CALL_STATES.IDLE:
              setCurrentCallNumber( '' );
              if ( callStore?.setModalVisible )
              {
                callStore.setModalVisible( false );
              }
              break;
          }
        } );

        callListenerRef.current = listener;
        console.log( 'Call listener added successfully' );
        return true;
      } else
      {
        console.log( 'Call detection failed to start' );
        setPermissionsGranted( false );
        return false;
      }
    } catch ( error )
    {
      console.error( 'Call detection initialization error:', error );
      setPermissionsGranted( false );
      return false;
    }
  }, [] );

  // ===== FIXED BACKGROUND SERVICE MANAGEMENT =====
  const startBackgroundService = useCallback( async () =>
  {
    try
    {
      if ( backgroundServiceRef.current || isCleaningUpRef.current )
      {
        console.log( 'Background service already running or app is cleaning up' );
        return;
      }

      console.log( 'Starting background service...' );
      await BackgroundService.start( backgroundTask, backgroundOptions );
      backgroundServiceRef.current = true;
      setIsBackgroundServiceStarted( true );
      console.log( 'Background service started successfully' );
    } catch ( error )
    {
      console.error( 'Error starting background service:', error );
      backgroundServiceRef.current = false;
      setIsBackgroundServiceStarted( false );
    }
  }, [] );

  const stopBackgroundService = useCallback( async () =>
  {
    try
    {
      if ( !backgroundServiceRef.current )
      {
        console.log( 'Background service not running' );
        return;
      }

      console.log( 'Stopping background service...' );
      await BackgroundService.stop();
      backgroundServiceRef.current = false;
      setIsBackgroundServiceStarted( false );
      console.log( 'Background service stopped' );
    } catch ( error )
    {
      console.error( 'Error stopping background service:', error );
    }
  }, [] );

  // ===== IMPROVED APP STATE CHANGE HANDLING =====
  const handleAppStateChange = useCallback( async ( nextAppState: string ) =>
  {
    console.log( 'App state changed from', appStateRef.current, 'to', nextAppState );

    if ( appStateRef.current.match( /inactive|background/ ) && nextAppState === 'active' )
    {
      console.log( 'App has come to the foreground!' );
      // App came to foreground - ensure services are still running
      if ( permissionsGranted && !backgroundServiceRef.current && !isCleaningUpRef.current )
      {
        console.log( 'Restarting background service on foreground' );
        await startBackgroundService();
      }
    } else if ( nextAppState.match( /inactive|background/ ) )
    {
      console.log( 'App has gone to the background!' );
      // App went to background - ensure background service is running
      if ( permissionsGranted && !backgroundServiceRef.current && !isCleaningUpRef.current )
      {
        console.log( 'Starting background service on background' );
        await startBackgroundService();
      }
    }

    appStateRef.current = nextAppState;
  }, [permissionsGranted, startBackgroundService] );

  // Modal handlers
  const handleViewDetails = useCallback( () =>
  {
    const { studentName } = callStore.studentDetails;
    if ( studentName )
    {
      callStore.setStudentName( studentName );
      homePageStore.setSearchQuery( studentName );
      fetchHomePageData();
      callStore.setModalVisible( false );
    } else
    {
      ToastAndroid.show( 'Student name is empty.', ToastAndroid.LONG );
    }
  }, [] );

  const handleCloseModal = useCallback( () =>
  {
    callStore.setModalVisible( false );
  }, [] );

  // ===== APP STATE CHANGE LISTENER =====
  useEffect( () =>
  {
    if ( isAppInitialized )
    {
      appStateListenerRef.current = AppState.addEventListener( 'change', handleAppStateChange );
      return () =>
      {
        appStateListenerRef.current?.remove();
      };
    }
  }, [handleAppStateChange, isAppInitialized] );

  // ===== FCM TOKEN MONITORING =====
  useEffect( () =>
  {
    if ( isAppInitialized )
    {
      fcmTokenIntervalRef.current = setInterval( async () =>
      {
        try
        {
          const currentToken = await AsyncStorage.getItem( 'FcmToken' );
          if ( currentToken && currentToken !== fcmToken )
          {
            setFcmToken( currentToken );
            console.log( 'FCM Token updated:', currentToken );
          }
        } catch ( error )
        {
          console.error( 'Error checking FCM token:', error );
        }
      }, 5000 );

      return () =>
      {
        if ( fcmTokenIntervalRef.current )
        {
          clearInterval( fcmTokenIntervalRef.current );
        }
      };
    }
  }, [fcmToken, isAppInitialized] );

  // ===== VERSION INITIALIZATION =====
  useEffect( () =>
  {
    const initializeVersions = async () =>
    {
      await Promise.all( [fetchVersionName(), fetchingVersionName()] );
    };
    initializeVersions();
  }, [fetchVersionName, fetchingVersionName] );

  // ===== MAIN APP INITIALIZATION - RUNS ONLY ONCE =====
  useEffect( () =>
  {
    let isMounted = true;

    const initializeApp = async () =>
    {
      try
      {
        if ( isAppInitialized ) return;

        console.log( 'Starting app initialization...' );
        isCleaningUpRef.current = false;

        // Initialize FCM first
        await initializeFCM();

        // Request battery optimization
        try
        {
          await CallDetectionService.requestBatteryOptimization();
        } catch ( error )
        {
          console.warn( 'Battery optimization request failed:', error );
        }

        // Initialize call detection
        const callDetectionSuccess = await initializeCallDetectionService();

        if ( !isMounted ) return;

        // Start background service if permissions are granted
        if ( callDetectionSuccess && permissionsGranted && !isCleaningUpRef.current )
        {
          await startBackgroundService();
        }

        if ( isMounted )
        {
          setIsAppInitialized( true );
        }

        console.log( 'App initialization completed' );
      } catch ( error )
      {
        console.error( 'Error initializing app:', error );
      }
    };

    initializeApp();

    return () =>
    {
      isMounted = false;
    };
  }, [] ); // Empty dependency array - runs only once

  // ===== LOGIN STATUS CHECK =====
  useEffect( () =>
  {
    const checkUserLoginStatus = async () =>
    {
      try
      {
        const isLoggedIn = await AsyncStorage.getItem( 'isUserLoggedIn' );
        if ( isLoggedIn === 'true' && authStore )
        {
          runInAction( () =>
          {
            authStore.isLoggedIn = true;
          } );
        }
      } catch ( error )
      {
        console.error( 'Error checking login status:', error );
      } finally
      {
        if ( callStore?.setIsAppLoading )
        {
          callStore.setIsAppLoading( false );
        }
      }
    };

    checkUserLoginStatus();
  }, [] );

  // ===== CLEANUP ON UNMOUNT - THIS SHOULD NOT STOP BACKGROUND SERVICE =====
  useEffect( () =>
  {
    return () =>
    {
      console.log( 'App component unmounting - performing cleanup...' );
      isCleaningUpRef.current = true;

      // Clear intervals
      if ( fcmTokenIntervalRef.current )
      {
        clearInterval( fcmTokenIntervalRef.current );
      }

      // Remove app state listener
      if ( appStateListenerRef.current )
      {
        appStateListenerRef.current.remove();
      }

      // Remove call listener but keep call detection running
      if ( callListenerRef.current )
      {
        CallDetectionService.removeListener( callListenerRef.current );
      }

      // DO NOT STOP THESE SERVICES - THEY SHOULD CONTINUE IN BACKGROUND
      // CallDetectionService.stopCallDetection(); // REMOVED
      // stopBackgroundService(); // REMOVED

      console.log( 'App cleanup completed - background services continue running' );
    };
  }, [] );

  // Loading state
  if ( callStore?.isAppLoading || loadingVersion )
  {
    return <LoaderComponent />;
  }

  const isVersionMismatch = versionName !== apiVersionName;

  return (
    <NavigationContainer>
      {isVersionMismatch ? (
        <GetVersionName versionName={versionName} apiVersionName={apiVersionName} />
      ) : authStore.isLoggedIn ? (
        <MainScreens />
      ) : (
            <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Login" component={LoginScreen} />
        </AuthStack.Navigator>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={callStore.modalVisible}
        onRequestClose={handleCloseModal}>
        <View
          style={[
            styles.modalContainer,
            { padding: 10, backgroundColor: 'rgba(0,0,0,.8)' },
          ]}>
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 8,
              display: 'flex',
              padding: 0,
              width: '90%',
            }}>
            <Text
              style={{
                backgroundColor: '#b6488d',
                width: '100%',
                borderTopLeftRadius: 6,
                borderTopRightRadius: 6,
                paddingHorizontal: 20,
                paddingVertical: 12,
                fontSize: 16,
                fontWeight: 'bold',
                color: '#ffffff',
              }}>
              Sip Abacus LMS Caller
            </Text>

            <View style={{ padding: 20, paddingBottom: 0 }}>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}>
                  Student Name:
                </Text>
                <Text
                  style={{
                    marginLeft: 5,
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: '#b6488d',
                    width: '60%',
                  }}>
                  {callStore.studentDetails.studentName}
                </Text>
              </View>
              <View
                style={{
                  marginBottom: 10,
                  display: 'flex',
                  flexDirection: 'row',
                }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
                  Parent Name:{' '}
                </Text>
                <Text
                  style={{
                    marginLeft: 5,
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: '#b6488d',
                    width: '60%',
                  }}>
                  {callStore.studentDetails.parentName}
                </Text>
              </View>
            </View>

            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-around',
                padding: 20,
                paddingTop: 0,
              }}>
              <Pressable
                style={[
                  styles.viewDetailsButton,
                  { width: '48%', alignItems: 'center' },
                ]}
                onPress={handleViewDetails}>
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>
                  View Details
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.closeButton,
                  { width: '48%', alignItems: 'center' },
                ]}
                onPress={handleCloseModal}>
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>
                  Close
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </NavigationContainer>
  );
} );

export default App;