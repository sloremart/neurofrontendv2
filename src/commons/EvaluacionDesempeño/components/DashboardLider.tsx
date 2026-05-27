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
  Box,
  Paper,
  Alert,
  CircularProgress,
  Divider,
  Button
} from '@mui/material';
import {
  Group,
  Assignment,
  TrendingUp,
  Work,
  Person,
  Info,
  PlayArrow,
  AssignmentTurnedIn
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getDashboardLiderResumen, getDashboardLiderUsuarios, getEvaluaciones360ParaLider } from '../store/thunks/ThunksEvaluacionDesempeño.tsx';

interface DashboardLiderProps {
  liderId: number;
  areaId?: number;
}

const DashboardLider: React.FC<DashboardLiderProps> = ({ liderId, areaId }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [resumen, setResumen] = useState<any>(null);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [evaluaciones360, setEvaluaciones360] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLider, setIsLider] = useState<boolean | null>(null);

  useEffect(() => {
    const cargarDashboard = async () => {
      try {
        setLoading(true);
        
        // Intentar cargar el dashboard de líder
        const resumenResponse = await dispatch(getDashboardLiderResumen(liderId, areaId) as any);
        const usuariosResponse = await dispatch(getDashboardLiderUsuarios(liderId, areaId) as any);
        const evaluaciones360Response = await dispatch(getEvaluaciones360ParaLider(liderId, areaId) as any);
        

        
        if (resumenResponse) {
          // Verificar si hay error en la respuesta
          if (resumenResponse.error) {
            setError(resumenResponse.error);
            setIsLider(false);
          } else {
            setResumen(resumenResponse);
            setIsLider(true);
          }
        }
        
        if (usuariosResponse && !usuariosResponse.error) {
          setUsuarios(usuariosResponse);
        }
        
        if (evaluaciones360Response && !evaluaciones360Response.error) {
          setEvaluaciones360(evaluaciones360Response);
        }
        
      } catch (err: any) {

        // Si hay error, probablemente no es líder
        if (err?.response?.status === 403 || err?.message?.includes('no autorizado')) {
          setIsLider(false);
          setError('No tienes permisos de líder para acceder a esta funcionalidad');
        } else {
          setIsLider(false);
          setError(`Error al cargar el dashboard de líder: ${err?.message || 'Error desconocido'}`);
          console.error('Error completo:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    cargarDashboard();
  }, [dispatch, liderId, areaId]);

  // Función para realizar una evaluación 360
  const handleRealizarEvaluacion360 = (asignacionId: number, evaluacionId: number, usuarioEvaluado: any) => {
    // Navegar a la pantalla de evaluación 360 con los parámetros necesarios
    navigate(`/evaluacion_personal/360/evaluar/${asignacionId}`, {
      state: {
        asignacionId,
        evaluacionId,
        usuarioEvaluado,
        evaluadorId: liderId
      }
    });
  };

  // Función para refrescar el dashboard después de completar una evaluación
  const refrescarDashboard = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh',
          backgroundImage: 'url(/logoneuro.jpeg)',
          backgroundSize: '400px',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            zIndex: 0,
            pointerEvents: 'none'
          }
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  // Si no es líder, mostrar mensaje
  if (!isLider) {
    return (
      <Box 
        sx={{ 
          p: 3,
          minHeight: '100vh',
          backgroundImage: 'url(/logoneuro.jpeg)',
          backgroundSize: '400px',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            zIndex: 0,
            pointerEvents: 'none'
          }
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Acceso Restringido
            </Typography>
            <Typography variant="body1">
              No tienes permisos de líder para acceder a esta funcionalidad. 
              Solo los líderes de área pueden ver el dashboard de gestión de equipo.
            </Typography>
          </Alert>
          
          <Paper sx={{ p: 3, backgroundColor: '#fff3e0', border: '1px solid #ffe0b2' }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Info sx={{ color: '#f57c00', fontSize: 32 }} />
              <Box>
                <Typography variant="h6" color="warning.main" gutterBottom>
                  ¿Necesitas acceso de líder?
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  Si crees que deberías tener acceso a las funciones de líder, 
                  contacta con el administrador del sistema para que verifique tu perfil 
                  en la tabla de evaluaciones de desempeño.
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box 
        sx={{ 
          p: 3,
          minHeight: '100vh',
          backgroundImage: 'url(/logoneuro.jpeg)',
          backgroundSize: '400px',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            zIndex: 0,
            pointerEvents: 'none'
          }
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        </Box>
      </Box>
    );
  }

  if (!resumen) {
    return (
      <Box 
        sx={{ 
          p: 3,
          minHeight: '100vh',
          backgroundImage: 'url(/logoneuro.jpeg)',
          backgroundSize: '400px',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            zIndex: 0,
            pointerEvents: 'none'
          }
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Alert severity="info">
            No se encontró información del dashboard de líder
          </Alert>
        </Box>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        p: 3,
        minHeight: '100vh',
        backgroundImage: 'url(/logoneuro.jpeg)',
        backgroundSize: '400px',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          zIndex: 0,
          pointerEvents: 'none'
        }
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
      {/* Header del Dashboard con imagen */}
      <Paper 
        sx={{ 
          mb: 3, 
          position: 'relative',
          borderRadius: 3,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #b8c5f2 0%, #c4b5dd 100%)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}
      >
        {/* Imagen de fondo del header */}
        <Box
          component="img"
          src="/check.jpg"
          alt="Dashboard Header"
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            height: '100%',
            width: 'auto',
            opacity: 0.2,
            zIndex: 0,
            objectFit: 'cover'
          }}
        />
        
        <Box sx={{ position: 'relative', zIndex: 1, p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                mr: 3,
                width: 60,
                height: 60,
                backdropFilter: 'blur(10px)'
              }}
            >
              <Group sx={{ fontSize: 30, color: 'white' }} />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                Dashboard de Líder
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                {resumen.area?.nombre || 'No especificada'}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: 2,
            p: 2,
            backdropFilter: 'blur(10px)'
          }}>
            <Person sx={{ color: 'white', mr: 2 }} />
            <Typography variant="subtitle1" sx={{ color: 'white' }}>
              Líder: {resumen.lider_info?.nombre || 'No especificado'}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Resumen de Métricas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #b8c5f2 0%, #c4b5dd 100%)',
            color: '#2c3e50',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(184, 197, 242, 0.3)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 12px 40px rgba(184, 197, 242, 0.4)'
            }
          }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Avatar sx={{ 
                bgcolor: 'rgba(44, 62, 80, 0.15)', 
                mx: 'auto', 
                mb: 2,
                width: 56,
                height: 56
              }}>
                <TrendingUp sx={{ fontSize: 30, color: '#2c3e50' }} />
              </Avatar>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Total Pendientes
              </Typography>
              <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
                {resumen.resumen?.total_pendientes || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: '#5a6c7d' }}>
                Evaluaciones pendientes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #f4c2f1 0%, #f7b2ba 100%)',
            color: '#2c3e50',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(244, 194, 241, 0.3)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 12px 40px rgba(244, 194, 241, 0.4)'
            }
          }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Avatar sx={{ 
                bgcolor: 'rgba(44, 62, 80, 0.15)', 
                mx: 'auto', 
                mb: 2,
                width: 56,
                height: 56
              }}>
                <Work sx={{ fontSize: 30, color: '#2c3e50' }} />
              </Avatar>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Actividades Pendientes
              </Typography>
              <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
                {resumen.resumen?.total_actividades_pendientes || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: '#5a6c7d' }}>
                Por evaluar
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #a8d5fe 0%, #b3f1fe 100%)',
            color: '#2c3e50',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(168, 213, 254, 0.3)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 12px 40px rgba(168, 213, 254, 0.4)'
            }
          }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Avatar sx={{ 
                bgcolor: 'rgba(44, 62, 80, 0.15)', 
                mx: 'auto', 
                mb: 2,
                width: 56,
                height: 56
              }}>
                <Assignment sx={{ fontSize: 30, color: '#2c3e50' }} />
              </Avatar>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Evaluaciones 360° Pendientes
              </Typography>
              <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
                {resumen.resumen?.total_evaluaciones_360_pendientes || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: '#5a6c7d' }}>
                Por completar
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #a8f4be 0%, #b3fceb 100%)',
            color: '#2c3e50',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(168, 244, 190, 0.3)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 12px 40px rgba(168, 244, 190, 0.4)'
            }
          }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Avatar sx={{ 
                bgcolor: 'rgba(44, 62, 80, 0.15)', 
                mx: 'auto', 
                mb: 2,
                width: 56,
                height: 56
              }}>
                <Group sx={{ fontSize: 30, color: '#2c3e50' }} />
              </Avatar>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Usuarios a Cargo
              </Typography>
              <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
                {resumen.resumen?.total_usuarios_a_cargo || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: '#5a6c7d' }}>
                En tu equipo
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ✅ NUEVO: Indicadores de Desempeño por Usuario */}
      {resumen?.usuarios_a_cargo?.data && resumen.usuarios_a_cargo.data.length > 0 && (
        <Paper sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(168, 244, 190, 0.15) 0%, rgba(179, 252, 235, 0.15) 100%)',
          border: '1px solid rgba(168, 244, 190, 0.3)',
          boxShadow: '0 8px 32px rgba(168, 244, 190, 0.15)'
        }}>
                     <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
             <Avatar sx={{
               bgcolor: '#a8f4be',
               mr: 3,
               width: 64,
               height: 64
             }}>
               <TrendingUp sx={{ fontSize: 36, color: 'white' }} />
             </Avatar>
             <Box>
               <Typography variant="h3" sx={{
                 color: '#2e7d32',
                 fontWeight: 'bold',
                 mb: 1
               }}>
                 📊 Indicadores de Desempeño por Usuario
               </Typography>
               <Typography variant="h6" sx={{
                 color: '#4caf50',
                 fontWeight: 'medium'
               }}>
                 Análisis detallado del rendimiento individual
               </Typography>
             </Box>
           </Box>
          
                     <Grid container spacing={4}>
             {resumen.usuarios_a_cargo.data.map((usuario: any) => (
               <Grid item xs={12} key={usuario.id}>
                <Card sx={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e0e0e0',
                  '&:hover': {
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s ease-in-out'
                  }
                }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                      <Typography variant="h6" fontWeight="bold" color="primary">
                        {usuario.nombre}
                      </Typography>
                      <Chip 
                        label={usuario.desempeno?.estado || 'Sin evaluar'} 
                        size="small"
                        sx={{
                          backgroundColor: usuario.desempeno?.estado === 'excelente' ? '#4caf50' :
                                         usuario.desempeno?.estado === 'bueno' ? '#8bc34a' :
                                         usuario.desempeno?.estado === 'regular' ? '#ff9800' :
                                         usuario.desempeno?.estado === 'necesita_mejora' ? '#f44336' : '#9e9e9e',
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>

                                         {/* Barra de progreso principal */}
                     <Box sx={{ mb: 4 }}>
                       <Box display="flex" justifyContent="space-between" mb={2}>
                         <Typography variant="h6" color="textSecondary" fontWeight="medium">
                           Desempeño Total
                         </Typography>
                         <Typography variant="h4" fontWeight="bold" color="primary">
                           {usuario.desempeno?.porcentaje_total || 0}%
                         </Typography>
                       </Box>
                       <Box sx={{
                         width: '100%',
                         height: 20,
                         backgroundColor: '#e0e0e0',
                         borderRadius: 10,
                         overflow: 'hidden'
                       }}>
                         <Box sx={{
                           width: `${usuario.desempeno?.porcentaje_total || 0}%`,
                           height: '100%',
                           backgroundColor: usuario.desempeno?.estado === 'excelente' ? '#4caf50' :
                                          usuario.desempeno?.estado === 'bueno' ? '#8bc34a' :
                                          usuario.desempeno?.estado === 'regular' ? '#ff9800' :
                                          usuario.desempeno?.estado === 'necesita_mejora' ? '#f44336' : '#9e9e9e',
                           transition: 'width 0.5s ease-in-out'
                         }} />
                       </Box>
                     </Box>

                                         {/* Desglose por componente */}
                     <Grid container spacing={4}>
                       <Grid item xs={6}>
                         <Box sx={{ 
                           textAlign: 'center', 
                           p: 4, 
                           backgroundColor: '#e3f2fd', 
                           borderRadius: 3,
                           border: '2px solid #bbdefb',
                           '&:hover': {
                             backgroundColor: '#bbdefb',
                             transform: 'scale(1.02)',
                             transition: 'all 0.2s ease-in-out'
                           }
                         }}>
                           <Typography variant="h3" color="primary" fontWeight="bold" mb={1}>
                             {usuario.desempeno?.desempeno_360 || 0}%
                           </Typography>
                           <Typography variant="h6" color="textSecondary" fontWeight="medium" mb={1}>
                             Evaluación 360 (20%)
                           </Typography>

                         </Box>
                       </Grid>

                       <Grid item xs={6}>
                         <Box sx={{ 
                           textAlign: 'center', 
                           p: 4, 
                           backgroundColor: '#e8f5e9', 
                           borderRadius: 3,
                           border: '2px solid #c8e6c9',
                           '&:hover': {
                             backgroundColor: '#c8e6c9',
                             transform: 'scale(1.02)',
                             transition: 'all 0.2s ease-in-out'
                           }
                         }}>
                           <Typography variant="h3" color="primary" fontWeight="bold" mb={1}>
                             {usuario.desempeno?.desempeno_laboral || 0}%
                           </Typography>
                           <Typography variant="h6" color="textSecondary" fontWeight="medium" mb={1}>
                             Actividades (60%)
                           </Typography>

                         </Box>
                       </Grid>
                     </Grid>

                                         {/* Información adicional */}
                     <Box sx={{ 
                       mt: 4, 
                       p: 3, 
                       backgroundColor: '#f8f9fa', 
                       borderRadius: 3,
                       border: '1px solid #e9ecef'
                     }}>
                       <Grid container spacing={2}>
                         <Grid item xs={4}>
                           <Box sx={{ textAlign: 'center' }}>
                             <Typography variant="h5" color="primary" fontWeight="bold">
                               {usuario.desempeno?.evaluaciones_360_180_count || 0}
                             </Typography>
                             <Typography variant="body2" color="textSecondary">
                               Evaluaciones 360/180
                             </Typography>
                           </Box>
                         </Grid>
                         <Grid item xs={4}>
                           <Box sx={{ textAlign: 'center' }}>
                             <Typography variant="h5" color="primary" fontWeight="bold">
                               {usuario.desempeno?.evaluaciones_laborales_count || 0}
                             </Typography>
                             <Typography variant="body2" color="textSecondary">
                               Actividades evaluadas
                             </Typography>
                           </Box>
                         </Grid>
                         <Grid item xs={4}>
                           <Box sx={{ textAlign: 'center' }}>
                             <Typography variant="h6" color="textSecondary" fontWeight="medium">
                               {usuario.cargo || 'No especificado'}
                             </Typography>
                             <Typography variant="body2" color="textSecondary">
                               Cargo
                             </Typography>
                           </Box>
                         </Grid>
                       </Grid>
                     </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Evaluaciones 360 Pendientes */}
      {resumen.evaluaciones_360?.data && resumen.evaluaciones_360.data.length > 0 && (
        <Paper sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(168, 213, 254, 0.15) 0%, rgba(179, 241, 254, 0.15) 100%)',
          border: '1px solid rgba(168, 213, 254, 0.3)',
          boxShadow: '0 8px 32px rgba(168, 213, 254, 0.15)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ 
              bgcolor: '#a8d5fe', 
              mr: 2,
              width: 48,
              height: 48
            }}>
              <Assignment sx={{ fontSize: 28, color: 'white' }} />
            </Avatar>
            <Typography variant="h5" sx={{ 
              color: '#6b94d6', 
              fontWeight: 'bold'
            }}>
              Evaluaciones 360° Pendientes
            </Typography>
          </Box>
          <List>
            {resumen.evaluaciones_360.data.map((evaluacion: any, index: number) => (
              <React.Fragment key={evaluacion.asignacion_id}>
                <ListItem sx={{ backgroundColor: 'white', mb: 1, borderRadius: 1 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#7b1fa2' }}>
                      <Assignment />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`Evaluar a ${evaluacion.usuario_evaluado.nombre}`}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          {evaluacion.componente.nombre}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Tipo: {evaluacion.tipo_evaluacion} • Asignada: {new Date(evaluacion.fecha_asignacion).toLocaleDateString()}
                        </Typography>
                      </Box>
                    }
                  />
                  <Box sx={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Chip
                      label="Pendiente"
                      color="warning"
                      variant="filled"
                      size="small"
                    />
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<PlayArrow />}
                      onClick={() => handleRealizarEvaluacion360(
                        evaluacion.asignacion_id,
                        evaluacion.evaluacion_id,
                        evaluacion.usuario_evaluado
                      )}
                      sx={{ 
                        backgroundColor: '#7b1fa2',
                        '&:hover': { backgroundColor: '#6a1b9a' },
                        fontSize: '0.75rem',
                        padding: '4px 8px'
                      }}
                    >
                      Evaluar
                    </Button>
                  </Box>
                </ListItem>
                {index < resumen.evaluaciones_360.data.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* Lista de Usuarios a Cargo */}
      <Paper sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
        <Typography variant="h5" gutterBottom sx={{ color: '#424242' }}>
          <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
          Usuarios a Cargo
        </Typography>
        <List>
          {(resumen.usuarios_a_cargo?.data || usuarios).map((usuario: any, index: number) => (
            <React.Fragment key={usuario.id}>
              <ListItem sx={{ backgroundColor: 'white', mb: 1, borderRadius: 1 }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: '#1976d2' }}>
                    <Person />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={usuario.nombre}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        {usuario.cargo} • {usuario.rol}
                      </Typography>
                      <Box sx={{ mt: 1, display: 'flex', gap: 2 }}>
                        <Chip
                          label={`${usuario.evaluaciones_pendientes || 0} evaluaciones pendientes`}
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  }
                />
                <Box sx={{ textAlign: 'right' }}>
                  <Chip
                    label={`${usuario.evaluaciones_pendientes || 0} pendientes`}
                    color="primary"
                    variant="filled"
                  />
                </Box>
              </ListItem>
              {index < usuarios.length - 1 && <Divider />}
            </React.Fragment>
          ))}
          {(resumen.usuarios_a_cargo?.data || usuarios).length === 0 && (
            <ListItem>
              <ListItemText
                primary="No hay usuarios asignados"
                secondary="No tienes usuarios a cargo en este momento"
              />
            </ListItem>
          )}
        </List>
      </Paper>
      </Box>
    </Box>
  );
};

export default DashboardLider;
