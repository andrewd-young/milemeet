## Milemeet

Milemeet is a React Native / Expo app for finding local running partners. It uses Supabase as a backend.

---

### Prerequisites

- **macOS** (required for iOS simulator)
- **Node.js** ≥ 18 and **npm**
- **Xcode** with an iOS simulator configured (for simulator runs)
- **Expo Go** installed on your physical iPhone (for on-device runs)
- A Supabase project and API keys (see `SUPABASE_SETUP.md`)

---

### 1. Install dependencies

```bash
npm install
```

---

### 2. Configure environment

Create a `.env` file in the project root (never commit this):

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Copy your **Project URL** and **anon/public key** from the Supabase dashboard → Project Settings → API.

---

### 3. Run on the iOS Simulator

> Requires Xcode and at least one simulator configured.

```bash
npm run ios
```

This starts the Expo dev server and automatically launches the app in your default iOS simulator. If you have multiple simulators, you can pick one from the Expo terminal prompt (press `i` then select from the list), or target one explicitly:

```bash
npx expo start --ios --simulator "iPhone 16"
```

Replace `"iPhone 16"` with the name of any simulator listed in Xcode → Window → Devices and Simulators.

---

### 4. Run on your iPhone with Expo Go

> Requires the **Expo Go** app installed from the App Store on your iPhone.

**Your phone and Mac must be on the same Wi-Fi network.**

```bash
npm run start
```

When the QR code appears in the terminal:

1. Open the **Camera** app on your iPhone.
2. Point it at the QR code.
3. Tap the notification that says **"Open in Expo Go"**.

The app will bundle and launch in Expo Go within a few seconds.

If the QR code scan doesn't work, try switching to tunnel mode:

```bash
npx expo start --tunnel
```

Tunnel mode routes traffic through Expo's servers, so your devices don't need to be on the same network. It's slower but more reliable on restricted networks.

---

### 5. Database types (optional)

Once your Supabase project is configured you can regenerate the typed database definitions after schema changes:

```bash
npm run generate:types
```

Requires the Supabase CLI installed and logged in (`supabase login`). This updates `src/types/supabase.ts`.

---

### Project structure

```
src/
  app/
    App.tsx                  — root navigation setup
    context/                 — OnboardingContext (multi-step form state)
    navigation/              — bottom tab navigator
    screens/
      onboarding/            — 7-step onboarding flow
      NearbyRunnersScreen    — runner feed
      ConnectionsScreen      — your running circle
      ProfileScreen          — read-only profile view
      EditProfileScreen      — edit profile
      RunnerDetailScreen     — individual runner + save to circle
  lib/api/supabase.ts        — Supabase client
  types/                     — navigation types + Supabase DB types
```
