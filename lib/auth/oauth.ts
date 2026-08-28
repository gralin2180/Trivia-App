import * as AppleAuthentication from 'expo-apple-authentication';
import Constants from 'expo-constants';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export type SocialProvider = 'google' | 'apple';

/** Prevents double-exchange when deep link + WebBrowser both deliver the same callback. */
const handledAuthCodes = new Set<string>();

function mapOAuthError(message: string): string {
  if (message.includes('popup_closed') || message.includes('User cancelled')) {
    return 'Sign in was cancelled.';
  }
  if (message.includes('redirect')) {
    return `OAuth redirect failed. Add this URL in Supabase → Auth → URL Configuration → Redirect URLs:\n${getOAuthRedirectUri()}`;
  }
  return message;
}

export function getOAuthRedirectUri(): string {
  const rawScheme = Constants.expoConfig?.scheme ?? 'triviaapp';
  const scheme = Array.isArray(rawScheme) ? rawScheme[0] : rawScheme;

  // Expo Go (dev client in Expo Go app)
  if (Constants.appOwnership === 'expo') {
    return makeRedirectUri({ path: 'auth/callback' });
  }

  // Standalone APK / IPA — always deep-link back into the app
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    return `${scheme}://auth/callback`;
  }

  // Web: always return to the *current* origin (ngrok / localhost). Never bake in
  // an old tunnel like loca.lt — if Supabase Site URL is stale, allow-list this
  // exact callback so Auth does not fall back to Site URL.
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/auth/callback`;
  }

  return makeRedirectUri({
    scheme,
    path: 'auth/callback',
  });
}

async function hasActiveSession(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session?.access_token);
}

export async function createSessionFromUrl(url: string): Promise<string | null> {
  const { params, errorCode } = QueryParams.getQueryParams(url);

  if (errorCode) {
    return mapOAuthError(String(errorCode));
  }

  if (params.error_description || params.error) {
    return mapOAuthError(String(params.error_description ?? params.error));
  }

  if (params.code) {
    const code = String(params.code);
    if (handledAuthCodes.has(code)) {
      return (await hasActiveSession()) ? null : 'Sign in did not complete. Try again.';
    }
    handledAuthCodes.add(code);

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return null;
    }

    // Code already used by the other handler — treat as success if session exists.
    if (await hasActiveSession()) {
      return null;
    }

    handledAuthCodes.delete(code);
    return mapOAuthError(error.message);
  }

  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;

  if (!accessToken) {
    if (await hasActiveSession()) {
      return null;
    }
    return `Sign in did not return a session. Add this redirect URL in Supabase:\n${getOAuthRedirectUri()}`;
  }

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken ?? '',
  });

  return error ? mapOAuthError(error.message) : null;
}

function waitForAuthRedirect(redirectTo: string, timeoutMs = 120_000): Promise<string | null> {
  return new Promise((resolve) => {
    const redirectPrefix = redirectTo.split('?')[0];

    const subscription = Linking.addEventListener('url', (event) => {
      if (event.url.startsWith(redirectPrefix) || event.url.includes('auth/callback')) {
        clearTimeout(timeout);
        subscription.remove();
        resolve(event.url);
      }
    });

    const timeout = setTimeout(() => {
      subscription.remove();
      resolve(null);
    }, timeoutMs);
  });
}

async function waitForSession(timeoutMs = 4000): Promise<boolean> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await hasActiveSession()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return hasActiveSession();
}

async function signInWithOAuthBrowser(provider: SocialProvider): Promise<string | null> {
  const redirectTo = getOAuthRedirectUri();

  // Web: full-page redirect back to the current tunnel origin. Avoid WebBrowser
  // popups (and never rely on a stale Site URL like loca.lt).
  if (Platform.OS === 'web') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    return error ? mapOAuthError(error.message) : null;
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    return mapOAuthError(error.message);
  }

  if (!data?.url) {
    return 'Could not start sign in. Enable this provider in Supabase Auth.';
  }

  const redirectPromise = waitForAuthRedirect(redirectTo);

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, {
    showInRecents: true,
  });

  const callbackUrl =
    result.type === 'success' ? result.url : await redirectPromise;

  if (callbackUrl) {
    return createSessionFromUrl(callbackUrl);
  }

  // Android often dismisses the browser while the deep-link handler already signed in.
  if (await waitForSession()) {
    return null;
  }

  if (result.type === 'cancel' || result.type === 'dismiss') {
    return null;
  }

  return `Sign in was not completed. Add this redirect URL in Supabase:\n${redirectTo}`;
}

async function signInWithAppleNative(): Promise<string | null> {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    return 'Apple Sign In did not return a token.';
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });

  return error ? mapOAuthError(error.message) : null;
}

export async function signInWithSocialProvider(provider: SocialProvider): Promise<string | null> {
  try {
    if (provider === 'apple' && Platform.OS === 'ios') {
      const available = await AppleAuthentication.isAvailableAsync();
      if (available) {
        return signInWithAppleNative();
      }
    }

    return signInWithOAuthBrowser(provider);
  } catch (error) {
    if (error instanceof Error && error.message.includes('ERR_REQUEST_CANCELED')) {
      return null;
    }

    return mapOAuthError(error instanceof Error ? error.message : 'Sign in failed.');
  }
}
