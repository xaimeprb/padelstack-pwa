import { LogOut, RefreshCw, UserRound } from "lucide-react";
import { PageHeader } from "../../components/AppShell";
import { Button, Card, ResourceIconShell } from "../../components/ui";
import { useAuth } from "../auth/AuthContext";

/**
 * Perfil del usuario actual obtenido desde `/api/v1/me`.
 */
export function ProfilePage() {
  const { profile, firebaseUser, refreshProfile, logout } = useAuth();

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Cuenta" title="Perfil" />

      <Card className="profile-card">
        <ResourceIconShell>
          <UserRound size={26} />
        </ResourceIconShell>
        <div>
          <h3>{profile?.fullName || profile?.username || firebaseUser?.email}</h3>
          <span>{profile?.email || firebaseUser?.email}</span>
        </div>
      </Card>

      <Card>
        <div className="detail-list">
          <ProfileLine label="Comunidad" value={profile?.communityName || profile?.communityId} />
          <ProfileLine label="Vivienda" value={profile?.unitDisplay} />
          <ProfileLine label="Rol" value={profile?.role} />
          <ProfileLine label="Telefono" value={profile?.phone} />
          <ProfileLine label="Estado" value={profile?.active ? "Activo" : "Inactivo"} />
        </div>
      </Card>

      <div className="button-row">
        <Button variant="secondary" type="button" onClick={() => void refreshProfile()}>
          <RefreshCw size={17} />
          Actualizar
        </Button>
        <Button variant="danger" type="button" onClick={() => void logout()}>
          <LogOut size={17} />
          Salir
        </Button>
      </div>
    </div>
  );
}

function ProfileLine({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="detail-line">
      <span>{label}</span>
      <strong>{value || "Sin dato"}</strong>
    </div>
  );
}
