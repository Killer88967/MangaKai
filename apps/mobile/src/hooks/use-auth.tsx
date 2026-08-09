import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@mangakai/shared";
import * as api from "@/lib/api";
import {
  clearStoredToken,
  getStoredToken,
  storeToken,
} from "@/lib/auth-storage";

interface AuthValue {
  user: User | null;
  /** True until the stored token has been checked, so screens can wait. */
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On launch, trade the stored token for the user it belongs to. This is also
  // where a revoked or expired session is discovered — the API answers 401 and
  // we drop the dead token instead of holding it forever.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const token = await getStoredToken();

      if (!token) {
        if (!cancelled) setLoading(false);

        return;
      }

      try {
        const me = await api.getMe(token);

        if (cancelled) return;

        if (me) {
          setUser(me);
        } else {
          await clearStoredToken();
        }
      } catch {
        // Offline: keep the token, stay signed out for now, and try again on
        // the next launch rather than logging the user out over a dropped wifi.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const auth = await api.login({ email, password });

    await storeToken(auth.token);
    setUser(auth.user);
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      const auth = await api.register({ email, password, displayName });

      await storeToken(auth.token);
      setUser(auth.user);
    },
    [],
  );

  const signOut = useCallback(async () => {
    const token = await getStoredToken();

    // Clear locally first so the UI never appears stuck signing out, then tell
    // the API. If that call fails the row lingers until it expires, but the
    // phone no longer holds a token to present.
    await clearStoredToken();
    setUser(null);

    if (token) {
      try {
        await api.logout(token);
      } catch {
        // Already signed out locally; nothing useful to show the user.
      }
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, signIn, signUp, signOut }),
    [user, loading, signIn, signUp, signOut],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthValue {
  const value = use(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used inside <AuthProvider>.");
  }

  return value;
}
