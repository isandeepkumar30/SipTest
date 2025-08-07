import React from 'react';
import { observer } from 'mobx-react';
import Icon from 'react-native-vector-icons/Feather';
import TopBG from '../../Images/TopBg.png';
import { Dropdown } from 'react-native-element-dropdown';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { data } from '../../utils/APIsMenu/ApidropDown';
import { styles } from './loginformStyle';
import { authStore } from '../../Store/LogicAuthStore/authStore';
import { LoginScreenProps } from '../../utils/DataTypeInterface/students_Data_Type';

import
{
  Text,
  TextInput,
  View,
  SafeAreaView,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  ToastAndroid,
  useColorScheme,
  Alert,
} from 'react-native';

export const LoginScreen = observer( ( { navigation }: LoginScreenProps ) =>
{
  const colorScheme = useColorScheme();

  const getTextColor = () =>
  {
    return colorScheme === 'dark' ? '#b6488d' : '#b6488d';
  };

  const getBackgroundColor = () =>
  {
    return colorScheme === 'dark' ? '#FFFFFF' : '#FFFFFF';
  };
  const handleLogin = async () =>
  {
    if ( !authStore.email || !authStore.password || !authStore.selectedItem )
    {
      ToastAndroid.showWithGravity(
        'Please fill all the details ',
        ToastAndroid.LONG,
        ToastAndroid.BOTTOM,
      );
    }
    authStore.setIsLoading( true );
    try
    {
      await authStore.login();

      if ( authStore.isLoggedIn )
      {
        const selectedLocationObject = data.find(
          item => item.value === authStore.selectedItem,
        );

        if ( selectedLocationObject )
        {

          const selectedItemInfo = {
            label: authStore.selectedItem,
            apiUrl: selectedLocationObject.apiUrl,
          };
          await AsyncStorage.setItem(
            'selectedItemInfo',
            JSON.stringify( selectedItemInfo ),
          );

          const token = await AsyncStorage.getItem( 'token' );

          if ( token )
          {
            navigation.navigate( 'studentList' );
          } else
          {
            navigation.navigate( 'twoFactorAuthorization' );
          }
        }
      }
    } catch ( error ) { }
  };

  return (
    <SafeAreaView style={styles.saferView}>
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View style={{ height: '50%' }}>
          <Image source={TopBG} style={styles.topBgImage} />
          <View style={styles.centeredText}>
            <Text style={styles.headingText}>Login</Text>
            <Text style={styles.subheadingText}>Login to your Account</Text>
          </View>
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Icon
                name="mail"
                size={20}
                color="#B6488D"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                placeholderTextColor="black"
                placeholder="Email"
                onChangeText={text => authStore.setEmail( text )}
                value={authStore.email}
              />
            </View>
            <View style={styles.inputContainer}>
              <Icon
                name="key"
                size={20}
                color="#B6488D"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Password"
                placeholderTextColor="black"
                onChangeText={text => authStore.setPassword( text )}
                value={authStore.password}
                secureTextEntry={!authStore.isPasswordVisible}
              />
              <Pressable onPress={authStore.togglePasswordVisibility}>
                <Icon
                  name={authStore.isPasswordVisible ? 'eye' : 'eye-off'}
                  size={20}
                  color="#B6488D"
                />
              </Pressable>
            </View>
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.placeholderStyle}
              itemTextStyle={{
                color: colorScheme === 'dark' ? 'black' : 'black',
              }}
              selectedTextStyle={{
                color: colorScheme === 'dark' ? 'black' : 'black',
              }}
              inputSearchStyle={styles.inputSearchStyle}
              iconStyle={styles.dropdownIcon}
              data={data}
              backgroundColor={'transparent'}
              dropdownPosition={'top'}
              search
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder="Select the Location"
              searchPlaceholder="Search..."
              value={authStore.selectedItem}
              onChange={item => authStore.setSelectedItem( item.value )}
              renderLeftIcon={() => (
                <Icon
                  name="map-pin"
                  size={20}
                  color="#B6488D"
                  style={styles.DropIcon}
                />
              )}
            />
            <Pressable
              onPress={handleLogin}
              style={( { pressed } ) => [
                {
                  backgroundColor: pressed ? 'lightgray' : '#B6488D',
                  borderColor: 'white',
                  borderWidth: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 16,
                  borderTopLeftRadius: 50,
                  borderTopRightRadius: 50,
                  borderBottomRightRadius: 50,
                  borderBottomLeftRadius: 50,
                },
                styles.loginButton,
              ]}>
              {authStore.isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Icon
                    name="log-in"
                    size={20}
                    color="white"
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.loginButtonText}>Login Now</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} );
