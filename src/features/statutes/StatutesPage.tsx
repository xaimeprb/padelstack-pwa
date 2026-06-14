import { useEffect, useMemo, useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { PageHeader } from "../../components/AppShell";
import { Card, EmptyState, Notice, PageLoader } from "../../components/ui";
import { formatDateTime } from "../../services/dateUtils";
import { friendlyError, isNotFound } from "../../services/displayHelpers";
import { padelstackApi } from "../../services/padelstackApi";
import { Statute } from "../../types";

const appliedRules = [
  "Padel: arts. 38-44.",
  "Merendero: arts. 50-57.",
  "Comunicaciones: art. 7.",
  "Zonas comunes y convivencia: arts. 18-25.",
];

export function StatutesPage() {
  const [statute, setStatute] = useState<Statute | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missingForCommunity, setMissingForCommunity] = useState(false);

  useEffect(() => {
    let mounted = true;
    padelstackApi
      .statutes()
      .then((nextStatute) => {
        if (!mounted) return;
        setStatute(nextStatute);
        setMissingForCommunity(false);
      })
      .catch((nextError) => {
        if (!mounted) return;
        if (isNotFound(nextError)) {
          setStatute(null);
          setMissingForCommunity(true);
          setError(null);
          return;
        }
        setError(friendlyError(nextError, "No se pudieron cargar los estatutos. Intentalo de nuevo mas tarde."));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const content = useMemo(() => {
    if (!statute?.content) return [];
    const parts = statute.content.split(/\n{2,}|(?=Articulo\s+\d+)|(?=Artículo\s+\d+)/i).map((part) => part.trim()).filter(Boolean);
    if (!query.trim()) return parts;
    const needle = query.trim().toLowerCase();
    return parts.filter((part) => part.toLowerCase().includes(needle));
  }, [statute, query]);

  if (loading) return <PageLoader label="Cargando estatutos" />;

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Normativa" title={statute?.title || "Estatutos"} />

      {error && <Notice tone="error">{error}</Notice>}

      {statute ? (
        <>
          <Card className="statute-summary">
            <BookOpen size={24} />
            <div>
              <strong>Version {statute.version}</strong>
              <span>Actualizado {formatDateTime(statute.updatedAt)}</span>
            </div>
          </Card>

          <div className="rule-chips">
            {appliedRules.map((rule) => (
              <span key={rule}>{rule}</span>
            ))}
          </div>

          <label className="search-input">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar en estatutos" />
          </label>

          {content.length ? (
            <div className="statute-list">
              {content.map((section, index) => (
                <article key={`${section.slice(0, 24)}-${index}`}>
                  {section}
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="Sin resultados" message="No hay apartados que coincidan con tu busqueda." />
          )}
        </>
      ) : (
        <EmptyState
          title="Estatutos no disponibles"
          message={
            missingForCommunity
              ? "Los estatutos de tu comunidad todavia no estan disponibles."
              : "Los estatutos de tu comunidad todavia no estan disponibles."
          }
        />
      )}
    </div>
  );
}
