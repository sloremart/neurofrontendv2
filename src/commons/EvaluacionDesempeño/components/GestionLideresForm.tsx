import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  TextField,
  Button,
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
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  Snackbar,
  CircularProgress,
  TablePagination,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Work as WorkIcon
} from '@mui/icons-material';
import { 
  getAreas, 
  getLideresActividades, 
  createLiderActividad, 
  updateLiderActividad, 
  deleteLiderActividad,
  getUsuarios
} from "../store/thunks/ThunksEvaluacionDesempeño.tsx";

interface Area {
  id: number;
  nombre: string;
}

interface LiderActividad {
  id?: number;
  area: number;
  lider_id: number;
  fecha_inicio: string;
  fecha_fin?: string;
  activo: boolean;
  tipo_actividad: string;
}

const TIPOS_ACTIVIDAD = [
  { value: 'FUNCIONES_CONTRATO', label: 'Funciones de Contrato' },
  { value: 'ACTIVIDADES_DIARIAS', label: 'Actividades Diarias' },
  { value: 'PROYECTOS_ESPECIALES', label: 'Proyectos Especiales' }
];

const GestionLideresForm: React.FC = () => {
  const dispatch = useDispatch();
  const [areas, setAreas] = useState<Area[]>([]);
  const [lideres, setLideres] = useState<LiderActividad[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingLider, setEditingLider] = useState<LiderActividad | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [formData, setFormData] = useState<LiderActividad>({
    area: 0,
    lider_id: 0,
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: '',
    activo: true,
    tipo_actividad: 'FUNCIONES_CONTRATO'
  });

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

  const fetchLideres = useCallback(async () => {
    try {
      const result = await dispatch(getLideresActividades() as any);
      if (result) {
        setLideres(result);
      }
    } catch (error) {
      console.error('Error fetching leaders:', error);
    }
  }, [dispatch]);

  const fetchUsuarios = useCallback(async () => {
    try {
      const result = await dispatch(getUsuarios() as any);
      if (result) {
        setUsuarios(result);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, [dispatch]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Cargar áreas, usuarios y líderes
        await Promise.all([
          fetchAreas(),
          fetchUsuarios(),
          fetchLideres()
        ]);
        
        setLoading(false);
      } catch (error) {
        console.error('Error cargando datos:', error);
        setLoading(false);
      }
    };
    loadData();
  }, [dispatch, fetchAreas, fetchUsuarios, fetchLideres]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingLider) {
        await dispatch(updateLiderActividad(editingLider.id!, formData) as any);
        showSnackbar('Líder actualizado exitosamente', 'success');
      } else {
        await dispatch(createLiderActividad(formData) as any);
        showSnackbar('Líder creado exitosamente', 'success');
      }

      // Recargar datos
      await Promise.all([
        fetchAreas(),
        fetchUsuarios(),
        fetchLideres()
      ]);

      setOpenDialog(false);
      resetForm();
      
    } catch (error: any) {
      console.error('Error al guardar líder:', error);
      showSnackbar(`Error: ${error.message || 'Error desconocido'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (lider: LiderActividad) => {
    setEditingLider(lider);
    setFormData({
      area: lider.area,
      lider_id: lider.lider_id,
      fecha_inicio: lider.fecha_inicio || new Date().toISOString().split('T')[0],
      fecha_fin: lider.fecha_fin || '',
      activo: lider.activo,
      tipo_actividad: lider.tipo_actividad
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este líder?')) {
      try {
        setLoading(true);
        
        await dispatch(deleteLiderActividad(id) as any);
        showSnackbar('Líder eliminado exitosamente', 'success');
        
        // Recargar datos
        await Promise.all([
          fetchAreas(),
          fetchUsuarios(),
          fetchLideres()
        ]);
        
      } catch (error) {
        console.error('Error al eliminar líder:', error);
        showSnackbar('Error al eliminar líder', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      area: 0,
      lider_id: 0,
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_fin: '',
      activo: true,
      tipo_actividad: 'FUNCIONES_CONTRATO'
    });
    setEditingLider(null);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const getTipoActividadLabel = (value: string) => {
    return TIPOS_ACTIVIDAD.find(tipo => tipo.value === value)?.label || value;
  };

  const getAreaNombre = (areaId: number) => {
    return areas.find(area => area.id === areaId)?.nombre || 'Área no encontrada';
  };

  const getUsuarioNombre = (usuarioId: number) => {
    const usuario = usuarios.find(u => u.id === usuarioId);
    return usuario ? `${usuario.first_name} ${usuario.last_name}` : `Usuario ${usuarioId}`;
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDateColombia = (dateString: string) => {
    return new Date(dateString + 'T00:00:00.000Z').toLocaleDateString('es-CO', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <Box sx={{ p: 3, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#1976d2', mb: 3 }}>
        <WorkIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
        Gestión de Líderes de Actividades
      </Typography>

      {/* Encabezado con imagen de fondo */}
      <Box
        sx={{
          height: '200px',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '8px',
          marginBottom: 3,
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
          <BusinessIcon 
            sx={{ 
              fontSize: 80, 
              color: '#1976d2', 
              mb: 2,
              filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.1))'
            }} 
          />
          <Typography
            variant="h3"
            sx={{
              color: '#1976d2',
              fontWeight: 'bold',
              mb: 1,
              textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
            }}
          >
            Gestión de Líderes
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: '#666',
              fontWeight: 400,
              maxWidth: '600px'
            }}
          >
            Administra los líderes de actividades del sistema
          </Typography>
        </Box>
      </Box>

      {/* Botón para abrir modal */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          sx={{
            backgroundColor: '#1976d2',
            '&:hover': {
              backgroundColor: '#1565c0'
            }
          }}
        >
          Nuevo Líder
        </Button>
      </Box>

      {/* Tabla de Líderes */}
      <Card elevation={3} sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', mb: 2 }}>
            Líderes Configurados
          </Typography>
          
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <TableContainer sx={{ flex: 1, overflowX: 'auto', minHeight: 0 }}>
                <Table stickyHeader sx={{ minWidth: 800 }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ minWidth: 150, maxWidth: 200 }}><strong>Área</strong></TableCell>
                      <TableCell sx={{ minWidth: 200, maxWidth: 250 }}><strong>Líder</strong></TableCell>
                      <TableCell sx={{ minWidth: 150, maxWidth: 200 }}><strong>Tipo</strong></TableCell>
                      <TableCell sx={{ minWidth: 150, maxWidth: 200 }}><strong>Fechas</strong></TableCell>
                      <TableCell sx={{ minWidth: 100, maxWidth: 120 }}><strong>Estado</strong></TableCell>
                      <TableCell sx={{ minWidth: 120, maxWidth: 150 }}><strong>Acciones</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lideres.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#666' }}>
                          No hay líderes configurados
                        </TableCell>
                      </TableRow>
                    ) : (
                      lideres
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((lider) => (
                        <TableRow key={lider.id} hover>
                          <TableCell>
                            <Chip 
                              icon={<BusinessIcon />} 
                              label={getAreaNombre(lider.area)}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" noWrap title={getUsuarioNombre(lider.lider_id)}>
                                {getUsuarioNombre(lider.lider_id)}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                ID: {lider.lider_id}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={getTipoActividadLabel(lider.tipo_actividad)}
                              size="small"
                              color="info"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="caption" display="block" sx={{ display: 'flex', alignItems: 'center' }}>
                                <CalendarIcon sx={{ fontSize: 12, mr: 0.5 }} />
                                Inicio: {formatDateColombia(lider.fecha_inicio)}
                              </Typography>
                              {lider.fecha_fin && (
                                <Typography variant="caption" display="block" sx={{ display: 'flex', alignItems: 'center' }}>
                                  <CalendarIcon sx={{ fontSize: 12, mr: 0.5 }} />
                                  Fin: {formatDateColombia(lider.fecha_fin)}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={lider.activo ? 'Activo' : 'Inactivo'}
                              color={lider.activo ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="Editar">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEdit(lider)}
                                  color="primary"
                                  sx={{ 
                                    '&:hover': { 
                                      backgroundColor: 'rgba(25, 118, 210, 0.1)' 
                                    }
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Eliminar">
                                <IconButton
                                  size="small"
                                  onClick={() => lider.id && handleDelete(lider.id)}
                                  color="error"
                                  sx={{ 
                                    '&:hover': { 
                                      backgroundColor: 'rgba(244, 67, 54, 0.1)' 
                                    }
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={lideres.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Filas por página:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                sx={{ borderTop: 1, borderColor: 'divider' }}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Modal para crear/editar líder */}
      <Dialog 
        open={openDialog} 
        onClose={() => {
          setOpenDialog(false);
          resetForm();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ color: '#1976d2', fontWeight: 'bold' }}>
          {editingLider ? 'Editar Líder' : 'Nuevo Líder'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Área</InputLabel>
              <Select
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: Number(e.target.value) })}
                required
              >
                {areas && areas.length > 0 ? (
                  areas.map((area) => (
                    <MenuItem key={area.id} value={area.id}>
                      {area.nombre}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>
                    {areas ? 'No hay áreas disponibles' : 'Cargando áreas...'}
                  </MenuItem>
                )}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Usuario Líder</InputLabel>
              <Select
                value={formData.lider_id}
                onChange={(e) => setFormData({ ...formData, lider_id: Number(e.target.value) })}
                required
              >
                {usuarios && usuarios.length > 0 ? (
                  usuarios.map((usuario) => (
                    <MenuItem key={usuario.id} value={usuario.id}>
                      {usuario.first_name} {usuario.last_name} - {usuario.perfil?.cargo || 'Sin cargo'}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>
                    {usuarios ? 'No hay usuarios disponibles' : 'Cargando usuarios...'}
                  </MenuItem>
                )}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Tipo de Actividad</InputLabel>
              <Select
                value={formData.tipo_actividad}
                onChange={(e) => setFormData({ ...formData, tipo_actividad: e.target.value })}
                required
              >
                {TIPOS_ACTIVIDAD.map((tipo) => (
                  <MenuItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Fecha de Inicio"
              type="date"
              value={formData.fecha_inicio}
              onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
              required
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Fecha de Fin (opcional)"
              type="date"
              value={formData.fecha_fin}
              onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Estado</InputLabel>
              <Select
                value={formData.activo ? 'activo' : 'inactivo'}
                onChange={(e) => setFormData({ ...formData, activo: e.target.value === 'activo' })}
              >
                <MenuItem value="activo">Activo</MenuItem>
                <MenuItem value="inactivo">Inactivo</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenDialog(false);
              resetForm();
            }}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            startIcon={editingLider ? <EditIcon /> : <AddIcon />}
            disabled={loading}
            sx={{ 
              backgroundColor: editingLider ? '#ff9800' : '#4caf50',
              '&:hover': {
                backgroundColor: editingLider ? '#f57c00' : '#45a049'
              }
            }}
          >
            {loading ? <CircularProgress size={20} /> : (editingLider ? 'Actualizar' : 'Crear')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GestionLideresForm;
