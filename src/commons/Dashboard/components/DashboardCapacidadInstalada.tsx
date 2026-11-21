import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Box, Typography, Paper, Grid, CircularProgress, Alert, AlertTitle,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, LinearProgress, Tooltip, IconButton, MenuItem, Select,
  FormControl, InputLabel, SelectChangeEvent, Tabs, Tab,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import EventIcon from "@mui/icons-material/Event";
import CONFIG from "../../../config/api.js";

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
  cod_medi: string;
  medico: string;
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
  medico: string;
  bloqueados: number;
}
interface DisponibleDetalle {
  fecha: string;
  consultorio: string;
  id_sede: number;
  disponibles: number;
}
interface Comparativo {
  servicio: string;
  capacidad_excel: number;
  unidad: string;
  agendados: number;
  confirmadas: number;
  canceladas: number;
  disponibles: number | null;
  pct_ocupacion: number | null;
}
interface DatosCap {
  ok: boolean;
  mes: string;
  resumen: Resumen;
  consultorios: Consultorio[];
  servicios: Servicio[];
  comparativo: Comparativo[];
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

// ── Alertas ────────────────────────────────────────────────────────────────
interface Alerta { tipo: "error" | "warning" | "success" | "info"; titulo: string; detalle: string; }

const generarAlertas = (datos: DatosCap): Alerta[] => {
  const alertas: Alerta[] = [];
  if (datos.resumen.pct_ocupacion < 35) {
    alertas.push({ tipo: "error", titulo: `Ocupación global crítica: ${datos.resumen.pct_ocupacion}%`, detalle: `Solo ${datos.resumen.agendados.toLocaleString("es-CO")} de ${datos.resumen.total_programado.toLocaleString("es-CO")} slots tienen cita. Quedan ${datos.resumen.disponibles.toLocaleString("es-CO")} cupos sin usar.` });
  } else if (datos.resumen.pct_ocupacion < 60) {
    alertas.push({ tipo: "warning", titulo: `Ocupación global baja: ${datos.resumen.pct_ocupacion}%`, detalle: `${datos.resumen.disponibles.toLocaleString("es-CO")} cupos disponibles sin agendar.` });
  }
  datos.consultorios.filter((c) => c.agendados === 0 && c.total_programado > 10).forEach((c) => {
    alertas.push({ tipo: "error", titulo: `Sin citas: ${c.consultorio}`, detalle: `${c.total_programado} slots programados y ninguna cita agendada.` });
  });
  datos.consultorios.filter((c) => c.total_programado > 0 && c.bloqueados / c.total_programado > 0.25 && c.bloqueados > 20).forEach((c) => {
    const p = Math.round((c.bloqueados / c.total_programado) * 100);
    alertas.push({ tipo: "warning", titulo: `Bloqueos elevados: ${c.consultorio}`, detalle: `${c.bloqueados} slots bloqueados (${p}% de su agenda).` });
  });
  const llenos = datos.consultorios.filter((c) => c.total_programado > 10 && c.agendados / c.total_programado >= 0.95);
  if (llenos.length > 0) {
    alertas.push({ tipo: "success", titulo: `${llenos.length} consultorio(s) con ocupación ≥ 95%`, detalle: llenos.map((c) => c.consultorio).join(" · ") });
  }
  if (datos.servicios.length > 0) {
    const agg: Record<string, number> = {};
    datos.servicios.forEach((s) => { agg[s.servicio] = (agg[s.servicio] || 0) + s.agendados; });
    const topSvc = Object.entries(agg).sort((a, b) => b[1] - a[1])[0];
    const totalSvc = datos.servicios.reduce((a, s) => a + s.agendados, 0);
    const p = totalSvc > 0 ? Math.round((topSvc[1] / totalSvc) * 100) : 0;
    alertas.push({ tipo: "info", titulo: `Servicio más demandado: ${topSvc[0]}`, detalle: `Concentra el ${p}% de las citas agendadas (${topSvc[1].toLocaleString("es-CO")} citas).` });
  }
  return alertas;
};

// ── KPI Card ───────────────────────────────────────────────────────────────
const KpiCard: React.FC<{ label: string; value: string | number; sub?: string; color?: string }> = ({ label, value, sub, color = "#6D28D9" }) => (
  <Paper elevation={0} sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderTop: `3px solid ${color}`, borderRadius: 2, height: "100%" }}>
    <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "text.secondary", mb: 0.5 }}>{label}</Typography>
    <Typography sx={{ fontSize: 28, fontWeight: 800, color: "text.primary", lineHeight: 1 }}>
      {typeof value === "number" ? value.toLocaleString("es-CO") : value}
    </Typography>
    {sub && <Typography sx={{ fontSize: 11, color: "text.secondary", mt: 0.5 }}>{sub}</Typography>}
  </Paper>
);

