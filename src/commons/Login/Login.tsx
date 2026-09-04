import React, { useState } from "react";
import {
  Box, Button, TextField, Alert, CircularProgress,
  Paper, Typography, InputAdornment, IconButton, Tabs, Tab, MenuItem,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useNavigate } from "react-router-dom";
import { saveToken } from "../../config/token.jsx";
import CONFIG from "../../config/api.js";

const API_ENDPOINT = CONFIG.API_ENDPOINT;

const ROLE_ROUTES: Record<string, string> = {
  CuentasMedicas: "/cuentas_medicas",
  LiderCuentasMedicas: "/cuentas_medicas",
  EstudiosSueño: "/ge_documental_resultados",
  Asistencial: "/ge_documental_resultados",
  Contador: "/documental_programacion_pagos",
  Financiera: "/documental_programacion_pagos",
  AdministrativoGerencia: "/facturas_proveedores",
};

const CARGOS = [
  "CuentasMedicas", "LiderCuentasMedicas", "EstudiosSueño", "Asistencial",
  "Contador", "Financiera", "Administrativo", "AdministrativoGerencia", "Sistemas",
];

const emptyRegister = { nombre: "", email: "", cargo: "", password: "", password_confirm: "" };

/* ── Login ─────────────────────────────────────────────────── */
const LoginPanel = () => {
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_ENDPOINT}/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        saveToken(data.token);
        localStorage.setItem("userData", JSON.stringify(data.user));
        navigate(ROLE_ROUTES[data.user.cargo] ?? "/ge_documental");
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
    <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2.5} mt={1}>
      <TextField
        label="Usuario"
        name="username"
        value={form.username}
        onChange={handleChange}
        fullWidth autoComplete="username" autoFocus required
      />
      <TextField
        label="Contraseña"
        name="password"
        type={showPassword ? "text" : "password"}
        value={form.password}
        onChange={handleChange}
        fullWidth required
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
        type="submit" variant="contained" size="large" disabled={loading}
        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
        sx={{ background: "linear-gradient(90deg, #381A73, #1E2E71)", mt: 0.5 }}
      >
        {loading ? "Ingresando..." : "Iniciar Sesión"}
      </Button>
    </Box>
  );
};

/* ── Registro ───────────────────────────────────────────────── */
const RegisterPanel = () => {
  const [form, setForm] = useState(emptyRegister);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setStatus(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`${API_ENDPOINT}/auth/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ type: "success", message: `Usuario registrado. Su nombre de usuario es: ${data.user.username}` });
        setForm(emptyRegister);
      } else {
        const errors = data.errors ?? {};
        const msg = Object.values(errors).flat().join(" ") || data.detail || "Error al registrar usuario.";
        setStatus({ type: "error", message: String(msg) });
      }
    } catch {
      setStatus({ type: "error", message: "Error de conexión. Intente de nuevo." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2} mt={1}>
      <TextField label="Nombre Completo" name="nombre" value={form.nombre} onChange={handleChange} fullWidth required autoFocus />
      <TextField
        label="Correo Electrónico" name="email" type="email"
        value={form.email} onChange={handleChange} fullWidth required
        helperText="El usuario será la parte antes del @"
      />
      <TextField select label="Cargo" name="cargo" value={form.cargo} onChange={handleChange} fullWidth required>
        {CARGOS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
      </TextField>
      <TextField
        label="Contraseña" name="password"
        type={showPassword ? "text" : "password"}
        value={form.password} onChange={handleChange} fullWidth required
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
        label="Confirmar Contraseña" name="password_confirm"
        type={showConfirm ? "text" : "password"}
        value={form.password_confirm} onChange={handleChange} fullWidth required
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
      {status && <Alert severity={status.type}>{status.message}</Alert>}
      <Button
        type="submit" variant="contained" size="large" disabled={loading}
        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
        sx={{ background: "linear-gradient(90deg, #381A73, #1E2E71)", mt: 0.5 }}
      >
        {loading ? "Registrando..." : "Registrar Usuario"}
      </Button>
    </Box>
  );
};

/* ── Vista combinada ────────────────────────────────────────── */
const LoginForm = () => {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", position: "relative", overflow: "hidden", bgcolor: "#f0f2f5",
    }}>
      {/* Fondo desvanecido */}
      <Box sx={{
        position: "absolute", inset: 0,
        backgroundImage: "url(/logo192.jpeg)",
        backgroundSize: "contain", backgroundPosition: "center",
        backgroundRepeat: "no-repeat", opacity: 0.18, filter: "blur(4px)",
      }} />

      <Paper elevation={6} sx={{ width: tab === 0 ? 400 : 460, borderRadius: 3, zIndex: 1, overflow: "hidden" }}>
        {/* Encabezado */}
        <Box sx={{
          px: 4, pt: 4, pb: 2,
          background: "linear-gradient(135deg, #381A73 0%, #1E2E71 60%, #0F4374 100%)",
          textAlign: "center",
        }}>
          <Typography variant="h5" fontWeight={800} sx={{ color: "#fff", letterSpacing: 1 }}>
            NEURODX
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", mt: 0.5 }}>
            Su diagnóstico, nuestro compromiso
          </Typography>
        </Box>

        {/* Tabs */}
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="fullWidth"
          sx={{
            borderBottom: "1px solid #E5E7EB",
            "& .MuiTab-root": { fontWeight: 600, fontSize: 13 },
            "& .MuiTabs-indicator": { background: "linear-gradient(90deg, #381A73, #1E2E71)", height: 3 },
            "& .Mui-selected": { color: "#1E2E71 !important" },
          }}
        >
          <Tab label="Iniciar Sesión" />
          <Tab label="Registro" />
        </Tabs>

        {/* Contenido del tab activo */}
        <Box sx={{ px: 4, pb: 4, pt: 1 }}>
          {tab === 0 ? <LoginPanel /> : <RegisterPanel />}
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginForm;
