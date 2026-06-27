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
  const scheme = Constants.expoConfig?.scheme ?? 'triviaapp';

  // Expo Go uses exp://192.168.x.x:port/--/auth/callback
  // Standalone builds use triviaapp://auth/callback
  if (Constants.appOwnership === 'expo') {
    return makeRedirectUri({ path: 'auth/callback' });
  }

  return makeRedirectUri({
    scheme,
    path: 'auth/callback',
  });
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
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    return error ? mapOAuthError(error.message) : null;
  }

  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;

  if (!accessToken) {
    return `Sign in did not return a session. Add this redirect URL in Supabase:\n${getOAuthRedirectUri()}`;
  }

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
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

async function signInWithOAuthBrowser(provider: SocialProvider): Promise<string | null> {
  const redirectTo = getOAuthRedirectUri();

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

  const redirectPromise =
    Platform.OS === 'android' ? waitForAuthRedirect(redirectTo) : Promise.resolve(null);

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, {
    showInRecents: true,
  });

  const callbackUrl =
    result.type === 'success'
      ? result.url
      : Platform.OS === 'android'
        ? await redirectPromise
        : null;

  if (callbackUrl) {
    return createSessionFromUrl(callbackUrl);
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
