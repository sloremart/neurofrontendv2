import React, { useState, useEffect, useRef } from "react";
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
  estado: "bajo" | "en_rango" | "sobre" | "sin_parametros" | "sin_inicio";
  faltan_minimo: number; faltan_maximo: number;
  cups: CupsItem[];
}
interface EntidadItem  { nombre: string; valor: number; admisiones: number }
interface TimelineItem { fecha: string; valor: number; admisiones: number }
interface ApiData {
  fecha_inicio: string; fecha_fin: string;
  regular: { total: number; admisiones: number; entidades: EntidadItem[]; timeline: TimelineItem[] };
  mrc:     { total_valor: number; grupos: Grupo[] };
}

// Admisiones vs facturación
// admisiones = estudios por fecha_ing del estudio | fes = facturas por fecha_usuario (emisión real)
// Son poblaciones distintas: una FES emitida en agosto puede corresponder a un estudio de julio.
interface AdmisionEntidad {
  nombre: string; admisiones: number; facturadas: number; valor: number;
}
interface AdmisionTimeline {
  fecha: string; admisiones: number; facturadas: number; valor: number;
}
interface AdmisionServicio {
  servicio: string; admisiones: number;
}
interface ServicioUsuario { servicio: string; facturas: number; valor: number }
interface UsuarioResumen {
  usuario: string; total_facturas: number; total_valor: number; dias_activos: number; promedio_dia: number;
  servicios?: ServicioUsuario[];
}
interface ProduccionTimeline {
  fecha: string; usuario: string; facturas: number; valor: number;
}
interface ResumenMes {
  mes: string; admisiones: number; fes: number; valor: number;
}
interface AdmisionesData {
  total_admisiones: number; total_facturadas: number; total_valor: number;
  timeline: AdmisionTimeline[]; entidades: AdmisionEntidad[];
  servicios: AdmisionServicio[];
  usuarios_resumen: UsuarioResumen[];
  produccion_timeline: ProduccionTimeline[];
  resumen_meses: ResumenMes[];
}

// ── interfaces: facturación regular detallada ────────────────────────────────
interface CarteraSegmento { segmento: string; label: string; color: string; estudios: number; valor: number }
interface ContratoItem    { contrato: string; estudios: number; valor: number }
interface ServicioItem    { servicio: string; estudios: number; valor: number }
interface MedicoItem      { nombre: string; estudios: number; valor: number }
interface ProcedimientoItem { contrato: string; cups: string; nombre: string; cantidad: number; valor_uni: number; total: number }
interface TendenciaItem   { mes: string; estudios: number; valor: number }
interface RegularDetalladaData {
  kpis: { total_valor: number; total_estudios: number; total_contratos: number; total_medicos: number };
  cartera: CarteraSegmento[];
  tendencia: TendenciaItem[];
  top_contratos: ContratoItem[];
  por_servicio: ServicioItem[];
  medicos: MedicoItem[];
  procedimientos: ProcedimientoItem[];
  filtros: { servicios: string[]; contratos: string[] };
  filtros_activos: { cartera: string; servicio: string; contrato: string };
}

// ── paleta semáforo MRC ───────────────────────────────────────────────────────
const ESTADO_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  sin_inicio:     { label: "Sin estudios en el período",  color: "#94a3b8", bg: "#f8fafc", icon: "⭕" },
  bajo:           { label: "Por debajo del mínimo",      color: "#f59e0b", bg: "#fffbeb", icon: "⚠️" },
  en_rango:       { label: "Dentro del rango",           color: "#10b981", bg: "#ecfdf5", icon: "✅" },
  sobre:          { label: "Por encima del máximo",      color: "#ef4444", bg: "#fef2f2", icon: "🚨" },
  sin_parametros: { label: "Sin parámetros",             color: "#6366f1", bg: "#eef2ff", icon: "ℹ️" },
};

