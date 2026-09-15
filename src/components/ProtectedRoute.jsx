import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Waveform from "./Waveform";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <Waveform size="md" active color="var(--color-accent)" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}