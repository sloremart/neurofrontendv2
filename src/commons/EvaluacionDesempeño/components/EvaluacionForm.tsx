import React, { useEffect, useState, useCallback } from 'react';
import {
    Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl,
    InputLabel, MenuItem, Select, Typography, TextField, Alert, Chip, Tabs, Tab,
    Card, CardContent, Grid, Snackbar
} from '@mui/material';
import { Add, Edit, Delete, Person, Group, Assessment } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { createEvaluacion, deleteEvaluacion, getComponentes, getEvaluaciones, getUsuariosConPerfil, updateEvaluacion, getAreas } from '../store/thunks/ThunksEvaluacionDesempeño.tsx';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`evaluation-tabpanel-${index}`}
      aria-labelledby={`evaluation-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function EvaluacionForm() {
    const dispatch = useDispatch();
    
    // Estado local
    const [evaluaciones, setEvaluaciones] = useState<any[]>([]);
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [componentes, setComponentes] = useState<any[]>([]);
    const [areas, setAreas] = useState<any[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');

    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [tabValue, setTabValue] = useState(0);
    const [areasExpandidas, setAreasExpandidas] = useState<Set<string>>(new Set());
    
    // Estado para evaluación con selects dinámicos
    const [form, setForm] = useState({
        usuario_evaluado: '',
        evaluador: '', // Mantener para compatibilidad con evaluación masiva
        tipo: '',
        componente: '',
        area_grupo: '',
        fecha_limite: '',
        // NUEVOS CAMPOS PARA SELECTS DINÁMICOS
        lider: '',           // 1 líder seleccionado
        subordinado: '',     // 1 subordinado (solo para 360°)
        pares: [] as number[], // Array de pares seleccionados
        parSeleccionado: ''  // Par elegido aleatoriamente
    });
    const [errors, setErrors] = useState<{[key: string]: string}>({});

    // Funciones de carga de datos
    const fetchEvaluaciones = useCallback(async () => {
        try {
            const response = await dispatch(getEvaluaciones() as any);
            if (response) {
                setEvaluaciones(response);
            }
        } catch (error) {
            console.error('Error cargando evaluaciones:', error);
        }
    }, [dispatch]);

    const fetchUsuarios = useCallback(async () => {
        try {
            const response = await dispatch(getUsuariosConPerfil() as any);
            if (response) {
                setUsuarios(response);
            }
        } catch (error) {
            console.error('Error cargando usuarios:', error);
        }
    }, [dispatch]);

    const fetchComponentes = useCallback(async () => {
        try {
            const response = await dispatch(getComponentes() as any);
            if (response) {
                setComponentes(response);
            }
        } catch (error) {
            console.error('Error cargando componentes:', error);
        }
    }, [dispatch]);

    const fetchAreas = useCallback(async () => {
        try {
            const response = await dispatch(getAreas() as any);
            if (response) {
                setAreas(response);
            }
        } catch (error) {
            console.error('Error cargando áreas:', error);
        }
    }, [dispatch]);

    // Carga inicial
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                await Promise.all([
                    fetchEvaluaciones(),
                    fetchUsuarios(),
                    fetchComponentes(),
                    fetchAreas()
                ]);
            } catch (error) {
                console.error('Error al cargar datos:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [fetchEvaluaciones, fetchUsuarios, fetchComponentes, fetchAreas]);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        
        // Limpiar errores cuando el usuario empiece a escribir
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Función para manejar selección de pares
    const handleParesChange = (e: any) => {
        const { value } = e.target;
        setForm(prev => ({ ...prev, pares: value }));
        
        // Si hay pares seleccionados, elegir uno aleatoriamente
        if (value.length > 0) {
            const parAleatorio = value[Math.floor(Math.random() * value.length)];
            setForm(prev => ({ ...prev, parSeleccionado: parAleatorio }));
        } else {
            setForm(prev => ({ ...prev, parSeleccionado: '' }));
        }
    };

    // Función para obtener usuarios por rol
    const obtenerUsuariosPorRol = (rol: string, usuarioEvaluado: any) => {
        if (!usuarioEvaluado || !usuarios.length) return [];
        
        const usuario = usuarios.find(u => u.id === parseInt(usuarioEvaluado));
        if (!usuario) return [];
        
        switch (rol) {
            case 'lider':
                // Buscar líderes del área del usuario
                return usuarios.filter(u => 
                    u.perfil?.es_lider && 
                    u.perfil?.area?.id === usuario.perfil?.area?.id &&
                    u.id !== usuario.id
                );
            case 'subordinado':
                // Mostrar los mismos usuarios que pares (compañeros del mismo nivel)
                return usuarios.filter(u => 
                    !u.perfil?.es_lider && 
                    u.perfil?.area?.id === usuario.perfil?.area?.id &&
                    u.id !== usuario.id &&
                    u.id !== usuario.perfil?.lider_id
                );
            case 'pares':
                // Compañeros del mismo nivel (no líderes, no subordinados)
                return usuarios.filter(u => 
                    !u.perfil?.es_lider && 
                    u.perfil?.area?.id === usuario.perfil?.area?.id &&
                    u.id !== usuario.id &&
                    u.id !== usuario.perfil?.lider_id
                );
            default:
                return [];
        }
    };

    const validateForm = () => {
        const newErrors: {[key: string]: string} = {};
        
        if (!form.tipo) newErrors.tipo = 'Debe seleccionar un tipo de evaluación';
        if (!form.componente) newErrors.componente = 'Debe seleccionar un componente';
        
        if (tabValue === 0) { // Evaluación individual
            if (!form.usuario_evaluado) newErrors.usuario_evaluado = 'Debe seleccionar un usuario evaluado';
            if (!form.lider) newErrors.lider = 'Debe seleccionar un líder';
            
            // VALIDACIONES ESPECÍFICAS POR TIPO DE EVALUACIÓN
            if (form.tipo === '360') {
                if (!form.subordinado) newErrors.subordinado = 'Debe seleccionar un subordinado para evaluación 360°';
                if (!form.pares || form.pares.length === 0) newErrors.pares = 'Debe seleccionar al menos un par para evaluación 360°';
            }
            
            if (form.tipo === '180') {
                if (!form.pares || form.pares.length === 0) newErrors.pares = 'Debe seleccionar al menos un par para evaluación 180°';
            }
            
            // Para 90° solo se requiere líder (ya validado arriba)
        } else { // Evaluación masiva
            if (!form.area_grupo) newErrors.area_grupo = 'Debe seleccionar un área';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSnackbarOpen = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    };

    // handleSubmit para crear múltiples evaluaciones basadas en el tipo
    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            setLoading(true);
            
            const usuarioEvaluadoId = tabValue === 0 ? parseInt(form.usuario_evaluado) : null;

            if (editId) {
                // EDICIÓN: Solo actualizar la evaluación existente
                const evaluacionPayload = {
                    tipo: form.tipo,
                    componente: form.componente,
                    evaluador: parseInt(form.lider), // Usar líder como evaluador principal
                    usuario_evaluado: usuarioEvaluadoId,
                    area_grupo: form.area_grupo.toString(),
                    fecha_limite: form.fecha_limite || null
                };

                await dispatch(updateEvaluacion(editId, evaluacionPayload) as any);
                
                handleSnackbarOpen('Evaluación actualizada exitosamente', 'success');
                handleClose();
                
                await fetchEvaluaciones();
                return;
            } else {
                // CREACIÓN: Crear múltiples evaluaciones según el tipo
                const evaluacionesACrear: Array<{
                    tipo: string;
                    componente: string;
                    evaluador: number;
                    usuario_evaluado: number | null;
                    area_grupo: string;
                    fecha_limite: string | null;
                }> = [];
                
                // EVALUACIÓN 1: Líder (siempre presente)
                if (form.lider) {
                    evaluacionesACrear.push({
                        tipo: form.tipo,
                        componente: form.componente,
                        evaluador: parseInt(form.lider),
                        usuario_evaluado: usuarioEvaluadoId,
                        area_grupo: form.area_grupo.toString(),
                        fecha_limite: form.fecha_limite || null
                    });
                }
                
                // EVALUACIÓN 2: Subordinado (solo para 360°)
                if (form.tipo === '360' && form.subordinado) {
                    evaluacionesACrear.push({
                        tipo: form.tipo,
                        componente: form.componente,
                        evaluador: parseInt(form.subordinado),
                        usuario_evaluado: usuarioEvaluadoId,
                        area_grupo: form.area_grupo.toString(),
                        fecha_limite: form.fecha_limite || null
                    });
                }
                
                // EVALUACIÓN 3: Par seleccionado aleatoriamente (para 360° y 180°)
                if ((form.tipo === '360' || form.tipo === '180') && form.parSeleccionado) {
                    evaluacionesACrear.push({
                        tipo: form.tipo,
                        componente: form.componente,
                        evaluador: parseInt(form.parSeleccionado),
                        usuario_evaluado: usuarioEvaluadoId,
                        area_grupo: form.area_grupo.toString(),
                        fecha_limite: form.fecha_limite || null
                    });
                }
                
                // CREAR TODAS LAS EVALUACIONES Y SUS ASIGNACIONES
                for (let i = 0; i < evaluacionesACrear.length; i++) {
                    const evaluacionPayload = evaluacionesACrear[i];
                    try {
                        const resultado = await dispatch(createEvaluacion(evaluacionPayload) as any);
                        
                        // CREAR ASIGNACIÓN AUTOMÁTICAMENTE
                        if (resultado && resultado.id) {
                            try {
                                // Crear asignación de evaluación
                                const asignacionPayload = {
                                    evaluacion: resultado.id,
                                    evaluador: evaluacionPayload.evaluador,
                                    usuario_evaluado: evaluacionPayload.usuario_evaluado,
                                    completada: false
                                };
                                
                                // Llamar directamente a la API para crear la asignación
                                const response = await fetch(`http://localhost:8000/evaluaciondesempeno/asignaciones/`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify(asignacionPayload)
                                });
                                
                                if (!response.ok) {
                                    console.warn(`No se pudo crear la asignación para evaluación ${resultado.id}`);
                                }
                                
                            } catch (errorAsignacion) {
                                console.error(`Error creando asignación para evaluación ${resultado.id}:`, errorAsignacion);
                                // No lanzar error aquí, solo log para no interrumpir el proceso
                            }
                        }
                        
                    } catch (error) {
                        console.error(`Error creando evaluación ${i + 1}:`, evaluacionPayload, error);
                        throw error; // Re-lanzar para manejar en el catch principal
                    }
                }
                
                const mensaje = `${evaluacionesACrear.length} evaluación${evaluacionesACrear.length !== 1 ? 'es' : ''} creada${evaluacionesACrear.length !== 1 ? 's' : ''} exitosamente`;
                handleSnackbarOpen(mensaje, 'success');
                
                // NO cerrar el modal - mantenerlo abierto
                // handleClose();
                
                // SINCRONIZACIÓN
                await fetchEvaluaciones();
                return;
            }
            
        } catch (error: any) {
            console.error('Error en handleSubmit:', error);
            handleSnackbarOpen('Error al guardar la evaluación', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (evaluacion: any) => {
        setForm({
            usuario_evaluado: evaluacion.usuario_evaluado || '',
            evaluador: evaluacion.evaluador || '', // Mantener para compatibilidad
            tipo: evaluacion.tipo,
            componente: evaluacion.componente,
            area_grupo: evaluacion.area_grupo || '',
            fecha_limite: evaluacion.fecha_limite || '',
            // ✅ NUEVOS CAMPOS
            lider: evaluacion.evaluador || '', // Usar evaluador como líder
            subordinado: '', // No tenemos subordinado en evaluaciones existentes
            pares: [], // No tenemos pares en evaluaciones existentes
            parSeleccionado: '' // No tenemos par seleccionado en evaluaciones existentes
        });
        setEditId(evaluacion.id);
        setOpen(true);
    };

    // handleDelete con sincronización
    const handleDelete = async (id: number) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta evaluación?')) {
            try {
                setLoading(true);
                
                await dispatch(deleteEvaluacion(id) as any);
                
                // SINCRONIZACIÓN: Recargar datos inmediatamente
                await fetchEvaluaciones();
                
                handleSnackbarOpen('Evaluación eliminada exitosamente', 'success');
                
            } catch (error) {
                console.error('Error al eliminar evaluación:', error);
                handleSnackbarOpen('Error al eliminar la evaluación', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleClose = () => {
        setOpen(false);
        setForm({
            usuario_evaluado: '',
            evaluador: '',
            tipo: '',
            componente: '',
            area_grupo: '',
            fecha_limite: '',
            // NUEVOS CAMPOS
            lider: '',
            subordinado: '',
            pares: [],
            parSeleccionado: ''
        });
        setEditId(null);
        setTabValue(0);
        setErrors({});
    };

    const getEvaluacionStats = () => {
        const total = evaluaciones.length;
        const completadas = evaluaciones.filter((e: any) => e.completada).length;
        const pendientes = total - completadas;
        const tipo360 = evaluaciones.filter((e: any) => e.tipo === '360').length;
        const tipo180 = evaluaciones.filter((e: any) => e.tipo === '180').length;
        const tipo90 = evaluaciones.filter((e: any) => e.tipo === '90').length;
        
        return { total, completadas, pendientes, tipo360, tipo180, tipo90 };
    };

    const stats = getEvaluacionStats();

    const toggleAreaExpandida = (areaNombre: string) => {
        setAreasExpandidas(prev => {
            const nuevo = new Set(prev);
            if (nuevo.has(areaNombre)) {
                nuevo.delete(areaNombre);
            } else {
                nuevo.add(areaNombre);
            }
            return nuevo;
        });
    };


    return (
        <Box>

            {/* Mostrar indicador de carga */}
            {loading && (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h6" color="primary">
                        Cargando datos...
                    </Typography>
                </Box>
            )}

            {/* Mostrar mensaje si no hay evaluaciones */}
            {!loading && (!evaluaciones || evaluaciones.length === 0) && (
                <Box sx={{ p: 3, textAlign: 'center', backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="h6" color="textSecondary">
                        No hay evaluaciones registradas
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Crea tu primera evaluación usando el botón "Nueva Evaluación"
                    </Typography>
                </Box>
            )}

            <Box
                sx={{ width: '100%', height: '200px', position: 'relative', overflow: 'hidden', borderRadius: '8px', mb: 3 }}>
                <Box
                    component="img"
                    src="rh.jpg"
                    alt="Encabezado"
                    sx={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3, zIndex: 0 }}
                />
                <Box
                    sx={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="h6" sx={{ backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', p: '6px 16px', borderRadius: '8px', fontWeight: 'bold' }}>
                        ADMINISTRAR EVALUACIONES
                    </Typography>
                </Box>
            </Box>

            {/* Estadísticas */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={2}>
                    <Card sx={{ textAlign: 'center', backgroundColor: '#e3f2fd' }}>
                        <CardContent>
                            <Typography variant="h6" color="primary">
                                {stats.total}
                            </Typography>
                            <Typography variant="body2">Total</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <Card sx={{ textAlign: 'center', backgroundColor: '#e8f5e9' }}>
                        <CardContent>
                            <Typography variant="h6" color="success.main">
                                {stats.completadas}
                            </Typography>
                            <Typography variant="body2">Completadas</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <Card sx={{ textAlign: 'center', backgroundColor: '#fff3e0' }}>
                        <CardContent>
                            <Typography variant="h6" color="warning.main">
                                {stats.pendientes}
                            </Typography>
                            <Typography variant="body2">Pendientes</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <Card sx={{ textAlign: 'center', backgroundColor: '#f3e5f5' }}>
                        <CardContent>
                            <Typography variant="h6" color="secondary">
                                {stats.tipo360}
                            </Typography>
                            <Typography variant="body2">360°</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <Card sx={{ textAlign: 'center', backgroundColor: '#e0f2f1' }}>
                        <CardContent>
                            <Typography variant="h6" color="info.main">
                                {stats.tipo180}
                            </Typography>
                            <Typography variant="body2">180°</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <Card sx={{ textAlign: 'center', backgroundColor: '#fce4ec' }}>
                        <CardContent>
                            <Typography variant="h6" color="error">
                                {stats.tipo90}
                            </Typography>
                            <Typography variant="body2">90°</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Button
                variant="contained"
                startIcon={<Add />}
                sx={{ 
                    mb: 2, 
                    backgroundColor: '#87CEEB', 
                    color: '#fff',
                    '&:hover': {
                        backgroundColor: '#5F9EA0'
                    }
                }}
                onClick={() => setOpen(true)}
            >
                Nueva Evaluación
            </Button>

            <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
                <DialogTitle>
                    {editId ? 'Editar Evaluación' : 'Nueva Evaluación'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                            <Tab 
                                icon={<Person />} 
                                label="Individual" 
                                iconPosition="start"
                            />
                            <Tab 
                                icon={<Group />} 
                                label="Masiva (por Área)" 
                                iconPosition="start"
                            />
                        </Tabs>
                    </Box>

                    <TabPanel value={tabValue} index={0}>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            <Typography variant="body2">
                                <strong>Evaluación Individual:</strong> Seleccione el tipo de evaluación y los evaluadores correspondientes.
                            </Typography>
                        </Alert>

                        <Grid container spacing={2}>
                            {/* Usuario Evaluado */}
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth margin="dense" error={!!errors.usuario_evaluado}>
                                    <InputLabel>Usuario Evaluado *</InputLabel>
                                    <Select
                                        name="usuario_evaluado"
                                        value={form.usuario_evaluado}
                                        onChange={handleChange}
                                        label="Usuario Evaluado *"
                                    >
                                        {usuarios.map((u) => (
                                            <MenuItem key={u.id} value={u.id}>
                                                {u.first_name} {u.last_name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.usuario_evaluado && (
                                        <Typography variant="caption" color="error">{errors.usuario_evaluado}</Typography>
                                    )}
                                </FormControl>
                            </Grid>

                            {/* Tipo de Evaluación */}
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth margin="dense" error={!!errors.tipo}>
                                    <InputLabel>Tipo de Evaluación *</InputLabel>
                                    <Select 
                                        name="tipo" 
                                        value={form.tipo} 
                                        onChange={handleChange} 
                                        label="Tipo de Evaluación *"
                                    >
                                        <MenuItem value="360">
                                            <Chip label="360°" size="small" color="secondary" sx={{ mr: 1 }} />
                                            360 Grados (Líder + Subordinado + Pares)
                                        </MenuItem>
                                        <MenuItem value="180">
                                            <Chip label="180°" size="small" color="info" sx={{ mr: 1 }} />
                                            180 Grados (Líder + Pares)
                                        </MenuItem>
                                        <MenuItem value="90">
                                            <Chip label="90°" size="small" color="error" sx={{ mr: 1 }} />
                                            90 Grados (Solo Líder)
                                        </MenuItem>
                                    </Select>
                                    {errors.tipo && (
                                        <Typography variant="caption" color="error">{errors.tipo}</Typography>
                                    )}
                                </FormControl>
                            </Grid>
                        </Grid>

                        {/* ✅ SELECTS DINÁMICOS BASADOS EN TIPO DE EVALUACIÓN */}
                        {form.tipo && form.usuario_evaluado && (
                            <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                                <Typography variant="h6" sx={{ mb: 2, color: '#333' }}>
                                    🔍 Selección de Evaluadores
                                </Typography>
                                
                                <Grid container spacing={2}>
                                    {/* Líder - Siempre visible para todos los tipos */}
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth margin="dense" error={!!errors.lider}>
                                            <InputLabel>Líder *</InputLabel>
                                            <Select
                                                name="lider"
                                                value={form.lider}
                                                onChange={handleChange}
                                                label="Líder *"
                                            >
                                                {obtenerUsuariosPorRol('lider', form.usuario_evaluado).map((u) => (
                                                <MenuItem key={u.id} value={u.id}>
                                                        {u.first_name} {u.last_name} - Líder
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                            {errors.lider && (
                                                <Typography variant="caption" color="error">{errors.lider}</Typography>
                                            )}
                                        </FormControl>
                                    </Grid>

                                    {/* Subordinado - Solo para 360° */}
                                    {form.tipo === '360' && (
                                        <Grid item xs={12} md={6}>
                                            <FormControl fullWidth margin="dense" error={!!errors.subordinado}>
                                                <InputLabel>Subordinado *</InputLabel>
                                                <Select
                                                    name="subordinado"
                                                    value={form.subordinado}
                                                    onChange={handleChange}
                                                    label="Subordinado *"
                                                >
                                                    {obtenerUsuariosPorRol('subordinado', form.usuario_evaluado).map((u) => (
                                                        <MenuItem key={u.id} value={u.id}>
                                                            {u.first_name} {u.last_name} - Subordinado
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                                {errors.subordinado && (
                                                    <Typography variant="caption" color="error">{errors.subordinado}</Typography>
                                                )}
                                            </FormControl>
                                        </Grid>
                                    )}

                                    {/* Pares - Para 360° y 180° */}
                                    {(form.tipo === '360' || form.tipo === '180') && (
                                        <Grid item xs={12}>
                                            <FormControl fullWidth margin="dense" error={!!errors.pares}>
                                                <InputLabel>Pares (Selección Múltiple) *</InputLabel>
                                                <Select
                                                    multiple
                                                    name="pares"
                                                    value={form.pares}
                                                    onChange={handleParesChange}
                                                    label="Pares (Selección Múltiple) *"
                                                    renderValue={(selected) => (
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                            {selected.map((value) => {
                                                                const usuario = usuarios.find(u => u.id === value);
                                                                return (
                                                                    <Chip 
                                                                        key={value} 
                                                                        label={usuario ? `${usuario.first_name} ${usuario.last_name}` : value} 
                                                                        size="small" 
                                                                    />
                                                                );
                                                            })}
                                                        </Box>
                                                    )}
                                                >
                                                    {obtenerUsuariosPorRol('pares', form.usuario_evaluado).map((u) => (
                                                        <MenuItem key={u.id} value={u.id}>
                                                            {u.first_name} {u.last_name} - Par
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                                {errors.pares && (
                                                    <Typography variant="caption" color="error">{errors.pares}</Typography>
                                                )}
                                                {form.pares.length > 0 && (
                                                    <Typography variant="caption" color="info" sx={{ mt: 1, display: 'block' }}>
                                                        💡 Se seleccionará automáticamente un par de manera aleatoria
                                                    </Typography>
                                                )}
                                            </FormControl>
                                        </Grid>
                                    )}

                                    {/* Información del par seleccionado aleatoriamente */}
                                    {form.parSeleccionado && (form.tipo === '360' || form.tipo === '180') && (
                                        <Grid item xs={12}>
                                            <Alert severity="success" sx={{ mt: 1 }}>
                                                <Typography variant="body2">
                                                    🎯 <strong>Par Seleccionado:</strong> {
                                                        usuarios.find(u => u.id === form.parSeleccionado)?.first_name + ' ' +
                                                        usuarios.find(u => u.id === form.parSeleccionado)?.last_name
                                                    }
                                                </Typography>
                                            </Alert>
                                        </Grid>
                                    )}
                                </Grid>
                            </Box>
                        )}

                        {/* Componente - Solo visible después de seleccionar tipo */}
                        {form.tipo && (
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth margin="dense" error={!!errors.componente}>
                                        <InputLabel>Componente *</InputLabel>
                                        <Select
                                            name="componente"
                                            value={form.componente}
                                            onChange={handleChange}
                                            label="Componente *"
                                        >
                                            {componentes.filter((c) => c.es_360 === true).map((c) => (
                                                <MenuItem key={c.id} value={c.id}>
                                                    {`${c.tipo_nombre} - ${c.area_nombre}`}
                                                </MenuItem>
                                            ))}
                                    </Select>
                                        {errors.componente && (
                                            <Typography variant="caption" color="error">{errors.componente}</Typography>
                                    )}
                                </FormControl>
                            </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        margin="dense"
                                        name="fecha_limite"
                                        label="Fecha Límite (Opcional)"
                                        type="date"
                                        value={form.fecha_limite}
                                        onChange={handleChange}
                                        InputLabelProps={{ shrink: true }}
                                        helperText="Fecha límite para completar la evaluación"
                                    />
                        </Grid>
                            </Grid>
                        )}
                    </TabPanel>

                    <TabPanel value={tabValue} index={1}>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            <Typography variant="body2">
                                <strong>Evaluación Masiva:</strong> Se asignará automáticamente el líder del área como evaluador para todos los empleados del área seleccionada.
                            </Typography>
                        </Alert>

                        <FormControl fullWidth margin="dense" error={!!errors.area_grupo}>
                            <InputLabel>Área/Grupo *</InputLabel>
                            <Select
                                name="area_grupo"
                                value={form.area_grupo}
                                onChange={handleChange}
                                label="Área/Grupo *"
                            >
                                {areas.map((a) => (
                                    <MenuItem key={a.id} value={a.id}>
                                        {a.nombre}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.area_grupo && (
                                <Typography variant="caption" color="error">{errors.area_grupo}</Typography>
                            )}
                        </FormControl>
                    </TabPanel>

                    {/* ✅ CAMPOS COMUNES: Solo fecha límite para evaluación individual */}
                    {tabValue === 0 && form.tipo && (
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    margin="dense"
                                    name="fecha_limite"
                                    label="Fecha Límite (Opcional)"
                                    type="date"
                                    value={form.fecha_limite}
                                    onChange={handleChange}
                                    InputLabelProps={{ shrink: true }}
                                    helperText="Fecha límite para completar la evaluación"
                                />
                            </Grid>
                        </Grid>
                    )}

                    {/* ✅ CAMPOS PARA EVALUACIÓN MASIVA */}
                    {tabValue === 1 && (
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth margin="dense" error={!!errors.tipo}>
                                <InputLabel>Tipo de Evaluación *</InputLabel>
                                <Select 
                                    name="tipo" 
                                    value={form.tipo} 
                                    onChange={handleChange} 
                                    label="Tipo de Evaluación *"
                                >
                                    <MenuItem value="360">
                                        <Chip label="360°" size="small" color="secondary" sx={{ mr: 1 }} />
                                            360 Grados (Líder + Subordinados + Pares)
                                    </MenuItem>
                                    <MenuItem value="180">
                                        <Chip label="180°" size="small" color="info" sx={{ mr: 1 }} />
                                            180 Grados (Líder + Pares)
                                    </MenuItem>
                                    <MenuItem value="90">
                                        <Chip label="90°" size="small" color="error" sx={{ mr: 1 }} />
                                            90 Grados (Solo Líder)
                                    </MenuItem>
                                </Select>
                                {errors.tipo && (
                                    <Typography variant="caption" color="error">{errors.tipo}</Typography>
                                )}
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth margin="dense" error={!!errors.componente}>
                                <InputLabel>Componente *</InputLabel>
                                                                    <Select
                                        name="componente"
                                        value={form.componente}
                                        onChange={handleChange}
                                        label="Componente *"
                                    >
                                        {componentes.filter((c) => c.es_360 === true).map((c) => (
                                            <MenuItem key={c.id} value={c.id}>
                                                {`${c.tipo_nombre} - ${c.area_nombre}`}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                {errors.componente && (
                                    <Typography variant="caption" color="error">{errors.componente}</Typography>
                                )}
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                margin="dense"
                                name="fecha_limite"
                                label="Fecha Límite (Opcional)"
                                type="date"
                                value={form.fecha_limite}
                                onChange={handleChange}
                                InputLabelProps={{ shrink: true }}
                                helperText="Fecha límite para completar la evaluación"
                            />
                        </Grid>
                    </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancelar</Button>
                    <Button variant="contained" onClick={handleSubmit}>Guardar</Button>
                </DialogActions>
            </Dialog>

            {/* Vista de Evaluaciones - SOLO MOSTRAR SI NO ESTÁ CARGANDO Y HAY EVALUACIONES */}
            {!loading && evaluaciones && evaluaciones.length > 0 && (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" sx={{ color: '#333', fontWeight: 'bold', mb: 3 }}>
                        Evaluaciones del Sistema
                    </Typography>
                    
                    {/* Agrupar evaluaciones por área */}
                    {(() => {
                        const evaluacionesPorArea = evaluaciones.reduce((acc: any, evaluacion: any) => {
                            // Usar el componente para obtener el área, ya que no tenemos area_grupo_nombre directo
                            const componente = componentes.find(c => c.id === evaluacion.componente);
                            const area = componente?.area_nombre || 'Sin Área';
                            
                            if (!acc[area]) {
                                acc[area] = {
                                    nombre: area,
                                    evaluaciones: [],
                                    total: 0,
                                    completadas: 0,
                                    pendientes: 0
                                };
                            }
                            
                            acc[area].evaluaciones.push(evaluacion);
                            acc[area].total++;
                            if (evaluacion.completada) {
                                acc[area].completadas++;
                            } else {
                                acc[area].pendientes++;
                            }
                            
                            return acc;
                        }, {});

                        if (Object.keys(evaluacionesPorArea).length === 0) {
                            return (
                                <Box textAlign="center" py={6}>
                                    <Assessment sx={{ fontSize: 80, color: '#ccc', mb: 2 }} />
                                    <Typography variant="h6" color="textSecondary" gutterBottom>
                                        No hay evaluaciones para mostrar
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        No hay evaluaciones registradas en el sistema
                                    </Typography>
                                </Box>
                            );
                        }

                        return Object.values(evaluacionesPorArea).map((area: any) => (
                            <Card 
                                key={area.nombre}
                                sx={{ 
                                    mb: 3,
                                    backgroundColor: '#F3E5F5',
                                    border: '1px solid #E1BEE7',
                                    '&:hover': {
                                        boxShadow: 3,
                                        transform: 'translateY(-2px)',
                                        transition: 'all 0.3s ease-in-out'
                                    }
                                }}
                            >
                                {/* Header del área */}
                                <Box
                                    sx={{
                                        backgroundColor: area.pendientes > 0 ? '#E8EAF6' : '#F1F8E9',
                                        p: 2,
                                        borderBottom: '1px solid #e0e0e0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}
                                >
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box
                                            sx={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: '50%',
                                                backgroundColor: area.pendientes > 0 ? '#9FA8DA' : '#A5D6A7',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontWeight: 'bold',
                                                fontSize: '1.2rem'
                                            }}
                                        >
                                            {area.total}
                                        </Box>
                                        <Box>
                                            <Typography variant="h6" fontWeight="bold" sx={{ color: '#4A148C' }}>
                                                {area.nombre}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                {`${area.total} evaluación${area.total !== 1 ? 'es' : ''} • ${area.pendientes} pendiente${area.pendientes !== 1 ? 's' : ''} • ${area.completadas} completada${area.completadas !== 1 ? 's' : ''}`}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Chip
                                                label={`${area.pendientes} pendiente${area.pendientes !== 1 ? 's' : ''}`}
                                                size="small"
                                                sx={{
                                                    backgroundColor: '#FFB74D',
                                                    color: '#E65100',
                                                    fontWeight: 'bold'
                                                }}
                                            />
                                            <Chip
                                                label={`${area.completadas} completada${area.completadas !== 1 ? 's' : ''}`}
                                                size="small"
                                                sx={{
                                                    backgroundColor: '#81C784',
                                                    color: '#2E7D32',
                                                    fontWeight: 'bold'
                                                }}
                                            />
                                        </Box>
                                    </Box>
                                </Box>

                                {/* Botón para expandir/contraer área */}
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => toggleAreaExpandida(area.nombre)}
                                        sx={{
                                            borderColor: '#9C27B0',
                                            color: '#9C27B0',
                                            '&:hover': {
                                                borderColor: '#7B1FA2',
                                                backgroundColor: '#F3E5F5'
                                            }
                                        }}
                                    >
                                        {areasExpandidas.has(area.nombre) ? 'OCULTAR EVALUACIONES' : 'VER EVALUACIONES'}
                                    </Button>
                                </Box>

                                {/* Lista de evaluaciones del área (expandible) */}
                                {areasExpandidas.has(area.nombre) && (
                                    <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
                                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: '#666' }}>
                                            Evaluaciones del área:
                                        </Typography>
                                        
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            {area.evaluaciones.map((evaluacion: any) => (
                                                <Card
                                                    key={evaluacion.id}
                                                    sx={{
                                                        backgroundColor: '#F8F5FF',
                                                        border: '1px solid #D1C4E9',
                                                        '&:hover': {
                                                            boxShadow: 2,
                                                            transform: 'translateY(-1px)',
                                                            transition: 'all 0.2s ease-in-out'
                                                        }
                                                    }}
                                                >
                                                    <CardContent sx={{ p: 3 }}>
                                                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                                            <Box>
                                                                <Typography variant="h6" fontWeight="bold" sx={{ mb: 1, color: '#4A148C' }}>
                                                                    {evaluacion.usuario_evaluado_nombre || 'N/A'}
                                                                </Typography>
                                                                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                                                                    {evaluacion.componente_nombre || 'N/A'}
                                                                </Typography>
                                                            </Box>
                                                            <Chip
                                                                label={evaluacion.completada ? 'Completada' : 'Pendiente'}
                                                                size="medium"
                                                                sx={{
                                                                    backgroundColor: evaluacion.completada ? '#E0F2F1' : '#FFF3E0',
                                                                    color: evaluacion.completada ? '#00695C' : '#E65100',
                                                                    fontWeight: 'bold'
                                                                }}
                                                            />
                                                        </Box>
                                                        
                                                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                                                            <Chip
                                                                label={evaluacion.tipo}
                                                                size="medium"
                                                                sx={{
                                                                    backgroundColor: evaluacion.tipo === '360' ? '#E1F5FE' : evaluacion.tipo === '180' ? '#F3E5F5' : '#FCE4EC',
                                                                    color: evaluacion.tipo === '360' ? '#0277BD' : evaluacion.tipo === '180' ? '#6A1B9A' : '#AD1457',
                                                                    fontWeight: 'bold'
                                                                }}
                                                            />
                                                            <Box>
                                                                <Typography variant="caption" color="textSecondary" display="block">
                                                                    Evaluador:
                                                                </Typography>
                                                                <Typography variant="body2" fontWeight="medium">
                                                                    {evaluacion.evaluador_nombre || 'N/A'}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                        
                                                        <Box display="flex" gap={1} justifyContent="flex-end">
                                                            <Button
                                                                variant="outlined"
                                                                size="small"
                                                                startIcon={<Edit />}
                                                                onClick={() => handleEdit(evaluacion)}
                                                                sx={{
                                                                    borderColor: '#9C27B0',
                                                                    color: '#9C27B0',
                                                                    '&:hover': {
                                                                        borderColor: '#7B1FA2',
                                                                        backgroundColor: '#F3E5F5'
                                                                    }
                                                                }}
                                                            >
                                                                EDITAR
                                                            </Button>
                                                            <Button
                                                                variant="outlined"
                                                                size="small"
                                                                startIcon={<Delete />}
                                                                onClick={() => handleDelete(evaluacion.id)}
                                                                sx={{
                                                                    borderColor: '#F44336',
                                                                    color: '#F44336',
                                                                    '&:hover': {
                                                                        borderColor: '#D32F2F',
                                                                        backgroundColor: '#FFEBEE'
                                                                    }
                                                                }}
                                                            >
                                                                ELIMINAR
                                                            </Button>
                                                        </Box>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                            </Card>
                        ));
                    })()}
                </Box>
            )}

            {/* Snackbar para notificaciones */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}
