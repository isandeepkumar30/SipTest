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

data class NotificationTracker(
    val phoneNumber: String,
    val lastState: String,
    val lastNotificationTime: Long,
    val notificationId: Int
)

class CallDetectionManagerAndroid(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    companion object {
        private const val TAG = "CallDetectionManager"
        private const val CHANNEL_ID = "call_detection_rn_channel"
        private const val BASE_NOTIFICATION_ID = 1002
        private const val DEFAULT_NOTIFICATION_ID = 1001
        private var instance: CallDetectionManagerAndroid? = null
        private val pendingEvents = mutableListOf<PendingCallEvent>()
        
        // Track notifications per phone number
        private val notificationTrackers = mutableMapOf<String, NotificationTracker>()
        
        fun getInstance(): CallDetectionManagerAndroid? = instance
        
        fun addPendingEvent(state: String, phoneNumber: String?) {
            Log.d(TAG, "Adding pending event: $state, $phoneNumber")
            pendingEvents.add(PendingCallEvent(state, phoneNumber))
        }
        
        // Generate consistent notification ID based on phone number
        private fun getNotificationIdForNumber(phoneNumber: String?): Int {
            return if (phoneNumber.isNullOrEmpty()) {
                DEFAULT_NOTIFICATION_ID
            } else {
                // Create a consistent ID based on phone number hash
                val hash = phoneNumber.hashCode()
                BASE_NOTIFICATION_ID + Math.abs(hash % 1000)
            }
        }
        
        // Clean up old notification trackers (older than 1 hour)
        private fun cleanupOldTrackers() {
            val currentTime = System.currentTimeMillis()
            val oneHourAgo = currentTime - (60 * 60 * 1000) // 1 hour
            
            notificationTrackers.entries.removeAll { entry ->
                entry.value.lastNotificationTime < oneHourAgo
            }
        }
    }
    
    private var programmaticReceiver: ProgrammaticCallReceiver? = null
    
    init {
        instance = this
        createNotificationChannel()
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
                programmaticReceiver = ProgrammaticCallReceiver(this)
                val intentFilter = IntentFilter().apply {
                    addAction(TelephonyManager.ACTION_PHONE_STATE_CHANGED)
                    addAction(Intent.ACTION_NEW_OUTGOING_CALL)
                    priority = 999
                }
                
                context.registerReceiver(programmaticReceiver as BroadcastReceiver, intentFilter)
                Log.d(TAG, "Programmatic call receiver registered successfully")
                
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
    
    @ReactMethod
    fun showNotificationWithStudentInfo(callState: String, phoneNumber: String?, studentName: String?, parentName: String?) {
        try {
            Log.d(TAG, "Request to show notification: $callState, $phoneNumber, $studentName, $parentName")
            
            // Clean up old trackers periodically
            cleanupOldTrackers()
            
            val normalizedPhoneNumber = phoneNumber?.trim() ?: "Unknown"
            val notificationId = getNotificationIdForNumber(normalizedPhoneNumber)
            val currentTime = System.currentTimeMillis()
            
            // Check if we should show/update notification
            val existingTracker = notificationTrackers[normalizedPhoneNumber]
            if (existingTracker != null) {
                val timeDiff = currentTime - existingTracker.lastNotificationTime
                val isSameState = existingTracker.lastState == callState
                
                // Skip if same state within 2 seconds (prevent spam)
                if (isSameState && timeDiff < 2000) {
                    Log.d(TAG, "Skipping duplicate notification: same state within 2 seconds")
                    return
                }
            }
            
            Log.d(TAG, "Showing notification with phone-based ID: $notificationId")
            
            val notificationManager = reactApplicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            
            // Create intent to open the app
            val launchIntent = reactApplicationContext.packageManager.getLaunchIntentForPackage(reactApplicationContext.packageName)
            launchIntent?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            
            val pendingIntent = PendingIntent.getActivity(
                reactApplicationContext,
                notificationId,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            // Create notification content based on available data
            val (title, body) = when (callState) {
                "RINGING" -> {
                    when {
                        !studentName.isNullOrEmpty() && !parentName.isNullOrEmpty() -> 
                            "📞 Incoming Call - $studentName" to "Parent: $parentName • ${formatPhoneNumber(normalizedPhoneNumber)}"
                        !studentName.isNullOrEmpty() -> 
                            "📞 Incoming Call - $studentName" to "Phone: ${formatPhoneNumber(normalizedPhoneNumber)}"
                        else -> 
                            "📞 Incoming Call" to "From: ${formatPhoneNumber(normalizedPhoneNumber)}"
                    }
                }
                "OUTGOING" -> {
                    when {
                        !studentName.isNullOrEmpty() && !parentName.isNullOrEmpty() -> 
                            "📱 Outgoing Call - $studentName" to "Parent: $parentName • ${formatPhoneNumber(normalizedPhoneNumber)}"
                        !studentName.isNullOrEmpty() -> 
                            "📱 Outgoing Call - $studentName" to "Phone: ${formatPhoneNumber(normalizedPhoneNumber)}"
                        else -> 
                            "📱 Outgoing Call" to "To: ${formatPhoneNumber(normalizedPhoneNumber)}"
                    }
                }
                "OFFHOOK" -> {
                    when {
                        !studentName.isNullOrEmpty() && !parentName.isNullOrEmpty() -> 
                            "📞 Call Active - $studentName" to "Parent: $parentName • ${formatPhoneNumber(normalizedPhoneNumber)}"
                        !studentName.isNullOrEmpty() -> 
                            "📞 Call Active - $studentName" to "Phone: ${formatPhoneNumber(normalizedPhoneNumber)}"
                        else -> 
                            "📞 Call Active" to "With: ${formatPhoneNumber(normalizedPhoneNumber)}"
                    }
                }
                "IDLE" -> {
                    when {
                        !studentName.isNullOrEmpty() && !parentName.isNullOrEmpty() -> 
                            "📵 Call Ended - $studentName" to "Parent: $parentName • ${formatPhoneNumber(normalizedPhoneNumber)}"
                        !studentName.isNullOrEmpty() -> 
                            "📵 Call Ended - $studentName" to "Phone: ${formatPhoneNumber(normalizedPhoneNumber)}"
                        else -> 
                            "📵 Call Ended" to "With: ${formatPhoneNumber(normalizedPhoneNumber)}"
                    }
                }
                else -> {
                    when {
                        !studentName.isNullOrEmpty() -> 
                            "📞 Call Event - $studentName" to "Phone: ${formatPhoneNumber(normalizedPhoneNumber)}"
                        else -> 
                            "📞 Call Event" to "Phone: ${formatPhoneNumber(normalizedPhoneNumber)}"
                    }
                }
            }

            // Determine notification behavior based on call state
            val (priority, category, autoCancel, ongoing) = when (callState) {
                "RINGING" -> Tuple4(NotificationCompat.PRIORITY_MAX, NotificationCompat.CATEGORY_CALL, false, true)
                "OUTGOING" -> Tuple4(NotificationCompat.PRIORITY_HIGH, NotificationCompat.CATEGORY_CALL, false, true)
                "OFFHOOK" -> Tuple4(NotificationCompat.PRIORITY_HIGH, NotificationCompat.CATEGORY_CALL, false, true)
                "IDLE" -> Tuple4(NotificationCompat.PRIORITY_LOW, NotificationCompat.CATEGORY_STATUS, true, false)
                else -> Tuple4(NotificationCompat.PRIORITY_DEFAULT, NotificationCompat.CATEGORY_EVENT, true, false)
            }

            val notificationBuilder = NotificationCompat.Builder(reactApplicationContext, CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(body)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setPriority(priority)
                .setCategory(category)
                .setAutoCancel(autoCancel)
                .setOngoing(ongoing)
                .setContentIntent(pendingIntent)
                .setWhen(currentTime)
                .setShowWhen(true)
                .setGroup("CALL_NOTIFICATIONS_${normalizedPhoneNumber}")
                .setColor(0xFFB6488D.toInt()) // Your app's theme color
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                
            // Add different notification styles based on call state
            if (callState == "RINGING" || callState == "OUTGOING") {
                notificationBuilder
                    .setDefaults(Notification.DEFAULT_ALL)
                    .setVibrate(longArrayOf(0, 250, 250, 250))
            } else if (callState == "IDLE") {
                // For call ended, make it less intrusive
                notificationBuilder
                    .setDefaults(Notification.DEFAULT_LIGHTS)
                    .setVibrate(longArrayOf(0, 100))
            } else {
                notificationBuilder.setDefaults(Notification.DEFAULT_LIGHTS)
            }

            // Add action buttons for active calls
            if (callState == "RINGING" || callState == "OFFHOOK") {
                // You can add action buttons here if needed
                // .addAction(R.drawable.ic_call_end, "End Call", endCallPendingIntent)
            }

            val notification = notificationBuilder.build()

            // Show notification
            notificationManager.notify(notificationId, notification)
            
            // Update tracker
            notificationTrackers[normalizedPhoneNumber] = NotificationTracker(
                phoneNumber = normalizedPhoneNumber,
                lastState = callState,
                lastNotificationTime = currentTime,
                notificationId = notificationId
            )

            Log.d(TAG, "Notification displayed with ID $notificationId: $title - $body")
            
            // Auto-clear IDLE notifications after 10 seconds
            if (callState == "IDLE") {
                scheduleNotificationClear(notificationId, 10000)
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Error showing notification with student info: ${e.message}", e)
        }
    }
    
    // Helper function to format phone numbers nicely
    private fun formatPhoneNumber(phoneNumber: String): String {
        if (phoneNumber == "Unknown" || phoneNumber.isEmpty()) return "Unknown"
        
        // Basic formatting - you can enhance this based on your region
        return when {
            phoneNumber.length == 10 -> "${phoneNumber.substring(0, 3)}-${phoneNumber.substring(3, 6)}-${phoneNumber.substring(6)}"
            phoneNumber.length == 11 && phoneNumber.startsWith("1") -> "+1 ${phoneNumber.substring(1, 4)}-${phoneNumber.substring(4, 7)}-${phoneNumber.substring(7)}"
            else -> phoneNumber
        }
    }
    
    // Helper data class for multiple return values
    private data class Tuple4<A, B, C, D>(val first: A, val second: B, val third: C, val fourth: D)
    
    // Schedule notification clearing
    private fun scheduleNotificationClear(notificationId: Int, delayMs: Long) {
        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
            try {
                val notificationManager = reactApplicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                notificationManager.cancel(notificationId)
                Log.d(TAG, "Auto-cleared notification ID: $notificationId")
            } catch (e: Exception) {
                Log.e(TAG, "Error auto-clearing notification: ${e.message}", e)
            }
        }, delayMs)
    }
    
    @ReactMethod
    fun clearNotificationsForNumber(phoneNumber: String?) {
        try {
            val normalizedPhoneNumber = phoneNumber?.trim() ?: return
            val notificationManager = reactApplicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            val notificationId = getNotificationIdForNumber(normalizedPhoneNumber)
            
            notificationManager.cancel(notificationId)
            notificationTrackers.remove(normalizedPhoneNumber)
            
            Log.d(TAG, "Cleared notification for number: $normalizedPhoneNumber (ID: $notificationId)")
        } catch (e: Exception) {
            Log.e(TAG, "Error clearing notification: ${e.message}", e)
        }
    }
    
    @ReactMethod
    fun clearAllCallNotifications() {
        try {
            val notificationManager = reactApplicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            
            // Clear all tracked notifications
            notificationTrackers.values.forEach { tracker ->
                notificationManager.cancel(tracker.notificationId)
            }
            
            notificationTrackers.clear()
            
            Log.d(TAG, "All call notifications cleared")
        } catch (e: Exception) {
            Log.e(TAG, "Error clearing all notifications: ${e.message}", e)
        }
    }
    
    @ReactMethod
    fun getActiveNotificationCount(promise: Promise) {
        promise.resolve(notificationTrackers.size)
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
                    description = "Notifications for call detection events with student information"
                    enableLights(true)
                    lightColor = 0xFFB6488D.toInt()
                    enableVibration(true)
                    vibrationPattern = longArrayOf(0, 250, 250, 250)
                    setShowBadge(true)
                    setSound(
                        android.provider.Settings.System.DEFAULT_NOTIFICATION_URI,
                        android.media.AudioAttributes.Builder()
                            .setUsage(android.media.AudioAttributes.USAGE_NOTIFICATION)
                            .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build()
                    )
                }
                notificationManager.createNotificationChannel(channel)
                Log.d(TAG, "Notification channel created with enhanced settings")
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
        notificationTrackers.clear()
    }
}

// Programmatic receiver remains the same
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

