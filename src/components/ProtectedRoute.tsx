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

  // Soporta múltiples cargos separados por coma: "EstudiosSueño,AdministrativoGerencia"
  const normalizar = (r: string) => r.trim().toLowerCase();
  const userRoles = userRole.split(",").map(normalizar);
  if (!allowedRoles.some((r) => userRoles.includes(normalizar(r)))) {
    return <Navigate to="/no-autorizado" />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
