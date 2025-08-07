import AsyncStorage from '@react-native-async-storage/async-storage';
import { action, makeObservable, observable } from 'mobx';
import { ToastAndroid } from 'react-native';

class CallStore
{
  isAppLoading: boolean = false;
  modalVisible = false;
  studentDetails = {
    studentName: '',
    parentName: '',
  };

  constructor()
  {
    makeObservable( this, {
      isAppLoading: observable,
      modalVisible: observable,
      studentDetails: observable,
      setIsAppLoading: action.bound,
      setModalVisible: action.bound,
      setStudentDetails: action.bound,
      setStudentName: action.bound,
    } );
  }
  setIsAppLoading ( isAppLoading: boolean )
  {
    this.isAppLoading = isAppLoading;
  }
  setModalVisible ( value: any )
  {
    this.modalVisible = value;
  }

  setStudentDetails ( details: any )
  {
    this.studentDetails = details;
  }
  setStudentName ( studentName: string )
  {
    this.studentDetails.studentName = studentName;
  }
}

export const callStore = new CallStore();

export const fetchingPastEventsData = async ( number: string, event: string ) =>
{
  try
  {
    const apiUrlFromStorage = await AsyncStorage.getItem( 'selectedItemInfo' );
    if ( apiUrlFromStorage )
    {
      const apiUrl = JSON.parse( apiUrlFromStorage ).apiUrl;
      const requestBody = {
        phone_number: number,
        event: event,
      };

      const token = await AsyncStorage.getItem( 'token' );

      const response = await fetch(
        apiUrl + 'get-student-search-list-by-phone',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${ token }`,
          },
          body: JSON.stringify( requestBody ),
        },
      );
      console.log( response, 'Api Response Call' );

      if ( response.ok )
      {
        const responseData = await response.json();
        const studentName = responseData.student_names;
        const parentName = responseData.parent_name;

        if ( studentName && parentName )
        {
          callStore.setStudentDetails( { studentName, parentName } );
          callStore.setModalVisible( true );
        } else
        {
        }
      } else
      {
      }
    }
  } catch ( error )
  {
    console.error( 'Error fetching data:', error );
    ToastAndroid.show(
      'An error occurred while fetching data.',
      ToastAndroid.LONG,
    );
  }
};