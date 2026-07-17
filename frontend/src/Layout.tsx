import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "./auth-context";

const nav = [
  { to: "/accounts", label: "Accounts", short: "AC" },
  { to: "/permissions", label: "Permissions", short: "PE" },
  { to: "/usage", label: "Usage", short: "US" },
  { to: "/apis", label: "API Registry", short: "AP" },
];

export function Layout() {
  const { session, signOut } = useAuth();

  return (
    <div className="app-shell">
      <aside>
        <div className="sidebar-brand">
          <div className="brand-mark small">CA</div>
          <div>
            <strong>Common Admin</strong>
            <span>Platform console</span>
          </div>
        </div>
        <nav>
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to}>
              <span>{item.short}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <strong>{session.user.name}</strong>
          <span>{session.user.email || session.user.username}</span>
          <button className="text-button" onClick={() => void signOut()}>Sign out</button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
