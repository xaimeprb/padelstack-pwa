import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { PageLoader } from "./components/ui";
import { useAuth } from "./features/auth/AuthContext";
import { LoginPage } from "./features/auth/LoginPage";
import { AnnouncementsPage } from "./features/announcements/AnnouncementsPage";
import { CommunityPage } from "./features/community/CommunityPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { IncidentsPage } from "./features/incidents/IncidentsPage";
import { ProfilePage } from "./features/profile/ProfilePage";
import { ResourcesPage } from "./features/resources/ResourcesPage";
import { ReservationsPage } from "./features/reservations/ReservationsPage";
import { StatutesPage } from "./features/statutes/StatutesPage";

function ProtectedAppShell() {
  const { status } = useAuth();
  if (status === "loading") return <PageLoader label="Preparando PADELSTACK" />;
  if (status !== "authenticated") return <Navigate to="/login" replace />;
  return <AppShell />;
}

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: <ProtectedAppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "/community", element: <CommunityPage /> },
      { path: "/resources", element: <ResourcesPage /> },
      { path: "/reservations", element: <ReservationsPage /> },
      { path: "/announcements", element: <AnnouncementsPage /> },
      { path: "/statutes", element: <StatutesPage /> },
      { path: "/incidents", element: <IncidentsPage /> },
      { path: "/profile", element: <ProfilePage /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);

/**
 * Punto de entrada de rutas de la PWA.
 */
export function App() {
  return <RouterProvider router={router} />;
}
