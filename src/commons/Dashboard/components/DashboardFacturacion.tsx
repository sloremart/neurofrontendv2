import React, { useState } from "react";
import Chart from "react-apexcharts";
import dayjs from "dayjs";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Button } from "@mui/material";
import CONFIG from "../../../config/api.js";

const API: string = CONFIG.API_ENDPOINT;

const fmt  = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
const fmtM = (n: number) => {
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

// ── interfaces ────────────────────────────────────────────────────────────────
interface CupsItem { cups: string; nombre: string; cantidad: number; valor: number }
interface Grupo {
  grupo: string; cantidad: number; valor: number; valor_calculado: number | null;
  min: number | null; ref: number | null; max: number | null;
  valor_mes: number | null; tarifa: number | null;
  estado: "bajo" | "en_rango" | "sobre" | "sin_parametros";
  cups: CupsItem[];
}
interface EntidadItem  { nombre: string; valor: number; admisiones: number }
interface TimelineItem { fecha: string; valor: number; admisiones: number }
interface ApiData {
  fecha_inicio: string; fecha_fin: string;
  regular: { total: number; admisiones: number; entidades: EntidadItem[]; timeline: TimelineItem[] };
  mrc:     { total_valor: number; grupos: Grupo[] };
}

// Cartera: el endpoint devuelve { [nit]: { nombre, dias_credito, "1-30 días": n, ..., Glosas: n, recaudo_pendiente_aplicar?: n } }
const AGING_BUCKETS = ["1-30 días", "31-60 días", "61-90 días", "91-120 días", "121-150 días", "151-180 días", "181+ días"] as const;
type AgingBucket = typeof AGING_BUCKETS[number];
interface CarteraItem extends Record<AgingBucket, number> {
  nombre: string; dias_credito: number; Glosas: number; recaudo_pendiente_aplicar?: number;
}
type CarteraData = Record<string, CarteraItem>;

// ── paleta semáforo MRC ───────────────────────────────────────────────────────
const ESTADO_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  bajo:           { label: "Por debajo del mínimo", color: "#f59e0b", bg: "#fffbeb", icon: "⚠️" },
  en_rango:       { label: "Dentro del rango",      color: "#10b981", bg: "#ecfdf5", icon: "✅" },
  sobre:          { label: "Por encima del máximo", color: "#ef4444", bg: "#fef2f2", icon: "🚨" },
  sin_parametros: { label: "Sin parámetros",        color: "#6366f1", bg: "#eef2ff", icon: "ℹ️" },
};

// paleta aging: secuencial verde → rojo (polarity: safe → critical)
const AGING_COLORS: Record<AgingBucket, string> = {
  "1-30 días":    "#22c55e",
  "31-60 días":   "#84cc16",
  "61-90 días":   "#eab308",
  "91-120 días":  "#f97316",
  "121-150 días": "#ef4444",
  "151-180 días": "#dc2626",
  "181+ días":    "#7f1d1d",
};

