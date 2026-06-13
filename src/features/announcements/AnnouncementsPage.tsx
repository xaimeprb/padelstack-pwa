import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { PageHeader } from "../../components/AppShell";
import { Card, EmptyState, Notice, PageLoader } from "../../components/ui";
import { formatDateTime } from "../../services/dateUtils";
import { padelstackApi } from "../../services/padelstackApi";
import { Announcement } from "../../types";

/**
 * Vista de anuncios visibles publicados desde PanelAdmin/backend.
 */
export function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    padelstackApi
      .announcements()
      .then((items) => {
        if (mounted) setAnnouncements(items);
      })
      .catch((nextError) => {
        if (mounted) setError(nextError instanceof Error ? nextError.message : "No se pudieron cargar anuncios.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <PageLoader label="Cargando anuncios" />;

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Comunicaciones" title="Anuncios" />

      <Notice tone="info">Art. 7: las comunicaciones visibles proceden del canal habilitado por la comunidad.</Notice>
      {error && <Notice tone="error">{error}</Notice>}

      {announcements.length ? (
        <div className="announcement-grid">
          {announcements.map((announcement) => (
            <Card className="announcement-card" key={announcement.announcementId}>
              <Bell size={20} />
              <h3>{announcement.title}</h3>
              <p>{announcement.content}</p>
              <span>{formatDateTime(announcement.publishedAt)} · {announcement.createdByName || "Administracion"}</span>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="Sin anuncios" message="No hay anuncios visibles para tu comunidad." />
      )}
    </div>
  );
}
