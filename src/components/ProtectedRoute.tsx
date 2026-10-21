// components/ProtectedRoute.tsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";

interface ProtectedRouteProps {
  allowedRoles: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const userRole: string = (userData?.cargo || "").trim();
  if (!userRole) {
    return <Navigate to="/login" />;
  }

  // Sin distinguir mayúsculas ni espacios ("Sistemas", "SISTEMAS", "Sistemas ")
  const normalizar = (r: string) => r.trim().toLowerCase();
  if (!allowedRoles.some((r) => normalizar(r) === normalizar(userRole))) {
    return <Navigate to="/no-autorizado" />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
