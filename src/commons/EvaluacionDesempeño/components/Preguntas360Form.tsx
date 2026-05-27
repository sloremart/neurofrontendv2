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
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Quiz as QuizIcon,
  Work as WorkIcon
} from '@mui/icons-material';
import {
  createPregunta360,
  deletePregunta360,
  getComponentes,
  getPreguntas360,
  updatePregunta360,
  getCategoriasPreguntas
} from '../store/thunks/ThunksEvaluacionDesempeño.tsx';

export default function PreguntaForm() {
  const dispatch = useDispatch();
  const [preguntas, setPreguntas] = useState<any[]>([]);
  const [componentes, setComponentes] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPregunta, setEditingPregunta] = useState<any | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [formData, setFormData] = useState({
    componente: '',
    categoria: '',
    texto: '',
    tipo: 'LIKERT',
    obligatoria: true,
    peso: 1.00
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const fetchPreguntas = useCallback(async () => {
    try {
      const result = await dispatch(getPreguntas360() as any);
      if (result) {
        setPreguntas(result);
      }
    } catch (error) {
      console.error('Error fetching preguntas:', error);
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
        
        // Cargar preguntas, componentes y categorías
        await Promise.all([
          fetchPreguntas(),
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
  }, [fetchPreguntas, fetchComponentes, fetchCategorias]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.componente) newErrors.componente = 'Debe seleccionar un componente';
    if (!formData.texto.trim()) newErrors.texto = 'El texto de la pregunta es requerido';
    if (formData.peso <= 0) newErrors.peso = 'El peso debe ser mayor a 0';
    
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

    const payload = {
      ...formData,
      categoria: formData.categoria ? parseInt(formData.categoria as any) : null,
      peso: parseFloat(formData.peso as any)
    };

    try {
      setLoading(true);
      
      if (editingPregunta) {
        await dispatch(updatePregunta360(editingPregunta.id, payload) as any);
      } else {
        await dispatch(createPregunta360(payload) as any);
      }

      // Recargar datos
      await fetchPreguntas();

      setOpenDialog(false);
      resetForm();
      
    } catch (error: any) {
      console.error('Error al guardar pregunta:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (preg: any) => {
    setEditingPregunta(preg);
    setFormData({
      componente: preg.componente?.toString() || '',
      categoria: preg.categoria?.toString() || '',
      texto: preg.texto || '',
      tipo: preg.tipo || 'LIKERT',
      obligatoria: preg.obligatoria !== false,
      peso: preg.peso || 1.00
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta pregunta?')) {
      try {
        setLoading(true);
        
        await dispatch(deletePregunta360(id) as any);
        
        // Recargar datos
        await fetchPreguntas();
        
      } catch (error: any) {
        console.error('Error al eliminar pregunta:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({ componente: '', categoria: '', texto: '', tipo: 'LIKERT', obligatoria: true, peso: 1.00 });
    setEditingPregunta(null);
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
        Gestión de Preguntas 360°
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
            Gestión de Preguntas 360°
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: '#666',
              fontWeight: 400,
              maxWidth: '600px'
            }}
          >
            Administra las preguntas para evaluaciones 360°
          </Typography>
        </Box>
      </Box>

      {/* Estadísticas */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Chip 
          label={`Total: ${preguntas.length}`} 
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
          Nueva Pregunta 360°
        </Button>
      </Box>

      {/* Modal para crear/editar pregunta */}
      <Dialog 
        open={openDialog} 
        onClose={resetForm} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          {editingPregunta ? 'Editar Pregunta 360°' : 'Nueva Pregunta 360°'}
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

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Categoría</InputLabel>
              <Select
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                label="Categoría"
              >
                {categorias
                  .filter((cat: any) => !formData.componente || cat.componente === parseInt(formData.componente))
                  .map((categoria: any) => (
                    <MenuItem key={categoria.id} value={categoria.id}>
                      {categoria.nombre}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              margin="dense"
              name="texto"
              label="Pregunta *"
              value={formData.texto}
              onChange={handleChange}
              multiline
              rows={3}
              placeholder="Escribe la pregunta aquí..."
              error={!!errors.texto}
              helperText={errors.texto}
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Pregunta</InputLabel>
                <Select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  label="Tipo de Pregunta"
                >
                  <MenuItem value="LIKERT">Escala Likert</MenuItem>
                  <MenuItem value="ABIERTA">Pregunta Abierta</MenuItem>
                  <MenuItem value="MULTIPLE">Opción Múltiple</MenuItem>
                  <MenuItem value="BOOLEANA">Sí/No</MenuItem>
                  <MenuItem value="NUMERICA">Valor Numérico</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                name="peso"
                label="Peso de la Pregunta"
                type="number"
                inputProps={{ step: 0.01, min: 0, max: 10 }}
                value={formData.peso}
                onChange={handleChange}
                helperText="Peso (0.01 - 10.00)"
                error={!!errors.peso}
                sx={{ minWidth: 150 }}
              />
            </Box>

            <FormControlLabel
              control={
                <Checkbox
                  name="obligatoria"
                  checked={formData.obligatoria}
                  onChange={handleChange}
                />
              }
              label="Pregunta Obligatoria"
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
            {loading ? <CircularProgress size={20} /> : (editingPregunta ? 'Actualizar' : 'Guardar')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tabla de Preguntas 360° */}
      <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, p: 0 }}>
          <TableContainer sx={{ flex: 1, overflowX: 'auto', minHeight: 0 }}>
            <Table stickyHeader sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 300, maxWidth: 400 }}>Pregunta</TableCell>
                  <TableCell sx={{ minWidth: 150, maxWidth: 200 }}>Componente</TableCell>
                  <TableCell sx={{ minWidth: 120, maxWidth: 150 }}>Categoría</TableCell>
                  <TableCell sx={{ minWidth: 100, maxWidth: 120 }}>Tipo</TableCell>
                  <TableCell sx={{ minWidth: 80, maxWidth: 100 }}>Peso</TableCell>
                  <TableCell sx={{ minWidth: 100, maxWidth: 120 }}>Obligatoria</TableCell>
                  <TableCell sx={{ minWidth: 100, maxWidth: 120 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Cargando preguntas...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : preguntas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography variant="h6" color="textSecondary">
                        No hay preguntas 360° registradas
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Crea tu primera pregunta usando el botón "Nueva Pregunta 360°"
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  preguntas
                    .filter((p: any) => {
                      const componente = componentes.find((c: any) => c.id === p.componente);
                      return componente && componente.es_360;
                    })
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((p: any) => {
                      const componente = componentes.find((c: any) => c.id === p.componente);
                      const categoria = categorias.find((c: any) => c.id === p.categoria);
                      
                      return (
                        <TableRow key={p.id} hover>
                          <TableCell>
                            <Typography variant="body2" noWrap title={p.texto}>
                              {p.texto.length > 60 ? `${p.texto.substring(0, 60)}...` : p.texto}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap title={componente ? `${componente.tipo_nombre} - ${componente.area_nombre}` : 'Componente no encontrado'}>
                              {componente ? `${componente.tipo_nombre} - ${componente.area_nombre}` : 'Componente no encontrado'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap title={categoria ? categoria.nombre : 'Sin categoría'}>
                              {categoria ? categoria.nombre : 'Sin categoría'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={p.tipo === 'BOOLEANA' ? 'Sí/No' : p.tipo}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={p.peso}
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={p.obligatoria ? 'Sí' : 'No'}
                              size="small"
                              color={p.obligatoria ? 'success' : 'default'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="Editar">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEdit(p)}
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
                                  onClick={() => handleDelete(p.id)}
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
            count={preguntas.filter((p: any) => {
              const componente = componentes.find((c: any) => c.id === p.componente);
              return componente && componente.es_360;
            }).length}
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
