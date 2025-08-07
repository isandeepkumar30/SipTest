import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';
import BackgroundService from 'react-native-background-actions';
import DeviceInfo from 'react-native-device-info';
const sleep = (time: number): Promise<void> =>
  new Promise(resolve => setTimeout(() => resolve(), time));

import NotesScreen from './components/NotesScreen/notesScreen';
import UpcomingScreen from './components/UpcomingScreen/upcomingScreen';

import React, { useEffect, useState } from 'react';
import { action, runInAction } from 'mobx';
import { observer } from 'mobx-react';
import {
  fetchHomePageData,
  homePageStore,
} from './Store/HomePageStore/storeHomePage';
import { Pressable } from 'react-native';
import { LoginScreen } from './components/LoginScreen/loginFormScreen';
import { StudentList } from './components/HomeScreen/homeScreen';
import { styles } from './AppStyle';
import { authStore } from './Store/LogicAuthStore/authStore';

import {
  NotificationListener,
  requestUserPermission,
} from './utils/NotificationServiceFunction/notificationService';
import { callStore } from './Store/CallLogsStore/callLogsStore';

import {
  ActivityIndicator,
  View,
  Alert,
  Text,
  Modal,
  ToastAndroid,
} from 'react-native';
import { requestPermissions } from './utils/AndroidUserPermissionRequest/userPermissionAccess';
import { TwoFactorAuthorization } from './components/TwoFAuthorizationScreen/twofactorauthorization';
import LogoutButton from './utils/LogoutButton/logoutbutton';
import GetVersionName from './utils/GetVersionComponent/getVersion';

const MainStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

const veryIntensiveTask = async (taskDataArguments?: {
  delay?: number;
}): Promise<void> => {
  const delay = taskDataArguments?.delay ?? 1000;
  while (BackgroundService.isRunning()) {
    await sleep(delay);
  }
};

const options = {
  taskName: 'Example',
  taskTitle: 'Sip Abacus Lms Background',
  taskDesc: '',
  taskIcon: {
    name: 'ic_launcher',
    type: 'mipmap',
  },
  color: '#ff00ff',
  linkingURI: 'yourSchemeHere://chat/jane',
  parameters: {
    delay: 5000,
  },
};

function MainScreens() {
  return (
    <MainStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <MainStack.Screen name="studentList" component={StudentList} />
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

const App = observer(() => {
  const [isBackgroundServiceStarted, setIsBackgroundServiceStarted] =
    useState(false);
  const [versionName, setVersionName] = useState<string>('');
  const [apiVersionName, setApiVersionName] = useState<string>('');
  const [loadingVersion, setLoadingVersion] = useState<boolean>(true);

  const fetchVersionName = async () => {
    const version = await DeviceInfo.getVersion();
    setVersionName(version);
  };

  const fetchingVersionName = async () => {
    setLoadingVersion(true);

    try {
      const apiUrlFromStorage = 'https://sipabacuslms.co.nz/api/';

      if (apiUrlFromStorage) {
        const response = await fetch(apiUrlFromStorage + 'app-lts-version', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const responseData = await response.json();
          setApiVersionName(responseData.lts_version || 'Unknown Version');
        } else {
          const errorMessage = `Error: ${response.status} - ${response.statusText}`;
          ToastAndroid.show(errorMessage, ToastAndroid.LONG);
        }
      }
    } catch (error) {
      ToastAndroid.show(
        'An error occurred while fetching data.',
        ToastAndroid.LONG,
      );
    }

    setLoadingVersion(false);
  };

  useEffect(() => {
    fetchVersionName();
    fetchingVersionName();
  }, []);

  const startBackgroundService = async () => {
    try {
      await BackgroundService.start(veryIntensiveTask, options);
      setIsBackgroundServiceStarted(true);
    } catch (error) {
      console.error('Error starting background service:', error);
      setIsBackgroundServiceStarted(false);
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        requestUserPermission();
        NotificationListener();
        requestPermissions();
        await startBackgroundService();
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initializeApp();

    return () => {
      if (isBackgroundServiceStarted) {
        BackgroundService.stop();
      }
    };
  }, []);

  useEffect(() => {
    const checkUserLoginStatus = async () => {
      try {
        const isLoggedIn = await AsyncStorage.getItem('isUserLoggedIn');
        if (isLoggedIn === 'true') {
          runInAction(() => {
            authStore.isLoggedIn = true;
          });
        }
        callStore.setIsAppLoading(false);
      } catch (error) {
        console.error('Error checking login status:', error);
        callStore.setIsAppLoading(false);
      }
    };

    checkUserLoginStatus();
  }, []);

  if (callStore.isAppLoading || loadingVersion) {
    return <LoaderComponent />;
  }

  const isVersionMismatch = versionName !== apiVersionName;

  return (
    <NavigationContainer>
      {isVersionMismatch ? (
        <GetVersionName
          versionName={versionName}
          apiVersionName={apiVersionName}
        />
      ) : authStore.isLoggedIn ? (
        <MainScreens />
      ) : (
        <AuthStack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <AuthStack.Screen name="Login" component={LoginScreen} />
        </AuthStack.Navigator>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={callStore.modalVisible}
        onRequestClose={() => {
          callStore.setModalVisible(false);
        }}
      >
        <View
          style={[
            styles.modalContainer,
            { padding: 10, backgroundColor: 'rgba(0,0,0,.8)' },
          ]}
        >
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
            }}
          >
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
              }}
            >
              Sip Abacus LMS Caller
            </Text>

            <View
              style={{
                padding: 20,
                paddingBottom: 0,
              }}
            >
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                }}
              >
                <Text
                  style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}
                >
                  Student Name:
                </Text>
                <Text
                  style={{
                    marginLeft: 5,
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: '#b6488d',
                    width: '60%',
                  }}
                >
                  {callStore.studentDetails.studentName}
                </Text>
              </View>
              <View
                style={{
                  marginBottom: 10,
                  display: 'flex',
                  flexDirection: 'row',
                }}
              >
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
                  }}
                >
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
              }}
            >
              <Pressable
                style={[
                  styles.viewDetailsButton,
                  { width: '48%', alignItems: 'center' },
                ]}
                onPress={() => {
                  const { studentName } = callStore.studentDetails;
                  if (studentName) {
                    callStore.setStudentName(studentName);
                    homePageStore.setSearchQuery(studentName);
                    fetchHomePageData();
                    callStore.setModalVisible(false);
                  } else {
                    ToastAndroid.show(
                      'Student name is empty.',
                      ToastAndroid.LONG,
                    );
                  }
                }}
              >
                <Text
                  style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}
                >
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
                onPress={() => {
                  callStore.setModalVisible(false);
                }}
              >
                <Text
                  style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}
                >
                  Close
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </NavigationContainer>
  );
});

export default App;
