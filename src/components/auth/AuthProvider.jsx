import { createContext, useCallback, useContext, useEffect, useState } from "react";
import axios from "axios";
import { API, errMsg } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setStatus("loading");
    setError("");
    try {
      const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setUser(response.data.user);
      setStatus("ready");
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        setUser(null);
        setStatus("ready");
        return;
      }
      if (!requestError.response || [502, 503, 504].includes(requestError.response.status)) {
        setError(
          "Can't reach the Praisify API. Start the backend in a second terminal. "
          + "On first setup, create backend/.env and set JWT_SECRET as described in README.md.",
        );
      } else {
        setError(errMsg(requestError, "Could not connect to the Praisify backend."));
      }
      setStatus("error");
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const authenticate = useCallback(async (action, credentials) => {
    const response = await axios.post(`${API}/auth/${action}`, credentials, { withCredentials: true });
    setUser(response.data.user);
    setStatus("ready");
    setError("");
    return response.data.user;
  }, []);

  const login = useCallback((credentials) => authenticate("login", credentials), [authenticate]);
  const register = useCallback((credentials) => authenticate("register", credentials), [authenticate]);

  const logout = useCallback(async () => {
    await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    setUser(null);
    setStatus("ready");
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, error, refresh, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}
