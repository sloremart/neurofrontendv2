import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  Button,
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
  Paper,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  TablePagination,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Work as WorkIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { 
  getAreas, 
  getContratosUsuarios, 
  createContratoUsuario, 
  updateContratoUsuario, 
  deleteContratoUsuario,
  getUsuarios
} from '../store/thunks/ThunksEvaluacionDesempeño.tsx';

interface ContratoUsuario {
  id?: number;
  usuario_id: number;
  identificacion: string;
  area: number;
  tipo_contrato: string;
  fecha_inicio: string;
  fecha_fin?: string | null;
  cargo: string;
  salario: number;
  activo: boolean;
  area_nombre?: string;
  usuario_nombre?: string;
}

const TIPOS_CONTRATO = [
  { value: 'TERMINO_FIJO', label: 'Término Fijo' },
  { value: 'INDEFINIDO', label: 'Indefinido' },
  { value: 'PRESTACION_SERVICIOS', label: 'Prestación de Servicios' },
  { value: 'APRENDIZAJE', label: 'Aprendizaje' }
];

const isIndefinido = (tipo: string) => tipo === 'INDEFINIDO';

const GestionContratosForm: React.FC = () => {
  const dispatch = useDispatch();

  // Estados principales
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [contratos, setContratos] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingContrato, setEditingContrato] = useState<ContratoUsuario | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Estado para paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Estado para modal
  const [openModal, setOpenModal] = useState(false);

  const [formData, setFormData] = useState<ContratoUsuario>({
    usuario_id: 0,
    identificacion: '',
    area: 0,
    tipo_contrato: 'TERMINO_FIJO',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: '',
    cargo: '',
    salario: 0,
    activo: true
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

  const fetchContratos = useCallback(async () => {
    try {
      const result = await dispatch(getContratosUsuarios() as any);
      if (result) {
        setContratos(result);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
    }
  }, [dispatch]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Cargar áreas, usuarios y contratos
        await Promise.all([
          fetchAreas(),
          fetchUsuarios(),
          fetchContratos()
        ]);
        
        setLoading(false);
      } catch (error) {
        console.error('Error cargando datos:', error);
        setLoading(false);
      }
    };
    loadData();
  }, [dispatch, fetchAreas, fetchUsuarios, fetchContratos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Preparar datos del formulario
      const contratoData = { ...formData };
      
      // Si es contrato indefinido, enviar fecha_fin como null
      if (isIndefinido(contratoData.tipo_contrato)) {
        contratoData.fecha_fin = null;
      }

      if (editingContrato) {
        console.log('🔄 Actualizando contrato:', editingContrato.id);
        await dispatch(updateContratoUsuario(editingContrato.id!, contratoData) as any);
        console.log('✅ Contrato actualizado exitosamente');
        showSnackbar('Contrato actualizado exitosamente', 'success');
      } else {
        console.log('➕ Creando nuevo contrato');
        await dispatch(createContratoUsuario(contratoData) as any);
        console.log('✅ Contrato creado exitosamente');
        showSnackbar('Contrato creado exitosamente', 'success');
      }

      // SINCRONIZACIÓN ROBUSTA: Recargar datos inmediatamente + diferido
      console.log('🔄 SINCRONIZANDO: Recargando contratos desde backend...');
      await fetchContratos();
      
      // Cerrar modal si está abierto
      setOpenModal(false);
      resetForm();
    } catch (error) {
      console.error('Error:', error);
      showSnackbar('Error al procesar la solicitud', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (contrato: ContratoUsuario) => {
    setEditingContrato(contrato);
    setFormData({
      ...contrato,
      fecha_inicio: formatDateForInput(contrato.fecha_inicio),
      fecha_fin: contrato.fecha_fin ? formatDateForInput(contrato.fecha_fin) : ''
    });
    setOpenModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este contrato?')) {
      try {
        setLoading(true);
        await dispatch(deleteContratoUsuario(id) as any);
        showSnackbar('Contrato eliminado exitosamente', 'success');
        await fetchContratos();
      } catch (error) {
        console.error('Error:', error);
        showSnackbar('Error al eliminar contrato', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      usuario_id: 0,
      identificacion: '',
      area: 0,
      tipo_contrato: 'TERMINO_FIJO',
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_fin: '',
      cargo: '',
      salario: 0,
      activo: true
    });
    setEditingContrato(null);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  // Funciones para paginación
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getTipoContratoLabel = (value: string) => {
    return TIPOS_CONTRATO.find(tipo => tipo.value === value)?.label || value;
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00.000Z');
    return date.toISOString().split('T')[0];
  };

  const formatDateColombia = (dateString: string) => {
    if (!dateString) return '';
    // Crear fecha en zona horaria de Colombia (UTC-5)
    const date = new Date(dateString + 'T00:00:00.000-05:00');
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <Box sx={{ p: 3, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#1976d2', mb: 3 }}>
        <WorkIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
        Gestión de Contratos de Usuarios
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
          <WorkIcon 
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
            Gestión de Contratos
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: '#666',
              fontWeight: 400,
              maxWidth: '600px'
            }}
          >
            Administra los contratos de los usuarios del sistema
          </Typography>
        </Box>
      </Box>

      {/* Mostrar indicador de carga */}
      {loading && (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="h6" color="primary">
            Cargando datos...
          </Typography>
        </Box>
      )}

      {/* Mostrar mensaje si no hay contratos */}
      {!loading && (!contratos || contratos.length === 0) && (
        <Box sx={{ p: 3, textAlign: 'center', backgroundColor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="h6" color="textSecondary">
            No hay contratos registrados
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Crea tu primer contrato usando el botón "Nuevo Contrato"
          </Typography>
        </Box>
      )}

      {/* Botón para abrir modal de nuevo contrato */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            resetForm();
            setOpenModal(true);
          }}
          sx={{ 
            backgroundColor: '#1976d2',
            '&:hover': { backgroundColor: '#1565c0' }
          }}
        >
          Nuevo Contrato
        </Button>
      </Box>

      {/* Tabla de Contratos - Ocupa toda la vista */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Card elevation={3} sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 0, minHeight: 0 }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ color: '#1976d2' }}>
                Contratos Configurados
              </Typography>
            </Box>
            
            {loading ? (
              <Box display="flex" justifyContent="center" p={3} sx={{ flex: 1 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <TableContainer component={Paper} variant="outlined" sx={{ flex: 1, overflowX: 'auto', minHeight: 0 }}>
                  <Table stickyHeader sx={{ minWidth: 800 }}>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell sx={{ minWidth: 200, maxWidth: 200 }}><strong>Usuario</strong></TableCell>
                        <TableCell sx={{ minWidth: 120, maxWidth: 120 }}><strong>Área</strong></TableCell>
                        <TableCell sx={{ minWidth: 120, maxWidth: 120 }}><strong>Tipo</strong></TableCell>
                        <TableCell sx={{ minWidth: 150, maxWidth: 150 }}><strong>Cargo</strong></TableCell>
                        <TableCell sx={{ minWidth: 140, maxWidth: 140 }}><strong>Fechas</strong></TableCell>
                        <TableCell sx={{ minWidth: 80, maxWidth: 80 }}><strong>Estado</strong></TableCell>
                        <TableCell sx={{ minWidth: 100, maxWidth: 100 }}><strong>Acciones</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {contratos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#666' }}>
                            No hay contratos configurados
                          </TableCell>
                        </TableRow>
                      ) : (
                        contratos
                          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                          .map((contrato) => (
                          <TableRow key={contrato.id} hover>
                            <TableCell sx={{ minWidth: 200, maxWidth: 200 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PersonIcon sx={{ color: '#1976d2', fontSize: 20 }} />
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                  <Typography variant="body2" fontWeight="medium" noWrap>
                                    {contrato.usuario_nombre || 'Usuario no encontrado'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" noWrap>
                                    {contrato.identificacion || 'Sin identificación'}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            
                            <TableCell sx={{ minWidth: 120, maxWidth: 120 }}>
                              <Chip 
                                icon={<BusinessIcon />} 
                                label={contrato.area_nombre}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ maxWidth: '100%' }}
                              />
                            </TableCell>
                            <TableCell sx={{ minWidth: 120, maxWidth: 120 }}>
                              <Chip 
                                label={getTipoContratoLabel(contrato.tipo_contrato)}
                                size="small"
                                color="info"
                                variant="outlined"
                                sx={{ maxWidth: '100%' }}
                              />
                            </TableCell>
                            <TableCell sx={{ minWidth: 150, maxWidth: 150 }}>
                              <Typography variant="body2" noWrap title={contrato.cargo}>
                                {contrato.cargo}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ minWidth: 140, maxWidth: 140 }}>
                              <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                  <CalendarIcon sx={{ fontSize: 12, mr: 0.5, color: '#1976d2' }} />
                                  <Typography variant="caption" fontWeight="medium" noWrap>
                                    {formatDateColombia(contrato.fecha_inicio)}
                                  </Typography>
                                </Box>
                                {contrato.fecha_fin && (
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <CalendarIcon sx={{ fontSize: 12, mr: 0.5, color: '#d32f2f' }} />
                                    <Typography variant="caption" fontWeight="medium" noWrap>
                                      {formatDateColombia(contrato.fecha_fin)}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell sx={{ minWidth: 80, maxWidth: 80 }}>
                              <Chip 
                                label={contrato.activo ? 'Activo' : 'Inactivo'}
                                color={contrato.activo ? 'success' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell sx={{ minWidth: 100, maxWidth: 100 }}>
                              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleEdit(contrato)}
                                  color="primary"
                                  sx={{ 
                                    '&:hover': { 
                                      backgroundColor: '#e3f2fd',
                                      transform: 'scale(1.1)'
                                    },
                                    transition: 'all 0.2s ease-in-out'
                                  }}
                                  title="Editar contrato"
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => contrato.id && handleDelete(contrato.id)}
                                  color="error"
                                  sx={{ 
                                    '&:hover': { 
                                      backgroundColor: '#ffebee',
                                      transform: 'scale(1.1)'
                                    },
                                    transition: 'all 0.2s ease-in-out'
                                  }}
                                  title="Eliminar contrato"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
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
                  count={contratos.length}
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
      </Box>

      {/* Modal para crear/editar contrato */}
      <Dialog 
        open={openModal} 
        onClose={() => {
          setOpenModal(false);
          resetForm();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingContrato ? 'Editar Contrato' : 'Nuevo Contrato'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Usuario</InputLabel>
              <Select
                value={formData.usuario_id || ''}
                onChange={(e) => setFormData({ ...formData, usuario_id: Number(e.target.value) })}
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

            <TextField
              fullWidth
              label="Número de Identificación"
              placeholder="Cédula, pasaporte, etc."
              value={formData.identificacion}
              onChange={(e) => setFormData({ ...formData, identificacion: e.target.value })}
              helperText="Número de identificación del usuario"
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Área</InputLabel>
              <Select
                value={formData.area || ''}
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
              <InputLabel>Tipo de Contrato</InputLabel>
              <Select
                value={formData.tipo_contrato}
                onChange={(e) => {
                  const newTipo = e.target.value;
                  const newFormData = { 
                    ...formData, 
                    tipo_contrato: newTipo
                  };
                  // Establecer fecha_fin como null si es indefinido
                  if (isIndefinido(newTipo)) {
                    newFormData.fecha_fin = null;
                  }
                  setFormData(newFormData);
                }}
                required
              >
                {TIPOS_CONTRATO.map((tipo) => (
                  <MenuItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Cargo"
              value={formData.cargo}
              onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
              sx={{ mb: 2 }}
            />

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
              label={isIndefinido(formData.tipo_contrato) ? "Fecha de Fin (no aplica para indefinido)" : "Fecha de Fin (opcional)"}
              type="date"
              value={formData.fecha_fin || ''}
              onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
              InputLabelProps={{ shrink: true }}
              disabled={isIndefinido(formData.tipo_contrato)}
              required={!isIndefinido(formData.tipo_contrato)}
              helperText={isIndefinido(formData.tipo_contrato) ? "Los contratos indefinidos no requieren fecha de fin" : "Dejar vacío para contratos indefinidos"}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Estado</InputLabel>
              <Select
                value={formData.activo ? 'activo' : 'inactivo'}
                onChange={(e) => setFormData({ ...formData, activo: e.target.value === 'activo' })}
                required
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
              setOpenModal(false);
              resetForm();
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            startIcon={editingContrato ? <EditIcon /> : <AddIcon />}
            disabled={loading}
            sx={{ 
              backgroundColor: editingContrato ? '#ff9800' : '#4caf50',
              '&:hover': {
                backgroundColor: editingContrato ? '#f57c00' : '#45a049'
              }
            }}
          >
            {loading ? <CircularProgress size={20} /> : (editingContrato ? 'Actualizar' : 'Crear')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GestionContratosForm;
