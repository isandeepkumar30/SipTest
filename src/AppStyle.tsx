import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create( {
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    border: '1px solid black',
    height: 40,
    padding: 35,
    shadowColor: 'black',
    shadowOpacity: 0.8,
    shadowRadius: 2,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 10,
    elevation: 5,
    shadowOffset: {
      height: 1,
      width: 0,
    },
    marginBottom: 0,
    marginTop: 0,
  },
  viewDetailsButton: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#2196F3',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
    borderBottomLeftRadius: 5,
  },
  closeButton: {
    padding: 10,
    backgroundColor: 'gray',

    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
    borderBottomLeftRadius: 5,
    fontSize: 16,
    fontWeight: 'bold',
  },
} );
