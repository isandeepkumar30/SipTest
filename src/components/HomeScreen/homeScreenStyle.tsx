import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create( {
  parentRow: {
    backgroundColor: '#D9EFFF',
    padding: 20,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 10,
    marginBottom: 20,
  },
  saferView: {
    height: '100%',
    backgroundColor: '#fff',
  },
  container: {
    padding: 20,
    // backgroundColor: 'red',
  },
  logoutButton: {
    position: 'absolute',
    bottom: 13,
    right: 10,

  },
  inputStyles: {
    width: '90%',
    height: 55,
    paddingRight: 20,
    fontSize: 18,
    color: '#FFFFFF',
  },
  loader: {
    marginTop: 20,
  },
} );
