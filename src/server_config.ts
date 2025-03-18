/**
 * SERVER-SIDE ONLY CONFIGURATION
 * Do not import this file in client components!
 */

// Re-export public configuration
export { SUPABASE_URL, SUPABASE_ANON_KEY, DATABASE_URL, IS_PRODUCTION, APP_NAME } from './app_config';

// Server-only configuration
export const SUPABASE_SERVICE_KEY = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY as string;

if (!SUPABASE_SERVICE_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_SERVICE_KEY environment variable');
}
