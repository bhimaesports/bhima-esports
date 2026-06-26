import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import AdminLoginPage from './pages/Admin/AdminLoginPage';
import AdminLayout from './components/Admin/AdminLayout';

// Public Pages
import Home from './pages/Home';
import Tournaments from './pages/Tournaments';
import Register from './pages/Register';
import Leaderboard from './pages/Leaderboard';
import BEPoints from './pages/BEPoints';
import HallOfFame from './pages/HallOfFame';
import Certificates from './pages/Certificates';
import Achievements from './pages/Achievements';
import CertificateVerify from './pages/CertificateVerify';
import PublicTeams from './pages/PublicTeams';
import PublicTeamProfile from './pages/PublicTeamProfile';
import PublicPlayers from './pages/PublicPlayers';
import PublicPlayerProfile from './pages/PublicPlayerProfile';
import Schedule from './pages/Schedule';
import TournamentProfile from './pages/TournamentProfile';
import Search from './pages/Search';
import PlayerLogin from './pages/PlayerLogin';
import PlayerRegister from './pages/PlayerRegister';
import PlayerDashboard from './pages/PlayerDashboard';
import About from './pages/About';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import NotFound from './pages/NotFound';

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
import AdminAchievements from './pages/Admin/AdminAchievements';
import AdminAnnouncements from './pages/Admin/AdminAnnouncements';
import AdminHomepageCMS from './pages/Admin/AdminHomepageCMS';
import AdminSettings from './pages/Admin/AdminSettings';
import AdminSecurity from './pages/Admin/AdminSecurity';
import AdminHallOfFame from './pages/Admin/AdminHallOfFame';
import AdminBackups from './pages/Admin/AdminBackups';
import AdminDepartments from './pages/Admin/AdminDepartments';

export default function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="app-container">
      {!isAdminRoute && <Navbar />}

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/tournaments" element={<Tournaments />} />
        <Route path="/tournament-register" element={<Register />} />
        <Route path="/register" element={<PlayerRegister />} />
        <Route path="/login" element={<PlayerLogin />} />
        <Route path="/dashboard/*" element={<PlayerDashboard />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/be-points" element={<BEPoints />} />
        <Route path="/hall-of-fame" element={<HallOfFame />} />
        <Route path="/certificates" element={<Certificates />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/verify/:certId" element={<CertificateVerify />} />
        <Route path="/teams" element={<PublicTeams />} />
        <Route path="/teams/:id" element={<PublicTeamProfile />} />
        <Route path="/players" element={<PublicPlayers />} />
        <Route path="/players/:id" element={<PublicPlayerProfile />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/tournaments/:id" element={<TournamentProfile />} />
        <Route path="/search" element={<Search />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
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
          <Route path="achievements" element={<AdminAchievements />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="homepage-cms" element={<AdminHomepageCMS />} />
          <Route path="departments" element={<AdminDepartments />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="security" element={<AdminSecurity />} />
          <Route path="backups" element={<AdminBackups />} />
          <Route path="hall-of-fame" element={<AdminHallOfFame />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {!isAdminRoute && <Footer />}
    </div>
  );
}
