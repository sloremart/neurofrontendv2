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
  Paper,
  IconButton,
  CircularProgress,
  TablePagination,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Work as WorkIcon
} from '@mui/icons-material';
import { createArea, deleteArea, getAreas, updateArea } from '../store/thunks/ThunksEvaluacionDesempeño.tsx';

export default function AreasForm() {
  const dispatch = useDispatch();
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingArea, setEditingArea] = useState<any | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [formData, setFormData] = useState({
    nombre: ''
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

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await fetchAreas();
        setLoading(false);
      } catch (error) {
        console.error('Error cargando datos:', error);
        setLoading(false);
      }
    };
    loadData();
  }, [fetchAreas]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return;

    try {
      setLoading(true);
      
      if (editingArea) {
        await dispatch(updateArea(editingArea.id, formData) as any);
      } else {
        await dispatch(createArea(formData) as any);
      }

      // Recargar datos
      await fetchAreas();

      setOpenDialog(false);
      resetForm();
      
    } catch (error: any) {
      console.error('Error al guardar área:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (area: any) => {
    setEditingArea(area);
    setFormData({ nombre: area.nombre });
    setOpenDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta área?')) {
      try {
        setLoading(true);
        
        await dispatch(deleteArea(id) as any);
        
        // Recargar datos
        await fetchAreas();
        
      } catch (error: any) {
        console.error('Error al eliminar área:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({ nombre: '' });
    setEditingArea(null);
    setOpenDialog(false);
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
        Gestión de Áreas
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
            Gestión de Áreas
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: '#666',
              fontWeight: 400,
              maxWidth: '600px'
            }}
          >
            Administra las áreas organizacionales del sistema
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
          Nueva Área
        </Button>
      </Box>

      {/* Tabla de Áreas */}
      <Card elevation={3} sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', mb: 2 }}>
            Áreas Configuradas
          </Typography>
          
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <TableContainer sx={{ flex: 1, overflowX: 'auto', minHeight: 0, maxHeight: '70vh' }}>
                <Table stickyHeader sx={{ minWidth: 600 }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ minWidth: 200, maxWidth: 300 }}><strong>Nombre del Área</strong></TableCell>
                      <TableCell sx={{ minWidth: 120, maxWidth: 150 }}><strong>Acciones</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {areas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} align="center" sx={{ py: 4, color: '#666' }}>
                          No hay áreas configuradas
                        </TableCell>
                      </TableRow>
                    ) : (
                      areas
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((area) => (
                        <TableRow key={area.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <BusinessIcon sx={{ mr: 1, color: '#1976d2' }} />
                              <Typography variant="body1" fontWeight="medium">
                                {area.nombre}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="Editar">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEdit(area)}
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
                                  onClick={() => handleDelete(area.id)}
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
                count={areas.length}
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

      {/* Modal para crear/editar área */}
      <Dialog 
        open={openDialog} 
        onClose={() => {
          setOpenDialog(false);
          resetForm();
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: '#1976d2', fontWeight: 'bold' }}>
          {editingArea ? 'Editar Área' : 'Nueva Área'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Nombre del Área"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
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
            startIcon={editingArea ? <EditIcon /> : <AddIcon />}
            disabled={loading}
            sx={{ 
              backgroundColor: editingArea ? '#ff9800' : '#4caf50',
              '&:hover': {
                backgroundColor: editingArea ? '#f57c00' : '#45a049'
              }
            }}
          >
            {loading ? <CircularProgress size={20} /> : (editingArea ? 'Actualizar' : 'Crear')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
