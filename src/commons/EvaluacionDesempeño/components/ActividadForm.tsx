import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  TablePagination,
  Tooltip,
  Chip,
  Tabs,
  Tab,
  Alert,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Assignment as AssignmentIcon,
  Work as WorkIcon,
  Visibility as InfoIcon
} from '@mui/icons-material';
import {
  getActividades,
  createActividad,
  updateActividad,
  deleteActividad,
  getComponentes,
  getContratosUsuarios,
  getAreas,
  asignarActividadesMasiva,
  getLideresActividades
} from '../store/thunks/ThunksEvaluacionDesempeño.tsx';


export default function ActividadForm() {
  const dispatch = useDispatch();
  const [actividades, setActividades] = useState<any[]>([]);
  const [componentes, setComponentes] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [lideresActividades, setLideresActividades] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [modo, setModo] = useState<'individual' | 'area'>('individual');
  const [editingActividad, setEditingActividad] = useState<any | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [formData, setFormData] = useState({
    componente: '',
    nombre: '',
    descripcion: '',
    porcentaje: '',
    usuario_asignado: null,
    area_grupo: '',
    evaluador: '',
    usuarios_seleccionados: [] as number[],
    fecha_limite: '' as string
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [success, setSuccess] = useState<string | null>(null);

  const fetchActividades = useCallback(async () => {
    try {
      const result = await dispatch(getActividades() as any);
      if (result) {
        setActividades(result);
      }
    } catch (error) {
      console.error('Error fetching actividades:', error);
    }
  }, [dispatch]);

  const fetchComponentes = useCallback(async () => {
    try {
      const result = await dispatch(getComponentes() as any);
      if (result) {
        setComponentes(result);
      }
    } catch (error) {
      console.error('Error fetching componentes:', error);
    }
  }, [dispatch]);

  const fetchAreas = useCallback(async () => {
    try {
      const result = await dispatch(getAreas() as any);
      if (result) {
        setAreas(result);
      }
    } catch (error) {
      console.error('Error fetching areas:', error);
    }
  }, [dispatch]);

  const fetchUsuarios = useCallback(async () => {
    try {
      const result = await dispatch(getContratosUsuarios() as any);
      if (result) {
        setUsuarios(result);
      }
    } catch (error) {
      console.error('Error fetching usuarios:', error);
    }
  }, [dispatch]);

  const fetchLideresActividades = useCallback(async () => {
    try {
      const result = await dispatch(getLideresActividades() as any);
      if (result) {
        setLideresActividades(result);
      }
    } catch (error) {
      console.error('Error fetching lideres:', error);
    }
  }, [dispatch]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Cargar todos los datos
        await Promise.all([
          fetchActividades(),
          fetchComponentes(),
          fetchAreas(),
          fetchUsuarios(),
          fetchLideresActividades()
        ]);
        
        setLoading(false);
      } catch (error) {
        console.error('Error cargando datos:', error);
        setLoading(false);
      }
    };
    loadData();
  }, [fetchActividades, fetchComponentes, fetchAreas, fetchUsuarios, fetchLideresActividades]);

  // ASIGNACIÓN MASIVA AUTOMÁTICA: Cuando cambien los usuarios y haya un área seleccionada
  useEffect(() => {
    if (formData.area_grupo && usuarios.length > 0) {
      const usuariosDelArea = usuarios
        .filter((u: any) => u.area === parseInt(formData.area_grupo) && u.activo && u.es_vigente)
        .map((u: any) => u.usuario_id);
      
      setFormData(prev => ({
        ...prev,
        usuarios_seleccionados: usuariosDelArea
      }));
    }
  }, [usuarios, formData.area_grupo]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.componente) newErrors.componente = 'Debe seleccionar un componente';
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre de la actividad es obligatorio';
    if (!formData.porcentaje || parseFloat(formData.porcentaje) <= 0) newErrors.porcentaje = 'El porcentaje debe ser mayor a 0';
    if (!formData.evaluador) newErrors.evaluador = 'Debe seleccionar un evaluador';
    if (!formData.usuario_asignado && !formData.area_grupo) {
      newErrors.asignacion = 'Debe seleccionar usuario individual o área para asignación masiva';
    }
    if (formData.usuario_asignado && formData.area_grupo) {
      newErrors.asignacion = 'Debe seleccionar usuario individual O área para asignación masiva, no ambos';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    if (name === 'usuario_asignado') {
      setFormData((prev) => ({
        ...prev,
        usuario_asignado: value === '' ? null : value,
        area_grupo: '', // para evitar conflictos
        usuarios_seleccionados: value ? [value] : []
      }));
    } else if (name === 'area_grupo') {
      // ASIGNACIÓN MASIVA AUTOMÁTICA: Seleccionar todos los usuarios del área
      const usuariosDelArea = usuarios
        .filter((u: any) => u.area === parseInt(value) && u.activo && u.es_vigente)
        .map((u: any) => u.usuario_id);
      
      setFormData((prev) => ({
        ...prev,
        area_grupo: value,
        usuario_asignado: null, // para evitar conflictos
        usuarios_seleccionados: usuariosDelArea // SELECCIÓN AUTOMÁTICA
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleTabChange = (_: any, value: 'individual' | 'area') => {
    setModo(value);
    setErrors({});
    setFormData((prev) => ({
      ...prev,
      usuario_asignado: null,
      area_grupo: '',
      usuarios_seleccionados: []
    }));
  };

  const handleUsuarioToggle = (usuarioId: number) => {
    setFormData((prev) => ({
      ...prev,
      usuarios_seleccionados: prev.usuarios_seleccionados.includes(usuarioId)
        ? prev.usuarios_seleccionados.filter(id => id !== usuarioId)
        : [...prev.usuarios_seleccionados, usuarioId]
    }));
  };

  // Filtrar usuarios que son líderes para el campo evaluador
  const lideresFiltrados = lideresActividades.filter((lider: any) => {
    const esActivo = lider.activo;
    const esVigente = lider.es_vigente;
    return esActivo && esVigente;
  });
  
  const usuariosLideres = lideresFiltrados.map((lider: any) => ({
    id: lider.lider_id,
    first_name: lider.lider_nombre?.split(' ')[0] || 'Líder',
    last_name: lider.lider_nombre?.split(' ').slice(1).join(' ') || '',
    perfil: {
      cargo: `${lider.tipo_actividad} - ${lider.area_nombre}`,
      area: lider.area
    }
  }));
  
  // Filtrar usuarios por área si se seleccionó un área
  const usuariosPorArea = formData.area_grupo 
    ? usuarios.filter((u: any) => u.area === parseInt(formData.area_grupo) && u.activo && u.es_vigente)
    : usuarios;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      // Preparar el payload según el modo (individual vs masiva)
      const actividadPayload: any = {
        componente: formData.componente,
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        porcentaje: parseFloat(formData.porcentaje)
      };

      // Lógica: Individual vs Masiva - NO AMBOS
      if (formData.usuario_asignado && !formData.area_grupo) {
        // MODO INDIVIDUAL: Solo usuario_asignado, NO area_grupo
        actividadPayload.usuario_asignado = formData.usuario_asignado;
      } else if (formData.area_grupo && !formData.usuario_asignado) {
        // MODO MASIVA: Solo area_grupo, NO usuario_asignado
        actividadPayload.area_grupo = formData.area_grupo;
      }
      
      if (editingActividad) {
        // Actualizar actividad
        await dispatch(updateActividad(editingActividad.id, actividadPayload) as any);
        setSuccess('✅ Actividad actualizada exitosamente');
      } else {
        // Crear nueva actividad
        const actividadResponse = await dispatch(createActividad(actividadPayload) as any);
        
        if (actividadResponse && actividadResponse.id) {
          // Crear asignaciones según el modo
          if (formData.usuario_asignado && !formData.area_grupo) {
            // CREACIÓN INDIVIDUAL
            const asignacionPayload = {
              actividad_id: actividadResponse.id,
              usuarios_ids: [formData.usuario_asignado],
              evaluador_id: formData.evaluador,
              fecha_limite: formData.fecha_limite || null,
              lider_id: formData.evaluador,
              area_id: null
            };
            
            await dispatch(asignarActividadesMasiva(asignacionPayload) as any);
            setSuccess('✅ Actividad individual creada y asignada exitosamente');
          } else if (formData.area_grupo && !formData.usuario_asignado) {
            // CREACIÓN MASIVA
            let usuariosParaAsignar = formData.usuarios_seleccionados;
            let evaluadorId = formData.evaluador as any;
            
            if (formData.area_grupo) {
              usuariosParaAsignar = usuariosPorArea
                .filter((u: any) => u.usuario_id !== evaluadorId)
                .map((u: any) => u.usuario_id);
            }

            if (formData.area_grupo && !evaluadorId) {
              const liderArea = lideresActividades.find((lider: any) => 
                lider.area === parseInt(formData.area_grupo) && 
                lider.activo && 
                lider.es_vigente
              );
              if (liderArea) {
                evaluadorId = liderArea.lider_id;
              } else {
                setErrors({ evaluador: 'No se encontró un líder para el área seleccionada' });
                return;
              }
            }
            
            if (usuariosParaAsignar.length > 0 && evaluadorId) {
              const asignacionPayload = {
                actividad_id: actividadResponse.id,
                usuarios_ids: usuariosParaAsignar,
                evaluador_id: evaluadorId,
                fecha_limite: formData.fecha_limite || null,
                lider_id: evaluadorId,
                area_id: formData.area_grupo
              };
              
              await dispatch(asignarActividadesMasiva(asignacionPayload) as any);
              setSuccess('✅ Actividad masiva creada y asignada exitosamente');
            }
          }
        }
      }

      // Recargar datos
      await fetchActividades();
      
      setOpenDialog(false);
      resetForm();
      
    } catch (error: any) {
      console.error('Error al guardar actividad:', error);
      setErrors({ general: 'Error al guardar la actividad. Por favor, verifica los datos.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (actividad: any) => {
    setEditingActividad(actividad);
    setFormData({
      componente: actividad.componente?.toString() || '',
      nombre: actividad.nombre || '',
      descripcion: actividad.descripcion || '',
      porcentaje: actividad.porcentaje?.toString() || '',
      usuario_asignado: actividad.usuario_asignado || null,
      area_grupo: actividad.area_grupo?.toString() || '',
      evaluador: '',
      usuarios_seleccionados: [],
      fecha_limite: ''
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta actividad?')) {
      try {
        setLoading(true);
        
        await dispatch(deleteActividad(id) as any);
        
        // Recargar datos
        await fetchActividades();
        
      } catch (error: any) {
        console.error('Error al eliminar actividad:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      componente: '',
      nombre: '',
      descripcion: '',
      porcentaje: '',
      usuario_asignado: null,
      area_grupo: '',
      evaluador: '',
      usuarios_seleccionados: [],
      fecha_limite: ''
    });
    setEditingActividad(null);
    setOpenDialog(false);
    setErrors({});
    setSuccess(null);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ p: 1, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%' }}>
      <Typography variant="h5" gutterBottom sx={{ color: '#1976d2', mb: 1, fontSize: '1.5rem' }}>
        <WorkIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: '1.2rem' }} />
        Gestión de Actividades
      </Typography>

      {/* Encabezado con imagen de fondo */}
      <Box
        sx={{
          height: '120px',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '8px',
          marginBottom: 1,
          flexShrink: 0
        }}
      >
        <Box
          component="img"
          src="/rh.jpg"
          alt="Encabezado"
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.4,
            zIndex: 0,
          }}
        />
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            p: 3
          }}
        >
          <AssignmentIcon 
            sx={{ 
              fontSize: 40, 
              color: '#1976d2', 
              mb: 0.5,
              filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.1))'
            }} 
          />
          <Typography
            variant="h6"
            sx={{
              color: '#1976d2',
              fontWeight: 'bold',
              mb: 0.5,
              textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
              fontSize: '1.2rem'
            }}
          >
            Gestión de Actividades
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#666',
              fontWeight: 400,
              maxWidth: '400px',
              fontSize: '0.8rem'
            }}
          >
            Administra las actividades de evaluación del sistema
          </Typography>
        </Box>
      </Box>

      {/* Estadísticas y Botón */}
      <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Chip 
          label={`Total: ${actividades.length}`} 
          color="primary" 
          variant="outlined"
          size="small"
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          size="small"
          sx={{
            backgroundColor: '#1976d2',
            fontSize: '0.875rem',
            '&:hover': {
              backgroundColor: '#1565c0'
            }
          }}
        >
          Nueva Actividad
        </Button>
      </Box>

      {/* Modal para crear/editar actividad */}
      <Dialog 
        open={openDialog} 
        onClose={resetForm} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          {editingActividad ? 'Editar Actividad' : 'Nueva Actividad'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ pt: 1 }}>
            <Tabs value={modo} onChange={handleTabChange} sx={{ mb: 2 }}>
              <Tab value="individual" label="INDIVIDUAL" />
              <Tab value="area" label="MASIVA (POR ÁREA)" />
            </Tabs>
            
            {modo === 'individual' && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Evaluación Individual:</strong> Asigne un evaluador específico a un empleado para realizar la evaluación.
                </Typography>
              </Alert>
            )}
            {modo === 'area' && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Evaluación Masiva:</strong> Se asignará automáticamente el líder del área como evaluador para todos los empleados del área seleccionada.
                </Typography>
              </Alert>
            )}
            
            {errors.general && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errors.general}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            {modo === 'individual' && (
              <FormControl fullWidth margin="dense" disabled={!!formData.area_grupo} error={!!errors.usuario_asignado}>
                <InputLabel>Usuario Individual *</InputLabel>
                <Select
                  name="usuario_asignado"
                  value={formData.usuario_asignado || ''}
                  onChange={handleChange}
                  label="Usuario Individual *"
                >
                  {usuarios.map((u: any) => (
                    <MenuItem key={u.id} value={u.usuario_id}>
                      {u.usuario_nombre} - {u.cargo || 'Sin cargo'}
                    </MenuItem>
                  ))}
                </Select>
                {errors.usuario_asignado && <Typography variant="caption" color="error">{errors.usuario_asignado}</Typography>}
              </FormControl>
            )}

            {modo === 'area' && (
              <FormControl fullWidth margin="dense" disabled={!!formData.usuario_asignado} error={!!errors.area_grupo}>
                <InputLabel>Área Grupo *</InputLabel>
                <Select
                  name="area_grupo"
                  value={formData.area_grupo || ''}
                  onChange={handleChange}
                  label="Área Grupo *"
                >
                  {areas.map((area: any) => (
                    <MenuItem key={area.id} value={area.id}>
                      {area.nombre}
                    </MenuItem>
                  ))}
                </Select>
                {errors.area_grupo && <Typography variant="caption" color="error">{errors.area_grupo}</Typography>}
              </FormControl>
            )}

            <TextField
              fullWidth
              margin="dense"
              label="Actividad *"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              error={!!errors.nombre}
              helperText={errors.nombre}
            />

            <TextField
              fullWidth
              margin="dense"
              label="Porcentaje *"
              name="porcentaje"
              type="number"
              value={formData.porcentaje}
              onChange={handleChange}
              error={!!errors.porcentaje}
              helperText={errors.porcentaje}
            />

            <TextField
              fullWidth
              margin="dense"
              label="Fecha Límite"
              name="fecha_limite"
              type="date"
              value={formData.fecha_limite}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />

            <FormControl fullWidth margin="dense" error={!!errors.evaluador}>
              <InputLabel>Evaluador *</InputLabel>
              <Select
                name="evaluador"
                value={formData.evaluador}
                onChange={handleChange}
                label="Evaluador *"
              >
                {usuariosLideres.length === 0 ? (
                  <MenuItem disabled>
                    No hay líderes disponibles
                  </MenuItem>
                ) : (
                  usuariosLideres.map((u: any) => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.first_name} {u.last_name} - {u.perfil?.cargo || 'Sin cargo'}
                    </MenuItem>
                  ))
                )}
              </Select>
              {errors.evaluador && <Typography variant="caption" color="error">{errors.evaluador}</Typography>}
            </FormControl>

            <FormControl fullWidth margin="dense" error={!!errors.componente}>
              <InputLabel>Componente *</InputLabel>
              <Select
                name="componente"
                value={formData.componente}
                onChange={handleChange}
                label="Componente *"
              >
                {componentes.map((c: any) => (
                  <MenuItem key={c.id} value={c.id}>
                    {`${c.tipo_nombre} - ${c.area_nombre}`}
                  </MenuItem>
                ))}
              </Select>
              {errors.componente && <Typography variant="caption" color="error">{errors.componente}</Typography>}
            </FormControl>

            <TextField
              fullWidth
              margin="dense"
              label="Descripción"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              multiline
              rows={3}
            />

            {/* Selección múltiple de usuarios cuando se asigna por área */}
            {modo === 'area' && formData.area_grupo && !formData.usuario_asignado && (
              <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2">
                    Usuarios del área disponibles ({formData.usuarios_seleccionados.length} seleccionados)
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      const usuariosDisponibles = usuariosPorArea
                        .filter((u: any) => u.usuario_id !== formData.evaluador)
                        .map((u: any) => u.usuario_id);
                      
                      setFormData(prev => ({ ...prev, usuarios_seleccionados: usuariosDisponibles }));
                    }}
                    sx={{ fontSize: '0.75rem' }}
                  >
                    Seleccionar Todos
                  </Button>
                </Box>

                <Box sx={{ maxHeight: 150, overflow: 'auto' }}>
                  <Grid container spacing={1}>
                    {usuariosPorArea
                      .filter((u: any) => u.usuario_id !== formData.evaluador)
                      .map((u: any) => (
                        <Grid item xs={12} sm={6} key={u.id}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              p: 1,
                              cursor: 'pointer',
                              backgroundColor: formData.usuarios_seleccionados.includes(u.usuario_id) ? '#e3f2fd' : 'transparent',
                              borderRadius: 1,
                              border: `1px solid ${formData.usuarios_seleccionados.includes(u.usuario_id) ? '#90caf9' : '#e0e0e0'}`,
                              '&:hover': {
                                backgroundColor: formData.usuarios_seleccionados.includes(u.usuario_id) ? '#bbdefb' : '#f5f5f5'
                              }
                            }}
                            onClick={() => handleUsuarioToggle(u.usuario_id)}
                          >
                            <input
                              type="checkbox"
                              checked={formData.usuarios_seleccionados.includes(u.usuario_id)}
                              onChange={() => {}}
                              style={{ marginRight: 8 }}
                            />
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography variant="body2" noWrap>
                                {u.usuario_nombre}
                              </Typography>
                              <Typography variant="caption" color="textSecondary" noWrap>
                                {u.cargo || 'Sin cargo'}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      ))}
                  </Grid>
                </Box>

                {formData.usuarios_seleccionados.length > 0 && (
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setFormData(prev => ({ ...prev, usuarios_seleccionados: [] }))}
                      sx={{ fontSize: '0.75rem' }}
                    >
                      Limpiar Selección
                    </Button>
                  </Box>
                )}
              </Box>
            )}

            {errors.asignacion && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {errors.asignacion}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetForm}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : (editingActividad ? 'Actualizar' : 'Guardar')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tabla de Actividades */}
      <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, p: 0 }}>
          <TableContainer sx={{ flex: 1, overflowX: 'auto', minHeight: 0 }}>
            <Table stickyHeader sx={{ minWidth: 500 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 200, maxWidth: 250, fontSize: '0.75rem', py: 1 }}>Actividad</TableCell>
                  <TableCell sx={{ minWidth: 80, maxWidth: 100, fontSize: '0.75rem', py: 1 }}>Asignado a</TableCell>
                  <TableCell sx={{ minWidth: 60, maxWidth: 80, fontSize: '0.75rem', py: 1 }}>%</TableCell>
                  <TableCell sx={{ minWidth: 60, maxWidth: 80, fontSize: '0.75rem', py: 1 }}>Tipo</TableCell>
                  <TableCell sx={{ minWidth: 60, maxWidth: 80, fontSize: '0.75rem', py: 1 }}>Info</TableCell>
                  <TableCell sx={{ minWidth: 80, maxWidth: 100, fontSize: '0.75rem', py: 1 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Cargando actividades...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : actividades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="h6" color="textSecondary">
                        No hay actividades registradas
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Crea tu primera actividad usando el botón "Nueva Actividad"
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  actividades
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((act: any) => {
                      const componente = componentes.find((c: any) => c.id === act.componente);
                      
                      return (
                        <TableRow key={act.id} hover sx={{ '& td': { py: 0.5 } }}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium" noWrap title={act.nombre} sx={{ fontSize: '0.75rem' }}>
                              {act.nombre.length > 50 ? `${act.nombre.substring(0, 50)}...` : act.nombre}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap title={act.usuario_asignado_nombre || 'Sin asignar'} sx={{ fontSize: '0.75rem' }}>
                              {act.usuario_asignado_nombre || 'Sin asignar'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#1976d2' }}>
                              {act.porcentaje}%
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={act.usuario_asignado_nombre ? 'Ind' : 'Mas'}
                              size="small"
                              color={act.usuario_asignado_nombre ? 'secondary' : 'default'}
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', height: '20px' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Tooltip 
                              title={
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                    {act.nombre}
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    <strong>Descripción:</strong> {act.descripcion || 'Sin descripción'}
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    <strong>Componente:</strong> {componente ? `${componente.tipo_nombre} - ${componente.area_nombre}` : 'Componente no encontrado'}
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    <strong>Porcentaje:</strong> {act.porcentaje}%
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    <strong>Tipo:</strong> {act.usuario_asignado_nombre ? 'Individual' : 'Masiva'}
                                  </Typography>
                                  <Typography variant="body2">
                                    <strong>Usuarios:</strong> {act.usuario_asignado_nombre ? act.usuario_asignado_nombre : (act.usuarios_grupo_nombres?.join(', ') || 'Sin asignar')}
                                  </Typography>
                                </Box>
                              }
                              arrow
                              placement="left"
                            >
                              <IconButton
                                size="small"
                                sx={{
                                  color: '#1976d2',
                                  padding: '4px',
                                  '&:hover': {
                                    backgroundColor: '#e3f2fd'
                                  }
                                }}
                              >
                                <InfoIcon sx={{ fontSize: '1rem' }} />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="Editar">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEdit(act)}
                                  sx={{
                                    color: '#1976d2',
                                    padding: '4px',
                                    '&:hover': {
                                      backgroundColor: '#e3f2fd'
                                    }
                                  }}
                                >
                                  <EditIcon sx={{ fontSize: '0.875rem' }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Eliminar">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDelete(act.id)}
                                  sx={{
                                    color: '#d32f2f',
                                    padding: '4px',
                                    '&:hover': {
                                      backgroundColor: '#ffebee'
                                    }
                                  }}
                                >
                                  <DeleteIcon sx={{ fontSize: '0.875rem' }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Paginación */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={actividades.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            sx={{ borderTop: 1, borderColor: 'divider' }}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