// ── MrcGrupoCard ──────────────────────────────────────────────────────────────
const MrcGrupoCard = ({ g }: { g: Grupo }) => {
  const [open, setOpen] = useState(false);
  const meta    = ESTADO_META[g.estado];
  const hasSem  = g.min !== null && g.max !== null;
  const pct     = hasSem ? Math.min((g.cantidad / g.max!) * 100, 130) : null;
  const minPct  = hasSem ? (g.min! / g.max!) * 100 : null;

  return (
    <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden",
      boxShadow: "0 2px 12px rgba(0,0,0,0.08)", border: `1px solid ${meta.color}33` }}>
      <div style={{ background: `linear-gradient(135deg,${meta.color}18,${meta.color}06)`,
        borderLeft: `4px solid ${meta.color}`, padding: "14px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1,
              color: meta.color, textTransform: "uppercase" }}>{meta.icon} {meta.label}</span>
            <h3 style={{ margin: "4px 0 0", fontSize: 15, fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>{g.grupo}</h3>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: meta.color }}>{g.cantidad.toLocaleString("es-CO")}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>estudios</div>
          </div>
        </div>

        {hasSem && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", marginBottom: 4 }}>
              <span>Mín: {g.min!.toLocaleString("es-CO")}</span>
              <span>Ref: {g.ref!.toLocaleString("es-CO")}</span>
              <span>Máx: {g.max!.toLocaleString("es-CO")}</span>
            </div>
            <div style={{ position: "relative", height: 8, background: "#e2e8f0", borderRadius: 4 }}>
              <div style={{ position: "absolute", left: `${minPct}%`, top: -2, width: 2, height: 12, background: "#94a3b8", borderRadius: 1 }} />
              <div style={{ position: "absolute", left: "100%", transform: "translateX(-50%)", top: -2, width: 2, height: 12, background: "#94a3b8", borderRadius: 1 }} />
              <div style={{ width: `${Math.min(pct!, 100)}%`, height: "100%", background: pct! > 100 ? "#ef4444" : meta.color, borderRadius: 4, transition: "width 0.6s ease" }} />
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

      <button onClick={() => setOpen(!open)} style={{ width: "100%", background: "none", border: "none",
        borderTop: "1px solid #f1f5f9", padding: "10px 18px", cursor: "pointer", textAlign: "left",
        fontSize: 12, color: "#64748b", display: "flex", justifyContent: "space-between" }}>
        <span>Ver detalle de CUPS ({g.cups.length})</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ padding: "0 18px 14px", maxHeight: 220, overflowY: "auto" }}>
          {g.cups.slice(0, 10).map((c, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between",
              padding: "5px 0", borderBottom: "1px solid #f8fafc", fontSize: 12 }}>
              <span style={{ color: "#475569", flex: 1, marginRight: 8 }}>
                <code style={{ color: meta.color, fontWeight: 700 }}>{c.cups}</code>{" "}
                {c.nombre.substring(0, 50)}{c.nombre.length > 50 ? "…" : ""}
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

// ── helpers ───────────────────────────────────────────────────────────────────
function linearSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const sumX  = (n * (n - 1)) / 2;
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
  const sumY  = values.reduce((a, v) => a + v, 0);
  const sumXY = values.reduce((a, v, i) => a + i * v, 0);
  return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
}

