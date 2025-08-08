// File Location: src/services/CallDetectionService.js

import { NativeModules, NativeEventEmitter, PermissionsAndroid, Platform } from 'react-native';

const { CallDetectionManager } = NativeModules;
const callDetectionEmitter = CallDetectionManager ? new NativeEventEmitter( CallDetectionManager ) : null;

class CallDetectionService
{
    constructor ()
    {
        this.listeners = [];
        this.isListening = false;


        console.log( 'CallDetectionService initialized' );
        console.log( 'CallDetectionManager available:', !!CallDetectionManager );
        console.log( 'callDetectionEmitter available:', !!callDetectionEmitter );
    }

    async requestPermissions()
    {
        if ( Platform.OS === 'android' )
        {
            try
            {
                console.log( 'Requesting Android permissions...' );

                const currentPermissions = {
                    phoneState: await PermissionsAndroid.check( PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE ),
                    processOutgoing: await PermissionsAndroid.check( PermissionsAndroid.PERMISSIONS.PROCESS_OUTGOING_CALLS ),
                    callLog: await PermissionsAndroid.check( PermissionsAndroid.PERMISSIONS.READ_CALL_LOG ),
                };

                console.log( 'Current permissions:', currentPermissions );

                const granted = await PermissionsAndroid.requestMultiple( [
                    PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
                    PermissionsAndroid.PERMISSIONS.PROCESS_OUTGOING_CALLS,
                    PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
                ] );

                console.log( 'Permission results:', granted );

                const phoneStateGranted = granted[PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE] === PermissionsAndroid.RESULTS.GRANTED;
                const outgoingCallsGranted = granted[PermissionsAndroid.PERMISSIONS.PROCESS_OUTGOING_CALLS] === PermissionsAndroid.RESULTS.GRANTED;
                const callLogGranted = granted[PermissionsAndroid.PERMISSIONS.READ_CALL_LOG] === PermissionsAndroid.RESULTS.GRANTED;

                const allGranted = phoneStateGranted && outgoingCallsGranted && callLogGranted;

                console.log( 'Final permission status:' );
                console.log( '- Phone State:', phoneStateGranted );
                console.log( '- Process Outgoing Calls:', outgoingCallsGranted );
                console.log( '- Call Log:', callLogGranted );
                console.log( '- All Granted:', allGranted );

                return allGranted;
            } catch ( err )
            {
                console.error( 'Permission request failed:', err );
                return false;
            }
        }
        return true;
    }

    async startCallDetection()
    {
        console.log( 'Starting call detection...' );

        if ( !CallDetectionManager )
        {
            console.error( 'CallDetectionManager native module not found' );
            return false;
        }

        const hasPermission = await this.requestPermissions();

        if ( !hasPermission )
        {
            console.error( 'Call detection permissions not granted' );
            return false;
        }

        if ( !this.isListening )
        {
            try
            {
                console.log( 'Calling CallDetectionManager.startCallDetection()' );
                CallDetectionManager.startCallDetection();
                this.isListening = true;
                console.log( 'Call detection started successfully' );

                // Add a test event listener to verify it's working
                this.addTestListener();

            } catch ( error )
            {
                console.error( 'Error starting call detection:', error );
                return false;
            }
        } else
        {
            console.log( 'Call detection already started' );
        }

        return true;
    }

    addTestListener()
    {
        if ( callDetectionEmitter )
        {
            console.log( 'Adding test listener for CallStateChanged events...' );
            const testListener = callDetectionEmitter.addListener( 'CallStateChanged', ( data ) =>
            {
                console.log( '=== CALL STATE CHANGED EVENT RECEIVED ===' );
                console.log( 'Raw event data:', data );
                console.log( 'State:', data?.state );
                console.log( 'Phone Number:', data?.phoneNumber );
                console.log( '========================================' );
            } );

            this.listeners.push( testListener );
        } else
        {
            console.error( 'Cannot add test listener - callDetectionEmitter is null' );
        }
    }

    stopCallDetection()
    {
        console.log( 'Stopping call detection...' );

        if ( !CallDetectionManager )
        {
            console.log( 'CallDetectionManager not available' );
            return;
        }

        if ( this.isListening )
        {
            try
            {
                CallDetectionManager.stopCallDetection();
                this.isListening = false;
                console.log( 'Call detection stopped' );
            } catch ( error )
            {
                console.error( 'Error stopping call detection:', error );
            }
        }
    }

    addListener( callback )
    {
        console.log( 'Adding call state listener...' );

        if ( !callDetectionEmitter )
        {
            console.error( 'Call detection emitter not available' );
            return null;
        }

        const listener = callDetectionEmitter.addListener( 'CallStateChanged', ( data ) =>
        {
            console.log( 'CallDetectionService received event:', data );
            callback( data );
        } );

        this.listeners.push( listener );
        console.log( 'Listener added. Total listeners:', this.listeners.length );

        return listener;
    }

    removeListener( listener )
    {
        if ( listener )
        {
            listener.remove();
            const index = this.listeners.indexOf( listener );
            if ( index > -1 )
            {
                this.listeners.splice( index, 1 );
            }
            console.log( 'Listener removed. Remaining listeners:', this.listeners.length );
        }
    }

    removeAllListeners()
    {
        console.log( 'Removing all listeners...' );
        this.listeners.forEach( listener => listener.remove() );
        this.listeners = [];
        if ( callDetectionEmitter )
        {
            callDetectionEmitter.removeAllListeners( 'CallStateChanged' );
        }
        console.log( 'All listeners removed' );
    }

    // Debug method to check service status
    getStatus()
    {
        return {
            isListening: this.isListening,
            hasManager: !!CallDetectionManager,
            hasEmitter: !!callDetectionEmitter,
            listenersCount: this.listeners.length,
        };
    }
}

export default new CallDetectionService();