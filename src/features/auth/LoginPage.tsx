import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { LogIn, UserPlus } from "lucide-react";
import {
  firebaseConfigErrorMessage,
  isFirebaseConfigured,
} from "../../services/firebase";
import { padelstackApi } from "../../services/padelstackApi";
import { BootstrapUserRequest, RegistrationMetadata, UnitItem } from "../../types";
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

const profileIncompleteMessage = "Tu cuenta existe, pero falta completar el perfil.";

/**
 * Pantalla de acceso y alta inicial de vecino, alineada con `users/bootstrap`.
 */
export function LoginPage() {
  const { status, error: authError, login, register, completeProfile, logout } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profile, setProfile] = useState(emptyProfile);
  const [metadata, setMetadata] = useState<RegistrationMetadata | null>(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isProfileCompletion = status === "profile_incomplete";
  const isRegistrationFlow = mode === "register" || isProfileCompletion;
  const selectedCommunity = metadata?.communities.find((community) => community.communityId === profile.communityId);
  const unitsForSelectedCommunity = useMemo(
    () => getUnitsForCommunity(metadata, profile.communityId),
    [metadata, profile.communityId],
  );
  const visibleError = error || (authError !== profileIncompleteMessage ? authError : null);

  useEffect(() => {
    let mounted = true;
    if (!isRegistrationFlow) return;
    setLoadingMetadata(true);
    padelstackApi
      .getRegistrationMetadata()
      .then((nextMetadata) => {
        if (!mounted) return;
        setMetadata(nextMetadata);
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
  }, [isRegistrationFlow]);

  if (status === "authenticated") return <Navigate to="/" replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (!isRegistrationFlow) {
        await login(email, password);
      } else {
        const validationError = validateProfile(profile, unitsForSelectedCommunity);
        if (validationError) {
          setError(validationError);
          return;
        }
        const payload = { ...profile, communityName: selectedCommunity?.name ?? "" };
        if (isProfileCompletion) {
          await completeProfile(payload);
        } else {
          await register(email, password, payload);
        }
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
            {firebaseConfigErrorMessage}
          </Notice>
        )}

        {isProfileCompletion ? (
          <Notice tone="warning">{profileIncompleteMessage}</Notice>
        ) : (
          <div className="segmented" role="tablist" aria-label="Modo de acceso">
            <button className={mode === "login" ? "is-active" : ""} type="button" onClick={() => setMode("login")}>
              Acceder
            </button>
            <button
              className={mode === "register" ? "is-active" : ""}
              type="button"
              onClick={() => setMode("register")}
            >
              Alta
            </button>
          </div>
        )}

        <form className="form-stack" onSubmit={submit}>
          {!isProfileCompletion && (
            <>
              <label className="field">
                <span>Email</span>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </label>
              <label className="field">
                <span>Contrasena</span>
                <input
                  type="password"
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>
            </>
          )}

          {isRegistrationFlow && (
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
                  onChange={(event) => {
                    const nextCommunityId = event.target.value;
                    const nextCommunity = metadata?.communities.find(
                      (community) => community.communityId === nextCommunityId,
                    );
                    setProfile({
                      ...profile,
                      communityId: nextCommunityId,
                      communityName: nextCommunity?.name ?? "",
                      unitDisplay: "",
                    });
                  }}
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
                  disabled={!profile.communityId || loadingMetadata || unitsForSelectedCommunity.length === 0}
                  required
                >
                  <option value="">Selecciona vivienda</option>
                  {unitsForSelectedCommunity.map((unit) => (
                    <option key={`${unit.communityId}:${unit.unitId}`} value={unit.display}>
                      {unit.display}
                    </option>
                  ))}
                </select>
                {profile.communityId && !loadingMetadata && unitsForSelectedCommunity.length === 0 && (
                  <small>No hay viviendas disponibles para esta comunidad.</small>
                )}
              </label>
            </>
          )}

          {visibleError && <Notice tone="error">{visibleError}</Notice>}

          <Button type="submit" disabled={submitting || status === "loading"}>
            {!isRegistrationFlow ? <LogIn size={18} /> : <UserPlus size={18} />}
            {submitting ? "Procesando..." : !isRegistrationFlow ? "Entrar" : "Crear perfil"}
          </Button>
        </form>

        {isProfileCompletion && (
          <button className="auth-link" type="button" onClick={() => void logout()}>
            Usar otra cuenta
          </button>
        )}

        <Link to="/" className="auth-link">
          Volver al inicio
        </Link>
      </section>
    </main>
  );
}

function getUnitsForCommunity(metadata: RegistrationMetadata | null, communityId: string): UnitItem[] {
  if (!metadata || !communityId) return [];
  const community = metadata.communities.find((item) => item.communityId === communityId);
  const nestedUnits = community?.units?.map((unit) => ({
    ...unit,
    communityId: unit.communityId || communityId,
  }));
  if (nestedUnits?.length) {
    return nestedUnits;
  }
  const relatedUnits = metadata.unitOptions ?? metadata.units.filter(isUnitItem);
  return relatedUnits.filter((unit) => unit.communityId === communityId);
}

function isUnitItem(unit: string | UnitItem): unit is UnitItem {
  return typeof unit === "object" && unit !== null && "communityId" in unit;
}

function validateProfile(profile: BootstrapUserRequest, unitsForSelectedCommunity: UnitItem[]) {
  if (!profile.communityId) {
    return "Selecciona una comunidad.";
  }
  if (unitsForSelectedCommunity.length === 0) {
    return "No hay viviendas disponibles para esta comunidad.";
  }
  if (!profile.unitDisplay) {
    return "Selecciona una vivienda.";
  }
  const unitBelongsToCommunity = unitsForSelectedCommunity.some((unit) => unit.display === profile.unitDisplay);
  if (!unitBelongsToCommunity) {
    return "La vivienda seleccionada no pertenece a la comunidad elegida.";
  }
  return null;
}
