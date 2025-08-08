package com.callervismaad

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.telephony.TelephonyManager
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

data class PendingCallEvent(val state: String, val phoneNumber: String?)

class CallDetectionManagerAndroid(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    companion object {
        private const val TAG = "CallDetectionManager"
        private var instance: CallDetectionManagerAndroid? = null
        private val pendingEvents = mutableListOf<PendingCallEvent>()
        
        fun getInstance(): CallDetectionManagerAndroid? = instance
        
        fun addPendingEvent(state: String, phoneNumber: String?) {
            Log.d(TAG, "Adding pending event: $state, $phoneNumber")
            pendingEvents.add(PendingCallEvent(state, phoneNumber))
        }
    }
    
    private var programmaticReceiver: ProgrammaticCallReceiver? = null
    
    init {
        instance = this
        // Process any pending events that occurred before this manager was initialized
        processPendingEvents()
    }
    
    override fun getName(): String {
        return "CallDetectionManager"
    }
    
    @ReactMethod
    fun startCallDetection() {
        Log.d(TAG, "Starting call detection...")
        val context = reactApplicationContext
        
        if (programmaticReceiver == null) {
            try {
                // Create a programmatic receiver for additional reliability
                programmaticReceiver = ProgrammaticCallReceiver(this)
                val intentFilter = IntentFilter().apply {
                    addAction(TelephonyManager.ACTION_PHONE_STATE_CHANGED)
                    addAction(Intent.ACTION_NEW_OUTGOING_CALL)
                    priority = 999 // High priority
                }
                
                // Register programmatic receiver
                context.registerReceiver(programmaticReceiver as BroadcastReceiver, intentFilter)
                Log.d(TAG, "Programmatic call receiver registered successfully")
                
                // Process any events that were received before we started listening
                processPendingEvents()
                
            } catch (e: Exception) {
                Log.e(TAG, "Error registering programmatic receiver: ${e.message}", e)
            }
        } else {
            Log.d(TAG, "Call detection already started")
        }
    }
    
    @ReactMethod
    fun stopCallDetection() {
        Log.d(TAG, "Stopping call detection...")
        programmaticReceiver?.let { receiver ->
            try {
                reactApplicationContext.unregisterReceiver(receiver as BroadcastReceiver)
                programmaticReceiver = null
                Log.d(TAG, "Programmatic receiver unregistered successfully")
            } catch (e: Exception) {
                Log.e(TAG, "Error unregistering programmatic receiver: ${e.message}", e)
            }
        }
    }
    
    private fun processPendingEvents() {
        if (pendingEvents.isNotEmpty()) {
            Log.d(TAG, "Processing ${pendingEvents.size} pending events")
            pendingEvents.forEach { event ->
                onCallStateChanged(event.state, event.phoneNumber)
            }
            pendingEvents.clear()
        }
    }
    
    private fun sendEvent(eventName: String, params: WritableMap?) {
        try {
            Log.d(TAG, "Sending event: $eventName with params: $params")
            reactApplicationContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
        } catch (e: Exception) {
            Log.e(TAG, "Error sending event to JS: ${e.message}", e)
        }
    }
    
    fun onCallStateChanged(state: String, phoneNumber: String?) {
        Log.d(TAG, "onCallStateChanged called: state=$state, phoneNumber=$phoneNumber")
        
        val params = Arguments.createMap().apply {
            putString("state", state)
            putString("phoneNumber", phoneNumber ?: "")
        }
        
        Log.d(TAG, "Sending CallStateChanged event to JavaScript")
        sendEvent("CallStateChanged", params)
    }
    
    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        instance = null
        pendingEvents.clear()
    }
}

// Additional programmatic receiver for double coverage  
class ProgrammaticCallReceiver(private val manager: CallDetectionManagerAndroid) : BroadcastReceiver() {
    
    companion object {
        private const val TAG = "ProgrammaticReceiver"
    }
    
    override fun onReceive(context: Context?, intent: Intent?) {
        Log.d(TAG, "Programmatic receiver triggered: ${intent?.action}")
        
        when (intent?.action) {
            TelephonyManager.ACTION_PHONE_STATE_CHANGED -> {
                val state = intent.getStringExtra(TelephonyManager.EXTRA_STATE)
                val phoneNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER)
                
                val callState = when (state) {
                    TelephonyManager.EXTRA_STATE_IDLE -> "IDLE"
                    TelephonyManager.EXTRA_STATE_RINGING -> "RINGING"
                    TelephonyManager.EXTRA_STATE_OFFHOOK -> "OFFHOOK"
                    else -> "IDLE"
                }
                
                Log.d(TAG, "Programmatic: $callState, $phoneNumber")
                manager.onCallStateChanged(callState, phoneNumber)
            }
            
            Intent.ACTION_NEW_OUTGOING_CALL -> {
                val phoneNumber = intent.getStringExtra(Intent.EXTRA_PHONE_NUMBER)
                Log.d(TAG, "Programmatic outgoing: $phoneNumber")
                manager.onCallStateChanged("OUTGOING", phoneNumber)
            }
        }
    }
}