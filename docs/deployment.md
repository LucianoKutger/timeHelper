# Deployment

## Backend auf Render

- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Health Check: `/health`

Secrets werden ausschließlich als Render Environment Variables gesetzt.

## Android-App

Die App wird mit Expo/EAS als Development Build, APK oder signiertes AAB gebaut. Im App-Bundle dürfen nur `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SUPABASE_URL` und der öffentliche Supabase-Key enthalten sein.
