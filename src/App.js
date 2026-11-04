import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";
import AuthPage from "@/components/auth/AuthPage";
import { Toaster } from "@/components/ui/sonner";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import PublicForm from "@/pages/PublicForm";
import PublicWidget from "@/pages/PublicWidget";

const AuthStatus = ({ message, onRetry }) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
    <div className="max-w-md text-center">
      <p role={onRetry ? "alert" : "status"} className="text-sm text-slate-600">{message}</p>
      {onRetry && <button type="button" onClick={onRetry} className="mt-3 text-sm font-medium text-indigo-600">Try again</button>}
    </div>
  </div>
);

const AppRoutes = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/sign-in/*" element={<AuthRoute mode="sign-in" />} />
        <Route path="/sign-up/*" element={<AuthRoute mode="sign-up" />} />
        <Route path="/dashboard" element={<DashboardRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
};

function HomeRoute() {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : <Landing />;
}

function AuthRoute({ mode }) {
  const { user, status, error, refresh } = useAuth();
  if (status === "loading") return <AuthStatus message="Checking your session…" />;
  if (status === "error") return <AuthStatus message={error} onRetry={refresh} />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <AuthPage mode={mode} />;
}

function DashboardRoute() {
  const { user, status, error, refresh } = useAuth();
  if (status === "loading") return <AuthStatus message="Checking your session…" />;
  if (status === "error") return <AuthStatus message={error} onRetry={refresh} />;
  return user ? <Dashboard /> : <Navigate to="/sign-in" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public pages load without the auth provider so they stay light inside iframes */}
        <Route path="/submit/:profileId" element={<PublicForm />} />
        <Route path="/widget/:profileId" element={<PublicWidget />} />
        <Route path="/*" element={<AppRoutes />} />
      </Routes>
      <Toaster position="top-center" richColors />
    </BrowserRouter>
  );
}

export default App;
