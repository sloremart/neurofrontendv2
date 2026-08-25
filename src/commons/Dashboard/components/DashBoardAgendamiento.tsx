import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Chart from "react-apexcharts";
import dayjs from "dayjs";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Button } from "@mui/material";

import { AppDispatch, RootState } from "../../../store/store.tsx";
import { get_agenda_diaria } from "../store/thunks/DashboardThunks.tsx";

// ── colores del sistema ────────────────────────────────────────────────────────
const C = {
    atendidas:  "#22c55e",
    programadas:"#3b82f6",
    canceladas: "#ef4444",
    incumplidas:"#f59e0b",
    sin_estado: "#8b5cf6",
    bg:         "#0f172a",
    bgCard:     "#1e293b",
    bgCard2:    "#0f2744",
    purple:     "#7c3aed",
    teal:       "#0e7490",
    pink:       "#be185d",
    blue:       "#1d4ed8",
    text:       "#f1f5f9",
    muted:      "#94a3b8",
};

const CHART_COLORS_MULTI = ['#7e22ce','#6d28d9','#4f46e5','#1d4ed8','#0e7490','#155e75','#334155','#3b0764','#0f172a','#083344'];

// ── cabecera de sección (gradiente oscuro como el otro dashboard) ──────────────
const SectionTitle = ({ title }: { title: string }) => (
    <div style={{
        background: "linear-gradient(90deg, #3b0764 0%, #0e7490 100%)",
        borderRadius: "8px 8px 0 0",
        padding: "10px 20px",
        color: "#fff",
        fontWeight: 700,
        fontSize: 14,
        letterSpacing: "0.05em",
        textTransform: "uppercase" as const,
        marginBottom: 0,
    }}>
        {title}
    </div>
);

