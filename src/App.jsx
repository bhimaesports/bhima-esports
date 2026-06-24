import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import AdminLoginModal from './components/Admin/AdminLoginModal';
import AdminLayout from './components/Admin/AdminLayout';

// Public Pages
import Home from './pages/Home';
import Tournaments from './pages/Tournaments';
import Register from './pages/Register';
import Leaderboard from './pages/Leaderboard';
import BEPoints from './pages/BEPoints';
import HallOfFame from './pages/HallOfFame';
import Certificates from './pages/Certificates';
import CertificateVerify from './pages/CertificateVerify';

// Admin Pages
import Dashboard from './pages/Admin/Dashboard';
import AdminRegistrations from './pages/Admin/AdminRegistrations';
import AdminTeams from './pages/Admin/AdminTeams';
import TeamDetails from './pages/Admin/TeamDetails';
import AdminPlayers from './pages/Admin/AdminPlayers';
import PlayerProfile from './pages/Admin/PlayerProfile';
import AdminTournaments from './pages/Admin/AdminTournaments';
import AdminMatchResults from './pages/Admin/AdminMatchResults';
import AdminLeaderboards from './pages/Admin/AdminLeaderboards';
import AdminBEPoints from './pages/Admin/AdminBEPoints';
import AdminCertificates from './pages/Admin/AdminCertificates';
import AdminAnnouncements from './pages/Admin/AdminAnnouncements';
import AdminHomepageCMS from './pages/Admin/AdminHomepageCMS';
import AdminSettings from './pages/Admin/AdminSettings';
import AdminSecurity from './pages/Admin/AdminSecurity';
import AdminHallOfFame from './pages/Admin/AdminHallOfFame';
import AdminBackups from './pages/Admin/AdminBackups';

export default function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="app-container">
      {!isAdminRoute && <Navbar />}
      {!isAdminRoute && <AdminLoginModal />}

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/tournaments" element={<Tournaments />} />
        <Route path="/register" element={<Register />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/be-points" element={<BEPoints />} />
        <Route path="/hall-of-fame" element={<HallOfFame />} />
        <Route path="/certificates" element={<Certificates />} />
        <Route path="/verify/:certId" element={<CertificateVerify />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="registrations" element={<AdminRegistrations />} />
          <Route path="teams" element={<AdminTeams />} />
          <Route path="teams/:id" element={<TeamDetails />} />
          <Route path="players" element={<AdminPlayers />} />
          <Route path="players/:id" element={<PlayerProfile />} />
          <Route path="tournaments" element={<AdminTournaments />} />
          <Route path="match-results" element={<AdminMatchResults />} />
          <Route path="leaderboards" element={<AdminLeaderboards />} />
          <Route path="be-points" element={<AdminBEPoints />} />
          <Route path="certificates" element={<AdminCertificates />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="homepage-cms" element={<AdminHomepageCMS />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="security" element={<AdminSecurity />} />
          <Route path="backups" element={<AdminBackups />} />
          <Route path="hall-of-fame" element={<AdminHallOfFame />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!isAdminRoute && <Footer />}
    </div>
  );
}
