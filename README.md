# Workout Tracker — Frontend

Mobile-first Next.js app for the Workout Tracker API. Optimized for iOS home screen (PWA) and a native app–like experience.

## Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **shadcn/ui**

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure the API URL (optional if backend runs at default):

   ```bash
   cp .env.local.example .env.local
   # Edit .env.local: set NEXT_PUBLIC_API_URL to your backend, e.g. https://your-api.com/api/v1
   ```

3. Run the backend (see `../backend/README.md`), then start the frontend:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## iOS / Add to Home Screen

- The app uses `viewport`, `theme-color`, and `apple-mobile-web-app-capable` for a full-screen, app-like experience.
- Safe area insets are applied so content stays clear of the notch and home indicator.
- For a proper PWA icon when adding to home screen, add `public/icon-192.png` and `public/icon-512.png` and update `src/app/manifest.ts` to reference them.

## Features

- **Home**: Quick start workout, recent workouts.
- **Workouts**: List, create, view detail, add sets, end workout.
- **Exercises**: List, create, edit (with muscle groups and measurement mode).
- **Templates**: List, view, start workout from template. Save completed workout as template.
- **Stats**: PRs this month, consistency calendar.

All API calls go to `NEXT_PUBLIC_API_URL` (default `http://localhost:8000/api/v1`).
# Workout-Tracker-Frontend
