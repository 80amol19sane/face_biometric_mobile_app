# Face Attendance (mobile)

An Android app that turns a phone into a **shared attendance kiosk** for the `face_biometric` Frappe app, with a
protected **admin mode** for HR. Employees punch IN and OUT by face or by PIN, with no login. It replaces
traditional biometric devices at the office entrance.

```
Employee mode (default screen)            Admin mode (HR Manager / System Manager)
─────────────────────────────             ───────────────────────────────────────
Walk up → face is found → liveness        Sign in with a Frappe account
  → matched → "Good morning, Deepak"      Overview: counts, today's attendance
Or: PIN → employee ID → keypad            Employees: search, register / update face,
  → proof photo → recorded                  set / reset / disable PIN
Returns to the camera on its own          Logs, failed attempts, devices, sync, settings
```

## Screens

| Area | Screen | Route |
| --- | --- | --- |
| Employee | Kiosk: camera, face frame, liveness, result, not recognised | `/` |
| Employee | PIN: employee ID, keypad, proof photo, result | `/pin` |
| Admin | Sign in (role-checked) | `/admin/login` |
| Admin | Overview · Employees · Logs · More (tabs) | `/admin` |
| Admin | Employee profile, face register / update, PIN set / reset / disable, biometric history | `/admin/employee/[id]`, `register/[id]`, `pin/[id]`, `history/[id]` |
| Admin | Failed attempts, devices (register this phone as a kiosk), sync status, settings | `/admin/failed`, `devices`, `sync`, `settings` |

The design was reviewed and approved before the build. The app follows the phone's light or dark setting; admin can override it in Settings.

## How attendance is verified

**Face punch (no photo leaves the phone)**

1. The kiosk waits for exactly one face, asks for a random action (turn your head or smile), then takes a straight-on frame.
2. ML Kit finds the face and MobileFaceNet (TFLite) turns the crop into a 192-value vector on the phone.
3. The kiosk asks the server for a one-time nonce, then sends the vector with an **ECDSA P-256 signature** made by the kiosk's
   Android Keystore key over `fb2|identify|device|nonce|sha256(vector)`.
4. The server checks the nonce and signature, compares the vector with every enrolled face, and accepts only a match above the
   threshold that also **beats the runner-up by a margin**. It punches the right person IN or OUT using the server's clock.

**PIN punch (with proof)**

1. The person enters their employee ID; the kiosk shows only their name to confirm.
2. They enter a 4–6 digit PIN, then a proof photo is taken.
3. The server verifies a salted hash of the PIN. Every wrong ID or PIN returns the same message at the same cost. Five wrong
   tries lock that employee for 15 minutes; five failures in a minute pause the kiosk for a minute.
4. The photo is stored privately against the punch and deleted automatically after the retention period (default 30 days).

## First-time setup

1. Install the `face_biometric` app on the site and run `bench migrate`. Set **Face Biometric Settings → Embedding Model** to `mobilefacenet-v1`.
2. Install the APK on the phone that will be the kiosk. Enter the site address (https only).
3. Tap the **shield icon**, sign in as an **HR Manager** or **System Manager**.
4. **More → Devices → Register this phone as a kiosk.** The phone creates a signing key and the server trusts it from now on.
5. In **Employees**, register each person's face in person (**Register**), then set a PIN if wanted.
6. Leave admin. The phone is now the kiosk.

The kiosk blanks the screen when nobody has been in front of it for a while (Settings → This phone → sleep after, default 1 minute, or never). The camera keeps looking once a second for a face and wakes the screen when one appears; a tap also wakes it. Nothing is matched or sent while it is blank. Keep the phone plugged in.

Pin the app to the screen (Android *App pinning*) or use device management so visitors cannot leave it; Android cannot lock a phone into one app from inside the app.

## Project layout

