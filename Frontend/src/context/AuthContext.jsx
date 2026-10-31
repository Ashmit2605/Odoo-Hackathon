import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from "../services/authService.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(
    () =>
      Boolean(
        localStorage.getItem("brightloop_token") ||
          sessionStorage.getItem("brightloop_token"),
      ),
  );

  const persistSession = useCallback((session, remember = true) => {
    const storage = remember ? localStorage : sessionStorage;
    const otherStorage = remember ? sessionStorage : localStorage;
    otherStorage.removeItem("brightloop_token");
    storage.setItem("brightloop_token", session.token);
    setUser(session.user);
  }, []);

  useEffect(() => {
    const token =
      localStorage.getItem("brightloop_token") ||
      sessionStorage.getItem("brightloop_token");
    if (!token) return;

    getCurrentUser()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem("brightloop_token");
        sessionStorage.removeItem("brightloop_token");
      })
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback(
    async (credentials, remember = true) => {
      const session = await loginRequest(credentials);
      persistSession(session, remember);
      return session.user;
    },
    [persistSession],
  );

  const signUp = useCallback(
    async (details) => {
      const session = await registerRequest(details);
      persistSession(session);
      return session.user;
    },
    [persistSession],
  );

  const signOut = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      localStorage.removeItem("brightloop_token");
      sessionStorage.removeItem("brightloop_token");
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, signIn, signUp, signOut }),
    [user, loading, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
