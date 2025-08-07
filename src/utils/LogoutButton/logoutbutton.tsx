import React from 'react';
import { Pressable, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { action, runInAction } from 'mobx';
import { authStore } from '../../Store/LogicAuthStore/authStore';
import { homePageStore } from '../../Store/HomePageStore/storeHomePage';
import { styles } from './logoutbuttonStyle';

const LogoutButton = () =>
{
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
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Icon name="power-off" size={22} color="white" />
        </Pressable>
    );
};



export default LogoutButton;
