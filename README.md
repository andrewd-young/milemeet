## Milemeet

Milemeet is a React Native / Expo app for finding local running partners. It uses Supabase as a backend.

---

### Prerequisites

- **macOS** (required for iOS simulator)
- **Node.js** ≥ 18 and **npm**
- **Xcode** with an iOS simulator configured (for simulator runs)
- A Supabase project and API keys (see `SUPABASE_SETUP.md`)

> **Note:** Expo Go is no longer supported. The app uses native modules (`@expo/ui`, NativeTabs) that require a custom development build or a full native build.

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

### 3. Prebuild (required after cloning or after changing app.json)

This app uses **Continuous Native Generation (CNG)**: the `ios/` and `android/` folders are generated from `app.json`. You must regenerate them before building natively, and whenever you add a new Expo plugin or change native config:

```bash
npx expo prebuild --clean
```

`--clean` wipes and fully regenerates the native folders. Skip it if you only changed JS and want to preserve any hand-edits (though there are none in this repo).

---

### 4. Run on the iOS Simulator

```bash
npm run ios
```

Or target a specific simulator:

```bash
npx expo run:ios --device "iPhone 16"
```

`npx expo run:ios` compiles the native Xcode project directly (unlike the old `expo start --ios`, which used Expo Go). You need Xcode installed and the project prebuilt (step 3).

---

### 5. Run on a physical device

```bash
npx expo run:ios --device
```

Your device must be registered in your Apple Developer account and trusted on the Mac. This performs a debug build and installs it directly.

---

### 6. Database types (optional)

Regenerate typed database definitions after schema changes:

```bash
npm run generate:types
```

Requires the Supabase CLI installed and logged in (`supabase login`). Updates `src/types/supabase.ts`.

---

### Project structure

The project has **two `app/` directories** with different roles:

```
app/                           — Expo Router file-based routes (entry points only)
  _layout.tsx                  — root layout: SafeAreaProvider + OnboardingProvider + Stack
  index.tsx                    — auth check → redirects to tabs or onboarding
  (tabs)/
    _layout.tsx                — NativeTabs layout with SF Symbol icons
    index.tsx                  — re-exports NearbyRunnersScreen
    connections.tsx            — re-exports ConnectionsScreen
    profile.tsx                — re-exports ProfileScreen
  onboarding/
    index.tsx                  — email entry (step 1)
    verify.tsx                 — OTP verify (step 1 cont.)
    name.tsx                   — name entry (step 2)
    phone.tsx                  — phone entry (step 3)
    neighborhood.tsx           — neighborhood entry (step 4)
    pace-distance.tsx          — pace + distance (step 5)
    days-times.tsx             — available days/times (step 6)
    goals.tsx                  — running goals (step 7)
    strava.tsx                 — Strava connect / finish (step 8)
  runner/
    [id].tsx                   — re-exports RunnerDetailScreen (dynamic route)
  edit-profile.tsx             — re-exports EditProfileScreen

src/                           — all application logic (screens, context, theme, API)
  app/
    context/                   — OnboardingContext (multi-step form state)
    screens/
      onboarding/              — 9 onboarding screen components
      NearbyRunnersScreen      — runner feed
      ConnectionsScreen        — your running circle
      ProfileScreen            — read-only profile view
      EditProfileScreen        — edit profile
      RunnerDetailScreen       — individual runner + save to circle
    theme.ts                   — colors, radii, shared style tokens
  components/
    OnboardingLayout.tsx       — shared layout wrapper for onboarding steps
  lib/api/supabase.ts          — Supabase client
  types/                       — Supabase DB types
```

**The `app/` files are thin re-exports.** All real component code lives in `src/`. This keeps Expo Router's required file layout separate from the screen implementations.

The entry point is set in `package.json` as `"main": "expo-router/entry"`, which bootstraps the `app/` directory automatically.
