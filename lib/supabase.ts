import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { config } from '@/constants/config';

const authOptions = {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Web OAuth often returns #access_token on the Site URL — pick it up.
    detectSessionInUrl: Platform.OS === 'web',
  },
};

// Use placeholders when .env is missing so the app can show a helpful message
// instead of crashing at startup (e.g. if the file is named .env.txt on Windows).
export const supabase = createClient(
  config.supabase.url || 'https://placeholder.supabase.co',
  config.supabase.anonKey || 'placeholder',
  authOptions,
);
