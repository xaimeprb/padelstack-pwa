import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { PageHeader } from "../../components/AppShell";
import { Card, EmptyState, Notice, PageLoader } from "../../components/ui";
import { formatDateTime } from "../../services/dateUtils";
import { friendlyError } from "../../services/displayHelpers";
import { padelstackApi } from "../../services/padelstackApi";
import { Announcement } from "../../types";

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
        if (mounted) setError(friendlyError(nextError, "No se pudieron cargar las comunicaciones."));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <PageLoader label="Cargando comunicaciones" />;

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Comunicaciones" title="Anuncios" />

      <Notice tone="info">Las comunicaciones publicadas corresponden al canal oficial de la comunidad segun la normativa vigente.</Notice>
      {error && <Notice tone="error">{error}</Notice>}

      {announcements.length ? (
        <div className="announcement-grid">
          {announcements.map((announcement) => (
            <Card className="announcement-card" key={announcement.announcementId}>
              <Bell size={20} />
              <h3>{announcement.title}</h3>
              <p>{announcement.content}</p>
              <span>{formatDateTime(announcement.publishedAt)} - {announcement.createdByName || "Comunidad"}</span>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="Sin comunicaciones" message="No hay comunicaciones visibles para tu comunidad." />
      )}
    </div>
  );
}
