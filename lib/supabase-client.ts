// Supabase client helpers for the app
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createClient() {
  // Exposed via public schema view pointing at vet_inventory_app data
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
