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
        this.permissionsChecked = false;
        this.hasPermissions = false;
    }

    async requestPermissions()
    {
        if ( this.permissionsChecked )
        {
            return this.hasPermissions;
        }

        if ( Platform.OS === 'android' )
        {
            try
            {
                console.log( 'Requesting Android permissions...' );

                const currentPermissions = {
                    phoneState: await PermissionsAndroid.check( PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE ),
                    processOutgoing: await PermissionsAndroid.check( PermissionsAndroid.PERMISSIONS.PROCESS_OUTGOING_CALLS ),
                    callLog: await PermissionsAndroid.check( PermissionsAndroid.PERMISSIONS.READ_CALL_LOG ),
                    postNotifications: await PermissionsAndroid.check( PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS )
                };

                console.log( 'Current permissions:', currentPermissions );

                // Check if all permissions are already granted
                const allAlreadyGranted = Object.values( currentPermissions ).every( permission => permission );

                if ( allAlreadyGranted )
                {
                    console.log( 'All permissions already granted' );
                    this.permissionsChecked = true;
                    this.hasPermissions = true;
                    return true;
                }

                const granted = await PermissionsAndroid.requestMultiple( [
                    PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
                    PermissionsAndroid.PERMISSIONS.PROCESS_OUTGOING_CALLS,
                    PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
                    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
                ] );

                console.log( 'Permission results:', granted );

                const phoneStateGranted = granted[PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE] === PermissionsAndroid.RESULTS.GRANTED;
                const outgoingCallsGranted = granted[PermissionsAndroid.PERMISSIONS.PROCESS_OUTGOING_CALLS] === PermissionsAndroid.RESULTS.GRANTED;
                const callLogGranted = granted[PermissionsAndroid.PERMISSIONS.READ_CALL_LOG] === PermissionsAndroid.RESULTS.GRANTED;
                const postNotificationsGranted = granted[PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS] === PermissionsAndroid.RESULTS.GRANTED;

                const allGranted = phoneStateGranted && outgoingCallsGranted && callLogGranted && postNotificationsGranted;

                this.permissionsChecked = true;
                this.hasPermissions = allGranted;

                return allGranted;
            } catch ( err )
            {
                console.error( 'Permission request failed:', err );
                this.permissionsChecked = true;
                this.hasPermissions = false;
                return false;
            }
        }

        this.permissionsChecked = true;
        this.hasPermissions = true;
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

                console.log( 'State:', data?.state );
                console.log( 'Phone Number:', data?.phoneNumber );

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
            permissionsChecked: this.permissionsChecked,
            hasPermissions: this.hasPermissions,
        };
    }

    // Method to reset permission status (useful for testing or when permissions change)
    resetPermissions()
    {
        this.permissionsChecked = false;
        this.hasPermissions = false;
    }
}

export default new CallDetectionService();