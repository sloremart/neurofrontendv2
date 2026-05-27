
import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
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
  Settings as SettingsIcon,
  Work as WorkIcon
} from '@mui/icons-material';
import {
  getTiposComponente,
  createTipoComponente,
  updateTipoComponente,
  deleteTipoComponente,
} from '../store/thunks/ThunksEvaluacionDesempeño.tsx';

export default function TipoComponenteForm() {
  const dispatch = useDispatch();
  const [tipos, setTipos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTipo, setEditingTipo] = useState<any | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    porcentaje_total: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

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

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await fetchTipos();
        setLoading(false);
      } catch (error) {
        console.error('Error cargando datos:', error);
        setLoading(false);
      }
    };
    loadData();
  }, [fetchTipos]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!formData.porcentaje_total || parseFloat(formData.porcentaje_total) <= 0) {
      newErrors.porcentaje_total = 'El porcentaje debe ser mayor a 0';
    }
    
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

    const tipo = {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      porcentaje_total: parseFloat(formData.porcentaje_total)
    };

    try {
      setLoading(true);
      
      if (editingTipo) {
        await dispatch(updateTipoComponente(editingTipo.id, tipo) as any);
      } else {
        await dispatch(createTipoComponente(tipo) as any);
      }

      // Recargar datos
      await fetchTipos();

      setOpenDialog(false);
      resetForm();
      
    } catch (error: any) {
      console.error('Error al guardar tipo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tipo: any) => {
    setEditingTipo(tipo);
    setFormData({
      nombre: tipo.nombre,
      descripcion: tipo.descripcion || '',
      porcentaje_total: tipo.porcentaje_total.toString()
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este tipo de componente?')) {
      try {
        setLoading(true);
        
        await dispatch(deleteTipoComponente(id) as any);
        
        // Recargar datos
        await fetchTipos();
        
      } catch (error: any) {
        console.error('Error al eliminar tipo:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({ nombre: '', descripcion: '', porcentaje_total: '' });
    setEditingTipo(null);
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
        Gestión de Tipos de Componente
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
            Gestión de Tipos de Componente
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: '#666',
              fontWeight: 400,
              maxWidth: '600px'
            }}
          >
            Administra los tipos de componentes de evaluación del sistema
          </Typography>
        </Box>
      </Box>

      {/* Estadísticas */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Chip 
          label={`Total: ${tipos.length}`} 
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
          Nuevo Tipo de Componente
        </Button>
      </Box>

      {/* Modal para crear/editar tipo */}
      <Dialog 
        open={openDialog} 
        onClose={resetForm} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          {editingTipo ? 'Editar Tipo de Componente' : 'Nuevo Tipo de Componente'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              margin="dense"
              name="nombre"
              label="Nombre *"
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
              placeholder="Describe el propósito de este tipo de componente..."
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              margin="dense"
              name="porcentaje_total"
              label="Porcentaje Total *"
              type="number"
              value={formData.porcentaje_total}
              onChange={handleChange}
              inputProps={{ min: 0, max: 100, step: 0.01 }}
              helperText="Porcentaje que representa este tipo en la evaluación total"
              error={!!errors.porcentaje_total}
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
            {loading ? <CircularProgress size={20} /> : (editingTipo ? 'Actualizar' : 'Guardar')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tabla de Tipos de Componente */}
      <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, p: 0 }}>
          <TableContainer sx={{ flex: 1, overflowX: 'auto', minHeight: 0 }}>
            <Table stickyHeader sx={{ minWidth: 600 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 200, maxWidth: 300 }}>Nombre</TableCell>
                  <TableCell sx={{ minWidth: 200, maxWidth: 400 }}>Descripción</TableCell>
                  <TableCell sx={{ minWidth: 120, maxWidth: 150 }}>Porcentaje</TableCell>
                  <TableCell sx={{ minWidth: 100, maxWidth: 120 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Cargando tipos de componente...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : tipos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <Typography variant="h6" color="textSecondary">
                        No hay tipos de componente registrados
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Crea tu primer tipo usando el botón "Nuevo Tipo de Componente"
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  tipos
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((tipo: any) => (
                      <TableRow key={tipo.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium" noWrap title={tipo.nombre}>
                            {tipo.nombre}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap title={tipo.descripcion || 'Sin descripción'}>
                            {tipo.descripcion || 'Sin descripción'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${tipo.porcentaje_total}%`}
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
                                onClick={() => handleEdit(tipo)}
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
                                onClick={() => handleDelete(tipo.id)}
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
            count={tipos.length}
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