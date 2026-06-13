import type { User } from "firebase/auth";

export type UserRole = "NEIGHBOR" | "ADMIN" | "SUPERADMIN" | string;
export type ReservationMode = "SLOT" | "FULL_DAY" | string;
export type AvailabilityStatus = "AVAILABLE" | "RESERVED_BY_ME" | "RESERVED_BY_OTHER" | "BLOCKED" | string;
export type IncidentStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "REJECTED" | string;

export type PadelUser = {
  uid: string;
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  communityId?: string;
  communityName?: string;
  unitDisplay?: string;
  role?: UserRole;
  active: boolean;
};

export type CommunityItem = {
  communityId: string;
  name: string;
};

export type RegistrationMetadata = {
  communities: CommunityItem[];
  units: string[];
};

export type BootstrapUserRequest = {
  username: string;
  firstName: string;
  lastName: string;
  phone: string;
  communityId: string;
  communityName?: string;
  unitDisplay: string;
};

export type Resource = {
  resourceId: string;
  name: string;
  type: string;
  reservationMode: ReservationMode;
  slotMinutes?: number | null;
  openTime?: string | null;
  closeTime?: string | null;
  rulesText?: string | null;
};

export type AvailabilitySlot = {
  reservationId: string | null;
  label: string;
  startTime: string;
  endTime: string;
  status: AvailabilityStatus;
  ownerCurrentUser: boolean;
  blockReason: string | null;
};

export type AvailabilityDayStatus = {
  reservationId: string | null;
  status: AvailabilityStatus;
  ownerCurrentUser: boolean;
  blockReason: string | null;
};

export type Availability = {
  resourceId: string;
  date: string;
  reservationMode: ReservationMode;
  slots: AvailabilitySlot[] | null;
  dayStatus: AvailabilityDayStatus | null;
};

export type Reservation = {
  reservationId: string;
  resourceId: string;
  resourceName: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  allDay: boolean;
  slotLabel: string | null;
  status: string;
};

export type CreateReservationRequest = {
  resourceId: string;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  allDay: boolean;
};

export type Announcement = {
  announcementId: string;
  title: string;
  content: string;
  visible: boolean;
  publishedAt: string;
  createdByUid: string;
  createdByName: string;
  updatedAt: string;
};

export type Statute = {
  communityId: string;
  title: string;
  content: string;
  version: number;
  updatedAt: string;
  updatedByUid: string;
};

export type Incident = {
  incidentId: string;
  title: string;
  description: string;
  status: IncidentStatus;
  photoUrl?: string | null;
  createdByName: string;
  createdByEmail: string;
  createdAt: string;
};

export type AuthContextValue = {
  firebaseUser: User | null;
  profile: PadelUser | null;
  status: "loading" | "authenticated" | "unauthenticated";
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, profile: BootstrapUserRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};
