import { useEffect, useMemo, useState } from "react";
import { CalendarDays, RefreshCw, ShieldAlert, Utensils } from "lucide-react";
import { PageHeader } from "../../components/AppShell";
import { Badge, Button, Card, EmptyState, Notice, PageLoader, ResourceIconShell, statusTone } from "../../components/ui";
import { formatApiDate, todayApiDate } from "../../services/dateUtils";
import { availabilityStatusLabel, friendlyError, reservationStatusLabel } from "../../services/displayHelpers";
import { padelstackApi } from "../../services/padelstackApi";
import { canReserveResource, MERENDERO_RESOURCE_ID, PADEL_RESOURCE_ID, statutorySummaryFor } from "../../services/reservationPolicy";
import { Availability, AvailabilityDayStatus, AvailabilitySlot, Reservation, Resource } from "../../types";

function preferredResource(resources: Resource[]) {
  return resources.find((resource) => resource.resourceId === PADEL_RESOURCE_ID)?.resourceId ?? resources[0]?.resourceId ?? "";
}

export function ReservationsPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState("");
  const [date, setDate] = useState(todayApiDate());
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const selectedResource = useMemo(
    () => resources.find((resource) => resource.resourceId === selectedResourceId) ?? null,
    [resources, selectedResourceId],
  );
  const hasResources = resources.length > 0;

  async function loadBase() {
    setLoadingInitial(true);
    setError(null);
    try {
      const [nextResources, nextReservations] = await Promise.all([
        padelstackApi.resources(),
        padelstackApi.myReservations(),
      ]);
      setResources(nextResources);
      setReservations(nextReservations);
      setSelectedResourceId((current) => current || preferredResource(nextResources));
      if (!nextResources.length) setAvailability(null);
    } catch (nextError) {
      setError(friendlyError(nextError, "No se pudieron cargar tus reservas."));
    } finally {
      setLoadingInitial(false);
    }
  }

  async function loadAvailability(resourceId = selectedResourceId) {
    if (!resourceId) {
      setAvailability(null);
      return;
    }
    setLoadingAvailability(true);
    setError(null);
    try {
      setAvailability(await padelstackApi.availability(resourceId, date));
      setReservations(await padelstackApi.myReservations());
    } catch (nextError) {
      setAvailability(null);
      setError(friendlyError(nextError, "No se pudo cargar la disponibilidad."));
    } finally {
      setLoadingAvailability(false);
    }
  }

  useEffect(() => {
    void loadBase();
  }, []);

  useEffect(() => {
    if (selectedResourceId) void loadAvailability(selectedResourceId);
  }, [selectedResourceId, date]);

  async function reserveSlot(slot: AvailabilitySlot) {
    if (!selectedResource) return;
    const policy = canReserveResource(selectedResource, date, reservations, slot);
    if (!policy.allowed) {
      setMessage(policy.reason ?? "Reserva no permitida.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await padelstackApi.createReservation({
        resourceId: selectedResource.resourceId,
        date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        allDay: false,
      });
      setMessage("Reserva creada correctamente.");
      await loadAvailability();
    } catch (nextError) {
      setError(friendlyError(nextError, "No se pudo crear la reserva."));
    } finally {
      setSaving(false);
    }
  }

  async function reserveDay() {
    if (!selectedResource) return;
    const policy = canReserveResource(selectedResource, date, reservations);
    if (!policy.allowed) {
      setMessage(policy.reason ?? "Reserva no permitida.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await padelstackApi.createReservation({
        resourceId: selectedResource.resourceId,
        date,
        allDay: true,
      });
      setMessage("Reserva de dia completo creada.");
      await loadAvailability();
    } catch (nextError) {
      setError(friendlyError(nextError, "No se pudo crear la reserva."));
    } finally {
      setSaving(false);
    }
  }

  async function cancelReservation(reservationId?: string | null) {
    if (!reservationId) return;
    setSaving(true);
    setMessage(null);
    try {
      await padelstackApi.cancelReservation(reservationId);
      setMessage("Reserva cancelada.");
      await loadAvailability();
    } catch (nextError) {
      setError(friendlyError(nextError, "No se pudo cancelar la reserva."));
    } finally {
      setSaving(false);
    }
  }

  if (loadingInitial) return <PageLoader label="Cargando reservas" />;

  const policyPreview = selectedResource ? canReserveResource(selectedResource, date, reservations) : { allowed: hasResources };

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Reservas" title="Disponibilidad">
        <Button variant="secondary" type="button" onClick={() => void loadAvailability()} disabled={!selectedResourceId}>
          <RefreshCw size={17} />
          Actualizar
        </Button>
      </PageHeader>

      {error && <Notice tone="error">{error}</Notice>}
      {message && <Notice tone={message.includes("correct") || message.includes("cancelada") ? "success" : "warning"}>{message}</Notice>}

      <Card className="booking-panel">
        <div className="booking-controls">
          <label className="field">
            <span>Instalacion</span>
            <select
              value={selectedResourceId}
              onChange={(event) => setSelectedResourceId(event.target.value)}
              disabled={!hasResources}
            >
              {hasResources ? (
                resources.map((resource) => (
                  <option key={resource.resourceId} value={resource.resourceId}>
                    {resource.name}
                  </option>
                ))
              ) : (
                <option value="">Sin instalaciones disponibles</option>
              )}
            </select>
          </label>
          <label className="field">
            <span>Fecha</span>
            <input type="date" value={date} min={todayApiDate()} onChange={(event) => setDate(event.target.value)} />
          </label>
        </div>

        {!hasResources && (
          <Notice tone="info">No hay instalaciones disponibles para reservar en tu comunidad.</Notice>
        )}

        {hasResources && !selectedResource && (
          <Notice tone="info">Selecciona una instalacion para consultar disponibilidad.</Notice>
        )}

        {selectedResource && (
          <div className="booking-resource-summary">
            <ResourceIconShell tone={selectedResource.resourceId === MERENDERO_RESOURCE_ID ? "tertiary" : "secondary"}>
              {selectedResource.resourceId === MERENDERO_RESOURCE_ID ? <Utensils size={22} /> : <CalendarDays size={22} />}
            </ResourceIconShell>
            <div>
              <strong>{selectedResource.name}</strong>
              <span>{statutorySummaryFor(selectedResource)}</span>
            </div>
          </div>
        )}
      </Card>

      {!policyPreview.allowed && (
        <Notice tone="warning">
          <ShieldAlert size={18} />
          {policyPreview.reason}
        </Notice>
      )}

      {!hasResources ? (
        <EmptyState title="Sin reservas disponibles" message="No se puede reservar hasta que haya instalaciones disponibles." />
      ) : loadingAvailability ? (
        <PageLoader label="Calculando disponibilidad" />
      ) : !selectedResource ? (
        <EmptyState title="Selecciona instalacion" message="Selecciona una instalacion para consultar disponibilidad." />
      ) : selectedResource.reservationMode === "FULL_DAY" ? (
        <DayAvailability
          status={availability?.dayStatus ?? null}
          saving={saving}
          disabled={!policyPreview.allowed}
          onReserve={reserveDay}
          onCancel={cancelReservation}
        />
      ) : availability?.slots?.length ? (
        <div className="slot-grid">
          {availability.slots.map((slot) => (
            <SlotCard
              key={`${slot.startTime}-${slot.endTime}`}
              slot={slot}
              saving={saving}
              policy={selectedResource ? canReserveResource(selectedResource, date, reservations, slot) : { allowed: false }}
              onReserve={reserveSlot}
              onCancel={cancelReservation}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="Sin horarios disponibles" message="No hay horarios disponibles para la fecha seleccionada." />
      )}

      <Card>
        <div className="section-heading">
          <CalendarDays size={18} />
          <h3>Mis reservas activas</h3>
        </div>
        {reservations.length ? (
          <div className="list-stack">
            {reservations.map((reservation) => (
              <article className="compact-line" key={reservation.reservationId}>
                <strong>{reservation.resourceName || reservation.resourceId}</strong>
                <span>{formatApiDate(reservation.date)} - {reservation.slotLabel || "Dia completo"}</span>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="Sin reservas activas" message="No tienes reservas activas." />
        )}
      </Card>
    </div>
  );
}

function DayAvailability({
  status,
  saving,
  disabled,
  onReserve,
  onCancel,
}: {
  status: AvailabilityDayStatus | null;
  saving: boolean;
  disabled: boolean;
  onReserve: () => void;
  onCancel: (reservationId?: string | null) => void;
}) {
  const state = status?.status ?? "BLOCKED";
  const byMe = state === "RESERVED_BY_ME";
  const available = state === "AVAILABLE";
  return (
    <Card className={`day-card day-card--${statusTone(state)}`}>
      <strong>{available ? "Dia disponible" : byMe ? "Reservado por ti" : "No disponible"}</strong>
      <span>{status?.blockReason || (available ? "Instalacion disponible para dia completo." : "El dia ya no esta libre.")}</span>
      {available && (
        <Button type="button" disabled={saving || disabled} onClick={onReserve}>
          Reservar dia
        </Button>
      )}
      {byMe && (
        <Button variant="danger" type="button" disabled={saving} onClick={() => onCancel(status?.reservationId)}>
          Cancelar
        </Button>
      )}
    </Card>
  );
}

function SlotCard({
  slot,
  saving,
  policy,
  onReserve,
  onCancel,
}: {
  slot: AvailabilitySlot;
  saving: boolean;
  policy: { allowed: boolean; reason?: string };
  onReserve: (slot: AvailabilitySlot) => void;
  onCancel: (reservationId?: string | null) => void;
}) {
  const available = slot.status === "AVAILABLE";
  const byMe = slot.status === "RESERVED_BY_ME";
  return (
    <article className={`slot-card slot-card--${statusTone(slot.status)}`}>
      <div>
        <strong>{slot.label}</strong>
        <span>{available ? "Disponible" : byMe ? "Reservado por ti" : slot.blockReason || "No disponible"}</span>
      </div>
      <Badge tone={statusTone(slot.status)}>{availabilityStatusLabel(slot.status)}</Badge>
      {available && (
        <Button type="button" disabled={saving || !policy.allowed} onClick={() => onReserve(slot)}>
          Reservar
        </Button>
      )}
      {byMe && (
        <Button variant="danger" type="button" disabled={saving} onClick={() => onCancel(slot.reservationId)}>
          Cancelar
        </Button>
      )}
    </article>
  );
}
