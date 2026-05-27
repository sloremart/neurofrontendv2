import React, { useState } from "react";
import { useDispatch } from "react-redux";

import { Title } from "../../../components/Title.tsx";

import { Button } from "@mui/material";




import { fetch_estado_cartera, } from "../store/thunks/AuditoriaDashboardthunks.tsx";

import EstadoCarteraPorNit from "../components/EstadoCarteraPorNit.tsx";


const colorEstado = {
    "181+ días": "#8e44ad",      // Púrpura (mayor antigüedad)
    "151-180 días": "#c0392b",   // Rojo oscuro
    "121-150 días": "#e74c3c",   // Rojo
    "91-120 días": "#d35400",    // Naranja rojizo
    "61-90 días": "#e67e22",     // Naranja oscuro
    "31-60 días": "#f39c12",     // Naranja
    "1-30 días": "#2ecc71",      // Verde profesional (menor antigüedad)
};

const formatoCOP = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
});

const InformeTotalFacturacion = () => {
    const dispatch = useDispatch();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [anio, setAnio] = useState(new Date().getFullYear().toString());
    const [mes, setMes] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));

    const cargarDatos = async () => {
        setLoading(true);
        const resultado = await dispatch(fetch_estado_cartera(anio, mes));
        const formateado = Object.entries(resultado).map(([nit, valores]: any) => ({
            nit,
            nombre: valores.nombre,
            dias_credito: valores.dias_credito,
            ...valores,
        }));
        setData(formateado);
        setLoading(false);
    };


    return (
        <>
            <div
                className="myContainer"
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}
            >
                <Title title="Estado de Cartera por Entidad" />

                <div style={{ marginBottom: 20, marginTop: 20, display: "flex", gap: "10px", alignItems: "center" }}>
                    <input
                        type="number"
                        value={anio}
                        onChange={(e) => setAnio(e.target.value)}
                        placeholder="Año"
                        style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc", width: "80px" }}
                    />
                    <input
                        type="number"
                        value={mes}
                        onChange={(e) => setMes(e.target.value)}
                        placeholder="Mes"
                        min="1"
                        max="12"
                        style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc", width: "60px" }}
                    />
                    <Button variant="contained" onClick={cargarDatos} disabled={loading}>
                        {loading ? "Cargando..." : "Actualizar"}
                    </Button>
                </div>

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 20,
                        width: "100%",
                        maxWidth: 1300,
                    }}
                >
                    {data.map((entidad, idx) => {
                        // Calcular valores netos (con recaudo aplicado)
                        const recaudoPendiente = entidad.recaudo_pendiente_aplicar || 0;
                        const rangosNetos: { [key: string]: number } = {};
                        
                        // Debug: Mostrar valores originales
                        console.log(`🔍 Entidad: ${entidad.nombre}`);
                        console.log(`💰 Recaudo pendiente: ${recaudoPendiente}`);
                        console.log(`📊 Tipo de recaudo pendiente:`, typeof recaudoPendiente);
                        console.log(`📊 Valores originales:`, {
                            "181+ días": entidad["181+ días"],
                            "151-180 días": entidad["151-180 días"],
                            "121-150 días": entidad["121-150 días"]
                        });
                        
                        // Verificar que el recaudo pendiente sea un número válido
                        if (typeof recaudoPendiente !== 'number' || isNaN(recaudoPendiente)) {
                            console.error(`❌ Recaudo pendiente inválido para ${entidad.nombre}:`, recaudoPendiente);
                        }
                        
                        // Debug: Mostrar objeto completo de la entidad
                        console.log(`🔍 Objeto completo de ${entidad.nombre}:`, entidad);
                        
                        // Aplicar el recaudo pendiente a los rangos (mayor antigüedad primero)
                        const rangosOrdenados = [
                            "181+ días", "151-180 días", "121-150 días", 
                            "91-120 días", "61-90 días", "31-60 días", "1-30 días"
                        ];
                        
                        let valorRestante = recaudoPendiente;
                        
                        rangosOrdenados.forEach(rango => {
                            const valorOriginal = entidad[rango] || 0;
                            console.log(`🔍 Procesando rango ${rango}: valor=${valorOriginal}, recaudo_restante=${valorRestante}`);
                            
                            if (valorRestante > 0 && valorOriginal > 0) {
                                if (valorRestante >= valorOriginal) {
                                    // El recaudo cubre todo este rango
                                    rangosNetos[rango] = 0;
                                    valorRestante -= valorOriginal;
                                    console.log(`✅ Rango ${rango}: ${valorOriginal} → 0 (recaudo cubre todo)`);
                                } else {
                                    // El recaudo cubre parcialmente este rango
                                    rangosNetos[rango] = valorOriginal - valorRestante;
                                    console.log(`🔄 Rango ${rango}: ${valorOriginal} → ${valorOriginal - valorRestante} (recaudo cubre parcialmente)`);
                                    valorRestante = 0;
                                }
                            } else {
                                // No hay recaudo pendiente o no hay valor en este rango
                                rangosNetos[rango] = valorOriginal;
                                console.log(`➡️ Rango ${rango}: ${valorOriginal} (sin cambios)`);
                            }
                        });
                        
                        // Debug: Mostrar resultado final
                        console.log(`📈 Rangos netos finales:`, rangosNetos);
                        const totalNeto = Object.values(rangosNetos).reduce((total: number, valor: number) => total + valor, 0);
                        console.log(`💡 Total neto: ${totalNeto}`);
                        console.log('---');

                        return (
                            <div
                                key={idx}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    backgroundColor: "#fff",
                                    padding: "20px",
                                    borderRadius: "10px",
                                    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                                }}
                            >
                                <div style={{ marginBottom: 12 }}>
                                    <strong style={{ fontSize: 16 }}>{entidad.nombre}</strong>
                                    <p style={{ margin: 0, color: "#666" }}>
                                        NIT: {entidad.nit} &nbsp;|&nbsp; Días de Crédito: {entidad.dias_credito}
                                    </p>
                                </div>

                                {/* Mostrar recaudo pendiente si existe */}
                                {recaudoPendiente > 0 && (
                                    <div
                                        style={{
                                            background: "linear-gradient(135deg, #27ae60, #2ecc71)",
                                            padding: "12px 16px",
                                            borderRadius: 10,
                                            marginBottom: 16,
                                            color: "#fff",
                                            fontWeight: "bold",
                                            textAlign: "center",
                                            border: "2px solid #229954",
                                        }}
                                    >
                                        <div>💰 Recaudo Pendiente por Aplicar:</div>
                                        <div style={{ fontSize: "1.2em" }}>
                                            {formatoCOP.format(recaudoPendiente)}
                                        </div>
                                        <div style={{ fontSize: "0.9em", opacity: 0.9 }}>
                                            (Este valor se restará de la cartera)
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                                    {Object.entries(colorEstado).map(([estado, color]) => {
                                        const valorNeto = rangosNetos[estado] || 0;
                                        const valorOriginal = entidad[estado] || 0;
                                        console.log(`🎨 Renderizando ${estado}: valorOriginal=${valorOriginal} → valorNeto=${valorNeto}`);
                                        return (
                                            <div
                                                key={estado}
                                                style={{
                                                    background: color,
                                                    padding: "10px 14px",
                                                    borderRadius: 10,
                                                    minWidth: 150,
                                                    color: "#fff",
                                                    fontWeight: "bold",
                                                    textAlign: "center",
                                                    flex: "1 1 150px",
                                                }}
                                            >
                                                <div>{estado}:</div>
                                                <div>{formatoCOP.format(valorNeto)}</div>
                                            </div>
                                        );
                                    })}
                                    {entidad.Glosas > 0 && (
                                        <div
                                            style={{
                                                background: "#3498db", // Azul profesional para glosas
                                                padding: "10px 14px",
                                                borderRadius: 10,
                                                minWidth: 150,
                                                color: "#fff",
                                                fontWeight: "bold",
                                                textAlign: "center",
                                                flex: "1 1 150px",
                                            }}
                                        >
                                            <div>Glosas:</div>
                                            <div>{formatoCOP.format(entidad.Glosas || 0)}</div>
                                        </div>
                                    )}
                                    
                                    {/* Tarjeta de Total Cartera (ya con recaudo aplicado) */}
                                    <div
                                        style={{
                                            background: "#2c3e50", // Azul oscuro profesional para el total
                                            padding: "10px 14px",
                                            borderRadius: 10,
                                            minWidth: 150,
                                            color: "#fff",
                                            fontWeight: "bold",
                                            textAlign: "center",
                                            flex: "1 1 150px",
                                            border: "2px solid #34495e", // Borde para destacar
                                        }}
                                    >
                                        <div>Total Cartera:</div>
                                        <div>
                                            {formatoCOP.format(
                                                Object.values(rangosNetos).reduce((total, valor) => total + valor, 0)
                                            )}
                                        </div>
                                        {recaudoPendiente > 0 && (
                                            <div style={{ fontSize: "0.8em", opacity: 0.8, marginTop: "4px" }}>
                                                (Neto de recaudo)
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
          
            <EstadoCarteraPorNit />
        </>

    );
};

export default InformeTotalFacturacion;
