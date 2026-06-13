import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader } from "../../components/AppShell";
import { Badge, Button, Card, EmptyState, Notice, PageLoader, statusTone } from "../../components/ui";
import { formatDateTime } from "../../services/dateUtils";
import { padelstackApi } from "../../services/padelstackApi";
import { Incident } from "../../types";

const incidentStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "REJECTED"];

/**
 * Vista de incidencias propias con alta multipart contra `/api/v1/incidents`.
 */
export function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setIncidents(await padelstackApi.myIncidents());
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No se pudieron cargar incidencias.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(
    () => incidents.filter((incident) => !statusFilter || incident.status === statusFilter),
    [incidents, statusFilter],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (title.trim().length < 3) {
      setError("El titulo debe tener al menos 3 caracteres.");
      return;
    }
    if (description.trim().length < 10) {
      setError("La descripcion debe tener al menos 10 caracteres.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    const formData = new FormData();
    formData.set("title", title.trim());
    formData.set("description", description.trim());
    if (photo) formData.set("photo", photo);

    try {
      await padelstackApi.createIncident(formData);
      setTitle("");
      setDescription("");
      setPhoto(null);
      setMessage("Incidencia registrada.");
      await load();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No se pudo registrar la incidencia.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(incidentId: string) {
    setSaving(true);
    setError(null);
    try {
      await padelstackApi.deleteIncident(incidentId);
      setMessage("Incidencia eliminada.");
      await load();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No se pudo eliminar la incidencia.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageLoader label="Cargando incidencias" />;

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Mantenimiento" title="Incidencias" />

      <Notice tone="info">Las incidencias documentan avisos sobre convivencia, desperfectos o uso indebido de zonas comunes.</Notice>
      {message && <Notice tone="success">{message}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      <Card>
        <form className="incident-form" onSubmit={submit}>
          <label className="field">
            <span>Titulo</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} required />
          </label>
          <label className="field">
            <span>Descripcion</span>
            <textarea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} required />
          </label>
          <label className="field">
            <span>Foto</span>
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
            />
          </label>
          <Button type="submit" disabled={saving}>
            <Plus size={18} />
            {saving ? "Guardando..." : "Nueva incidencia"}
          </Button>
        </form>
      </Card>

      <div className="filter-pills">
        <button className={!statusFilter ? "is-active" : ""} type="button" onClick={() => setStatusFilter("")}>
          Todas ({incidents.length})
        </button>
        {incidentStatuses.map((status) => (
          <button
            className={statusFilter === status ? "is-active" : ""}
            type="button"
            key={status}
            onClick={() => setStatusFilter(status)}
          >
            {status}
          </button>
        ))}
      </div>

      {filtered.length ? (
        <div className="incident-grid">
          {filtered.map((incident) => (
            <Card className="incident-card" key={incident.incidentId}>
              <div className="incident-card-head">
                <div>
                  <span className={`status-dot status-dot--${statusTone(incident.status)}`} />
                  <strong>{incident.title}</strong>
                </div>
                <Button variant="ghost" type="button" disabled={saving} onClick={() => void remove(incident.incidentId)}>
                  <Trash2 size={17} />
                </Button>
              </div>
              <p>{incident.description}</p>
              <div className="incident-card-foot">
                <Badge tone={statusTone(incident.status)}>{incident.status}</Badge>
                <span>{formatDateTime(incident.createdAt)}</span>
              </div>
              {incident.photoUrl && (
                <a className="text-link" href={incident.photoUrl} target="_blank" rel="noreferrer">
                  Ver foto
                </a>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="Sin incidencias" message="No hay incidencias para el filtro seleccionado." />
      )}
    </div>
  );
}
