import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/store";

import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { Button } from "@mui/material";
import { get_riesgo_compartido } from "../store/thunks/DashboardThunks.tsx";
import { GrupoResumen } from "../interfaces/Mrc";

// ── Colores por estado ──────────────────────────────────────────────────────
const colorPorEstado = (estado: string) => {
  if (estado.includes("debajo")) return { bar: "#fb923c", badge: "#fff7ed", border: "#fb923c", text: "#c2410c" };
  if (estado.includes("encima")) return { bar: "#ef4444", badge: "#fef2f2", border: "#ef4444", text: "#b91c1c" };
  return { bar: "#22c55e", badge: "#f0fdf4", border: "#22c55e", text: "#15803d" };
};

// ── Vista Gantt (bullet chart horizontal) ──────────────────────────────────
const GanttMRC = ({ datos }: { datos: GrupoResumen[] }) => {
  const LABEL_W = 240;
  const ROW_H   = 56;
  const PAD_Y   = 10;
  const TICK_H  = 6;

  const escalaMax = Math.max(...datos.map(d =>
    Math.max(d.cantidad_total_facturas, d.cantidad_maxima)
  )) * 1.15;

  const toX = (v: number, w: number) => (v / escalaMax) * w;

  // ticks del eje X
  const tickCount = 6;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) =>
    Math.round((escalaMax / tickCount) * i)
  );

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg
        width="100%"
        viewBox={`0 0 900 ${datos.length * ROW_H + PAD_Y * 2 + 36}`}
        style={{ fontFamily: "inherit", display: "block" }}
      >
        {/* eje X: ticks */}
        {ticks.map(t => {
          const chartW = 900 - LABEL_W - 20;
          const x = LABEL_W + toX(t, chartW);
          return (
            <g key={t}>
              <line x1={x} y1={PAD_Y} x2={x} y2={datos.length * ROW_H + PAD_Y} stroke="#cbd5e1" strokeWidth={1} strokeDasharray="4 3" />
              <text x={x} y={datos.length * ROW_H + PAD_Y + 16} textAnchor="middle" fontSize={10} fill="#94a3b8">{t}</text>
            </g>
          );
        })}

        {datos.map((g, i) => {
          const chartW = 900 - LABEL_W - 20;
          const y      = PAD_Y + i * ROW_H;
          const cy     = y + ROW_H / 2;
          const col    = colorPorEstado(g.estado);

          const xMin  = LABEL_W + toX(g.cantidad_minima, chartW);
          const xRef  = LABEL_W + toX(g.cantidad_referencia, chartW);
          const xMax  = LABEL_W + toX(g.cantidad_maxima, chartW);
          const xReal = LABEL_W + toX(g.cantidad_total_facturas, chartW);

          return (
            <g key={g.grupo}>
              {/* fondo de fila alternado */}
              <rect x={0} y={y} width={900} height={ROW_H} fill={i % 2 === 0 ? "#f8fafc" : "#fff"} />

              {/* etiqueta */}
              <text x={LABEL_W - 10} y={cy + 4} textAnchor="end" fontSize={12} fontWeight={600} fill="#1e293b">
                {g.grupo.length > 28 ? g.grupo.slice(0, 26) + "…" : g.grupo}
              </text>

              {/* track gris (0 → escalaMax) */}
              <rect x={LABEL_W} y={cy - 8} width={chartW} height={16} rx={4} fill="#e2e8f0" />

              {/* banda min–max */}
              <rect x={xMin} y={cy - 10} width={xMax - xMin} height={20} rx={4} fill="#bfdbfe" opacity={0.7} />

              {/* barra real */}
              <rect x={LABEL_W} y={cy - 6} width={Math.max(xReal - LABEL_W, 0)} height={12} rx={3} fill={col.bar} />

              {/* línea de referencia */}
              <line x1={xRef} y1={cy - 14} x2={xRef} y2={cy + 14} stroke="#3b82f6" strokeWidth={2} strokeDasharray="3 2" />
              <circle cx={xRef} cy={cy} r={4} fill="#3b82f6" />

              {/* valor real encima de la barra */}
              <text x={Math.min(xReal + 6, 880)} y={cy - 10} fontSize={11} fontWeight={700} fill={col.text}>
                {g.cantidad_total_facturas}
              </text>

              {/* etiquetas min / ref / max debajo */}
              <text x={xMin}  y={cy + 24} textAnchor="middle" fontSize={9} fill="#64748b">mín {g.cantidad_minima}</text>
              <text x={xRef}  y={cy + 24} textAnchor="middle" fontSize={9} fill="#3b82f6">ref {g.cantidad_referencia}</text>
              <text x={xMax}  y={cy + 24} textAnchor="middle" fontSize={9} fill="#64748b">máx {g.cantidad_maxima}</text>

              {/* separador */}
              <line x1={0} y1={y + ROW_H} x2={900} y2={y + ROW_H} stroke="#e2e8f0" strokeWidth={1} />
            </g>
          );
        })}

        {/* leyenda */}
        <g transform={`translate(${LABEL_W}, ${datos.length * ROW_H + PAD_Y + 28})`}>
          <rect x={0}   y={-6} width={12} height={12} rx={2} fill="#22c55e" />
          <text x={16}  y={4} fontSize={10} fill="#475569">En rango</text>
          <rect x={80}  y={-6} width={12} height={12} rx={2} fill="#fb923c" />
          <text x={96}  y={4} fontSize={10} fill="#475569">Por debajo</text>
          <rect x={175} y={-6} width={12} height={12} rx={2} fill="#ef4444" />
          <text x={191} y={4} fontSize={10} fill="#475569">Por encima</text>
          <line x1={270} y1={-2} x2={282} y2={-2} stroke="#3b82f6" strokeWidth={2} strokeDasharray="3 2" />
          <circle cx={276} cy={-2} r={3} fill="#3b82f6" />
          <text x={288} y={4} fontSize={10} fill="#475569">Referencia</text>
          <rect x={358} y={-6} width={12} height={12} rx={2} fill="#bfdbfe" opacity={0.8} />
          <text x={374} y={4} fontSize={10} fill="#475569">Rango mín–máx</text>
        </g>
      </svg>
    </div>
  );
};