// ── dashboard principal ───────────────────────────────────────────────────────
const FacturacionDashboard = () => {
  const [fechaInicio, setFechaInicio] = useState<dayjs.Dayjs | null>(dayjs().startOf("month"));
  const [fechaFin,    setFechaFin]    = useState<dayjs.Dayjs | null>(dayjs());
  const [data,        setData]        = useState<ApiData | null>(null);
  const [cartera,     setCartera]     = useState<CarteraData | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [activeTab,   setActiveTab]   = useState<"regular" | "mrc" | "cartera">("regular");

  const handleBuscar = async () => {
    if (!fechaInicio || !fechaFin) return;
    setLoading(true);
    setError(null);
    try {
      const fi = fechaInicio.format("YYYY-MM-DD");
      const ff = fechaFin.format("YYYY-MM-DD");
      const anio = fechaFin.year();
      const mes  = fechaFin.month() + 1;

      const [resFactura, resCartera] = await Promise.all([
        fetch(`${API}/dashboard/facturacion-nuevo/?fecha_inicio=${fi}&fecha_fin=${ff}`),
        fetch(`${API}/dashboard/consolidado_cartera/?anio=${anio}&mes=${mes}`),
      ]);
      if (!resFactura.ok) throw new Error(`Facturación: error ${resFactura.status}`);
      if (!resCartera.ok) throw new Error(`Cartera: error ${resCartera.status}`);

      const [jsonFactura, jsonCartera] = await Promise.all([resFactura.json(), resCartera.json()]);
      setData(jsonFactura);
      setCartera(jsonCartera as CarteraData);
    } catch (e: any) {
      setError(e.message || "Error al cargar");
    } finally {
      setLoading(false);
    }
  };

  // ── derived: facturación regular ──────────────────────────────────────────
  const topEntidades  = data?.regular.entidades.slice(0, 10) ?? [];
  const topEntidad    = data?.regular.entidades[0];
  const timeline      = data?.regular.timeline ?? [];
  const tlSlope       = linearSlope(timeline.map(t => t.valor));
  const tlAvg         = timeline.length > 0 ? timeline.reduce((a, t) => a + t.valor, 0) / timeline.length : 0;
  const totalRegular  = data?.regular.total ?? 0;
  const top2Sum       = (data?.regular.entidades[0]?.valor ?? 0) + (data?.regular.entidades[1]?.valor ?? 0);
  const top2Pct       = totalRegular > 0 ? Math.round(top2Sum / totalRegular * 100) : 0;
  const top1Pct       = totalRegular > 0 ? Math.round((data?.regular.entidades[0]?.valor ?? 0) / totalRegular * 100) : 0;
  const tendencia     = tlSlope > 500000 ? "creciente" : tlSlope < -500000 ? "decreciente" : "estable";

  // ── derived: cartera ──────────────────────────────────────────────────────
  const carteraList = cartera
    ? Object.entries(cartera).map(([nit, v]) => ({ nit, ...v,
        total: AGING_BUCKETS.reduce((a, b) => a + (v[b] ?? 0), 0),
        vencido: (v["91-120 días"] ?? 0) + (v["121-150 días"] ?? 0) + (v["151-180 días"] ?? 0) + (v["181+ días"] ?? 0),
      }))
      .filter(e => e.total > 0)
      .sort((a, b) => b.total - a.total)
    : [];

  const totalCartera  = carteraList.reduce((a, e) => a + e.total, 0);
  const totalGlosas   = carteraList.reduce((a, e) => a + (e.Glosas ?? 0), 0);
  const totalRecaudo  = carteraList.reduce((a, e) => a + (e.recaudo_pendiente_aplicar ?? 0), 0);
  const entidadesCriticas = carteraList.filter(e => e["181+ días"] > 0).length;
  const topDeudor     = carteraList[0];
  const topVencido    = [...carteraList].sort((a, b) => b.vencido - a.vencido)[0];
  const topCartera10  = carteraList.slice(0, 10);

  // ── chart options: facturación regular ────────────────────────────────────
  const barOpts: ApexCharts.ApexOptions = {
    chart: { type: "bar", toolbar: { show: false } },
    plotOptions: { bar: { horizontal: true, borderRadius: 4, dataLabels: { position: "top" } } },
    dataLabels: { enabled: true, formatter: (v: number) => fmtM(v), style: { fontSize: "11px", colors: ["#64748b"] }, offsetX: 6 },
    xaxis: { categories: topEntidades.map(e => e.nombre.substring(0, 28)), labels: { formatter: fmtM, style: { fontSize: "11px" } } },
    yaxis: { labels: { style: { fontSize: "11px", colors: "#475569" } } },
    colors: ["#1d4ed8"],
    fill: { type: "gradient", gradient: { shade: "light", type: "horizontal", gradientToColors: ["#0f766e"], stops: [0, 100] } },
    grid: { borderColor: "#f1f5f9" },
    tooltip: { y: { formatter: (v: number) => fmt(v) } },
  };

  const areaOpts: ApexCharts.ApexOptions = {
    chart: { type: "area", toolbar: { show: false }, animations: { enabled: true, easing: "easeinout", speed: 600 } },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2 },
    xaxis: { categories: timeline.map(t => t.fecha), labels: { rotate: -35, style: { fontSize: "10px" } } },
    yaxis: { labels: { formatter: fmtM, style: { fontSize: "11px" } } },
    colors: ["#0f766e"],
    fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 100] } },
    grid: { borderColor: "#f1f5f9" },
    tooltip: { y: { formatter: (v: number) => fmt(v) } },
  };

  // ── chart options: cartera aging ──────────────────────────────────────────
  const agingOpts: ApexCharts.ApexOptions = {
    chart: { type: "bar", stacked: true, toolbar: { show: false } },
    plotOptions: { bar: { horizontal: true, barHeight: "65%", borderRadius: 3 } },
    colors: AGING_BUCKETS.map(b => AGING_COLORS[b]),
    xaxis: {
      categories: topCartera10.map(e => e.nombre.length > 28 ? e.nombre.substring(0, 28) + "…" : e.nombre),
      labels: { formatter: fmtM, style: { fontSize: "11px" } },
    },
    yaxis: { labels: { style: { fontSize: "11px" } } },
    dataLabels: { enabled: false },
    legend: { position: "bottom", fontSize: "11px", markers: { size: 8 } },
    tooltip: { y: { formatter: (v: number) => fmt(v) } },
    grid: { borderColor: "#f1f5f9", strokeDashArray: 3 },
  };

  const agingSeries = AGING_BUCKETS.map(bucket => ({
    name: bucket,
    data: topCartera10.map(e => Math.round(e[bucket] ?? 0)),
  }));

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* ── header ── */}
      <div style={{ background: "linear-gradient(135deg,#1e1b4b 0%,#1e3a8a 50%,#0f766e 100%)", padding: "24px 32px 20px" }}>
        <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 800, margin: "0 0 4px", letterSpacing: -0.5 }}>
          Dashboard de Facturación
        </h1>
        <p style={{ color: "#93c5fd", margin: "0 0 20px", fontSize: 13 }}>
          Valor facturado · MRC SANITAS · Estado de cartera
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker label="Fecha inicio" value={fechaInicio} onChange={v => setFechaInicio(v)} maxDate={dayjs()}
              slotProps={{ textField: { size: "small", sx: {
                background: "rgba(255,255,255,0.12)", borderRadius: 1,
                "& .MuiInputBase-input": { color: "#fff" },
                "& .MuiInputLabel-root": { color: "#93c5fd" },
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.25)" },
              } } }} />
          </LocalizationProvider>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker label="Fecha fin" value={fechaFin} onChange={v => setFechaFin(v)} maxDate={dayjs()}
              slotProps={{ textField: { size: "small", sx: {
                background: "rgba(255,255,255,0.12)", borderRadius: 1,
                "& .MuiInputBase-input": { color: "#fff" },
                "& .MuiInputLabel-root": { color: "#93c5fd" },
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.25)" },
              } } }} />
          </LocalizationProvider>
          <Button variant="contained" onClick={handleBuscar} disabled={loading}
            sx={{ background: "#f59e0b", color: "#1e1b4b", fontWeight: 700, px: 3, "&:hover": { background: "#d97706" } }}>
            {loading ? "Cargando…" : "Consultar"}
          </Button>
          {[
            { label: "Este mes",  fi: dayjs().startOf("month"), ff: dayjs() },
            { label: "Mes ant.",  fi: dayjs().subtract(1,"month").startOf("month"), ff: dayjs().subtract(1,"month").endOf("month") },
            { label: "3 meses",   fi: dayjs().subtract(2,"month").startOf("month"), ff: dayjs() },
          ].map(({ label, fi, ff }) => (
            <Button key={label} variant="outlined" size="small"
              sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.4)", "&:hover": { borderColor: "#fff" } }}
              onClick={() => { setFechaInicio(fi); setFechaFin(ff); }}>
              {label}
            </Button>
          ))}
        </div>
      </div>

      {error  && <div style={{ background: "#fef2f2", borderBottom: "2px solid #ef4444", padding: "10px 32px", color: "#dc2626", fontSize: 13 }}>⚠️ {error}</div>}
      {loading && <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}><div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>Cargando datos…</div>}

      {data && !loading && (
        <div style={{ padding: "24px 32px" }}>

          {/* ── KPI row ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14, marginBottom: 24 }}>
            {[
              { label: "Total Facturado Regular", value: fmtM(data.regular.total),      sub: `${data.regular.admisiones.toLocaleString("es-CO")} admisiones`, color: "#1d4ed8", icon: "🏥" },
              { label: "MRC SANITAS",             value: fmtM(data.mrc.total_valor),     sub: `${data.mrc.grupos.length} grupos`,                             color: "#7c3aed", icon: "📋" },
              { label: "Cartera pendiente",        value: fmtM(totalCartera),            sub: `${carteraList.length} entidades`,                              color: "#0f766e", icon: "💰" },
              { label: "Glosas acumuladas",        value: fmtM(totalGlosas),             sub: "Total glosas registradas",                                     color: "#be123c", icon: "⚠️" },
              { label: "Recaudo por aplicar",      value: fmtM(totalRecaudo),            sub: "Ingresos sin cruzar",                                          color: "#d97706", icon: "🔄" },
              { label: "Entidad principal",        value: topEntidad?.nombre.substring(0,20) ?? "—", sub: topEntidad ? fmtM(topEntidad.valor) : "—",           color: "#0891b2", icon: "🏆" },
            ].map((k, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "16px 18px",
                boxShadow: "0 1px 8px rgba(0,0,0,0.07)", borderLeft: `4px solid ${k.color}` }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{k.icon}</div>
                <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{k.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: k.color, margin: "4px 0 2px", lineHeight: 1.2 }}>{k.value}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* ── tabs ── */}
          <div style={{ display: "flex", gap: 0, marginBottom: 24, background: "#e2e8f0", borderRadius: 10, padding: 4, width: "fit-content" }}>
            {([["regular","🏥 Facturación Regular"], ["mrc","🔬 MRC SANITAS"], ["cartera","📂 Cartera"]] as const).map(([tab, label]) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ padding: "8px 22px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontWeight: 700, fontSize: 13, transition: "all 0.2s",
                  background: activeTab === tab ? "#fff" : "transparent",
                  color: activeTab === tab ? "#1d4ed8" : "#64748b",
                  boxShadow: activeTab === tab ? "0 1px 6px rgba(0,0,0,0.1)" : "none" }}>
                {label}
              </button>
            ))}
          </div>

          {/* ══════════════ TAB: REGULAR ══════════════ */}
          {activeTab === "regular" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* insights */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 10 }}>
                <div style={{ background: "#fff", border: "1px solid #e0e7ff", borderLeft: "4px solid #6366f1", borderRadius: 8, padding: "14px 18px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#3730a3", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 6 }}>📊 Concentración (Pareto)</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#4f46e5" }}>{top2Pct}%</div>
                  <div style={{ fontSize: 12, color: "#374151", marginTop: 2 }}>de la facturación proviene de solo <strong>2 entidades</strong></div>
                  <div style={{ marginTop: 8 }}>
                    {data.regular.entidades.slice(0, 2).map(e => (
                      <div key={e.nombre} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b7280", marginBottom: 3 }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 170 }}>{e.nombre}</span>
                        <span style={{ fontWeight: 700, color: "#4f46e5", marginLeft: 8, flexShrink: 0 }}>{totalRegular > 0 ? Math.round(e.valor / totalRegular * 100) : 0}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: "#fff", border: top2Pct > 70 ? "1px solid #fecaca" : "1px solid #d1fae5", borderLeft: `4px solid ${top2Pct > 70 ? "#ef4444" : "#22c55e"}`, borderRadius: 8, padding: "14px 18px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: top2Pct > 70 ? "#7f1d1d" : "#14532d", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 6 }}>
                    {top2Pct > 70 ? "🚨 Riesgo de concentración" : "✅ Diversificación saludable"}
                  </div>
                  <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
                    {top2Pct > 70
                      ? `Alta dependencia de ${data.regular.entidades[0]?.nombre ?? ''} (${top1Pct}%). Perder este convenio impactaría la operación.`
                      : `Los convenios están bien distribuidos. El principal representa solo el ${top1Pct}% del total.`
                    }
                  </div>
                </div>

                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderLeft: `4px solid ${tlSlope > 0 ? "#22c55e" : tlSlope < 0 ? "#ef4444" : "#6366f1"}`, borderRadius: 8, padding: "14px 18px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#374151", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 6 }}>📈 Tendencia de facturación</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: tlSlope > 0 ? "#16a34a" : tlSlope < 0 ? "#dc2626" : "#4f46e5" }}>
                    {tendencia === "creciente" ? "↑ Creciente" : tendencia === "decreciente" ? "↓ Decreciente" : "→ Estable"}
                  </div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>Promedio {fmtM(tlAvg)} / día</div>
                </div>
              </div>

              {/* gráficas */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 8px rgba(0,0,0,0.07)" }}>
                  <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: 0.5 }}>Top Entidades por Valor Facturado</h3>
                  {topEntidades.length > 0
                    ? <Chart type="bar" height={Math.max(260, topEntidades.length * 32)} series={[{ name: "Valor facturado", data: topEntidades.map(e => e.valor) }]} options={barOpts} />
                    : <div style={{ textAlign: "center", color: "#94a3b8", padding: 40 }}>Sin datos</div>
                  }
                </div>
                <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 8px rgba(0,0,0,0.07)" }}>
                  <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: 0.5 }}>Facturación por Día</h3>
                  {timeline.length > 0
                    ? <Chart type="area" height={260} series={[{ name: "Valor facturado", data: timeline.map(t => t.valor) }]} options={areaOpts} />
                    : <div style={{ textAlign: "center", color: "#94a3b8", padding: 40 }}>Sin datos</div>
                  }
                </div>
              </div>

              {/* tabla entidades */}
              <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 8px rgba(0,0,0,0.07)", overflowX: "auto" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: 0.5 }}>Detalle por Entidad</h3>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                      {["#", "Entidad", "Admisiones", "Valor Facturado", "% del Total"].map(h => (
                        <th key={h} style={{ textAlign: h === "Entidad" ? "left" : "right", padding: "8px 12px",
                          fontWeight: 700, color: "#475569", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.regular.entidades.map((e, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f8fafc", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ padding: "10px 12px", color: "#94a3b8", textAlign: "right" }}>{i + 1}</td>
                        <td style={{ padding: "10px 12px", fontWeight: 600, color: "#0f172a" }}>{e.nombre}</td>
                        <td style={{ padding: "10px 12px", textAlign: "right", color: "#475569", fontVariantNumeric: "tabular-nums" }}>{e.admisiones.toLocaleString("es-CO")}</td>
                        <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#1d4ed8", fontVariantNumeric: "tabular-nums" }}>{fmt(e.valor)}</td>
                        <td style={{ padding: "10px 12px", textAlign: "right" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                            <div style={{ width: 60, height: 6, background: "#e2e8f0", borderRadius: 3 }}>
                              <div style={{ width: `${Math.min((e.valor / data.regular.total) * 100, 100)}%`, height: "100%", background: "#1d4ed8", borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 12, color: "#475569", minWidth: 36 }}>{((e.valor / data.regular.total) * 100).toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══════════════ TAB: MRC ══════════════ */}
          {activeTab === "mrc" && (
            <div>
              <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
                {["en_rango", "bajo", "sobre", "sin_parametros"].map(estado => {
                  const m = ESTADO_META[estado];
                  const count = data.mrc.grupos.filter(g => g.estado === estado).length;
                  return count > 0 ? (
                    <div key={estado} style={{ background: m.bg, border: `1px solid ${m.color}33`, borderRadius: 10, padding: "10px 16px", display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 18 }}>{m.icon}</span>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: m.color }}>{count}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{m.label}</div>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: 16 }}>
                {data.mrc.grupos.map((g, i) => <MrcGrupoCard key={i} g={g} />)}
              </div>
            </div>
          )}

          {/* ══════════════ TAB: CARTERA ══════════════ */}
          {activeTab === "cartera" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {carteraList.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 32px", color: "#94a3b8" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
                  <p>Sin datos de cartera para el período seleccionado.</p>
                </div>
              ) : (
                <>
                  {/* KPIs cartera */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
                    {[
                      { label: "Total cartera", value: fmtM(totalCartera), sub: `${carteraList.length} entidades con saldo`, color: "#1d4ed8", icon: "💼" },
                      { label: "Cartera vencida (+90d)", value: fmtM(carteraList.reduce((a,e)=>a+e.vencido,0)),
                        sub: `${carteraList.filter(e=>e.vencido>0).length} entidades`, color: "#ef4444", icon: "🚨" },
                      { label: "Glosas",  value: fmtM(totalGlosas),  sub: "Acumulado histórico", color: "#f59e0b", icon: "⚠️" },
                      { label: "Recaudo sin aplicar", value: fmtM(totalRecaudo), sub: "Pendiente de cruzar", color: "#10b981", icon: "💰" },
                      { label: "Con mora crítica", value: `${entidadesCriticas}`, sub: "Entidades con 181+ días", color: "#7c3aed", icon: "🔴" },
                    ].map((k, i) => (
                      <div key={i} style={{ background: "#fff", borderRadius: 10, padding: "14px 18px",
                        boxShadow: "0 1px 6px rgba(0,0,0,0.07)", borderLeft: `4px solid ${k.color}` }}>
                        <div style={{ fontSize: 18 }}>{k.icon}</div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 4 }}>{k.label}</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: k.color, lineHeight: 1.2, margin: "4px 0 2px" }}>{k.value}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>{k.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* alertas inteligentes */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 10 }}>

                    {topDeudor && (
                      <div style={{ background: "#fff", border: "1px solid #fecaca", borderLeft: "4px solid #ef4444", borderRadius: 8, padding: "14px 18px" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#7f1d1d", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 6 }}>💼 Mayor deuda pendiente</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{topDeudor.nombre}</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: "#ef4444", margin: "4px 0" }}>{fmtM(topDeudor.total)}</div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>Días de crédito pactados: {topDeudor.dias_credito} días</div>
                        {topDeudor["181+ días"] > 0 && (
                          <div style={{ marginTop: 6, fontSize: 10, color: "#dc2626", fontWeight: 600 }}>
                            ⚠️ {fmtM(topDeudor["181+ días"])} llevan más de 181 días
                          </div>
                        )}
                      </div>
                    )}

                    {topVencido && topVencido.vencido > 0 && (
                      <div style={{ background: "#fff", border: "1px solid #fed7aa", borderLeft: "4px solid #f97316", borderRadius: 8, padding: "14px 18px" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#7c2d12", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 6 }}>🚨 Más cartera vencida (+90d)</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{topVencido.nombre}</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: "#f97316", margin: "4px 0" }}>{fmtM(topVencido.vencido)}</div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>{Math.round(topVencido.vencido / Math.max(topVencido.total, 1) * 100)}% de su cartera total está vencida</div>
                      </div>
                    )}

                    {totalRecaudo > 0 && (
                      <div style={{ background: "#fff", border: "1px solid #bbf7d0", borderLeft: "4px solid #10b981", borderRadius: 8, padding: "14px 18px" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#065f46", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 6 }}>💡 Recaudo sin aplicar</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: "#10b981", margin: "4px 0" }}>{fmtM(totalRecaudo)}</div>
                        <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>
                          Dinero recibido que aún no se ha cruzado contra facturas. Aplicarlo reduciría la cartera pendiente.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* gráfica aging */}
                  <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 8px rgba(0,0,0,0.07)" }}>
                    <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Cartera por Entidad y Antigüedad
                    </h3>
                    <p style={{ margin: "0 0 16px", fontSize: 12, color: "#64748b" }}>Top 10 entidades · verde = reciente · rojo = mora crítica</p>
                    <Chart type="bar" height={Math.max(320, topCartera10.length * 44)} series={agingSeries} options={agingOpts} />
                  </div>

                  {/* tabla detalle */}
                  <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 8px rgba(0,0,0,0.07)", overflowX: "auto" }}>
                    <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: 0.5 }}>Detalle de Cartera por Entidad</h3>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 900 }}>
                      <thead>
                        <tr style={{ borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>
                          <th style={{ padding: "8px 10px", textAlign: "left",  fontWeight: 700, color: "#475569", fontSize: 10, textTransform: "uppercase" }}>Entidad</th>
                          {AGING_BUCKETS.map(b => (
                            <th key={b} style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: "#475569", fontSize: 10, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                              <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: AGING_COLORS[b], marginRight: 4, verticalAlign: "middle" }} />
                              {b}
                            </th>
                          ))}
                          <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: "#475569", fontSize: 10, textTransform: "uppercase" }}>Glosas</th>
                          <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: "#475569", fontSize: 10, textTransform: "uppercase" }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {carteraList.map((e, i) => (
                          <tr key={e.nit} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                            <td style={{ padding: "9px 10px", fontWeight: 600, color: "#0f172a", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {e.nombre}
                              {e.dias_credito > 0 && <span style={{ marginLeft: 6, fontSize: 9, color: "#94a3b8", fontWeight: 400 }}>{e.dias_credito}d crédito</span>}
                            </td>
                            {AGING_BUCKETS.map(b => (
                              <td key={b} style={{ padding: "9px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums",
                                color: (e[b] ?? 0) > 0 ? AGING_COLORS[b] : "#d1d5db", fontWeight: (e[b] ?? 0) > 0 ? 600 : 400 }}>
                                {(e[b] ?? 0) > 0 ? fmtM(e[b]) : "—"}
                              </td>
                            ))}
                            <td style={{ padding: "9px 10px", textAlign: "right", color: "#f59e0b", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                              {e.Glosas > 0 ? fmtM(e.Glosas) : "—"}
                            </td>
                            <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: 800, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>
                              {fmtM(e.total)}
                            </td>
                          </tr>
                        ))}
                        <tr style={{ background: "#f1f5f9", fontWeight: 800 }}>
                          <td style={{ padding: "10px", color: "#0f172a", fontSize: 12 }}>TOTAL</td>
                          {AGING_BUCKETS.map(b => (
                            <td key={b} style={{ padding: "10px", textAlign: "right", color: AGING_COLORS[b], fontVariantNumeric: "tabular-nums" }}>
                              {fmtM(carteraList.reduce((a, e) => a + (e[b] ?? 0), 0))}
                            </td>
                          ))}
                          <td style={{ padding: "10px", textAlign: "right", color: "#f59e0b", fontVariantNumeric: "tabular-nums" }}>{fmtM(totalGlosas)}</td>
                          <td style={{ padding: "10px", textAlign: "right", color: "#0f172a",  fontVariantNumeric: "tabular-nums" }}>{fmtM(totalCartera)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}
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
