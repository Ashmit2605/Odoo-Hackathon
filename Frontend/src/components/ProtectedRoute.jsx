import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-8 text-center text-gray-500">Loading...</p>;
  return user ? children : <Navigate to="/login" replace />;
}
