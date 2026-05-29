import React, { useState } from "react";
import {
  Box, Button, TextField, Alert, CircularProgress,
  Paper, Typography, InputAdornment, IconButton,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useNavigate } from "react-router-dom";
import { saveToken } from "../../config/token.jsx";
import CONFIG from "../../config/api.js";

const ROLE_ROUTES: Record<string, string> = {
  CuentasMedicas: "/talento_humano",
  LiderCuentasMedicas: "/talento_humano",
  EstudiosSueño: "/ge_documental_resultados",
  Asistencial: "/ge_documental_resultados",
  Contador: "/documental_programacion_pagos",
  Financiera: "/documental_programacion_pagos",
  AdministrativoGerencia: "/facturas_proveedores",
};

const LoginForm = () => {
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const API_ENDPOINT = CONFIG.API_ENDPOINT;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_ENDPOINT}/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (response.ok) {
        saveToken(data.token);
        localStorage.setItem("userData", JSON.stringify(data.user));
        const route = ROLE_ROUTES[data.user.cargo] ?? "/ge_documental";
        navigate(route);
      } else {
        setError(data.detail ?? "Usuario o contraseña incorrectos.");
      }
    } catch {
      setError("Error de conexión. Intente de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        bgcolor: "#f0f2f5",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url(/logo192.jpeg)",
          backgroundSize: "contain",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          opacity: 0.18,
          filter: "blur(4px)",
        }}
      />

      <Paper elevation={6} sx={{ p: 5, width: 380, borderRadius: 3, zIndex: 1 }}>
        <Typography variant="h5" fontWeight={700} textAlign="center" mb={0.5}>
          NEURODX
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" mb={3.5}>
          Su diagnóstico, nuestro compromiso
        </Typography>

        <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2.5}>
          <TextField
            label="Usuario"
            name="username"
            value={form.username}
            onChange={handleChange}
            fullWidth
            autoComplete="username"
            autoFocus
            required
          />

          <TextField
            label="Contraseña"
            name="password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={handleChange}
            fullWidth
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(p => !p)} edge="end" tabIndex={-1}>
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {error && <Alert severity="error">{error}</Alert>}

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {loading ? "Ingresando..." : "Iniciar Sesión"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginForm;
