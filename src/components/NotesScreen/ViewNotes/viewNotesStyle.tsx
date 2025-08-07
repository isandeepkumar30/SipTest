import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create( {
  container: {
    width: '100%',
    height: '100%',
    flex: 1,
    padding: 16,
    paddingHorizontal: 0,
  },

  eventRow: {
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'row',
    flexGrow: 1,
    backgroundColor: '#D9EFFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderBottomRightRadius: 25,
    borderBottomLeftRadius: 25,
    position: 'relative',
    marginBottom: 15,
  },
  eventLeft: {
    borderTopLeftRadius: 25,
    borderBottomLeftRadius: 25,
    justifyContent: 'center',
  },
  eventRight: {
    width: '84%',
    paddingLeft: 0,
    paddingBottom: 30,
    paddingRight: 25,
  },
  iconStyle: {
    width: 40,
    paddingLeft: 12,
    justifyContent: 'center',
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },

  adminOnlyView: {
    backgroundColor: 'blue',
    padding: 5,
    borderRadius: 5,
    marginBottom: 20,
    width: '28%',
  },

  RaiseFlagView: {
    backgroundColor: 'lightgreen',
    marginTop: 10,
    borderRadius: 5,
    marginBottom: 10,
    width: '100%',
  },

  UnSetRaiseFlagView: {
    backgroundColor: '#f09e2b',
    marginTop: 5,
    borderRadius: 5,
    width: '100%',
  },

  deletedFlagView: {

    marginTop: 5,
    borderRadius: 5,
    width: '100%',
  },

  RaiseFlagText: {
    backgroundColor: '#6cf0bd',
    color: 'black',
    fontSize: 12,
    marginBottom: 2,
    fontWeight: '600',
    padding: 5,
  },

  deleteFlagText: {
    backgroundColor: '#e8d089',
    color: 'black',
    fontSize: 12,
    marginBottom: 2,
    fontWeight: '600',
    padding: 5,
  },


  DeleteReasonFlagText: {
    backgroundColor: '#e88f89',
    color: 'black',
    fontSize: 12,
    marginBottom: 2,
    fontWeight: '600',
    padding: 5,
  },

  adminOnlyText: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 2,
    fontWeight: '600',
  },

  eventLeftHeading: {
    color: '#B6488D',
    fontSize: 20,
    marginBottom: 2,
    fontWeight: '600',
    paddingTop: 0,
  },
  eventSubDetail: {
    color: '#262B35',
    fontSize: 16,
    lineHeight: 20,
    overflow: 'hidden',
  },
  viewMoreButton: {
    marginTop: 8,
    paddingTop: 5,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
    borderBottomLeftRadius: 5,
  },
  viewMoreButtonText: {
    color: '#B6488D',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: 'white',

  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputBox: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#B6488D',
    borderRadius: 8,
    marginVertical: 10,
    paddingHorizontal: 10,
    color: 'black',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#057FE1',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  buttonSave: {
    backgroundColor: '#B6488D',

    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
} );
