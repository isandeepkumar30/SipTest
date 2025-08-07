import React, { useCallback, useEffect, useState } from 'react';
import { Text, View, SafeAreaView, ScrollView, Image, Pressable, ActivityIndicator, ToastAndroid, Dimensions, BackHandler, TouchableOpacity } from 'react-native';
import { observer } from 'mobx-react';
import { OtpInput } from 'react-native-otp-entry';
import { SvgUri } from 'react-native-svg';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { styles } from './twofactorAuthorizationStyle';
import TopBG from '../../Images/TopBg.png';
import { authStore } from '../../Store/LogicAuthStore/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { runInAction } from 'mobx';
import Icon from 'react-native-vector-icons/Feather';
import Icons from 'react-native-vector-icons/FontAwesome';
import Clipboard from '@react-native-clipboard/clipboard';
import { Alert } from 'react-native';
interface ResponseData
{
    is_2fa_enable: boolean;
    is_2fa_register: boolean;
    is_otp: boolean;
    qr_url: string;
    secret: string;
}

export const TwoFactorAuthorization = observer( () =>
{
    const navigation = useNavigation();
    const { responseData } = authStore;
    const { is_2fa_enable, is_2fa_register, is_otp, qr_url, secret } = responseData as unknown as ResponseData;

    const [oneTimePassword, setOneTimePassword] = useState( '' );
    const [loading, setLoading] = useState( false );

    useEffect( () =>
    {
        const backAction = () =>
        {
            Alert.alert( 'Hold on!', 'Are you sure you want to go exit from the app?', [
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

    const copyToClipboard = () =>
    {
        Clipboard.setString( secret );
        ToastAndroid.show( 'code has been copied to the clipboard!', ToastAndroid.SHORT );
    };

    const handleOtpSubmit = async () =>
    {
        setLoading( true );
        try
        {
            if ( is_otp )
            {
                const response = await authStore.send2FAData( oneTimePassword, 'otp' );

                console.log( response, 'response of 2FA' );

                if ( response.status === 'Success' )
                {

                    await AsyncStorage.setItem( 'token', response.token );

                    const tokenKing = await AsyncStorage.getItem( 'token' );
                    console.log( tokenKing, 'TokenKing' );


                    await AsyncStorage.setItem( 'isUserLoggedIn', 'true' );


                    runInAction( () =>
                    {
                        authStore.isLoggedIn = true;
                    } );

                    ToastAndroid.show( 'Logged in successfully.', ToastAndroid.SHORT );
                    navigation.navigate( 'studentList' );
                } else
                {
                    ToastAndroid.show(
                        'Failed to log in. Please check your OTP and try again.',
                        ToastAndroid.SHORT
                    );
                }
            } else if ( !is_2fa_register )
            {
                await authStore.send2FAData( '', 'register' );
            }
        } catch ( error )
        {
            ToastAndroid.show( error.message, ToastAndroid.SHORT );
        } finally
        {
            // Reset loading state
            setLoading( false );
        }
    };

    const handleDonePress = async () =>
    {
        setLoading( true );
        try
        {
            const response = await authStore.send2FAData( '', 'register' );
            if ( response && response.status === 'Success' )
            {
                navigation.navigate( 'twoFactorAuthorization' );
                ToastAndroid.show( '2FA registration successful.', ToastAndroid.SHORT );
            } else
            {
                ToastAndroid.show( 'Registration failed. Please try again.', ToastAndroid.SHORT );
            }
        } catch ( error: any )
        {

            ToastAndroid.show( 'An error occurred while registering 2FA: ' + error.message, ToastAndroid.SHORT );
        } finally
        {
            setLoading( false );
        }
    };

    const renderContent = () =>
    {
        const { width } = Dimensions.get( 'window' );
        const qrSize = width * 0.6;

        if ( is_2fa_enable )
        {
            if ( !is_2fa_register )
            {
                return (
                    <View>
                        <Text style={styles.qrCodeText}>
                            Set up your two-factor authentication by scanning the barcode below. Alternatively, you can use the code
                        </Text>
                        <View style={styles.container}>
                            <Text style={styles.serCodeText}>{secret}</Text>

                            <TouchableOpacity onPress={copyToClipboard}>
                                <Icon
                                    name="copy"
                                    size={20}
                                    color="white"
                                    style={styles.iconStyle}
                                />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.svgContainer}>
                            <SvgUri width={qrSize} height={qrSize} uri={qr_url} />
                        </View>

                        <Pressable
                            onPress={handleDonePress}
                            style={( { pressed } ) => [
                                {
                                    backgroundColor: pressed ? 'lightgray' : '#B6488D',
                                    borderColor: 'white',
                                    borderWidth: 1,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 18,
                                    borderTopLeftRadius: 50,
                                    borderTopRightRadius: 50,
                                    borderBottomRightRadius: 50,
                                    borderBottomLeftRadius: 50,
                                },
                                styles.loginButton,
                            ]}>
                            {loading ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <>
                                    <Icons
                                        name="thumbs-up"
                                        size={20}
                                        color="white"
                                        style={styles.buttonIcon}
                                    />
                                    <Text style={styles.loginButtonText}>Done</Text>
                                </>
                            )}
                        </Pressable>


                    </View>
                );
            } else if ( !is_otp )
            {
                return <Text style={styles.errorText}>Error: OTP not available.</Text>;
            } else
            {
                return (
                    <View style={styles.otpContainer}>
                        <Text style={styles.otpCodeText}>Please Enter the OTP</Text>
                        <OtpInput
                            numberOfDigits={6}
                            focusColor="green"
                            focusStickBlinkingDuration={500}
                            onTextChange={setOneTimePassword}
                            textInputProps={{
                                accessibilityLabel: 'One-Time Password',
                                editable: !loading,
                            }}
                        />


                        <Pressable
                            onPress={handleOtpSubmit}
                            style={( { pressed } ) => [
                                {
                                    backgroundColor: pressed ? 'lightgray' : '#B6488D',
                                    borderColor: 'white',
                                    borderWidth: 1,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 18,
                                    borderTopLeftRadius: 50,
                                    borderTopRightRadius: 50,
                                    borderBottomRightRadius: 50,
                                    borderBottomLeftRadius: 50,
                                },
                                styles.loginButton,
                            ]}>
                            {loading ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <>
                                    <Icon
                                        name="lock"
                                        size={20}
                                        color="white"
                                        style={styles.buttonIcon}
                                    />
                                    <Text style={styles.loginButtonText}>Submit OTP</Text>
                                </>
                            )}
                        </Pressable>

                    </View>
                );
            }
        }
        return null;
    };

    return (
        <SafeAreaView style={styles.saferView}>
            <View style={styles.textflow}>
                <Text style={styles.title}>Two-factor Authentication </Text>
            </View>
            <ScrollView contentInsetAdjustmentBehavior="automatic">
                <View style={{ height: '50%' }}>
                    <Image source={TopBG} style={styles.topBgImage} />
                    <View style={styles.centeredText}></View>
                    {renderContent()}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
} );
