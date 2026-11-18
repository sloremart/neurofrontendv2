import React, { useEffect, useState, useCallback } from "react";
import {
  Box, Typography, Paper, Grid, CircularProgress, Alert, AlertTitle,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, LinearProgress, Tooltip, IconButton, MenuItem, Select,
  FormControl, InputLabel, SelectChangeEvent,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import EventIcon from "@mui/icons-material/Event";
import CONFIG from "../../../config/api.js";

// id_sede en ZeusSalud arranca en 2 (Sede 1 = id 2, Sede 2 = id 3)
const sedeLabel = (id_sede: number) => `S0${id_sede - 1}`;
const sedeColor = (id_sede: number) =>
  id_sede === 2
    ? { bgcolor: "#EDE9FB", color: "#6D28D9" }
    : { bgcolor: "#F3E8FF", color: "#7C3AED" };

// ── Tipos ──────────────────────────────────────────────────────────────────
interface Consultorio {
  con_id: number;
  consultorio: string;
  id_sede: number;
  total_programado: number;
  disponibles: number;
  agendados: number;
  bloqueados: number;
}
interface Servicio {
  asunto_id: number;
  servicio: string;
  cups: string;
  id_sede: number;
  agendados: number;
}
interface Medico {
  medico: string;
  cod_medi: string;
  id_sede: number;
  consultorio: string;
  slots_totales: number;
  citas_agendadas: number;
  slots_disponibles: number;
  slots_bloqueados: number;
}
interface Resumen {
  total_programado: number;
  agendados: number;
  disponibles: number;
  bloqueados: number;
  pct_ocupacion: number;
}
interface BloqueadoDetalle {
  fecha: string;
  consultorio: string;
  cod_medi: string;
  bloqueados: number;
}
interface DisponibleDetalle {
  fecha: string;
  consultorio: string;
  id_sede: number;
  disponibles: number;
}
interface DatosCap {
  ok: boolean;
  mes: string;
  resumen: Resumen;
  consultorios: Consultorio[];
  servicios: Servicio[];
  medicos: Medico[];
  bloqueados_detalle: BloqueadoDetalle[];
  disponibles_detalle: DisponibleDetalle[];
}

// ── Helpers ────────────────────────────────────────────────────────────────
const pct = (num: number, den: number) =>
  den > 0 ? Math.round((num / den) * 100) : 0;

const colorOcupacion = (p: number): "success" | "warning" | "error" | "info" => {
  if (p >= 85) return "success";
  if (p >= 60) return "info";
  if (p >= 35) return "warning";
  return "error";
};

const mesLabel = (ym: string) => {
  const [y, m] = ym.split("-");
  const nombres = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${nombres[parseInt(m) - 1]} ${y}`;
};

// Generar últimos 12 meses como YYYY-MM
const mesesDisponibles = (): string[] => {
  const result: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return result;
};

const mesActual = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

// ── Generador de alertas automáticas ──────────────────────────────────────────
interface Alerta {
  tipo: "error" | "warning" | "success" | "info";
  titulo: string;
  detalle: string;
}

const generarAlertas = (datos: DatosCap): Alerta[] => {
  const alertas: Alerta[] = [];

  // 1. Ocupación global
  if (datos.resumen.pct_ocupacion < 35) {
    alertas.push({
      tipo: "error",
      titulo: `Ocupación global crítica: ${datos.resumen.pct_ocupacion}%`,
      detalle: `Solo ${datos.resumen.agendados.toLocaleString("es-CO")} de ${datos.resumen.total_programado.toLocaleString("es-CO")} slots tienen cita. Quedan ${datos.resumen.disponibles.toLocaleString("es-CO")} cupos sin usar.`,
    });
  } else if (datos.resumen.pct_ocupacion < 60) {
    alertas.push({
      tipo: "warning",
      titulo: `Ocupación global baja: ${datos.resumen.pct_ocupacion}%`,
      detalle: `${datos.resumen.disponibles.toLocaleString("es-CO")} cupos disponibles sin agendar. Hay margen para aumentar la demanda.`,
    });
  }

  // 2. Consultorios sin ninguna cita (con agenda significativa)
  datos.consultorios
    .filter((c) => c.agendados === 0 && c.total_programado > 10)
    .forEach((c) => {
      alertas.push({
        tipo: "error",
        titulo: `Sin citas: ${c.consultorio}`,
        detalle: `${c.total_programado} slots programados y ninguna cita agendada. Verificar si la agenda está publicada o si el médico está activo.`,
      });
    });

  // 3. Alta proporción de bloqueos (>25% y más de 20 slots bloqueados)
  datos.consultorios
    .filter(
      (c) =>
        c.total_programado > 0 &&
        c.bloqueados / c.total_programado > 0.25 &&
        c.bloqueados > 20
    )
    .forEach((c) => {
      const p = Math.round((c.bloqueados / c.total_programado) * 100);
      alertas.push({
        tipo: "warning",
        titulo: `Bloqueos elevados: ${c.consultorio}`,
        detalle: `${c.bloqueados} slots bloqueados (${p}% de su agenda). Puede indicar ausencia médica prolongada o error de configuración.`,
      });
    });

  // 4. Superprogramación — muchos cupos libres con muy baja ocupación
  datos.consultorios
    .filter(
      (c) =>
        c.disponibles > 300 &&
        c.total_programado > 0 &&
        c.agendados / c.total_programado < 0.15
    )
    .forEach((c) => {
      const p = Math.round((c.agendados / c.total_programado) * 100);
      alertas.push({
        tipo: "warning",
        titulo: `Posible superprogramación: ${c.consultorio}`,
        detalle: `${c.disponibles.toLocaleString("es-CO")} cupos libres con solo ${p}% de ocupación. La capacidad programada supera la demanda real.`,
      });
    });

  // 5. Consultorios con alta ocupación (éxito)
  const llenos = datos.consultorios.filter(
    (c) => c.total_programado > 10 && c.agendados / c.total_programado >= 0.95
  );
  if (llenos.length > 0) {
    alertas.push({
      tipo: "success",
      titulo: `${llenos.length} consultorio(s) con ocupación ≥ 95%`,
      detalle: llenos.map((c) => c.consultorio).join(" · "),
    });
  }

  // 6. Insight de servicio más demandado
  if (datos.servicios.length > 0) {
    const top = datos.servicios[0];
    const totalSvc = datos.servicios.reduce((a, s) => a + s.agendados, 0);
    const p = totalSvc > 0 ? Math.round((top.agendados / totalSvc) * 100) : 0;
    alertas.push({
      tipo: "info",
      titulo: `Servicio más demandado: ${top.servicio}`,
      detalle: `Concentra el ${p}% de todas las citas agendadas en el mes (${top.agendados.toLocaleString("es-CO")} citas).`,
    });
  }

  return alertas;
};

// ── KPI Card ───────────────────────────────────────────────────────────────
const KpiCard: React.FC<{
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}> = ({ label, value, sub, color = "#6D28D9" }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      border: "1px solid",
      borderColor: "divider",
      borderTop: `3px solid ${color}`,
      borderRadius: 2,
      height: "100%",
    }}
  >
    <Typography
      sx={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "text.secondary", mb: 0.5 }}
    >
      {label}
    </Typography>
    <Typography sx={{ fontSize: 28, fontWeight: 800, color: "text.primary", lineHeight: 1 }}>
      {typeof value === "number" ? value.toLocaleString("es-CO") : value}
    </Typography>
    {sub && (
      <Typography sx={{ fontSize: 11, color: "text.secondary", mt: 0.5 }}>
        {sub}
      </Typography>
    )}
  </Paper>
);

// ── Componente principal ───────────────────────────────────────────────────
const DashboardCapacidadInstalada: React.FC = () => {
  const [datos, setDatos]       = useState<DatosCap | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [mes, setMes]           = useState(mesActual());

  const cargar = useCallback(async (mesParam: string) => {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch(
        `${CONFIG.API_ENDPOINT}/gedocumental/capacidad-instalada/?mes=${mesParam}`,
        { headers: { Authorization: `Token ${localStorage.getItem("token") || ""}` } }
      );
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Error al cargar datos");
      setDatos(json);
    } catch (err: any) {
      setError(err.message || "Error de conexión");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(mes); }, [mes, cargar]);

  const handleMes = (e: SelectChangeEvent) => setMes(e.target.value);

  const meses = mesesDisponibles();

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "text.primary" }}>
            Capacidad Instalada
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Ocupación real de agenda por consultorio y servicio
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Mes</InputLabel>
            <Select value={mes} label="Mes" onChange={handleMes} startAdornment={<EventIcon sx={{ mr: 0.5, fontSize: 16, color: "text.secondary" }} />}>
              {meses.map((m) => (
                <MenuItem key={m} value={m}>{mesLabel(m)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Tooltip title="Recargar">
            <IconButton onClick={() => cargar(mes)} disabled={cargando} size="small">
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Estado de carga */}
      {cargando && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={36} />
        </Box>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {datos && !cargando && (() => {
        const alertas = generarAlertas(datos);
        return (
        <>
          {/* KPIs */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} md={3}>
              <KpiCard
                label="Total programado"
                value={datos.resumen.total_programado}
                sub={`${mesLabel(datos.mes)}`}
                color="#6D28D9"
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <KpiCard
                label="Agendados"
                value={datos.resumen.agendados}
                sub={`${datos.resumen.pct_ocupacion}% de ocupación`}
                color="#059669"
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <KpiCard
                label="Disponibles"
                value={datos.resumen.disponibles}
                sub={`${pct(datos.resumen.disponibles, datos.resumen.total_programado)}% libre`}
                color="#0EA5E9"
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <KpiCard
                label="Bloqueados"
                value={datos.resumen.bloqueados}
                sub={`${pct(datos.resumen.bloqueados, datos.resumen.total_programado)}% del total`}
                color="#F59E0B"
              />
            </Grid>
          </Grid>

          {/* Alertas y recomendaciones */}
          {alertas.length > 0 && (
            <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 3, overflow: "hidden" }}>
              <Box sx={{ px: 2.5, py: 1.8, borderBottom: "1px solid", borderColor: "divider", bgcolor: "grey.50" }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: "text.secondary" }}>
                  Alertas y recomendaciones — {mesLabel(datos.mes)}
                </Typography>
              </Box>
              <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
                {alertas.map((a, i) => (
                  <Alert key={i} severity={a.tipo} sx={{ alignItems: "flex-start" }}>
                    <AlertTitle sx={{ fontWeight: 700, fontSize: 13, mb: 0.3 }}>{a.titulo}</AlertTitle>
                    <Typography sx={{ fontSize: 12 }}>{a.detalle}</Typography>
                  </Alert>
                ))}
              </Box>
            </Paper>
          )}

          {/* Tabla consultorios */}
          <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 3, overflow: "hidden" }}>
            <Box sx={{ px: 2.5, py: 1.8, borderBottom: "1px solid", borderColor: "divider", bgcolor: "grey.50" }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: "text.secondary" }}>
                Ocupación por consultorio
              </Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ "& th": { fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, color: "text.secondary", bgcolor: "grey.50" } }}>
                    <TableCell>Consultorio</TableCell>
                    <TableCell align="center">Sede</TableCell>
                    <TableCell align="right">Programado</TableCell>
                    <TableCell align="right">Agendado</TableCell>
                    <TableCell align="right">Disponible</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>Ocupación</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {datos.consultorios.map((con) => {
                    const p = pct(con.agendados, con.total_programado);
                    const color = colorOcupacion(p);
                    return (
                      <TableRow key={`${con.con_id}-${con.id_sede}`} hover>
                        <TableCell>
                          <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{con.consultorio}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={sedeLabel(con.id_sede)}
                            size="small"
                            sx={{ fontSize: 10, fontWeight: 700, height: 20, ...sedeColor(con.id_sede) }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography sx={{ fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
                            {con.total_programado.toLocaleString("es-CO")}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography sx={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                            {con.agendados.toLocaleString("es-CO")}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography sx={{ fontSize: 13, color: "text.secondary", fontVariantNumeric: "tabular-nums" }}>
                            {con.disponibles.toLocaleString("es-CO")}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Box sx={{ flex: 1, minWidth: 80 }}>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(p, 100)}
                                color={color}
                                sx={{ height: 7, borderRadius: 4, bgcolor: "grey.100" }}
                              />
                            </Box>
                            <Typography sx={{ fontSize: 12, fontWeight: 700, minWidth: 36, fontVariantNumeric: "tabular-nums" }}>
                              {p}%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {datos.consultorios.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary", fontSize: 13 }}>
                        Sin datos para este mes
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Tabla servicios */}
          <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 3, overflow: "hidden" }}>
            <Box sx={{ px: 2.5, py: 1.8, borderBottom: "1px solid", borderColor: "divider", bgcolor: "grey.50" }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: "text.secondary" }}>
                Citas agendadas por tipo de servicio
              </Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ "& th": { fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, color: "text.secondary", bgcolor: "grey.50" } }}>
                    <TableCell>Servicio</TableCell>
                    <TableCell align="center">CUPS</TableCell>
                    <TableCell align="center">Sede</TableCell>
                    <TableCell align="right">Citas agendadas</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>Participación</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {datos.servicios.map((svc, i) => {
                    const totalSvc = datos.servicios.reduce((a, s) => a + s.agendados, 0);
                    const p2 = pct(svc.agendados, totalSvc);
                    return (
                      <TableRow key={`${svc.asunto_id}-${i}`} hover>
                        <TableCell>
                          <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{svc.servicio}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          {svc.cups ? (
                            <Chip
                              label={svc.cups}
                              size="small"
                              sx={{ fontSize: 10, fontWeight: 700, height: 20, bgcolor: "grey.100", color: "text.secondary" }}
                            />
                          ) : (
                            <Typography sx={{ fontSize: 11, color: "text.disabled" }}>—</Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={sedeLabel(svc.id_sede)}
                            size="small"
                            sx={{ fontSize: 10, fontWeight: 700, height: 20, ...sedeColor(svc.id_sede) }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography sx={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                            {svc.agendados.toLocaleString("es-CO")}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Box sx={{ flex: 1, minWidth: 80 }}>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(p2, 100)}
                                sx={{
                                  height: 7, borderRadius: 4, bgcolor: "grey.100",
                                  "& .MuiLinearProgress-bar": { bgcolor: "#6D28D9" },
                                }}
                              />
                            </Box>
                            <Typography sx={{ fontSize: 12, fontWeight: 700, minWidth: 36, fontVariantNumeric: "tabular-nums" }}>
                              {p2}%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {datos.servicios.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary", fontSize: 13 }}>
                        Sin citas para este mes
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Tabla médicos */}
          <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 3, overflow: "hidden" }}>
            <Box sx={{ px: 2.5, py: 1.8, borderBottom: "1px solid", borderColor: "divider", bgcolor: "grey.50" }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: "text.secondary" }}>
                Capacidad instalada por médico
              </Typography>
              <Typography sx={{ fontSize: 11, color: "text.secondary", mt: 0.3 }}>
                Slots programados, citas agendadas y disponibilidad por médico y consultorio
              </Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ "& th": { fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, color: "text.secondary", bgcolor: "grey.50" } }}>
                    <TableCell>Médico</TableCell>
                    <TableCell>Consultorio</TableCell>
                    <TableCell align="center">Sede</TableCell>
                    <TableCell align="right">Slots prog.</TableCell>
                    <TableCell align="right">Agendados</TableCell>
                    <TableCell align="right">Disponibles</TableCell>
                    <TableCell align="right">Bloqueados</TableCell>
                    <TableCell sx={{ minWidth: 140 }}>Ocupación</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {datos.medicos.map((med, i) => {
                    const pm = pct(med.citas_agendadas, med.slots_totales);
                    const color = colorOcupacion(pm);
                    return (
                      <TableRow key={i} hover>
                        <TableCell>
                          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{med.medico}</Typography>
                          <Typography sx={{ fontSize: 10, color: "text.disabled" }}>{med.cod_medi}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 12 }}>{med.consultorio}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={sedeLabel(med.id_sede)}
                            size="small"
                            sx={{ fontSize: 10, fontWeight: 700, height: 20, ...sedeColor(med.id_sede) }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography sx={{ fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
                            {med.slots_totales.toLocaleString("es-CO")}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography sx={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                            {med.citas_agendadas.toLocaleString("es-CO")}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography sx={{ fontSize: 13, color: "text.secondary", fontVariantNumeric: "tabular-nums" }}>
                            {med.slots_disponibles.toLocaleString("es-CO")}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {med.slots_bloqueados > 0 ? (
                            <Chip
                              label={med.slots_bloqueados}
                              size="small"
                              sx={{ fontSize: 11, fontWeight: 700, height: 20, bgcolor: "#FEF3C7", color: "#B45309" }}
                            />
                          ) : (
                            <Typography sx={{ fontSize: 12, color: "text.disabled" }}>—</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Box sx={{ flex: 1, minWidth: 70 }}>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(pm, 100)}
                                color={color}
                                sx={{ height: 7, borderRadius: 4, bgcolor: "grey.100" }}
                              />
                            </Box>
                            <Typography sx={{ fontSize: 12, fontWeight: 700, minWidth: 36, fontVariantNumeric: "tabular-nums" }}>
                              {pm}%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {datos.medicos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4, color: "text.secondary", fontSize: 13 }}>
                        Sin datos para este mes
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Desgloses lado a lado */}
          <Grid container spacing={2}>
            {/* Desglose bloqueados */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
                <Box sx={{ px: 2.5, py: 1.8, borderBottom: "1px solid", borderColor: "divider", bgcolor: "grey.50", borderLeft: "3px solid #F59E0B" }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: "text.secondary" }}>
                    Desglose de bloqueados
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: "text.secondary", mt: 0.3 }}>
                    Slots inhabilitados por día y consultorio
                  </Typography>
                </Box>
                <TableContainer sx={{ maxHeight: 340 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow sx={{ "& th": { fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, color: "text.secondary", bgcolor: "grey.50" } }}>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Consultorio</TableCell>
                        <TableCell>Médico</TableCell>
                        <TableCell align="right">Slots</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {datos.bloqueados_detalle.map((b, i) => (
                        <TableRow key={i} hover>
                          <TableCell>
                            <Typography sx={{ fontSize: 12, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                              {b.fecha}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 12 }}>{b.consultorio}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{b.cod_medi || "—"}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={b.bloqueados}
                              size="small"
                              sx={{ fontSize: 11, fontWeight: 700, height: 20, bgcolor: "#FEF3C7", color: "#B45309" }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                      {datos.bloqueados_detalle.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 4, color: "text.secondary", fontSize: 13 }}>
                            Sin slots bloqueados
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            {/* Desglose disponibles */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
                <Box sx={{ px: 2.5, py: 1.8, borderBottom: "1px solid", borderColor: "divider", bgcolor: "grey.50", borderLeft: "3px solid #0EA5E9" }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: "text.secondary" }}>
                    Espacios disponibles
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: "text.secondary", mt: 0.3 }}>
                    Cupos libres por día y consultorio
                  </Typography>
                </Box>
                <TableContainer sx={{ maxHeight: 340 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow sx={{ "& th": { fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, color: "text.secondary", bgcolor: "grey.50" } }}>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Consultorio</TableCell>
                        <TableCell align="center">Sede</TableCell>
                        <TableCell align="right">Cupos</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {datos.disponibles_detalle.map((d, i) => (
                        <TableRow key={i} hover>
                          <TableCell>
                            <Typography sx={{ fontSize: 12, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                              {d.fecha}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 12 }}>{d.consultorio}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={sedeLabel(d.id_sede)}
                              size="small"
                              sx={{ fontSize: 10, fontWeight: 700, height: 20, ...sedeColor(d.id_sede) }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={d.disponibles}
                              size="small"
                              sx={{ fontSize: 11, fontWeight: 700, height: 20, bgcolor: "#E0F2FE", color: "#0284C7" }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                      {datos.disponibles_detalle.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 4, color: "text.secondary", fontSize: 13 }}>
                            Sin cupos disponibles
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        </>
        );
      })()}
    </Box>
  );
};

export default DashboardCapacidadInstalada;
