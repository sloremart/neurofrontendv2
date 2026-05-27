import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Button, TextField, Grid, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from "@mui/material";
import { fetch_cartera_por_nit } from "../store/thunks/AuditoriaDashboardthunks.tsx";

const formatoCOP = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
});

const EstadoCarteraPorNit = () => {
    const dispatch = useDispatch();
    const [nit, setNit] = useState("");
    const [anio, setAnio] = useState(new Date().getFullYear().toString());
    const [mes, setMes] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
    const [carteraData, setCarteraData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const cargarDatos = async () => {
        if (!nit.trim()) {
            alert("Por favor ingrese un NIT válido");
            return;
        }
        
        setLoading(true);
        try {
            const resultado = await dispatch(fetch_cartera_por_nit(nit, parseInt(anio), parseInt(mes)));
            setCarteraData(resultado);
        } catch (error) {
            console.error("Error al cargar datos:", error);
        } finally {
            setLoading(false);
        }
    };

    const getColorChip = (tipodoc: number, valor: number, descripcion?: string, tieneGlosasPendientes?: boolean) => {
        const colors = {
            2: "#1e40af",      // Factura - Azul profesional
            29: "#059669",     // Radicación de Cuenta - Verde esmeralda
            32: "#7c3aed",     // Abono Cartera - Púrpura elegante
            23: "#ea580c",     // Glosa - Naranja vibrante (por defecto)
            24: "#0891b2"      // Otros Abonos - Azul turquesa
        };
        
        // Si es tipodoc 23, verificar si es anulación o glosa
        if (tipodoc === 23 && descripcion) {
            if (descripcion.toLowerCase().includes('anulación') || descripcion.toLowerCase().includes('anulacion')) {
                colors[23] = "#be185d"; // Rosa para anulaciones
            } else if (descripcion.toLowerCase().includes('glosa')) {
                // Para glosas, usar color según estado
                if (tieneGlosasPendientes !== undefined) {
                    colors[23] = tieneGlosasPendientes ? "#dc2626" : "#059669"; // Rojo si pendiente, verde si resuelta
                }
            }
        }
        
        // Solo mostrar el valor, sin texto descriptivo
        let label = formatoCOP.format(valor);
        
        // Solo agregar estado para glosas (Pendiente/Resuelta)
        if (tipodoc === 23 && descripcion && descripcion.toLowerCase().includes('glosa') && tieneGlosasPendientes !== undefined) {
            const estado = tieneGlosasPendientes ? " (Pendiente)" : " (Resuelta)";
            label += estado;
        }
        
        return (
            <Chip
                label={label}
                style={{ 
                    backgroundColor: colors[tipodoc] || "#475569",
                    color: "white",
                    margin: "0px",
                    fontSize: "0.75rem",
                    height: "24px",
                    minWidth: "fit-content"
                }}
                size="small"
                variant="filled"
            />
        );
    };

    return (
        <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
                Estado de Cartera por NIT
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
                Visualiza el estado de cartera de un NIT específico con todos sus movimientos
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={3}>
                    <TextField
                        fullWidth
                        label="NIT"
                        value={nit}
                        onChange={(e) => setNit(e.target.value)}
                        placeholder="Ej: 900992393"
                    />
                </Grid>
                <Grid item xs={12} sm={3}>
                    <TextField
                        fullWidth
                        label="Año"
                        value={anio}
                        onChange={(e) => setAnio(e.target.value)}
                        type="number"
                    />
                </Grid>
                <Grid item xs={12} sm={3}>
                    <TextField
                        fullWidth
                        label="Mes"
                        value={mes}
                        onChange={(e) => setMes(e.target.value)}
                        type="number"
                        inputProps={{ min: 1, max: 12 }}
                    />
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={cargarDatos}
                        disabled={loading || !nit.trim()}
                    >
                        {loading ? "Cargando..." : "Cargar Datos"}
                    </Button>
                </Grid>
            </Grid>

            {carteraData && (
                <>
                    <Typography variant="h6" gutterBottom>
                        Resumen de Cartera - {carteraData.nombre_entidad || 'Entidad'} (NIT: {carteraData.nit})
                    </Typography>
                    
                    {/* Información principal en filas individuales */}
                    <Paper sx={{ p: 2, mb: 2, bgcolor: '#f8fafc' }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={3}>
                                <div style={{ textAlign: 'center', padding: '12px', borderRadius: '8px', backgroundColor: '#1e40af', color: 'white' }}>
                                    <Typography variant="h6" style={{ fontSize: '0.9rem', marginBottom: '4px' }}>
                                        Total Facturado
                                    </Typography>
                                    <Typography variant="h5" style={{ fontWeight: 'bold' }}>
                                        {formatoCOP.format(carteraData.total_facturado)}
                                    </Typography>
                                    <Typography variant="caption" style={{ opacity: 0.9 }}>
                                        Valor total de facturas emitidas
                                    </Typography>
                                </div>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <div style={{ textAlign: 'center', padding: '12px', borderRadius: '8px', backgroundColor: '#059669', color: 'white' }}>
                                    <Typography variant="h6" style={{ fontSize: '0.9rem', marginBottom: '4px' }}>
                                        Total Radicado
                                    </Typography>
                                    <Typography variant="h5" style={{ fontWeight: 'bold' }}>
                                        {formatoCOP.format(carteraData.total_radicado)}
                                    </Typography>
                                    <Typography variant="caption" style={{ opacity: 0.9 }}>
                                        Facturas enviadas a entidades
                                    </Typography>
                                </div>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <div style={{ textAlign: 'center', padding: '12px', borderRadius: '8px', backgroundColor: '#7c3aed', color: 'white' }}>
                                    <Typography variant="h6" style={{ fontSize: '0.9rem', marginBottom: '4px' }}>
                                        Total Abonado
                                    </Typography>
                                    <Typography variant="h5" style={{ fontWeight: 'bold' }}>
                                        {formatoCOP.format(carteraData.total_abonado)}
                                    </Typography>
                                    <Typography variant="caption" style={{ opacity: 0.9 }}>
                                        Pagos recibidos por entidades
                                    </Typography>
                                </div>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <div style={{ textAlign: 'center', padding: '12px', borderRadius: '8px', backgroundColor: '#dc2626', color: 'white' }}>
                                    <Typography variant="h6" style={{ fontSize: '0.9rem', marginBottom: '4px' }}>
                                        Saldo Pendiente
                                    </Typography>
                                    <Typography variant="h5" style={{ fontWeight: 'bold' }}>
                                        {formatoCOP.format(carteraData.total_saldo_pendiente)}
                                    </Typography>
                                    <Typography variant="caption" style={{ opacity: 0.9 }}>
                                        Monto por cobrar
                                    </Typography>
                                </div>
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Información secundaria en filas individuales */}
                    <Paper sx={{ p: 2, mb: 2, bgcolor: '#f8fafc' }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={3}>
                                <div style={{ textAlign: 'center', padding: '12px', borderRadius: '8px', backgroundColor: '#ea580c', color: 'white' }}>
                                    <Typography variant="h6" style={{ fontSize: '0.9rem', marginBottom: '4px' }}>
                                        Total Glosas
                                    </Typography>
                                    <Typography variant="h5" style={{ fontWeight: 'bold' }}>
                                        {formatoCOP.format(carteraData.total_glosas)}
                                    </Typography>
                                    <Typography variant="caption" style={{ opacity: 0.9 }}>
                                        Objeciones de entidades
                                    </Typography>
                                </div>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <div style={{ textAlign: 'center', padding: '12px', borderRadius: '8px', backgroundColor: '#be185d', color: 'white' }}>
                                    <Typography variant="h6" style={{ fontSize: '0.9rem', marginBottom: '4px' }}>
                                        Total Anulaciones
                                    </Typography>
                                    <Typography variant="h5" style={{ fontWeight: 'bold' }}>
                                        {formatoCOP.format(carteraData.total_anulaciones || 0)}
                                    </Typography>
                                    <Typography variant="caption" style={{ opacity: 0.9 }}>
                                        Facturas anuladas
                                    </Typography>
                                </div>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <div style={{ textAlign: 'center', padding: '12px', borderRadius: '8px', backgroundColor: '#0891b2', color: 'white' }}>
                                    <Typography variant="h6" style={{ fontSize: '0.9rem', marginBottom: '4px' }}>
                                        Cantidad Facturas
                                    </Typography>
                                    <Typography variant="h5" style={{ fontWeight: 'bold' }}>
                                        {carteraData.cantidad_facturas}
                                    </Typography>
                                    <Typography variant="caption" style={{ opacity: 0.9 }}>
                                        Total de facturas procesadas
                                    </Typography>
                                </div>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <div style={{ textAlign: 'center', padding: '12px', borderRadius: '8px', backgroundColor: '#475569', color: 'white' }}>
                                    <Typography variant="h6" style={{ fontSize: '0.9rem', marginBottom: '4px' }}>
                                        Estado General
                                    </Typography>
                                    <Typography variant="h6" style={{ fontWeight: 'bold' }}>
                                        {carteraData.total_saldo_pendiente > 0 ? 'Con Saldo Pendiente' : 'Al Día'}
                                    </Typography>
                                    <Typography variant="caption" style={{ opacity: 0.9 }}>
                                        Estado de la cartera
                                    </Typography>
                                </div>
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Estado de Glosas en filas individuales */}
                    <Paper sx={{ p: 2, mb: 3, bgcolor: '#f8fafc' }}>
                        <Typography variant="h6" gutterBottom style={{ marginBottom: '16px', color: '#374151' }}>
                            Estado de Glosas
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                                <div style={{ textAlign: 'center', padding: '12px', borderRadius: '8px', backgroundColor: '#dc2626', color: 'white' }}>
                                    <Typography variant="h6" style={{ fontSize: '0.9rem', marginBottom: '4px' }}>
                                        Glosas Pendientes
                                    </Typography>
                                    <Typography variant="h5" style={{ fontWeight: 'bold' }}>
                                        {formatoCOP.format(carteraData.total_glosas_pendientes || 0)}
                                    </Typography>
                                    <Typography variant="caption" style={{ opacity: 0.9 }}>
                                        Sin Nota de Cartera
                                    </Typography>
                                </div>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <div style={{ textAlign: 'center', padding: '12px', borderRadius: '8px', backgroundColor: '#059669', color: 'white' }}>
                                    <Typography variant="h6" style={{ fontSize: '0.9rem', marginBottom: '4px' }}>
                                        Glosas Resueltas
                                    </Typography>
                                    <Typography variant="h5" style={{ fontWeight: 'bold' }}>
                                        {formatoCOP.format(carteraData.total_glosas_resueltas || 0)}
                                    </Typography>
                                    <Typography variant="caption" style={{ opacity: 0.9 }}>
                                        Con Nota de Cartera
                                    </Typography>
                                </div>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <div style={{ textAlign: 'center', padding: '12px', borderRadius: '8px', backgroundColor: '#7c3aed', color: 'white' }}>
                                    <Typography variant="h6" style={{ fontSize: '0.9rem', marginBottom: '4px' }}>
                                        Total Glosas
                                    </Typography>
                                    <Typography variant="h5" style={{ fontWeight: 'bold' }}>
                                        {formatoCOP.format(carteraData.total_glosas)}
                                    </Typography>
                                    <Typography variant="caption" style={{ opacity: 0.9 }}>
                                        Pendientes + Resueltas
                                    </Typography>
                                </div>
                            </Grid>
                        </Grid>
                    </Paper>

                    <Typography variant="h6" gutterBottom>
                        Detalle de Facturas
                    </Typography>
                    
                                         <TableContainer sx={{ maxHeight: '600px' }}>
                         <Table sx={{ minWidth: 900 }} stickyHeader>
                             <TableHead sx={{ position: 'sticky', top: 0, backgroundColor: '#f5f5f5', zIndex: 1 }}>
                                 <TableRow>
                                     <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Factura</TableCell>
                                     <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Prefijo</TableCell>
                                     <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Admisión</TableCell>
                                     {/* <TableCell>Paciente</TableCell> */}
                                     <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', minWidth: '120px' }}>Fecha Envío</TableCell>
                                     <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Facturado</TableCell>
                                     <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Radicado</TableCell>
                                     <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Abonado</TableCell>
                                     <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Glosas</TableCell>
                                     <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Anulaciones</TableCell>
                                     <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Saldo Pendiente</TableCell>
                                     <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Estado Glosas</TableCell>
                                 </TableRow>
                             </TableHead>
                            <TableBody>
                                {carteraData.facturas.map((factura: any, index: number) => (
                                    <TableRow key={index}>
                                        <TableCell>{factura.factura}</TableCell>
                                        <TableCell>{factura.prefijo}</TableCell>
                                        <TableCell>{factura.admision_no}</TableCell>
                                        {/* <TableCell sx={{ fontSize: '0.8rem', maxWidth: '150px' }}>
                                            {factura.nombre_responsable || 'Sin nombre'}
                                        </TableCell> */}
                                        <TableCell>{factura.fecha_envio || 'No enviada'}</TableCell>
                                        <TableCell>
                                            {factura.valor_facturado > 0 ? 
                                                getColorChip(2, factura.valor_facturado, "Factura") :
                                                <span style={{ color: '#f44336', fontStyle: 'italic' }}>Sin valor</span>
                                            }
                                        </TableCell>
                                        <TableCell>
                                            {factura.valor_radicado > 0 ? 
                                                getColorChip(29, factura.valor_radicado, "Radicación de Cuenta") :
                                                <span style={{ color: '#ff9800', fontStyle: 'italic' }}>No radicada</span>
                                            }
                                        </TableCell>
                                        <TableCell>
                                            {factura.valor_abonado > 0 ? 
                                                getColorChip(32, factura.valor_abonado, "Abono Cartera") :
                                                <span style={{ color: '#6b7280' }}>$0</span>
                                            }
                                        </TableCell>
                                        <TableCell>
                                            {factura.glosas > 0 ? 
                                                getColorChip(23, factura.glosas, "Glosa", factura.tiene_glosas_pendientes) :
                                                <span style={{ color: '#6b7280' }}>$0</span>
                                            }
                                        </TableCell>
                                        <TableCell>
                                            {factura.anulaciones > 0 ? 
                                                getColorChip(23, factura.anulaciones, "Anulación de Factura") :
                                                <span style={{ color: '#6b7280' }}>$0</span>
                                            }
                                        </TableCell>
                                        <TableCell style={{ 
                                            color: factura.saldo_actual > 0 ? '#f44336' : '#4caf50',
                                            fontWeight: factura.saldo_actual > 0 ? 'bold' : 'normal'
                                        }}>
                                            {factura.saldo_actual > 0 ? 
                                                formatoCOP.format(factura.saldo_actual) : 
                                                <span style={{ color: '#4caf50', fontStyle: 'italic' }}>Saldada</span>
                                            }
                                        </TableCell>
                                        <TableCell>
                                            {factura.glosas > 0 ? (
                                                <Chip
                                                    label={factura.tiene_glosas_pendientes ? "Pendiente" : "Resuelta"}
                                                    style={{
                                                        backgroundColor: factura.tiene_glosas_pendientes ? '#dc2626' : '#059669',
                                                        color: 'white',
                                                        fontSize: '0.75rem',
                                                        height: '24px'
                                                    }}
                                                    size="small"
                                                    variant="filled"
                                                />
                                            ) : (
                                                <span style={{ color: '#6b7280' }}>Sin Glosas</span>
                                            )}
                                        </TableCell>

                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}
        </Paper>
    );
};

export default EstadoCarteraPorNit;