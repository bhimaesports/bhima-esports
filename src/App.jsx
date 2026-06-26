import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import AdminLoginPage from './pages/Admin/AdminLoginPage';
import AdminLayout from './components/Admin/AdminLayout';

// Critical Public Pages (Load instantly)
import Home from './pages/Home';
import Tournaments from './pages/Tournaments';
import Register from './pages/Register';

// Lazy Load Public Pages
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const BEPoints = lazy(() => import('./pages/BEPoints'));
const HallOfFame = lazy(() => import('./pages/HallOfFame'));
const Certificates = lazy(() => import('./pages/Certificates'));
const Achievements = lazy(() => import('./pages/Achievements'));
const CertificateVerify = lazy(() => import('./pages/CertificateVerify'));
const PublicTeams = lazy(() => import('./pages/PublicTeams'));
const PublicTeamProfile = lazy(() => import('./pages/PublicTeamProfile'));
const PublicPlayers = lazy(() => import('./pages/PublicPlayers'));
const PublicPlayerProfile = lazy(() => import('./pages/PublicPlayerProfile'));
const Schedule = lazy(() => import('./pages/Schedule'));
const TournamentProfile = lazy(() => import('./pages/TournamentProfile'));
const Search = lazy(() => import('./pages/Search'));
const PlayerLogin = lazy(() => import('./pages/PlayerLogin'));
const PlayerRegister = lazy(() => import('./pages/PlayerRegister'));
const PlayerDashboard = lazy(() => import('./pages/PlayerDashboard'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Terms = lazy(() => import('./pages/Terms'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Lazy Load Admin Pages
const Dashboard = lazy(() => import('./pages/Admin/Dashboard'));
const AdminRegistrations = lazy(() => import('./pages/Admin/AdminRegistrations'));
const AdminTeams = lazy(() => import('./pages/Admin/AdminTeams'));
const TeamDetails = lazy(() => import('./pages/Admin/TeamDetails'));
const AdminPlayers = lazy(() => import('./pages/Admin/AdminPlayers'));
const PlayerProfile = lazy(() => import('./pages/Admin/PlayerProfile'));
const AdminTournaments = lazy(() => import('./pages/Admin/AdminTournaments'));
const AdminMatchResults = lazy(() => import('./pages/Admin/AdminMatchResults'));
const AdminLeaderboards = lazy(() => import('./pages/Admin/AdminLeaderboards'));
const AdminBEPoints = lazy(() => import('./pages/Admin/AdminBEPoints'));
const AdminCertificates = lazy(() => import('./pages/Admin/AdminCertificates'));
const AdminAchievements = lazy(() => import('./pages/Admin/AdminAchievements'));
const AdminAnnouncements = lazy(() => import('./pages/Admin/AdminAnnouncements'));
const AdminHomepageCMS = lazy(() => import('./pages/Admin/AdminHomepageCMS'));
const AdminSettings = lazy(() => import('./pages/Admin/AdminSettings'));
const AdminSecurity = lazy(() => import('./pages/Admin/AdminSecurity'));
const AdminHallOfFame = lazy(() => import('./pages/Admin/AdminHallOfFame'));
const AdminBackups = lazy(() => import('./pages/Admin/AdminBackups'));
const AdminDepartments = lazy(() => import('./pages/Admin/AdminDepartments'));

const PageLoader = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
    <div style={{ color: 'var(--neon)', fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, animation: 'pulse 1.5s infinite', letterSpacing: '2px' }}>LOADING...</div>
  </div>
);

export default function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="app-container">
      {!isAdminRoute && <Navbar />}

      <Suspense fallback={<PageLoader />}>
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
      </Suspense>

      {!isAdminRoute && <Footer />}
    </div>
  );
}
