import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Chart from "react-apexcharts";

import { AppDispatch, RootState } from "../../../store/store.tsx";
import { Title } from "../../../components/Title.tsx";
import { get_agenda_diaria } from "../store/thunks/DashboardThunks.tsx";



const AgendamientoDashboard = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { agendamientoEntidades, agendamientoServicios, usuariosAgendamiento, loading, error } = useSelector((state: RootState) => state.dashboard);

    useEffect(() => {
        dispatch(get_agenda_diaria());
    }, [dispatch]);

    const totalCitas = agendamientoEntidades.reduce((sum, e) => sum + e.citas, 0);
    const valorTotalCitas = agendamientoServicios.reduce((sum, s) => sum + s.total, 0);

    const entidadesChartOptions = {
        chart: {
            type: "bar" as const,
            toolbar: { show: false },
            animations: { enabled: true }
        },
        xaxis: { labels: { show: false }, categories: agendamientoEntidades.map(e => e.nombre) },
        dataLabels: { enabled: false },
        plotOptions: {
            bar: { borderRadius: 6, columnWidth: "55%", distributed: true }
        },
        colors: ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#15803d', '#166534', '#14532d'],
        yaxis: {
            title: { text: "Cantidad de Citas" },
            labels: { style: { fontSize: '12px' } },
        },
        grid: { borderColor: '#E5E7EB', strokeDashArray: 4 },
        legend: { show: false },
    };

    const serviciosPieData = [...agendamientoServicios].sort((a, b) => b.total - a.total).slice(0, 10);

    const pieChartOptions = {
        chart: { type: "donut" as const },
        labels: serviciosPieData.map(s => s.nombre),
        tooltip: { y: { formatter: val => `$${val.toLocaleString("es-CO")}` } },
        stroke: { show: true, width: 2, colors: ['#fff'] },
        legend: { show: false },
        colors: ['#0e7490', '#06b6d4', '#38bdf8', '#67e8f9', '#bae6fd', '#0f766e', '#115e59', '#164e63'],
        dataLabels: { enabled: false }
    };

    const userBarColors = [
        '#7e22ce', '#6d28d9', '#4f46e5', '#1d4ed8', '#0e7490',
        '#155e75', '#334155', '#3b0764', '#0f172a', '#083344'
    ];

    return (
        <div className="myContainer" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 5 }}>
            <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a", marginBottom: 10, textAlign: "center" }}>
                📅 Dashboard de Agendamiento Diario
            </h2>

            <div style={{ width: "100%", maxWidth: "1600px", marginTop: 30 }}>
                {loading ? (
                    <p>Cargando datos...</p>
                ) : error ? (
                    <p style={{ color: "red" }}>Error: {error}</p>
                ) : (
                    <>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 20 }}>
                            <div style={{ flex: '1 1 600px', maxWidth: '800px', backgroundColor: '#fff', padding: 24, borderRadius: 12 }}>
                                <Title title="CITAS POR ENTIDAD" />
                                <Chart options={entidadesChartOptions} series={[{ name: "Citas", data: agendamientoEntidades.map(e => e.citas) }]} type="bar" height={500} />
                            </div>

                            <div style={{ flex: '1 1 400px', maxWidth: '600px', backgroundColor: '#fff', padding: 24, borderRadius: 12 }}>
                                <Title title="VALOR AGENDADO POR SERVICIO" />
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <Chart options={pieChartOptions} series={serviciosPieData.map(s => s.total)} type="donut" height={360} />
                                </div>
                                <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', rowGap: 12, columnGap: 32 }}>
                                    {serviciosPieData.map((s, i) => (
                                        <div key={s.nombre} style={{ display: 'flex', alignItems: 'center', fontSize: 13 }}>
                                            <div style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: pieChartOptions.colors[i], marginRight: 8 }} />
                                            {s.nombre}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ backgroundColor: '#fff', padding: 24, borderRadius: 12, marginTop: 30, width: '50%' }}>
                                <div style={{ maxWidth: 500, margin: '0 auto' }}>
                                    <h3 style={{
                                        fontSize: 18,
                                        fontWeight: 600,
                                        color: "#1f2937",
                                        marginBottom: 16,
                                        textAlign: "center"
                                    }}>
                                        📋 CITAS POR USUARIO
                                    </h3>

                                    {usuariosAgendamiento.length === 0 ? (
                                        <p>No se encontraron usuarios agendando hoy.</p>
                                    ) : (
                                        <div style={{ marginTop: 24 }}>
                                            {usuariosAgendamiento.map((usuario, i) => (
                                                <div key={usuario.nombre} style={{ marginBottom: 20 }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        fontSize: 14,
                                                        marginBottom: 4
                                                    }}>
                                                        <span>{usuario.nombre}</span>
                                                        <span>{usuario.citas} citas</span>
                                                    </div>
                                                    <div style={{ background: '#e5e7eb', height: 14, borderRadius: 8 }}>
                                                        <div
                                                            style={{
                                                                width: `${Math.min(usuario.citas * 3, 100)}%`,
                                                                height: '100%',
                                                                borderRadius: 8,
                                                                backgroundColor: userBarColors[i % userBarColors.length]
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "center", marginTop: 30, gap: 20 }}>
                            <div style={{ backgroundColor: "#0f766e", color: "white", padding: "15px 30px", borderRadius: 12, fontWeight: "bold" }}>
                                Total citas agendadas: {totalCitas}
                            </div>
                              <div style={{ backgroundColor: "#0e7490", color: "white", padding: "15px 30px", borderRadius: 12, fontWeight: "bold" }}>
                                Valor total agendado: {valorTotalCitas.toLocaleString("es-CO", { style: "currency", currency: "COP" })}
                            </div>
                        </div>
                     
                    </>
                )}
            </div>
        </div>
    );
};

export default AgendamientoDashboard;