// ── Componente principal ───────────────────────────────────────────────────
const RiesgoCompartidoDashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { datos, loading, error } = useSelector((state: RootState) => state.riesgo_compartido);

  const [fechaInicio, setFechaInicio] = useState<dayjs.Dayjs | null>(dayjs());
  const [fechaFin, setFechaFin] = useState<dayjs.Dayjs | null>(dayjs());
  const [vista, setVista] = useState<"tarjetas" | "gantt">("tarjetas");

  const handleBuscar = () => {
    if (!fechaInicio || !fechaFin) return;
    dispatch(get_riesgo_compartido(fechaInicio.format("DD/MM/YYYY"), fechaFin.format("DD/MM/YYYY")));
  };

  const getCardStyle = (estado: string): { background: string; borderLeft: string } => {
    if (estado.includes("debajo")) return { background: "#fff7ed", borderLeft: "6px solid #fb923c" };
    if (estado.includes("encima")) return { background: "#fef2f2", borderLeft: "6px solid #ef4444" };
    return { background: "#f0f9ff", borderLeft: "6px solid #3b82f6" };
  };

  const totalGlobal = datos.reduce((sum, grupo) => sum + grupo.valor_total_pagado, 0);

  const btnToggle = (activo: boolean): React.CSSProperties => ({
    padding: "6px 18px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
    background: activo ? "#3c0b79" : "#f1f5f9",
    color: activo ? "#fff" : "#475569",
    transition: "all 0.15s",
  });

  return (
    <div className="myContainer" style={{ marginTop: 20, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, width: "100%" }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>📊 Modelo de Riesgo Compartido</h2>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, marginBottom: 12 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker label="Fecha Inicio" value={fechaInicio} onChange={(newDate) => setFechaInicio(newDate)} />
          </LocalizationProvider>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker label="Fecha Fin" value={fechaFin} onChange={(newDate) => setFechaFin(newDate)} />
          </LocalizationProvider>
          <Button variant="contained" color="primary" onClick={handleBuscar}>Buscar</Button>
        </div>
      </div>

      {loading && <p>Cargando...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {datos.length > 0 && (
        <>
          {/* Toggle Tarjetas / Gantt */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <button style={btnToggle(vista === "tarjetas")} onClick={() => setVista("tarjetas")}>Tarjetas</button>
            <button style={btnToggle(vista === "gantt")}    onClick={() => setVista("gantt")}>Gantt</button>
          </div>

          {vista === "tarjetas" ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "center" }}>
              {datos.map(grupo => {
                const style = getCardStyle(grupo.estado);
                return (
                  <div
                    key={grupo.grupo}
                    style={{
                      flex: "1 1 300px",
                      backgroundColor: style.background,
                      padding: 20,
                      borderRadius: 12,
                      boxShadow: "0 6px 14px rgba(0,0,0,0.08)",
                      borderLeft: style.borderLeft,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      color: "#1e293b",
                      fontSize: 14,
                    }}
                  >
                    <h3 style={{ marginBottom: 4, fontSize: 18, fontWeight: 700 }}>{grupo.grupo}</h3>
                    <p><strong>Cumplidas:</strong> {grupo.cantidad_total_facturas}</p>
                    <p><strong>Valor por Factura:</strong> ${grupo.costo_unitario_estimado.toLocaleString("es-CO")}</p>
                    <p><strong>Estado:</strong> <em>{grupo.estado}</em></p>
                    <p><strong>Total Pagado:</strong> ${grupo.valor_total_pagado.toLocaleString("es-CO")}</p>
                    <p><strong>Mínima:</strong> {grupo.cantidad_minima} | <strong>Ref:</strong> {grupo.cantidad_referencia} | <strong>Máxima:</strong> {grupo.cantidad_maxima}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ width: "100%", background: "#fff", borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.07)", padding: "20px 16px" }}>
              <GanttMRC datos={datos} />
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20, marginTop: 20 }}>
            <div style={{ backgroundColor: "#3c0b79", color: "white", padding: "15px 30px", borderRadius: 12 }}>
              <strong>Total Facturado MRC:</strong><br />
              {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(totalGlobal)}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RiesgoCompartidoDashboard;
