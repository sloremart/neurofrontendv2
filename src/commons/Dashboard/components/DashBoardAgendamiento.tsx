import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Chart from "react-apexcharts";
import dayjs from "dayjs";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Button } from "@mui/material";

import { AppDispatch, RootState } from "../../../store/store.tsx";
import { get_agenda_diaria } from "../store/thunks/DashboardThunks.tsx";

const CHART_COLORS = ['#7e22ce','#6d28d9','#4f46e5','#1d4ed8','#0e7490','#155e75','#334155','#3b0764','#0f172a','#083344'];

// ── regresión lineal simple ───────────────────────────────────────────────────
function linearSlope(values: number[]): number {
    const n = values.length;
    if (n < 2) return 0;
    const sumX  = (n * (n - 1)) / 2;
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    const sumY  = values.reduce((a, v) => a + v, 0);
    const sumXY = values.reduce((a, v, i) => a + i * v, 0);
    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
}

// ── cabecera de sección ───────────────────────────────────────────────────────
const Panel = ({ title, children, style = {} }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) => (
    <div style={{ borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.09)", border: "1px solid #e2e8f0", ...style }}>
        <div style={{
            background: "linear-gradient(90deg, #3b0764 0%, #0e7490 100%)",
            padding: "9px 18px", color: "#fff", fontWeight: 700,
            fontSize: 13, letterSpacing: "0.05em", textTransform: "uppercase" as const,
        }}>
            {title}
        </div>
        <div style={{ padding: "16px 18px", background: "#fff" }}>
            {children}
        </div>
    </div>
);

type Tab = 'resumen' | 'medicos' | 'convenios' | 'timeline';

const TABS: { key: Tab; label: string }[] = [
    { key: 'resumen',   label: 'Resumen'      },
    { key: 'medicos',   label: 'Por Médico'   },
    { key: 'convenios', label: 'Por Convenio' },
    { key: 'timeline',  label: 'Por Día'      },
];

const AgendamientoDashboard = () => {
    const dispatch = useDispatch<AppDispatch>();
    const {
        agendamientoEntidades, agendamientoServicios, agendamientoTimeline, agendamientoTotal,
        agendamientoValorConsultas, agendamientoCopago, agendamientoPagado,
        agendamientoEstados, agendamientoMedicos,
        loading, error,
    } = useSelector((state: RootState) => state.dashboard);

    const hoy = dayjs();
    const [fechaInicio, setFechaInicio] = useState<dayjs.Dayjs | null>(hoy);
    const [fechaFin,    setFechaFin]    = useState<dayjs.Dayjs | null>(hoy);
    const [tab, setTab] = useState<Tab>('resumen');

    useEffect(() => {
        dispatch(get_agenda_diaria(hoy.format("YYYY-MM-DD"), hoy.format("YYYY-MM-DD")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch]);

    const handleBuscar = () => {
        if (!fechaInicio || !fechaFin) return;
        dispatch(get_agenda_diaria(fechaInicio.format("YYYY-MM-DD"), fechaFin.format("YYYY-MM-DD")));
    };

    const topEntidad  = agendamientoEntidades[0];
    const topServicio = agendamientoServicios[0];
    const est = agendamientoEstados ?? { total: 0, atendidas: 0, programadas: 0, incumplidas: 0, canceladas: 0, sin_estado: 0 };
    const allMedicos  = agendamientoMedicos ?? [];
    const topMedicos  = allMedicos.slice(0, 12);
    const hasData     = agendamientoEntidades.length > 0;

    // ── analytics derivados ───────────────────────────────────────────────────
    const medicoStats = allMedicos.map(m => ({
        ...m,
        eficiencia:       m.total > 0 ? Math.round((m.atendidas  / m.total) * 100) : 0,
        pctCancelacion:   m.total > 0 ? Math.round((m.canceladas / m.total) * 100) : 0,
        pctIncumplido:    m.total > 0 ? Math.round((m.incumplidas/ m.total) * 100) : 0,
        pctProgramadas:   m.total > 0 ? Math.round((m.programadas/ m.total) * 100) : 0,
    }));
    const medicoPorColapso    = [...medicoStats].sort((a, b) => b.programadas - a.programadas);
    const medicoPorCancelacion= [...medicoStats].filter(m => m.total >= 10).sort((a, b) => b.pctCancelacion - a.pctCancelacion);
    const medicoMasEficiente  = [...medicoStats].filter(m => m.atendidas > 5).sort((a, b) => b.eficiencia - a.eficiencia)[0];

    const totalConvenios   = agendamientoEntidades.reduce((a, e) => a + e.citas, 0);
    const top1Pct          = totalConvenios > 0 ? Math.round((agendamientoEntidades[0]?.citas ?? 0) / totalConvenios * 100) : 0;
    const top2Sum          = (agendamientoEntidades[0]?.citas ?? 0) + (agendamientoEntidades[1]?.citas ?? 0);
    const top2Pct          = totalConvenios > 0 ? Math.round((top2Sum / totalConvenios) * 100) : 0;
    const conveniosSinTop2 = agendamientoEntidades.slice(2);
    const mayorOportunidad = conveniosSinTop2.sort((a, b) => b.citas - a.citas)[0];

    const tlValues  = agendamientoTimeline.map(t => t.citas);
    const tlSlope   = linearSlope(tlValues);
    const tlAvgDia  = tlValues.length > 0 ? Math.round(tlValues.reduce((a, v) => a + v, 0) / tlValues.length) : 0;
    const tlMax     = tlValues.length > 0 ? Math.max(...tlValues) : 0;
    const tlMaxFecha= agendamientoTimeline[tlValues.indexOf(tlMax)]?.fecha ?? '';
    const diasRestantesMes = dayjs().endOf('month').diff(dayjs(), 'day');
    const proyeccionMes    = Math.round(tlAvgDia * diasRestantesMes);
    const tendencia        = tlSlope > 2 ? 'creciente' : tlSlope < -2 ? 'decreciente' : 'estable';

    // ── gráficas ──────────────────────────────────────────────────────────────
    const medicosOpts: ApexCharts.ApexOptions = {
        chart: { type: "bar", stacked: true, toolbar: { show: false } },
        plotOptions: { bar: { horizontal: true, barHeight: "62%", borderRadius: 3 } },
        colors: ["#22c55e", "#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6"],
        xaxis: {
            categories: topMedicos.map(m => m.medico.length > 26 ? m.medico.slice(0, 26) + '…' : m.medico),
            labels: { style: { fontSize: "11px" } },
        },
        yaxis: { labels: { style: { fontSize: "11px" }, maxWidth: 220 } },
        dataLabels: { enabled: false },
        tooltip: { y: { formatter: (v) => `${v} citas` } },
        legend: { position: "bottom" as const, fontSize: "12px", markers: { size: 8 } },
        grid: { borderColor: "#f1f5f9", strokeDashArray: 3 },
    };

    const conveniosOpts: ApexCharts.ApexOptions = {
        chart: { type: "bar", toolbar: { show: false } },
        colors: CHART_COLORS,
        plotOptions: { bar: { borderRadius: 4, horizontal: true, barHeight: "58%", distributed: true } },
        xaxis: {
            categories: agendamientoEntidades.slice(0, 10).map(e => e.nombre.length > 30 ? e.nombre.slice(0, 30) + '…' : e.nombre),
            labels: { style: { fontSize: "11px" } },
        },
        yaxis: { labels: { style: { fontSize: "11px" }, maxWidth: 200 } },
        dataLabels: { enabled: true, formatter: (v) => `${v}`, style: { fontSize: "11px" } },
        tooltip: { y: { formatter: (v) => `${v} citas` } },
        legend: { show: false },
        grid: { borderColor: "#f1f5f9", strokeDashArray: 3 },
    };

    const timelineOpts: ApexCharts.ApexOptions = {
        chart: { type: "area", toolbar: { show: false }, animations: { enabled: true, easing: "easeinout", speed: 700 } },
        colors: ["#7c3aed"],
        fill: { type: "gradient", gradient: { opacityFrom: 0.45, opacityTo: 0.05 } },
        stroke: { curve: "smooth", width: 2 },
        xaxis: { categories: agendamientoTimeline.map(t => t.fecha), labels: { style: { fontSize: "11px" }, rotate: -30 } },
        yaxis: { labels: { formatter: (v: number) => String(Math.round(v)) } },
        dataLabels: { enabled: agendamientoTimeline.length <= 10 },
        tooltip: { y: { formatter: (v) => `${v} citas` } },
        grid: { borderColor: "#f1f5f9", strokeDashArray: 4 },
        legend: { show: false },
    };

    const donutOpts: ApexCharts.ApexOptions = {
        chart: { type: "donut" },
        labels: ["Atendidas", "Programadas", "Canceladas", "Incumplidas", "Sin Estado"],
        colors: ["#22c55e", "#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6"],
        dataLabels: { enabled: true, formatter: (val: number) => `${Math.round(val)}%` },
        legend: { position: "bottom" as const, fontSize: "12px" },
        plotOptions: { pie: { donut: { size: "60%", labels: { show: true, total: {
            show: true, label: "Total", color: "#374151",
            formatter: () => est.total.toLocaleString("es-CO"),
        } } } } },
        tooltip: { y: { formatter: (v) => `${v} citas` } },
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 8, padding: "0 8px" }}>

            {/* ── título + filtro en una sola barra ── */}
            <div style={{ width: "100%", maxWidth: "1600px", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", whiteSpace: "nowrap" }}>📅 Dashboard de Agendamiento</span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker label="Fecha inicio" value={fechaInicio} onChange={(d) => setFechaInicio(d)} slotProps={{ textField: { size: "small" } }} />
                    </LocalizationProvider>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker label="Fecha fin" value={fechaFin} onChange={(d) => setFechaFin(d)} slotProps={{ textField: { size: "small" } }} />
                    </LocalizationProvider>
                    <Button variant="contained" color="primary" size="small" onClick={handleBuscar}>BUSCAR</Button>
                    {[
                        { label: "HOY",      inicio: hoy,                    fin: hoy },
                        { label: "7 DÍAS",   inicio: hoy.subtract(6,'day'),  fin: hoy },
                        { label: "30 DÍAS",  inicio: hoy.subtract(29,'day'), fin: hoy },
                        { label: "ESTE MES", inicio: hoy.startOf('month'),   fin: hoy },
                    ].map(({ label, inicio, fin }) => (
                        <Button key={label} variant="outlined" size="small"
                            onClick={() => { setFechaInicio(inicio); setFechaFin(fin); dispatch(get_agenda_diaria(inicio.format("YYYY-MM-DD"), fin.format("YYYY-MM-DD"))); }}>
                            {label}
                        </Button>
                    ))}
                </div>
            </div>

            {loading && <p style={{ color: "#6b7280" }}>Cargando datos...</p>}
            {error   && <p style={{ color: "#ef4444" }}>Error: {error}</p>}

            {!loading && hasData && (
                <div style={{ width: "100%", maxWidth: "1600px" }}>

                    {/* ── pestañas primero ── */}
                    <div style={{ display: "flex", gap: 6, marginBottom: 20, padding: "6px", background: "#f1f5f9", borderRadius: 12, width: "fit-content" }}>
                        {TABS.map(t => (
                            <button key={t.key} onClick={() => setTab(t.key)} style={{
                                padding: "10px 24px", fontWeight: 600, fontSize: 14,
                                border: "none", cursor: "pointer", borderRadius: 8,
                                background: tab === t.key ? "#7c3aed" : "transparent",
                                color: tab === t.key ? "#fff" : "#64748b",
                                transition: "all 0.18s",
                                boxShadow: tab === t.key ? "0 2px 8px rgba(124,58,237,0.35)" : "none",
                            }}>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* ──────────── RESUMEN ──────────── */}
                    {tab === 'resumen' && (() => {
                        // Métricas y estados dentro del tab Resumen
                        const metricItems = [
                            { label: "Total Citas",        value: agendamientoTotal.toLocaleString("es-CO"),                                                                                                          show: true,                           flex: "0 0 110px" },
                            { label: "Valor Estimado",     value: agendamientoValorConsultas.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }),                              show: agendamientoValorConsultas > 0,  flex: "2 1 200px", sub: "Consultas exacto · Imágenes aprox." },
                            { label: "Copagos Esperados",  value: agendamientoCopago.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }),                                      show: agendamientoCopago > 0,          flex: "1 1 150px", sub: `Recaudado ${Math.round((agendamientoPagado / Math.max(agendamientoCopago, 1)) * 100)}%` },
                            { label: "Entidad Principal",  value: topEntidad?.nombre ?? "",                                                                                                                           show: !!topEntidad,                   flex: "1 1 180px", sub: `${topEntidad?.citas ?? 0} citas` },
                            { label: "Servicio Principal", value: topServicio?.nombre ?? "",                                                                                                                          show: !!topServicio,                  flex: "1 1 160px", sub: `${topServicio?.total ?? 0} citas` },
                            { label: "Convenios",          value: agendamientoEntidades.length.toString(),                                                                                                            show: true,                           flex: "0 0 90px" },
                        ].filter(m => m.show);

                        const estadoBadges = [
                            { label: "Asistencia Total", value: est.total,       bg: "#3c0b79", fg: "#e9d5ff" },
                            { label: "Atendidas",        value: est.atendidas,   bg: "#064e3b", fg: "#6ee7b7", sub: "Confirmadas / En estudio" },
                            { label: "Programadas",      value: est.programadas, bg: "#1e3a5f", fg: "#93c5fd", sub: "Pendientes" },
                            { label: "Incumplidas",      value: est.incumplidas, bg: "#292524", fg: "#d6d3d1" },
                            { label: "Canceladas",       value: est.canceladas,  bg: "#450a0a", fg: "#fca5a5", sub: "Pérdidas reales" },
                            { label: "Sin Estado",       value: est.sin_estado,  bg: "#1e1b4b", fg: "#c4b5fd" },
                        ];

                        const cats = [
                            { key: "Consultas",      label: "Consultas Médicas",    color: "#7c3aed", icon: "🩺" },
                            { key: "Imágenes",       label: "Imágenes Diagnósticas",color: "#0e7490", icon: "🔬" },
                            { key: "Procedimientos", label: "Procedimientos",       color: "#1d4ed8", icon: "⚕️"  },
                            { key: "Otros",          label: "Otros Servicios",      color: "#64748b", icon: "📋" },
                        ];
                        const catData = cats.map(c => ({
                            ...c,
                            citas: agendamientoServicios.filter(s => s.categoria === c.key).reduce((a, s) => a + s.total, 0),
                            valor: agendamientoServicios.filter(s => s.categoria === c.key).reduce((a, s) => a + (s.valor ?? 0), 0),
                        })).filter(c => c.citas > 0);
                        const maxVal = Math.max(...catData.map(c => c.valor), 1);
                        return (
                            <>
                                {/* panel unificado: estado + métricas */}
                                <div style={{ background: "#1e293b", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.2)", marginBottom: 20 }}>
                                    {/* fila superior: estado de citas */}
                                    <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                                        {estadoBadges.map((b, i) => (
                                            <div key={b.label} style={{
                                                flex: 1, padding: "12px 16px",
                                                borderRight: i < estadoBadges.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none",
                                                display: "flex", flexDirection: "column", gap: 2,
                                            }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                                                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: b.fg, opacity: 0.7, flexShrink: 0 }} />
                                                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.07em", color: "#94a3b8", textTransform: "uppercase" as const }}>{b.label}</span>
                                                </div>
                                                <div style={{ fontSize: 26, fontWeight: 800, color: b.fg, lineHeight: 1, letterSpacing: "-0.02em" }}>
                                                    {b.value.toLocaleString("es-CO")}
                                                </div>
                                                {(b as any).sub && (
                                                    <div style={{ fontSize: 9, color: "#64748b", marginTop: 1 }}>{(b as any).sub}</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {/* fila inferior: métricas financieras/operativas */}
                                    <div style={{ display: "flex" }}>
                                        {metricItems.map((m, i) => (
                                            <div key={m.label} style={{ flex: m.flex, padding: "10px 16px", color: "#fff", borderRight: i < metricItems.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none", overflow: "hidden" }}>
                                                <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.07em", opacity: 0.45, textTransform: "uppercase" as const, marginBottom: 3 }}>{m.label}</div>
                                                <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.value}</div>
                                                {(m as any).sub && <div style={{ fontSize: 8, opacity: 0.4, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{(m as any).sub}</div>}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* categorías en 4 cards */}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 20 }}>
                                    {catData.map(c => (
                                        <div key={c.key} style={{ borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", border: "1px solid #e2e8f0" }}>
                                            <div style={{ background: c.color, padding: "14px 16px", color: "#fff" }}>
                                                <span style={{ fontSize: 18 }}>{c.icon}</span>
                                                <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.9, marginTop: 4 }}>{c.label}</div>
                                                <div style={{ fontSize: 28, fontWeight: 800 }}>{c.citas.toLocaleString("es-CO")} <span style={{ fontSize: 13, fontWeight: 400, opacity: 0.75 }}>citas</span></div>
                                            </div>
                                            <div style={{ padding: "10px 16px", background: "#fff" }}>
                                                <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>Valor estimado</div>
                                                <div style={{ fontSize: 14, fontWeight: 700, color: c.color }}>
                                                    {c.valor > 0
                                                        ? c.valor.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })
                                                        : <span style={{ color: "#d1d5db", fontWeight: 400, fontSize: 12 }}>Sin tarifa</span>}
                                                </div>
                                                {c.valor > 0 && (
                                                    <div style={{ marginTop: 6, height: 4, background: "#e5e7eb", borderRadius: 4 }}>
                                                        <div style={{ height: 4, background: c.color, borderRadius: 4, width: `${Math.round((c.valor / maxVal) * 100)}%`, transition: "width 0.6s" }} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* donut + servicios en 2 columnas */}
                                <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 14, marginBottom: 20 }}>
                                    {est.total > 0 && (
                                        <Panel title="Estado de Citas">
                                            <Chart
                                                options={donutOpts}
                                                series={[est.atendidas, est.programadas, est.canceladas, est.incumplidas, est.sin_estado]}
                                                type="donut"
                                                height={280}
                                            />
                                        </Panel>
                                    )}
                                    <Panel title="Detalle por Servicio">
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                                            {agendamientoServicios.map((s, i) => {
                                                const color = CHART_COLORS[i % CHART_COLORS.length];
                                                return (
                                                    <div key={s.nombre} style={{ flex: "1 1 180px", maxWidth: 250, border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
                                                        <div style={{ height: 4, background: color }} />
                                                        <div style={{ padding: "10px 12px" }}>
                                                            <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase" as const, letterSpacing: "0.04em", marginBottom: 4 }}>{s.nombre}</div>
                                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                                                                <div>
                                                                    <div style={{ fontSize: 9, color: "#9ca3af" }}>Citas</div>
                                                                    <div style={{ fontSize: 20, fontWeight: 700, color: "#111" }}>{s.total.toLocaleString("es-CO")}</div>
                                                                </div>
                                                                <div style={{ textAlign: "right" }}>
                                                                    <div style={{ fontSize: 9, color: "#9ca3af" }}>Valor</div>
                                                                    <div style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8" }}>
                                                                        {(s.valor ?? 0) > 0
                                                                            ? s.valor!.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })
                                                                            : <span style={{ color: "#d1d5db", fontSize: 10, fontWeight: 400 }}>Sin tarifa</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </Panel>
                                </div>
                            </>
                        );
                    })()}

                    {/* ──────────── POR MÉDICO ──────────── */}
                    {tab === 'medicos' && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
                            {/* alertas de inteligencia */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10 }}>

                                {/* riesgo de colapso */}
                                <div style={{ background: "#fff", border: "1px solid #fde68a", borderLeft: "4px solid #f59e0b", borderRadius: 8, padding: "12px 16px" }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: "#92400e", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 8 }}>
                                        ⚠️ Agenda más cargada
                                    </div>
                                    {medicoPorColapso.slice(0, 3).map((m, i) => (
                                        <div key={m.medico} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                            <span style={{ fontSize: 12, color: "#374151", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>
                                                {i + 1}. {m.medico}
                                            </span>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: m.programadas > 50 ? "#dc2626" : "#d97706", marginLeft: 8, flexShrink: 0 }}>
                                                {m.programadas} pendientes
                                            </span>
                                        </div>
                                    ))}
                                    {medicoPorColapso[0]?.programadas > 50 && (
                                        <div style={{ marginTop: 6, fontSize: 10, color: "#dc2626", fontStyle: "italic" }}>
                                            {medicoPorColapso[0].medico.split(' ')[0]} puede colapsar — revisar agenda
                                        </div>
                                    )}
                                </div>

                                {/* mayor tasa de cancelación */}
                                <div style={{ background: "#fff", border: "1px solid #fecaca", borderLeft: "4px solid #ef4444", borderRadius: 8, padding: "12px 16px" }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: "#7f1d1d", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 8 }}>
                                        ❌ Mayor cancelación
                                    </div>
                                    {medicoPorCancelacion.slice(0, 3).map((m, i) => (
                                        <div key={m.medico} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                            <span style={{ fontSize: 12, color: "#374151", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>
                                                {i + 1}. {m.medico}
                                            </span>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: m.pctCancelacion > 20 ? "#dc2626" : "#6b7280", marginLeft: 8, flexShrink: 0 }}>
                                                {m.pctCancelacion}% canceladas
                                            </span>
                                        </div>
                                    ))}
                                    <div style={{ marginTop: 6, fontSize: 10, color: "#6b7280", fontStyle: "italic" }}>
                                        Mínimo 10 citas para aparecer
                                    </div>
                                </div>

                                {/* más eficiente */}
                                {medicoMasEficiente && (
                                    <div style={{ background: "#fff", border: "1px solid #bbf7d0", borderLeft: "4px solid #22c55e", borderRadius: 8, padding: "12px 16px" }}>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: "#14532d", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 8 }}>
                                            ✅ Mayor eficiencia
                                        </div>
                                        <div style={{ fontSize: 20, fontWeight: 800, color: "#16a34a" }}>{medicoMasEficiente.eficiencia}%</div>
                                        <div style={{ fontSize: 12, color: "#374151", marginTop: 2 }}>{medicoMasEficiente.medico}</div>
                                        <div style={{ fontSize: 10, color: "#6b7280", marginTop: 4 }}>
                                            {medicoMasEficiente.atendidas} de {medicoMasEficiente.total} citas atendidas
                                        </div>
                                        <div style={{ marginTop: 8 }}>
                                            {[...medicoStats].filter(m => m.atendidas > 5).sort((a, b) => b.eficiencia - a.eficiencia).slice(1, 4).map(m => (
                                                <div key={m.medico} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b7280", marginBottom: 3 }}>
                                                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>{m.medico}</span>
                                                    <span style={{ fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>{m.eficiencia}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* gráficas */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                <Panel title="Citas por Médico">
                                    {topMedicos.length > 0 ? (
                                        <Chart
                                            options={medicosOpts}
                                            series={[
                                                { name: "Atendidas / Confirmadas", data: topMedicos.map(m => m.atendidas) },
                                                { name: "Programadas",             data: topMedicos.map(m => m.programadas) },
                                                { name: "Canceladas",              data: topMedicos.map(m => m.canceladas) },
                                                { name: "Incumplidas",             data: topMedicos.map(m => m.incumplidas) },
                                                { name: "Sin Estado",              data: topMedicos.map(m => m.sin_estado) },
                                            ]}
                                            type="bar"
                                            height={Math.max(320, topMedicos.length * 50)}
                                        />
                                    ) : (
                                        <p style={{ color: "#6b7280", textAlign: "center", padding: 20 }}>Sin datos de médicos.</p>
                                    )}
                                </Panel>
                                <Panel title="Top 10 Convenios">
                                    <Chart
                                        options={conveniosOpts}
                                        series={[{ name: "Citas", data: agendamientoEntidades.slice(0, 10).map(e => e.citas) }]}
                                        type="bar"
                                        height={Math.max(320, Math.min(agendamientoEntidades.length, 10) * 50)}
                                    />
                                </Panel>
                            </div>
                        </div>
                    )}

                    {/* ──────────── POR CONVENIO ──────────── */}
                    {tab === 'convenios' && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
                            {/* insights pareto */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>

                                <div style={{ background: "#fff", border: "1px solid #e0e7ff", borderLeft: "4px solid #6366f1", borderRadius: 8, padding: "14px 18px" }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: "#3730a3", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 6 }}>
                                        📊 Regla de Pareto
                                    </div>
                                    <div style={{ fontSize: 28, fontWeight: 800, color: "#4f46e5" }}>{top2Pct}%</div>
                                    <div style={{ fontSize: 12, color: "#374151", marginTop: 2 }}>
                                        de las citas proviene de solo <strong>2 convenios</strong>
                                    </div>
                                    <div style={{ marginTop: 8 }}>
                                        {agendamientoEntidades.slice(0, 2).map(e => (
                                            <div key={e.nombre} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b7280", marginBottom: 3 }}>
                                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>{e.nombre}</span>
                                                <span style={{ fontWeight: 700, color: "#4f46e5", flexShrink: 0, marginLeft: 8 }}>{totalConvenios > 0 ? Math.round(e.citas / totalConvenios * 100) : 0}%</span>
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
                                            ? `Alta dependencia de ${agendamientoEntidades[0]?.nombre ?? ''} (${top1Pct}%). Perder este convenio impactaría fuertemente la operación.`
                                            : `Los convenios están bien distribuidos. Ninguno representa más del ${top1Pct}% del total.`
                                        }
                                    </div>
                                </div>

                                {mayorOportunidad && (
                                    <div style={{ background: "#fff", border: "1px solid #fef3c7", borderLeft: "4px solid #f59e0b", borderRadius: 8, padding: "14px 18px" }}>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: "#92400e", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 6 }}>
                                            💡 Convenio por crecer
                                        </div>
                                        <div style={{ fontSize: 15, fontWeight: 700, color: "#374151" }}>{mayorOportunidad.nombre}</div>
                                        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                                            {mayorOportunidad.citas} citas · {totalConvenios > 0 ? Math.round(mayorOportunidad.citas / totalConvenios * 100) : 0}% del total
                                        </div>
                                        <div style={{ fontSize: 11, color: "#92400e", marginTop: 6, fontStyle: "italic" }}>
                                            Potencial de crecimiento fuera del top 2
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Panel title="Citas por Convenio / Entidad">
                                <Chart
                                    options={{ ...conveniosOpts, xaxis: { ...conveniosOpts.xaxis, categories: agendamientoEntidades.map(e => e.nombre.length > 30 ? e.nombre.slice(0,30)+'…' : e.nombre) } }}
                                    series={[{ name: "Citas", data: agendamientoEntidades.map(e => e.citas) }]}
                                    type="bar"
                                    height={Math.max(320, agendamientoEntidades.length * 42)}
                                />
                            </Panel>
                        </div>
                    )}

                    {/* ──────────── POR DÍA ──────────── */}
                    {tab === 'timeline' && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
                            {agendamientoTimeline.length > 1 && (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>

                                    <div style={{ background: "#fff", border: "1px solid #e0e7ff", borderLeft: `4px solid ${tlSlope > 2 ? "#22c55e" : tlSlope < -2 ? "#ef4444" : "#6366f1"}`, borderRadius: 8, padding: "14px 18px" }}>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: "#3730a3", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 6 }}>
                                            📈 Tendencia del período
                                        </div>
                                        <div style={{ fontSize: 24, fontWeight: 800, color: tlSlope > 2 ? "#16a34a" : tlSlope < -2 ? "#dc2626" : "#4f46e5" }}>
                                            {tendencia === 'creciente' ? '↑ Creciente' : tendencia === 'decreciente' ? '↓ Decreciente' : '→ Estable'}
                                        </div>
                                        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                                            {Math.abs(Math.round(tlSlope))} citas/día de {tlSlope >= 0 ? 'aumento' : 'caída'} en promedio
                                        </div>
                                    </div>

                                    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderLeft: "4px solid #0ea5e9", borderRadius: 8, padding: "14px 18px" }}>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: "#075985", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 6 }}>
                                            📅 Promedio diario
                                        </div>
                                        <div style={{ fontSize: 28, fontWeight: 800, color: "#0284c7" }}>{tlAvgDia}</div>
                                        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>citas por día en el período seleccionado</div>
                                    </div>

                                    <div style={{ background: "#fff", border: "1px solid #fef9c3", borderLeft: "4px solid #ca8a04", borderRadius: 8, padding: "14px 18px" }}>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: "#713f12", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 6 }}>
                                            🏔️ Día pico
                                        </div>
                                        <div style={{ fontSize: 28, fontWeight: 800, color: "#ca8a04" }}>{tlMax}</div>
                                        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>citas el {tlMaxFecha}</div>
                                    </div>

                                    {diasRestantesMes > 0 && (
                                        <div style={{ background: "#fff", border: "1px solid #d1fae5", borderLeft: "4px solid #10b981", borderRadius: 8, padding: "14px 18px" }}>
                                            <div style={{ fontSize: 10, fontWeight: 700, color: "#065f46", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 6 }}>
                                                🔮 Proyección resto del mes
                                            </div>
                                            <div style={{ fontSize: 28, fontWeight: 800, color: "#059669" }}>~{proyeccionMes.toLocaleString("es-CO")}</div>
                                            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                                                citas en los próximos {diasRestantesMes} días, al ritmo actual
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <Panel title="Evolución de Citas por Día">
                                {agendamientoTimeline.length > 1 ? (
                                    <Chart
                                        options={timelineOpts}
                                        series={[{ name: "Citas", data: agendamientoTimeline.map(t => t.citas) }]}
                                        type="area"
                                        height={300}
                                    />
                                ) : (
                                    <p style={{ color: "#6b7280", textAlign: "center", padding: 30 }}>
                                        Selecciona un rango mayor a 1 día para ver la evolución.
                                    </p>
                                )}
                            </Panel>
                        </div>
                    )}
                </div>
            )}

            {!loading && !hasData && !error && (
                <p style={{ color: "#6b7280", marginTop: 40 }}>No hay citas para el período seleccionado.</p>
            )}
        </div>
    );
};

export default AgendamientoDashboard;
