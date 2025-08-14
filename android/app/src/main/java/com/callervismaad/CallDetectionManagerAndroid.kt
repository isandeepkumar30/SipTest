package com.callervismaad

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.telephony.TelephonyManager
import android.util.Log
import androidx.core.app.NotificationCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

data class PendingCallEvent(val state: String, val phoneNumber: String?)

class CallDetectionManagerAndroid(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    companion object {
        private const val TAG = "CallDetectionManager"
        private const val CHANNEL_ID = "call_detection_rn_channel"
        private const val NOTIFICATION_ID = 1002
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
        // Create notification channel when manager is initialized
        createNotificationChannel()
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
    
    @ReactMethod
    fun isCallDetectionActive(promise: Promise) {
        promise.resolve(programmaticReceiver != null)
    }
    
    // Notification tracking to prevent duplicates
    private var lastNotificationKey: String? = null
    private var lastNotificationTime: Long = 0
    
    // New method to show notification with student info
    @ReactMethod
    fun showNotificationWithStudentInfo(callState: String, phoneNumber: String?, studentName: String?, parentName: String?) {
        try {
            Log.d(TAG, "Request to show notification: $callState, $phoneNumber, $studentName, $parentName")
            
            // Create unique key for this notification
            val notificationKey = "$callState-$phoneNumber-$studentName-$parentName"
            val currentTime = System.currentTimeMillis()
            
            // Check if this is a duplicate notification within 2 seconds
            if (lastNotificationKey == notificationKey && (currentTime - lastNotificationTime) < 2000) {
                Log.d(TAG, "Skipping duplicate notification within 2 seconds")
                return
            }
            
            // Update last notification tracking
            lastNotificationKey = notificationKey
            lastNotificationTime = currentTime
            
            Log.d(TAG, "Showing notification with student info: $callState, $phoneNumber, $studentName, $parentName")
            
            val notificationManager = reactApplicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            
            // Create intent to open the app
            val launchIntent = reactApplicationContext.packageManager.getLaunchIntentForPackage(reactApplicationContext.packageName)
            launchIntent?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            
            val pendingIntent = PendingIntent.getActivity(
                reactApplicationContext,
                0,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            // Create notification content based on available data
            val (title, body) = when (callState) {
                "RINGING" -> {
                    if (!studentName.isNullOrEmpty() && !parentName.isNullOrEmpty()) {
                        "Incoming Call - $studentName" to "Parent: $parentName"
                    } else if (!studentName.isNullOrEmpty()) {
                        "Incoming Call - $studentName" to "Phone: ${phoneNumber ?: "Unknown"}"
                    } else {
                        "Incoming Call Detected" to "Call from: ${phoneNumber ?: "Unknown"}"
                    }
                }
                "OUTGOING" -> {
                    if (!studentName.isNullOrEmpty() && !parentName.isNullOrEmpty()) {
                        "Outgoing Call - $studentName" to "Parent: $parentName"
                    } else if (!studentName.isNullOrEmpty()) {
                        "Outgoing Call - $studentName" to "Phone: ${phoneNumber ?: "Unknown"}"
                    } else {
                        "Outgoing Call Detected" to "Calling: ${phoneNumber ?: "Unknown"}"
                    }
                }
                "OFFHOOK" -> {
                    if (!studentName.isNullOrEmpty() && !parentName.isNullOrEmpty()) {
                        "Call Active - $studentName" to "Parent: $parentName"
                    } else if (!studentName.isNullOrEmpty()) {
                        "Call Active - $studentName" to "Phone: ${phoneNumber ?: "Unknown"}"
                    } else {
                        "Call Active" to "Call with: ${phoneNumber ?: "Unknown"}"
                    }
                }
                else -> {
                    if (!studentName.isNullOrEmpty()) {
                        "Call Detected - $studentName" to "Phone: ${phoneNumber ?: "Unknown"}"
                    } else {
                        "Call Detected" to "Phone: ${phoneNumber ?: "Unknown"}"
                    }
                }
            }

            val notification = NotificationCompat.Builder(reactApplicationContext, CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(body)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)
                .setDefaults(Notification.DEFAULT_ALL)
                .build()

            notificationManager.notify(NOTIFICATION_ID, notification)
            Log.d(TAG, "Notification displayed: $title - $body")
            
        } catch (e: Exception) {
            Log.e(TAG, "Error showing notification with student info: ${e.message}", e)
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
    
    private fun createNotificationChannel() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val notificationManager = reactApplicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                val channel = NotificationChannel(
                    CHANNEL_ID,
                    "Call Detection Events",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Notifications for call detection when app is in foreground"
                    enableLights(true)
                    enableVibration(true)
                    setShowBadge(true)
                }
                notificationManager.createNotificationChannel(channel)
                Log.d(TAG, "Notification channel created")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error creating notification channel: ${e.message}", e)
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
            // If we can't send to JS, show fallback notification
            showFallbackNotification(params)
        }
    }
    
    private fun showFallbackNotification(params: WritableMap?) {
        try {
            val state = params?.getString("state") ?: "UNKNOWN"
            val phoneNumber = params?.getString("phoneNumber") ?: "Unknown"
            
            if (state == "RINGING" || state == "OUTGOING") {
                // Show basic notification as fallback
                showNotificationWithStudentInfo(state, phoneNumber, null, null)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error showing fallback notification: ${e.message}", e)
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