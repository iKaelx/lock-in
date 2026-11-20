# Lock-in

Lock-in is a responsive smart study planner built with React, TypeScript, Vite, Tailwind CSS, Supabase, TanStack Query, Recharts, and date-fns.

## Local setup

1. Install dependencies:
   ```sh
   npm install
   ```
2. Copy the environment template:
   ```sh
   copy .env.example .env
   ```
3. Create a Supabase project and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
   Use only the publishable browser key. Never expose a service-role key in Vite environment variables.
4. Apply the SQL files in `supabase/migrations` in filename order in the Supabase SQL editor. The latest migration adds personal calendar events and private study notes.
5. Configure the app URL and local redirect URLs in Supabase Auth URL Configuration.
6. Start the app:
   ```sh
   npm run dev
   ```

## Verification

```sh
npm test
npm run build
npm run lint
```

## Monetization

Core features are free. Ads and payment behavior are disabled by default in `src/config/index.ts`. The entitlement module is at `src/lib/entitlements.ts`.
