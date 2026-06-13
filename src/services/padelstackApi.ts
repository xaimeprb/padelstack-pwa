import {
  Announcement,
  Availability,
  BootstrapUserRequest,
  CreateReservationRequest,
  Incident,
  PadelUser,
  RegistrationMetadata,
  Reservation,
  Resource,
  Statute,
} from "../types";
import { apiRequest } from "./apiClient";

/**
 * Servicio de fachada para mantener la PWA desacoplada de las rutas REST concretas.
 */
export const padelstackApi = {
  getRegistrationMetadata() {
    return apiRequest<RegistrationMetadata>("/api/v1/public/registration-metadata", { auth: false });
  },
  bootstrapUser(request: BootstrapUserRequest) {
    return apiRequest<{ created: boolean }>("/api/v1/users/bootstrap", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },
  me() {
    return apiRequest<PadelUser>("/api/v1/me");
  },
  resources() {
    return apiRequest<Resource[]>("/api/v1/resources");
  },
  availability(resourceId: string, date: string) {
    return apiRequest<Availability>(`/api/v1/resources/${encodeURIComponent(resourceId)}/availability?date=${date}`);
  },
  myReservations(status = "ACTIVE") {
    return apiRequest<Reservation[]>(`/api/v1/reservations/me?status=${encodeURIComponent(status)}`);
  },
  createReservation(request: CreateReservationRequest) {
    return apiRequest<{ reservationId: string; status: string }>("/api/v1/reservations", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },
  cancelReservation(reservationId: string) {
    return apiRequest<{ deleted: boolean }>(`/api/v1/reservations/${encodeURIComponent(reservationId)}`, {
      method: "DELETE",
    });
  },
  announcements() {
    return apiRequest<Announcement[]>("/api/v1/announcements");
  },
  statutes() {
    return apiRequest<Statute>("/api/v1/statutes");
  },
  myIncidents() {
    return apiRequest<Incident[]>("/api/v1/incidents/mine");
  },
  createIncident(formData: FormData) {
    return apiRequest<{ incidentId: string; status: string }>("/api/v1/incidents", {
      method: "POST",
      body: formData,
    });
  },
  deleteIncident(incidentId: string) {
    return apiRequest<{ deleted: boolean }>(`/api/v1/incidents/${encodeURIComponent(incidentId)}`, {
      method: "DELETE",
    });
  },
};
