import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";

import { Button } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import Chart from "react-apexcharts";
import { AppDispatch, RootState } from "../../../store/store";
import { get_recaudo } from "../store/thunks/DashboardThunks.tsx";
import React from "react";


const RecaudoDashboard = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { recaudo, loading, error } = useSelector((state: RootState) => state.dashboard);

    const [periodo, setPeriodo] = useState<string>(dayjs().format("YYYYMM"));
    const [hasSearched, setHasSearched] = useState(false);
    const [expanded, setExpanded] = useState<string | null>(null);

    const handleBuscar = () => {
        if (!periodo) return;
        setHasSearched(true);
        dispatch(get_recaudo(periodo));
    };

    const toggleExpand = (docId: string) => {
        setExpanded(prev => (prev === docId ? null : docId));
    };

    const totalRecaudado = recaudo.reduce((acc, doc) => acc + doc.ValorTotal, 0);

    const recaudoPorTercero = (() => {
        const map = new Map<string, { nombre: string; total: number }>();
        recaudo.forEach((doc) => {
            doc.Movimientos.forEach((mov) => {
                if (!map.has(mov.NIT)) {
                    map.set(mov.NIT, { nombre: mov.NombreTercero, total: 0 });
                }
                map.get(mov.NIT)!.total += mov.Credito;
            });
        });
        return [...map.entries()]
            .map(([nit, { nombre, total }]) => ({ nit, nombre, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);
    })();

    const donutColors = [
        "#7e22ce", "#6d28d9", "#4f46e5", "#1d4ed8", "#0e7490",
        "#155e75", "#334155", "#3b0764", "#0f172a", "#083344"
    ];

    return (
        <div className="myContainer" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "10px" }}>
            <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>
                🧾 Recaudo
            </h2>

            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "20px", marginTop: "20px" }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                        views={['year', 'month']}
                        label="Periodo"
                        value={dayjs(periodo)}
                        onChange={(newValue) => {
                            if (newValue) {
                                setPeriodo(newValue.format("YYYYMM"));
                            }
                        }}
                    />
                </LocalizationProvider>
                <Button variant="contained" color="primary" onClick={handleBuscar}>
                    Buscar
                </Button>
            </div>

            {hasSearched && (
                <div style={{ width: "100%", maxWidth: "1400px" }}>
                    {loading ? (
                        <p>Cargando datos...</p>
                    ) : error ? (
                        <p style={{ color: "red" }}>Error: {error}</p>
                    ) : recaudo.length === 0 ? (
                        <p>No hay resultados para este periodo.</p>
                    ) : (
                        <>
                            {/* Donut Chart */}
                            <div style={{
                                backgroundColor: "#fff",
                                padding: 24,
                                borderRadius: 12,
                                marginBottom: 30,
                                maxWidth: "100%",
                                display: "flex",
                                justifyContent: "center"
                            }}>
                                <div style={{ width: "100%", maxWidth: 1100 }}>
                                    <h3 className="font-semibold text-lg mb-4">Distribución por Tercero</h3>
                                    <Chart
                                        options={{
                                            chart: { type: "donut" as const },
                                            labels: recaudoPorTercero.map((t) => t.nombre),
                                            tooltip: {
                                                y: { formatter: (val) => `$${val.toLocaleString("es-CO")}` },
                                            },
                                            legend: { show: false },
                                            stroke: { width: 2, colors: ['#fff'] },
                                            colors: donutColors
                                        }}
                                        series={recaudoPorTercero.map((t) => t.total)}
                                        type="donut"
                                        height={400}
                                    />
                                    <div style={{
                                        marginTop: 24,
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2, 1fr)',
                                        rowGap: '14px',
                                        columnGap: '40px',
                                        marginInline: "auto"
                                    }}>
                                        {recaudoPorTercero.map((e, i) => (
                                            <div key={e.nit} style={{ display: 'flex', alignItems: 'center', fontSize: 14 }}>
                                                <div style={{
                                                    width: 12,
                                                    height: 12,
                                                    borderRadius: 6,
                                                    backgroundColor: donutColors[i],
                                                    marginRight: 10
                                                }} />
                                                {e.nombre}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Total Recaudado */}
                            <div style={{
                                backgroundColor: "#3c0b79",
                                color: "white",
                                padding: "20px 40px",
                                borderRadius: 12,
                                marginBottom: 20,
                                textAlign: "center",
                                fontSize: "18px"
                            }}>
                                <strong>Total Debitado:</strong><br />
                                {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(totalRecaudado)}
                            </div>

                            {/* Document Cards Expandibles */}
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(620px, 1fr))",
                                gap: "24px",
                                marginTop: "30px"
                            }}>
                                {recaudo.map((doc) => {
                                    const isOpen = expanded === doc.Documento;
                                    return (
                                        <div key={doc.Documento} style={{
                                            backgroundColor: "#f5f3ff",
                                            padding: 20,
                                            borderRadius: 14,
                                            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                                            border: "1px solid #e5e7eb",
                                            fontSize: 13.5,
                                            color: "#111827"
                                        }}>
                                            <div onClick={() => toggleExpand(doc.Documento)} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>📄 Documento: {doc.Documento}</div>
                                                    <p style={{ margin: "4px 0" }}><strong>Fecha:</strong> {doc.FechaCreado}</p>
                                                    <p style={{ margin: "4px 0" }}><strong>Detalle:</strong> {doc.Detalle}</p>
                                                </div>
                                                <span style={{
                                                    fontSize: 20,
                                                    transform: isOpen ? "rotate(90deg)" : "rotate(0)",
                                                    transition: "transform 0.3s ease",
                                                    color: "#6b21a8", 
                                                }}>
                                                    ❯
                                                </span>
                                            </div>

                                            {isOpen && (
                                                <div style={{ marginTop: 12 }}>
                                                    <p><strong>Cuenta Banco:</strong> {doc.CuentaBanco} - {doc.NombreBanco}</p>
                                                    <p style={{ margin: "6px 0", color: "#2563eb", fontWeight: 600 }}>
                                                        💰 Total Debitado: {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(doc.ValorTotal)}
                                                    </p>
                                                    <h4 style={{ fontWeight: 600 }}>Movimientos:</h4>
                                                    <ul style={{ paddingLeft: 20, marginTop: 6 }}>
                                                        {doc.Movimientos.map((mov, idx) => (
                                                            <li key={idx} style={{ marginBottom: 4 }}>
                                                                <strong>{mov.NombreTercero}</strong> ({mov.NIT}) — {mov.Cuenta} / {mov.NombreCuenta} →
                                                                <span style={{ color: "#0e7490", fontWeight: 600 }}>
                                                                    {" " + new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(mov.Credito)}
                                                                </span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default RecaudoDashboard;