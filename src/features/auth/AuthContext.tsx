import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import type { User } from "firebase/auth";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiError } from "../../services/apiClient";
import { padelstackApi } from "../../services/padelstackApi";
import { auth, ensureFirebaseReady } from "../../services/firebase";
import { AuthContextValue, BootstrapUserRequest, PadelUser } from "../../types";

const AuthContext = createContext<AuthContextValue | null>(null);

const profileIncompleteMessage = "Tu cuenta existe, pero falta completar el perfil.";
const rollbackSuccessMessage = "No se pudo completar el alta. Se ha revertido la cuenta. Intentalo de nuevo.";
const rollbackRecoveryMessage =
  "La cuenta se creo, pero no se pudo completar el perfil. Accede con ese correo o restablece contrasena para completar el perfil.";

function getErrorCode(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    return String((error as { code?: unknown }).code ?? "");
  }
  return "";
}

function isMissingProfileError(error: unknown) {
  return error instanceof ApiError && error.status === 404;
}

function normalizeAuthError(error: unknown) {
  if (error instanceof ApiError) return error.message;
  const errorCode = getErrorCode(error);
  if (errorCode === "auth/invalid-credential" || errorCode === "auth/wrong-password") {
    return "Credenciales no validas.";
  }
  if (errorCode === "auth/email-already-in-use") {
    return "Ese correo ya existe. Accede con tu contrasena o usa recuperar contrasena. Si no completaste el perfil, inicia sesion para finalizarlo.";
  }
  if (error instanceof Error && error.message.includes("auth/invalid-credential")) {
    return "Credenciales no validas.";
  }
  if (error instanceof Error && error.message.includes("auth/email-already-in-use")) {
    return "Ese correo ya existe. Accede con tu contrasena o usa recuperar contrasena. Si no completaste el perfil, inicia sesion para finalizarlo.";
  }
  if (error instanceof Error) return error.message;
  return "No se pudo completar la autenticacion.";
}

async function signOutQuietly() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("[PADELSTACK PWA] No se pudo cerrar la sesion", error);
  }
}

/**
 * Proveedor de sesion para la PWA.
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
      if (isMissingProfileError(nextError)) {
        setProfile(null);
        setStatus("profile_incomplete");
        setError(profileIncompleteMessage);
        return;
      }
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
      let createdUser: User | null = null;
      try {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        createdUser = credential.user;
        await padelstackApi.bootstrapUser(bootstrapProfile);
        await refreshProfile();
      } catch (nextError) {
        let message = normalizeAuthError(nextError);
        if (createdUser) {
          try {
            await deleteUser(createdUser);
            await signOutQuietly();
            message = rollbackSuccessMessage;
          } catch (rollbackError) {
            console.error("[PADELSTACK PWA] No se pudo revertir el usuario de Auth", rollbackError);
            await signOutQuietly();
            message = rollbackRecoveryMessage;
          }
        }
        setStatus("unauthenticated");
        setProfile(null);
        setError(message);
        throw new Error(message);
      }
    },
    [refreshProfile],
  );

  const completeProfile = useCallback(
    async (bootstrapProfile: BootstrapUserRequest) => {
      ensureFirebaseReady();
      setStatus("loading");
      setError(null);
      try {
        await padelstackApi.bootstrapUser(bootstrapProfile);
        await refreshProfile();
      } catch (nextError) {
        const message = normalizeAuthError(nextError);
        setProfile(null);
        setStatus(auth.currentUser ? "profile_incomplete" : "unauthenticated");
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
    setError(null);
  }, []);

  const value = useMemo(
    () => ({ firebaseUser, profile, status, error, login, register, completeProfile, logout, refreshProfile }),
    [firebaseUser, profile, status, error, login, register, completeProfile, logout, refreshProfile],
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
