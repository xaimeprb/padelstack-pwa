import { useEffect, useMemo, useState } from "react";
import { Bell, BookOpen, CalendarDays, ChevronRight, ClipboardList, MapPinned } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/AppShell";
import { Badge, Card, EmptyState, Notice, PageLoader, ResourceIconShell, statusTone } from "../../components/ui";
import { formatApiDate } from "../../services/dateUtils";
import { padelstackApi } from "../../services/padelstackApi";
import { Announcement, Incident, Reservation, Resource, Statute } from "../../types";
import { useAuth } from "../auth/AuthContext";

type DashboardData = {
  resources: Resource[];
  reservations: Reservation[];
  announcements: Announcement[];
  incidents: Incident[];
  statutes: Statute | null;
};

const emptyData: DashboardData = {
  resources: [],
  reservations: [],
  announcements: [],
  incidents: [],
  statutes: null,
};

/**
 * Dashboard vecinal de la PWA con resumen de perfil, reservas y comunicaciones.
 */
export function DashboardPage() {
  const { profile } = useAuth();
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      const results = await Promise.allSettled([
        padelstackApi.resources(),
        padelstackApi.myReservations(),
        padelstackApi.announcements(),
        padelstackApi.myIncidents(),
        padelstackApi.statutes(),
      ]);
      if (!mounted) return;

      const [resources, reservations, announcements, incidents, statutes] = results;
      setData({
        resources: resources.status === "fulfilled" ? resources.value : [],
        reservations: reservations.status === "fulfilled" ? reservations.value : [],
        announcements: announcements.status === "fulfilled" ? announcements.value : [],
        incidents: incidents.status === "fulfilled" ? incidents.value : [],
        statutes: statutes.status === "fulfilled" ? statutes.value : null,
      });
      const rejected = results.find((result) => result.status === "rejected");
      setError(rejected?.status === "rejected" ? String(rejected.reason?.message ?? "Carga parcial de datos.") : null);
      setLoading(false);
    }
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const nextReservations = useMemo(
    () => data.reservations.slice().sort((a, b) => `${a.date}${a.startTime ?? ""}`.localeCompare(`${b.date}${b.startTime ?? ""}`)),
    [data.reservations],
  );

  if (loading) return <PageLoader label="Cargando inicio" />;

  return (
    <div className="page-stack">
      <PageHeader eyebrow={profile?.communityName || profile?.communityId} title={`Hola, ${profile?.firstName || profile?.username || "vecino"}`} />

      {error && <Notice tone="warning">Algunos datos no han podido cargarse. {error}</Notice>}

      <section className="hero-card">
        <div>
          <span className="hero-kicker">Perfil comunitario</span>
          <h3>{profile?.fullName || profile?.email}</h3>
          <p>{profile?.unitDisplay || "Vivienda pendiente"} · {profile?.role || "NEIGHBOR"}</p>
        </div>
        <Link to="/profile" className="circle-action" aria-label="Ver perfil">
          <ChevronRight size={22} />
        </Link>
      </section>

      <div className="quick-grid">
        <QuickLink to="/reservations" icon={<CalendarDays />} label="Reservar" />
        <QuickLink to="/incidents" icon={<ClipboardList />} label="Incidencia" />
        <QuickLink to="/announcements" icon={<Bell />} label="Anuncios" />
        <QuickLink to="/statutes" icon={<BookOpen />} label="Estatutos" />
      </div>

      <section className="content-grid">
        <Card>
          <div className="section-heading">
            <CalendarDays size={18} />
            <h3>Mis reservas</h3>
          </div>
          {nextReservations.length ? (
            <div className="list-stack">
              {nextReservations.slice(0, 4).map((reservation) => (
                <article className="list-card" key={reservation.reservationId}>
                  <ResourceIconShell tone="secondary">
                    <CalendarDays size={20} />
                  </ResourceIconShell>
                  <div>
                    <strong>{reservation.resourceName || reservation.resourceId}</strong>
                    <span>{formatApiDate(reservation.date)} · {reservation.slotLabel || "Dia completo"}</span>
                  </div>
                  <Badge tone={statusTone(reservation.status)}>{reservation.status}</Badge>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="Sin reservas activas" message="Las reservas que crees apareceran aqui." />
          )}
        </Card>

        <Card>
          <div className="section-heading">
            <Bell size={18} />
            <h3>Novedades</h3>
          </div>
          {data.announcements.length ? (
            <div className="list-stack">
              {data.announcements.slice(0, 3).map((announcement) => (
                <article className="text-card" key={announcement.announcementId}>
                  <strong>{announcement.title}</strong>
                  <p>{announcement.content}</p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="Sin anuncios visibles" message="No hay comunicaciones publicadas para tu comunidad." />
          )}
        </Card>
      </section>

      <section className="resource-strip">
        {data.resources.slice(0, 3).map((resource) => (
          <Link className="resource-tile" to="/resources" key={resource.resourceId}>
            <MapPinned size={22} />
            <strong>{resource.name}</strong>
            <span>{resource.reservationMode === "FULL_DAY" ? "Dia completo" : `${resource.openTime ?? "--"}-${resource.closeTime ?? "--"}`}</span>
          </Link>
        ))}
      </section>
    </div>
  );
}

function QuickLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link className="quick-link" to={to}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}
