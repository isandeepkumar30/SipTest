import AsyncStorage from '@react-native-async-storage/async-storage';
import { action, makeObservable, observable } from 'mobx';
import { ToastAndroid } from 'react-native';
import CallDetectionService from '../../services/CallDetectionService';
import { clearObserving } from 'mobx/dist/internal';

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

// Enhanced NotificationManager with phone-based notification management
class NotificationManager
{
  constructor()
  {
    // Track call data per phone number to prevent duplicates and manage state properly
    this.callHistory = new Map(); // phoneNumber -> { lastEvent, lastTimestamp, apiInProgress }
    this.notificationTimeout = null;
  }

  // Check if we should process this call event
  shouldProcessCall ( phoneNumber, event )
  {
    const normalizedNumber = this.normalizePhoneNumber( phoneNumber );
    const currentTime = Date.now();

    // Get existing call data for this number
    const existingCall = this.callHistory.get( normalizedNumber );

    if ( !existingCall )
    {
      // First call from this number - always process
      return true;
    }

    // Check if API call is already in progress for this number
    if ( existingCall.apiInProgress )
    {
      return false;
    }

    const timeDiff = currentTime - existingCall.lastTimestamp;
    const isSameEvent = existingCall.lastEvent === event;

    // Skip if same event within 2 seconds (debounce rapid duplicates)
    if ( isSameEvent && timeDiff < 2000 )
    {
      return false;
    }

    // For different events, allow processing but with shorter debounce for rapid state changes
    if ( !isSameEvent && timeDiff < 500 )
    {
      return false;
    }

    return true;
  }

  // Normalize phone number for consistent tracking
  normalizePhoneNumber ( phoneNumber: any )
  {
    if ( !phoneNumber || phoneNumber === '' )
    {
      return 'Unknown';
    }

    // Remove common formatting characters
    return phoneNumber.replace( /[\s\-\(\)\.]/g, '' );
  }

  // Mark API call as in progress for this phone number
  markApiInProgress ( phoneNumber: any, event: any )
  {
    const normalizedNumber = this.normalizePhoneNumber( phoneNumber );
    const currentTime = Date.now();

    this.callHistory.set( normalizedNumber, {
      lastEvent: event,
      lastTimestamp: currentTime,
      apiInProgress: true
    } );
  }

  // Mark API call as completed for this phone number
  markApiCompleted ( phoneNumber: any, event: any )
  {
    const normalizedNumber = this.normalizePhoneNumber( phoneNumber );
    const existingCall = this.callHistory.get( normalizedNumber );

    if ( existingCall )
    {
      this.callHistory.set( normalizedNumber, {
        ...existingCall,
        apiInProgress: false
      } );
    }
  }

  // Show notification with enhanced logic
  showNotification ( event: any, phoneNumber: any, studentName: any, parentName: any )
  {

    try
    {
      console.log( 'Student Name: i am getting from the try showNotification', studentName );


      CallDetectionService.showNotificationWithStudentInfo(
        event,
        phoneNumber,
        studentName,
        parentName
      );

    } catch ( error )
    {
      console.log( 'Student Name: i am getting from the catch showNotification', studentName );
      // Error handling without logging
    }
  }

  // Determine if we should show notification for this event type
  shouldShowNotificationForEvent ( event: any, hasStudentData: any )
  {
    switch ( event )
    {
      case 'RINGING':
      case 'OUTGOING':
        // Always show for incoming/outgoing calls
        return true;

      case 'OFFHOOK':
        // Only show if we have student data (avoid spam for unknown numbers)
        return hasStudentData;

      case 'IDLE':
        // Only show if we have student data (call ended notifications)
        return hasStudentData;

      default:
        // For other events, only show if we have student data
        return hasStudentData;
    }
  }

  // Clear notifications for a specific number when call ends
  clearNotificationsForNumber ( phoneNumber: any )
  {
    const normalizedNumber = this.normalizePhoneNumber( phoneNumber );

    try
    {
      CallDetectionService.clearNotificationsForNumber( phoneNumber );
    } catch ( error )
    {
      // Error handling without logging
    }
  }

  // Clear all call notifications
  clearAllNotifications ()
  {
    try
    {
      CallDetectionService.clearAllCallNotifications();
      this.callHistory.clear();
    } catch ( error )
    {
      // Error handling without logging
    }
  }

  // Get active notification count
  async getActiveNotificationCount ()
  {
    try
    {
      const count = await CallDetectionService.getActiveNotificationCount();
      return count;
    } catch ( error )
    {
      return 0;
    }
  }

