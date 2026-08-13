import { createContext, useContext, useEffect, useState } from "react";
import { getMe, login as loginRequest, register as registerRequest } from "../api/auth";
import { clearSosOverlayCredentials, syncSosOverlayCredentials } from "../native/sosOverlay";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("safestep_token");
    if (!token) {
      setLoading(false);
      return;
    }
    getMe()
      .then((me) => {
        setUser(me);
        syncSosOverlayCredentials(token);
      })
      .catch(() => localStorage.removeItem("safestep_token"))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { access_token } = await loginRequest(email, password);
    localStorage.setItem("safestep_token", access_token);
    const me = await getMe();
    setUser(me);
    syncSosOverlayCredentials(access_token);
    return me;
  };

  const register = async (data) => {
    const { access_token } = await registerRequest(data);
    localStorage.setItem("safestep_token", access_token);
    const me = await getMe();
    setUser(me);
    syncSosOverlayCredentials(access_token);
    return me;
  };

  const logout = () => {
    localStorage.removeItem("safestep_token");
    setUser(null);
    clearSosOverlayCredentials();
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
