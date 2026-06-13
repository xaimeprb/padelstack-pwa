import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiError } from "../../services/apiClient";
import { padelstackApi } from "../../services/padelstackApi";
import { auth, ensureFirebaseReady } from "../../services/firebase";
import { AuthContextValue, BootstrapUserRequest, PadelUser } from "../../types";

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeAuthError(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message.includes("auth/invalid-credential")) {
    return "Credenciales no validas.";
  }
  if (error instanceof Error && error.message.includes("auth/email-already-in-use")) {
    return "Ese correo ya esta registrado.";
  }
  if (error instanceof Error) return error.message;
  return "No se pudo completar la autenticacion.";
}

/**
 * Proveedor de sesion para la PWA: combina Firebase Auth con el perfil `/api/v1/me`.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState(auth.currentUser);
  const [profile, setProfile] = useState<PadelUser | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!auth.currentUser) {
      setProfile(null);
      setStatus("unauthenticated");
      return;
    }
    try {
      const nextProfile = await padelstackApi.me();
      setProfile(nextProfile);
      setStatus("authenticated");
      setError(null);
    } catch (nextError) {
      setProfile(null);
      setStatus("unauthenticated");
      setError(normalizeAuthError(nextError));
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        setProfile(null);
        setStatus("unauthenticated");
        return;
      }
      setStatus("loading");
      void refreshProfile();
    });
    return unsubscribe;
  }, [refreshProfile]);

  const login = useCallback(
    async (email: string, password: string) => {
      ensureFirebaseReady();
      setStatus("loading");
      setError(null);
      try {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        await refreshProfile();
      } catch (nextError) {
        const message = normalizeAuthError(nextError);
        setStatus("unauthenticated");
        setError(message);
        throw new Error(message);
      }
    },
    [refreshProfile],
  );

  const register = useCallback(
    async (email: string, password: string, bootstrapProfile: BootstrapUserRequest) => {
      ensureFirebaseReady();
      setStatus("loading");
      setError(null);
      try {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        await padelstackApi.bootstrapUser(bootstrapProfile);
        await refreshProfile();
      } catch (nextError) {
        const message = normalizeAuthError(nextError);
        setStatus("unauthenticated");
        setError(message);
        throw new Error(message);
      }
    },
    [refreshProfile],
  );

  const logout = useCallback(async () => {
    await signOut(auth);
    setFirebaseUser(null);
    setProfile(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo(
    () => ({ firebaseUser, profile, status, error, login, register, logout, refreshProfile }),
    [firebaseUser, profile, status, error, login, register, logout, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
