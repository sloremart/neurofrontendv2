import {
  Box, Typography, Card, CardContent, Button, Table, 
  TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Paper, Chip, Switch, FormControlLabel,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem,
  Alert, LinearProgress
} from '@mui/material';
import {
  People, Assignment, AutoAwesome, CheckCircle, 
  Warning, Edit, Delete, Add
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { getEvaluaciones, getComponentes } from '../store/thunks/ThunksEvaluacionDesempeño.tsx';
import React from 'react';

interface AsignacionEvaluador {
  id: number;
  evaluacion_id: number;
  evaluador_id: number;
  tipo_evaluador: 'lider' | 'par' | 'subordinado' | 'autoevaluacion';
  nombre_evaluador: string;
  nombre_evaluado: string;
  estado: 'pendiente' | 'completada' | 'en_progreso';
  fecha_asignacion: string;
}

export default function AsignacionEvaluadores() {
  const dispatch = useDispatch();
  const evaluaciones = useSelector((state: RootState) => state.evaluacion?.evaluaciones || []);
  const componentes = useSelector((state: RootState) => state.evaluacion?.componentes || []);
  const preguntas360 = useSelector((state: RootState) => state.evaluacion?.preguntas360 || []);

  const [asignaciones, setAsignaciones] = useState<AsignacionEvaluador[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editAsignacion, setEditAsignacion] = useState<AsignacionEvaluador | null>(null);
  const [autoAsignacion, setAutoAsignacion] = useState(true);
  const [loading, setLoading] = useState(false);

  // Datos simulados de asignaciones
  const asignacionesSimuladas: AsignacionEvaluador[] = [
    {
      id: 1,
      evaluacion_id: 1,
      evaluador_id: 2,
      tipo_evaluador: 'lider',
      nombre_evaluador: 'Barbara Rocio Benavides Guevara',
      nombre_evaluado: 'Luisa Rodriguez',
      estado: 'completada',
      fecha_asignacion: '2024-01-15'
    },
    {
      id: 2,
      evaluacion_id: 1,
      evaluador_id: 3,
      tipo_evaluador: 'par',
      nombre_evaluador: 'Carlos Mendoza',
      nombre_evaluado: 'Luisa Rodriguez',
      estado: 'pendiente',
      fecha_asignacion: '2024-01-15'
    },
    {
      id: 3,
      evaluacion_id: 1,
      evaluador_id: 4,
      tipo_evaluador: 'subordinado',
      nombre_evaluador: 'Ana García',
      nombre_evaluado: 'Luisa Rodriguez',
      estado: 'en_progreso',
      fecha_asignacion: '2024-01-15'
    }
  ];

  useEffect(() => {
    dispatch(getEvaluaciones() as any);
    dispatch(getComponentes() as any);
    setAsignaciones(asignacionesSimuladas);
  }, [dispatch]);

  const handleAutoAsignacion = async () => {
    setLoading(true);
    
    // Simular proceso de asignación automática
    setTimeout(() => {
      const nuevasAsignaciones = evaluaciones
        .filter((e: any) => e.tipo === '360' && !asignaciones.find(a => a.evaluacion_id === e.id))
        .map((evaluacion: any) => {
          // Simular asignación automática de evaluadores
          return {
            id: Math.random(),
            evaluacion_id: evaluacion.id,
            evaluador_id: Math.floor(Math.random() * 10) + 1,
            tipo_evaluador: 'lider' as const,
            nombre_evaluador: 'Barbara Rocio Benavides Guevara',
            nombre_evaluado: evaluacion.usuario_evaluado_nombre || 'Usuario',
            estado: 'pendiente' as const,
            fecha_asignacion: new Date().toISOString().split('T')[0]
          };
        });

      setAsignaciones([...asignaciones, ...nuevasAsignaciones]);
      setLoading(false);
    }, 2000);
  };

  const handleManualAsignacion = () => {
    setOpenDialog(true);
  };

  const handleEditAsignacion = (asignacion: AsignacionEvaluador) => {
    setEditAsignacion(asignacion);
    setOpenDialog(true);
  };

  const handleDeleteAsignacion = (id: number) => {
    setAsignaciones(asignaciones.filter(a => a.id !== id));
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'completada': return 'success';
      case 'en_progreso': return 'warning';
      case 'pendiente': return 'error';
      default: return 'default';
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'completada': return 'Completada';
      case 'en_progreso': return 'En Progreso';
      case 'pendiente': return 'Pendiente';
      default: return estado;
    }
  };

  const getTipoEvaluadorLabel = (tipo: string) => {
    switch (tipo) {
      case 'lider': return 'Líder';
      case 'par': return 'Par';
      case 'subordinado': return 'Subordinado';
      case 'autoevaluacion': return 'Autoevaluación';
      default: return tipo;
    }
  };

  const getTipoEvaluadorColor = (tipo: string) => {
    switch (tipo) {
      case 'lider': return 'primary';
      case 'par': return 'secondary';
      case 'subordinado': return 'warning';
      case 'autoevaluacion': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
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
          src="rh.jpg"
          alt="Encabezado"
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.3,
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
            ASIGNACIÓN DE EVALUADORES
          </Typography>
        </Box>
      </Box>

      {/* Controles */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Gestión de Asignaciones
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={autoAsignacion}
                  onChange={(e) => setAutoAsignacion(e.target.checked)}
                />
              }
              label="Asignación Automática"
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<AutoAwesome />}
              onClick={handleAutoAsignacion}
              disabled={loading || !autoAsignacion}
              sx={{ backgroundColor: '#4caf50' }}
            >
              {loading ? 'Asignando...' : 'Asignación Automática'}
            </Button>

            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={handleManualAsignacion}
              disabled={autoAsignacion}
            >
              Asignación Manual
            </Button>

            <Button
              variant="outlined"
              startIcon={<People />}
              onClick={() => console.log('Ver evaluadores disponibles')}
            >
              Ver Evaluadores
            </Button>
          </Box>

          {loading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="body2" sx={{ mt: 1 }}>
                Procesando asignaciones automáticas...
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Chip 
          icon={<CheckCircle />} 
          label={`${asignaciones.filter(a => a.estado === 'completada').length} Completadas`} 
          color="success" 
        />
        <Chip 
          icon={<Warning />} 
          label={`${asignaciones.filter(a => a.estado === 'pendiente').length} Pendientes`} 
          color="warning" 
        />
        <Chip 
          icon={<Assignment />} 
          label={`${asignaciones.filter(a => a.estado === 'en_progreso').length} En Progreso`} 
          color="info" 
        />
      </Box>

      {/* Tabla de Asignaciones */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Asignaciones de Evaluadores
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>Evaluado</TableCell>
                  <TableCell>Evaluador</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Fecha Asignación</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {asignaciones.map((asignacion) => (
                  <TableRow key={asignacion.id}>
                    <TableCell>{asignacion.nombre_evaluado}</TableCell>
                    <TableCell>{asignacion.nombre_evaluador}</TableCell>
                    <TableCell>
                      <Chip 
                        label={getTipoEvaluadorLabel(asignacion.tipo_evaluador)}
                        color={getTipoEvaluadorColor(asignacion.tipo_evaluador) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getEstadoLabel(asignacion.estado)}
                        color={getEstadoColor(asignacion.estado) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(asignacion.fecha_asignacion).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        startIcon={<Edit />}
                        onClick={() => handleEditAsignacion(asignacion)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<Delete />}
                        onClick={() => handleDeleteAsignacion(asignacion.id)}
                      >
                        Eliminar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Información Adicional */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Información sobre Asignación Automática
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Asignación Automática:</strong> El sistema automáticamente asigna evaluadores basándose en:
            </Typography>
            <ul>
              <li>Líder directo del área</li>
              <li>Compañeros del mismo nivel jerárquico</li>
              <li>Subordinados directos (si aplica)</li>
              <li>Autoevaluación del empleado</li>
            </ul>
          </Alert>

          <Alert severity="warning">
            <Typography variant="body2">
              <strong>Nota:</strong> Para evaluaciones 360°, se requieren al menos 3 evaluadores diferentes.
              Para evaluaciones 180°, se requiere el líder directo y autoevaluación.
              Para evaluaciones 90°, solo se requiere el líder directo.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
} 