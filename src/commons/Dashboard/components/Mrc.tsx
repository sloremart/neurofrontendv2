import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/store";

import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { Button } from "@mui/material";
import { get_riesgo_compartido } from "../store/thunks/DashboardThunks.tsx";

const RiesgoCompartidoDashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { datos, loading, error } = useSelector((state: RootState) => state.riesgo_compartido);

  const [fechaInicio, setFechaInicio] = useState<dayjs.Dayjs | null>(dayjs());
  const [fechaFin, setFechaFin] = useState<dayjs.Dayjs | null>(dayjs());

  const handleBuscar = () => {
    if (!fechaInicio || !fechaFin) return;
    dispatch(get_riesgo_compartido(fechaInicio.format("DD/MM/YYYY"), fechaFin.format("DD/MM/YYYY")));
  };

  const getCardStyle = (estado: string): { background: string; borderLeft: string } => {
    if (estado.includes("debajo")) return { background: "#fff7ed", borderLeft: "6px solid #fb923c" }; // naranja claro
    if (estado.includes("encima")) return { background: "#fef2f2", borderLeft: "6px solid #ef4444" }; // rojo claro
    return { background: "#f0f9ff", borderLeft: "6px solid #3b82f6" }; // azul claro
  };

  const totalGlobal = datos.reduce((sum, grupo) => sum + grupo.valor_total_pagado, 0);

   return (
    <div className="myContainer" style={{ marginTop: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%' }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>📊 Modelo de Riesgo Compartido</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker label="Fecha Inicio" value={fechaInicio} onChange={(newDate) => setFechaInicio(newDate)} />
          </LocalizationProvider>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker label="Fecha Fin" value={fechaFin} onChange={(newDate) => setFechaFin(newDate)} />
          </LocalizationProvider>
          <Button variant="contained" color="primary" onClick={handleBuscar}>Buscar</Button>
        </div>
      </div>

      {loading && <p>Cargando...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {datos.length > 0 && (
        <>
        

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center' }}>
            {datos.map(grupo => {
              const style = getCardStyle(grupo.estado);
              return (
                <div
                  key={grupo.grupo}
                  style={{
                    flex: '1 1 300px',
                    backgroundColor: style.background,
                    padding: 20,
                    borderRadius: 12,
                    boxShadow: '0 6px 14px rgba(0,0,0,0.08)',
                    borderLeft: style.borderLeft,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    color: '#1e293b',
                    fontSize: 14
                  }}
                >
                  <h3 style={{ marginBottom: 4, fontSize: 18, fontWeight: 700 }}>{grupo.grupo}</h3>
                  
                  <p><strong>Cumplidas:</strong> {grupo.cantidad_total_facturas}</p>
                  <p><strong>Valor por Factura:</strong> ${grupo.costo_unitario_estimado.toLocaleString("es-CO")}</p>
                  <p><strong>Estado:</strong> <em>{grupo.estado}</em></p>
                  <p><strong>Total Pagado:</strong> ${grupo.valor_total_pagado.toLocaleString("es-CO")}</p>
                   <p><strong>Mínima:</strong> {grupo.cantidad_minima} | <strong>Ref:</strong> {grupo.cantidad_referencia} | <strong>Máxima:</strong> {grupo.cantidad_maxima}</p>
                </div>
              );
              
            })}
          </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20, marginTop: 20 }}>
            <div style={{ backgroundColor: "#3c0b79", color: "white", padding: "15px 30px", borderRadius: 12 }}>
              <strong>Total Facturado MRC:</strong><br />
              {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(totalGlobal)}
            </div>
          </div>
        </>
        
      )}
    </div>
  );
};

export default RiesgoCompartidoDashboard;
