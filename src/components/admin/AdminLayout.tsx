import { Navigate, Routes, Route, NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AdminPlayers from './AdminPlayers';
import AdminTeams from './AdminTeams';
import AdminSkills from './AdminSkills';
import AdminStarPlayers from './AdminStarPlayers';

export default function AdminLayout() {
  const { user, loading } = useAuth();

  if (loading) return <div className="admin-loading">Loading...</div>;
  if (!user?.isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h3 className="admin-sidebar-title">Admin Panel</h3>
        <nav className="admin-nav">
          <NavLink to="/admin/players" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
            Players
          </NavLink>
          <NavLink to="/admin/teams" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
            Teams
          </NavLink>
          <NavLink to="/admin/stars" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
            Star Players
          </NavLink>
          <NavLink to="/admin/skills" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
            Skills
          </NavLink>
        </nav>
      </aside>
      <div className="admin-content">
        <Routes>
          <Route index element={<Navigate to="players" replace />} />
          <Route path="players" element={<AdminPlayers />} />
          <Route path="teams" element={<AdminTeams />} />
          <Route path="stars" element={<AdminStarPlayers />} />
          <Route path="skills" element={<AdminSkills />} />
        </Routes>
      </div>
    </div>
  );
}
