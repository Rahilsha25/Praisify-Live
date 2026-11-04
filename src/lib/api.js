import axios from "axios";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export const API = `${process.env.REACT_APP_BACKEND_URL || ""}/api`;

// Public (anonymous) client for the submit form and widget.
export const publicApi = axios.create({ baseURL: `${API}/public`, withCredentials: true });

// Human-readable message from API errors.
export const errMsg = (error, fallback = "Something went wrong") => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg.replace(/^Value error, /, "");
  return fallback;
};

// Authentication is carried by the backend's HttpOnly session cookie.
export function useAuthedApi() {
  const navigate = useNavigate();
  return useCallback(
    async (method, url, data) => {
      try {
        const response = await axios({
          method,
          url: `${API}${url}`,
          data,
          withCredentials: true,
        });
        return response.data;
      } catch (error) {
        if (error.response?.status === 401) navigate("/sign-in", { replace: true });
        throw error;
      }
    },
    [navigate],
  );
}
