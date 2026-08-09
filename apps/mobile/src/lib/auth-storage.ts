import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * Where the phone keeps its session token.
 *
 * On a device this is the iOS keychain / Android keystore, so the token is
 * encrypted at rest and other apps cannot read it. The browser build has no
 * such thing — `expo-secure-store` throws on web — so it falls back to
 * `localStorage`, which is why the web build is for development only.
 */
const TOKEN_KEY = "mangakai.session";

const isWeb = Platform.OS === "web";

export async function getStoredToken(): Promise<string | null> {
  if (isWeb) return globalThis.localStorage?.getItem(TOKEN_KEY) ?? null;

  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    // A keychain read can fail on a locked device. Treating that as signed-out
    // is recoverable; throwing here would break app startup.
    return null;
  }
}

export async function storeToken(token: string): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.setItem(TOKEN_KEY, token);

    return;
  }

  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.removeItem(TOKEN_KEY);

    return;
  }

  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
