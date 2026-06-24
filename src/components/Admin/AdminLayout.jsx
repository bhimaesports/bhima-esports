import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from './AdminSidebar';

export default function AdminLayout() {
  const { isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="admin-layout">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="admin-content">
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          style={{
            display: 'none',
            marginBottom: 'var(--space-4)',
            padding: '0.5rem 1rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text)',
            fontSize: 'var(--text-sm)',
          }}
          className="admin-sidebar-toggle"
        >
          ☰ Menu
        </button>

        <Outlet />
      </main>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 'calc(var(--z-overlay) - 1)',
            display: 'none',
          }}
          className="admin-sidebar-overlay"
        />
      )}

      <style>{`
        @media (max-width: 1024px) {
          .admin-sidebar-toggle { display: block !important; }
          .admin-sidebar-overlay { display: block !important; }
        }
      `}</style>
    </div>
  );
}
