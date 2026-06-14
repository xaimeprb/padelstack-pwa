import { useEffect, useState } from "react";
import { Bell, Building2, ShieldCheck, UsersRound } from "lucide-react";
import { PageHeader } from "../../components/AppShell";
import { Card, EmptyState, Notice, PageLoader, ResourceIconShell } from "../../components/ui";
import { friendlyError } from "../../services/displayHelpers";
import { padelstackApi } from "../../services/padelstackApi";
import { Announcement, Resource } from "../../types";
import { useAuth } from "../auth/AuthContext";

const statutoryHighlights = [
  "Art. 18: maximo general de 3 invitados por vivienda en zonas comunes.",
  "Art. 25: prohibido fumar y usar recipientes de vidrio en zonas comunes.",
  "Art. 7: anuncios solo en zona habilitada y por residentes o titulares.",
  "Art. 24: los actos organizados por la Comunidad tienen prioridad sobre los particulares.",
];

/**
 * Vista de comunidad construida con el perfil del usuario y datos comunes disponibles.
 */
export function CommunityPage() {
  const { profile } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [nextResources, nextAnnouncements] = await Promise.all([
          padelstackApi.resources(),
          padelstackApi.announcements(),
        ]);
        if (!mounted) return;
        setResources(nextResources);
        setAnnouncements(nextAnnouncements);
      } catch (nextError) {
        if (mounted) setError(friendlyError(nextError, "No se pudo cargar la informacion de tu comunidad."));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <PageLoader label="Cargando comunidad" />;

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Comunidad" title={profile?.communityName || profile?.communityId || "Mi comunidad"} />

      {error && <Notice tone="error">{error}</Notice>}

      <section className="profile-community-card">
        <ResourceIconShell tone="secondary">
          <Building2 size={24} />
        </ResourceIconShell>
        <div>
          <strong>{profile?.unitDisplay || "Vivienda sin confirmar"}</strong>
          <span>{profile?.fullName || profile?.email}</span>
        </div>
      </section>

      <div className="content-grid">
        <Card>
          <div className="section-heading">
            <ShieldCheck size={18} />
            <h3>Normas clave</h3>
          </div>
          <div className="rule-list">
            {statutoryHighlights.map((rule) => (
              <article key={rule}>{rule}</article>
            ))}
          </div>
        </Card>

        <Card>
          <div className="section-heading">
            <UsersRound size={18} />
            <h3>Recursos comunes</h3>
          </div>
          {resources.length ? (
            <div className="list-stack">
              {resources.map((resource) => (
                <article className="compact-line" key={resource.resourceId}>
                  <strong>{resource.name}</strong>
                  <span>{resource.rulesText || resource.reservationMode}</span>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="Sin instalaciones" message="La comunidad todavia no tiene recursos comunes publicados." />
          )}
        </Card>
      </div>

      <Card>
        <div className="section-heading">
          <Bell size={18} />
          <h3>Anuncios de comunidad</h3>
        </div>
        {announcements.length ? (
          <div className="announcement-grid">
            {announcements.slice(0, 4).map((announcement) => (
              <article className="text-card" key={announcement.announcementId}>
                <strong>{announcement.title}</strong>
                <p>{announcement.content}</p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="Sin comunicaciones" message="No hay comunicaciones visibles para tu comunidad." />
        )}
      </Card>
    </div>
  );
}
