import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Chart from "react-apexcharts";
import dayjs from "dayjs";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Button } from "@mui/material";

import { AppDispatch, RootState } from "../../../store/store.tsx";
import { Title } from "../../../components/Title.tsx";
import { get_agenda_diaria } from "../store/thunks/DashboardThunks.tsx";

const CHART_COLORS = ['#7e22ce', '#6d28d9', '#4f46e5', '#1d4ed8', '#0e7490', '#155e75', '#334155', '#3b0764', '#0f172a', '#083344'];

type Tab = 'resumen' | 'medicos' | 'convenios' | 'timeline';

const TAB_LABELS: Record<Tab, string> = {
    resumen: 'Resumen',
    medicos: 'Por Médico',
    convenios: 'Por Convenio',
    timeline: 'Por Día',
};

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

    const topEntidad = agendamientoEntidades[0];
    const topServicio = agendamientoServicios[0];
    const esRango = fechaInicio && fechaFin && !fechaInicio.isSame(fechaFin, 'day');

    // ── gráfica timeline ────────────────────────────────────────────────────
    const timelineOptions: ApexCharts.ApexOptions = {
        chart: { type: "area", toolbar: { show: false }, animations: { enabled: true, easing: "easeinout", speed: 800 } },
        colors: ["#7e22ce"],
        fill: { type: "gradient", gradient: { opacityFrom: 0.4, opacityTo: 0.05 } },
        stroke: { curve: "smooth", width: 2 },
        xaxis: { categories: agendamientoTimeline.map(t => t.fecha), labels: { style: { fontSize: "11px" }, rotate: -30 } },
        yaxis: { labels: { formatter: (v: number) => String(Math.round(v)) } },
        dataLabels: { enabled: agendamientoTimeline.length <= 14 },
        tooltip: { y: { formatter: (v) => `${v} citas` } },
        grid: { borderColor: "#E5E7EB", strokeDashArray: 4 },
        legend: { show: false },
    };

    // ── gráfica entidades (convenios) ───────────────────────────────────────
    const entidadesOptions: ApexCharts.ApexOptions = {
        chart: { type: "bar", toolbar: { show: false }, animations: { enabled: true, easing: "easeinout", speed: 800 } },
        colors: CHART_COLORS,
        plotOptions: { bar: { borderRadius: 4, horizontal: true, barHeight: "60%", distributed: true } },
        xaxis: { categories: agendamientoEntidades.map(e => e.nombre), labels: { style: { fontSize: "11px" } } },
        yaxis: { labels: { style: { fontSize: "11px" }, maxWidth: 200 } },
        dataLabels: { enabled: true, formatter: (v) => `${v}`, style: { fontSize: "11px" } },
        tooltip: { y: { formatter: (v) => `${v} citas` } },
        grid: { borderColor: "#E5E7EB", strokeDashArray: 4 },
        legend: { show: false },
    };

    // ── gráfica médicos ─────────────────────────────────────────────────────
    const topMedicos = (agendamientoMedicos ?? []).slice(0, 12);
    const medicosOptions: ApexCharts.ApexOptions = {
        chart: { type: "bar", stacked: true, toolbar: { show: false } },
        plotOptions: { bar: { horizontal: true, barHeight: "65%" } },
        colors: ["#22c55e", "#ef4444", "#f59e0b"],
        xaxis: { categories: topMedicos.map(m => m.medico), labels: { style: { fontSize: "11px" } } },
        yaxis: { labels: { style: { fontSize: "11px" }, maxWidth: 220 } },
        dataLabels: { enabled: false },
        tooltip: { y: { formatter: (v) => `${v} citas` } },
        legend: { position: "bottom" as const, fontSize: "12px" },
        grid: { borderColor: "#E5E7EB", strokeDashArray: 4 },
    };

    // ── cards estado ────────────────────────────────────────────────────────
    const est = agendamientoEstados ?? { total: 0, atendidas: 0, programadas: 0, incumplidas: 0, canceladas: 0, sin_estado: 0 };
    const estadoCards = [
        { label: "ASISTENCIA TOTAL", value: est.total, color: "#3c0b79", textColor: "#c084fc", desc: "" },
        { label: "ATENDIDAS · CONFIRMADAS", value: est.atendidas, color: "#064e3b", textColor: "#34d399", desc: "Atendidas en diagnóstico / Estudio" },
        { label: "PROGRAMADAS", value: est.programadas, color: "#1e3a5f", textColor: "#60a5fa", desc: "Pendientes de atender" },
        { label: "INCUMPLIDAS", value: est.incumplidas, color: "#1c1917", textColor: "#78716c", desc: "" },
        { label: "CANCELADAS", value: est.canceladas, color: "#450a0a", textColor: "#f87171", desc: "Pérdidas reales" },
        { label: "SIN ESTADO", value: est.sin_estado, color: "#1e1b4b", textColor: "#a5b4fc", desc: "" },
    ];

    const hasData = agendamientoEntidades.length > 0;

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 10 }}>
            <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a", marginBottom: 10, textAlign: "center" }}>
                📅 Dashboard de Agendamiento
            </h2>

            {/* ── Filtro fechas ── */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20, marginTop: 10, flexWrap: "wrap", justifyContent: "center" }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker label="Fecha inicio" value={fechaInicio} onChange={(d) => setFechaInicio(d)} />
                </LocalizationProvider>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker label="Fecha fin" value={fechaFin} onChange={(d) => setFechaFin(d)} />
                </LocalizationProvider>
                <Button variant="contained" color="primary" onClick={handleBuscar}>
                    Buscar
                </Button>
                {[
                    { label: "Hoy", inicio: hoy, fin: hoy },
                    { label: "7 días", inicio: hoy.subtract(6, 'day'), fin: hoy },
                    { label: "30 días", inicio: hoy.subtract(29, 'day'), fin: hoy },
                    { label: "Este mes", inicio: hoy.startOf('month'), fin: hoy },
                ].map(({ label, inicio, fin }) => (
                    <Button key={label} variant="outlined" color="primary" size="small"
                        onClick={() => { setFechaInicio(inicio); setFechaFin(fin); dispatch(get_agenda_diaria(inicio.format("YYYY-MM-DD"), fin.format("YYYY-MM-DD"))); }}>
                        {label}
                    </Button>
                ))}
            </div>

            {loading && <p>Cargando datos...</p>}
            {error && <p style={{ color: "red" }}>Error: {error}</p>}

            {!loading && hasData && (
                <div style={{ width: "100%", maxWidth: "1600px" }}>

                    {/* ── Tarjetas de estado (siempre visibles) ── */}
                    {est.total > 0 && (
                        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                            {estadoCards.map(c => (
                                <div key={c.label} style={{
                                    flex: "1 1 150px", backgroundColor: c.color, borderRadius: 12,
                                    padding: "14px 18px", color: "white", minWidth: 140,
                                }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", opacity: 0.75, marginBottom: 6, textTransform: "uppercase" }}>
                                        {c.label}
                                    </div>
                                    <div style={{ fontSize: 32, fontWeight: 700, color: c.textColor, lineHeight: 1 }}>
                                        {c.value.toLocaleString("es-CO")}
                                    </div>
                                    {c.desc && (
                                        <div style={{ fontSize: 10, opacity: 0.65, marginTop: 5 }}>{c.desc}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── KPI cards principales ── */}
                    <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
                        <div style={{ backgroundColor: "#3c0b79", color: "white", padding: "14px 24px", borderRadius: 12, textAlign: "center", minWidth: 150 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, opacity: 0.85 }}>Total citas</div>
                            <div style={{ fontSize: 26, fontWeight: 700 }}>{agendamientoTotal.toLocaleString("es-CO")}</div>
                        </div>
                        {agendamientoValorConsultas > 0 && (
                            <div style={{ backgroundColor: "#1d4ed8", color: "white", padding: "14px 24px", borderRadius: 12, textAlign: "center", minWidth: 200 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, opacity: 0.85 }}>Valor estimado total</div>
                                <div style={{ fontSize: 20, fontWeight: 700 }}>
                                    {agendamientoValorConsultas.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
                                </div>
                                <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>Consultas: exacto · Imágenes: aprox.</div>
                            </div>
                        )}
                        {agendamientoCopago > 0 && (
                            <div style={{ backgroundColor: "#0f766e", color: "white", padding: "14px 24px", borderRadius: 12, textAlign: "center", minWidth: 170 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, opacity: 0.85 }}>Copagos esperados</div>
                                <div style={{ fontSize: 20, fontWeight: 700 }}>
                                    {agendamientoCopago.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
                                </div>
                                <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>
                                    Recaudado: {agendamientoPagado.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
                                    {agendamientoCopago > 0 && ` (${Math.round((agendamientoPagado / agendamientoCopago) * 100)}%)`}
                                </div>
                            </div>
                        )}
                        {topEntidad && (
                            <div style={{ backgroundColor: "#de497a", color: "white", padding: "14px 24px", borderRadius: 12, textAlign: "center", minWidth: 150 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, opacity: 0.85 }}>Entidad principal</div>
                                <div style={{ fontSize: 16, fontWeight: 700 }}>{topEntidad.nombre}</div>
                                <div style={{ fontSize: 12, marginTop: 2 }}>{topEntidad.citas} citas</div>
                            </div>
                        )}
                        {topServicio && (
                            <div style={{ backgroundColor: "#7c3aed", color: "white", padding: "14px 24px", borderRadius: 12, textAlign: "center", minWidth: 150 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, opacity: 0.85 }}>Servicio principal</div>
                                <div style={{ fontSize: 14, fontWeight: 700 }}>{topServicio.nombre}</div>
                                <div style={{ fontSize: 12, marginTop: 2 }}>{topServicio.total} citas</div>
                            </div>
                        )}
                        <div style={{ backgroundColor: "#4A90E2", color: "white", padding: "14px 24px", borderRadius: 12, textAlign: "center", minWidth: 130 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, opacity: 0.85 }}>Entidades</div>
                            <div style={{ fontSize: 26, fontWeight: 700 }}>{agendamientoEntidades.length}</div>
                        </div>
                    </div>

                    {/* ── Pestañas ── */}
                    <div style={{ display: "flex", gap: 0, marginBottom: 0, borderBottom: "2px solid #e5e7eb" }}>
                        {(Object.keys(TAB_LABELS) as Tab[]).map(t => (
                            <button key={t} onClick={() => setTab(t)} style={{
                                padding: "10px 22px", fontWeight: tab === t ? 700 : 500,
                                fontSize: 14, border: "none", cursor: "pointer",
                                borderBottom: tab === t ? "3px solid #7c3aed" : "3px solid transparent",
                                color: tab === t ? "#7c3aed" : "#6b7280",
                                background: "transparent", transition: "all 0.15s",
                            }}>
                                {TAB_LABELS[t]}
                            </button>
                        ))}
                    </div>

                    {/* ── Contenido de pestaña ── */}
                    <div style={{ paddingTop: 20 }}>

                        {/* RESUMEN */}
                        {tab === 'resumen' && (() => {
                            const cats = [
                                { key: "Consultas", label: "Consultas Médicas", color: "#3c0b79", icon: "🩺" },
                                { key: "Imágenes", label: "Imágenes Diagnósticas", color: "#0e7490", icon: "🔬" },
                                { key: "Procedimientos", label: "Procedimientos", color: "#1d4ed8", icon: "⚕️" },
                                { key: "Otros", label: "Otros Servicios", color: "#64748b", icon: "📋" },
                            ];
                            const catData = cats.map(c => ({
                                ...c,
                                citas: agendamientoServicios.filter(s => s.categoria === c.key).reduce((a, s) => a + s.total, 0),
                                valor: agendamientoServicios.filter(s => s.categoria === c.key).reduce((a, s) => a + (s.valor ?? 0), 0),
                            })).filter(c => c.citas > 0);
                            const maxVal = Math.max(...catData.map(c => c.valor), 1);
                            return (
                                <>
                                    <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
                                        {catData.map(c => (
                                            <div key={c.key} style={{ flex: "1 1 200px", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", border: "1px solid #e5e7eb" }}>
                                                <div style={{ backgroundColor: c.color, padding: "14px 18px", color: "white" }}>
                                                    <div style={{ fontSize: 18, marginBottom: 4 }}>{c.icon}</div>
                                                    <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.9 }}>{c.label}</div>
                                                    <div style={{ fontSize: 26, fontWeight: 700 }}>{c.citas.toLocaleString("es-CO")} <span style={{ fontSize: 13, fontWeight: 400, opacity: 0.8 }}>citas</span></div>
                                                </div>
                                                <div style={{ padding: "12px 18px", backgroundColor: "#fff" }}>
                                                    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Valor estimado</div>
                                                    <div style={{ fontSize: 15, fontWeight: 700, color: c.color }}>
                                                        {c.valor > 0
                                                            ? c.valor.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })
                                                            : <span style={{ color: "#9ca3af", fontWeight: 400, fontSize: 12 }}>Sin tarifa registrada</span>}
                                                    </div>
                                                    {c.valor > 0 && (
                                                        <div style={{ marginTop: 10 }}>
                                                            <div style={{ height: 5, backgroundColor: "#e5e7eb", borderRadius: 4 }}>
                                                                <div style={{ height: 5, backgroundColor: c.color, borderRadius: 4, width: `${Math.round((c.valor / maxVal) * 100)}%`, transition: "width 0.6s ease" }} />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ backgroundColor: "#fff", padding: 24, borderRadius: 12 }}>
                                        <Title title="DETALLE POR SERVICIO" />
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 16, justifyContent: "flex-start" }}>
                                            {agendamientoServicios.map((s, i) => {
                                                const color = CHART_COLORS[i % CHART_COLORS.length];
                                                const pct = agendamientoValorConsultas > 0 && (s.valor ?? 0) > 0
                                                    ? Math.round(((s.valor ?? 0) / agendamientoValorConsultas) * 100) : 0;
                                                return (
                                                    <div key={s.nombre} style={{ flex: "1 1 220px", maxWidth: 280, borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: "1px solid #e5e7eb" }}>
                                                        <div style={{ height: 6, backgroundColor: color }} />
                                                        <div style={{ padding: "14px 16px" }}>
                                                            <div style={{ fontSize: 12, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>{s.nombre}</div>
                                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                                                                <div>
                                                                    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>Citas</div>
                                                                    <div style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>{s.total.toLocaleString("es-CO")}</div>
                                                                </div>
                                                                <div style={{ textAlign: "right" }}>
                                                                    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>Valor estimado</div>
                                                                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1d4ed8" }}>
                                                                        {(s.valor ?? 0) > 0
                                                                            ? (s.valor!).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })
                                                                            : <span style={{ color: "#9ca3af", fontSize: 12, fontWeight: 400 }}>Sin tarifa</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {pct > 0 && (
                                                                <div style={{ marginTop: 12 }}>
                                                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b7280", marginBottom: 4 }}>
                                                                        <span>% del total</span>
                                                                        <span style={{ fontWeight: 600, color }}>{pct}%</span>
                                                                    </div>
                                                                    <div style={{ height: 4, backgroundColor: "#e5e7eb", borderRadius: 4 }}>
                                                                        <div style={{ height: 4, backgroundColor: color, borderRadius: 4, width: `${pct}%` }} />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </>
                            );
                        })()}

                        {/* POR MÉDICO */}
                        {tab === 'medicos' && (
                            <div style={{ backgroundColor: "#fff", padding: 24, borderRadius: 12 }}>
                                <Title title="CITAS POR MÉDICO" />
                                {topMedicos.length > 0 ? (
                                    <Chart
                                        options={medicosOptions}
                                        series={[
                                            { name: "Atendidas / Confirmadas", data: topMedicos.map(m => m.atendidas) },
                                            { name: "Canceladas", data: topMedicos.map(m => m.canceladas) },
                                            { name: "Incumplidas", data: topMedicos.map(m => m.incumplidas) },
                                        ]}
                                        type="bar"
                                        height={Math.max(320, topMedicos.length * 46)}
                                    />
                                ) : (
                                    <p style={{ color: "#6b7280" }}>Sin datos de médicos disponibles.</p>
                                )}
                            </div>
                        )}

                        {/* POR CONVENIO */}
                        {tab === 'convenios' && (
                            <div style={{ backgroundColor: "#fff", padding: 24, borderRadius: 12 }}>
                                <Title title="CITAS POR CONVENIO / ENTIDAD" />
                                <Chart
                                    options={entidadesOptions}
                                    series={[{ name: "Citas", data: agendamientoEntidades.map(e => e.citas) }]}
                                    type="bar"
                                    height={Math.max(300, agendamientoEntidades.length * 38)}
                                />
                            </div>
                        )}

                        {/* TIMELINE */}
                        {tab === 'timeline' && (
                            <div style={{ backgroundColor: "#fff", padding: 24, borderRadius: 12 }}>
                                <Title title="CITAS POR DÍA" />
                                {agendamientoTimeline.length > 1 ? (
                                    <Chart
                                        options={timelineOptions}
                                        series={[{ name: "Citas", data: agendamientoTimeline.map(t => t.citas) }]}
                                        type="area"
                                        height={280}
                                    />
                                ) : (
                                    <p style={{ color: "#6b7280" }}>Selecciona un rango de fechas mayor a 1 día para ver la evolución.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!loading && !hasData && !error && (
                <p style={{ color: "#6b7280", marginTop: 40 }}>No hay citas para el período seleccionado.</p>
            )}
        </div>
    );
};

export default AgendamientoDashboard;
