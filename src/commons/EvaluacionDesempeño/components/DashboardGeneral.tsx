import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Chip,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  Assessment,
  Work,
  Star,
  Business,
  ExpandMore,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { getDashboardGeneral } from '../store/thunks/ThunksEvaluacionDesempeño.tsx';

interface ComponentePorcentaje {
  componente_id: number;
  componente_nombre: string;
  tipo_nombre: string;
  es_360: boolean;
  porcentaje_objetivo: number;
  porcentaje_360: number;
  porcentaje_actividades: number;
  porcentaje_talento_humano: number;
  porcentaje_total: number;
  porcentaje_cumplimiento: number;
  validacion_porcentajes: {
    suma_componentes: number;
    objetivo: number;
    diferencia: number;
    es_valido: boolean;
  };
}

interface UsuarioPorcentajes {
  usuario_id: number;
  nombre_usuario: string;
  cargo: string;
  componentes: ComponentePorcentaje[];
  total_porcentaje: number;
  promedio_cumplimiento: number;
  // ✅ NUEVO: Datos de desempeño
  desempeno?: {
    porcentaje_total: number;
    desempeno_360: number;
    desempeno_laboral: number;
    promedio_360_180: number;
    promedio_laboral: number;
    evaluaciones_360_180_count: number;
    evaluaciones_laborales_count: number;
    estado: string;
  };
}

interface AreaResultado {
  area_id: number;
  area_nombre: string;
  usuarios: UsuarioPorcentajes[];
  total_usuarios: number;
  total_porcentaje: number;
  promedio_cumplimiento: number;
}

interface DashboardGeneralData {
  resumen_sistema: {
    total_areas: number;
    total_usuarios: number;
    total_porcentaje: number;
    promedio_cumplimiento: number;
  };
  areas: AreaResultado[];
  // ✅ NUEVO: Datos de actividades del endpoint dashboard
  evaluaciones?: any[];
  asignaciones_actividades?: any[];
}

