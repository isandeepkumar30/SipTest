import React from 'react';
import { View, Text, Image, useColorScheme } from 'react-native';
import TopBG from '../../Images/sipabacus.png';
import { styles } from './getVersionStyle';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface GetVersionNameProps
{
    versionName: string;
    apiVersionName: string;
}

const GetVersionName: React.FC<GetVersionNameProps> = ( { versionName, apiVersionName } ) =>
{
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';


    const containerStyle = {
        ...styles.container,
        backgroundColor: isDarkMode ? '#000' : '#fff',
    };

    const textStyle = {
        ...styles.text,
        color: isDarkMode ? '#ccc' : '#555',
    };

    const titleStyle = {
        ...styles.title,
        color: isDarkMode ? '#fff' : '#333',
    };

    return (
        <View style={containerStyle}>
            <Image source={TopBG} style={styles.topBgImage} />

            <View style={styles.iconContainer}>
                <Icon name="warning" size={30} color={isDarkMode ? '#FF6347' : '#FF6347'} />
                <Text style={titleStyle}>Version Update Required</Text>
            </View>
            {apiVersionName == '' ? <Text style={styles.versionName}>Please check your internet Connection</Text> : <Text style={textStyle}>
                Currently detected: <Text style={styles.versionName}>({versionName})</Text>.
                version is older than the server version <Text style={styles.apiVersionName}>({apiVersionName})</Text>.
                Please update to the latest version.
            </Text>}
        </View>
    );
};

export default GetVersionName;