// ── MrcGrupoCard ──────────────────────────────────────────────────────────────
const MrcGrupoCard = ({ g }: { g: Grupo }) => {
  const [openCups, setOpenCups] = useState(false);
  const meta   = ESTADO_META[g.estado] ?? ESTADO_META["sin_parametros"];
  const hasSem = g.min !== null && g.max !== null;
  const pct    = hasSem ? Math.min((g.cantidad / g.max!) * 100, 110) : null;
  const minPct = hasSem ? (g.min! / g.max!) * 100 : null;
  const refPct = hasSem ? (g.ref! / g.max!) * 100 : null;

  return (
    <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden",
      boxShadow: "0 2px 12px rgba(0,0,0,0.08)", border: `1px solid ${meta.color}33` }}>

      {/* cabecera */}
      <div style={{ background: `linear-gradient(135deg,${meta.color}18,${meta.color}06)`,
        borderLeft: `4px solid ${meta.color}`, padding: "14px 18px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            {g.estado !== "sin_inicio" && (
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1,
                color: meta.color, textTransform: "uppercase" as const }}>{meta.icon} {meta.label}</span>
            )}
            <h3 style={{ margin: g.estado !== "sin_inicio" ? "4px 0 0" : 0, fontSize: 15, fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>{g.grupo}</h3>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: meta.color, fontVariantNumeric: "tabular-nums" }}>
              {g.cantidad.toLocaleString("es-CO")}
            </div>
            <div style={{ fontSize: 11, color: "#64748b" }}>estudios realizados</div>
          </div>
        </div>

        {/* barra de progreso min → ref → max */}
        {hasSem && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", marginBottom: 6 }}>
              <span style={{ fontWeight: 600, color: g.faltan_minimo > 0 ? "#f59e0b" : "#10b981" }}>
                Mín: {g.min!.toLocaleString("es-CO")}
                {g.faltan_minimo > 0 && <span style={{ color: "#ef4444", marginLeft: 4 }}>(-{g.faltan_minimo})</span>}
              </span>
              <span>Ref: {g.ref!.toLocaleString("es-CO")}</span>
              <span style={{ fontWeight: 600, color: g.cantidad > g.max! ? "#ef4444" : "#64748b" }}>
                Máx: {g.max!.toLocaleString("es-CO")}
                {g.cantidad > g.max! && <span style={{ marginLeft: 4 }}>+{(g.cantidad - g.max!).toLocaleString("es-CO")}</span>}
              </span>
            </div>
            <div style={{ position: "relative", height: 10, background: "#e2e8f0", borderRadius: 5 }}>
              {/* zona verde (rango válido: min → max) */}
              <div style={{ position: "absolute", left: `${minPct}%`, width: `${100 - minPct!}%`,
                height: "100%", background: "#bbf7d0", borderRadius: "0 5px 5px 0", opacity: 0.5 }} />
              {/* marcador mínimo */}
              <div style={{ position: "absolute", left: `${minPct}%`, top: -3, width: 2, height: 16, background: "#f59e0b", borderRadius: 1 }} />
              {/* marcador referencia */}
              {refPct && <div style={{ position: "absolute", left: `${refPct}%`, top: -3, width: 2, height: 16, background: "#6366f1", borderRadius: 1 }} />}
              {/* barra de progreso */}
              <div style={{
                width: `${Math.min(pct ?? 0, 100)}%`, height: "100%", borderRadius: 5,
                background: g.estado === "sobre" ? "#ef4444" : g.estado === "en_rango" ? "#10b981" : g.estado === "bajo" ? "#f59e0b" : "#cbd5e1",
                transition: "width 0.7s ease",
              }} />
            </div>
            <div style={{ display: "flex", gap: 16, fontSize: 10, color: "#94a3b8", marginTop: 4 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <span style={{ display: "inline-block", width: 8, height: 8, background: "#f59e0b", borderRadius: 2 }} /> mínimo
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <span style={{ display: "inline-block", width: 8, height: 8, background: "#6366f1", borderRadius: 2 }} /> referencia
              </span>
            </div>
          </div>
        )}

        {/* mensaje de alerta según estado */}
        {hasSem && (
          <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, fontSize: 12,
            background: g.estado === "sin_inicio" ? "#f1f5f9" : g.estado === "bajo" ? "#fffbeb" : g.estado === "en_rango" ? "#ecfdf5" : "#fef2f2",
            border: `1px solid ${g.estado === "sin_inicio" ? "#e2e8f0" : g.estado === "bajo" ? "#fde68a" : g.estado === "en_rango" ? "#a7f3d0" : "#fecaca"}` }}>
            {g.estado === "sin_inicio" && `⭕ Sin estudios en el período. Necesita ${g.min!.toLocaleString("es-CO")} para llegar al mínimo.`}
            {g.estado === "bajo"       && `⚠️ Faltan ${g.faltan_minimo.toLocaleString("es-CO")} estudios para alcanzar el mínimo.`}
            {g.estado === "en_rango"   && `✅ En rango. Puede atender ${g.faltan_maximo.toLocaleString("es-CO")} más sin superar el máximo.`}
            {g.estado === "sobre"      && `🚨 Excede el máximo en ${(g.cantidad - g.max!).toLocaleString("es-CO")} estudios. El exceso se paga a tarifa reducida (50%).`}
          </div>
        )}

        {/* valores: estudios vs estimado a facturar */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
          <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: 8, padding: "8px 12px" }}>
            <div style={{ fontSize: 11, color: "#64748b" }}>Valor en CUPS (referencia)</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>{fmt(g.valor)}</div>
          </div>
          {g.valor_calculado !== null && (
            <div style={{ background: g.estado === "en_rango" ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.7)", borderRadius: 8, padding: "8px 12px",
              border: g.estado === "en_rango" ? "1px solid #6ee7b7" : "none" }}>
              <div style={{ fontSize: 11, color: "#64748b" }}>Valor estimado a facturar</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: meta.color }}>{fmt(g.valor_calculado)}</div>
              {g.valor_mes !== null && g.estado === "en_rango" && (
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>= valor mensual fijo del contrato</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CUPS del grupo con estudios en el período */}
      {g.cups.length > 0 && (
        <>
          <button onClick={() => setOpenCups(!openCups)} style={{ width: "100%", background: "none", border: "none",
            borderTop: "1px solid #f1f5f9", padding: "9px 18px", cursor: "pointer", textAlign: "left",
            fontSize: 12, color: "#475569", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>🔢 Ver CUPS del período ({g.cups.length})</span>
            <span>{openCups ? "▲" : "▼"}</span>
          </button>
          {openCups && (
            <div style={{ padding: "0 18px 12px", maxHeight: 220, overflowY: "auto" }}>
              {g.cups.map((c, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between",
                  padding: "5px 0", borderBottom: "1px solid #f8fafc", fontSize: 12 }}>
                  <span style={{ color: "#475569", flex: 1, marginRight: 8 }}>
                    <code style={{ color: meta.color, fontWeight: 700 }}>{c.cups}</code>{" "}
                    {c.nombre.substring(0, 45)}{c.nombre.length > 45 ? "…" : ""}
                  </span>
                  <span style={{ color: "#0f172a", fontWeight: 600, whiteSpace: "nowrap" }}>
                    {Math.round(c.cantidad).toLocaleString("es-CO")} estudios
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
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
  const [admisiones,  setAdmisiones]  = useState<AdmisionesData | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [activeTab,   setActiveTab]   = useState<"regular" | "mrc" | "admisiones">("regular");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  // ── estado: facturación regular detallada ──────────────────────────────────
  const [regularDetallada,  setRegularDetallada]  = useState<RegularDetalladaData | null>(null);
  const [loadingDetallada,  setLoadingDetallada]  = useState(false);
  const [carteraFilter,     setCarteraFilter]     = useState<string>('');
  const [servicioFilter,    setServicioFilter]    = useState<string>('');
  const [contratoFilter,    setContratoFilter]    = useState<string>('');
  const [tablaProcActiva,   setTablaProcActiva]   = useState<"medicos" | "procedimientos">("medicos");
  const detalladaFechas = useRef<{ fi: string; ff: string } | null>(null);

  const fetchRegularDetallada = async (
    fi: string, ff: string, cf: string, sf: string, cnf: string
  ) => {
    setLoadingDetallada(true);
    try {
      let url = `${API}/dashboard/facturacion-regular-detallada/?fecha_inicio=${fi}&fecha_fin=${ff}`;
      if (cf)  url += `&cartera_filter=${encodeURIComponent(cf)}`;
      if (sf)  url += `&servicio_filter=${encodeURIComponent(sf)}`;
      if (cnf) url += `&contrato_filter=${encodeURIComponent(cnf)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Detallada: error ${res.status}`);
      setRegularDetallada(await res.json());
    } catch (e: any) {
      console.error("Error cargando facturación detallada:", e.message);
    } finally {
      setLoadingDetallada(false);
    }
  };

  // Re-fetch cuando cambian los filtros (solo si ya hay datos cargados)
  useEffect(() => {
    if (!detalladaFechas.current) return;
    const { fi, ff } = detalladaFechas.current;
    fetchRegularDetallada(fi, ff, carteraFilter, servicioFilter, contratoFilter);
  }, [carteraFilter, servicioFilter, contratoFilter]);

  const handleBuscar = async () => {
    if (!fechaInicio || !fechaFin) return;
    setLoading(true);
    setError(null);
    // Resetear filtros al buscar nuevas fechas
    setCarteraFilter('');
    setServicioFilter('');
    setContratoFilter('');
    try {
      const fi = fechaInicio.format("YYYY-MM-DD");
      const ff = fechaFin.format("YYYY-MM-DD");
      detalladaFechas.current = { fi, ff };

      fetchRegularDetallada(fi, ff, '', '', '');
      const [resFactura, resAdm] = await Promise.all([
        fetch(`${API}/dashboard/facturacion-nuevo/?fecha_inicio=${fi}&fecha_fin=${ff}`),
        fetch(`${API}/dashboard/facturacion-admisiones/?fecha_inicio=${fi}&fecha_fin=${ff}`),
      ]);
      if (!resFactura.ok) throw new Error(`Facturación: error ${resFactura.status}`);
      if (!resAdm.ok)     throw new Error(`Admisiones: error ${resAdm.status}`);

      const [jsonFactura, jsonAdm] = await Promise.all([resFactura.json(), resAdm.json()]);
      setData(jsonFactura);
      setAdmisiones(jsonAdm as AdmisionesData);
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

  // ── derived: admisiones ───────────────────────────────────────────────────
  const admTimeline   = admisiones?.timeline ?? [];
  const admEntidades  = admisiones?.entidades ?? [];
  const admSlope      = linearSlope(admTimeline.map(t => t.admisiones));
  const facSlope      = linearSlope(admTimeline.map(t => t.facturadas));
  const topAdmEntidad = admEntidades[0];
  const admTendencia  = admSlope > 1 ? "creciente" : admSlope < -1 ? "decreciente" : "estable";

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

  // ── chart options: admisiones timeline ───────────────────────────────────
  const admTimelineOpts: ApexCharts.ApexOptions = {
    chart: { type: "area", toolbar: { show: false }, animations: { enabled: true, easing: "easeinout", speed: 600 } },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2 },
    xaxis: { categories: admTimeline.map(t => t.fecha), labels: { rotate: -35, style: { fontSize: "10px" } } },
    yaxis: { labels: { formatter: (v: number) => v.toLocaleString("es-CO"), style: { fontSize: "11px" } } },
    colors: ["#1d4ed8", "#10b981"],
    fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05, stops: [0, 100] } },
    grid: { borderColor: "#f1f5f9" },
    legend: { position: "top" as const, fontSize: "12px" },
    tooltip: { y: { formatter: (v: number) => v.toLocaleString("es-CO") } },
  };

  const admBarOpts: ApexCharts.ApexOptions = {
    chart: { type: "bar", toolbar: { show: false } },
    plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
    dataLabels: { enabled: false },
    xaxis: {
      categories: admEntidades.slice(0, 12).map(e => e.nombre.length > 28 ? e.nombre.substring(0, 28) + "…" : e.nombre),
      labels: { style: { fontSize: "10px" } },
    },
    yaxis: { labels: { style: { fontSize: "10px", colors: "#475569" } } },
    colors: ["#1d4ed8", "#10b981", "#f59e0b"],
    legend: { position: "top" as const, fontSize: "11px" },
    grid: { borderColor: "#f1f5f9" },
    tooltip: { y: { formatter: (v: number) => v.toLocaleString("es-CO") } },
  };

  const servicioBarOpts: ApexCharts.ApexOptions = {
    chart: { type: "bar", toolbar: { show: false } },
    plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
    dataLabels: { enabled: false },
    xaxis: {
      categories: (admisiones?.servicios ?? []).map(s => s.servicio.length > 30 ? s.servicio.substring(0, 30) + "…" : s.servicio),
      labels: { style: { fontSize: "10px" } },
    },
    yaxis: { labels: { style: { fontSize: "10px", colors: "#475569" } } },
    colors: ["#1d4ed8", "#10b981", "#f59e0b"],
    legend: { position: "top" as const, fontSize: "11px" },
    grid: { borderColor: "#f1f5f9" },
    tooltip: { y: { formatter: (v: number) => v.toLocaleString("es-CO") } },
  };

  // Producción por usuario: datos para gráfica de barras
  const usuariosResumen = admisiones?.usuarios_resumen ?? [];
  const usuariosBarOpts: ApexCharts.ApexOptions = {
    chart: { type: "bar", toolbar: { show: false } },
    plotOptions: { bar: { horizontal: false, borderRadius: 4, columnWidth: "55%" } },
    dataLabels: { enabled: true, formatter: (v: number) => v.toString(), style: { fontSize: "11px", colors: ["#1e293b"] } },
    xaxis: { categories: usuariosResumen.map(u => u.usuario.split(" ").slice(0, 2).join(" ")), labels: { style: { fontSize: "10px" } } },
    yaxis: { title: { text: "Facturas", style: { fontSize: "11px" } }, labels: { style: { fontSize: "11px" } } },
    colors: ["#7c3aed"],
    grid: { borderColor: "#f1f5f9" },
    tooltip: { y: { formatter: (v: number) => `${v.toLocaleString("es-CO")} facturas` } },
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* ── header ── */}
      <div style={{ background: "linear-gradient(135deg,#1e1b4b 0%,#1e3a8a 50%,#0f766e 100%)", padding: "24px 32px 20px" }}>
        <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 800, margin: "0 0 4px", letterSpacing: -0.5 }}>
          Dashboard de Facturación
        </h1>
        <p style={{ color: "#93c5fd", margin: "0 0 20px", fontSize: 13 }}>
          Valor facturado · MRC SANITAS · Admisiones vs Facturación
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
              { label: "Total Facturado Regular",   value: fmt(data.regular.total),       sub: `${data.regular.admisiones.toLocaleString("es-CO")} admisiones`, color: "#1d4ed8", icon: "🏥" },
              { label: "MRC SANITAS",              value: fmt(data.mrc.total_valor),    sub: `${data.mrc.grupos.length} grupos`,                              color: "#7c3aed", icon: "📋" },
              { label: "Estudios del período",     value: (admisiones?.total_admisiones ?? 0).toLocaleString("es-CO"), sub: "Estudios ingresados (fecha admisión)", color: "#0f766e", icon: "📥" },
              { label: "Estudios facturados",    value: (admisiones?.total_facturadas ?? 0).toLocaleString("es-CO"), sub: "Del período con FES emitida",          color: "#10b981", icon: "✅" },
              { label: "Valor facturado FES",      value: fmt(admisiones?.total_valor ?? 0),                           sub: "Valor de los estudios del período",      color: "#0891b2", icon: "💰" },
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
            {([["regular","🏥 Facturación Regular"], ["mrc","🔬 MRC SANITAS"], ["admisiones","📥 Admisiones vs Facturación"]] as const).map(([tab, label]) => (
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

              {loadingDetallada && (
                <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>Actualizando datos de cartera…
                </div>
              )}

              {!regularDetallada && !loadingDetallada && (
                <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
                  <p>Seleccione un período y haga clic en <strong>Consultar</strong> para ver el análisis de cartera.</p>
                </div>
              )}

              {regularDetallada && (
                <>
                  {/* Cartera segment cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
                    {regularDetallada.cartera.map(seg => {
                      const isActive = carteraFilter === seg.segmento;
                      return (
                        <div key={seg.segmento} onClick={() => setCarteraFilter(isActive ? '' : seg.segmento)}
                          style={{ background: isActive ? seg.color : "#fff", border: `2px solid ${seg.color}`,
                            borderRadius: 12, padding: "16px 18px", cursor: "pointer", transition: "all 0.15s",
                            boxShadow: isActive ? `0 4px 16px ${seg.color}44` : "0 1px 8px rgba(0,0,0,0.07)" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const,
                            letterSpacing: 0.5, marginBottom: 4,
                            color: isActive ? "rgba(255,255,255,0.85)" : seg.color }}>{seg.label}</div>
                          <div style={{ fontSize: 22, fontWeight: 800, fontVariantNumeric: "tabular-nums",
                            color: isActive ? "#fff" : seg.color }}>
                            {seg.estudios.toLocaleString("es-CO")}
                          </div>
                          <div style={{ fontSize: 11, marginTop: 2, color: isActive ? "rgba(255,255,255,0.75)" : "#64748b" }}>estudios</div>
                          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 6, fontVariantNumeric: "tabular-nums",
                            color: isActive ? "rgba(255,255,255,0.9)" : "#1d4ed8" }}>{fmt(seg.valor)}</div>
                          {isActive && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>▲ Filtro activo — clic para quitar</div>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Filtros dropdowns */}
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center",
                    background: "#fff", borderRadius: 10, padding: "12px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>Filtrar por:</span>
                    <select value={servicioFilter} onChange={e => setServicioFilter(e.target.value)}
                      style={{ fontSize: 12, border: "1px solid #e2e8f0", borderRadius: 6,
                        padding: "5px 10px", color: "#0f172a", background: "#f8fafc", minWidth: 200 }}>
                      <option value="">— Todos los servicios —</option>
                      {regularDetallada.filtros.servicios.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select value={contratoFilter} onChange={e => setContratoFilter(e.target.value)}
                      style={{ fontSize: 12, border: "1px solid #e2e8f0", borderRadius: 6,
                        padding: "5px 10px", color: "#0f172a", background: "#f8fafc", minWidth: 220 }}>
                      <option value="">— Todos los contratos —</option>
                      {regularDetallada.filtros.contratos.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {(carteraFilter || servicioFilter || contratoFilter) && (
                      <button onClick={() => { setCarteraFilter(''); setServicioFilter(''); setContratoFilter(''); }}
                        style={{ fontSize: 11, color: "#ef4444", border: "1px solid #fecaca", background: "#fff",
                          borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontWeight: 600 }}>
                        ✕ Limpiar filtros
                      </button>
                    )}
                  </div>

                  {/* Charts row */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 8px rgba(0,0,0,0.07)" }}>
                      <h3 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: 0.5 }}>Top Contratos por Estudios</h3>
                      {regularDetallada.top_contratos.length > 0 ? (
                        <Chart type="bar"
                          height={Math.max(220, regularDetallada.top_contratos.length * 30)}
                          series={[{ name: "Estudios", data: regularDetallada.top_contratos.map(c => c.estudios) }]}
                          options={{
                            chart: { type: "bar", toolbar: { show: false } },
                            plotOptions: { bar: { horizontal: true, borderRadius: 4, dataLabels: { position: "top" } } },
                            dataLabels: { enabled: true, formatter: (v: number) => v.toLocaleString("es-CO"), style: { fontSize: "10px", colors: ["#64748b"] }, offsetX: 6 },
                            xaxis: { categories: regularDetallada.top_contratos.map(c => c.contrato.substring(0, 30)), labels: { style: { fontSize: "10px" } } },
                            yaxis: { labels: { style: { fontSize: "10px", colors: "#475569" } } },
                            colors: ["#1d4ed8"],
                            fill: { type: "gradient", gradient: { shade: "light", type: "horizontal", gradientToColors: ["#0f766e"], stops: [0, 100] } },
                            grid: { borderColor: "#f1f5f9" },
                            tooltip: { y: { formatter: (v: number) => `${v.toLocaleString("es-CO")} estudios` } },
                          }} />
                      ) : <div style={{ textAlign: "center", color: "#94a3b8", padding: 40 }}>Sin datos</div>}
                    </div>

                    <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 8px rgba(0,0,0,0.07)" }}>
                      <h3 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: 0.5 }}>Distribución por Servicio</h3>
                      {regularDetallada.por_servicio.length > 0 ? (
                        <Chart type="donut" height={260}
                          series={regularDetallada.por_servicio.map(s => s.estudios)}
                          options={{
                            chart: { type: "donut" },
                            labels: regularDetallada.por_servicio.map(s => s.servicio),
                            colors: ["#1d4ed8","#0f766e","#7c3aed","#f59e0b","#ef4444","#10b981","#0891b2","#6366f1"],
                            legend: { position: "bottom" as const, fontSize: "11px" },
                            dataLabels: { enabled: false },
                            plotOptions: { pie: { donut: { size: "60%", labels: { show: true, total: {
                              show: true, label: "Estudios", formatter: () => regularDetallada.kpis.total_estudios.toLocaleString("es-CO")
                            } } } } },
                            tooltip: { y: { formatter: (v: number) => `${v.toLocaleString("es-CO")} estudios` } },
                          }} />
                      ) : <div style={{ textAlign: "center", color: "#94a3b8", padding: 40 }}>Sin datos</div>}
                    </div>
                  </div>

                  {/* Tendencia mensual */}
                  <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 8px rgba(0,0,0,0.07)" }}>
                    <h3 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: 0.5 }}>Tendencia Mensual</h3>
                    {regularDetallada.tendencia.length > 0 ? (
                      <Chart type="area" height={220}
                        series={[
                          { name: "Valor facturado", data: regularDetallada.tendencia.map(t => t.valor) },
                          { name: "Estudios",         data: regularDetallada.tendencia.map(t => t.estudios) },
                        ]}
                        options={{
                          chart: { type: "area", toolbar: { show: false }, animations: { enabled: true, easing: "easeinout", speed: 600 } },
                          dataLabels: { enabled: false },
                          stroke: { curve: "smooth", width: 2 },
                          xaxis: { categories: regularDetallada.tendencia.map(t => t.mes), labels: { style: { fontSize: "10px" } } },
                          yaxis: [
                            { labels: { formatter: fmtM, style: { fontSize: "11px" } } },
                            { opposite: true, labels: { formatter: (v: number) => v.toLocaleString("es-CO"), style: { fontSize: "11px" } } },
                          ],
                          colors: ["#0f766e", "#1d4ed8"],
                          fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.03, stops: [0, 100] } },
                          grid: { borderColor: "#f1f5f9" },
                          legend: { position: "top" as const, fontSize: "12px" },
                          tooltip: { y: [{ formatter: (v: number) => fmt(v) }, { formatter: (v: number) => `${v.toLocaleString("es-CO")} estudios` }] },
                        }} />
                    ) : <div style={{ textAlign: "center", color: "#94a3b8", padding: 40 }}>Sin datos</div>}
                  </div>

                  {/* Tablas: médicos / procedimientos */}
                  <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 8px rgba(0,0,0,0.07)", overflow: "hidden" }}>
                    <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0" }}>
                      {(["medicos", "procedimientos"] as const).map(tab => (
                        <button key={tab} onClick={() => setTablaProcActiva(tab)}
                          style={{ padding: "12px 24px", border: "none", background: "none", cursor: "pointer",
                            fontWeight: 700, fontSize: 13,
                            color: tablaProcActiva === tab ? "#1d4ed8" : "#64748b",
                            borderBottom: tablaProcActiva === tab ? "3px solid #1d4ed8" : "3px solid transparent" }}>
                          {tab === "medicos" ? "👨‍⚕️ Estadísticas por Médico" : "🔬 Detalle Procedimientos"}
                        </button>
                      ))}
                    </div>

                    {tablaProcActiva === "medicos" && (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                          <thead>
                            <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                              {["#", "Médico", "Estudios", "Valor Facturado", "% Estudios"].map(h => (
                                <th key={h} style={{ padding: "10px 14px", textAlign: h === "Médico" ? "left" : "right",
                                  fontWeight: 700, color: "#475569", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {regularDetallada.medicos.map((m, i) => {
                              const pct = regularDetallada.kpis.total_estudios > 0
                                ? (m.estudios / regularDetallada.kpis.total_estudios * 100).toFixed(1) : "0.0";
                              return (
                                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                                  <td style={{ padding: "9px 14px", color: "#94a3b8", textAlign: "right" }}>{i + 1}</td>
                                  <td style={{ padding: "9px 14px", fontWeight: 600, color: "#0f172a" }}>{m.nombre}</td>
                                  <td style={{ padding: "9px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{m.estudios.toLocaleString("es-CO")}</td>
                                  <td style={{ padding: "9px 14px", textAlign: "right", fontWeight: 700, color: "#1d4ed8", fontVariantNumeric: "tabular-nums" }}>{fmt(m.valor)}</td>
                                  <td style={{ padding: "9px 14px", textAlign: "right" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                                      <div style={{ width: 50, height: 5, background: "#e2e8f0", borderRadius: 3 }}>
                                        <div style={{ width: `${Math.min(parseFloat(pct), 100)}%`, height: "100%", background: "#1d4ed8", borderRadius: 3 }} />
                                      </div>
                                      <span style={{ fontSize: 11, color: "#475569", minWidth: 32 }}>{pct}%</span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {tablaProcActiva === "procedimientos" && (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                          <thead>
                            <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                              {["Contrato", "CUPS", "Procedimiento", "Cantidad", "Valor Unit.", "Total"].map(h => (
                                <th key={h} style={{ padding: "10px 12px",
                                  textAlign: ["Contrato","CUPS","Procedimiento"].includes(h) ? "left" : "right",
                                  fontWeight: 700, color: "#475569", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {regularDetallada.procedimientos.map((p, i) => (
                              <tr key={i} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                                <td style={{ padding: "8px 12px", color: "#475569", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.contrato}</td>
                                <td style={{ padding: "8px 12px", fontFamily: "monospace", color: "#0f766e", fontWeight: 700 }}>{p.cups}</td>
                                <td style={{ padding: "8px 12px", color: "#0f172a", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nombre}</td>
                                <td style={{ padding: "8px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{p.cantidad.toLocaleString("es-CO")}</td>
                                <td style={{ padding: "8px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: "#475569" }}>{fmt(p.valor_uni)}</td>
                                <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "#1d4ed8", fontVariantNumeric: "tabular-nums" }}>{fmt(p.total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ══════════════ TAB: MRC ══════════════ */}
          {activeTab === "mrc" && (
            <div>
              {/* resumen de estados */}
              <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
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
              {/* ordenar: primero los que necesitan atención (sin_inicio, bajo), luego en_rango, sobre, sin_parametros */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(360px,1fr))", gap: 16 }}>
                {[...data.mrc.grupos]
                  .sort((a, b) => {
                    const order: Record<string, number> = { sin_inicio: 0, bajo: 1, en_rango: 2, sobre: 3, sin_parametros: 4 };
                    return (order[a.estado] ?? 5) - (order[b.estado] ?? 5);
                  })
                  .map((g, i) => <MrcGrupoCard key={i} g={g} />)
                }
              </div>
            </div>
          )}

          {/* ══════════════ TAB: ADMISIONES VS FACTURACIÓN ══════════════ */}
          {activeTab === "admisiones" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {!admisiones ? (
                <div style={{ textAlign: "center", padding: "60px 32px", color: "#94a3b8" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📥</div>
                  <p>Sin datos de admisiones para el período seleccionado.</p>
                </div>
              ) : (
                <>
                  {/* KPIs admisiones */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
                    {[
                      { label: "Estudios admisionados", value: admisiones.total_admisiones.toLocaleString("es-CO"), sub: "Por fecha de ingreso del estudio", color: "#1d4ed8", icon: "📥" },
                      { label: "FES emitidas",           value: admisiones.total_facturadas.toLocaleString("es-CO"), sub: "Por fecha de creación de la factura", color: "#10b981", icon: "✅" },
                      { label: "Valor facturado FES",    value: fmt(admisiones.total_valor),                         sub: "Total facturado en el período",         color: "#0f766e", icon: "💰" },
                    ].map((k, i) => (
                      <div key={i} style={{ background: "#fff", borderRadius: 10, padding: "14px 18px",
                        boxShadow: "0 1px 6px rgba(0,0,0,0.07)", borderLeft: `4px solid ${k.color}` }}>
                        <div style={{ fontSize: 18 }}>{k.icon}</div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: 0.5, marginTop: 4 }}>{k.label}</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: k.color, lineHeight: 1.2, margin: "4px 0 2px" }}>{k.value}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>{k.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* Aviso: métricas independientes */}
                  <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 16px", fontSize: 12, color: "#1e40af" }}>
                    ℹ️ <strong>Nota:</strong> "Estudios admisionados" se cuenta por fecha de ingreso del estudio. "FES emitidas" se cuenta por fecha de creación de la factura. Una FES emitida en agosto puede corresponder a un estudio de julio — por eso los totales difieren.
                  </div>

                  {/* Resumen mensual */}
                  {admisiones.resumen_meses && admisiones.resumen_meses.length > 0 && (
                    <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 8px rgba(0,0,0,0.07)", overflowX: "auto" }}>
                      <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#0f172a", textTransform: "uppercase" as const, letterSpacing: 0.5 }}>
                        Resumen por Mes
                      </h3>
                      <p style={{ margin: "0 0 14px", fontSize: 12, color: "#64748b" }}>
                        Admisionados (por mes de ingreso) · FES emitidas (por mes de emisión) — cada columna usa su propia fecha
                      </p>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead>
                          <tr style={{ borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>
                            {["Mes", "Admisionados", "FES emitidas", "Diferencia", "Valor FES"].map(h => (
                              <th key={h} style={{ padding: "8px 12px", textAlign: h === "Mes" ? "left" : "right",
                                fontWeight: 700, color: "#475569", fontSize: 10, textTransform: "uppercase" as const }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {admisiones.resumen_meses.map((m, i) => {
                            const diff = m.admisiones - m.fes;
                            return (
                              <tr key={i} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                                <td style={{ padding: "9px 12px", fontWeight: 700, color: "#0f172a" }}>{m.mes}</td>
                                <td style={{ padding: "9px 12px", textAlign: "right", color: "#1d4ed8", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{m.admisiones.toLocaleString("es-CO")}</td>
                                <td style={{ padding: "9px 12px", textAlign: "right", color: "#10b981", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{m.fes.toLocaleString("es-CO")}</td>
                                <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums",
                                  color: diff >= 0 ? "#16a34a" : "#dc2626" }}>
                                  {diff >= 0 ? "+" : ""}{diff.toLocaleString("es-CO")}
                                </td>
                                <td style={{ padding: "9px 12px", textAlign: "right", color: "#0f766e", fontVariantNumeric: "tabular-nums" }}>{fmt(m.valor)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* alertas */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 10 }}>
                    <div style={{ background: "#fff", border: "1px solid #dbeafe", borderLeft: "4px solid #1d4ed8", borderRadius: 8, padding: "14px 18px" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#1e3a8a", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 6 }}>📈 Tendencia de admisiones</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: admSlope > 1 ? "#16a34a" : admSlope < -1 ? "#dc2626" : "#4f46e5" }}>
                        {admTendencia === "creciente" ? "↑ Creciente" : admTendencia === "decreciente" ? "↓ Decreciente" : "→ Estable"}
                      </div>
                      <div style={{ fontSize: 12, color: "#374151", marginTop: 4 }}>
                        {admTimeline.length > 0 ? `Promedio ${(admisiones.total_admisiones / admTimeline.length).toFixed(1)} admisiones / día` : ""}
                      </div>
                    </div>

                    {topAdmEntidad && (
                      <div style={{ background: "#fff", border: "1px solid #d1fae5", borderLeft: "4px solid #10b981", borderRadius: 8, padding: "14px 18px" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#065f46", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 6 }}>🏆 Mayor volumen de estudios</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{topAdmEntidad.nombre}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "#10b981", margin: "4px 0" }}>{topAdmEntidad.admisiones.toLocaleString("es-CO")} admisiones</div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>{fmt(topAdmEntidad.valor)}</div>
                      </div>
                    )}
                  </div>

                  {/* timeline dual */}
                  <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 8px rgba(0,0,0,0.07)" }}>
                    <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#0f172a", textTransform: "uppercase" as const, letterSpacing: 0.5 }}>
                      Evolución Diaria
                    </h3>
                    <p style={{ margin: "0 0 16px", fontSize: 12, color: "#64748b" }}>
                      Azul = estudios admisionados ese día · Verde = FES emitidas ese día (pueden ser de estudios de otro período)
                    </p>
                    {admTimeline.length > 0
                      ? <Chart type="area" height={280}
                          series={[
                            { name: "Admisiones", data: admTimeline.map(t => t.admisiones) },
                            { name: "Facturadas",  data: admTimeline.map(t => t.facturadas)  },
                          ]}
                          options={admTimelineOpts} />
                      : <div style={{ textAlign: "center", color: "#94a3b8", padding: 40 }}>Sin datos</div>
                    }
                  </div>

                  {/* gráfica por entidad */}
                  <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 8px rgba(0,0,0,0.07)" }}>
                    <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#0f172a", textTransform: "uppercase" as const, letterSpacing: 0.5 }}>
                      Admisionados vs FES Emitidas por Entidad
                    </h3>
                    <p style={{ margin: "0 0 16px", fontSize: 12, color: "#64748b" }}>Top 12 entidades — azul: estudios por fecha ingreso · verde: FES por fecha emisión</p>
                    {admEntidades.length > 0
                      ? <Chart type="bar" height={Math.max(300, admEntidades.slice(0,12).length * 36)}
                          series={[
                            { name: "Admisiones", data: admEntidades.slice(0,12).map(e => e.admisiones) },
                            { name: "Facturadas",  data: admEntidades.slice(0,12).map(e => e.facturadas)  },
                          ]}
                          options={admBarOpts} />
                      : <div style={{ textAlign: "center", color: "#94a3b8", padding: 40 }}>Sin datos</div>
                    }
                  </div>

                  {/* tabla detalle por entidad */}
                  <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 8px rgba(0,0,0,0.07)", overflowX: "auto" }}>
                    <h3 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: "#0f172a", textTransform: "uppercase" as const, letterSpacing: 0.5 }}>Detalle por Entidad</h3>
                    <p style={{ margin: "0 0 14px", fontSize: 11, color: "#64748b" }}>Admisionados: por fecha de ingreso del estudio · FES: por fecha de emisión de la factura</p>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 750 }}>
                      <thead>
                        <tr style={{ borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>
                          {["#", "Entidad", "Admisionados", "FES emitidas", "Valor Facturado"].map(h => (
                            <th key={h} style={{ padding: "8px 10px", textAlign: h === "Entidad" ? "left" : "right",
                              fontWeight: 700, color: "#475569", fontSize: 10, textTransform: "uppercase" as const }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {admEntidades.map((e, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                            <td style={{ padding: "9px 10px", color: "#94a3b8", textAlign: "right" }}>{i + 1}</td>
                            <td style={{ padding: "9px 10px", fontWeight: 600, color: "#0f172a" }}>{e.nombre}</td>
                            <td style={{ padding: "9px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: "#1d4ed8", fontWeight: 700 }}>{e.admisiones.toLocaleString("es-CO")}</td>
                            <td style={{ padding: "9px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: "#10b981", fontWeight: 700 }}>{e.facturadas.toLocaleString("es-CO")}</td>
                            <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: 700, color: "#0f766e", fontVariantNumeric: "tabular-nums" }}>{fmt(e.valor)}</td>
                          </tr>
                        ))}
                        <tr style={{ background: "#f1f5f9", fontWeight: 800, borderTop: "2px solid #e2e8f0" }}>
                          <td colSpan={2} style={{ padding: "10px", color: "#0f172a", fontSize: 12 }}>TOTAL</td>
                          <td style={{ padding: "10px", textAlign: "right", color: "#1d4ed8", fontVariantNumeric: "tabular-nums" }}>{admisiones.total_admisiones.toLocaleString("es-CO")}</td>
                          <td style={{ padding: "10px", textAlign: "right", color: "#10b981", fontVariantNumeric: "tabular-nums" }}>{admisiones.total_facturadas.toLocaleString("es-CO")}</td>
                          <td style={{ padding: "10px", textAlign: "right", color: "#0f766e", fontVariantNumeric: "tabular-nums" }}>{fmt(admisiones.total_valor)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* ── Sección: Por Servicio ── */}
                  {admisiones.servicios && admisiones.servicios.length > 0 && (
                    <>
                      <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 8px rgba(0,0,0,0.07)" }}>
                        <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#0f172a", textTransform: "uppercase" as const, letterSpacing: 0.5 }}>
                          Estudios Realizados por Servicio
                        </h3>
                        <p style={{ margin: "0 0 16px", fontSize: 12, color: "#64748b" }}>Volumen de estudios por tipo de servicio en el período</p>
                        <Chart type="bar" height={Math.max(280, admisiones.servicios.length * 40)}
                          series={[
                            { name: "Admisiones", data: admisiones.servicios.map(s => s.admisiones) },
                          ]}
                          options={servicioBarOpts} />
                      </div>

                      <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 8px rgba(0,0,0,0.07)", overflowX: "auto" }}>
                        <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#0f172a", textTransform: "uppercase" as const, letterSpacing: 0.5 }}>Detalle por Servicio</h3>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 700 }}>
                          <thead>
                            <tr style={{ borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>
                              {["Servicio", "Admisiones"].map(h => (
                                <th key={h} style={{ padding: "8px 10px", textAlign: h === "Servicio" ? "left" : "right",
                                  fontWeight: 700, color: "#475569", fontSize: 10, textTransform: "uppercase" as const }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {admisiones.servicios.map((s, i) => (
                              <tr key={i} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                                <td style={{ padding: "9px 10px", fontWeight: 600, color: "#0f172a" }}>{s.servicio}</td>
                                <td style={{ padding: "9px 10px", textAlign: "right", color: "#1d4ed8", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{s.admisiones.toLocaleString("es-CO")}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {/* ── Sección: Productividad Cuentas Médicas ── */}
                  {usuariosResumen.length > 0 && (
                    <>
                      <div style={{ background: "linear-gradient(135deg,#4c1d95,#3730a3)", borderRadius: 12, padding: "18px 24px" }}>
                        <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#fff", textTransform: "uppercase" as const, letterSpacing: 0.5 }}>
                          Productividad — Área de Cuentas Médicas
                        </h3>
                        <p style={{ margin: 0, fontSize: 12, color: "#c4b5fd" }}>
                          Facturas radicadas por usuario en el período · fecha de radicación
                        </p>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
                        {usuariosResumen.map((u, i) => {
                          const isOpen = expandedUser === u.usuario;
                          return (
                          <div key={i} style={{ background: "#fff", borderRadius: 10,
                            boxShadow: "0 1px 6px rgba(0,0,0,0.07)", borderLeft: "4px solid #7c3aed", overflow: "hidden" }}>
                            <div style={{ padding: "16px 18px" }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase" as const, letterSpacing: 0.5 }}>
                                {i === 0 ? "🏆 " : "👤 "}{u.usuario}
                              </div>
                              <div style={{ fontSize: 28, fontWeight: 800, color: "#4c1d95", margin: "6px 0 2px", fontVariantNumeric: "tabular-nums" }}>
                                {u.total_facturas.toLocaleString("es-CO")}
                              </div>
                              <div style={{ fontSize: 11, color: "#64748b" }}>facturas · {u.dias_activos} días activos</div>
                              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTop: "1px solid #f1f5f9" }}>
                                <div>
                                  <div style={{ fontSize: 9, color: "#94a3b8", textTransform: "uppercase" as const }}>Promedio/día</div>
                                  <div style={{ fontSize: 14, fontWeight: 700, color: "#7c3aed" }}>{u.promedio_dia}</div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                  <div style={{ fontSize: 9, color: "#94a3b8", textTransform: "uppercase" as const }}>Valor total</div>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: "#0f766e" }}>{fmt(u.total_valor)}</div>
                                </div>
                              </div>
                              {u.servicios && u.servicios.length > 0 && (
                                <button onClick={() => setExpandedUser(isOpen ? null : u.usuario)}
                                  style={{ marginTop: 10, width: "100%", background: "none", border: "1px solid #e2e8f0",
                                    borderRadius: 6, padding: "5px 8px", fontSize: 10, color: "#7c3aed", cursor: "pointer",
                                    fontWeight: 600, textAlign: "left" as const }}>
                                  {isOpen ? "▲ Ocultar servicios" : `▼ Ver servicios (${u.servicios.length})`}
                                </button>
                              )}
                            </div>
                            {isOpen && u.servicios && (
                              <div style={{ background: "#f8f7ff", borderTop: "1px solid #ede9fe", padding: "10px 14px" }}>
                                {u.servicios.map((s, j) => (
                                  <div key={j} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                                    padding: "5px 0", borderBottom: j < u.servicios!.length - 1 ? "1px solid #ede9fe" : "none" }}>
                                    <span style={{ fontSize: 11, color: "#374151", fontWeight: 500, flex: 1, paddingRight: 8 }}>{s.servicio}</span>
                                    <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
                                      <span style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", fontVariantNumeric: "tabular-nums" }}>
                                        {s.facturas} fact.
                                      </span>
                                      <span style={{ fontSize: 10, color: "#0f766e", fontVariantNumeric: "tabular-nums" }}>
                                        {fmt(s.valor)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          );
                        })}
                      </div>

                      <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 8px rgba(0,0,0,0.07)" }}>
                        <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#0f172a", textTransform: "uppercase" as const, letterSpacing: 0.5 }}>
                          Total Facturas por Usuario
                        </h3>
                        <Chart type="bar" height={280}
                          series={[{ name: "Facturas generadas", data: usuariosResumen.map(u => u.total_facturas) }]}
                          options={usuariosBarOpts} />
                      </div>

                      <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 8px rgba(0,0,0,0.07)", overflowX: "auto" }}>
                        <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#0f172a", textTransform: "uppercase" as const, letterSpacing: 0.5 }}>Resumen de Productividad</h3>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                          <thead>
                            <tr style={{ borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>
                              {["#", "Usuario", "Facturas", "Días Activos", "Promedio/Día", "Valor Total"].map(h => (
                                <th key={h} style={{ padding: "8px 12px", textAlign: h === "Usuario" ? "left" : "right",
                                  fontWeight: 700, color: "#475569", fontSize: 10, textTransform: "uppercase" as const }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {usuariosResumen.map((u, i) => (
                              <tr key={i} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                                <td style={{ padding: "10px 12px", color: "#94a3b8", textAlign: "right" }}>{i + 1}</td>
                                <td style={{ padding: "10px 12px", fontWeight: 600, color: "#0f172a" }}>{u.usuario}</td>
                                <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#7c3aed", fontVariantNumeric: "tabular-nums" }}>{u.total_facturas.toLocaleString("es-CO")}</td>
                                <td style={{ padding: "10px 12px", textAlign: "right", color: "#475569", fontVariantNumeric: "tabular-nums" }}>{u.dias_activos}</td>
                                <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, color: "#1d4ed8", fontVariantNumeric: "tabular-nums" }}>{u.promedio_dia}</td>
                                <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#0f766e", fontVariantNumeric: "tabular-nums" }}>{fmt(u.total_valor)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
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
