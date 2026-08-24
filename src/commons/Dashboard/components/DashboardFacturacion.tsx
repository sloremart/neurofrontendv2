import React, { useState } from "react";
import Chart from "react-apexcharts";
import dayjs from "dayjs";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Button } from "@mui/material";
import CONFIG from "../../../config/api.js";

const API: string = CONFIG.API_ENDPOINT;

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

const fmtM = (n: number) => {
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${(n / 1e3).toFixed(0)}K`;
};

interface CupsItem { cups: string; nombre: string; cantidad: number; valor: number }
interface Grupo {
  grupo: string; cantidad: number; valor: number; valor_calculado: number | null;
  min: number | null; ref: number | null; max: number | null;
  valor_mes: number | null; tarifa: number | null;
  estado: "bajo" | "en_rango" | "sobre" | "sin_parametros";
  cups: CupsItem[];
}
interface EntidadItem { nombre: string; valor: number; admisiones: number }
interface TimelineItem { fecha: string; valor: number; admisiones: number }
interface ApiData {
  fecha_inicio: string; fecha_fin: string;
  regular: { total: number; admisiones: number; entidades: EntidadItem[]; timeline: TimelineItem[] };
  mrc: { total_valor: number; grupos: Grupo[] };
}

const ESTADO_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  bajo:           { label: "Por debajo del mínimo", color: "#f59e0b", bg: "#fffbeb", icon: "⚠️" },
  en_rango:       { label: "Dentro del rango",      color: "#10b981", bg: "#ecfdf5", icon: "✅" },
  sobre:          { label: "Por encima del máximo", color: "#ef4444", bg: "#fef2f2", icon: "🚨" },
  sin_parametros: { label: "Sin parámetros",        color: "#6366f1", bg: "#eef2ff", icon: "ℹ️" },
};

const MrcGrupoCard = ({ g }: { g: Grupo }) => {
  const [open, setOpen] = useState(false);
  const meta = ESTADO_META[g.estado];
  const hasSemaforo = g.min !== null && g.max !== null;
  const pct = hasSemaforo ? Math.min((g.cantidad / g.max!) * 100, 130) : null;
  const minPct = hasSemaforo ? (g.min! / g.max!) * 100 : null;

  return (
    <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden",
      boxShadow: "0 2px 12px rgba(0,0,0,0.08)", border: `1px solid ${meta.color}33` }}>
      <div style={{ background: `linear-gradient(135deg, ${meta.color}18, ${meta.color}06)`,
        borderLeft: `4px solid ${meta.color}`, padding: "14px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1,
              color: meta.color, textTransform: "uppercase" }}>{meta.icon} {meta.label}</span>
            <h3 style={{ margin: "4px 0 0", fontSize: 15, fontWeight: 700,
              color: "#0f172a", lineHeight: 1.3 }}>{g.grupo}</h3>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: meta.color }}>{g.cantidad.toLocaleString("es-CO")}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>estudios</div>
          </div>
        </div>

        {hasSemaforo && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between",
              fontSize: 11, color: "#64748b", marginBottom: 4 }}>
              <span>Mín: {g.min!.toLocaleString("es-CO")}</span>
              <span>Ref: {g.ref!.toLocaleString("es-CO")}</span>
              <span>Máx: {g.max!.toLocaleString("es-CO")}</span>
            </div>
            <div style={{ position: "relative", height: 8, background: "#e2e8f0", borderRadius: 4 }}>
              <div style={{ position: "absolute", left: `${minPct}%`, top: -2,
                width: 2, height: 12, background: "#94a3b8", borderRadius: 1 }} />
              <div style={{ position: "absolute", left: "100%", transform: "translateX(-50%)",
                top: -2, width: 2, height: 12, background: "#94a3b8", borderRadius: 1 }} />
              <div style={{ width: `${Math.min(pct!, 100)}%`, height: "100%",
                background: meta.color, borderRadius: 4, transition: "width 0.6s ease",
                ...(pct! > 100 ? { background: "#ef4444" } : {}) }} />
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
          <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: 8, padding: "8px 12px" }}>
            <div style={{ fontSize: 11, color: "#64748b" }}>Valor facturado</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{fmtM(g.valor)}</div>
          </div>
          {g.valor_calculado !== null && (
            <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: 8, padding: "8px 12px" }}>
              <div style={{ fontSize: 11, color: "#64748b" }}>Valor MRC calculado</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: meta.color }}>{fmtM(g.valor_calculado)}</div>
            </div>
          )}
        </div>
      </div>

      <button onClick={() => setOpen(!open)}
        style={{ width: "100%", background: "none", border: "none", borderTop: "1px solid #f1f5f9",
          padding: "10px 18px", cursor: "pointer", textAlign: "left", fontSize: 12,
          color: "#64748b", display: "flex", justifyContent: "space-between" }}>
        <span>Ver detalle de CUPS ({g.cups.length})</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ padding: "0 18px 14px", maxHeight: 220, overflowY: "auto" }}>
          {g.cups.slice(0, 10).map((c, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between",
              padding: "5px 0", borderBottom: "1px solid #f8fafc", fontSize: 12 }}>
              <span style={{ color: "#475569", flex: 1, marginRight: 8 }}>
                <code style={{ color: meta.color, fontWeight: 700 }}>{c.cups}</code> {c.nombre.substring(0, 50)}{c.nombre.length > 50 ? "…" : ""}
              </span>
              <span style={{ color: "#0f172a", fontWeight: 600, whiteSpace: "nowrap" }}>
                {Math.round(c.cantidad).toLocaleString("es-CO")} · {fmtM(c.valor)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const FacturacionDashboard = () => {
  const [fechaInicio, setFechaInicio] = useState<dayjs.Dayjs | null>(dayjs().startOf("month"));
  const [fechaFin, setFechaFin] = useState<dayjs.Dayjs | null>(dayjs());
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"regular" | "mrc">("regular");

  const handleBuscar = async () => {
    if (!fechaInicio || !fechaFin) return;
    setLoading(true);
    setError(null);
    try {
      const url = `${API}/dashboard/facturacion-nuevo/?fecha_inicio=${fechaInicio.format("YYYY-MM-DD")}&fecha_fin=${fechaFin.format("YYYY-MM-DD")}`;
      const res = await fetch(url, { method: "GET", headers: { "Content-Type": "application/json" } });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message || "Error al cargar");
    } finally {
      setLoading(false);
    }
  };

  const topEntidades = data?.regular.entidades.slice(0, 10) ?? [];
  const barOptions: ApexCharts.ApexOptions = {
    chart: { type: "bar", toolbar: { show: false }, background: "transparent" },
    plotOptions: { bar: { horizontal: true, borderRadius: 4, dataLabels: { position: "top" } } },
    dataLabels: { enabled: true, formatter: (v: number) => fmtM(v),
      style: { fontSize: "11px", colors: ["#64748b"] }, offsetX: 6 },
    xaxis: { categories: topEntidades.map(e => e.nombre.substring(0, 28)),
      labels: { formatter: fmtM, style: { fontSize: "11px" } } },
    yaxis: { labels: { style: { fontSize: "11px", colors: "#475569" } } },
    colors: ["#1d4ed8"],
    fill: { type: "gradient", gradient: { shade: "light", type: "horizontal",
      gradientToColors: ["#0f766e"], stops: [0, 100] } },
    grid: { borderColor: "#f1f5f9" },
    tooltip: { y: { formatter: (v: number) => fmt(v) } },
    theme: { mode: "light" },
  };

  const timeline = data?.regular.timeline ?? [];
  const areaOptions: ApexCharts.ApexOptions = {
    chart: { type: "area", toolbar: { show: false }, background: "transparent",
      animations: { enabled: true, easing: "easeinout", speed: 600 } },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2 },
    xaxis: { categories: timeline.map(t => t.fecha),
      labels: { rotate: -35, style: { fontSize: "10px" } } },
    yaxis: { labels: { formatter: fmtM, style: { fontSize: "11px" } } },
    colors: ["#0f766e"],
    fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.4,
      opacityTo: 0.05, stops: [0, 100] } },
    grid: { borderColor: "#f1f5f9" },
    tooltip: { y: { formatter: (v: number) => fmt(v) } },
    theme: { mode: "light" },
  };

  const topEntidad = data?.regular.entidades[0];
  const topMrcGrupo = data?.mrc.grupos.find(g => g.estado === "sobre")
    ?? data?.mrc.grupos[0];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #1e3a8a 50%, #0f766e 100%)",
        padding: "24px 32px 20px" }}>
        <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 800, margin: "0 0 4px",
          letterSpacing: -0.5 }}>Dashboard de Facturación</h1>
        <p style={{ color: "#93c5fd", margin: "0 0 20px", fontSize: 13 }}>
          Valor facturado real · Separación MRC SANITAS
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker label="Fecha inicio" value={fechaInicio}
              onChange={v => setFechaInicio(v)}
              maxDate={dayjs()}
              slotProps={{ textField: { size: "small",
                sx: { background: "rgba(255,255,255,0.12)", borderRadius: 1,
                  "& .MuiInputBase-input": { color: "#fff" },
                  "& .MuiInputLabel-root": { color: "#93c5fd" },
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.25)" } } } }} />
          </LocalizationProvider>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker label="Fecha fin" value={fechaFin}
              onChange={v => setFechaFin(v)}
              maxDate={dayjs()}
              slotProps={{ textField: { size: "small",
                sx: { background: "rgba(255,255,255,0.12)", borderRadius: 1,
                  "& .MuiInputBase-input": { color: "#fff" },
                  "& .MuiInputLabel-root": { color: "#93c5fd" },
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.25)" } } } }} />
          </LocalizationProvider>
          <Button variant="contained" onClick={handleBuscar} disabled={loading}
            sx={{ background: "#f59e0b", color: "#1e1b4b", fontWeight: 700,
              px: 3, "&:hover": { background: "#d97706" } }}>
            {loading ? "Cargando…" : "Consultar"}
          </Button>
        </div>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", borderBottom: "2px solid #ef4444",
          padding: "10px 32px", color: "#dc2626", fontSize: 13 }}>⚠️ {error}</div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
          Cargando datos de facturación…
        </div>
      )}

      {data && !loading && (
        <div style={{ padding: "24px 32px" }}>
          {/* KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16, marginBottom: 28 }}>
            {[
              { label: "Total facturado regular", value: fmt(data.regular.total),
                sub: `${data.regular.admisiones.toLocaleString("es-CO")} admisiones`,
                color: "#1d4ed8", icon: "🏥" },
              { label: "Total MRC SANITAS", value: fmt(data.mrc.total_valor),
                sub: `${data.mrc.grupos.length} grupos de servicios`,
                color: "#7c3aed", icon: "📋" },
              { label: "Entidad principal", value: topEntidad?.nombre.substring(0, 22) ?? "—",
                sub: topEntidad ? fmt(topEntidad.valor) : "—",
                color: "#0f766e", icon: "🏆" },
              { label: "Grupos MRC en rango", value:
                  `${data.mrc.grupos.filter(g => g.estado === "en_rango").length} / ${data.mrc.grupos.filter(g => g.min !== null).length}`,
                sub: `${data.mrc.grupos.filter(g => g.estado === "sobre").length} sobre máximo`,
                color: "#be123c", icon: "🚦" },
            ].map((k, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "18px 20px",
                boxShadow: "0 1px 8px rgba(0,0,0,0.07)", borderLeft: `4px solid ${k.color}` }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{k.icon}</div>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600,
                  textTransform: "uppercase", letterSpacing: 0.5 }}>{k.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: k.color,
                  margin: "4px 0 2px", lineHeight: 1.2 }}>{k.value}</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, marginBottom: 24,
            background: "#e2e8f0", borderRadius: 10, padding: 4, width: "fit-content" }}>
            {(["regular", "mrc"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ padding: "8px 24px", borderRadius: 8, border: "none",
                  cursor: "pointer", fontWeight: 700, fontSize: 13, transition: "all 0.2s",
                  background: activeTab === tab ? "#fff" : "transparent",
                  color: activeTab === tab ? "#1d4ed8" : "#64748b",
                  boxShadow: activeTab === tab ? "0 1px 6px rgba(0,0,0,0.1)" : "none" }}>
                {tab === "regular" ? "🏥 Facturación Regular" : "🔬 MRC SANITAS"}
              </button>
            ))}
          </div>

          {/* === REGULAR TAB === */}
          {activeTab === "regular" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {/* Bar chart: top entities */}
              <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px",
                boxShadow: "0 1px 8px rgba(0,0,0,0.07)", gridColumn: topEntidades.length === 0 ? "1 / -1" : undefined }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700,
                  color: "#0f172a", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Top Entidades por Valor Facturado
                </h3>
                {topEntidades.length > 0 ? (
                  <Chart type="bar" height={Math.max(280, topEntidades.length * 32)}
                    series={[{ name: "Valor facturado", data: topEntidades.map(e => e.valor) }]}
                    options={barOptions} />
                ) : (
                  <div style={{ textAlign: "center", color: "#94a3b8", padding: 40 }}>Sin datos</div>
                )}
              </div>

              {/* Area chart: timeline */}
              <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px",
                boxShadow: "0 1px 8px rgba(0,0,0,0.07)" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700,
                  color: "#0f172a", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Facturación por Día
                </h3>
                {timeline.length > 0 ? (
                  <Chart type="area" height={280}
                    series={[{ name: "Valor facturado", data: timeline.map(t => t.valor) }]}
                    options={areaOptions} />
                ) : (
                  <div style={{ textAlign: "center", color: "#94a3b8", padding: 40 }}>Sin datos</div>
                )}
              </div>

              {/* Entity table */}
              <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px",
                boxShadow: "0 1px 8px rgba(0,0,0,0.07)", gridColumn: "1 / -1" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700,
                  color: "#0f172a", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Detalle por Entidad
                </h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                        {["#", "Entidad", "Admisiones", "Valor Facturado", "% del Total"].map(h => (
                          <th key={h} style={{ textAlign: h === "Entidad" ? "left" : "right",
                            padding: "8px 12px", fontWeight: 700, color: "#475569",
                            fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.regular.entidades.map((e, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #f8fafc",
                          background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                          <td style={{ padding: "10px 12px", color: "#94a3b8", textAlign: "right" }}>{i + 1}</td>
                          <td style={{ padding: "10px 12px", fontWeight: 600, color: "#0f172a" }}>{e.nombre}</td>
                          <td style={{ padding: "10px 12px", textAlign: "right", color: "#475569",
                            fontVariantNumeric: "tabular-nums" }}>{e.admisiones.toLocaleString("es-CO")}</td>
                          <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700,
                            color: "#1d4ed8", fontVariantNumeric: "tabular-nums" }}>{fmt(e.valor)}</td>
                          <td style={{ padding: "10px 12px", textAlign: "right" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                              <div style={{ width: 60, height: 6, background: "#e2e8f0", borderRadius: 3 }}>
                                <div style={{ width: `${Math.min((e.valor / data.regular.total) * 100, 100)}%`,
                                  height: "100%", background: "#1d4ed8", borderRadius: 3 }} />
                              </div>
                              <span style={{ fontSize: 12, color: "#475569", minWidth: 36 }}>
                                {((e.valor / data.regular.total) * 100).toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* === MRC TAB === */}
          {activeTab === "mrc" && (
            <div>
              <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
                {["en_rango", "bajo", "sobre", "sin_parametros"].map(estado => {
                  const m = ESTADO_META[estado];
                  const count = data.mrc.grupos.filter(g => g.estado === estado).length;
                  return count > 0 ? (
                    <div key={estado} style={{ background: m.bg, border: `1px solid ${m.color}33`,
                      borderRadius: 10, padding: "10px 16px", display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 18 }}>{m.icon}</span>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: m.color }}>{count}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{m.label}</div>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
                {data.mrc.grupos.map((g, i) => <MrcGrupoCard key={i} g={g} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {!data && !loading && (
        <div style={{ textAlign: "center", padding: "80px 32px", color: "#94a3b8" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📊</div>
          <h2 style={{ fontWeight: 700, color: "#475569", marginBottom: 8 }}>Dashboard de Facturación</h2>
          <p style={{ fontSize: 14 }}>Selecciona un rango de fechas y presiona Consultar</p>
        </div>
      )}
    </div>
  );
};

export default FacturacionDashboard;
