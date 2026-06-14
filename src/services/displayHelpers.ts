import { ApiError } from "./apiClient";

export function incidentStatusLabel(status?: string, plural = false) {
  const labels: Record<string, [string, string]> = {
    OPEN: ["Abierta", "Abiertas"],
    IN_PROGRESS: ["En curso", "En curso"],
    RESOLVED: ["Resuelta", "Resueltas"],
    REJECTED: ["Rechazada", "Rechazadas"],
  };
  if (!status) return plural ? "Sin estado" : "Sin estado";
  return labels[status]?.[plural ? 1 : 0] ?? status;
}

export function reservationStatusLabel(status?: string) {
  const labels: Record<string, string> = {
    ACTIVE: "Activa",
    CANCELLED: "Cancelada",
  };
  return status ? labels[status] ?? status : "Sin estado";
}

export function availabilityStatusLabel(status?: string) {
  const labels: Record<string, string> = {
    AVAILABLE: "Disponible",
    RESERVED_BY_ME: "Reservado por ti",
    RESERVED_BY_OTHER: "Ocupado",
    BLOCKED: "No disponible",
  };
  return status ? labels[status] ?? status : "Sin estado";
}

export function roleDisplayName(role?: string) {
  const labels: Record<string, string> = {
    NEIGHBOR: "Vecino",
    ADMIN: "Administrador de comunidad",
    SUPERADMIN: "Superadministrador",
  };
  return role ? labels[role] ?? role : "Vecino";
}

export function isNotFound(error: unknown) {
  return error instanceof ApiError && error.status === 404;
}

export function friendlyError(error: unknown, fallback: string) {
  if (!(error instanceof Error) || !error.message) return fallback;
  if (error.message.includes("VITE_API_BASE_URL")) return "No se pudo conectar con PADELSTACK.";
  if (error.message.toLowerCase().includes("api")) return fallback;
  return error.message;
}
