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
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Quiz as QuizIcon,
  Work as WorkIcon
} from '@mui/icons-material';
import {
  getComponentes,
  getCategoriasPreguntas,
  createCategoriaPregunta,
  updateCategoriaPregunta,
  deleteCategoriaPregunta
} from '../store/thunks/ThunksEvaluacionDesempeño.tsx';

export default function CategoriaPreguntaForm() {
  const dispatch = useDispatch();
  const [componentes, setComponentes] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<any | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    componente: '',
    orden: 0
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

  const fetchCategorias = useCallback(async () => {
    try {
      const result = await dispatch(getCategoriasPreguntas() as any);
      if (result) {
        setCategorias(result);
      }
    } catch (error) {
      console.error('Error fetching categorias:', error);
    }
  }, [dispatch]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Cargar componentes y categorías
        await Promise.all([
          fetchComponentes(),
          fetchCategorias()
        ]);
        
        setLoading(false);
      } catch (error) {
        console.error('Error cargando datos:', error);
        setLoading(false);
      }
    };
    loadData();
  }, [fetchComponentes, fetchCategorias]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!formData.componente) newErrors.componente = 'Debe seleccionar un componente';
    if (formData.orden < 0) newErrors.orden = 'El orden debe ser mayor o igual a 0';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      ...formData,
      componente: parseInt(formData.componente as any),
      orden: parseInt(formData.orden as any)
    };

    try {
      setLoading(true);
      
      if (editingCategoria) {
        await dispatch(updateCategoriaPregunta(editingCategoria.id, payload) as any);
      } else {
        await dispatch(createCategoriaPregunta(payload) as any);
      }

      // Recargar datos
      await fetchCategorias();

      setOpenDialog(false);
      resetForm();
      
    } catch (error: any) {
      console.error('Error al guardar categoría:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (categoria: any) => {
    setEditingCategoria(categoria);
    setFormData({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || '',
      componente: categoria.componente?.toString() || '',
      orden: categoria.orden || 0
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      try {
        setLoading(true);
        
        await dispatch(deleteCategoriaPregunta(id) as any);
        
        // Recargar datos
        await fetchCategorias();
        
      } catch (error: any) {
        console.error('Error al eliminar categoría:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({ nombre: '', descripcion: '', componente: '', orden: 0 });
    setEditingCategoria(null);
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

  return (
    <Box sx={{ p: 3, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#1976d2', mb: 3 }}>
        <WorkIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
        Gestión de Categorías de Preguntas
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
          <QuizIcon 
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
            Gestión de Categorías de Preguntas
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: '#666',
              fontWeight: 400,
              maxWidth: '600px'
            }}
          >
            Administra las categorías de preguntas para evaluaciones 360°
          </Typography>
        </Box>
      </Box>

      {/* Estadísticas */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Chip 
          label={`Total: ${categorias.length}`} 
          color="primary" 
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
          Nueva Categoría
        </Button>
      </Box>

      {/* Modal para crear/editar categoría */}
      <Dialog 
        open={openDialog} 
        onClose={resetForm} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          {editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ pt: 1 }}>
            <FormControl fullWidth error={!!errors.componente} sx={{ mb: 2 }}>
              <InputLabel>Componente *</InputLabel>
              <Select
                name="componente"
                value={formData.componente}
                onChange={handleChange}
                label="Componente *"
              >
                {componentes.filter((c: any) => c.es_360).map((c: any) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.tipo_nombre} - {c.area_nombre}
                  </MenuItem>
                ))}
              </Select>
              {errors.componente && <Typography variant="caption" color="error">{errors.componente}</Typography>}
            </FormControl>

            <TextField
              fullWidth
              margin="dense"
              name="nombre"
              label="Nombre de la Categoría *"
              value={formData.nombre}
              onChange={handleChange}
              error={!!errors.nombre}
              helperText={errors.nombre}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              margin="dense"
              name="descripcion"
              label="Descripción"
              value={formData.descripcion}
              onChange={handleChange}
              multiline
              rows={3}
              placeholder="Describe el propósito de esta categoría..."
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              margin="dense"
              name="orden"
              label="Orden"
              type="number"
              value={formData.orden}
              onChange={handleChange}
              inputProps={{ min: 0 }}
              helperText="Orden de aparición en la evaluación"
              error={!!errors.orden}
              sx={{ mb: 2 }}
            />
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
            {loading ? <CircularProgress size={20} /> : (editingCategoria ? 'Actualizar' : 'Guardar')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tabla de Categorías de Preguntas */}
      <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, p: 0 }}>
          <TableContainer sx={{ flex: 1, overflowX: 'auto', minHeight: 0 }}>
            <Table stickyHeader sx={{ minWidth: 600 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 200, maxWidth: 300 }}>Nombre</TableCell>
                  <TableCell sx={{ minWidth: 200, maxWidth: 400 }}>Componente</TableCell>
                  <TableCell sx={{ minWidth: 150, maxWidth: 200 }}>Descripción</TableCell>
                  <TableCell sx={{ minWidth: 100, maxWidth: 120 }}>Orden</TableCell>
                  <TableCell sx={{ minWidth: 100, maxWidth: 120 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Cargando categorías...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : categorias.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography variant="h6" color="textSecondary">
                        No hay categorías de preguntas registradas
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Crea tu primera categoría usando el botón "Nueva Categoría"
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  categorias
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((categoria: any) => {
                      const componente = componentes.find((c: any) => c.id === categoria.componente);
                      return (
                        <TableRow key={categoria.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium" noWrap title={categoria.nombre}>
                              {categoria.nombre}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap title={componente ? `${componente.tipo_nombre} - ${componente.area_nombre}` : 'Componente no encontrado'}>
                              {componente ? `${componente.tipo_nombre} - ${componente.area_nombre}` : 'Componente no encontrado'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap title={categoria.descripcion || 'Sin descripción'}>
                              {categoria.descripcion || 'Sin descripción'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={categoria.orden}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="Editar">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEdit(categoria)}
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
                                  onClick={() => handleDelete(categoria.id)}
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
            count={categorias.length}
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