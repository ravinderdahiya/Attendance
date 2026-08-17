import './leafletSetup';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StaffPage from './pages/StaffPage';
import OutletsPage from './pages/OutletsPage';
import LiveMonitorPage from './pages/LiveMonitorPage';
import RosterPage from './pages/RosterPage';
import TimesheetsPage from './pages/TimesheetsPage';
import QrCodesPage from './pages/QrCodesPage';
import VisitorsPage from './pages/VisitorsPage';
import PatrolsPage from './pages/PatrolsPage';
import LabourPage from './pages/LabourPage';
import FieldVisitsPage from './pages/FieldVisitsPage';

function Protected({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-ink-600 text-sm">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function Root() {
  const { user, isLoading } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isLoading ? null : user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<Protected><DashboardPage /></Protected>} />
      <Route path="/staff" element={<Protected><StaffPage /></Protected>} />
      <Route path="/outlets" element={<Protected><OutletsPage /></Protected>} />
      <Route path="/roster" element={<Protected><RosterPage /></Protected>} />
      <Route path="/timesheets" element={<Protected><TimesheetsPage /></Protected>} />
      <Route path="/live-monitor" element={<Protected><LiveMonitorPage /></Protected>} />
      <Route path="/qr-codes" element={<Protected><QrCodesPage /></Protected>} />
      <Route path="/visitors" element={<Protected><VisitorsPage /></Protected>} />
      <Route path="/patrols" element={<Protected><PatrolsPage /></Protected>} />
      <Route path="/labour" element={<Protected><LabourPage /></Protected>} />
      <Route path="/field-visits" element={<Protected><FieldVisitsPage /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </BrowserRouter>
  );
}
