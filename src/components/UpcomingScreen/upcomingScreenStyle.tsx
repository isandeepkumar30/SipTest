import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  upcomingsafeAreaView: {
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
    padding: 20,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 10,
    marginBottom: 20,
  },
  userImage: {
    width: 86,
    height: 86,

    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    borderBottomRightRadius: 60,
    borderBottomLeftRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#fff',
    borderWidth: 5,
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
  topBar: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 20,
    position: 'relative',
    backgroundColor: '#b6488d',
  },
  image: {
    flex: 1,
    justifyContent: 'center',
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    width: '100%',
    zIndex: 10,
  },
  NameHeading: {
    fontWeight: '900',
    color: '#fff',
    fontSize: 30,
  },
  EnrolledDate: {
    color: '#fff',
  },
  headerImage: {
    width: '100%',
    display: 'flex',
    paddingRight: 0,
    paddingLeft: 0,
    flexDirection: 'row',
  },
});
