import { Navigate, Route, Routes } from "react-router-dom";
import FloatingSOSButton from "./components/FloatingSOSButton";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import { AuthProvider, useAuth } from "./context/AuthContext";
import CheckIns from "./pages/CheckIns";
import Chatbot from "./pages/Chatbot";
import Contacts from "./pages/Contacts";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import Helpers from "./pages/Helpers";
import InvitePage from "./pages/InvitePage";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import RouteIntelligence from "./pages/RouteIntelligence";
import SharedLocation from "./pages/SharedLocation";
import usePassiveLocationSync from "./hooks/usePassiveLocationSync";

function AppShell() {
  const { user } = useAuth();
  usePassiveLocationSync(Boolean(user));

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
          <Route path="/chatbot" element={<ProtectedRoute><Chatbot /></ProtectedRoute>} />
          <Route path="/helpers" element={<ProtectedRoute><Helpers /></ProtectedRoute>} />
          <Route path="/routes" element={<ProtectedRoute><RouteIntelligence /></ProtectedRoute>} />
          <Route path="/checkins" element={<ProtectedRoute><CheckIns /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <FloatingSOSButton />
    </div>
  );
}

function Root() {
  const { user, loading } = useAuth();

  if (loading) return <div className="page-loading">Loading...</div>;
  if (!user) return <Landing />;
  return <AppShell />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/share/:token" element={<SharedLocation />} />
        <Route path="/invite/:token" element={<InvitePage />} />
        <Route path="/" element={<Root />} />
        <Route path="/*" element={<AppShell />} />
      </Routes>
    </AuthProvider>
  );
}
