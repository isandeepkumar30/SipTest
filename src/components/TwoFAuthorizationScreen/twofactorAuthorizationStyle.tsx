import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create( {
    saferView: {
        flex: 1,
        backgroundColor: '#B6488D',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        maxHeight: '100%',
    },

    topBgImage: {
        width: '100%',
        maxHeight: '100%',
        marginBottom: 10,
    },

    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
        padding: 10,
        fontFamily: 'Poppins-Regular',
    },
    centeredText: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonIcon: {
        marginRight: 10,
    },
    loginButtonText: {
        color: 'white',
        textAlign: 'center',
    },
    loginButton: {
        padding: 16,
        borderRadius: 10,
        marginTop: 20,
        backgroundColor: '#B6488D',
        justifyContent: 'center',
        alignItems: 'center',
    },
    textflow: {
        flexDirection: 'row',
        alignItems: 'center',
        display: 'flex',
        alignSelf: 'center',
        marginTop: 10,
    },
    serCodeText: {
        fontSize: 20,
        color: 'white',
        marginRight: 10,
        fontFamily: 'Poppins-Regular',
        fontWeight: 'bold',
        textAlign: 'center',

    },
    iconStyle: {
        padding: 5,
    },
    headingText: {
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 23,
        color: '#fff',
    },

    subheadingText: {
        marginTop: 5,
        marginBottom: 20,
        textAlign: 'center',
        fontSize: 18,
        color: '#fff',
    },

    otpContainer: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },

    pressableButtonText: {
        color: 'white',
        fontSize: 16,
    },


    otpCodeText: {
        fontSize: 18,
        marginVertical: 20,
        textAlign: 'center',
        color: 'white',
    },

    qrCodeText: {
        fontSize: 18,

        textAlign: 'center',
        color: 'white',
    },


    errorText: {
        fontSize: 16,
        color: 'red',
        textAlign: 'center',
        marginTop: 10,
    },
    svgContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 20,
    },
} );