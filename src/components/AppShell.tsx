import { ReactNode } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Home,
  LogOut,
  MapPinned,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Button } from "./ui";
import { useAuth } from "../features/auth/AuthContext";

const navItems = [
  { to: "/", label: "Inicio", icon: Home },
  { to: "/community", label: "Comunidad", icon: UsersRound },
  { to: "/resources", label: "Recursos", icon: MapPinned },
  { to: "/reservations", label: "Reservas", icon: CalendarDays },
  { to: "/announcements", label: "Anuncios", icon: Bell },
  { to: "/statutes", label: "Estatutos", icon: BookOpen },
  { to: "/incidents", label: "Incidencias", icon: ClipboardList },
  { to: "/profile", label: "Perfil", icon: UserRound },
];

const titleByPath: Record<string, string> = {
  "/": "PADELSTACK",
  "/community": "Comunidad",
  "/resources": "Recursos",
  "/reservations": "Reservas",
  "/announcements": "Anuncios",
  "/statutes": "Estatutos",
  "/incidents": "Incidencias",
  "/profile": "Perfil",
};

function NavItems({ compact = false }: { compact?: boolean }) {
  return (
    <>
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => `app-nav-item ${isActive ? "is-active" : ""}`}>
          <span className="nav-icon" aria-hidden="true">
            <Icon size={compact ? 20 : 22} />
          </span>
          <span>{label}</span>
        </NavLink>
      ))}
    </>
  );
}

/**
 * Shell principal de la PWA: top bar, navegacion responsive y area de contenido autenticada.
 */
export function AppShell() {
  const { profile, logout } = useAuth();
  const location = useLocation();
  const title = titleByPath[location.pathname] ?? "PADELSTACK";

  return (
    <div className="app-shell">
      <aside className="side-rail">
        <div className="brand-block">
          <span className="brand-logo">PS</span>
          <div>
            <strong>PADELSTACK</strong>
            <small>{profile?.communityName || profile?.communityId || "Comunidad"}</small>
          </div>
        </div>
        <nav className="side-nav" aria-label="Navegacion principal">
          <NavItems />
        </nav>
        <Button variant="ghost" type="button" onClick={() => void logout()}>
          <LogOut size={18} />
          Salir
        </Button>
      </aside>

      <header className="top-app-bar">
        <span className="mobile-logo">PS</span>
        <h1>{title}</h1>
        <NavLink to="/profile" className="profile-dot" aria-label="Perfil">
          <UserRound size={20} />
        </NavLink>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="Navegacion movil">
        <NavItems compact />
      </nav>
    </div>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <span>{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {children}
    </header>
  );
}
