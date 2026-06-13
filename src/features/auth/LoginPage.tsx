import { FormEvent, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { LogIn, UserPlus } from "lucide-react";
import {
  firebaseConfigErrorMessage,
  firebaseMissingConfig,
  isFirebaseConfigured,
} from "../../services/firebase";
import { apiBaseUrl } from "../../services/apiClient";
import { padelstackApi } from "../../services/padelstackApi";
import { BootstrapUserRequest, RegistrationMetadata } from "../../types";
import { Button, Notice, Spinner } from "../../components/ui";
import { useAuth } from "./AuthContext";

type Mode = "login" | "register";

const emptyProfile: BootstrapUserRequest = {
  username: "",
  firstName: "",
  lastName: "",
  phone: "",
  communityId: "",
  communityName: "",
  unitDisplay: "",
};

/**
 * Pantalla de acceso y alta inicial de vecino, alineada con `users/bootstrap`.
 */
export function LoginPage() {
  const { status, login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profile, setProfile] = useState(emptyProfile);
  const [metadata, setMetadata] = useState<RegistrationMetadata | null>(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (mode !== "register") return;
    setLoadingMetadata(true);
    padelstackApi
      .getRegistrationMetadata()
      .then((nextMetadata) => {
        if (!mounted) return;
        setMetadata(nextMetadata);
        const firstCommunity = nextMetadata.communities[0];
        setProfile((current) => ({
          ...current,
          communityId: current.communityId || firstCommunity?.communityId || "",
          communityName: current.communityName || firstCommunity?.name || "",
          unitDisplay: current.unitDisplay || nextMetadata.units[0] || "",
        }));
      })
      .catch((nextError) => {
        if (mounted) setError(nextError instanceof Error ? nextError.message : "No se pudo cargar el registro.");
      })
      .finally(() => {
        if (mounted) setLoadingMetadata(false);
      });
    return () => {
      mounted = false;
    };
  }, [mode]);

  if (status === "authenticated") return <Navigate to="/" replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        const communityName =
          metadata?.communities.find((community) => community.communityId === profile.communityId)?.name ?? "";
        await register(email, password, { ...profile, communityName });
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No se pudo acceder.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-panel">
        <div className="splash-mark" aria-hidden="true">
          PS
        </div>
        <h1>PADELSTACK</h1>
        <p>Gestion inteligente de comunidades</p>

        {!isFirebaseConfigured && (
          <Notice tone="warning">
            {firebaseConfigErrorMessage} Variables pendientes: {firebaseMissingConfig.join(", ")}.
          </Notice>
        )}

        {import.meta.env.DEV && (
          <p className="auth-diagnostic">API en uso: {apiBaseUrl || "VITE_API_BASE_URL sin configurar"}</p>
        )}

        <div className="segmented" role="tablist" aria-label="Modo de acceso">
          <button className={mode === "login" ? "is-active" : ""} type="button" onClick={() => setMode("login")}>
            Acceder
          </button>
          <button className={mode === "register" ? "is-active" : ""} type="button" onClick={() => setMode("register")}>
            Alta
          </button>
        </div>

        <form className="form-stack" onSubmit={submit}>
          <label className="field">
            <span>Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label className="field">
            <span>Contraseña</span>
            <input
              type="password"
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {mode === "register" && (
            <>
              {loadingMetadata && <Spinner label="Cargando comunidades" />}
              <div className="field-grid">
                <label className="field">
                  <span>Usuario</span>
                  <input
                    value={profile.username}
                    onChange={(event) => setProfile({ ...profile, username: event.target.value })}
                    required
                  />
                </label>
                <label className="field">
                  <span>Telefono</span>
                  <input
                    value={profile.phone}
                    onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
                    required
                  />
                </label>
              </div>
              <div className="field-grid">
                <label className="field">
                  <span>Nombre</span>
                  <input
                    value={profile.firstName}
                    onChange={(event) => setProfile({ ...profile, firstName: event.target.value })}
                    required
                  />
                </label>
                <label className="field">
                  <span>Apellidos</span>
                  <input
                    value={profile.lastName}
                    onChange={(event) => setProfile({ ...profile, lastName: event.target.value })}
                    required
                  />
                </label>
              </div>
              <label className="field">
                <span>Comunidad</span>
                <select
                  value={profile.communityId}
                  onChange={(event) => setProfile({ ...profile, communityId: event.target.value })}
                  required
                >
                  <option value="">Selecciona comunidad</option>
                  {metadata?.communities.map((community) => (
                    <option key={community.communityId} value={community.communityId}>
                      {community.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Vivienda</span>
                <select
                  value={profile.unitDisplay}
                  onChange={(event) => setProfile({ ...profile, unitDisplay: event.target.value })}
                  required
                >
                  <option value="">Selecciona vivienda</option>
                  {metadata?.units.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}

          {error && <Notice tone="error">{error}</Notice>}

          <Button type="submit" disabled={submitting}>
            {mode === "login" ? <LogIn size={18} /> : <UserPlus size={18} />}
            {submitting ? "Procesando..." : mode === "login" ? "Entrar" : "Crear perfil"}
          </Button>
        </form>

        <Link to="/" className="auth-link">
          Volver al inicio
        </Link>
      </section>
    </main>
  );
}
