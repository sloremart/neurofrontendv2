import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, List, ListItem, ListItemText,
  ListItemAvatar, Avatar, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Rating, Chip, CircularProgress, FormControl,
  InputLabel, Select, MenuItem, Paper, Alert
} from '@mui/material';
import {
  Assignment, Person, Star, CheckCircle, PendingActions, Grade
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { 
  getAsignacionesActividadesParaLider, 
  evaluarActividadLaboral
} from '../store/thunks/ThunksEvaluacionDesempeño.tsx';

interface EvaluacionActividadesProps {
  liderId: number;
  areas?: Array<{ id: number; nombre: string }>;
}

interface AsignacionActividadParaEvaluar {
  id: number;
  actividad_nombre: string;
  actividad_descripcion?: string;
  actividad_porcentaje?: number;
  componente_nombre: string;
  area_grupo_nombre?: string;
  usuario_asignado_nombre: string;
  evaluador_nombre: string;
  fecha_asignacion: string;
  fecha_limite?: string;
  completada: boolean;
  fecha_completada?: string;
  usuario_asignado: number;
  calificacion_anterior?: number;
}

interface FormEvaluacion {
  asignacion_id: number;
  calificacion: number;
  comentarios: string;
}

export default function EvaluacionActividadesLaborales({ liderId, areas = [] }: EvaluacionActividadesProps) {
  const dispatch = useDispatch();
  const [asignaciones, setAsignaciones] = useState<AsignacionActividadParaEvaluar[]>([]);
  const [areaSeleccionada, setAreaSeleccionada] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [asignacionSeleccionada, setAsignacionSeleccionada] = useState<AsignacionActividadParaEvaluar | null>(null);
  const [usuariosExpandidos, setUsuariosExpandidos] = useState<Set<number>>(new Set());
  // ✅ AGREGAR: Estado para el área del líder
  const [areaLider, setAreaLider] = useState<number | null>(null);

  const [form, setForm] = useState<FormEvaluacion>({
    asignacion_id: 0,
    calificacion: 0,
    comentarios: ''
  });



  const cargarAsignaciones = useCallback(async () => {
    setLoading(true);
    try {
      console.log('🚀 Cargando asignaciones para líder:', liderId);
      console.log('🔍 URL que se está llamando: /asignaciones-actividades/para_lider/?lider_id=' + liderId);
      
      // ✅ CORREGIR: Llamar sin área para obtener todas las asignaciones del líder
      const data = await dispatch(getAsignacionesActividadesParaLider(liderId, undefined) as any);
      console.log('✅ Datos recibidos:', data);
      console.log('🔍 Tipo de datos:', typeof data);
      console.log('🔍 Es array?', Array.isArray(data));
      console.log('🔍 Longitud:', data?.length || 0);
      
      if (data && Array.isArray(data)) {
        setAsignaciones(data);
        console.log('✅ Asignaciones cargadas:', data.length);
        
        // ✅ DEBUG: Mostrar las primeras asignaciones
        if (data.length > 0) {
          console.log('🔍 Primera asignación:', data[0]);
        }
      } else {
        console.log('⚠️ No se recibieron datos válidos');
        setAsignaciones([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar asignaciones:', error);
      setAsignaciones([]);
    } finally {
      setLoading(false);
    }
  }, [liderId, dispatch]);

  // ✅ useEffect después de la definición de la función
  useEffect(() => {
    if (liderId) {
      console.log('🔍 Líder ID recibido:', liderId);
      cargarAsignaciones();
    }
  }, [liderId, cargarAsignaciones]);

  const handleEvaluar = (asignacion: AsignacionActividadParaEvaluar) => {
    setAsignacionSeleccionada(asignacion);
    setForm({
      asignacion_id: asignacion.id,
      calificacion: 0,
      comentarios: ''
    });
    setOpenDialog(true);
  };

  const handleEvaluarUsuario = (usuario: any) => {
    // Tomar la primera actividad pendiente del usuario
    const primeraActividadPendiente = usuario.asignaciones.find((a: any) => !a.completada);
    if (primeraActividadPendiente) {
      handleEvaluar(primeraActividadPendiente);
    }
  };

  const toggleUsuarioExpandido = (usuarioId: number) => {
    setUsuariosExpandidos(prev => {
      const nuevo = new Set(prev);
      if (nuevo.has(usuarioId)) {
        nuevo.delete(usuarioId);
      } else {
        nuevo.add(usuarioId);
      }
      return nuevo;
    });
  };

  const handleSubmit = async () => {
    try {
      console.log('🚀 Enviando evaluación:', form);
      const result = await dispatch(evaluarActividadLaboral(form) as any);
      console.log('✅ Evaluación enviada exitosamente:', result);
      
      // ✅ FORZAR CIERRE DEL MODAL INMEDIATAMENTE
      setOpenDialog(false);
      setAsignacionSeleccionada(null);
      
      // ✅ LIMPIAR FORMULARIO
      setForm({
        asignacion_id: 0,
        calificacion: 0,
        comentarios: ''
      });
      
      // ✅ RECARGAR DATOS DESPUÉS DEL CIERRE
      setTimeout(() => {
        cargarAsignaciones();
      }, 100);
      
      console.log('✅ Modal cerrado y datos recargados');
    } catch (error) {
      console.error('❌ Error al evaluar actividad:', error);
      // ❌ NO cerrar el modal si hay error
    }
  };

  const handleClose = () => {
    console.log('🔒 Cerrando modal manualmente');
    setOpenDialog(false);
    setAsignacionSeleccionada(null);
    setForm({
      asignacion_id: 0,
      calificacion: 0,
      comentarios: ''
    });
    console.log('✅ Modal cerrado manualmente');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // ✅ Agrupar asignaciones por usuario - MOSTRAR TODOS (pendientes y completadas)
  const usuariosAgrupados = asignaciones.reduce((acc, asignacion) => {
    const usuarioId = asignacion.usuario_asignado;
    const usuarioNombre = asignacion.usuario_asignado_nombre;
    
    if (!acc[usuarioId]) {
      acc[usuarioId] = {
        id: usuarioId,
        nombre: usuarioNombre,
        asignaciones: [],
        totalPendientes: 0,
        totalCompletadas: 0
      };
    }
    
    acc[usuarioId].asignaciones.push(asignacion);
    if (!asignacion.completada) {
      acc[usuarioId].totalPendientes++;
    } else {
      acc[usuarioId].totalCompletadas++;
    }
    
    return acc;
  }, {} as Record<number, any>);

  console.log('🔍 Usuarios agrupados:', usuariosAgrupados);
  console.log('🔍 Total usuarios:', Object.keys(usuariosAgrupados).length);

  return (
    <Box>
      {/* Header con imagen de fondo */}
      <Box
        sx={{
          width: '100%',
          height: '200px',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '8px',
          marginBottom: 3
        }}
      >
        <Box
          component="img"
          src="/check.jpg"
          alt="Encabezado"
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 30%',
            opacity: 0.25,
            zIndex: 0,
          }}
        />
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              backgroundColor: 'rgba(0,0,0,0.5)',
              color: 'white',
              padding: '6px 16px',
              borderRadius: '8px',
              fontWeight: 'bold',
            }}
          >
            EVALUACIÓN DE ACTIVIDADES LABORALES
          </Typography>
        </Box>
      </Box>

      {/* Filtro de área */}
      {areas.length > 0 && (
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Filtrar por Área</InputLabel>
          <Select
            value={areaSeleccionada}
            onChange={(e) => setAreaSeleccionada(e.target.value as number | '')}
            label="Filtrar por Área"
          >
            <MenuItem value="">
              <em>Todas las áreas</em>
            </MenuItem>
            {areas.map((area) => (
              <MenuItem key={area.id} value={area.id}>
                {area.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* Estadísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#eaf8faff', border: '1px solid #b2ebf2' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Assignment sx={{ fontSize: 40, color: '#b2ebf2', mb: 1 }} />
              <Typography variant="h4" color="primary" gutterBottom>
                {asignaciones.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Asignaciones
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#e8f5e9', border: '1px solid #dcedc8' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 40, color: '#dcedc8', mb: 1 }} />
              <Typography variant="h4" color="primary" gutterBottom>
                {asignaciones.filter(a => a.completada).length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Evaluadas
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#eaf8faff', border: '1px solid #b2ebf2' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <PendingActions sx={{ fontSize: 40, color: '#b2ebf2', mb: 1 }} />
              <Typography variant="h4" color="primary" gutterBottom>
                {asignaciones.filter(a => !a.completada).length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Pendientes
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#f3e5f5', border: '1px solid #ce93d8' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Grade sx={{ fontSize: 40, color: '#ce93d8', mb: 1 }} />
              <Typography variant="h4" color="primary" gutterBottom>
                {asignaciones.filter(a => a.completada).length > 0 
                  ? (asignaciones.filter(a => a.completada)
                      .reduce((sum, a) => sum + (a.calificacion_anterior || 0), 0) / 
                     asignaciones.filter(a => a.completada).length).toFixed(1)
                  : '0.0'
                }
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Promedio
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Lista de Actividades por Usuario */}
      <Paper sx={{ backgroundColor: '#eaf8faff', p: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#b2ebf2', mb: 2 }}>
          <Assignment sx={{ mr: 1, verticalAlign: 'middle' }} />
          Actividades Laborales para Evaluar
        </Typography>

        <List>
          {Object.values(usuariosAgrupados).map((usuario) => (
            <React.Fragment key={usuario.id}>
              <ListItem
                sx={{
                  backgroundColor: 'white',
                  mb: 2,
                  borderRadius: 2,
                  border: '1px solid #b2ebf2',
                  '&:hover': {
                    backgroundColor: '#f0f9ff',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s ease-in-out',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ backgroundColor: usuario.totalPendientes > 0 ? '#b2ebf2' : '#4caf50' }}>
                    {usuario.totalPendientes > 0 ? <PendingActions /> : <CheckCircle />}
                  </Avatar>
                </ListItemAvatar>
                
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="h6" fontWeight="bold">
                        {usuario.nombre}
                      </Typography>
                      <Box display="flex" gap={1} alignItems="center">
                        <Chip
                          label={`${usuario.asignaciones.length} actividad${usuario.asignaciones.length !== 1 ? 'es' : ''}`}
                          size="small"
                          sx={{ backgroundColor: '#e3f2fd', color: '#1976d2' }}
                        />
                        <Chip
                          label={usuario.totalPendientes > 0 ? `${usuario.totalPendientes} pendiente${usuario.totalPendientes !== 1 ? 's' : ''}` : 'Completado'}
                          size="small"
                          sx={{ 
                            backgroundColor: usuario.totalPendientes > 0 ? '#eaf8faff' : '#e8f5e9',
                            color: usuario.totalPendientes > 0 ? '#1976d2' : '#2e7d32'
                          }}
                        />
                      </Box>
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Total de actividades asignadas: {usuario.asignaciones.length}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Actividades pendientes: {usuario.totalPendientes}
                      </Typography>
                      {usuario.asignaciones.length > 0 && (
                        <Typography variant="body2" color="textSecondary">
                          Componentes: {[...new Set(usuario.asignaciones.map((a: any) => a.componente_nombre))].join(', ')}
                        </Typography>
                      )}
                    </Box>
                  }
                />

                <Box display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => toggleUsuarioExpandido(usuario.id)}
                    sx={{
                      borderColor: '#b2ebf2',
                      color: '#1976d2',
                      '&:hover': {
                        borderColor: '#a0d9c1',
                        backgroundColor: '#f0f9ff',
                      }
                    }}
                  >
                    {usuariosExpandidos.has(usuario.id) ? 'Ocultar' : 'Ver'} actividades
                  </Button>
                  
                  <Button
                    variant="contained"
                    onClick={() => handleEvaluarUsuario(usuario)}
                    disabled={usuario.totalPendientes === 0}
                    sx={{
                      backgroundColor: usuario.totalPendientes > 0 ? '#b2ebf2' : '#4caf50',
                      color: usuario.totalPendientes > 0 ? '#000' : 'white',
                      '&:hover': {
                        backgroundColor: usuario.totalPendientes > 0 ? '#a0d9c1' : '#45a049'
                      }
                    }}
                  >
                    {usuario.totalPendientes > 0 ? 'Evaluar' : 'Completado'}
                  </Button>
                </Box>
              </ListItem>

              {/* Lista expandible de actividades del usuario */}
              {usuariosExpandidos.has(usuario.id) && (
                <Box sx={{ ml: 6, mr: 2, mb: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom sx={{ mb: 1 }}>
                    Actividades asignadas:
                  </Typography>
                  {usuario.asignaciones.map((asignacion: any) => (
                    <Box
                      key={asignacion.id}
                      sx={{
                        p: 2,
                        mb: 1,
                        backgroundColor: '#f8f9fa',
                        borderRadius: 1,
                        border: '1px solid #e9ecef',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight="bold" gutterBottom>
                          {asignacion.actividad_nombre}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" display="block">
                          Componente: {asignacion.componente_nombre}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" display="block">
                          Fecha límite: {asignacion.fecha_limite ? new Date(asignacion.fecha_limite).toLocaleDateString() : 'Sin fecha'}
                        </Typography>
                      </Box>
                      
                      <Box display="flex" gap={1} alignItems="center">
                        <Chip
                          label={asignacion.completada ? 'Completada' : 'Pendiente'}
                          size="small"
                          sx={{ 
                            backgroundColor: asignacion.completada ? '#e8f5e9' : '#fff3e0',
                            color: asignacion.completada ? '#2e7d32' : '#f57c00',
                            fontSize: '0.6rem'
                          }}
                        />
                        
                        {!asignacion.completada && (
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleEvaluar(asignacion)}
                            sx={{
                              backgroundColor: '#b2ebf2',
                              color: '#000',
                              fontSize: '0.7rem',
                              px: 2,
                              '&:hover': {
                                backgroundColor: '#a0d9c1'
                              }
                            }}
                          >
                            Evaluar
                          </Button>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </React.Fragment>
          ))}
        </List>


              </Paper>

        {/* ✅ MOSTRAR MENSAJE CUANDO NO HAY USUARIOS */}
        {Object.values(usuariosAgrupados).length === 0 && (
          <Box textAlign="center" py={4}>
            <Assignment sx={{ fontSize: 60, color: '#b2ebf2', mb: 2 }} />
            <Typography variant="body1" color="textSecondary" gutterBottom>
              No hay usuarios con actividades asignadas
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Los usuarios aparecerán aquí cuando tengan actividades asignadas
            </Typography>
          </Box>
        )}

      {/* Dialog de Evaluación */}
      <Dialog open={openDialog} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Assignment sx={{ color: '#b2ebf2' }} />
            Evaluación de Actividad - {asignacionSeleccionada?.usuario_asignado_nombre}
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {asignacionSeleccionada && (
            <Box>
              {/* Información de la Actividad */}
              <Box sx={{ mb: 4, p: 3, backgroundColor: '#f8f9fa', borderRadius: 2, border: '1px solid #e9ecef' }}>
                <Typography variant="h5" gutterBottom sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                  {asignacionSeleccionada.actividad_nombre}
                </Typography>
                
                {asignacionSeleccionada.actividad_descripcion && (
                  <Typography variant="body1" color="textSecondary" gutterBottom sx={{ mb: 2 }}>
                    {asignacionSeleccionada.actividad_descripcion}
                  </Typography>
                )}
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, backgroundColor: 'white', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                      <Typography variant="subtitle2" color="primary" fontWeight="bold" gutterBottom>
                        Usuario Evaluado
                      </Typography>
                      <Typography variant="body1">
                        {asignacionSeleccionada.usuario_asignado_nombre}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, backgroundColor: 'white', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                      <Typography variant="subtitle2" color="primary" fontWeight="bold" gutterBottom>
                        Componente
                      </Typography>
                      <Typography variant="body1">
                        {asignacionSeleccionada.componente_nombre}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  {asignacionSeleccionada.actividad_porcentaje && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, backgroundColor: 'white', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                        <Typography variant="subtitle2" color="primary" fontWeight="bold" gutterBottom>
                          Peso en la Evaluación
                        </Typography>
                        <Typography variant="body1">
                          {asignacionSeleccionada.actividad_porcentaje}%
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                  
                  {asignacionSeleccionada.fecha_limite && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, backgroundColor: 'white', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                        <Typography variant="subtitle2" color="primary" fontWeight="bold" gutterBottom>
                          Fecha Límite
                        </Typography>
                        <Typography variant="body1">
                          {new Date(asignacionSeleccionada.fecha_limite).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Box>

              {/* Calificación */}
              <Box sx={{ mb: 4, p: 3, backgroundColor: '#fff3e0', borderRadius: 2, border: '1px solid #ffcc80' }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#f57c00', fontWeight: 'bold', mb: 2 }}>
                  Calificación de la Actividad
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ mb: 2 }}>
                    Seleccione una calificación del 1 al 10
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Rating
                      value={form.calificacion}
                      onChange={(_, value) => setForm(prev => ({ ...prev, calificacion: value || 0 }))}
                      max={10}
                      size="large"
                      sx={{
                        '& .MuiRating-iconFilled': {
                          color: '#ff9800',
                        },
                        '& .MuiRating-iconHover': {
                          color: '#f57c00',
                        },
                      }}
                    />
                    <Typography variant="h5" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                      {form.calificacion}/10
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((valor) => (
                      <Button
                        key={valor}
                        variant={form.calificacion === valor ? 'contained' : 'outlined'}
                        size="small"
                        onClick={() => setForm(prev => ({ ...prev, calificacion: valor }))}
                        sx={{
                          minWidth: '40px',
                          height: '40px',
                          backgroundColor: form.calificacion === valor ? '#ff9800' : 'transparent',
                          color: form.calificacion === valor ? 'white' : '#ff9800',
                          borderColor: '#ff9800',
                          '&:hover': {
                            backgroundColor: form.calificacion === valor ? '#f57c00' : '#fff3e0',
                          },
                        }}
                      >
                        {valor}
                      </Button>
                    ))}
                  </Box>
                </Box>
              </Box>

              {/* Comentarios */}
              <Box sx={{ mb: 4, p: 3, backgroundColor: '#e8f5e9', borderRadius: 2, border: '1px solid #dcedc8' }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#2e7d32', fontWeight: 'bold', mb: 2 }}>
                  Comentarios de la Evaluación
                </Typography>
                
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  label="Describa el desempeño del empleado en esta actividad..."
                  value={form.comentarios}
                  onChange={(e) => setForm(prev => ({ ...prev, comentarios: e.target.value }))}
                  placeholder="Escriba sus observaciones sobre el desempeño, logros, áreas de mejora, etc..."
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                      '&:hover fieldset': {
                        borderColor: '#4caf50',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#4caf50',
                      },
                    },
                  }}
                />
              </Box>

              {/* Alerta de evaluación previa */}
              {asignacionSeleccionada?.completada && (
                <Alert severity="info" sx={{ 
                  mb: 3,
                  backgroundColor: '#e3f2fd',
                  border: '1px solid #90caf9',
                  '& .MuiAlert-icon': {
                    color: '#1976d2',
                  },
                }}>
                  <Typography variant="body1">
                    <strong>Evaluación anterior detectada:</strong> Esta actividad ya ha sido evaluada previamente. 
                    Al guardar, se actualizará la evaluación existente.
                  </Typography>
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button 
            onClick={handleClose}
            variant="outlined"
            sx={{
              borderColor: '#9e9e9e',
              color: '#616161',
              '&:hover': {
                borderColor: '#757575',
                backgroundColor: '#f5f5f5',
              },
            }}
          >
            Cancelar
          </Button>
          
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            disabled={form.calificacion === 0}
            sx={{ 
              backgroundColor: '#ff9800',
              color: 'white',
              fontWeight: 'bold',
              px: 4,
              py: 1.5,
              '&:hover': {
                backgroundColor: '#f57c00',
              },
              '&:disabled': {
                backgroundColor: '#ccc',
                color: '#666',
              },
            }}
          >
            {asignacionSeleccionada?.completada ? 'Actualizar Evaluación' : 'Guardar Evaluación'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
