import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import CheckIns from "./pages/CheckIns";
import Chatbot from "./pages/Chatbot";
import Contacts from "./pages/Contacts";
import Dashboard from "./pages/Dashboard";
import Helpers from "./pages/Helpers";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import RouteIntelligence from "./pages/RouteIntelligence";
import SharedLocation from "./pages/SharedLocation";

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/share/:token" element={<SharedLocation />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
        <Route path="/chatbot" element={<ProtectedRoute><Chatbot /></ProtectedRoute>} />
        <Route path="/helpers" element={<ProtectedRoute><Helpers /></ProtectedRoute>} />
        <Route path="/routes" element={<ProtectedRoute><RouteIntelligence /></ProtectedRoute>} />
        <Route path="/checkins" element={<ProtectedRoute><CheckIns /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
