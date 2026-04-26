# Supabase Setup Guide

This project is configured to use Supabase as the backend. Follow these steps to complete the setup:

## 1. Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Create a new project or select an existing one
3. Navigate to **Settings** → **API**
4. Copy your:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys")

## 2. Set Environment Variables

Create a `.env` file in the root of your project with the following:

```env
EXPO_PUBLIC_SUPABASE_URL=your-project-url-here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:** 
- The `EXPO_PUBLIC_` prefix is required for Expo to expose these variables to your app
- Never commit your `.env` file to version control (it's already in `.gitignore`)
- The `.env` file should be created locally by each developer

## 3. Using the Supabase Client

Import and use the Supabase client in your components:

```typescript
import { supabase } from '../lib/api/supabase';

// Example: Sign up a user
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
});

// Example: Query data
const { data, error } = await supabase
  .from('your_table')
  .select('*');
```

## 4. Generate TypeScript Types (Optional but Recommended)

To get full TypeScript support for your database schema, you need your **Project ID**. You can find it in two ways:

### Finding Your Project ID

**Method 1: From your Supabase URL**
- Your Project ID is the part between `https://` and `.supabase.co` in your Supabase URL
- Example: If your URL is `https://abcdefghijklmnop.supabase.co`, your Project ID is `abcdefghijklmnop`

**Method 2: From Supabase Dashboard**
- Go to your project in the [Supabase Dashboard](https://app.supabase.com/)
- Navigate to **Settings** → **General**
- Your Project ID is shown under "Reference ID"

### Generating Types

**Option 1: Using the npm script (Easiest - Recommended)**
The script will automatically extract your Project ID from your `.env` file if you have `EXPO_PUBLIC_SUPABASE_URL` set, or you can set `SUPABASE_PROJECT_ID` directly.

1. Make sure your `.env` file has either:
   - `EXPO_PUBLIC_SUPABASE_URL` (the script will extract the Project ID from it), OR
   - `SUPABASE_PROJECT_ID=your-project-id-here`

2. Run the script:
   ```bash
   npm run generate:types
   ```

   This will automatically generate types in `src/types/supabase.ts`.

**Option 2: Using Supabase CLI directly**
```bash
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
```

**Option 3: Using npx (if CLI not installed globally)**
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
```

Replace `YOUR_PROJECT_ID` with your actual Project ID from above.

**Note:** You'll need to be logged in to Supabase CLI. If you're not logged in, run:
```bash
supabase login
```

## 5. Authentication Storage

The Supabase client is configured to use `expo-secure-store` for secure storage of authentication tokens. This ensures that user sessions are stored securely on the device.

## Troubleshooting

- **"Missing Supabase environment variables" error**: Make sure your `.env` file exists and contains both `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- **Environment variables not updating**: After creating/updating `.env`, restart your Expo development server
- **Type errors**: Run the type generation command to sync your TypeScript types with your Supabase schema

