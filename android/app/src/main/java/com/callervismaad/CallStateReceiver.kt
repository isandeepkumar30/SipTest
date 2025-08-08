package com.callervismaad

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.TelephonyManager
import android.util.Log

class CallStateReceiver : BroadcastReceiver() {

    companion object {
        const val CALL_STATE_IDLE = "IDLE"
        const val CALL_STATE_RINGING = "RINGING"
        const val CALL_STATE_OFFHOOK = "OFFHOOK"
        const val CALL_STATE_OUTGOING = "OUTGOING"
        private const val TAG = "CallStateReceiver"
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
            }

            Intent.ACTION_NEW_OUTGOING_CALL -> {
                val phoneNumber = intent.getStringExtra(Intent.EXTRA_PHONE_NUMBER)
                Log.d(TAG, "Outgoing call detected: $phoneNumber")

                // Forward to CallDetectionManager if available
                forwardToReactNative(context, CALL_STATE_OUTGOING, phoneNumber)
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
}