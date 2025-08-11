// import { PermissionsAndroid, Platform } from 'react-native';
// import { fetchingPastEventsData } from '../../Store/CallLogsStore/callLogsStore';

// let isProcessingEvent = false;

// const handleCallEvent = ( event: string, number: string | null ) =>
// {
//   if ( event && number && !isProcessingEvent )
//   {
//     isProcessingEvent = true;
//     console.log( `Event: ${ event }, Number: ${ number }` );
//     if ( Platform.OS === 'android' )
//     {
//       if ( event === 'Offhook' )
//       {
//         fetchingPastEventsData( number, event );
//       } else if ( event === 'Missed' )
//       {
//       } else if ( event === 'Incoming' )
//       {
//         fetchingPastEventsData( number, event );
//       } else if ( event === 'Disconnected' )
//       {
//       }
//     } else if ( Platform.OS === 'ios' )
//     {
//       if ( event === 'Connected' )
//       {
//       } else if ( event === 'Disconnected' )
//       {
//       } else if ( event === 'Incoming' )
//       {
//         fetchingPastEventsData( number, event );
//       } else if ( event === 'Dialing' )
//       {
//         fetchingPastEventsData( number, event );
//       }
//     }
//   }
// };

// export const requestPermissions = async () =>
// {
//   let callDetector: CallDetectorManager | null = null;

//   try
//   {
//     const rationale: PermissionsAndroid.Rationale = {
//       title: 'Phone State Permission',
//       message: 'This app needs access to your phone state and call logs',
//       buttonPositive: 'OK',
//     };

//     const permissionsToRequest = [
//       PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
//       PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
//     ];

//     if ( Platform.OS === 'android' && Platform.Version >= 33 )
//     {
//       permissionsToRequest.push(
//         PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
//       );
//     }
//     const grantedPermissions = await PermissionsAndroid.requestMultiple(
//       permissionsToRequest,
//     );

//     const allPermissionsGranted = Object.values( grantedPermissions ).every(
//       permissionStatus =>
//         permissionStatus === PermissionsAndroid.RESULTS.GRANTED,
//     );

//     if ( allPermissionsGranted )
//     {
//       console.log( 'Permissions Accepted by User' );
//       callDetector = new CallDetectorManager( handleCallEvent, true );
//     } else
//     {
//       console.log( 'Some permissions were denied by user' );
//     }
//   } catch ( error )
//   {
//     console.error( 'Error requesting permissions:', error );
//   }
//   return () =>
//   {
//     if ( callDetector )
//     {
//       callDetector.dispose();
//     }
//   };
// };