// ── tarjeta de sección ────────────────────────────────────────────────────────
const Panel = ({ title, children, style = {} }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) => (
    <div style={{ borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.12)", border: "1px solid #e2e8f0", ...style }}>
        <SectionTitle title={title} />
        <div style={{ padding: "16px 20px", background: "#fff" }}>
            {children}
        </div>
    </div>
);

type Tab = 'resumen' | 'medicos' | 'convenios' | 'timeline';

const TABS: { key: Tab; label: string }[] = [
    { key: 'resumen',   label: '📊 Resumen'     },
    { key: 'medicos',   label: '👩‍⚕️ Por Médico'  },
    { key: 'convenios', label: '🏢 Por Convenio' },
    { key: 'timeline',  label: '📅 Por Día'      },
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
    const [fechaFin, setFechaFin] = useState<dayjs.Dayjs | null>(hoy);
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
    const topMedicos  = (agendamientoMedicos ?? []).slice(0, 12);

    // ── gráfica timeline ────────────────────────────────────────────────────
    const timelineOpts: ApexCharts.ApexOptions = {
        chart: { type: "area", toolbar: { show: false }, animations: { enabled: true, easing: "easeinout", speed: 700 }, background: "transparent" },
        colors: [C.purple],
        fill: { type: "gradient", gradient: { opacityFrom: 0.45, opacityTo: 0.05 } },
        stroke: { curve: "smooth", width: 2 },
        xaxis: { categories: agendamientoTimeline.map(t => t.fecha), labels: { style: { fontSize: "11px", colors: "#6b7280" }, rotate: -30 } },
        yaxis: { labels: { formatter: (v: number) => String(Math.round(v)), style: { colors: "#6b7280" } } },
        dataLabels: { enabled: agendamientoTimeline.length <= 10 },
        tooltip: { y: { formatter: (v) => `${v} citas` } },
        grid: { borderColor: "#f1f5f9", strokeDashArray: 4 },
        legend: { show: false },
    };

    // ── gráfica médicos (barras apiladas, 5 series) ─────────────────────────
    const medicosOpts: ApexCharts.ApexOptions = {
        chart: { type: "bar", stacked: true, toolbar: { show: false }, background: "transparent" },
        plotOptions: { bar: { horizontal: true, barHeight: "60%", borderRadius: 3 } },
        colors: [C.atendidas, C.programadas, C.canceladas, C.incumplidas, C.sin_estado],
        xaxis: {
            categories: topMedicos.map(m => m.medico.length > 28 ? m.medico.substring(0, 28) + '…' : m.medico),
            labels: { style: { fontSize: "11px", colors: "#6b7280" } },
        },
        yaxis: { labels: { style: { fontSize: "11px", colors: "#475569" }, maxWidth: 230 } },
        dataLabels: { enabled: false },
        tooltip: { y: { formatter: (v) => `${v} citas` } },
        legend: {
            position: "bottom" as const,
            fontSize: "12px",
            labels: { colors: "#374151" },
            markers: { size: 8 },
        },
        grid: { borderColor: "#f1f5f9", strokeDashArray: 3 },
    };

    // ── gráfica convenios ───────────────────────────────────────────────────
    const conveniosOpts: ApexCharts.ApexOptions = {
        chart: { type: "bar", toolbar: { show: false }, background: "transparent" },
        colors: CHART_COLORS_MULTI,
        plotOptions: { bar: { borderRadius: 4, horizontal: true, barHeight: "58%", distributed: true } },
        xaxis: {
            categories: agendamientoEntidades.map(e => e.nombre.length > 32 ? e.nombre.substring(0, 32) + '…' : e.nombre),
            labels: { style: { fontSize: "11px", colors: "#6b7280" } },
        },
        yaxis: { labels: { style: { fontSize: "11px", colors: "#475569" }, maxWidth: 200 } },
        dataLabels: { enabled: true, formatter: (v) => `${v}`, style: { fontSize: "11px" } },
        tooltip: { y: { formatter: (v) => `${v} citas` } },
        legend: { show: false },
        grid: { borderColor: "#f1f5f9", strokeDashArray: 3 },
    };

    // ── donut estado ────────────────────────────────────────────────────────
    const donutLabels  = ["Atendidas", "Programadas", "Canceladas", "Incumplidas", "Sin Estado"];
    const donutValues  = [est.atendidas, est.programadas, est.canceladas, est.incumplidas, est.sin_estado];
    const donutColors  = [C.atendidas, C.programadas, C.canceladas, C.incumplidas, C.sin_estado];
    const donutOpts: ApexCharts.ApexOptions = {
        chart: { type: "donut", background: "transparent" },
        labels: donutLabels,
        colors: donutColors,
        dataLabels: { enabled: true, formatter: (val: number) => `${Math.round(val)}%` },
        legend: { position: "bottom" as const, fontSize: "12px", labels: { colors: "#374151" } },
        plotOptions: { pie: { donut: { size: "65%", labels: { show: true, total: { show: true, label: "Total", color: "#374151", formatter: () => est.total.toLocaleString("es-CO") } } } } },
        tooltip: { y: { formatter: (v) => `${v} citas` } },
    };

    const hasData = agendamientoEntidades.length > 0;

    // ── KPI inferior (valor, entidad, servicio) ─────────────────────────────
    const kpiCards = [
        { label: "Total Citas", value: agendamientoTotal.toLocaleString("es-CO"), sub: "", color: C.purple, wide: false },
        ...(agendamientoValorConsultas > 0 ? [{
            label: "Valor Estimado",
            value: agendamientoValorConsultas.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }),
            sub: "Consultas exacto · Imágenes aprox.",
            color: C.blue, wide: true,
        }] : []),
        ...(agendamientoCopago > 0 ? [{
            label: "Copagos Esperados",
            value: agendamientoCopago.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }),
            sub: `Recaudado: ${agendamientoPagado.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })} (${Math.round((agendamientoPagado / agendamientoCopago) * 100)}%)`,
            color: C.teal, wide: false,
        }] : []),
        ...(topEntidad ? [{ label: "Entidad Principal", value: topEntidad.nombre, sub: `${topEntidad.citas} citas`, color: C.pink, wide: false }] : []),
        ...(topServicio ? [{ label: "Servicio Principal", value: topServicio.nombre, sub: `${topServicio.total} citas`, color: "#6d28d9", wide: false }] : []),
        { label: "Convenios", value: agendamientoEntidades.length.toString(), sub: "", color: "#0369a1", wide: false },
    ];

    // ── estado badge cards ──────────────────────────────────────────────────
    const estadoBadges = [
        { label: "ASISTENCIA TOTAL",      value: est.total,       bg: "#3c0b79", fg: "#c084fc" },
        { label: "ATENDIDAS · CONFIRMADAS",value: est.atendidas,  bg: "#064e3b", fg: "#34d399", sub: "Atendidas en Diagnóstico / Estudio" },
        { label: "PROGRAMADAS",            value: est.programadas, bg: "#1e3a5f", fg: "#60a5fa", sub: "Pendientes de atender" },
        { label: "INCUMPLIDAS",            value: est.incumplidas, bg: "#292524", fg: "#d6d3d1" },
        { label: "CANCELADAS",             value: est.canceladas,  bg: "#450a0a", fg: "#fca5a5", sub: "Pérdidas reales" },
        { label: "SIN ESTADO",             value: est.sin_estado,  bg: "#1e1b4b", fg: "#a5b4fc" },
    ];

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 10, padding: "0 8px" }}>
            <h2 style={{ fontSize: "26px", fontWeight: 700, color: "#0f172a", marginBottom: 10, textAlign: "center" }}>
                📅 Dashboard de Agendamiento
            </h2>

            {/* ── filtro ── */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 18, flexWrap: "wrap", justifyContent: "center" }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker label="Fecha inicio" value={fechaInicio} onChange={(d) => setFechaInicio(d)} slotProps={{ textField: { size: "small" } }} />
                </LocalizationProvider>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker label="Fecha fin" value={fechaFin} onChange={(d) => setFechaFin(d)} slotProps={{ textField: { size: "small" } }} />
                </LocalizationProvider>
                <Button variant="contained" color="primary" onClick={handleBuscar} size="small">BUSCAR</Button>
                {[
                    { label: "HOY",       inicio: hoy,                    fin: hoy },
                    { label: "7 DÍAS",    inicio: hoy.subtract(6, 'day'), fin: hoy },
                    { label: "30 DÍAS",   inicio: hoy.subtract(29,'day'), fin: hoy },
                    { label: "ESTE MES",  inicio: hoy.startOf('month'),   fin: hoy },
                ].map(({ label, inicio, fin }) => (
                    <Button key={label} variant="outlined" color="primary" size="small"
                        onClick={() => { setFechaInicio(inicio); setFechaFin(fin); dispatch(get_agenda_diaria(inicio.format("YYYY-MM-DD"), fin.format("YYYY-MM-DD"))); }}>
                        {label}
                    </Button>
                ))}
            </div>

            {loading && <p style={{ color: "#6b7280" }}>Cargando datos...</p>}
            {error   && <p style={{ color: "#ef4444" }}>Error: {error}</p>}

            {!loading && hasData && (
                <div style={{ width: "100%", maxWidth: "1600px" }}>

                    {/* ── estado badges ── */}
                    {est.total > 0 && (
                        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                            {estadoBadges.map(b => (
                                <div key={b.label} style={{ flex: "1 1 140px", backgroundColor: b.bg, borderRadius: 10, padding: "12px 16px", minWidth: 130 }}>
                                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.07em", color: b.fg, opacity: 0.75, textTransform: "uppercase" as const, marginBottom: 5 }}>
                                        {b.label}
                                    </div>
                                    <div style={{ fontSize: 30, fontWeight: 800, color: b.fg, lineHeight: 1 }}>
                                        {b.value.toLocaleString("es-CO")}
                                    </div>
                                    {b.sub && (
                                        <div style={{ fontSize: 9, color: b.fg, opacity: 0.6, marginTop: 4 }}>{b.sub}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── KPI cards ── */}
                    <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
                        {kpiCards.map(k => (
                            <div key={k.label} style={{
                                flex: k.wide ? "2 1 240px" : "1 1 150px",
                                backgroundColor: k.color, color: "#fff",
                                padding: "12px 18px", borderRadius: 10, textAlign: "center",
                            }}>
                                <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.85, marginBottom: 4 }}>{k.label}</div>
                                <div style={{ fontSize: k.wide ? 18 : 22, fontWeight: 700 }}>{k.value}</div>
                                {k.sub && <div style={{ fontSize: 10, opacity: 0.75, marginTop: 3 }}>{k.sub}</div>}
                            </div>
                        ))}
                    </div>

                    {/* ── pestañas ── */}
                    <div style={{ display: "flex", borderBottom: "2px solid #e2e8f0", marginBottom: 20, gap: 0 }}>
                        {TABS.map(t => (
                            <button key={t.key} onClick={() => setTab(t.key)} style={{
                                padding: "10px 20px", fontWeight: tab === t.key ? 700 : 500, fontSize: 13,
                                border: "none", cursor: "pointer", background: "transparent",
                                borderBottom: tab === t.key ? "3px solid #7c3aed" : "3px solid transparent",
                                color: tab === t.key ? "#7c3aed" : "#6b7280",
                                transition: "all 0.15s",
                            }}>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* ──────────── RESUMEN ──────────── */}
                    {tab === 'resumen' && (() => {
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
                                {/* categorías */}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 20 }}>
                                    {catData.map(c => (
                                        <div key={c.key} style={{ borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0" }}>
                                            <div style={{ background: c.color, padding: "14px 18px", color: "#fff" }}>
                                                <div style={{ fontSize: 20, marginBottom: 4 }}>{c.icon}</div>
                                                <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.9 }}>{c.label}</div>
                                                <div style={{ fontSize: 28, fontWeight: 800 }}>{c.citas.toLocaleString("es-CO")} <span style={{ fontSize: 13, fontWeight: 400, opacity: 0.75 }}>citas</span></div>
                                            </div>
                                            <div style={{ padding: "12px 18px", background: "#fff" }}>
                                                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 3 }}>Valor estimado</div>
                                                <div style={{ fontSize: 15, fontWeight: 700, color: c.color }}>
                                                    {c.valor > 0
                                                        ? c.valor.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })
                                                        : <span style={{ color: "#9ca3af", fontWeight: 400, fontSize: 12 }}>Sin tarifa</span>}
                                                </div>
                                                {c.valor > 0 && (
                                                    <div style={{ marginTop: 8, height: 5, backgroundColor: "#e5e7eb", borderRadius: 4 }}>
                                                        <div style={{ height: 5, backgroundColor: c.color, borderRadius: 4, width: `${Math.round((c.valor / maxVal) * 100)}%`, transition: "width 0.6s" }} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* donut estado + detalle servicios en 2 columnas */}
                                <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 16, marginBottom: 20 }}>
                                    {est.total > 0 && (
                                        <Panel title="Estado de Citas">
                                            <Chart options={donutOpts} series={donutValues} type="donut" height={300} />
                                        </Panel>
                                    )}
                                    <Panel title="Detalle por Servicio">
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                                            {agendamientoServicios.map((s, i) => {
                                                const color = CHART_COLORS_MULTI[i % CHART_COLORS_MULTI.length];
                                                return (
                                                    <div key={s.nombre} style={{ flex: "1 1 200px", maxWidth: 260, border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
                                                        <div style={{ height: 5, backgroundColor: color }} />
                                                        <div style={{ padding: "12px 14px" }}>
                                                            <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase" as const, letterSpacing: "0.04em", marginBottom: 6 }}>{s.nombre}</div>
                                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                                                                <div>
                                                                    <div style={{ fontSize: 10, color: "#9ca3af" }}>Citas</div>
                                                                    <div style={{ fontSize: 22, fontWeight: 700, color: "#111" }}>{s.total.toLocaleString("es-CO")}</div>
                                                                </div>
                                                                <div style={{ textAlign: "right" }}>
                                                                    <div style={{ fontSize: 10, color: "#9ca3af" }}>Valor</div>
                                                                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1d4ed8" }}>
                                                                        {(s.valor ?? 0) > 0
                                                                            ? s.valor!.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })
                                                                            : <span style={{ color: "#d1d5db", fontSize: 11, fontWeight: 400 }}>Sin tarifa</span>}
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
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
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
                                        height={Math.max(320, topMedicos.length * 48)}
                                    />
                                ) : (
                                    <p style={{ color: "#6b7280" }}>Sin datos.</p>
                                )}
                            </Panel>

                            <Panel title="Top 10 Convenios">
                                <Chart
                                    options={conveniosOpts}
                                    series={[{ name: "Citas", data: agendamientoEntidades.slice(0, 10).map(e => e.citas) }]}
                                    type="bar"
                                    height={Math.max(320, Math.min(agendamientoEntidades.length, 10) * 48)}
                                />
                            </Panel>
                        </div>
                    )}

                    {/* ──────────── POR CONVENIO ──────────── */}
                    {tab === 'convenios' && (
                        <Panel title="Citas por Convenio / Entidad">
                            <Chart
                                options={conveniosOpts}
                                series={[{ name: "Citas", data: agendamientoEntidades.map(e => e.citas) }]}
                                type="bar"
                                height={Math.max(320, agendamientoEntidades.length * 40)}
                            />
                        </Panel>
                    )}

                    {/* ──────────── POR DÍA ──────────── */}
                    {tab === 'timeline' && (
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
                                    Selecciona un rango de fechas mayor a 1 día para ver la evolución.
                                </p>
                            )}
                        </Panel>
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
