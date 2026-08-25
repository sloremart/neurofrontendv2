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
    const topMedicos  = (agendamientoMedicos ?? []).slice(0, 12);
    const hasData     = agendamientoEntidades.length > 0;

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

                    {/* ── fila de estado (6 tarjetas compactas) ── */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 14 }}>
                        {[
                            { label: "ASISTENCIA TOTAL",       value: est.total,        bg: "#3c0b79", fg: "#c084fc" },
                            { label: "ATENDIDAS",              value: est.atendidas,    bg: "#064e3b", fg: "#34d399", sub: "Confirmadas / En estudio" },
                            { label: "PROGRAMADAS",            value: est.programadas,  bg: "#1e3a5f", fg: "#60a5fa", sub: "Pendientes de atender" },
                            { label: "INCUMPLIDAS",            value: est.incumplidas,  bg: "#1c1917", fg: "#a8a29e" },
                            { label: "CANCELADAS",             value: est.canceladas,   bg: "#450a0a", fg: "#fca5a5", sub: "Pérdidas reales" },
                            { label: "SIN ESTADO",             value: est.sin_estado,   bg: "#1e1b4b", fg: "#a5b4fc" },
                        ].map(b => (
                            <div key={b.label} style={{ backgroundColor: b.bg, borderRadius: 10, padding: "12px 14px" }}>
                                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.07em", color: b.fg, opacity: 0.7, textTransform: "uppercase" as const, marginBottom: 4 }}>
                                    {b.label}
                                </div>
                                <div style={{ fontSize: 28, fontWeight: 800, color: b.fg, lineHeight: 1 }}>
                                    {b.value.toLocaleString("es-CO")}
                                </div>
                                {(b as any).sub && <div style={{ fontSize: 9, color: b.fg, opacity: 0.55, marginTop: 4 }}>{(b as any).sub}</div>}
                            </div>
                        ))}
                    </div>

                    {/* ── franja de métricas de negocio (compacta, una sola línea) ── */}
                    <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
                        <div style={{ flex: "0 0 auto", background: "#7c3aed", color: "#fff", borderRadius: 8, padding: "8px 16px", textAlign: "center" }}>
                            <div style={{ fontSize: 10, opacity: 0.8, fontWeight: 600 }}>TOTAL CITAS</div>
                            <div style={{ fontSize: 22, fontWeight: 800 }}>{agendamientoTotal.toLocaleString("es-CO")}</div>
                        </div>
                        {agendamientoValorConsultas > 0 && (
                            <div style={{ flex: "1 1 200px", background: "#1d4ed8", color: "#fff", borderRadius: 8, padding: "8px 16px" }}>
                                <div style={{ fontSize: 10, opacity: 0.8, fontWeight: 600 }}>VALOR ESTIMADO</div>
                                <div style={{ fontSize: 18, fontWeight: 800 }}>{agendamientoValorConsultas.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}</div>
                                <div style={{ fontSize: 9, opacity: 0.7 }}>Consultas: exacto · Imágenes: aprox.</div>
                            </div>
                        )}
                        {agendamientoCopago > 0 && (
                            <div style={{ flex: "1 1 160px", background: "#0e7490", color: "#fff", borderRadius: 8, padding: "8px 16px" }}>
                                <div style={{ fontSize: 10, opacity: 0.8, fontWeight: 600 }}>COPAGOS ESPERADOS</div>
                                <div style={{ fontSize: 16, fontWeight: 800 }}>{agendamientoCopago.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}</div>
                                <div style={{ fontSize: 9, opacity: 0.7 }}>Recaudado: {Math.round((agendamientoPagado / agendamientoCopago) * 100)}%</div>
                            </div>
                        )}
                        {topEntidad && (
                            <div style={{ flex: "1 1 160px", background: "#be185d", color: "#fff", borderRadius: 8, padding: "8px 16px", overflow: "hidden" }}>
                                <div style={{ fontSize: 10, opacity: 0.8, fontWeight: 600 }}>ENTIDAD PRINCIPAL</div>
                                <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{topEntidad.nombre}</div>
                                <div style={{ fontSize: 10, opacity: 0.75 }}>{topEntidad.citas} citas</div>
                            </div>
                        )}
                        {topServicio && (
                            <div style={{ flex: "1 1 140px", background: "#6d28d9", color: "#fff", borderRadius: 8, padding: "8px 16px", overflow: "hidden" }}>
                                <div style={{ fontSize: 10, opacity: 0.8, fontWeight: 600 }}>SERVICIO PRINCIPAL</div>
                                <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{topServicio.nombre}</div>
                                <div style={{ fontSize: 10, opacity: 0.75 }}>{topServicio.total} citas</div>
                            </div>
                        )}
                        <div style={{ flex: "0 0 auto", background: "#0369a1", color: "#fff", borderRadius: 8, padding: "8px 16px", textAlign: "center" }}>
                            <div style={{ fontSize: 10, opacity: 0.8, fontWeight: 600 }}>CONVENIOS</div>
                            <div style={{ fontSize: 22, fontWeight: 800 }}>{agendamientoEntidades.length}</div>
                        </div>
                    </div>

                    {/* ── pestañas ── */}
                    <div style={{
                        display: "flex", borderBottom: "2px solid #e2e8f0", marginBottom: 20,
                        backgroundColor: "#f8fafc", borderRadius: "10px 10px 0 0",
                        padding: "0 4px",
                    }}>
                        {TABS.map(t => (
                            <button key={t.key} onClick={() => setTab(t.key)} style={{
                                padding: "12px 24px", fontWeight: tab === t.key ? 700 : 500,
                                fontSize: 14, border: "none", cursor: "pointer",
                                background: tab === t.key ? "#fff" : "transparent",
                                borderBottom: tab === t.key ? "3px solid #7c3aed" : "3px solid transparent",
                                color: tab === t.key ? "#7c3aed" : "#64748b",
                                borderRadius: "8px 8px 0 0",
                                transition: "all 0.15s",
                                boxShadow: tab === t.key ? "0 -2px 8px rgba(124,58,237,0.08)" : "none",
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
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
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
                    )}

                    {/* ──────────── POR CONVENIO ──────────── */}
                    {tab === 'convenios' && (
                        <Panel title="Citas por Convenio / Entidad">
                            <Chart
                                options={{ ...conveniosOpts, xaxis: { ...conveniosOpts.xaxis, categories: agendamientoEntidades.map(e => e.nombre.length > 30 ? e.nombre.slice(0,30)+'…' : e.nombre) } }}
                                series={[{ name: "Citas", data: agendamientoEntidades.map(e => e.citas) }]}
                                type="bar"
                                height={Math.max(320, agendamientoEntidades.length * 42)}
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
                                    Selecciona un rango mayor a 1 día para ver la evolución.
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
