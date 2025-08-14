import AsyncStorage from '@react-native-async-storage/async-storage';
import { action, makeObservable, observable } from 'mobx';
import { ToastAndroid } from 'react-native';
import CallDetectionService from '../../services/CallDetectionService';

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

// Notification management to prevent duplicates
class NotificationManager
{
  constructor()
  {
    this.lastNotification = null;
    this.notificationTimeout = null;
    this.apiCallsInProgress = new Set();
    this.lastCallData = null;
  }

  // Check if we should show notification for this call
  shouldShowNotification ( number, event )
  {
    const currentCallKey = `${ number }-${ event }`;

    // Don't show if API call is already in progress for this number-event combination
    if ( this.apiCallsInProgress.has( currentCallKey ) )
    {
      console.log( 'API call already in progress for:', currentCallKey );
      return false;
    }

    // Check if this is the same call as the last one (within 2 seconds)
    if ( this.lastNotification )
    {
      const timeDiff = Date.now() - this.lastNotification.timestamp;
      const isSameCall = this.lastNotification.number === number &&
        this.lastNotification.event === event;

      if ( isSameCall && timeDiff < 2000 )
      { // 2 second debounce
        console.log( 'Skipping duplicate notification for same call within 2 seconds' );
        return false;
      }
    }

    return true;
  }

  // Mark API call as in progress
  markApiInProgress ( number, event )
  {
    const callKey = `${ number }-${ event }`;
    this.apiCallsInProgress.add( callKey );
    console.log( 'Marked API in progress:', callKey );
  }

  // Mark API call as completed
  markApiCompleted ( number, event )
  {
    const callKey = `${ number }-${ event }`;
    this.apiCallsInProgress.delete( callKey );
    console.log( 'Marked API completed:', callKey );
  }

  // Record that we showed a notification
  recordNotification ( number, event )
  {
    this.lastNotification = {
      number,
      event,
      timestamp: Date.now()
    };

    // Clear the record after 5 seconds to allow new calls
    if ( this.notificationTimeout )
    {
      clearTimeout( this.notificationTimeout );
    }

    this.notificationTimeout = setTimeout( () =>
    {
      this.lastNotification = null;
    }, 5000 );
  }

  // Show notification with student info
  showNotification ( event, number, studentName, parentName )
  {
    // Only show if we have meaningful student data OR if this is a fallback
    const hasStudentData = studentName && parentName;

    if ( hasStudentData )
    {
      console.log( 'Showing notification WITH student data:', { studentName, parentName } );
      CallDetectionService.showNotificationWithStudentInfo(
        event,
        number,
        studentName,
        parentName
      );
      this.recordNotification( number, event );
    } else
    {
      // Only show fallback notification for RINGING and OUTGOING (not OFFHOOK)
      if ( event === 'RINGING' || event === 'OUTGOING' )
      {
        console.log( 'Showing fallback notification without student data' );
        CallDetectionService.showNotificationWithStudentInfo(
          event,
          number,
          null,
          null
        );
        this.recordNotification( number, event );
      } else
      {
        console.log( 'Skipping notification for OFFHOOK without student data' );
      }
    }
  }
}

// Create singleton instance
const notificationManager = new NotificationManager();

export const fetchingPastEventsData = async ( number: string, event: string ) =>
{
  console.log( '=== START fetchingPastEventsData ===' );
  console.log( 'Input parameters:', { number, event, timestamp: new Date().toISOString() } );

  // Check if we should proceed with this call
  if ( !notificationManager.shouldShowNotification( number, event ) )
  {
    console.log( 'Skipping fetchingPastEventsData - duplicate or in progress' );
    return;
  }

  // Mark this API call as in progress
  notificationManager.markApiInProgress( number, event );

  try
  {
    console.log( 'Step 1: Getting API URL from storage...' );
    const apiUrlFromStorage = await AsyncStorage.getItem( 'selectedItemInfo' );

    if ( !apiUrlFromStorage )
    {
      console.log( 'ERROR: No selectedItemInfo found in AsyncStorage' );
      notificationManager.markApiCompleted( number, event );
      notificationManager.showNotification( event, number, null, null );
      return;
    }

    let apiUrl;
    try
    {
      const parsedInfo = JSON.parse( apiUrlFromStorage );
      apiUrl = parsedInfo.apiUrl;
      console.log( 'Parsed API URL:', apiUrl );
    } catch ( parseError )
    {
      console.error( 'Error parsing selectedItemInfo:', parseError );
      notificationManager.markApiCompleted( number, event );
      notificationManager.showNotification( event, number, null, null );
      return;
    }

    if ( !apiUrl )
    {
      console.log( 'ERROR: No apiUrl found in parsed data' );
      notificationManager.markApiCompleted( number, event );
      notificationManager.showNotification( event, number, null, null );
      return;
    }

    console.log( 'Step 2: Getting token from storage...' );
    const token = await AsyncStorage.getItem( 'token' );

    if ( !token )
    {
      console.log( 'ERROR: No token found in AsyncStorage' );
      notificationManager.markApiCompleted( number, event );
      notificationManager.showNotification( event, number, null, null );
      return;
    }

    const requestBody = {
      phone_number: number,
      event: event,
    };

    const fullUrl = apiUrl + 'get-student-search-list-by-phone';
    console.log( 'Making API call to:', fullUrl );

    const response = await fetch( fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ token }`,
      },
      body: JSON.stringify( requestBody ),
    } );

    console.log( 'Response status:', response.status );

    if ( response.ok )
    {
      const responseData = await response.json();
      console.log( 'API Response received:', JSON.stringify( responseData, null, 2 ) );

      const studentName = responseData.student_names;
      const parentName = responseData.parent_name;

      console.log( 'Extracted values:', { studentName, parentName } );

      // Mark API as completed first
      notificationManager.markApiCompleted( number, event );

      if ( studentName && parentName )
      {
        console.log( 'SUCCESS: Found student and parent data' );
        callStore.setStudentDetails( { studentName, parentName } );
        callStore.setModalVisible( true );

        // Show notification with student info
        notificationManager.showNotification( event, number, studentName, parentName );
      }
      else if ( studentName ) 
      {
        console.log( 'PARTIAL: Found student name only' );
        callStore.setStudentDetails( { studentName, parentName: 'Unknown' } );
        callStore.setModalVisible( true );

        // Show notification with student name only
        notificationManager.showNotification( event, number, studentName, null );
      }
      else
      {
        console.log( 'NO DATA: No student details found' );
        // Only show fallback for important events
        notificationManager.showNotification( event, number, null, null );
      }
    }
    else
    {
      console.log( 'API call failed with status:', response.status );
      notificationManager.markApiCompleted( number, event );
      notificationManager.showNotification( event, number, null, null );
    }
  }
  catch ( error )
  {
    console.error( 'API call error:', error.message );
    notificationManager.markApiCompleted( number, event );

    ToastAndroid.show(
      'An error occurred while fetching data.',
      ToastAndroid.LONG,
    );

    notificationManager.showNotification( event, number, null, null );
  }

  console.log( '=== END fetchingPastEventsData ===' );
};