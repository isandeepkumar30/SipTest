import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  dropdown: {
    height: 50,
    backgroundColor: 'white',
    borderBottomColor: 'black',
    borderBottomWidth: 0,
    paddingBottom: 10,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    borderBottomRightRadius: 50,
    borderBottomLeftRadius: 50,
    paddingLeft: 10,
    paddingRight: 3,
    marginTop: 12,
    fontSize: 16,
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
    // shadowColor: '#52006A',
    // elevation: 20,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderBottomRightRadius: 40,
    borderBottomLeftRadius: 40,
    borderWidth: 0,
  },
});