// ── Tab Panel ──────────────────────────────────────────────────────────────
const TabPanel: React.FC<{ children: React.ReactNode; value: number; index: number }> = ({ children, value, index }) => (
  <Box hidden={value !== index}>{value === index && children}</Box>
);

// ── Tabla header reutilizable ──────────────────────────────────────────────
const TH = { fontWeight: 700, fontSize: 11, textTransform: "uppercase" as const, letterSpacing: 0.5, color: "text.secondary", bgcolor: "grey.50" };

// ── Componente principal ───────────────────────────────────────────────────
const DashboardCapacidadInstalada: React.FC = () => {
  const [datos, setDatos]               = useState<DatosCap | null>(null);
  const [cargando, setCargando]         = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [mes, setMes]                   = useState(mesActual());
  const [tabActual, setTabActual]       = useState(0);
  const [medicoFiltro, setMedicoFiltro] = useState<string>("");

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
      setMedicoFiltro("");
    } catch (err: any) {
      setError(err.message || "Error de conexión");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(mes); }, [mes, cargar]);

  const meses = mesesDisponibles();

  const medicosUnicos = useMemo(() => {
    if (!datos) return [];
    const seen = new Set<string>();
    return datos.medicos
      .filter((m) => { const k = m.cod_medi; if (seen.has(k)) return false; seen.add(k); return true; })
      .sort((a, b) => a.medico.localeCompare(b.medico));
  }, [datos]);

  const medicosFiltrados = useMemo(() => {
    if (!datos) return [];
    return medicoFiltro ? datos.medicos.filter((m) => m.cod_medi === medicoFiltro) : datos.medicos;
  }, [datos, medicoFiltro]);

  const serviciosFiltrados = useMemo(() => {
    if (!datos) return [];
    const rows = medicoFiltro ? datos.servicios.filter((s) => s.cod_medi === medicoFiltro) : datos.servicios;
    const agg: Record<string, Servicio> = {};
    rows.forEach((s) => {
      const k = `${s.asunto_id}-${s.id_sede}`;
      agg[k] = agg[k] ? { ...agg[k], agendados: agg[k].agendados + s.agendados } : { ...s };
    });
    return Object.values(agg).sort((a, b) => b.agendados - a.agendados);
  }, [datos, medicoFiltro]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "text.primary" }}>Capacidad Instalada</Typography>
          <Typography variant="body2" color="text.secondary">Ocupación real de agenda por consultorio, médico y servicio</Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
          {datos && medicosUnicos.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 230 }}>
              <InputLabel>Médico</InputLabel>
              <Select value={medicoFiltro} label="Médico" onChange={(e: SelectChangeEvent) => setMedicoFiltro(e.target.value)}>
                <MenuItem value=""><em>Todos los médicos</em></MenuItem>
                {medicosUnicos.map((m) => (
                  <MenuItem key={m.cod_medi} value={m.cod_medi}>{m.medico}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Mes</InputLabel>
            <Select value={mes} label="Mes" onChange={(e: SelectChangeEvent) => setMes(e.target.value)} startAdornment={<EventIcon sx={{ mr: 0.5, fontSize: 16, color: "text.secondary" }} />}>
              {meses.map((m) => <MenuItem key={m} value={m}>{mesLabel(m)}</MenuItem>)}
            </Select>
          </FormControl>
          <Tooltip title="Recargar">
            <IconButton onClick={() => cargar(mes)} disabled={cargando} size="small">
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {cargando && <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress size={36} /></Box>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {datos && !cargando && (() => {
        const alertas = generarAlertas(datos);
        return (
        <>
          {/* KPIs */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { label: "Total programado", value: datos.resumen.total_programado, sub: mesLabel(datos.mes), color: "#6D28D9" },
              { label: "Agendados",        value: datos.resumen.agendados,        sub: `${datos.resumen.pct_ocupacion}% de ocupación`, color: "#059669" },
              { label: "Disponibles",      value: datos.resumen.disponibles,      sub: `${pct(datos.resumen.disponibles, datos.resumen.total_programado)}% libre`, color: "#0EA5E9" },
              { label: "Bloqueados",       value: datos.resumen.bloqueados,       sub: `${pct(datos.resumen.bloqueados, datos.resumen.total_programado)}% del total`, color: "#F59E0B" },
            ].map((kpi) => (
              <Grid item xs={6} md={3} key={kpi.label}>
                <KpiCard {...kpi} />
              </Grid>
            ))}
          </Grid>

          {/* Alertas */}
          {alertas.length > 0 && (
            <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 3, overflow: "hidden" }}>
              <Box sx={{ px: 2.5, py: 1.5, borderBottom: "1px solid", borderColor: "divider", bgcolor: "grey.50" }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: "text.secondary" }}>
                  Alertas y recomendaciones — {mesLabel(datos.mes)}
                </Typography>
              </Box>
              <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1 }}>
                {alertas.map((a, i) => (
                  <Alert key={i} severity={a.tipo} sx={{ alignItems: "flex-start", py: 0.5 }}>
                    <AlertTitle sx={{ fontWeight: 700, fontSize: 12, mb: 0.2 }}>{a.titulo}</AlertTitle>
                    <Typography sx={{ fontSize: 11 }}>{a.detalle}</Typography>
                  </Alert>
                ))}
              </Box>
            </Paper>
          )}

          {/* Panel con tabs */}
          <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
            <Box sx={{ borderBottom: "1px solid", borderColor: "divider", bgcolor: "grey.50", px: 1.5 }}>
              <Tabs
                value={tabActual}
                onChange={(_, v) => setTabActual(v)}
                sx={{
                  "& .MuiTab-root": { fontSize: 12, fontWeight: 600, textTransform: "none", minHeight: 44, px: 2 },
                  "& .Mui-selected": { color: "#6D28D9 !important" },
                  "& .MuiTabs-indicator": { bgcolor: "#6D28D9", height: 3 },
                }}
              >
                <Tab label="Comparativo vs Capacidad" />
                <Tab label={medicoFiltro ? "Médico seleccionado" : `Médicos (${medicosUnicos.length})`} />
                <Tab label={`Servicios (${serviciosFiltrados.length})`} />
                <Tab label="Desglose bloqueados / disponibles" />
              </Tabs>
            </Box>

            {/* Tab 0 — Comparativo capacidad Excel vs agenda sistema */}
            <TabPanel value={tabActual} index={0}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ "& th": { ...TH, py: 1.5 } }}>
                      <TableCell sx={{ pl: 2.5 }}>Servicio</TableCell>
                      <TableCell>Unidad</TableCell>
                      <TableCell align="right" sx={{ color: "#0369A1 !important" }}>Espacios disponibles</TableCell>
                      <TableCell align="right" sx={{ color: "#166534 !important" }}>Confirmados y atendidos</TableCell>
                      <TableCell align="right" sx={{ color: "#B45309 !important" }}>Cancelados e incumplidos</TableCell>
                      <TableCell align="right">Agendados</TableCell>
                      <TableCell sx={{ minWidth: 160, pr: 2.5 }}>Ocupación</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(() => {
                      const totalDisp = datos.comparativo.reduce((a, c) => a + (c.disponibles ?? 0), 0);
                      const totalConf = datos.comparativo.reduce((a, c) => a + (c.confirmadas ?? 0), 0);
                      const totalCanc = datos.comparativo.reduce((a, c) => a + (c.canceladas ?? 0), 0);
                      const totalAg   = datos.comparativo.reduce((a, c) => a + c.agendados, 0);
                      const totalCap  = datos.comparativo.reduce((a, c) => a + c.capacidad_excel, 0);
                      return (
                        <>
                          {datos.comparativo.map((row, i) => {
                            const p = row.pct_ocupacion ?? 0;
                            const sinCap = row.capacidad_excel === 0;
                            return (
                              <TableRow key={i} hover sx={sinCap ? { opacity: 0.6 } : {}}>
                                <TableCell sx={{ pl: 2.5 }}>
                                  <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{row.servicio}</Typography>
                                  {sinCap && <Typography sx={{ fontSize: 10, color: "warning.main" }}>Sin referencia en capacidad instalada</Typography>}
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={(row.unidad ?? 'estudios').toUpperCase()}
                                    size="small"
                                    sx={{
                                      fontSize: 10,
                                      fontWeight: 700,
                                      height: 18,
                                      ...(row.unidad === 'espacios'
                                        ? { bgcolor: "#EDE9FE", color: "#5B21B6" }
                                        : row.unidad === 'servicios'
                                        ? { bgcolor: "#FEE2E2", color: "#991B1B" }
                                        : { bgcolor: "#DBEAFE", color: "#1E40AF" }),
                                    }}
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  {sinCap ? (
                                    <Typography sx={{ fontSize: 12, color: "text.disabled" }}>—</Typography>
                                  ) : (
                                    <Typography sx={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: "#0369A1" }}>
                                      {(row.disponibles ?? 0).toLocaleString("es-CO")}
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell align="right">
                                  {(row.confirmadas ?? 0) > 0 ? (
                                    <Chip
                                      label={(row.confirmadas ?? 0).toLocaleString("es-CO")}
                                      size="small"
                                      sx={{ fontSize: 11, fontWeight: 700, height: 20, bgcolor: "#DCFCE7", color: "#166534" }}
                                    />
                                  ) : (
                                    <Typography sx={{ fontSize: 12, color: "text.disabled" }}>—</Typography>
                                  )}
                                </TableCell>
                                <TableCell align="right">
                                  {(row.canceladas ?? 0) > 0 ? (
                                    <Chip
                                      label={(row.canceladas ?? 0).toLocaleString("es-CO")}
                                      size="small"
                                      sx={{ fontSize: 11, fontWeight: 700, height: 20, bgcolor: "#FEF3C7", color: "#B45309" }}
                                    />
                                  ) : (
                                    <Typography sx={{ fontSize: 12, color: "text.disabled" }}>—</Typography>
                                  )}
                                </TableCell>
                                <TableCell align="right">
                                  <Typography sx={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                                    {row.agendados.toLocaleString("es-CO")}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={{ pr: 2.5 }}>
                                  {sinCap ? (
                                    <Typography sx={{ fontSize: 11, color: "text.disabled" }}>—</Typography>
                                  ) : (
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                      <Box sx={{ flex: 1, minWidth: 90 }}>
                                        <LinearProgress
                                          variant="determinate"
                                          value={Math.min(p, 100)}
                                          color={colorOcupacion(p)}
                                          sx={{ height: 7, borderRadius: 4, bgcolor: "grey.100" }}
                                        />
                                      </Box>
                                      <Typography sx={{ fontSize: 12, fontWeight: 700, minWidth: 42, fontVariantNumeric: "tabular-nums" }}>
                                        {p.toFixed(1)}%
                                      </Typography>
                                    </Box>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          {/* Totales */}
                          <TableRow sx={{ bgcolor: "grey.50", "& td": { borderTop: "2px solid", borderColor: "divider" } }}>
                            <TableCell sx={{ pl: 2.5 }}>
                              <Typography sx={{ fontSize: 13, fontWeight: 800 }}>TOTAL</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography sx={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "#0369A1" }}>
                                {totalDisp.toLocaleString("es-CO")}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography sx={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "#166534" }}>
                                {totalConf.toLocaleString("es-CO")}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography sx={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "#B45309" }}>
                                {totalCanc.toLocaleString("es-CO")}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography sx={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                                {totalAg.toLocaleString("es-CO")}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ pr: 2.5 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Box sx={{ flex: 1, minWidth: 90 }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={Math.min(pct(totalAg, totalCap), 100)}
                                    color={colorOcupacion(pct(totalAg, totalCap))}
                                    sx={{ height: 8, borderRadius: 4, bgcolor: "grey.200" }}
                                  />
                                </Box>
                                <Typography sx={{ fontSize: 13, fontWeight: 800, minWidth: 42, fontVariantNumeric: "tabular-nums" }}>
                                  {pct(totalAg, totalCap)}%
                                </Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        </>
                      );
                    })()}
                    {datos.comparativo.length === 0 && (
                      <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>Sin datos</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            {/* Tab 1 — Médicos */}
            <TabPanel value={tabActual} index={1}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ "& th": TH }}>
                      <TableCell sx={{ pl: 2.5 }}>Médico</TableCell>
                      <TableCell>Consultorio</TableCell>
                      <TableCell align="center">Sede</TableCell>
                      <TableCell align="right">Slots prog.</TableCell>
                      <TableCell align="right">Agendados</TableCell>
                      <TableCell align="right">Disponibles</TableCell>
                      <TableCell align="right">Bloqueados</TableCell>
                      <TableCell sx={{ minWidth: 150, pr: 2.5 }}>Ocupación</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {medicosFiltrados.map((med, i) => {
                      const pm = pct(med.citas_agendadas, med.slots_totales);
                      return (
                        <TableRow key={i} hover>
                          <TableCell sx={{ pl: 2.5 }}>
                            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{med.medico}</Typography>
                            <Typography sx={{ fontSize: 10, color: "text.disabled" }}>{med.cod_medi}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 12 }}>{med.consultorio}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={sedeLabel(med.id_sede)} size="small" sx={{ fontSize: 10, fontWeight: 700, height: 20, ...sedeColor(med.id_sede) }} />
                          </TableCell>
                          <TableCell align="right">
                            <Typography sx={{ fontSize: 13, fontVariantNumeric: "tabular-nums" }}>{med.slots_totales.toLocaleString("es-CO")}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography sx={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{med.citas_agendadas.toLocaleString("es-CO")}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography sx={{ fontSize: 13, color: "text.secondary", fontVariantNumeric: "tabular-nums" }}>{med.slots_disponibles.toLocaleString("es-CO")}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            {med.slots_bloqueados > 0
                              ? <Chip label={med.slots_bloqueados} size="small" sx={{ fontSize: 11, fontWeight: 700, height: 20, bgcolor: "#FEF3C7", color: "#B45309" }} />
                              : <Typography sx={{ fontSize: 12, color: "text.disabled" }}>—</Typography>
                            }
                          </TableCell>
                          <TableCell sx={{ pr: 2.5 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Box sx={{ flex: 1, minWidth: 80 }}>
                                <LinearProgress variant="determinate" value={Math.min(pm, 100)} color={colorOcupacion(pm)} sx={{ height: 7, borderRadius: 4, bgcolor: "grey.100" }} />
                              </Box>
                              <Typography sx={{ fontSize: 12, fontWeight: 700, minWidth: 36, fontVariantNumeric: "tabular-nums" }}>{pm}%</Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {medicosFiltrados.length === 0 && (
                      <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, color: "text.secondary" }}>Sin datos para este médico</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            {/* Tab 2 — Servicios */}
            <TabPanel value={tabActual} index={2}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ "& th": TH }}>
                      <TableCell sx={{ pl: 2.5 }}>Servicio</TableCell>
                      <TableCell align="center">Sede</TableCell>
                      <TableCell align="right">Citas agendadas</TableCell>
                      <TableCell sx={{ minWidth: 160, pr: 2.5 }}>Participación</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {serviciosFiltrados.map((svc, i) => {
                      const totalSvc = serviciosFiltrados.reduce((a, s) => a + s.agendados, 0);
                      const p2 = pct(svc.agendados, totalSvc);
                      return (
                        <TableRow key={i} hover>
                          <TableCell sx={{ pl: 2.5 }}>
                            <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{svc.servicio}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={sedeLabel(svc.id_sede)} size="small" sx={{ fontSize: 10, fontWeight: 700, height: 20, ...sedeColor(svc.id_sede) }} />
                          </TableCell>
                          <TableCell align="right">
                            <Typography sx={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{svc.agendados.toLocaleString("es-CO")}</Typography>
                          </TableCell>
                          <TableCell sx={{ pr: 2.5 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Box sx={{ flex: 1, minWidth: 80 }}>
                                <LinearProgress variant="determinate" value={Math.min(p2, 100)} sx={{ height: 7, borderRadius: 4, bgcolor: "grey.100", "& .MuiLinearProgress-bar": { bgcolor: "#6D28D9" } }} />
                              </Box>
                              <Typography sx={{ fontSize: 12, fontWeight: 700, minWidth: 36, fontVariantNumeric: "tabular-nums" }}>{p2}%</Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {serviciosFiltrados.length === 0 && (
                      <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: "text.secondary" }}>Sin citas para este médico</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            {/* Tab 3 — Desglose */}
            <TabPanel value={tabActual} index={3}>
              <Grid container spacing={2} sx={{ p: 2 }}>
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
                    <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider", bgcolor: "grey.50", borderLeft: "3px solid #F59E0B" }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: "text.secondary" }}>Bloqueados por día</Typography>
                    </Box>
                    <TableContainer sx={{ maxHeight: 380 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow sx={{ "& th": TH }}>
                            <TableCell>Fecha</TableCell>
                            <TableCell>Consultorio</TableCell>
                            <TableCell>Médico</TableCell>
                            <TableCell align="right">Slots</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {datos.bloqueados_detalle.map((b, i) => (
                            <TableRow key={i} hover>
                              <TableCell><Typography sx={{ fontSize: 12, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{b.fecha}</Typography></TableCell>
                              <TableCell><Typography sx={{ fontSize: 12 }}>{b.consultorio}</Typography></TableCell>
                              <TableCell><Typography sx={{ fontSize: 12, color: "text.secondary" }}>{b.medico || "—"}</Typography></TableCell>
                              <TableCell align="right">
                                <Chip label={b.bloqueados} size="small" sx={{ fontSize: 11, fontWeight: 700, height: 20, bgcolor: "#FEF3C7", color: "#B45309" }} />
                              </TableCell>
                            </TableRow>
                          ))}
                          {datos.bloqueados_detalle.length === 0 && (
                            <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3, color: "text.secondary" }}>Sin slots bloqueados</TableCell></TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
                    <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider", bgcolor: "grey.50", borderLeft: "3px solid #0EA5E9" }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: "text.secondary" }}>Disponibles por día</Typography>
                    </Box>
                    <TableContainer sx={{ maxHeight: 380 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow sx={{ "& th": TH }}>
                            <TableCell>Fecha</TableCell>
                            <TableCell>Consultorio</TableCell>
                            <TableCell align="center">Sede</TableCell>
                            <TableCell align="right">Cupos</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {datos.disponibles_detalle.map((d, i) => (
                            <TableRow key={i} hover>
                              <TableCell><Typography sx={{ fontSize: 12, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{d.fecha}</Typography></TableCell>
                              <TableCell><Typography sx={{ fontSize: 12 }}>{d.consultorio}</Typography></TableCell>
                              <TableCell align="center">
                                <Chip label={sedeLabel(d.id_sede)} size="small" sx={{ fontSize: 10, fontWeight: 700, height: 20, ...sedeColor(d.id_sede) }} />
                              </TableCell>
                              <TableCell align="right">
                                <Chip label={d.disponibles} size="small" sx={{ fontSize: 11, fontWeight: 700, height: 20, bgcolor: "#E0F2FE", color: "#0284C7" }} />
                              </TableCell>
                            </TableRow>
                          ))}
                          {datos.disponibles_detalle.length === 0 && (
                            <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3, color: "text.secondary" }}>Sin cupos disponibles</TableCell></TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>
          </Paper>
        </>
        );
      })()}
    </Box>
  );
};

export default DashboardCapacidadInstalada;