export default function DashboardGeneral() {
  const dispatch = useDispatch();
  const [dashboardData, setDashboardData] = useState<DashboardGeneralData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🚀 Cargando dashboard general...');
      const data = await dispatch(getDashboardGeneral() as any);
      console.log('📊 Dashboard recibido:', data);
      
             // ✅ NUEVO: Debug detallado de los datos
       if (data) {
         console.log('🔍 Estructura de datos recibida:');
         console.log('  - Evaluaciones:', data.evaluaciones);
         console.log('  - Asignaciones actividades:', data.asignaciones_actividades);
         console.log('  - Áreas:', data.areas);
         
         // Verificar si hay puntajes reales
         if (data.evaluaciones && data.evaluaciones.length > 0) {
           console.log('📝 Primera evaluación:', data.evaluaciones[0]);
           if (data.evaluaciones[0].asignaciones_con_puntajes) {
             console.log('   - Asignaciones con puntajes:', data.evaluaciones[0].asignaciones_con_puntajes);
           }
         }
         
         if (data.asignaciones_actividades && data.asignaciones_actividades.length > 0) {
           console.log('📋 Primera actividad:', data.asignaciones_actividades[0]);
           if (data.asignaciones_actividades[0].puntaje_actividad) {
             console.log('   - Puntaje actividad:', data.asignaciones_actividades[0].puntaje_actividad);
           }
         }
       }
      
      setDashboardData(data);
    } catch (error: any) {
      console.error('❌ Error al cargar dashboard:', error);
      setError(error.message || 'Error al cargar dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDashboard();
  }, []);

  const getColorPorcentaje = (porcentaje: number) => {
    if (porcentaje >= 80) return '#4caf50'; // Verde
    if (porcentaje >= 60) return '#ff9800'; // Naranja
    if (porcentaje >= 40) return '#ff5722'; // Rojo oscuro
    return '#f44336'; // Rojo
  };

  const getColorCumplimiento = (cumplimiento: number) => {
    if (cumplimiento >= 80) return 'success';
    if (cumplimiento >= 60) return 'warning';
    return 'error';
  };

  const validarPorcentajesComponente = (componente: ComponentePorcentaje) => {
    const suma = componente.porcentaje_360 + componente.porcentaje_actividades + componente.porcentaje_talento_humano;
    const objetivo = componente.porcentaje_objetivo;
    const diferencia = suma - objetivo;
    
    if (Math.abs(diferencia) > 0.01) { // Tolerancia de 0.01%
      console.warn(`⚠️ Porcentajes no suman correctamente en componente ${componente.componente_nombre}:`, {
        suma: suma.toFixed(2),
        objetivo: objetivo.toFixed(2),
        diferencia: diferencia.toFixed(2)
      });
    }
    
    return {
      esValido: Math.abs(diferencia) <= 0.01,
      suma,
      objetivo,
      diferencia
    };
  };

  const getColorValidacion = (esValido: boolean) => {
    return esValido ? '#4caf50' : '#f44336';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Cargando dashboard general...</Typography>
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

  if (!dashboardData) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        No hay datos disponibles
      </Alert>
    );
  }

  // ✅ NUEVO: Verificar si tenemos datos del endpoint dashboard
  const tieneDatosDashboard = dashboardData.evaluaciones || dashboardData.asignaciones_actividades;
  const tieneDatosGeneral = dashboardData.resumen_sistema && dashboardData.areas;
  
  // ✅ NUEVO: Debug de la lógica de renderizado
  console.log('🎭 Lógica de renderizado:');
  console.log('  - tieneDatosDashboard:', tieneDatosDashboard);
  console.log('  - tieneDatosGeneral:', tieneDatosGeneral);
  console.log('  - Evaluaciones count:', dashboardData.evaluaciones?.length || 0);
  console.log('  - Actividades count:', dashboardData.asignaciones_actividades?.length || 0);

  return (
    <Box>
      {/* Header del Dashboard */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
          <DashboardIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Dashboard General de Evaluación
        </Typography>
        <Typography variant="h6" color="textSecondary">
           {tieneDatosDashboard ? 'Resumen con puntajes reales de evaluaciones y actividades' : 'Resumen completo de todas las áreas y usuarios'}
        </Typography>
      </Box>

             {/* Resumen del Sistema - Solo si tenemos datos generales */}
       {tieneDatosGeneral && (
      <Card sx={{ mb: 4, backgroundColor: '#f8f9fa', border: '2px solid #1976d2' }}>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold', textAlign: 'center' }}>
            Resumen del Sistema
          </Typography>
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#e3f2fd', borderRadius: 2 }}>
                <Business sx={{ fontSize: 40, color: '#1976d2', mb: 1 }} />
                <Typography variant="h4" color="primary" fontWeight="bold">
                     {dashboardData.resumen_sistema?.total_areas || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Áreas Activas
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#e8f5e9', borderRadius: 2 }}>
                <Assessment sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
                <Typography variant="h4" color="success.main" fontWeight="bold">
                     {dashboardData.resumen_sistema?.total_usuarios || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Usuarios Evaluados
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#fff3e0', borderRadius: 2 }}>
                <TrendingUp sx={{ fontSize: 40, color: '#ff9800', mb: 1 }} />
                <Typography variant="h4" color="warning.main" fontWeight="bold">
                     {dashboardData.resumen_sistema?.total_porcentaje || 0}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Obtenido
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#fce4ec', borderRadius: 2 }}>
                <Star sx={{ fontSize: 40, color: '#e91e63', mb: 1 }} />
                <Typography variant="h4" color="secondary" fontWeight="bold">
                     {dashboardData.resumen_sistema?.promedio_cumplimiento || 0}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Promedio Sistema
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
       )}

             {/* ✅ NUEVO: Indicadores de Desempeño por Usuario - Solo si tenemos datos generales */}
       {tieneDatosGeneral && dashboardData.areas?.some(area => area.usuarios.some(usuario => usuario.desempeno)) && (
        <Card sx={{ 
          mb: 4, 
          backgroundColor: '#f8f9fa', 
          border: '2px solid #4caf50',
          borderRadius: 3
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <TrendingUp sx={{ 
                fontSize: 40, 
                color: '#4caf50', 
                mr: 2 
              }} />
              <Box>
                <Typography variant="h5" gutterBottom sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                  📊 Indicadores de Desempeño por Usuario
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  Análisis detallado del rendimiento individual por área
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={3}>
              {dashboardData.areas.map((area) => (
                area.usuarios.filter(usuario => usuario.desempeno).map((usuario) => (
                  <Grid item xs={12} lg={8} key={`${area.area_id}-${usuario.usuario_id}`}>
                    <Card sx={{
                      backgroundColor: 'white',
                      border: '1px solid #e0e0e0',
                      borderRadius: 3,
                      '&:hover': {
                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                        transform: 'translateY(-4px)',
                        transition: 'all 0.3s ease-in-out'
                      }
                    }}>
                      <CardContent sx={{ p: 3 }}>
                        {/* Header del usuario */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                          <Box>
                            <Typography variant="h6" fontWeight="bold" color="primary">
                              {usuario.nombre_usuario}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {usuario.cargo} • {area.area_nombre}
                            </Typography>
                          </Box>
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
                        <Box sx={{ mb: 3 }}>
                          <Box display="flex" justifyContent="space-between" mb={1}>
                            <Typography variant="body2" color="textSecondary" fontWeight="medium">
                              Desempeño Total
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" color="primary">
                              {usuario.desempeno?.porcentaje_total || 0}%
                            </Typography>
                          </Box>
                          <Box sx={{
                            width: '100%',
                            height: 16,
                            backgroundColor: '#e0e0e0',
                            borderRadius: 8,
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
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Box sx={{ 
                              textAlign: 'center', 
                              p: 2, 
                              backgroundColor: '#e3f2fd', 
                              borderRadius: 2,
                              border: '1px solid #bbdefb'
                            }}>
                              <Typography variant="h6" color="primary" fontWeight="bold">
                                {usuario.desempeno?.desempeno_360 || 0}%
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                Evaluación 360/180 (20%)
                              </Typography>
                              <Typography variant="caption" display="block" color="textSecondary">
                                Promedio: {usuario.desempeno?.promedio_360_180 || 0}/10
                              </Typography>
                            </Box>
                          </Grid>

                          <Grid item xs={6}>
                            <Box sx={{ 
                              textAlign: 'center', 
                              p: 2, 
                              backgroundColor: '#e8f5e9', 
                              borderRadius: 2,
                              border: '1px solid #c8e6c9'
                            }}>
                              <Typography variant="h6" color="primary" fontWeight="bold">
                                {usuario.desempeno?.desempeno_laboral || 0}%
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                Actividades (60%)
                              </Typography>
                              <Typography variant="caption" display="block" color="textSecondary">
                                Promedio: {usuario.desempeno?.promedio_laboral || 0}/10
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>

                        {/* Información adicional */}
                        <Box sx={{ 
                          mt: 2, 
                          p: 2, 
                          backgroundColor: '#f5f5f5', 
                          borderRadius: 2 
                        }}>
                          <Grid container spacing={2}>
                            <Grid item xs={4}>
                              <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="body2" color="primary" fontWeight="bold">
                                  {usuario.desempeno?.evaluaciones_360_180_count || 0}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  Evaluaciones 360/180
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={4}>
                              <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="body2" color="primary" fontWeight="bold">
                                  {usuario.desempeno?.evaluaciones_laborales_count || 0}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  Actividades evaluadas
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={4}>
                              <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="body2" color="textSecondary">
                                  {usuario.total_porcentaje}%
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  Total sistema
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              ))}
            </Grid>
          </CardContent>
        </Card>
             )}

               {/* ✅ NUEVO: Sección de Actividades - Solo si tenemos datos del dashboard */}
        {tieneDatosDashboard && dashboardData.asignaciones_actividades && dashboardData.asignaciones_actividades.length > 0 && (
         <Card sx={{ 
           mb: 4, 
           backgroundColor: '#f8f9fa', 
           border: '2px solid #ff9800',
           borderRadius: 3
         }}>
           <CardContent>
             <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
               <Work sx={{ 
                 fontSize: 40, 
                 color: '#ff9800', 
                 mr: 2 
               }} />
               <Box>
                 <Typography variant="h5" gutterBottom sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                   📋 Actividades del Sistema
                 </Typography>
                 <Typography variant="body1" color="textSecondary">
                   Todas las actividades asignadas y su estado
                 </Typography>
               </Box>
             </Box>

             <Grid container spacing={3}>
               {dashboardData.asignaciones_actividades.map((asignacion) => (
                 <Grid item xs={12} md={6} lg={4} key={asignacion.id}>
                   <Card sx={{
                     backgroundColor: 'white',
                     border: '1px solid #e0e0e0',
                     borderRadius: 3,
                     '&:hover': {
                       boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                       transform: 'translateY(-2px)',
                       transition: 'all 0.2s ease-in-out'
                     }
                   }}>
                     <CardContent sx={{ p: 2 }}>
                       {/* Header de la actividad */}
                       <Box sx={{ mb: 2 }}>
                         <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                           {asignacion.actividad_nombre}
                         </Typography>
                         <Typography variant="body2" color="textSecondary">
                           {asignacion.componente_nombre}
                         </Typography>
                       </Box>

                       {/* Información del usuario */}
                       <Box sx={{ mb: 2 }}>
                         <Typography variant="body2" color="textSecondary">
                           <strong>Usuario:</strong> {asignacion.usuario_asignado_nombre}
                         </Typography>
                         <Typography variant="body2" color="textSecondary">
                           <strong>Evaluador:</strong> {asignacion.evaluador_nombre}
                         </Typography>
                         <Typography variant="body2" color="textSecondary">
                           <strong>Área:</strong> {asignacion.area_nombre}
                         </Typography>
                       </Box>

                                               {/* ✅ NUEVO: Estado y puntaje real de la actividad */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Chip
                            label={asignacion.completada ? 'Completada' : 'Pendiente'}
                            size="small"
                            color={asignacion.completada ? 'success' : 'warning'}
                            variant="filled"
                          />
                          <Typography variant="caption" color="textSecondary">
                            {new Date(asignacion.fecha_asignacion).toLocaleDateString()}
                          </Typography>
                        </Box>

                        {/* ✅ NUEVO: Puntaje real de la actividad */}
                        {asignacion.puntaje_actividad && (
                          <Box sx={{ mt: 2, p: 2, backgroundColor: '#f0f8ff', borderRadius: 2, border: '1px solid #e3f2fd' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="caption" color="primary" fontWeight="bold">
                                📊 Puntaje Real:
                              </Typography>
                              <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="body2" color="primary" fontWeight="bold">
                                  {asignacion.puntaje_actividad.calificacion}/10
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  ({asignacion.puntaje_actividad.porcentaje.toFixed(1)}%)
                                </Typography>
                              </Box>
                            </Box>
                            {asignacion.puntaje_actividad.comentarios && (
                              <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1, fontStyle: 'italic' }}>
                                "{asignacion.puntaje_actividad.comentarios}"
                              </Typography>
                            )}
                          </Box>
                        )}
                     </CardContent>
                   </Card>
                 </Grid>
               ))}
             </Grid>
           </CardContent>
         </Card>
       )}

               {/* ✅ NUEVO: Sección de Evaluaciones 360/180 - Solo si tenemos datos del dashboard */}
        {tieneDatosDashboard && dashboardData.evaluaciones && dashboardData.evaluaciones.length > 0 && (
         <Card sx={{ 
           mb: 4, 
           backgroundColor: '#f8f9fa', 
           border: '2px solid #1976d2',
           borderRadius: 3
         }}>
           <CardContent>
             <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
               <Assessment sx={{ 
                 fontSize: 40, 
                 color: '#1976d2', 
                 mr: 2 
               }} />
               <Box>
                 <Typography variant="h5" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                   🔄 Evaluaciones 360° y 180°
                 </Typography>
                 <Typography variant="body1" color="textSecondary">
                   Estado de todas las evaluaciones del sistema
                 </Typography>
               </Box>
             </Box>

             <Grid container spacing={3}>
               {dashboardData.evaluaciones.map((evaluacion) => (
                 <Grid item xs={12} md={6} lg={4} key={evaluacion.id}>
                   <Card sx={{
                     backgroundColor: 'white',
                     border: '1px solid #e0e0e0',
                     borderRadius: 3,
                     '&:hover': {
                       boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                       transform: 'translateY(-2px)',
                       transition: 'all 0.2s ease-in-out'
                     }
                   }}>
                     <CardContent sx={{ p: 2 }}>
                       {/* Header de la evaluación */}
                       <Box sx={{ mb: 2 }}>
                         <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                           {evaluacion.componente_nombre}
                         </Typography>
                         <Typography variant="body2" color="textSecondary">
                           Tipo: {evaluacion.tipo}
                         </Typography>
                       </Box>

                       {/* Información de usuarios */}
                       <Box sx={{ mb: 2 }}>
                         <Typography variant="body2" color="textSecondary">
                           <strong>Evaluado:</strong> {evaluacion.usuario_evaluado_nombre}
                         </Typography>
                         <Typography variant="body2" color="textSecondary">
                           <strong>Evaluador:</strong> {evaluacion.evaluador_nombre}
                         </Typography>
                         <Typography variant="body2" color="textSecondary">
                           <strong>Área:</strong> {evaluacion.area_grupo_nombre}
                         </Typography>
                       </Box>

                                               {/* ✅ NUEVO: Estado y puntajes reales */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Chip
                            label={evaluacion.completada ? 'Completada' : 'Pendiente'}
                            size="small"
                            color={evaluacion.completada ? 'success' : 'warning'}
                            variant="filled"
                          />
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="caption" color="textSecondary" display="block">
                              {evaluacion.asignaciones_completadas}/{evaluacion.total_asignaciones}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {evaluacion.porcentaje_completado}%
                            </Typography>
                          </Box>
                        </Box>

                        {/* ✅ NUEVO: Puntajes reales de las asignaciones */}
                        {evaluacion.asignaciones_con_puntajes && evaluacion.asignaciones_con_puntajes.length > 0 && (
                          <Box sx={{ mt: 2, p: 2, backgroundColor: '#f0f8ff', borderRadius: 2, border: '1px solid #e3f2fd' }}>
                            <Typography variant="caption" color="primary" fontWeight="bold" display="block" gutterBottom>
                              📊 Puntajes Reales por Usuario:
                            </Typography>
                            {evaluacion.asignaciones_con_puntajes.map((asignacion) => (
                              <Box key={asignacion.id} sx={{ mb: 1, p: 1, backgroundColor: 'white', borderRadius: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="caption" color="textSecondary">
                                    {asignacion.usuario_evaluado_nombre} → {asignacion.evaluador_nombre}
                                  </Typography>
                                  {asignacion.puntaje_360_180 && (
                                    <Box sx={{ textAlign: 'right' }}>
                                      <Typography variant="caption" color="primary" fontWeight="bold">
                                        {asignacion.puntaje_360_180.porcentaje}%
                                      </Typography>
                                      <Typography variant="caption" color="textSecondary" display="block">
                                        ({asignacion.puntaje_360_180.preguntas_respondidas}/{asignacion.puntaje_360_180.total_preguntas})
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>
                              </Box>
                            ))}
                          </Box>
                        )}
                     </CardContent>
                   </Card>
                 </Grid>
               ))}
             </Grid>
           </CardContent>
         </Card>
       )}

       {/* ✅ NUEVO: Resumen de Rendimiento General - Solo si tenemos datos del dashboard */}
       {tieneDatosDashboard && (
         <Card sx={{ 
         mb: 4, 
         backgroundColor: '#f8f9fa', 
         border: '2px solid #9c27b0',
         borderRadius: 3
       }}>
         <CardContent>
           <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
             <TrendingUp sx={{ 
               fontSize: 40, 
               color: '#9c27b0', 
               mr: 2 
             }} />
             <Box>
               <Typography variant="h5" gutterBottom sx={{ color: '#9c27b0', fontWeight: 'bold' }}>
                 📈 Resumen de Rendimiento General
               </Typography>
               <Typography variant="body1" color="textSecondary">
                 Estadísticas detalladas de evaluaciones y actividades
               </Typography>
             </Box>
           </Box>

           <Grid container spacing={3}>
             {/* Estadísticas de Evaluaciones 360/180 */}
             <Grid item xs={12} md={6}>
               <Card sx={{ backgroundColor: 'white', border: '1px solid #e1bee7' }}>
                 <CardContent>
                   <Typography variant="h6" color="primary" gutterBottom>
                     🔄 Evaluaciones 360° y 180°
                   </Typography>
                   {dashboardData.evaluaciones && dashboardData.evaluaciones.length > 0 ? (
                     <Box>
                       {dashboardData.evaluaciones.map((evaluacion) => (
                         <Box key={evaluacion.id} sx={{ mb: 2, p: 2, backgroundColor: '#f3e5f5', borderRadius: 2 }}>
                           <Typography variant="subtitle2" fontWeight="bold" color="primary">
                             {evaluacion.componente_nombre}
                           </Typography>
                           <Typography variant="caption" color="textSecondary">
                             Tipo: {evaluacion.tipo} • {evaluacion.area_grupo_nombre}
                           </Typography>
                           {evaluacion.asignaciones_con_puntajes && evaluacion.asignaciones_con_puntajes.length > 0 && (
                             <Box sx={{ mt: 1 }}>
                               {evaluacion.asignaciones_con_puntajes.map((asignacion) => (
                                 <Box key={asignacion.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                   <Typography variant="caption" color="textSecondary">
                                     {asignacion.usuario_evaluado_nombre}
                                   </Typography>
                                   {asignacion.puntaje_360_180 && (
                                     <Chip
                                       label={`${asignacion.puntaje_360_180.porcentaje}%`}
                                       size="small"
                                       color={asignacion.puntaje_360_180.porcentaje >= 80 ? 'success' : 
                                              asignacion.puntaje_360_180.porcentaje >= 60 ? 'warning' : 'error'}
                                       variant="outlined"
                                     />
                                   )}
                                 </Box>
                               ))}
                             </Box>
                           )}
                         </Box>
                       ))}
                     </Box>
                   ) : (
                     <Typography variant="body2" color="textSecondary">
                       No hay evaluaciones disponibles
                     </Typography>
                   )}
                 </CardContent>
               </Card>
             </Grid>

             {/* Estadísticas de Actividades */}
             <Grid item xs={12} md={6}>
               <Card sx={{ backgroundColor: 'white', border: '1px solid #e1bee7' }}>
                 <CardContent>
                   <Typography variant="h6" color="primary" gutterBottom>
                     📋 Actividades Evaluadas
                   </Typography>
                   {dashboardData.asignaciones_actividades && dashboardData.asignaciones_actividades.length > 0 ? (
                     <Box>
                       {dashboardData.asignaciones_actividades
                         .filter(asignacion => asignacion.puntaje_actividad)
                         .map((asignacion) => (
                           <Box key={asignacion.id} sx={{ mb: 2, p: 2, backgroundColor: '#f3e5f5', borderRadius: 2 }}>
                             <Typography variant="subtitle2" fontWeight="bold" color="primary">
                               {asignacion.actividad_nombre}
                             </Typography>
                             <Typography variant="caption" color="textSecondary">
                               {asignacion.usuario_asignado_nombre} • {asignacion.area_nombre}
                             </Typography>
                             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                               <Typography variant="caption" color="textSecondary">
                                 Evaluador: {asignacion.evaluador_nombre}
                               </Typography>
                               <Chip
                                 label={`${asignacion.puntaje_actividad.calificacion}/10`}
                                 size="small"
                                 color={asignacion.puntaje_actividad.calificacion >= 8 ? 'success' : 
                                        asignacion.puntaje_actividad.calificacion >= 6 ? 'warning' : 'error'}
                                 variant="outlined"
                               />
                             </Box>
                           </Box>
                         ))}
                     </Box>
                   ) : (
                     <Typography variant="body2" color="textSecondary">
                       No hay actividades evaluadas disponibles
                     </Typography>
                   )}
                 </CardContent>
               </Card>
             </Grid>
           </Grid>
         </CardContent>
       </Card>
       )}

              {/* Áreas - Solo si tenemos datos generales */}
       {tieneDatosGeneral && (
         <>
      <Typography variant="h5" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold', mb: 3 }}>
        <Business sx={{ mr: 1, verticalAlign: 'middle' }} />
        Resultados por Área
      </Typography>

           {dashboardData.areas?.map((area) => (
        <Accordion key={area.area_id} sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#1976d2' }}>
                  {area.area_nombre}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {area.total_usuarios} usuarios • Promedio: {area.promedio_cumplimiento}%
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Chip
                  icon={<Assessment />}
                  label={`${area.total_usuarios} usuarios`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  icon={<TrendingUp />}
                  label={`${area.promedio_cumplimiento}%`}
                  color={getColorCumplimiento(area.promedio_cumplimiento) as any}
                  variant="filled"
                />
              </Box>
            </Box>
          </AccordionSummary>
          
          <AccordionDetails>
            <Divider sx={{ mb: 2 }} />
            
            {/* Usuarios del área */}
            {area.usuarios.map((usuario) => (
              <Card key={usuario.usuario_id} sx={{ mb: 2, backgroundColor: '#fafafa' }}>
                <CardContent>
                  {/* Header del usuario */}
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#1976d2' }}>
                        {usuario.nombre_usuario}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {usuario.cargo}
                      </Typography>
                    </Box>
                    
                                         {/* Resumen del usuario */}
                     <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                       <Chip
                         icon={<Assessment />}
                         label={`${usuario.total_porcentaje}%`}
                         color="primary"
                         variant="outlined"
                         size="small"
                       />
                       <Chip
                         icon={<TrendingUp />}
                         label={`${usuario.promedio_cumplimiento}%`}
                         color={getColorCumplimiento(usuario.promedio_cumplimiento) as any}
                         variant="outlined"
                         size="small"
                       />
                       
                                               {/* Indicador de validación general del usuario */}
                        {(() => {
                          const componentesValidos = usuario.componentes.filter(c => c.validacion_porcentajes.es_valido).length;
                          const totalComponentes = usuario.componentes.length;
                          const todosValidos = componentesValidos === totalComponentes;
                          
                          return (
                            <Chip
                              icon={<Assessment />}
                              label={`${componentesValidos}/${totalComponentes} válidos`}
                              color={todosValidos ? 'success' : 'warning'}
                              variant="outlined"
                              size="small"
                            />
                          );
                        })()}
                     </Box>
                  </Box>

                  {/* Componentes del usuario */}
                  {usuario.componentes.length > 0 ? (
                    <Grid container spacing={2}>
                      {usuario.componentes.map((componente) => (
                        <Grid item xs={12} sm={6} md={4} key={componente.componente_id}>
                          <Card sx={{ height: '100%', backgroundColor: '#ffffff' }}>
                            <CardContent sx={{ p: 2 }}>
                                                             {/* Header del componente */}
                               <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ color: '#1976d2' }}>
                                 {componente.componente_nombre}
                               </Typography>
                               <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                                 {componente.tipo_nombre}
                               </Typography>
                               
                               {/* Chips de tipo */}
                               <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                 {componente.es_360 && (
                                   <Chip
                                     icon={<Star />}
                                     label="360°"
                                     size="small"
                                     color="primary"
                                     variant="outlined"
                                   />
                                 )}
                                 <Chip
                                   icon={<Work />}
                                   label="Actividades"
                                   size="small"
                                   color="secondary"
                                   variant="outlined"
                                 />
                               </Box>

                                                                                            {/* Porcentajes */}
                               <Box sx={{ mb: 2 }}>
                                 <Typography variant="caption" color="textSecondary" display="block">
                                   Objetivo: {componente.porcentaje_objetivo}%
                                 </Typography>
                                 
                                 {/* Desglose */}
                                 <Grid container spacing={1} sx={{ mb: 2 }}>
                                   {componente.es_360 && (
                                     <Grid item xs={6}>
                                       <Box sx={{ textAlign: 'center', p: 1, backgroundColor: '#fff3e0', borderRadius: 1 }}>
                                         <Typography variant="caption" display="block">360°</Typography>
                                         <Typography variant="body2" fontWeight="bold" color="#ff9800">
                                           {componente.porcentaje_360}%
                                         </Typography>
                                       </Box>
                                     </Grid>
                                   )}
                                   
                                   <Grid item xs={componente.es_360 ? 6 : 12}>
                                     <Box sx={{ textAlign: 'center', p: 1, backgroundColor: '#e8f5e9', borderRadius: 1 }}>
                                       <Typography variant="caption" display="block">Actividades</Typography>
                                       <Typography variant="body2" fontWeight="bold" color="#4caf50">
                                         {componente.porcentaje_actividades}%
                                       </Typography>
                                     </Box>
                                   </Grid>
                                 </Grid>
                                 
                                 {/* Total */}
                                 <Typography variant="h6" fontWeight="bold" sx={{ 
                                   color: getColorPorcentaje(componente.porcentaje_total),
                                   textAlign: 'center'
                                 }}>
                                   Total: {componente.porcentaje_total}%
                                 </Typography>
                               </Box>

                              {/* Barra de progreso */}
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                                  Cumplimiento: {componente.porcentaje_cumplimiento}%
                                </Typography>
                                <LinearProgress
                                  variant="determinate"
                                  value={Math.min(componente.porcentaje_cumplimiento, 100)}
                                  sx={{
                                    height: 6,
                                    borderRadius: 3,
                                    backgroundColor: '#e0e0e0',
                                    '& .MuiLinearProgress-bar': {
                                      backgroundColor: getColorPorcentaje(componente.porcentaje_cumplimiento),
                                      borderRadius: 3
                                    }
                                  }}
                                />
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Este usuario no tiene componentes evaluados
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </AccordionDetails>
        </Accordion>
      ))}
         </>
       )}

                    {/* Información adicional */}
       {tieneDatosGeneral && (
       <Box sx={{ mt: 4, p: 3, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
         <Typography variant="h6" gutterBottom sx={{ color: '#1976d2' }}>
           <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
           Información del Dashboard
         </Typography>
         <Typography variant="body2" color="textSecondary" paragraph>
           <strong>Vista General:</strong> Este dashboard muestra información completa de todas las áreas del sistema.
         </Typography>
         <Typography variant="body2" color="textSecondary" paragraph>
           <strong>Por Área:</strong> Cada área se puede expandir para ver usuarios y sus porcentajes detallados.
         </Typography>
         <Typography variant="body2" color="textSecondary">
           <strong>Por Usuario:</strong> Se muestran los porcentajes de cumplimiento por componente (360° y actividades).
         </Typography>
       </Box>
       )}
    </Box>
  );
}
