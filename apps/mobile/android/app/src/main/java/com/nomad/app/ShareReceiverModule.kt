package com.nomad.app

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Holds the most recent shared text received via the system share sheet so the
 * JS side can pick it up after the React context is ready.
 *
 * The static buffer survives Activity recreation; JS calls
 * `consumeSharedText()` exactly once and the buffer is cleared.
 */
class ShareReceiverModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "ShareReceiver"

    @ReactMethod
    fun consumeSharedText(promise: Promise) {
        val text = pendingSharedText
        pendingSharedText = null
        promise.resolve(text)
    }

    companion object {
        @Volatile
        private var pendingSharedText: String? = null

        @JvmStatic
        fun setPendingSharedText(text: String) {
            pendingSharedText = text
        }
    }
}
