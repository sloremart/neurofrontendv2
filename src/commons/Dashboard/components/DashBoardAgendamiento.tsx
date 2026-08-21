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

const AgendamientoDashboard = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { agendamientoEntidades, agendamientoServicios, agendamientoTimeline, agendamientoTotal, loading, error } = useSelector((state: RootState) => state.dashboard);

    const hoy = dayjs();
    const [fechaInicio, setFechaInicio] = useState<dayjs.Dayjs | null>(hoy);
    const [fechaFin, setFechaFin] = useState<dayjs.Dayjs | null>(hoy);

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

    // Gráfica timeline (área)
    const timelineOptions: ApexCharts.ApexOptions = {
        chart: { type: "area", toolbar: { show: false }, animations: { enabled: true, easing: "easeinout", speed: 800 } },
        colors: ["#7e22ce"],
        fill: { type: "gradient", gradient: { opacityFrom: 0.4, opacityTo: 0.05 } },
        stroke: { curve: "smooth", width: 2 },
        xaxis: {
            categories: agendamientoTimeline.map(t => t.fecha),
            labels: { style: { fontSize: "11px" }, rotate: -30 },
        },
        yaxis: { labels: { formatter: (v: number) => String(Math.round(v)) } },
        dataLabels: { enabled: agendamientoTimeline.length <= 14 },
        tooltip: { y: { formatter: (v) => `${v} citas` } },
        grid: { borderColor: "#E5E7EB", strokeDashArray: 4 },
        legend: { show: false },
    };

    // Gráfica entidades (barras horizontales)
    const entidadesOptions: ApexCharts.ApexOptions = {
        chart: { type: "bar", toolbar: { show: false }, animations: { enabled: true, easing: "easeinout", speed: 800 } },
        colors: CHART_COLORS,
        plotOptions: { bar: { borderRadius: 4, horizontal: true, barHeight: "60%", distributed: true } },
        xaxis: { categories: agendamientoEntidades.map(e => e.nombre), labels: { style: { fontSize: "11px" } } },
        yaxis: { labels: { style: { fontSize: "11px" }, maxWidth: 180 } },
        dataLabels: { enabled: true, formatter: (v) => `${v}`, style: { fontSize: "11px" } },
        tooltip: { y: { formatter: (v) => `${v} citas` } },
        grid: { borderColor: "#E5E7EB", strokeDashArray: 4 },
        legend: { show: false },
    };

    // Gráfica servicios (barras verticales)
    const serviciosTop = [...agendamientoServicios].slice(0, 10);
    const serviciosOptions: ApexCharts.ApexOptions = {
        chart: { type: "bar", toolbar: { show: false }, animations: { enabled: true, easing: "easeinout", speed: 800 } },
        colors: ['#0e7490', '#06b6d4', '#38bdf8', '#67e8f9', '#bae6fd', '#0f766e', '#115e59', '#164e63', '#0c4a6e', '#082f49'],
        plotOptions: { bar: { borderRadius: 6, columnWidth: "55%", distributed: true } },
        xaxis: { categories: serviciosTop.map(s => s.nombre), labels: { show: false } },
        yaxis: { labels: { formatter: (v: number) => String(Math.round(v)) } },
        dataLabels: { enabled: false },
        tooltip: {
            custom: ({ dataPointIndex }: { dataPointIndex: number }) => {
                const s = serviciosTop[dataPointIndex];
                return `<div style="padding:8px 12px;font-size:13px"><strong>${s.nombre}</strong><br/>${s.total} citas</div>`;
            }
        },
        grid: { borderColor: "#E5E7EB", strokeDashArray: 4 },
        legend: { show: false },
    };

    const esRango = fechaInicio && fechaFin && !fechaInicio.isSame(fechaFin, 'day');

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 10 }}>
            <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a", marginBottom: 10, textAlign: "center" }}>
                📅 Dashboard de Agendamiento
            </h2>

            {/* Filtro fechas */}
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
                {/* Atajos rápidos */}
                {[
                    { label: "Hoy", inicio: hoy, fin: hoy },
                    { label: "7 días", inicio: hoy.subtract(6, 'day'), fin: hoy },
                    { label: "30 días", inicio: hoy.subtract(29, 'day'), fin: hoy },
                    { label: "Este mes", inicio: hoy.startOf('month'), fin: hoy },
                ].map(({ label, inicio, fin }) => (
                    <Button
                        key={label}
                        variant="outlined"
                        color="primary"
                        size="small"
                        onClick={() => {
                            setFechaInicio(inicio);
                            setFechaFin(fin);
                            dispatch(get_agenda_diaria(inicio.format("YYYY-MM-DD"), fin.format("YYYY-MM-DD")));
                        }}
                    >
                        {label}
                    </Button>
                ))}
            </div>

            {loading && <p>Cargando datos...</p>}
            {error && <p style={{ color: "red" }}>Error: {error}</p>}

            {!loading && agendamientoEntidades.length > 0 && (
                <div style={{ width: "100%", maxWidth: "1600px" }}>

                    {/* KPI cards */}
                    <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 30, flexWrap: "wrap" }}>
                        <div style={{ backgroundColor: "#3c0b79", color: "white", padding: "15px 30px", borderRadius: 12, textAlign: "center", minWidth: 160 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Total citas</div>
                            <div style={{ fontSize: 28, fontWeight: 700 }}>{agendamientoTotal.toLocaleString("es-CO")}</div>
                        </div>
                        {topEntidad && (
                            <div style={{ backgroundColor: "#de497a", color: "white", padding: "15px 30px", borderRadius: 12, textAlign: "center", minWidth: 160 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Entidad top</div>
                                <div style={{ fontSize: 18, fontWeight: 700 }}>{topEntidad.nombre}</div>
                                <div style={{ fontSize: 13 }}>{topEntidad.citas} citas</div>
                            </div>
                        )}
                        {topServicio && (
                            <div style={{ backgroundColor: "#4A90E2", color: "white", padding: "15px 30px", borderRadius: 12, textAlign: "center", minWidth: 160 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Servicio top</div>
                                <div style={{ fontSize: 16, fontWeight: 700 }}>{topServicio.nombre}</div>
                                <div style={{ fontSize: 13 }}>{topServicio.total} citas</div>
                            </div>
                        )}
                        <div style={{ backgroundColor: "#0f766e", color: "white", padding: "15px 30px", borderRadius: 12, textAlign: "center", minWidth: 160 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Entidades</div>
                            <div style={{ fontSize: 28, fontWeight: 700 }}>{agendamientoEntidades.length}</div>
                        </div>
                    </div>

                    {/* Timeline — solo si hay rango o más de 1 día */}
                    {esRango && agendamientoTimeline.length > 1 && (
                        <div style={{ backgroundColor: "#fff", padding: 24, borderRadius: 12, marginBottom: 20 }}>
                            <Title title="CITAS POR DÍA" />
                            <Chart
                                options={timelineOptions}
                                series={[{ name: "Citas", data: agendamientoTimeline.map(t => t.citas) }]}
                                type="area"
                                height={260}
                            />
                        </div>
                    )}

                    {/* Entidades + Servicios */}
                    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 20, marginTop: 10 }}>
                        <div style={{ flex: "1 1 500px", maxWidth: "750px", backgroundColor: "#fff", padding: 24, borderRadius: 12 }}>
                            <Title title="CITAS POR ENTIDAD" />
                            <Chart
                                options={entidadesOptions}
                                series={[{ name: "Citas", data: agendamientoEntidades.map(e => e.citas) }]}
                                type="bar"
                                height={Math.max(300, agendamientoEntidades.length * 36)}
                            />
                        </div>

                        <div style={{ flex: "1 1 400px", maxWidth: "600px", backgroundColor: "#fff", padding: 24, borderRadius: 12 }}>
                            <Title title="CITAS POR TIPO DE SERVICIO" />
                            <Chart
                                options={serviciosOptions}
                                series={[{ name: "Citas", data: serviciosTop.map(s => s.total) }]}
                                type="bar"
                                height={320}
                            />
                            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px 24px" }}>
                                {serviciosTop.map((s, i) => (
                                    <div key={s.nombre} style={{ display: "flex", alignItems: "center", fontSize: 12, color: "#374151" }}>
                                        <div style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: ['#0e7490', '#06b6d4', '#38bdf8', '#67e8f9', '#bae6fd', '#0f766e', '#115e59', '#164e63', '#0c4a6e', '#082f49'][i], marginRight: 6, flexShrink: 0 }} />
                                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.nombre} <strong>({s.total})</strong></span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!loading && agendamientoEntidades.length === 0 && !error && (
                <p style={{ color: "#6b7280", marginTop: 40 }}>No hay citas para el período seleccionado.</p>
            )}
        </div>
    );
};

export default AgendamientoDashboard;
