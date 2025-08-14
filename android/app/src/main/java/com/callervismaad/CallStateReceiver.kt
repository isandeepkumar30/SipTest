package com.callervismaad

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.telephony.TelephonyManager
import android.util.Log
import androidx.core.app.NotificationCompat

class CallStateReceiver : BroadcastReceiver() {

    companion object {
        const val CALL_STATE_IDLE = "IDLE"
        const val CALL_STATE_RINGING = "RINGING"
        const val CALL_STATE_OFFHOOK = "OFFHOOK"
        const val CALL_STATE_OUTGOING = "OUTGOING"
        private const val TAG = "CallStateReceiver"
        private const val CHANNEL_ID = "call_detection_channel"
        private const val NOTIFICATION_ID = 1001
    }

    override fun onReceive(context: Context?, intent: Intent?) {
        Log.d(TAG, "BroadcastReceiver triggered with action: ${intent?.action}")
        
        when (intent?.action) {
            TelephonyManager.ACTION_PHONE_STATE_CHANGED -> {
                val state = intent.getStringExtra(TelephonyManager.EXTRA_STATE)
                val phoneNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER)

                Log.d(TAG, "Raw state: $state, Raw phone number: $phoneNumber")

                val callState = when (state) {
                    TelephonyManager.EXTRA_STATE_IDLE -> CALL_STATE_IDLE
                    TelephonyManager.EXTRA_STATE_RINGING -> CALL_STATE_RINGING
                    TelephonyManager.EXTRA_STATE_OFFHOOK -> CALL_STATE_OFFHOOK
                    else -> {
                        Log.w(TAG, "Unknown state received: $state")
                        CALL_STATE_IDLE
                    }
                }

                Log.d(TAG, "Mapped call state: $callState, Phone number: $phoneNumber")

                // Forward to CallDetectionManager if available
                forwardToReactNative(context, callState, phoneNumber)
                
                // Note: Notification will be shown from React Native side after API call
            }

            Intent.ACTION_NEW_OUTGOING_CALL -> {
                val phoneNumber = intent.getStringExtra(Intent.EXTRA_PHONE_NUMBER)
                Log.d(TAG, "Outgoing call detected: $phoneNumber")

                // Forward to CallDetectionManager if available
                forwardToReactNative(context, CALL_STATE_OUTGOING, phoneNumber)
                
                // Note: Notification will be shown from React Native side after API call
            }

            else -> {
                Log.d(TAG, "Unknown intent received: ${intent?.action}")
            }
        }
    }

    private fun forwardToReactNative(context: Context?, callState: String, phoneNumber: String?) {
        try {
            // Try to get the CallDetectionManager instance
            val manager = CallDetectionManagerAndroid.getInstance()
            if (manager != null) {
                Log.d(TAG, "Forwarding to CallDetectionManager: $callState, $phoneNumber")
                manager.onCallStateChanged(callState, phoneNumber)
            } else {
                Log.w(TAG, "CallDetectionManager instance not available - call detection not started yet")
                // Store the event for later processing if needed
                CallDetectionManagerAndroid.addPendingEvent(callState, phoneNumber)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error forwarding to React Native: ${e.message}", e)
        }
    }

    // Add method to show notification with student details - called from React Native
    fun showCallNotificationWithStudentInfo(context: Context, callState: String, phoneNumber: String?, studentName: String?, parentName: String?) {
        try {
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            
            // Create notification channel for Android 8.0+
            createNotificationChannel(notificationManager)
            
            // Create intent to open the app
            val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
            launchIntent?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            
            val pendingIntent = PendingIntent.getActivity(
                context,
                0,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            // Create notification content based on available data
            val (title, body) = when (callState) {
                CALL_STATE_RINGING -> {
                    if (!studentName.isNullOrEmpty() && !parentName.isNullOrEmpty()) {
                        "Incoming Call - ${studentName}" to "Parent: ${parentName}"
                    } else if (!studentName.isNullOrEmpty()) {
                        "Incoming Call - ${studentName}" to "Phone: ${phoneNumber ?: "Unknown"}"
                    } else {
                        "Incoming Call Detected" to "Call from: ${phoneNumber ?: "Unknown"}"
                    }
                }
                CALL_STATE_OUTGOING -> {
                    if (!studentName.isNullOrEmpty() && !parentName.isNullOrEmpty()) {
                        "Outgoing Call - ${studentName}" to "Parent: ${parentName}"
                    } else if (!studentName.isNullOrEmpty()) {
                        "Outgoing Call - ${studentName}" to "Phone: ${phoneNumber ?: "Unknown"}"
                    } else {
                        "Outgoing Call Detected" to "Calling: ${phoneNumber ?: "Unknown"}"
                    }
                }
                CALL_STATE_OFFHOOK -> {
                    if (!studentName.isNullOrEmpty() && !parentName.isNullOrEmpty()) {
                        "Call Active - ${studentName}" to "Parent: ${parentName}"
                    } else if (!studentName.isNullOrEmpty()) {
                        "Call Active - ${studentName}" to "Phone: ${phoneNumber ?: "Unknown"}"
                    } else {
                        "Call Active" to "Call with: ${phoneNumber ?: "Unknown"}"
                    }
                }
                else -> {
                    if (!studentName.isNullOrEmpty()) {
                        "Call Detected - ${studentName}" to "Phone: ${phoneNumber ?: "Unknown"}"
                    } else {
                        "Call Detected" to "Phone: ${phoneNumber ?: "Unknown"}"
                    }
                }
            }

            // Build notification
            val notification = NotificationCompat.Builder(context, CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(body)
                .setSmallIcon(R.mipmap.ic_launcher) // Make sure you have this icon
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)
                .setDefaults(Notification.DEFAULT_ALL)
                .build()

            // Show notification
            notificationManager.notify(NOTIFICATION_ID, notification)
            Log.d(TAG, "Call notification displayed: $title - $body")
            
        } catch (e: Exception) {
            Log.e(TAG, "Error showing call notification: ${e.message}", e)
        }
    }

    private fun createNotificationChannel(notificationManager: NotificationManager) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Call Detection",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifications for call detection events"
                enableLights(true)
                enableVibration(true)
                setShowBadge(true)
            }
            notificationManager.createNotificationChannel(channel)
        }
    }
}