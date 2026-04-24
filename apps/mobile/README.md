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
3. `MainActivity.handleShareIntent` extracts `EXTRA_TEXT` and stores it in
   `ShareReceiverModule.pendingSharedText`.
4. JS calls `consumeSharedText()` on launch and on every `AppState → active`.
5. If a URL is pending, the app navigates to **AddItem** with the URL
   pre-filled, the user adds optional notes/tags, and the URL is `POST`ed to
   `/api/v1/items`.
6. The backend stores only the URL, the normalized form, and user metadata —
   no Instagram media is downloaded.
