const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
const aiApiUrl = (process.env.EXPO_PUBLIC_AI_API_URL ?? '').replace(/\/$/, '');

export const config = {
  supabase: {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
  },
  /** Python FastAPI base URL, e.g. http://localhost:8000 or http://192.168.0.116:8000 */
  aiApiUrl,
  isSupabaseConfigured: Boolean(supabaseUrl && supabaseAnonKey),
};
