// src/commons/NoAutorizado.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";

const NoAutorizado = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      background: "linear-gradient(135deg,rgb(34, 54, 53),rgb(187, 115, 229))",
      color: "white",
      textAlign: "center",
      padding: "2rem"
    }}>
      <h1 style={{ fontSize: "3rem", marginBottom: "1rem" }}>403 - Acceso Denegado</h1>
      <p style={{ fontSize: "1.3rem", maxWidth: "600px" }}>
        No tienes permiso para acceder a esta sección de la aplicación. Si crees que esto es un error, contacta con el administrador.
      </p>
      <Button
        variant="contained"
        style={{ marginTop: "2rem", backgroundColor: "white", color: "#f44336" }}
        onClick={() => navigate("/login")}
      >
        Volver al inicio
      </Button>
    </div>
  );
};

export default NoAutorizado;
