import {StyleSheet} from 'react-native';

export const styles = (colorScheme: any) =>
  StyleSheet.create({
    notessafeAreaView: {
      flex: 1,
      // backgroundColor: '#fff',
    },
    header: {
      backgroundColor: '#b6488d',
      justifyContent: 'center',
      alignItems: 'center',
    },
    nameHeading: {
      fontWeight: '900',
      color: '#fff',
      fontSize: 30,
    },
    parentRow: {
      padding: 25,
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
      borderBottomRightRadius: 10,
      borderBottomLeftRadius: 10,
      marginBottom: 20,
    },
    buttonContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    button: {
      flex: 1,
      padding: 8,
      borderTopLeftRadius: 5,
      borderTopRightRadius: 5,
      borderBottomRightRadius: 5,
      borderBottomLeftRadius: 5,
      margin: 5,
    },
    buttonText: {
      color: 'white',
      fontSize: 16,
      textAlign: 'center',
    },
    EnrolledDate: {
      color: '#fff',
      paddingBottom: 20,
    },
    topBar: {
      paddingLeft: 20,
      paddingRight: 20,
      paddingBottom: 20,
      position: 'relative',
      backgroundColor: '#b6488d',
    },
  });
