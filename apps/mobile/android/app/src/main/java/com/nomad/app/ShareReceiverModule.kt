package com.nomad.app

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * Bridge for the Android share-sheet flow.
 *
 * Two delivery paths exist because the share intent can arrive at any point
 * in the app lifecycle:
 *
 *  1. **Cold start / pre-RN-bridge**: the React context isn't ready when the
 *     SEND intent fires. We buffer the URL in a static field and JS pulls it
 *     via `consumeSharedText()` once it has mounted.
 *  2. **Warm / foreground**: the React context is alive. We emit an
 *     `onSharedText` device event in addition to buffering, so the JS side
 *     can react immediately even when no `AppState` change occurs (e.g. the
 *     user shares to Nomad while Nomad is already in the foreground in
 *     split-screen).
 */
class ShareReceiverModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    init {
        instance = this
    }

    override fun getName(): String = "ShareReceiver"

    override fun invalidate() {
        if (instance === this) instance = null
        super.invalidate()
    }

    @ReactMethod
    fun consumeSharedText(promise: Promise) {
        synchronized(LOCK) {
            val text = pendingSharedText
            pendingSharedText = null
            promise.resolve(text)
        }
    }

    // Required for RN to allow `addListener`/`removeListeners` on JS-side
    // event subscriptions (no-op implementations are the standard pattern).
    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}

    private fun emit(text: String) {
        val ctx = reactApplicationContext
        if (ctx.hasActiveCatalystInstance()) {
            ctx
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("onSharedText", text)
        }
    }

    companion object {
        private val LOCK = Any()

        @Volatile
        private var pendingSharedText: String? = null

        @Volatile
        private var instance: ShareReceiverModule? = null

        /**
         * Deliver shared text. Always buffers (in case JS isn't ready yet)
         * and additionally emits a device event when a React context is
         * available so foreground listeners pick it up immediately.
         *
         * Safe to call from the UI thread.
         */
        @JvmStatic
        fun deliverSharedText(context: ReactContext?, text: String) {
            synchronized(LOCK) { pendingSharedText = text }
            instance?.takeIf { context != null }?.emit(text)
        }
    }
}