```
mobile/
  app/                  expo-router screens (index = kiosk, pin, server, admin/*)
  src/api/              Frappe client, kiosk calls (signed, guest) and admin calls (cookie session)
  src/face/             detection, quality gate, liveness, crop, TFLite embedding, useFaceCapture hook
  src/kiosk/            kiosk key registration and boot checks
  src/lib/              wire formats, signing payloads, PIN keypad rules, clock, dates (unit-tested)
  src/components/       kiosk chrome and sheets, admin page frame, shared UI
  modules/device-key/   Kotlin Expo module over the Android Keystore
  modules/model-asset/  copies the face model out of the APK so TFLite can load it
  plugins/              config plugins: release signing, model asset
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
cd android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
# -> mobile/android/app/build/outputs/apk/release/app-release.apk
```

Bump `android.versionCode` in `mobile/app.json` for every release. `npm test` runs the unit tests; `npm run typecheck` runs `tsc`.

## Offline attendance

If the kiosk cannot reach the server it keeps working, as a fallback, for face check-ins only. It is off until HR turns it on twice: **Settings → Offline attendance** (everyone) and **Devices → Take attendance offline** (for each kiosk).

- **The phone never decides who someone is.** It keeps no employee faces. It saves the visitor's own scan, encrypted with a key that lives in the phone's secure hardware, and shows "Saved offline". The server matches it when the connection returns, with the same rule as an online check-in.
- **Dating a scan.** A phone clock can be changed, so each scan is dated from the server's time at the last contact plus the time the phone has run since (a changed clock cannot move that). The server also compares the phone's own clock.
- **Settling at sync.** Each scan is signed by the kiosk key and quotes the hash of the one before it, so a missing or reordered scan shows. The server then makes the Employee Checkin with the real time, drops repeats within 2 minutes, refuses faces it does not know, and **holds for HR** anything it cannot trust: older than the offline window (72 h by default), a restarted phone, a clock that disagrees, or a broken chain. HR approves or rejects each one under **More → Offline review**, with a note. Unreviewed scans are closed as rejected after the review window (90 days).
- **Limits.** PIN is not available offline. The result screen says "Saved offline" and cannot name the person or show the shift. A kiosk stops saving scans after the offline window and asks to be connected. Up to 300 scans wait on the phone. Re-registering a phone replaces its key, so connect and send waiting scans first.
- **Data protection.** No employee data or photos are stored offline; the scan is deleted from the phone when the server settles it; the file is encrypted and excluded from backup; every batch, held reason and HR decision is recorded in the Face Verification Log.

## Security and privacy

- The kiosk has no user login. Its requests are trusted because an HR admin registered its hardware-backed key; a device id alone is never a credential. Revoke a kiosk under **More → Devices**.
- Admin sessions end after 5 minutes without use and as soon as the app goes to the background. The kiosk never keeps an admin cookie.
- Face templates are numbers, encrypted on the server. PINs are stored as salted hashes and cannot be read back. Proof photos are private files with automatic deletion.
- Face enrolment is HR-only; nobody can enrol or change their own face or PIN.

## Licensing: read before shipping

The development model comes from a public GitHub repository that publishes **no licence**, so it is fetched at build time and not
redistributed here. Before a real rollout, replace it with a model you are licensed to use and change `MODEL_VERSION` in
`mobile/src/face/config.ts` together with the backend setting. Templates from different models are not comparable, so everyone must re-enrol.

## Known limits

- Liveness is a challenge-response check, not a certified presentation-attack detector; a replayed video of the right action can pass.
  On a walk-up kiosk this matters more than on a personal phone. A passive anti-spoof model is the recommended next step.
- The face is cropped by bounding box, not landmark-aligned. Tune **Match threshold** from *Failed attempts* and the *Face Verification Log* after real use.
- The kiosk needs a connection; it does not queue punches offline.
- Android only. iOS needs a Secure Enclave version of `modules/device-key`.
- PIN attendance is weaker than a face check (it can be shared or watched). The proof photo and lockout are the safeguards.
