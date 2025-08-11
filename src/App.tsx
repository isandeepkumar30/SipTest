import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';

import NotesScreen from './components/NotesScreen/notesScreen';
import UpcomingScreen from './components/UpcomingScreen/upcomingScreen';

import React, { useEffect, useState } from 'react';
import { runInAction } from 'mobx';
import { observer } from 'mobx-react';
import { fetchHomePageData, homePageStore } from './Store/HomePageStore/storeHomePage';
import { Pressable } from 'react-native';
import { LoginScreen } from './components/LoginScreen/loginFormScreen';
import { StudentList } from './components/HomeScreen/homeScreen';
import { styles } from './AppStyle';
import { authStore } from './Store/LogicAuthStore/authStore';

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
    <MainStack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <MainStack.Screen
        name="studentList"
        component={StudentList}
      />
      <MainStack.Screen
        name="twoFactorAuthorization"
        component={TwoFactorAuthorization}
      />
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
  const [versionName, setVersionName] = useState<string>( '' );
  const [apiVersionName, setApiVersionName] = useState<string>( '' );
  const [loadingVersion, setLoadingVersion] = useState<boolean>( true );
  const [fcmToken, setFcmToken] = useState<string>( '' );
  const [callState, setCallState] = useState<string>( CALL_STATES.IDLE );
  const [currentCallNumber, setCurrentCallNumber] = useState<string>( '' );
  const [permissionsGranted, setPermissionsGranted] = useState<boolean>( false );
  const [callListener, setCallListener] = useState<any>( null );

  const fetchVersionName = async (): Promise<void> =>
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
  };

  const fetchingVersionName = async (): Promise<void> =>
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
    }

    setLoadingVersion( false );
  };

  // Initialize FCM using your notification service
  const initializeFCM = async (): Promise<void> =>
  {
    try
    {
      console.log( 'Initializing FCM...' );

      // Request FCM permissions
      await requestUserPermission();

      // Set up notification listeners
      await NotificationListener();

      console.log( 'FCM initialized successfully' );
    } catch ( error )
    {
      console.error( 'FCM initialization error:', error );
    }
  };

  // Initialize call detection using your custom service
  const initializeCallDetectionService = async (): Promise<any> =>
  {
    try
    {
      console.log( 'Initializing call detection service...' );

      // First request permissions using CallDetectionService
      const hasPermissions = await CallDetectionService.requestPermissions();
      console.log( 'Call detection permissions:', hasPermissions );

      if ( !hasPermissions )
      {
        Alert.alert(
          'Permissions Required',
          'This app requires phone permissions for call detection. Please grant the necessary permissions.',
          [
            { text: 'OK', onPress: () => console.log( 'Permission alert dismissed' ) }
          ]
        );
        setPermissionsGranted( false );
        return null;
      }

    // Start call detection
      const started = await CallDetectionService.startCallDetection();
      console.log( 'Call detection started:', started );

      if ( started )
      {
        setPermissionsGranted( true );

        // Add listener using CallDetectionService
        const listener = CallDetectionService.addListener( ( callData: any ) =>
        {
          console.log( 'Call State Changed in App:', callData );

          if ( callData?.state )
          {
            setCallState( callData.state );
            console.log( 'Call state updated to:', callData.state );
          }

          if ( callData?.phoneNumber )
          {
            setCurrentCallNumber( callData.phoneNumber );
            console.log( 'Phone number updated to:', callData.phoneNumber );
          } else if ( callData?.state === CALL_STATES.IDLE )
          {
            setCurrentCallNumber( '' );
          }

          // Show toast for call state changes
          const stateDescription = getCallStateDescription( callData?.state || CALL_STATES.IDLE );
          if ( ToastAndroid?.show )
          {
            ToastAndroid.show(
              `Call: ${ stateDescription }${ callData?.phoneNumber ? ` - ${ callData.phoneNumber }` : '' }`,
              ToastAndroid.LONG
            );
          }


          switch ( callData?.state )
          {
            case CALL_STATES.RINGING:
              console.log( 'Incoming call detected from:', callData?.phoneNumber );
              if ( callData?.phoneNumber )
              {
                // Fetch student details for incoming call
                fetchingPastEventsData( callData.phoneNumber, 'RINGING' );
              }
              break;

            case CALL_STATES.OFFHOOK:
              console.log( 'Call answered' );
              if ( callData?.phoneNumber )
              {
                // Fetch student details when call is answered
                fetchingPastEventsData( callData.phoneNumber, 'OFFHOOK' );
              }
              break;

            case CALL_STATES.OUTGOING:
              console.log( 'Outgoing call to:', callData?.phoneNumber );
              if ( callData?.phoneNumber )
              {
                // Optionally fetch student details for outgoing calls
                fetchingPastEventsData( callData.phoneNumber, 'OUTGOING' );
              }
              break;

            case CALL_STATES.IDLE:
              console.log( 'Call ended' );
              setCurrentCallNumber( '' );
              // Auto-close modal when call ends
              if ( callStore?.setModalVisible )
              {
                callStore.setModalVisible( false );
              }
              break;

            default:
              console.log( 'Unknown call state:', callData?.state );
              break;
          }
        } );

        setCallListener( listener );
        console.log( 'Call listener added successfully' );
        return listener;
      } else
      {
        console.log( 'Call detection failed to start' );
        setPermissionsGranted( false );
      }
    } catch ( error )
    {
      console.error( 'Call detection initialization error:', error );
      setPermissionsGranted( false );
    }
    return null;
  };

  // Monitor FCM token changes
  useEffect( () =>
  {
    const tokenInterval = setInterval( async () =>
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

    return () => clearInterval( tokenInterval );
  }, [fcmToken] );

  // Initialize versions on mount
  useEffect( () =>
  {
    const initializeVersions = async () =>
    {
      await fetchVersionName();
      await fetchingVersionName();
    };

    initializeVersions();
  }, [] );

  // Main app initialization
  useEffect( () =>
  {
    const initializeApp = async () =>
    {
      try
      {
        console.log( 'Starting app initialization...' );

        // Initialize FCM first
        await initializeFCM();

        // Initialize call detection using CallDetectionService
        await initializeCallDetectionService();

        console.log( 'App initialization completed' );

      } catch ( error )
      {
        console.error( 'Error initializing app:', error );
      }
    };

    initializeApp();


    return () =>
    {
      console.log( 'App cleanup...' );
      if ( callListener )
      {
        CallDetectionService.removeListener( callListener );
      }
      CallDetectionService.stopCallDetection();
    };
  }, [] );

  // Check login status
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
        if ( callStore?.setIsAppLoading )
        {
          callStore.setIsAppLoading( false );
        }
      } catch ( error )
      {
        console.error( 'Error checking login status:', error );
        if ( callStore?.setIsAppLoading )
        {
          callStore.setIsAppLoading( false );
        }
      }
    };

    checkUserLoginStatus();
  }, [] );

  if ( ( callStore?.isAppLoading ) || loadingVersion )
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
        <AuthStack.Navigator
          screenOptions={{
            headerShown: false,
          }}>
          <AuthStack.Screen name="Login" component={LoginScreen} />
        </AuthStack.Navigator>
      )}



      <Modal
        animationType="slide"
        transparent={true}
        visible={callStore.modalVisible}
        onRequestClose={() =>
        {
          callStore.setModalVisible( false );
        }}>
        <View
          style={[
            styles.modalContainer,
            { padding: 10, backgroundColor: 'rgba(0,0,0,.8)' },
          ]}>
          <View
            style={{
              backgroundColor: 'white',
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
              borderBottomRightRadius: 8,
              borderBottomLeftRadius: 8,
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

            <View
              style={{
                padding: 20,
                paddingBottom: 0,
              }}>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                }}>
                <Text
                  style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}>
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
                onPress={() =>
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
                    ToastAndroid.show(
                      'Student name is empty.',
                      ToastAndroid.LONG,
                    );
                  }
                }}>
                <Text
                  style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>
                  View Details
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.closeButton,
                  {
                    width: '48%',
                    alignItems: 'center',
                  },
                ]}
                onPress={() =>
                {
                  callStore.setModalVisible( false );
                }}>
                <Text
                  style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>
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