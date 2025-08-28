import { NativeModules, NativeEventEmitter, PermissionsAndroid, Platform, Alert, Linking } from 'react-native';

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
        this.batteryOptimizationChecked = false;
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

                // Check current permissions
                const currentPermissions = {
                    phoneState: await PermissionsAndroid.check( PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE ),
                    processOutgoing: await PermissionsAndroid.check( PermissionsAndroid.PERMISSIONS.PROCESS_OUTGOING_CALLS ),
                    callLog: await PermissionsAndroid.check( PermissionsAndroid.PERMISSIONS.READ_CALL_LOG ),
                    postNotifications: await PermissionsAndroid.check( PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS ),
                    manageOwnCalls: await PermissionsAndroid.check( 'android.permission.MANAGE_OWN_CALLS' ),
                    foregroundServicePhoneCall: await PermissionsAndroid.check( 'android.permission.FOREGROUND_SERVICE_PHONE_CALL' ),
                    batteryOptimization: await PermissionsAndroid.check( 'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS' )
                };

                console.log( 'Current permissions:', currentPermissions );

                const allAlreadyGranted = Object.values( currentPermissions ).every( permission => permission );

                if ( allAlreadyGranted )
                {
                    console.log( 'All permissions already granted' );
                    this.permissionsChecked = true;
                    this.hasPermissions = true;
                    await this.requestBatteryOptimization();
                    return true;
                }

                const permissionsToRequest = [
                    PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
                    PermissionsAndroid.PERMISSIONS.PROCESS_OUTGOING_CALLS,
                    PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
                    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
                    'android.permission.MANAGE_OWN_CALLS',
                    'android.permission.FOREGROUND_SERVICE_PHONE_CALL'
                ];

                const granted = await PermissionsAndroid.requestMultiple( permissionsToRequest );

                console.log( 'Permission results:', granted );

                const phoneStateGranted = granted[PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE] === PermissionsAndroid.RESULTS.GRANTED;
                const outgoingCallsGranted = granted[PermissionsAndroid.PERMISSIONS.PROCESS_OUTGOING_CALLS] === PermissionsAndroid.RESULTS.GRANTED;
                const callLogGranted = granted[PermissionsAndroid.PERMISSIONS.READ_CALL_LOG] === PermissionsAndroid.RESULTS.GRANTED;
                const postNotificationsGranted = granted[PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS] === PermissionsAndroid.RESULTS.GRANTED;
                const manageOwnCallsGranted = granted['android.permission.MANAGE_OWN_CALLS'] === PermissionsAndroid.RESULTS.GRANTED;
                const foregroundServicePhoneCallGranted = granted['android.permission.FOREGROUND_SERVICE_PHONE_CALL'] === PermissionsAndroid.RESULTS.GRANTED;

                const allGranted = phoneStateGranted && outgoingCallsGranted && callLogGranted && postNotificationsGranted && manageOwnCallsGranted && foregroundServicePhoneCallGranted;

                this.permissionsChecked = true;
                this.hasPermissions = allGranted;

                if ( allGranted )
                {
                    await this.requestBatteryOptimization();
                } else
                {
                    this.showPermissionDeniedAlert( granted );
                }

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

    async requestBatteryOptimization()
    {
        if ( this.batteryOptimizationChecked )
        {
            return true;
        }

        try
        {
            console.log( 'Requesting battery optimization exemption...' );

            const batteryGranted = await PermissionsAndroid.request(
                'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
                {
                    title: 'Battery Optimization',
                    message: 'To ensure reliable call detection in background, please disable battery optimization for this app.',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                }
            );

            console.log( 'Battery optimization permission:', batteryGranted );

            if ( batteryGranted === PermissionsAndroid.RESULTS.GRANTED )
            {
                this.batteryOptimizationChecked = true;
                return true;
            }

            Alert.alert(
                'Battery Optimization Required',
                'For reliable background call detection, please disable battery optimization for this app in Settings.',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                    {
                        text: 'Open Settings',
                        onPress: () =>
                        {
                            Linking.openSettings();
                        },
                    },
                ]
            );

            this.batteryOptimizationChecked = true;
            return batteryGranted === PermissionsAndroid.RESULTS.GRANTED;
        } catch ( error )
        {
            console.error( 'Battery optimization request error:', error );
            this.batteryOptimizationChecked = true;
            return false;
        }
    }

    showPermissionDeniedAlert( granted )
    {
        const deniedPermissions = [];

        if ( granted[PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE] !== PermissionsAndroid.RESULTS.GRANTED )
        {
            deniedPermissions.push( 'Phone State' );
        }
        if ( granted[PermissionsAndroid.PERMISSIONS.PROCESS_OUTGOING_CALLS] !== PermissionsAndroid.RESULTS.GRANTED )
        {
            deniedPermissions.push( 'Outgoing Calls' );
        }
        if ( granted[PermissionsAndroid.PERMISSIONS.READ_CALL_LOG] !== PermissionsAndroid.RESULTS.GRANTED )
        {
            deniedPermissions.push( 'Call Log' );
        }
        if ( granted['android.permission.MANAGE_OWN_CALLS'] !== PermissionsAndroid.RESULTS.GRANTED )
        {
            deniedPermissions.push( 'Manage Own Calls' );
        }
        if ( granted['android.permission.FOREGROUND_SERVICE_PHONE_CALL'] !== PermissionsAndroid.RESULTS.GRANTED )
        {
            deniedPermissions.push( 'Foreground Service for Phone Calls' );
        }
        if ( granted[PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS] !== PermissionsAndroid.RESULTS.GRANTED )
        {
            deniedPermissions.push( 'Notifications' );
        }

        if ( deniedPermissions.length > 0 )
        {
            Alert.alert(
                'Permissions Required',
                `The following permissions were denied: ${ deniedPermissions.join( ', ' ) }. Call detection may not work properly. Please grant these permissions in Settings.`,
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                    {
                        text: 'Open Settings',
                        onPress: () =>
                        {
                            Linking.openSettings();
                        },
                    },
                ]
            );
        }
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

    // Method to show notification with student info
    showNotificationWithStudentInfo( callState, phoneNumber, studentName, parentName )
    {
        console.log( 'Showing notification with student info:', { callState, phoneNumber, studentName, parentName } );

        if ( !CallDetectionManager || !CallDetectionManager.showNotificationWithStudentInfo )
        {
            console.warn( 'showNotificationWithStudentInfo method not available' );
            return;
        }

        try
        {
            CallDetectionManager.showNotificationWithStudentInfo(
                callState,
                phoneNumber || '',
                studentName || '',
                parentName || ''
            );
        } catch ( error )
        {
            console.error( 'Error showing notification with student info:', error );
        }
    }

    // NEW: Clear notifications for specific phone number
    clearNotificationsForNumber( phoneNumber )
    {
        console.log( 'Clearing notifications for number:', phoneNumber );

        if ( !CallDetectionManager || !CallDetectionManager.clearNotificationsForNumber )
        {
            console.warn( 'clearNotificationsForNumber method not available' );
            return;
        }

        try
        {
            CallDetectionManager.clearNotificationsForNumber( phoneNumber || '' );
        } catch ( error )
        {
            console.error( 'Error clearing notifications for number:', error );
        }
    }

    // NEW: Clear all call notifications
    clearAllCallNotifications()
    {
        console.log( 'Clearing all call notifications' );

        if ( !CallDetectionManager || !CallDetectionManager.clearAllCallNotifications )
        {
            console.warn( 'clearAllCallNotifications method not available' );
            return;
        }

        try
        {
            CallDetectionManager.clearAllCallNotifications();
        } catch ( error )
        {
            console.error( 'Error clearing all notifications:', error );
        }
    }

    // NEW: Get active notification count
    async getActiveNotificationCount()
    {
        if ( !CallDetectionManager || !CallDetectionManager.getActiveNotificationCount )
        {
            console.warn( 'getActiveNotificationCount method not available' );
            return 0;
        }

        try
        {
            return await CallDetectionManager.getActiveNotificationCount();
        } catch ( error )
        {
            console.error( 'Error getting active notification count:', error );
            return 0;
        }
    }

    addTestListener()
    {
        if ( callDetectionEmitter )
        {
            console.log( 'Adding test listener for CallStateChanged events...' );
            const testListener = callDetectionEmitter.addListener( 'CallStateChanged', ( data ) =>
            {
                console.log( 'Test Listener - State:', data?.state );
                console.log( 'Test Listener - Phone Number:', data?.phoneNumber );
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

    async isActive()
    {
        try
        {
            if ( CallDetectionManager && CallDetectionManager.isCallDetectionActive )
            {
                return await CallDetectionManager.isCallDetectionActive();
            }
            return this.isListening;
        } catch ( error )
        {
            console.error( 'Error checking if call detection is active:', error );
            return this.isListening;
        }
    }

    async testNotification()
    {
        if ( CallDetectionManager && CallDetectionManager.testNotification )
        {
            return await CallDetectionManager.testNotification();
        }
        return false;
    }

    getStatus()
    {
        return {
            isListening: this.isListening,
            hasManager: !!CallDetectionManager,
            hasEmitter: !!callDetectionEmitter,
            listenersCount: this.listeners.length,
            permissionsChecked: this.permissionsChecked,
            hasPermissions: this.hasPermissions,
            batteryOptimizationChecked: this.batteryOptimizationChecked,
        };
    }

    resetPermissions()
    {
        this.permissionsChecked = false;
        this.hasPermissions = false;
        this.batteryOptimizationChecked = false;
    }

    async checkAllPermissions()
    {
        if ( Platform.OS !== 'android' )
        {
            return { allGranted: true, details: {} };
        }

        try
        {
            const permissions = {
                phoneState: await PermissionsAndroid.check( PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE ),
                processOutgoing: await PermissionsAndroid.check( PermissionsAndroid.PERMISSIONS.PROCESS_OUTGOING_CALLS ),
                callLog: await PermissionsAndroid.check( PermissionsAndroid.PERMISSIONS.READ_CALL_LOG ),
                postNotifications: await PermissionsAndroid.check( PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS ),
                manageOwnCalls: await PermissionsAndroid.check( 'android.permission.MANAGE_OWN_CALLS' ),
                foregroundServicePhoneCall: await PermissionsAndroid.check( 'android.permission.FOREGROUND_SERVICE_PHONE_CALL' ),
                batteryOptimization: await PermissionsAndroid.check( 'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS' )
            };

            const allGranted = Object.values( permissions ).every( permission => permission );

            return {
                allGranted,
                details: permissions
            };
        } catch ( error )
        {
            console.error( 'Error checking permissions:', error );
            return { allGranted: false, details: {} };
        }
    }
}

export default new CallDetectionService();