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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  TextField,
  Alert,
  Chip,
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
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Settings as SettingsIcon,
  Work as WorkIcon
} from '@mui/icons-material';
import {
  getComponentes,
  createComponente,
  updateComponente,
  deleteComponente,
  getTiposComponente,
  getAreas,
} from '../store/thunks/ThunksEvaluacionDesempeño.tsx';

export default function ComponenteForm() {
  const dispatch = useDispatch();
  const [componentes, setComponentes] = useState<any[]>([]);
  const [tipos, setTipos] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingComponente, setEditingComponente] = useState<any | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [formData, setFormData] = useState({
    tipo: '',
    area: '',
    es_360: false,
    descripcion: '',
    porcentaje: 0
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

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

  const fetchTipos = useCallback(async () => {
    try {
      const result = await dispatch(getTiposComponente() as any);
      if (result) {
        setTipos(result);
      }
    } catch (error) {
      console.error('Error fetching tipos:', error);
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

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Cargar componentes, tipos y áreas
        await Promise.all([
          fetchComponentes(),
          fetchTipos(),
          fetchAreas()
        ]);
        
        setLoading(false);
      } catch (error) {
        console.error('Error cargando datos:', error);
        setLoading(false);
      }
    };
    loadData();
  }, [fetchComponentes, fetchTipos, fetchAreas]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.tipo) newErrors.tipo = 'Debe seleccionar un tipo de componente';
    if (!formData.area) newErrors.area = 'Debe seleccionar un área';
    if (formData.porcentaje < 0 || formData.porcentaje > 100) {
      newErrors.porcentaje = 'El porcentaje debe estar entre 0 y 100';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const componente = {
      tipo: parseInt(formData.tipo),
      area: parseInt(formData.area),
      es_360: formData.es_360,
      descripcion: formData.descripcion,
      porcentaje: parseFloat(formData.porcentaje as any)
    };

    try {
      setLoading(true);
      
      if (editingComponente) {
        await dispatch(updateComponente(editingComponente.id, componente) as any);
      } else {
        await dispatch(createComponente(componente) as any);
      }

      // Recargar datos
      await fetchComponentes();

      setOpenDialog(false);
      resetForm();
      
    } catch (error: any) {
      console.error('Error al guardar componente:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (comp: any) => {
    setEditingComponente(comp);
    setFormData({
      tipo: comp.tipo?.toString() || '',
      area: comp.area?.toString() || '',
      es_360: comp.es_360 || false,
      descripcion: comp.descripcion || '',
      porcentaje: comp.porcentaje || 0
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este componente?')) {
      try {
        setLoading(true);
        
        await dispatch(deleteComponente(id) as any);
        
        // Recargar datos
        await fetchComponentes();
        
      } catch (error: any) {
        console.error('Error al eliminar componente:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({ tipo: '', area: '', es_360: false, descripcion: '', porcentaje: 0 });
    setEditingComponente(null);
    setOpenDialog(false);
    setErrors({});
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getComponenteStats = () => {
    const total = componentes.length;
    const componentes360 = componentes.filter((c: any) => c.es_360).length;
    const componentesNormales = total - componentes360;
    
    return { total, componentes360, componentesNormales };
  };

  const stats = getComponenteStats();

  return (
    <Box sx={{ p: 3, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#1976d2', mb: 3 }}>
        <WorkIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
        Gestión de Componentes
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
          <SettingsIcon 
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
            Gestión de Componentes
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: '#666',
              fontWeight: 400,
              maxWidth: '600px'
            }}
          >
            Administra los componentes de evaluación del sistema
          </Typography>
        </Box>
      </Box>

      {/* Estadísticas */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Chip 
          label={`Total: ${stats.total}`} 
          color="primary" 
          variant="outlined" 
        />
        <Chip 
          label={`360°: ${stats.componentes360}`} 
          color="success" 
          variant="outlined" 
        />
        <Chip 
          label={`Normales: ${stats.componentesNormales}`} 
          color="default" 
          variant="outlined" 
        />
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
          Nuevo Componente
        </Button>
      </Box>

      {/* Modal para crear/editar componente */}
      <Dialog 
        open={openDialog} 
        onClose={resetForm} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          {editingComponente ? 'Editar Componente' : 'Nuevo Componente'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ pt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              {/* Select de Tipo */}
              <FormControl fullWidth error={!!errors.tipo}>
                <InputLabel>Tipo de Componente *</InputLabel>
                <Select 
                  name="tipo"
                  value={formData.tipo} 
                  onChange={handleChange} 
                  label="Tipo de Componente *"
                >
                  {tipos.map((t: any) => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.nombre} ({t.porcentaje_total}%)
                    </MenuItem>
                  ))}
                </Select>
                {errors.tipo && <Typography variant="caption" color="error">{errors.tipo}</Typography>}
              </FormControl>

              {/* Select de Área */}
              <FormControl fullWidth error={!!errors.area}>
                <InputLabel>Área *</InputLabel>
                <Select 
                  name="area"
                  value={formData.area} 
                  onChange={handleChange} 
                  label="Área *"
                >
                  {areas.map((a: any) => (
                    <MenuItem key={a.id} value={a.id}>{a.nombre}</MenuItem>
                  ))}
                </Select>
                {errors.area && <Typography variant="caption" color="error">{errors.area}</Typography>}
              </FormControl>
            </Box>

            {/* Descripción */}
            <TextField
              fullWidth
              margin="dense"
              name="descripcion"
              label="Descripción del Componente"
              value={formData.descripcion}
              onChange={handleChange}
              multiline
              rows={3}
              placeholder="Describa el propósito y alcance de este componente..."
            />

            {/* Porcentaje */}
            <TextField
              fullWidth
              margin="dense"
              name="porcentaje"
              label="Porcentaje de Peso"
              type="number"
              value={formData.porcentaje}
              onChange={handleChange}
              inputProps={{ min: 0, max: 100, step: 0.01 }}
              helperText="Porcentaje que representa este componente en la evaluación total"
              error={!!errors.porcentaje}
            />

            {/* Checkbox de es_360 */}
            <FormControlLabel
              control={
                <Checkbox
                  name="es_360"
                  checked={formData.es_360}
                  onChange={handleChange}
                />
              }
              label="¿Es componente 360°?"
              sx={{ mt: 2 }}
            />

            {formData.es_360 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Este componente será utilizado para evaluaciones 360°, 180° y 90°. 
                Las preguntas asociadas serán respondidas por diferentes evaluadores.
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
            {loading ? <CircularProgress size={20} /> : (editingComponente ? 'Actualizar' : 'Guardar')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tabla de Componentes */}
      <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, p: 0 }}>
          <TableContainer sx={{ flex: 1, overflowX: 'auto', minHeight: 0 }}>
            <Table stickyHeader sx={{ minWidth: 600 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 200, maxWidth: 300 }}>Tipo - Área</TableCell>
                  <TableCell sx={{ minWidth: 200, maxWidth: 400 }}>Descripción</TableCell>
                  <TableCell sx={{ minWidth: 100, maxWidth: 120 }}>Tipo</TableCell>
                  <TableCell sx={{ minWidth: 100, maxWidth: 120 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Cargando componentes...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : componentes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <Typography variant="h6" color="textSecondary">
                        No hay componentes configurados
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Crea tu primer componente usando el botón "Nuevo Componente"
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  componentes
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((comp: any) => (
                      <TableRow key={comp.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium" noWrap title={`${comp.tipo_nombre} - ${comp.area_nombre}`}>
                            {comp.tipo_nombre} - {comp.area_nombre}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap title={comp.descripcion || 'Sin descripción'}>
                            {comp.descripcion || 'Sin descripción'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={comp.es_360 ? '360°' : 'Normal'}
                            size="small"
                            color={comp.es_360 ? 'success' : 'default'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Editar">
                              <IconButton
                                size="small"
                                onClick={() => handleEdit(comp)}
                                sx={{
                                  color: '#1976d2',
                                  '&:hover': {
                                    backgroundColor: '#e3f2fd'
                                  }
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar">
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(comp.id)}
                                sx={{
                                  color: '#d32f2f',
                                  '&:hover': {
                                    backgroundColor: '#ffebee'
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
          
          {/* Paginación */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={componentes.length}
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
