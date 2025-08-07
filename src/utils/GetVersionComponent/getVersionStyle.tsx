import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get( 'window' );

export const styles = StyleSheet.create( {
    topBgImage: {
        width: width * 0.8,
        height: width * 0.5,
        resizeMode: 'contain',
        marginBottom: 20,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    iconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 10,
    },
    text: {
        fontSize: 18,
        color: '#555',
        fontWeight: 'bold',
        fontFamily: 'Roboto',
        marginTop: 15,
        textAlign: 'center',
    },
    versionName: {
        color: '#FF4500',
        fontWeight: 'bold',
    },
    apiVersionName: {
        color: '#1E90FF',
        fontWeight: 'bold',
    },
} );
