import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create( {
  saferView: {
    height: '100%',
    backgroundColor: '#B6488D',
  },
  topBgImage: {
    width: '100%',
    maxHeight: '100%',
    marginBottom: 10,
  },
  centeredText: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
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
  formContainer: {
    paddingLeft: 60,
    paddingRight: 60,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  inputIcon: {
    marginRight: 10,
    marginLeft: 5,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  dropdown: {
    height: 50,
    backgroundColor: '#fff',
    borderBottomColor: 'black',
    borderBottomWidth: 0.5,
    marginBottom: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
    marginTop: 12,
    fontSize: 16,
    color: 'red',
    getTextColor: 'red',
  },
  dropdownIcon: {
    width: 20,
    height: 20,
    marginRight: 20,
  },
  placeholderStyle: {
    fontSize: 15,
    marginLeft: 6,
    color: 'black',
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  inputSearchStyle: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
  },
  loginButton: {
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
  },
  buttonIcon: {
    marginRight: 10,
  },
  loginButtonText: {
    color: 'white',
    textAlign: 'center',
  },

  DropIcon: {
    marginRight: 10,
    marginLeft: 15,
  },
} );
