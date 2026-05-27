// src/pages/Dashboard/FacturacionDashboard.tsx

import React, {  useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Chart from "react-apexcharts";
import dayjs from "dayjs";
import { get_facturacion } from "../store/thunks/DashboardThunks.tsx";
import { AppDispatch, RootState } from "../../../store/store.tsx";
import { Title } from "../../../components/Title.tsx";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Button } from "@mui/material";
import RiesgoCompartidoDashboard from "./Mrc.tsx";

const FacturacionDashboard = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { facturacion, loading, error } = useSelector((state: RootState) => state.dashboard);

    const [fechaInicio, setFechaInicio] = useState<dayjs.Dayjs | null>(dayjs());
    const [fechaFin, setFechaFin] = useState<dayjs.Dayjs | null>(dayjs());
    const [hasSearched, setHasSearched] = useState(false);

    const handleBuscar = () => {
        if (!fechaInicio || !fechaFin) return;
        setHasSearched(true);
        dispatch(get_facturacion(fechaInicio.format("YYYY-MM-DD"), fechaFin.format("YYYY-MM-DD")));
    };

    const totalFacturado = facturacion.reduce(
        (acc, entidad) =>
            acc + entidad.servicios.reduce((suma, serv) => suma + serv.total, 0),
        0
    );

    const servicioMasFacturado = (() => {
        const map = new Map<string, number>();
        facturacion.forEach(e => e.servicios.forEach(s => {
            map.set(s.nombre, (map.get(s.nombre) || 0) + s.total);
        }));
        return [...map.entries()].sort((a, b) => b[1] - a[1])[0];
    })();

    const entidadMasFacturada = (() => {
        const lista = facturacion.map(e => ({
            nombre: e.entidad,
            total: e.servicios.reduce((suma, s) => suma + s.total, 0)
        }));
        return lista.sort((a, b) => b.total - a.total)[0];
    })();

    const serviciosTotales = (() => {
        const map = new Map<string, number>();
        facturacion.forEach(ent => {
            ent.servicios.forEach(serv => {
                map.set(serv.nombre, (map.get(serv.nombre) || 0) + serv.total);
            });
        });
        return [...map.entries()]
            .map(([nombre, total]) => ({ name: nombre, total }))
            .sort((a, b) => b.total - a.total);
    })();

    const minValor = serviciosTotales.length > 0 ? Math.min(...serviciosTotales.map(s => s.total)) : 0;
    const maxValor = serviciosTotales.length > 0 ? Math.max(...serviciosTotales.map(s => s.total)) : 0;

    const roundUp = (num: number, precision: number = 1000000) => Math.ceil(num / precision) * precision;
    const roundDown = (num: number, precision: number = 100000) => Math.floor(num / precision) * precision;

    const maxY = roundUp(maxValor);
    const minY = roundDown(minValor);

    const barChartOptions = {
        chart: {
            type: "bar" as const,
            toolbar: { show: false },
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800,
            }
        },
        xaxis: {
            categories: serviciosTotales.map(s => s.name),
            labels: { show: false },
            title: { style: { fontWeight: 600 } }
        },
        dataLabels: { enabled: false },
        tooltip: {
            intersect: false,
            y: { formatter: val => `$${val.toLocaleString("es-CO")}` },
        },
        plotOptions: {
            bar: {
                borderRadius: 6,
                columnWidth: "55%",
                distributed: true
            }
        },
        colors: ['#7e22ce', '#6d28d9', '#4f46e5', '#1d4ed8', '#0e7490', '#155e75', '#334155', '#3b0764', '#0f172a', '#083344'],
        grid: {
            borderColor: '#E5E7EB',
            strokeDashArray: 4,
        },
        legend: { show: false },
        yaxis: {
            min: minY,
            max: maxY,
            tickAmount: 10,
            labels: {
                style: { fontSize: '12px' },
                formatter: (val: number) => `$${val.toLocaleString("es-CO")}`
            },
            title: {
                text: "Valor Facturado (COP)",
                style: { fontWeight: 600, fontSize: '14px' }
            }
        }
    };

    const entidadesPieData = facturacion
        .map(ent => ({
            name: ent.entidad,
            y: ent.servicios.reduce((sum, s) => sum + s.total, 0)
        }))
        .sort((a, b) => b.y - a.y)
        .slice(0, 10);

    const pieChartOptions = {
        chart: {
            type: "donut" as const,
            toolbar: { show: false }
        },
        labels: entidadesPieData.map(e => e.name),
        legend: {
            show: true,
            position: 'bottom' as const,
            horizontalAlign: 'center' as const,
            fontSize: '12px',
            fontWeight: 400,
            markers: {
                width: 12,
                height: 12,
                radius: 12
            },
            itemMargin: {
                horizontal: 10,
                vertical: 4
            }
        },
        tooltip: {
            y: { formatter: val => `$${val.toLocaleString("es-CO")}` }
        },
        stroke: {
            show: true,
            width: 2,
            colors: ['#ffffff']
        },
        fill: { type: 'solid' },
        dataLabels: { enabled: false },
        colors: ['#7e22ce', '#6d28d9', '#4f46e5', '#1d4ed8', '#0e7490', '#155e75', '#334155', '#3b0764', '#0f172a', '#083344']
    };

    return (
        <div className="myContainer" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "10px" }}>
            <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>
                💰 Dashboard Facturación
            </h2>

            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "20px", marginTop: "20px" }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker label="Fecha Inicio" value={fechaInicio} onChange={(newDate) => setFechaInicio(newDate)} />
                </LocalizationProvider>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker label="Fecha Fin" value={fechaFin} onChange={(newDate) => setFechaFin(newDate)} />
                </LocalizationProvider>
                <Button variant="contained" color="primary" onClick={handleBuscar}>
                    Buscar
                </Button>
            </div>

            {hasSearched && (
                <div style={{ width: "100%", maxWidth: "1600px" }}>
                    {loading ? (
                        <p>Cargando datos...</p>
                    ) : error ? (
                        <p style={{ color: "red" }}>Error: {error}</p>
                    ) : facturacion.length === 0 ? (
                        <p>No hay resultados para este rango de fechas.</p>
                    ) : (
                        <>
                            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px', marginTop: '30px' }}>
                                <div style={{ flex: '1 1 600px', maxWidth: '800px', backgroundColor: '#fff', padding: 24, borderRadius: 12 }}>
                                    <Title title="SERVICIO MÁS FACTURADO" />
                                    <Chart options={barChartOptions} series={[{ name: "Facturación", data: serviciosTotales.map(s => s.total) }]} type="bar" height={500} />
                                </div>

                                <div style={{ flex: '1 1 400px', maxWidth: '600px', backgroundColor: '#fff', padding: 24, borderRadius: 12 }}>
                                    <Title title="ENTIDAD MÁS FACTURADA" />
                                    <Chart
                                        options={{ ...pieChartOptions, legend: { show: false } }}
                                        series={entidadesPieData.map(e => e.y)}
                                        type="donut"
                                        height={360}
                                    />

                                    <div style={{
                                        marginTop: 20,
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2, 1fr)',
                                        rowGap: '12px',
                                        columnGap: '32px',
                                        justifyContent: 'center',
                                    }}>
                                        {entidadesPieData.map((e, i) => (
                                            <div key={e.name} style={{ display: 'flex', alignItems: 'center', fontSize: 13 }}>
                                                <div style={{
                                                    width: 12,
                                                    height: 12,
                                                    borderRadius: 6,
                                                    backgroundColor: pieChartOptions.colors[i],
                                                    marginRight: 8
                                                }} />
                                                {e.name}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-around", marginBottom: "30px", flexWrap: "wrap", gap: "20px", marginTop: "30px" }}>
                                <div style={{ backgroundColor: "#3c0b79", color: "white", padding: "15px 30px", borderRadius: 12 }}>
                                    <strong>Total Facturado:</strong><br />
                                    {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(totalFacturado)}
                                </div>
                                <div style={{ backgroundColor: "#de497a", color: "white", padding: "15px 30px", borderRadius: 12 }}>
                                    <strong>Servicio más facturado:</strong><br />
                                    {servicioMasFacturado[0]}<br />
                                    {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(servicioMasFacturado[1])}
                                </div>
                                <div style={{ backgroundColor: "#4A90E2", color: "white", padding: "15px 30px", borderRadius: 12 }}>
                                    <strong>Entidad más facturada:</strong><br />
                                    {entidadMasFacturada.nombre}<br />
                                    {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(entidadMasFacturada.total)}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
            <RiesgoCompartidoDashboard />
        </div>
    );
};

export default FacturacionDashboard;