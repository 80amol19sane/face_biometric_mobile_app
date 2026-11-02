# Face Attendance (mobile)

Android app for the `face_biometric` Frappe app. An employee enrols their face on their own phone,
HR approves it, and from then on they punch IN/OUT with a face check.

## How a check-in is verified

1. **Liveness** – the app asks for a random action (turn your head, or smile) that a still photo cannot do.
2. **Embedding on the phone** – ML Kit finds the face, the crop goes through MobileFaceNet (TFLite) and
   yields a 192-value vector. No photo ever leaves the phone, and none is kept.
3. **Device signature** – the phone holds an ECDSA P-256 key in the Android Keystore (StrongBox when
   available). It signs `fb1|nonce|IN|lat|lon|sha256(embedding)`.
4. **Server** – checks the one-time nonce, the signature against the key registered for that employee,
   then the cosine similarity against the approved template. The time is the server's, not the phone's.

```
mobile/
  app/                  expo-router screens: server, login, home, enrol, checkin
  src/api/              Frappe client (cookie session) and face_biometric.api.* calls
  src/face/             detection, quality gate, liveness, crop, TFLite embedding
  src/lib/              embedding wire format and signing payload (unit-tested against the backend format)
  src/device/           per-login key and Biometric Device registration
  modules/device-key/   Kotlin Expo module over the Android Keystore
  plugins/              config plugin: release signing from environment variables
scripts/fetch-model.sh  downloads the face model (not committed; see Licensing)
```

## Build an APK

Prerequisites: Node 20+, JDK 17, Android SDK (`ANDROID_HOME`).

```bash
./scripts/fetch-model.sh                 # face model, checksum-verified
cd mobile && npm install
npx expo prebuild --platform android --clean

# Release signing: keep the keystore OUTSIDE the repo
export FB_KEYSTORE_PATH=... FB_KEYSTORE_PASSWORD=... FB_KEY_ALIAS=... FB_KEY_PASSWORD=...
echo "sdk.dir=$ANDROID_HOME" > android/local.properties
cd android && ./gradlew assembleRelease
# -> mobile/android/app/build/outputs/apk/release/app-release.apk
```

`npm test` runs the unit tests; `npm run typecheck` runs `tsc`.

## Backend requirements

- `face_biometric` installed on the site, **Face Biometric Settings → Embedding Model** = `mobilefacenet-v1`.
- The employee's login must be linked to an Active Employee (`Employee.user_id`).
- The site must be served over **https** (the app refuses plain http).
- Enrolment stays *Pending* until HR approves the Face Template (unless approval is switched off in settings).

## Licensing: read before shipping

The development model comes from a public GitHub repository that publishes **no licence**, so it is
fetched at build time and not redistributed here. Before a real rollout, replace it with a model you
are licensed to use and change `MODEL_VERSION` in `mobile/src/face/config.ts` together with the
backend setting. Templates from different models are not comparable, so everyone must re-enrol.

## Known limits

- Liveness is a challenge-response check, not a certified presentation-attack detector; a replayed
  video of the right action can pass.
- The face is cropped by bounding box, not landmark-aligned. Tune *Match Threshold* from the
  *Face Verification Log* similarities after real use.
- Android only. iOS needs a Secure Enclave version of `modules/device-key`.
- This is a per-employee phone design. A shared kiosk would need new backend endpoints.
