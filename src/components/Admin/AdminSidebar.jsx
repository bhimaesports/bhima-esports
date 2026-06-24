import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const SECTIONS = [
  {
    title: 'Overview',
    links: [
      { path: '/admin', label: 'Dashboard', icon: '📊', end: true },
    ],
  },
  {
    title: 'Management',
    links: [
      { path: '/admin/registrations', label: 'Registrations', icon: '📋' },
      { path: '/admin/teams', label: 'Teams', icon: '👥' },
      { path: '/admin/players', label: 'Players', icon: '🎮' },
      { path: '/admin/tournaments', label: 'Tournaments', icon: '🏆' },
      { path: '/admin/match-results', label: 'Match Results', icon: '⚔️' },
    ],
  },
  {
    title: 'Data',
    links: [
      { path: '/admin/leaderboards', label: 'Leaderboards', icon: '📈' },
      { path: '/admin/be-points', label: 'BE Points', icon: '⭐' },
      { path: '/admin/certificates', label: 'Certificates', icon: '📜' },
      { path: '/admin/hall-of-fame', label: 'Hall of Fame', icon: '🏛️' },
    ],
  },
  {
    title: 'System',
    links: [
      { path: '/admin/announcements', label: 'Announcements', icon: '📢' },
      { path: '/admin/homepage-cms', label: 'Homepage CMS', icon: '📝' },
      { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
      { path: '/admin/security', label: 'Security', icon: '🔒' },
      { path: '/admin/backups', label: 'Backups', icon: '💾' },
    ],
  },
];

export default function AdminSidebar({ isOpen, onClose }) {
  const { logout } = useAuth();

  return (
    <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
      {SECTIONS.map((section) => (
        <div key={section.title}>
          <div className="sidebar-section-title">{section.title}</div>
          {section.links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <span style={{ fontSize: 'var(--text-base)' }}>{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </div>
      ))}

      <div style={{ padding: 'var(--space-6)', marginTop: 'auto' }}>
        <button
          onClick={logout}
          className="btn btn-danger btn-sm"
          style={{ width: '100%' }}
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
