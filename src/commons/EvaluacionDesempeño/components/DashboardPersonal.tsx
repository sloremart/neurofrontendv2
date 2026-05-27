import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  LinearProgress,
  Box,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  Button
} from '@mui/material';
import {
  Person,
  Assignment,
  CheckCircle,
  Pending,
  TrendingUp,
  Work,
  Group,
  Info
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { getDashboardUsuario, getProgresoEvaluacion } from '../store/thunks/ThunksEvaluacionDesempeño.tsx';

interface DashboardPersonalProps {
  usuarioId: number;
  areaId?: number;
}

const DashboardPersonal: React.FC<DashboardPersonalProps> = ({ usuarioId, areaId }) => {
  const dispatch = useDispatch();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLider, setIsLider] = useState<boolean | null>(null);

  useEffect(() => {
    const cargarDashboard = async () => {
      try {
        setLoading(true);
        const response = await dispatch(getDashboardUsuario(usuarioId, areaId) as any);
        if (response.payload) {
          setDashboard(response.payload);
          // Verificar si es líder basándose en la respuesta del backend
          setIsLider(response.payload.usuario?.es_lider || false);
        }
      } catch (err) {
        setError('Error al cargar el dashboard');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    cargarDashboard();
  }, [dispatch, usuarioId, areaId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!dashboard) {
    return (
      <Alert severity="info">
        No se encontró información del dashboard
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Información del Usuario */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f3e5f5' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Avatar sx={{ width: 64, height: 64, bgcolor: '#9c27b0' }}>
              <Person sx={{ fontSize: 32 }} />
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h4" gutterBottom>
              {dashboard.usuario?.nombre || 'Usuario'}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              {dashboard.usuario?.cargo} - {dashboard.usuario?.area}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {dashboard.usuario?.email}
            </Typography>
          </Grid>
          <Grid item>
            <Chip
              label={isLider ? 'Líder' : 'Colaborador'}
              color={isLider ? 'primary' : 'default'}
              icon={isLider ? <TrendingUp /> : <Work />}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Resumen General */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: '#e8f5e8', border: '1px solid #dcedc8' }}>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Total Evaluaciones
              </Typography>
              <Typography variant="h3" color="textPrimary">
                {dashboard.resumen?.total_general || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Evaluaciones en total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: '#fff3e0', border: '1px solid #ffe0b2' }}>
            <CardContent>
              <Typography variant="h6" color="warning.main" gutterBottom>
                Pendientes
              </Typography>
              <Typography variant="h3" color="textPrimary">
                {dashboard.resumen?.total_evaluaciones_pendientes || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Por completar
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: '#e3f2fd', border: '1px solid #bbdefb' }}>
            <CardContent>
              <Typography variant="h6" color="info.main" gutterBottom>
                Recibidas
              </Typography>
              <Typography variant="h3" color="textPrimary">
                {dashboard.resumen?.total_evaluaciones_recibidas || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Evaluaciones recibidas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Evaluaciones como Evaluador */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f1f8e9' }}>
        <Typography variant="h5" gutterBottom sx={{ color: '#2e7d32' }}>
          <Assignment sx={{ mr: 1, verticalAlign: 'middle' }} />
          Evaluaciones que debo completar
        </Typography>
        <List>
          {dashboard.como_evaluador?.map((evaluacion: any, index: number) => (
            <React.Fragment key={evaluacion.asignacion_id}>
              <ListItem>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: '#4caf50' }}>
                    <Person />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={evaluacion.usuario_evaluado?.nombre || 'Usuario'}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        {evaluacion.componente?.nombre} - {evaluacion.tipo}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={evaluacion.progreso?.porcentaje || 0}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="caption" color="textSecondary">
                          {evaluacion.progreso?.porcentaje?.toFixed(1) || 0}% completado
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
                <Box sx={{ textAlign: 'right' }}>
                  <Chip
                    label={evaluacion.estado === 'en_proceso' ? 'En Proceso' : 'Pendiente'}
                    color={evaluacion.estado === 'en_proceso' ? 'warning' : 'default'}
                    icon={evaluacion.estado === 'en_proceso' ? <Pending /> : <Assignment />}
                  />
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    {evaluacion.progreso?.preguntas_respondidas || 0} / {evaluacion.progreso?.total_preguntas || 0} preguntas
                  </Typography>
                </Box>
              </ListItem>
              {index < (dashboard.como_evaluador?.length || 0) - 1 && <Divider />}
            </React.Fragment>
          ))}
          {(!dashboard.como_evaluador || dashboard.como_evaluador.length === 0) && (
            <ListItem>
              <ListItemText
                primary="No hay evaluaciones pendientes"
                secondary="Todas las evaluaciones asignadas han sido completadas"
              />
            </ListItem>
          )}
        </List>
      </Paper>

      {/* Evaluaciones como Evaluado */}
      <Paper sx={{ p: 3, backgroundColor: '#fce4ec' }}>
        <Typography variant="h5" gutterBottom sx={{ color: '#c2185b' }}>
          <Group sx={{ mr: 1, verticalAlign: 'middle' }} />
          Evaluaciones que he recibido
        </Typography>
        <List>
          {dashboard.como_evaluado?.map((evaluacion: any, index: number) => (
            <React.Fragment key={evaluacion.evaluacion_id}>
              <ListItem>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: '#e91e63' }}>
                    <CheckCircle />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`Evaluación ${evaluacion.tipo}`}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        {evaluacion.componente?.nombre}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={evaluacion.progreso?.porcentaje || 0}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="caption" color="textSecondary">
                          {evaluacion.progreso?.porcentaje?.toFixed(1) || 0}% completado
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
                <Box sx={{ textAlign: 'right' }}>
                  <Chip
                    label={evaluacion.estado === 'en_proceso' ? 'En Proceso' : 'Pendiente'}
                    color={evaluacion.estado === 'en_proceso' ? 'warning' : 'default'}
                    icon={evaluacion.estado === 'en_proceso' ? <Pending /> : <Assignment />}
                  />
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    {evaluacion.progreso?.evaluadores_completados || 0} / {evaluacion.progreso?.total_evaluadores || 0} evaluadores
                  </Typography>
                </Box>
              </ListItem>
              {index < (dashboard.como_evaluado?.length || 0) - 1 && <Divider />}
            </React.Fragment>
          ))}
          {(!dashboard.como_evaluado || dashboard.como_evaluado.length === 0) && (
            <ListItem>
              <ListItemText
                primary="No hay evaluaciones recibidas"
                secondary="No se han asignado evaluaciones para ti"
              />
            </ListItem>
          )}
        </List>
      </Paper>

      {/* Mensaje si no es líder */}
      {!isLider && (
        <Paper sx={{ p: 3, mt: 3, backgroundColor: '#fff3e0', border: '1px solid #ffe0b2' }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Info sx={{ color: '#f57c00', fontSize: 32 }} />
            <Box>
              <Typography variant="h6" color="warning.main" gutterBottom>
                Información de Líder
              </Typography>
              <Typography variant="body1" color="textSecondary">
                No tienes acceso a las funciones de líder. Solo puedes ver tus evaluaciones personales.
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default DashboardPersonal;
