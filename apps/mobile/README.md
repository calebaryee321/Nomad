# Nomad mobile app

Android-first React Native app. Receives Instagram (and other) shared links via
the system share sheet and saves them to your Nomad backend.

## Stack

- React Native 0.74 (Android-first)
- TypeScript
- Native Kotlin module `ShareReceiver` that captures `Intent.ACTION_SEND`
  (`text/plain`) and forwards the shared URL to JS

## Project layout

```
apps/mobile/
├── App.tsx               # root component, wires nav + share-intent bridge
├── index.js              # AppRegistry entry
├── app.json              # RN app metadata (component name)
├── src/
│   ├── api/client.ts     # typed fetch client for the Nomad backend
│   ├── navigation/nav.ts # tiny pure stack reducer (no react-navigation needed)
│   ├── screens/          # Login, Register, Home, AddItem
│   ├── shareIntent/      # extractFirstUrl + native bridge to ShareReceiver
│   ├── state/            # auth reducer + token store
│   └── theme/            # dark theme tokens
├── android/              # Gradle project, Kotlin native module, manifest
└── __tests__/            # Jest unit tests for pure modules
```

## Development

```bash
npm install                 # from repo root (npm workspaces)
npm --workspace @nomad/mobile run lint
npm --workspace @nomad/mobile run test
```

## Building the Android APK

You need a working Android SDK (API 34) and JDK 17.

```bash
cd apps/mobile
npm install                                # if not already done
npx react-native run-android               # debug build on a connected device
# or
cd android && ./gradlew assembleDebug      # produces app-debug.apk
```

Point the app at your backend by setting `NOMAD_API_BASE_URL` in `.env` or in
`android/app/src/main/res/values/strings.xml`. The default is
`http://10.0.2.2:8000` (Android emulator host alias for `localhost`).

## Share-intent flow (the core feature)

1. User opens an Instagram post/reel and taps **Share → Nomad**.
2. Android delivers `Intent.ACTION_SEND` with `text/plain` to `MainActivity`.
3. `MainActivity.handleShareIntent` extracts `EXTRA_TEXT` and calls
   `ShareReceiverModule.deliverSharedText(...)`, which:
   - **Buffers** the URL in a static field so it survives until JS is ready
     (cold-start case), AND
   - **Emits** an `onSharedText` device event when the React context is
     already alive (so foreground shares appear instantly).
   It then clears the intent extras so a configuration change (rotation)
   won't re-fire the same share.
4. JS in `App.tsx`:
   - On launch / `AppState → active`: calls `consumeSharedText()` to drain
     the native buffer.
   - Continuously: subscribes via `subscribeToShares(callback)` for live
     pushes.
5. If the user is logged in, the app navigates to **AddItem** with the URL
   pre-filled. If they are logged out, the URL is held in `pendingSharedUrl`
   state, the login screen is shown, and the URL is replayed to AddItem the
   moment auth completes — so a shared link is **never silently dropped**.
6. The user adds optional notes/tags and taps **Save**; the app `POST`s to
   `/api/v1/items`. The backend stores only the URL, the normalized form,
   and user metadata — no Instagram media is downloaded.