  // Cleanup old call history (call this periodically)
  cleanupOldHistory ( maxAgeMinutes = 60 )
  {
    const currentTime = Date.now();
    const maxAge = maxAgeMinutes * 60 * 1000;

    for ( const [phoneNumber, callData] of this.callHistory.entries() )
    {
      if ( currentTime - callData.lastTimestamp > maxAge )
      {
        this.callHistory.delete( phoneNumber );
      }
    }
  }

  // Get call history for debugging
  getCallHistory ()
  {
    const history = {};
    for ( const [phoneNumber, callData] of this.callHistory.entries() )
    {
      history[phoneNumber] = {
        ...callData,
        lastTimestamp: new Date( callData.lastTimestamp ).toISOString()
      };
    }
    return history;
  }

  // Handle IDLE state specifically
  handleCallEnded ( phoneNumber: any, studentName: any, parentName: any )
  {
    const normalizedNumber = this.normalizePhoneNumber( phoneNumber );

    // Show final notification if we have student data
    if ( studentName && parentName )
    {
      this.showNotification( 'IDLE', phoneNumber, studentName, parentName );

      // Auto-clear the notification after 10 seconds for IDLE events
      setTimeout( () =>
      {
        this.clearNotificationsForNumber( phoneNumber );
      }, 10000 );
    } else
    {
      // Just clear any existing notifications for this number
      this.clearNotificationsForNumber( phoneNumber );
    }

    // Clean up call history for this number after a delay
    setTimeout( () =>
    {
      this.callHistory.delete( normalizedNumber );
    }, 30000 ); // 30 seconds
  }
}

// Create singleton instance
const notificationManager = new NotificationManager();

// Enhanced fetchingPastEventsData function
export const fetchingPastEventsData = async ( number: string, event: string ): Promise<void> =>
{
  // Check if we should proceed with this call
  if ( !notificationManager.shouldProcessCall( number, event ) )
  {
    return;
  }

  // Mark this API call as in progress
  notificationManager.markApiInProgress( number, event );

  try
  {
    const apiUrlFromStorage = await AsyncStorage.getItem( 'selectedItemInfo' );

    if ( !apiUrlFromStorage )
    {
      notificationManager.markApiCompleted( number, event );
      // notificationManager.showNotification( event, number, null, null );
      return;
    }

    let apiUrl;
    try
    {
      const parsedInfo = JSON.parse( apiUrlFromStorage );
      apiUrl = parsedInfo.apiUrl;
    } catch ( parseError )
    {
      notificationManager.markApiCompleted( number, event );
      // notificationManager.showNotification( event, number, null, null );
      return;
    }

    if ( !apiUrl )
    {
      notificationManager.markApiCompleted( number, event );
      // notificationManager.showNotification( event, number, null, null );
      return;
    }

    const token = await AsyncStorage.getItem( 'token' );

    if ( !token )
    {
      notificationManager.markApiCompleted( number, event );
      // notificationManager.showNotification( event, number, null, null );
      return;
    }

    const requestBody = {
      phone_number: number,
      event: event,
    };

    const fullUrl = apiUrl + 'get-student-search-list-by-phone';

    const response = await fetch( fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ token }`,
      },
      body: JSON.stringify( requestBody ),
    } );

    if ( response.ok )
    {
      const responseData = await response.json();

      const studentName = responseData.student_names;
      const parentName = responseData.parent_name;

      // Mark API as completed first
      notificationManager.markApiCompleted( number, event );

      if ( studentName && parentName )
      {
        callStore.setStudentDetails( { studentName, parentName } );
        callStore.setModalVisible( true );

        // Show notification with student info
        console.log( 'Student Name: i am getting from the  if', studentName );
        notificationManager.showNotification( event, number, studentName, parentName );
      }
      else if ( studentName )
      {
        // callStore.setStudentDetails( { studentName, parentName: 'Unknown' } );
        callStore.setModalVisible( true );

      }
      else
      {
        // Only show fallback for important events
        // notificationManager.showNotification( event, number, null, null );
      }

      // Handle IDLE state specially
      if ( event === 'IDLE' )
      {
        notificationManager.handleCallEnded( number, studentName, parentName );
      }
    }
    else
    {
      notificationManager.markApiCompleted( number, event );
      // notificationManager.showNotification( event, number, null, null );
    }
  }
  catch ( error )
  {
    notificationManager.markApiCompleted( number, event );

    ToastAndroid.show(
      'An error occurred while fetching data.',
      ToastAndroid.LONG,
    );

    // notificationManager.showNotification( event, number, null, null );
  }
};

// Export the notification manager instance for direct access if needed
export { notificationManager };