import { z } from 'zod';

const schema = z.object({
  apiUrl: z.string().url(),
  supabaseUrl: z.string().url(),
  supabasePublishableKey: z.string().min(1),
});

export const env = schema.parse({
  apiUrl: process.env.EXPO_PUBLIC_API_URL_DEV,
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
  supabasePublishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});
