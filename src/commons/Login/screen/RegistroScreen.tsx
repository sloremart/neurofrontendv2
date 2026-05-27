import React, { useState } from "react";
import {
  Box, Button, TextField, Alert, CircularProgress,
  Paper, Typography, MenuItem, InputAdornment, IconButton,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import CONFIG from "../../../config/api.js";

const CARGOS = [
  "CuentasMedicas",
  "LiderCuentasMedicas",
  "EstudiosSueño",
  "Asistencial",
  "Contador",
  "Financiera",
  "Administrativo",
  "AdministrativoGerencia",
  "Sistemas",
];

const emptyForm = {
  nombre: "",
  email: "",
  cargo: "",
  password: "",
  password_confirm: "",
};

const RegisterForm = () => {
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const API_ENDPOINT = CONFIG.API_ENDPOINT;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setStatus(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch(`${API_ENDPOINT}/auth/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (response.ok) {
        setStatus({
          type: "success",
          message: `Usuario registrado correctamente. Su nombre de usuario es: ${data.user.username}`,
        });
        setForm(emptyForm);
      } else {
        const errors = data.errors ?? {};
        const firstError =
          Object.values(errors).flat().join(" ") ||
          data.detail ||
          "Error al registrar usuario.";
        setStatus({ type: "error", message: String(firstError) });
      }
    } catch {
      setStatus({ type: "error", message: "Error de conexión. Intente de nuevo." });
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
          backgroundImage: `url(${process.env.PUBLIC_URL}/logo192.jpeg)`,
          backgroundSize: "contain",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          opacity: 0.18,
          filter: "blur(4px)",
        }}
      />

      <Paper elevation={6} sx={{ p: 5, width: 460, borderRadius: 3, zIndex: 1 }}>
        <Typography variant="h5" fontWeight={700} textAlign="center" mb={0.5}>
          REGISTRO DE USUARIO
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" mb={3.5}>
          El nombre de usuario se asigna automáticamente desde el correo electrónico
        </Typography>

        <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2.5}>
          <TextField
            label="Nombre Completo"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            fullWidth
            required
            autoFocus
          />

          <TextField
            label="Correo Electrónico"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            fullWidth
            required
            helperText="El usuario será la parte antes del @"
          />

          <TextField
            select
            label="Cargo"
            name="cargo"
            value={form.cargo}
            onChange={handleChange}
            fullWidth
            required
          >
            {CARGOS.map(c => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </TextField>

          <TextField
            label="Contraseña"
            name="password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={handleChange}
            fullWidth
            required
            helperText="Mínimo 4 caracteres"
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

          <TextField
            label="Confirmar Contraseña"
            name="password_confirm"
            type={showConfirm ? "text" : "password"}
            value={form.password_confirm}
            onChange={handleChange}
            fullWidth
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowConfirm(p => !p)} edge="end" tabIndex={-1}>
                    {showConfirm ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {status && (
            <Alert severity={status.type} sx={{ whiteSpace: "pre-line" }}>
              {status.message}
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {loading ? "Registrando..." : "Registrar Usuario"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default RegisterForm;
