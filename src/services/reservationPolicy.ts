import { Reservation, Resource } from "../types";
import { addDays, addMonths, parseApiDate, todayApiDate, toApiDate } from "./dateUtils";

export const PADEL_RESOURCE_ID = "PADEL_1";
export const MERENDERO_RESOURCE_ID = "MERENDERO_1";

export type PolicyResult = {
  allowed: boolean;
  reason?: string;
};

function minutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function isSummerPadelWindow(date: Date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return (month === 6 && day >= 15) || month === 7 || month === 8 || (month === 9 && day <= 10);
}

function padelStatutoryOpen(date: Date) {
  return isSummerPadelWindow(date) ? "08:30" : "10:00";
}

function bookingWindowOpenedForPadel(date: Date, now = new Date()) {
  const opensAt = new Date(date);
  opensAt.setDate(opensAt.getDate() - 1);
  opensAt.setHours(8, 0, 0, 0);
  return now >= opensAt;
}

function hasActivePadelReservationOnDate(reservations: Reservation[], date: string) {
  return reservations.some(
    (reservation) =>
      reservation.status === "ACTIVE" &&
      reservation.resourceId === PADEL_RESOURCE_ID &&
      reservation.date === date,
  );
}

function isMerenderoForbiddenDate(date: Date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return (month === 12 && [24, 25, 31].includes(day)) || (month === 1 && [1, 6].includes(day));
}

function isPastDate(date: string) {
  return date < todayApiDate();
}

/**
 * Aplica en cliente las restricciones explicitas de los estatutos antes de llamar al backend.
 */
export function canReserveResource(
  resource: Resource,
  date: string,
  reservations: Reservation[],
  slot?: { startTime: string; endTime: string },
): PolicyResult {
  if (isPastDate(date)) {
    return { allowed: false, reason: "No se pueden crear reservas en fechas pasadas." };
  }

  const selected = parseApiDate(date);

  if (resource.resourceId === PADEL_RESOURCE_ID || resource.type === "PADEL") {
    if (!bookingWindowOpenedForPadel(selected)) {
      return {
        allowed: false,
        reason: "Art. 42: la pista solo puede solicitarse desde las 08:00 del dia anterior.",
      };
    }
    if (hasActivePadelReservationOnDate(reservations, date)) {
      return {
        allowed: false,
        reason: "Art. 41: maximo una reserva de hora y media por propietario o inquilino y dia.",
      };
    }
    if (slot) {
      const open = minutes(padelStatutoryOpen(selected));
      const close = minutes("22:00");
      if (minutes(slot.startTime) < open || minutes(slot.endTime) > close) {
        return {
          allowed: false,
          reason: "Art. 38: horario estatutario de padel fuera del tramo permitido.",
        };
      }
    }
  }

  if (resource.resourceId === MERENDERO_RESOURCE_ID || resource.type === "MERENDERO") {
    const today = parseApiDate(todayApiDate());
    const minDate = toApiDate(addDays(today, 5));
    const maxDate = toApiDate(addMonths(today, 4));
    if (date < minDate || date > maxDate) {
      return {
        allowed: false,
        reason: "Art. 50: el merendero exige entre 5 dias y 4 meses de antelacion.",
      };
    }
    if (isMerenderoForbiddenDate(selected)) {
      return {
        allowed: false,
        reason: "Art. 53: no se admiten reservas de merendero los dias 24, 25, 31 de diciembre ni 1 y 6 de enero.",
      };
    }
  }

  return { allowed: true };
}

export function statutorySummaryFor(resource: Resource) {
  if (resource.resourceId === PADEL_RESOURCE_ID || resource.type === "PADEL") {
    return "Arts. 38-44: turnos de 90 min, solicitud desde las 08:00 del dia anterior y una reserva diaria por vivienda.";
  }
  if (resource.resourceId === MERENDERO_RESOURCE_ID || resource.type === "MERENDERO") {
    return "Arts. 50-57: reserva de dia completo, 5 dias a 4 meses de antelacion, aforo 30 y cuota de 30 euros.";
  }
  return resource.rulesText || "Normativa gestionada desde el PanelAdmin.";
}
