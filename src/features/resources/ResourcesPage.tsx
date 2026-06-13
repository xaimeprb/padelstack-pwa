import { useEffect, useState } from "react";
import { Clock, MapPinned, Utensils, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/AppShell";
import { Button, Card, EmptyState, Notice, PageLoader, ResourceIconShell } from "../../components/ui";
import { padelstackApi } from "../../services/padelstackApi";
import { statutorySummaryFor } from "../../services/reservationPolicy";
import { Resource } from "../../types";

function iconFor(resource: Resource) {
  if (resource.type === "MERENDERO") return <Utensils size={24} />;
  return <Trophy size={24} />;
}

/**
 * Vista de recursos activos, alimentada por `/api/v1/resources`.
 */
export function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    padelstackApi
      .resources()
      .then((nextResources) => {
        if (mounted) setResources(nextResources);
      })
      .catch((nextError) => {
        if (mounted) setError(nextError instanceof Error ? nextError.message : "No se pudieron cargar recursos.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <PageLoader label="Cargando recursos" />;

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Instalaciones" title="Recursos comunes">
        <Link to="/reservations">
          <Button type="button">
            <MapPinned size={18} />
            Reservar
          </Button>
        </Link>
      </PageHeader>

      {error && <Notice tone="error">{error}</Notice>}

      {resources.length ? (
        <div className="resource-card-grid">
          {resources.map((resource) => (
            <Card className="resource-card" key={resource.resourceId}>
              <div className="resource-card-top">
                <ResourceIconShell tone={resource.type === "MERENDERO" ? "tertiary" : "secondary"}>
                  {iconFor(resource)}
                </ResourceIconShell>
                <span className="resource-status">Disponible</span>
              </div>
              <h3>{resource.name}</h3>
              <div className="metadata-line">
                <Clock size={16} />
                <span>
                  {resource.reservationMode === "FULL_DAY"
                    ? "Reserva de dia completo"
                    : `${resource.openTime ?? "--"} - ${resource.closeTime ?? "--"}`}
                </span>
              </div>
              <p>{statutorySummaryFor(resource)}</p>
              {resource.rulesText && <small>PanelAdmin: {resource.rulesText}</small>}
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="Sin recursos activos" message="La API no devuelve recursos disponibles para tu comunidad." />
      )}
    </div>
  );
}
