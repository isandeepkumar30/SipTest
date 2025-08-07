import React, { useCallback, useEffect, useState } from 'react';
import Icon from 'react-native-vector-icons/FontAwesome';
import { observer } from 'mobx-react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NoDataFound from '../../Images/No.png';
import { styles } from './homeScreenStyle';
import { fetchHomePageData, homePageStore } from '../../Store/HomePageStore/storeHomePage';
import { StudentListComponent } from './StudentList/studentList';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { action, runInAction } from 'mobx';
import { authStore } from '../../Store/LogicAuthStore/authStore';

import
{
  View,
  SafeAreaView,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  ToastAndroid,
  Image,
  Text,
  useColorScheme,
  RefreshControl,
  Alert,
  BackHandler,
} from 'react-native';
import { AppState } from 'react-native';


export const StudentList = observer( () =>
{
  
  const colorScheme = useColorScheme();
  const [appState, setAppState] = useState( AppState.currentState );

  useEffect( () =>
  {
    const handleAppStateChange = async ( nextAppState: any ) =>
    {
      if ( appState.match( /active/ ) && nextAppState === 'background' )
      {
        try
        {
          await AsyncStorage.removeItem( 'lastSearchQuery' );
          homePageStore.setSearchQuery( '' );
          console.log( 'Cleared lastSearchQuery as app moved to background' );
        } catch ( error )
        {
          console.error( 'Error clearing lastSearchQuery:', error );
        }
      }
      setAppState( nextAppState );
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    return () =>
    {
      subscription.remove();
    };
  }, [appState] );

  useFocusEffect(
    useCallback( () =>
    {
      const loadSearchQuery = async () =>
      {
        const savedQuery = await AsyncStorage.getItem( 'lastSearchQuery' );
        if ( savedQuery )
        {
          homePageStore.setSearchQuery( savedQuery );
          fetchHomePageData();
        }
      };

      loadSearchQuery();
    }, [] )
  );



  useEffect( () =>
  {
    const backAction = () =>
    {
      Alert.alert( 'Hold on!', 'Are you sure you want to exit from the application! ', [
        {
          text: 'Cancel',
          onPress: () => null,
          style: 'cancel',
        },
        { text: 'YES', onPress: () => BackHandler.exitApp() },
      ] );
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [] );

  const getTextColor = () =>
  {
    return colorScheme === 'dark' ? '#b6488d' : '#b6488d';
  };

  const getBackgroundColor = () =>
  {
    return colorScheme === 'dark' ? '#FFFFFF' : '#FFFFFF';
  };

  const [searchInitiated, setSearchInitiated] = useState( false );

  const onRefresh = React.useCallback( () =>
  {
    if ( homePageStore.searchQuery.trim() === '' )
    {
      ToastAndroid.show( 'Please write student name in the search bar', ToastAndroid.LONG );
      homePageStore.setRefreshing( false );
      return;
    }

    homePageStore.setRefreshing( true );
    fetchHomePageData();

    setTimeout( () =>
    {
      homePageStore.setRefreshing( false );
    }, 2000 );
  }, [] );

  const handleSearch = () =>
  {
    if ( homePageStore.searchQuery === '' )
    {
      ToastAndroid.show( 'Enter student name to search', ToastAndroid.LONG );
    } else
    {
      fetchHomePageData();
    }
  };

  const handleInputSubmit = () =>
  {
    handleSearch();
  };

  useFocusEffect(
    useCallback( () =>
    {
      homePageStore.setSearchQuery( '' );
    }, [] )
  );

  const handleInputChange = ( text: string ) =>
  {
    homePageStore.setSearchQuery( text );
    homePageStore.setStudentData( [] );
    setSearchInitiated( false );
  };
  const handleLogout = action( async () =>
  {
    try
    {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Yes',
            onPress: async () =>
            {
              try
              {
                await AsyncStorage.removeItem( 'token' );
                await AsyncStorage.removeItem( 'isUserLoggedIn' );

                runInAction( () =>
                {
                  authStore.isLoggedIn = false;
                  homePageStore.setSearchQuery( '' );
                  homePageStore.setStudentData( [] );
                } );
              } catch ( error )
              {
                console.error( 'Error during logout:', error );
              }
            },
          },
        ],
        { cancelable: false },
      );
    } catch ( error )
    {
      console.error( 'Error showing logout alert:', error );
    }
  } );

  return (
    <SafeAreaView
      style={[styles.saferView, { backgroundColor: getBackgroundColor() }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            refreshing={homePageStore.refreshing}
            onRefresh={onRefresh}
            colors={['#B6488D']}
            tintColor="#B6488D"
            title="Pull to refresh"
            titleColor="#B6488D"
          />
        }>
        <View
          style={{
            paddingLeft: 20,
            paddingRight: 20,
            paddingBottom: 20,
            paddingTop: 20,
            backgroundColor: '#b6488d',
          }}>
          <View>
            <View>
              <Text
                style={{
                  fontSize: 22,
                  color: '#fff',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  marginBottom: 10,
                }}>
                Search Student List
              </Text>
            </View>
            <View>
              <Pressable style={styles.logoutButton} onPress={handleLogout}>
                <Icon name="power-off" size={22} color="white" />
              </Pressable>
            </View>
          </View>
          <View
            style={{
              width: '100%',
              backgroundColor: '#fff',
              display: 'flex',
              paddingRight: 15,
              paddingLeft: 15,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'space-between',
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              borderBottomLeftRadius: 0,
              position: 'relative',
            }}>
            <TextInput
              placeholder="Enter student name to search"
              style={[styles.inputStyles, { color: getTextColor() }]}
              onChangeText={handleInputChange}
              value={homePageStore.searchQuery}
              onSubmitEditing={handleInputSubmit}
              placeholderTextColor={getTextColor()}


            />
            <Pressable
              onPress={handleSearch}
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                height: 55,
                width: 55,
                backgroundColor: '#0a9856',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
                borderBottomLeftRadius: 0,
              }}>
              <Icon name="search" size={25} style={{ color: '#fff' }} />
            </Pressable>
          </View>
        </View>
        {homePageStore.isLoading ? (
          <ActivityIndicator
            size="large"
            color="#B6488D"
            style={styles.loader}
          />
        ) : (
          <View
            style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
            {homePageStore.searchQuery.trim() === '' ? (
              <Text
                style={{
                  textAlign: 'center',
                  fontSize: 28,
                  paddingHorizontal: 50,
                  paddingVertical: 260,
                  fontWeight: '500',
                  color: getTextColor(),
                }}>
                Enter student name to search
              </Text>
            ) : searchInitiated && homePageStore.studentData.length == 0 ? (
              <Image
                source={NoDataFound}
                style={{
                  width: '100%',
                  height: 305,
                  alignSelf: 'center',
                  marginTop: 80,
                }}
              />
            ) : (
              <StudentListComponent
                studentdataList={homePageStore.studentData}
              />
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
} );
