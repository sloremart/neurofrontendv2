// components/ProtectedRoute.tsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";

interface ProtectedRouteProps {
  allowedRoles: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const userRole = userData?.cargo;
  if (!userRole) {
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/no-autorizado" />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
