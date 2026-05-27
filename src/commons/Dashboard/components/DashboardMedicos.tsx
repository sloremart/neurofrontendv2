import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

import { AppDispatch, RootState } from "../../../store/store.tsx";
import { Title } from "../../../components/Title.tsx";
import { get_medicos, get_citas_medico } from "../store/thunks/DashboardThunks.tsx";
import { Medico, CitaMedico } from "../interfaces/Dashboard.ts";

const DashboardMedicos = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { medicos, citas, estadisticasCitas, loading, error } = useSelector((state: RootState) => state.dashboard);
    
    const [selectedMedico, setSelectedMedico] = useState<string>("");
    const [fechaInicio, setFechaInicio] = useState<dayjs.Dayjs | null>(dayjs());
    const [fechaFin, setFechaFin] = useState<dayjs.Dayjs | null>(dayjs());
    const [estadoFiltro, setEstadoFiltro] = useState<string>("todas");
    const [hasSearched, setHasSearched] = useState<boolean>(false);

    useEffect(() => {
        dispatch(get_medicos());
    }, [dispatch]);

    const handleBuscarCitas = () => {
        if (!selectedMedico) {
            alert("Por favor seleccione un médico");
            return;
        }

        if (!fechaInicio || !fechaFin) {
            alert("Por favor seleccione el rango de fechas");
            return;
        }

        setHasSearched(true);
        dispatch(get_citas_medico(selectedMedico, undefined, fechaInicio.format("YYYY-MM-DD"), fechaFin.format("YYYY-MM-DD"), estadoFiltro));
    };

    const formatearFecha = (fecha: string) => {
        if (!fecha) return "";
        const date = new Date(fecha);
        return date.toLocaleDateString("es-CO", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const formatearSoloFecha = (fecha: string) => {
        if (!fecha) return "";
        const date = new Date(fecha);
        return date.toLocaleDateString("es-CO", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        });
    };


    return (
        <div className="myContainer" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "10px" }}>
            <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>
                👨‍⚕️ Gestión de Citas Médicas
            </h2>

            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "20px", marginTop: "20px", flexWrap: "wrap" }}>
                <FormControl style={{ minWidth: 200 }}>
                    <InputLabel>Médico</InputLabel>
                    <Select
                        value={selectedMedico}
                        onChange={(e) => setSelectedMedico(e.target.value)}
                        label="Médico"
                    >
                        <MenuItem value="">Seleccionar médico</MenuItem>
                        {medicos.map((medico: Medico) => (
                            <MenuItem key={medico.id_usuario} value={medico.cedula_medico}>
                                {medico.nombre_real}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker 
                        label="Fecha Inicio" 
                        value={fechaInicio} 
                        onChange={(newDate) => setFechaInicio(newDate)} 
                    />
                </LocalizationProvider>

                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker 
                        label="Fecha Fin" 
                        value={fechaFin} 
                        onChange={(newDate) => setFechaFin(newDate)} 
                    />
                </LocalizationProvider>

                <FormControl style={{ minWidth: 150 }}>
                    <InputLabel>Estado</InputLabel>
                    <Select
                        value={estadoFiltro}
                        onChange={(e) => setEstadoFiltro(e.target.value)}
                        label="Estado"
                    >
                        <MenuItem value="todas">Todas</MenuItem>
                        <MenuItem value="confirmadas">Confirmadas</MenuItem>
                        <MenuItem value="canceladas">Canceladas</MenuItem>
                        <MenuItem value="pendientes">Pendientes</MenuItem>
                    </Select>
                </FormControl>

                <Button variant="contained" color="primary" onClick={handleBuscarCitas} disabled={loading}>
                    {loading ? "Buscando..." : "Buscar"}
                </Button>
            </div>

            {/* Mostrar contenido cuando se ha buscado */}
            {hasSearched && (
                <div style={{ width: "100%", maxWidth: "1400px" }}>
                    {loading ? (
                        <p>Cargando datos...</p>
                    ) : error ? (
                        <p style={{ color: "red" }}>Error: {error}</p>
                    ) : citas.length === 0 ? (
                        <p>No se encontraron citas para los filtros seleccionados.</p>
                    ) : (
                        <>
                            {/* Estadísticas */}
                            {estadisticasCitas && (
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'center', 
                                    gap: '20px', 
                                    marginBottom: '30px',
                                    flexWrap: 'wrap'
                                }}>
                                    <div style={{ 
                                        backgroundColor: '#dbeafe', 
                                        padding: '20px', 
                                        borderRadius: '12px', 
                                        textAlign: 'center',
                                        minWidth: '150px'
                                    }}>
                                        <h3 style={{ color: '#1e40af', fontSize: '18px', fontWeight: 600 }}>Total</h3>
                                        <p style={{ color: '#1e3a8a', fontSize: '32px', fontWeight: 700, margin: '10px 0' }}>
                                            {estadisticasCitas.total}
                                        </p>
                                    </div>
                                    <div style={{ 
                                        backgroundColor: '#dcfce7', 
                                        padding: '20px', 
                                        borderRadius: '12px', 
                                        textAlign: 'center',
                                        minWidth: '150px'
                                    }}>
                                        <h3 style={{ color: '#15803d', fontSize: '18px', fontWeight: 600 }}>Confirmadas</h3>
                                        <p style={{ color: '#14532d', fontSize: '32px', fontWeight: 700, margin: '10px 0' }}>
                                            {estadisticasCitas.confirmadas}
                                        </p>
                                    </div>
                                    <div style={{ 
                                        backgroundColor: '#fee2e2', 
                                        padding: '20px', 
                                        borderRadius: '12px', 
                                        textAlign: 'center',
                                        minWidth: '150px'
                                    }}>
                                        <h3 style={{ color: '#dc2626', fontSize: '18px', fontWeight: 600 }}>Canceladas</h3>
                                        <p style={{ color: '#7f1d1d', fontSize: '32px', fontWeight: 700, margin: '10px 0' }}>
                                            {estadisticasCitas.canceladas}
                                        </p>
                                    </div>
                                    <div style={{ 
                                        backgroundColor: '#fef3c7', 
                                        padding: '20px', 
                                        borderRadius: '12px', 
                                        textAlign: 'center',
                                        minWidth: '150px'
                                    }}>
                                        <h3 style={{ color: '#d97706', fontSize: '18px', fontWeight: 600 }}>Pendientes</h3>
                                        <p style={{ color: '#92400e', fontSize: '32px', fontWeight: 700, margin: '10px 0' }}>
                                            {estadisticasCitas.pendientes}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Tabla de Citas */}
                            <div style={{ 
                                backgroundColor: '#fff', 
                                padding: '24px', 
                                borderRadius: '12px', 
                                overflowX: 'auto',
                                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                            }}>
                                <Title title="CITAS ENCONTRADAS" />
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Fecha Cita</th>
                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Paciente</th>
                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Documento</th>
                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Entidad</th>
                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Estado</th>
                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Fecha Confirmación</th>
                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Fecha Cancelación</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {citas.map((cita: CitaMedico, index: number) => (
                                            <tr key={cita.id_cita} style={{ 
                                                borderBottom: '1px solid #e2e8f0',
                                                backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc'
                                            }}>
                                                <td style={{ padding: '12px', fontSize: '14px' }}>
                                                    {formatearSoloFecha(cita.fecha_cita)}
                                                </td>
                                                <td style={{ padding: '12px', fontSize: '14px', fontWeight: 500 }}>
                                                    {cita.nombre_paciente}
                                                </td>
                                                <td style={{ padding: '12px', fontSize: '14px' }}>
                                                    {cita.numero_documento_paciente}
                                                </td>
                                                <td style={{ padding: '12px', fontSize: '14px' }}>
                                                    {cita.entidad}
                                                </td>
                                                <td style={{ padding: '12px', fontSize: '14px' }}>
                                                    <span style={{
                                                        padding: '4px 8px',
                                                        borderRadius: '12px',
                                                        fontSize: '12px',
                                                        fontWeight: 600,
                                                        backgroundColor: cita.estado === 'Confirmada' ? '#dcfce7' : 
                                                                       cita.estado === 'Cancelada' ? '#fee2e2' : '#fef3c7',
                                                        color: cita.estado === 'Confirmada' ? '#15803d' : 
                                                               cita.estado === 'Cancelada' ? '#dc2626' : '#d97706'
                                                    }}>
                                                        {cita.estado}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px', fontSize: '14px' }}>
                                                    {cita.fecha_confirmacion ? formatearFecha(cita.fecha_confirmacion) : '-'}
                                                </td>
                                                <td style={{ padding: '12px', fontSize: '14px' }}>
                                                    {cita.fecha_cancelacion ? formatearFecha(cita.fecha_cancelacion) : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Mensaje inicial cuando no se ha buscado */}
            {!hasSearched && (
                <div style={{ 
                    width: "100%", 
                    maxWidth: "600px", 
                    marginTop: "40px",
                    textAlign: "center",
                    padding: "40px 20px",
                    backgroundColor: "#f8fafc",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0"
                }}>
                    <div style={{ fontSize: "48px", marginBottom: "20px" }}>🔍</div>
                    <h3 style={{ fontSize: "20px", fontWeight: 600, color: "#374151", marginBottom: "10px" }}>
                        Buscar Citas Médicas
                    </h3>
                    <p style={{ fontSize: "16px", color: "#6b7280", lineHeight: "1.5" }}>
                        Selecciona un médico, establece el rango de fechas y el estado de las citas que deseas consultar.
                    </p>
                    <p style={{ fontSize: "14px", color: "#9ca3af", marginTop: "10px" }}>
                        Médicos activos disponibles: <strong>{medicos.length}</strong>
                    </p>
                </div>
            )}

            {error && (
                <div style={{ 
                    marginTop: '20px', 
                    padding: '16px', 
                    backgroundColor: '#fee2e2', 
                    border: '1px solid #fecaca', 
                    borderRadius: '8px',
                    maxWidth: '600px'
                }}>
                    <p style={{ color: '#dc2626', fontWeight: 500 }}>{error}</p>
                </div>
            )}
        </div>
    );
};

export default DashboardMedicos;
