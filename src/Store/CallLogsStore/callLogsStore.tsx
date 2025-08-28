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
      console.log( `First call detected from ${ normalizedNumber }: ${ event }` );
      return true;
    }

    // Check if API call is already in progress for this number
    if ( existingCall.apiInProgress )
    {
      console.log( `API call already in progress for ${ normalizedNumber }` );
      return false;
    }

    const timeDiff = currentTime - existingCall.lastTimestamp;
    const isSameEvent = existingCall.lastEvent === event;

    // Skip if same event within 2 seconds (debounce rapid duplicates)
    if ( isSameEvent && timeDiff < 2000 )
    {
      console.log( `Skipping duplicate ${ event } event for ${ normalizedNumber } (within 2 seconds)` );
      return false;
    }

    // For different events, allow processing but with shorter debounce for rapid state changes
    if ( !isSameEvent && timeDiff < 500 )
    {
      console.log( `Skipping rapid state change for ${ normalizedNumber } (within 500ms)` );
      return false;
    }

    return true;
  }

  // Normalize phone number for consistent tracking
  normalizePhoneNumber ( phoneNumber )
  {
    if ( !phoneNumber || phoneNumber === '' )
    {
      return 'Unknown';
    }

    // Remove common formatting characters
    return phoneNumber.replace( /[\s\-\(\)\.]/g, '' );
  }

  // Mark API call as in progress for this phone number
  markApiInProgress ( phoneNumber, event )
  {
    const normalizedNumber = this.normalizePhoneNumber( phoneNumber );
    const currentTime = Date.now();

    this.callHistory.set( normalizedNumber, {
      lastEvent: event,
      lastTimestamp: currentTime,
      apiInProgress: true
    } );

    console.log( `Marked API in progress for ${ normalizedNumber }: ${ event }` );
  }

  // Mark API call as completed for this phone number
  markApiCompleted ( phoneNumber, event )
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

    console.log( `Marked API completed for ${ normalizedNumber }: ${ event }` );
  }

  // Show notification with enhanced logic
  showNotification ( event, phoneNumber, studentName, parentName )
  {
    const normalizedNumber = this.normalizePhoneNumber( phoneNumber );

    // Determine if we should show notification
    const hasStudentData = studentName && parentName;
    const shouldShowForEvent = this.shouldShowNotificationForEvent( event, hasStudentData );

    if ( !shouldShowForEvent )
    {
      console.log( `Skipping notification for event ${ event } (no student data and not priority event)` );
      return;
    }

    console.log( `Showing notification for ${ normalizedNumber }:`, {
      event,
      studentName: studentName || 'Unknown',
      parentName: parentName || 'Unknown',
      hasStudentData
    } );

    try
    {
    // Show notification using the enhanced service
      CallDetectionService.showNotificationWithStudentInfo(
        event,
        phoneNumber,
        studentName,
        parentName
      );

      // Update call history to track this notification
      const existingCall = this.callHistory.get( normalizedNumber );
      if ( existingCall )
      {
        this.callHistory.set( normalizedNumber, {
          ...existingCall,
          lastNotificationEvent: event,
          lastNotificationTime: Date.now(),
          lastNotificationData: { studentName, parentName }
        } );
      }

      console.log( `Notification shown successfully for ${ normalizedNumber }` );

    } catch ( error )
    {
      console.error( `Error showing notification for ${ normalizedNumber }:`, error );
    }
  }

  // Determine if we should show notification for this event type
  shouldShowNotificationForEvent ( event, hasStudentData )
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
  clearNotificationsForNumber ( phoneNumber )
  {
    const normalizedNumber = this.normalizePhoneNumber( phoneNumber );

    try
    {
      CallDetectionService.clearNotificationsForNumber( phoneNumber );
      console.log( `Cleared notifications for ${ normalizedNumber }` );
    } catch ( error )
    {
      console.error( `Error clearing notifications for ${ normalizedNumber }:`, error );
    }
  }

  // Clear all call notifications
  clearAllNotifications ()
  {
    try
    {
      CallDetectionService.clearAllCallNotifications();
      this.callHistory.clear();
      console.log( 'All call notifications cleared' );
    } catch ( error )
    {
      console.error( 'Error clearing all notifications:', error );
    }
  }

  // Get active notification count
  async getActiveNotificationCount ()
  {
    try
    {
      const count = await CallDetectionService.getActiveNotificationCount();
      console.log( `Active notification count: ${ count }` );
      return count;
    } catch ( error )
    {
      console.error( 'Error getting notification count:', error );
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
        console.log( `Removed old call history for ${ phoneNumber }` );
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
  handleCallEnded ( phoneNumber, studentName, parentName )
  {
    const normalizedNumber = this.normalizePhoneNumber( phoneNumber );
    console.log( `Call ended for ${ normalizedNumber }` );

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
      console.log( `Cleaned up call history for ${ normalizedNumber }` );
    }, 30000 ); // 30 seconds
  }
}

// Create singleton instance
const notificationManager = new NotificationManager();

// Enhanced fetchingPastEventsData function
export const fetchingPastEventsData = async ( number: string, event: string ) =>
{
  console.log( '=== START fetchingPastEventsData ===' );
  console.log( 'Input parameters:', { number, event, timestamp: new Date().toISOString() } );

  // Check if we should proceed with this call
  if ( !notificationManager.shouldProcessCall( number, event ) )
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
      // notificationManager.showNotification( event, number, null, null );
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
      // notificationManager.showNotification( event, number, null, null );
      return;
    }

    if ( !apiUrl )
    {
      console.log( 'ERROR: No apiUrl found in parsed data' );
      notificationManager.markApiCompleted( number, event );
      // notificationManager.showNotification( event, number, null, null );
      return;
    }

    console.log( 'Step 2: Getting token from storage...' );
    const token = await AsyncStorage.getItem( 'token' );

    if ( !token )
    {
      console.log( 'ERROR: No token found in AsyncStorage' );
      notificationManager.markApiCompleted( number, event );
      // notificationManager.showNotification( event, number, null, null );
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
      console.log( 'API call failed with status:', response.status );
      notificationManager.markApiCompleted( number, event );
      // notificationManager.showNotification( event, number, null, null );
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

    // notificationManager.showNotification( event, number, null, null );
  }

  console.log( '=== END fetchingPastEventsData ===' );
};

// Export the notification manager instance for direct access if needed
export { notificationManager };