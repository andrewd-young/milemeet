#!/bin/bash

# Script to generate Supabase TypeScript types
# This script extracts the Project ID from your .env file if SUPABASE_PROJECT_ID is not set

# Load environment variables from .env if it exists
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Try to get Project ID from SUPABASE_PROJECT_ID env var
PROJECT_ID=$SUPABASE_PROJECT_ID

# If not set, try to extract from EXPO_PUBLIC_SUPABASE_URL
if [ -z "$PROJECT_ID" ] && [ -n "$EXPO_PUBLIC_SUPABASE_URL" ]; then
  # Extract project ID from URL (e.g., https://abcdefghijklmnop.supabase.co -> abcdefghijklmnop)
  PROJECT_ID=$(echo $EXPO_PUBLIC_SUPABASE_URL | sed -E 's|https?://([^.]+)\.supabase\.co.*|\1|')
fi

# Check if we have a project ID
if [ -z "$PROJECT_ID" ]; then
  echo "Error: Could not find Supabase Project ID"
  echo ""
  echo "Please either:"
  echo "  1. Set SUPABASE_PROJECT_ID in your .env file, or"
  echo "  2. Make sure EXPO_PUBLIC_SUPABASE_URL is set in your .env file"
  echo ""
  echo "You can find your Project ID in your Supabase Dashboard:"
  echo "  Settings → General → Reference ID"
  echo ""
  echo "Or extract it from your Supabase URL:"
  echo "  https://YOUR_PROJECT_ID.supabase.co"
  exit 1
fi

echo "Generating types for project: $PROJECT_ID"

# Ensure the target directory exists
mkdir -p src/types

supabase gen types typescript --project-id $PROJECT_ID > src/types/supabase.ts

if [ $? -eq 0 ]; then
  echo "✅ Types generated successfully in src/types/supabase.ts"
else
  echo "❌ Error generating types. Make sure you're logged in:"
  echo "   supabase login"
  exit 1
fi

