import {
  Box, Typography, Grid, Card, CardContent, LinearProgress, 
  Chip, IconButton, Tooltip, Button
} from '@mui/material';
import {
  Assessment, CheckCircle, Warning, 
  TrendingUp, Visibility, Edit, Refresh,
  Schedule
} from '@mui/icons-material';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { 
  getEvaluacionesDashboard, 
  getContratosUrgentesDashboard,
  getComponentes,
  getActividades,
  getAreas,
  getUsuarios,
  getContratosUsuarios
} from '../store/thunks/ThunksEvaluacionDesempeño.tsx';
import React from 'react';
import ContratosUrgentesCard from './ContratosUrgentesCard.tsx';

interface AreaEvaluaciones {
  nombre: string;
  evaluaciones: any[];
  total: number;
  completadas: number;
  pendientes: number;
  porcentajeCompletado: number;
  validacionPorcentajes: {
    esValido: boolean;
    suma: number;
    objetivo: number;
    diferencia: number;
  };
}


export default function EvaluacionDashboard() {
  const dispatch = useDispatch();
  
  // ✅ CARGAR DATOS LOCALMENTE COMO GestionContratosForm
  const [evaluaciones, setEvaluaciones] = useState<any[]>([]);
  const [componentes, setComponentes] = useState<any[]>([]);
  const [, setActividades] = useState<any[]>([]);
  const [, setAreas] = useState<any[]>([]);
  const [, setUsuarios] = useState<any[]>([]);
  const [contratosUsuarios, setContratosUsuarios] = useState<any[]>([]);
  const [asignacionesActividades, setAsignacionesActividades] = useState<any[]>([]);
  const [evaluacionesLocales, setEvaluacionesLocales] = useState<any[]>([]);

  const [stats, setStats] = useState({
    totalEvaluaciones: 0,
    evaluacionesCompletadas: 0,
    evaluacionesPendientes: 0,
    evaluaciones360: 0,
    evaluaciones180: 0,
    evaluaciones90: 0,
    porcentajeCompletado: 0
  });

  const [refreshing, setRefreshing] = useState(false);
  const [areasExpandidas, setAreasExpandidas] = useState<Set<string>>(new Set());

  // Funciones para cargar datos
  const fetchEvaluaciones = useCallback(async () => {
    try {
      const result = await dispatch(getEvaluacionesDashboard() as any);
      if (result?.evaluaciones) {
        setEvaluaciones(result.evaluaciones);
        setEvaluacionesLocales(result.evaluaciones);
      }
      if (result?.asignaciones_actividades) {
        setAsignacionesActividades(result.asignaciones_actividades);
      }
    } catch (error) {
      console.error('Error fetching evaluaciones:', error);
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

  const fetchActividades = useCallback(async () => {
    try {
      const result = await dispatch(getActividades() as any);
      if (result) {
        setActividades(result);
      }
    } catch (error) {
      console.error('Error fetching actividades:', error);
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

  const fetchUsuarios = useCallback(async () => {
    try {
      const result = await dispatch(getUsuarios() as any);
      if (result) {
        setUsuarios(result);
      }
    } catch (error) {
      console.error('Error fetching usuarios:', error);
    }
  }, [dispatch]);

  const fetchContratos = useCallback(async () => {
    try {
      const result = await dispatch(getContratosUsuarios() as any);
      if (result) {
        setContratosUsuarios(result);
      }
    } catch (error) {
      console.error('Error fetching contratos:', error);
    }
  }, [dispatch]);


  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      // Cargar todos los datos en paralelo
      await Promise.all([
        fetchEvaluaciones(),
        fetchComponentes(),
        fetchActividades(),
        fetchAreas(),
        fetchUsuarios(),
        fetchContratos()
      ]);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchEvaluaciones, fetchComponentes, fetchActividades, fetchAreas, fetchUsuarios, fetchContratos]);

  // Función para cargar contratos urgentes
  const cargarContratosUrgentes = useCallback(async () => {
    try {
      setLoadingContratos(true);
      setErrorContratos(null);
      
      const resultado = await dispatch(getContratosUrgentesDashboard() as any);
      
      if (resultado && resultado.success && resultado.contratos) {
        setContratosUsuarios(resultado.contratos);
      }
      
    } catch (error: any) {
      console.error('Error cargando contratos urgentes:', error);
      setErrorContratos(error.message || 'Error al cargar contratos urgentes');
    } finally {
      setLoadingContratos(false);
    }
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);




  useEffect(() => {
    // ✅ VALIDACIÓN: Verificar que los datos estén disponibles antes de calcular estadísticas
    if (!evaluacionesLocales || !Array.isArray(evaluacionesLocales) || !asignacionesActividades || !Array.isArray(asignacionesActividades)) {
      console.log('⚠️ useEffect de estadísticas: Datos no disponibles aún');
      return;
    }

    // Calcular estadísticas combinadas de evaluaciones y actividades
    const totalEvaluaciones = evaluacionesLocales.length;
    const totalActividades = asignacionesActividades.length;
    const totalGeneral = totalEvaluaciones + totalActividades;
    
    if (totalGeneral > 0) {
      const evaluacionesCompletadas = evaluacionesLocales.filter((e: any) => e && e.completada).length;
      const actividadesCompletadas = asignacionesActividades.filter((a: any) => a && a.completada).length;
      const totalCompletadas = evaluacionesCompletadas + actividadesCompletadas;
      const totalPendientes = totalGeneral - totalCompletadas;
      
      const tipo360 = evaluacionesLocales.filter((e: any) => e && e.tipo === '360').length;
      const tipo180 = evaluacionesLocales.filter((e: any) => e && e.tipo === '180').length;
      const tipo90 = evaluacionesLocales.filter((e: any) => e && e.tipo === '90').length;

      setStats({
        totalEvaluaciones: totalGeneral,
        evaluacionesCompletadas: totalCompletadas,
        evaluacionesPendientes: totalPendientes,
        evaluaciones360: tipo360,
        evaluaciones180: tipo180,
        evaluaciones90: tipo90,
        porcentajeCompletado: totalGeneral > 0 ? Math.round((totalCompletadas / totalGeneral) * 100) : 0
      });
    } else {
      // ✅ FALLBACK: Establecer estadísticas por defecto si no hay datos
      setStats({
        totalEvaluaciones: 0,
        evaluacionesCompletadas: 0,
        evaluacionesPendientes: 0,
        evaluaciones360: 0,
        evaluaciones180: 0,
        evaluaciones90: 0,
        porcentajeCompletado: 0
      });
    }
  }, [evaluacionesLocales, asignacionesActividades]);

  const getComponenteStats = () => {
    // ✅ VALIDACIÓN ADICIONAL: Verificar que los datos estén disponibles
    if (!componentes || !Array.isArray(componentes) || componentes.length === 0) {
      console.log('⚠️ getComponenteStats: No hay componentes disponibles');
      return [];
    }
    
    if (!evaluacionesLocales || !Array.isArray(evaluacionesLocales)) {
      console.log('⚠️ getComponenteStats: No hay evaluaciones locales disponibles');
      return [];
    }
    
    if (!asignacionesActividades || !Array.isArray(asignacionesActividades)) {
      console.log('⚠️ getComponenteStats: No hay asignaciones de actividades disponibles');
      return [];
    }

    const stats = componentes.map((componente: any) => {
      // ✅ VALIDACIÓN: Verificar que el componente tenga las propiedades necesarias
      if (!componente || !componente.id || !componente.tipo_nombre || !componente.area_nombre) {
        console.warn('⚠️ Componente inválido:', componente);
        return null;
      }

      // Evaluaciones del componente
      const evaluacionesComponente = evaluacionesLocales.filter((e: any) => e.componente === componente.id);
      const evaluacionesCompletadas = evaluacionesComponente.filter((e: any) => e.completada).length;
      const totalEvaluaciones = evaluacionesComponente.length;
      
      // Actividades del componente (filtrar por nombre del componente)
      const actividadesComponente = asignacionesActividades.filter((a: any) => 
        a.componente_nombre?.includes(componente.tipo_nombre)
      );
      const actividadesCompletadas = actividadesComponente.filter((a: any) => a.completada).length;
      const totalActividades = actividadesComponente.length;
      
      // Totales combinados
      const total = totalEvaluaciones + totalActividades;
      const completadas = evaluacionesCompletadas + actividadesCompletadas;
      
      // Calcular puntajes reales
      let puntajeReal360 = 0;
      let puntajeRealActividades = 0;
      
      // Puntaje real de evaluaciones 360/180
      if (evaluacionesCompletadas > 0) {
        const evaluacionesConPuntajes = evaluacionesComponente.filter((e: any) => 
          e && e.asignaciones_con_puntajes && Array.isArray(e.asignaciones_con_puntajes) && e.asignaciones_con_puntajes.length > 0
        );
        if (evaluacionesConPuntajes.length > 0) {
          const puntajes = evaluacionesConPuntajes.map((e: any) => {
            const asignacion = e.asignaciones_con_puntajes[0];
            // ✅ VALIDACIÓN ADICIONAL: Verificar que asignacion existe y tiene la estructura esperada
            if (!asignacion || !asignacion.puntaje_360_180) {
              console.warn('⚠️ Asignación o puntaje_360_180 no encontrado:', asignacion);
              return 0;
            }
            return asignacion.puntaje_360_180.porcentaje || 0;
          });
          puntajeReal360 = puntajes.reduce((sum, p) => sum + p, 0) / puntajes.length;
        }
      }
      
      // Puntaje real de actividades
      if (actividadesCompletadas > 0) {
        const actividadesConPuntajes = actividadesComponente.filter((a: any) => a && a.puntaje_actividad);
        if (actividadesConPuntajes.length > 0) {
          const puntajes = actividadesConPuntajes.map((a: any) => a.puntaje_actividad.porcentaje || 0);
          puntajeRealActividades = puntajes.reduce((sum, p) => sum + p, 0) / puntajes.length;
        }
      }
      
      return {
        nombre: componente.tipo_nombre,
        area: componente.area_nombre,
        total,
        completadas,
        porcentaje: total > 0 ? Math.round((completadas / total) * 100) : 0,
        es360: componente.es_360,
        evaluaciones: totalEvaluaciones,
        actividades: totalActividades,
        puntajeReal360: Math.round(puntajeReal360 * 100) / 100,
        puntajeRealActividades: Math.round(puntajeRealActividades * 100) / 100
      };
    });

    // ✅ FILTRAR: Remover elementos null y filtrar por total > 0
    return stats.filter(stat => stat !== null && stat.total > 0);
  };

  const getRecentEvaluaciones = () => {
    // ✅ VALIDACIÓN: Verificar que evaluacionesLocales esté disponible
    if (!evaluacionesLocales || !Array.isArray(evaluacionesLocales) || evaluacionesLocales.length === 0) {
      console.log('⚠️ getRecentEvaluaciones: No hay evaluaciones locales disponibles');
      return [];
    }
    
    try {
      return [...evaluacionesLocales]
        .filter((e: any) => e && e.fecha) // ✅ FILTRAR: Solo elementos válidos con fecha
        .sort((a: any, b: any) => {
          try {
            const fechaA = new Date(a.fecha).getTime();
            const fechaB = new Date(b.fecha).getTime();
            return fechaB - fechaA;
          } catch (error) {
            console.warn('⚠️ Error al ordenar fechas:', error);
            return 0;
          }
        })
        .slice(0, 5);
    } catch (error) {
      console.error('❌ Error en getRecentEvaluaciones:', error);
      return [];
    }
  };

  const toggleAreaExpandida = (areaNombre: string) => {
    setAreasExpandidas(prev => {
      const nuevo = new Set(prev);
      if (nuevo.has(areaNombre)) {
        nuevo.delete(areaNombre);
      } else {
        nuevo.add(areaNombre);
      }
      return nuevo;
    });
  };

  const getEvaluacionesPorArea = (): AreaEvaluaciones[] => {
    // ✅ VALIDACIÓN: Verificar que los datos estén disponibles
    if (!evaluacionesLocales || !Array.isArray(evaluacionesLocales)) {
      console.log('⚠️ getEvaluacionesPorArea: No hay evaluaciones locales disponibles');
      return [];
    }
    
    if (!asignacionesActividades || !Array.isArray(asignacionesActividades)) {
      console.log('⚠️ getEvaluacionesPorArea: No hay asignaciones de actividades disponibles');
      return [];
    }

    try {
      // Combinar evaluaciones tradicionales y asignaciones de actividades
      const evaluacionesRecientes = getRecentEvaluaciones();
      const actividadesRecientes = asignacionesActividades.slice(0, 10); // Máximo 10 actividades
      
      console.log('🔍 getEvaluacionesPorArea ejecutado:');
      console.log('   - evaluacionesRecientes:', evaluacionesRecientes.length);
      console.log('   - actividadesRecientes:', actividadesRecientes.length);
      console.log('   - evaluacionesLocales total:', evaluacionesLocales.length);
      console.log('   - asignacionesActividades total:', asignacionesActividades.length);
      
      // Crear un mapa combinado
      const evaluacionesPorArea = new Map<string, AreaEvaluaciones>();
      
      // Procesar evaluaciones tradicionales
      evaluacionesRecientes.forEach((evaluacion: any) => {
        // ✅ VALIDACIÓN: Verificar que la evaluación sea válida
        if (!evaluacion || typeof evaluacion !== 'object') {
          console.warn('⚠️ Evaluación inválida en getEvaluacionesPorArea:', evaluacion);
          return;
        }
        
        const areaKey = evaluacion.area_grupo_nombre || 'Sin área';
        if (!evaluacionesPorArea.has(areaKey)) {
          evaluacionesPorArea.set(areaKey, {
            nombre: areaKey,
            evaluaciones: [],
            total: 0,
            completadas: 0,
            pendientes: 0,
            porcentajeCompletado: 0,
            validacionPorcentajes: {
              esValido: true,
              suma: 0,
              objetivo: 0,
              diferencia: 0
            }
          });
        }
        
        const area = evaluacionesPorArea.get(areaKey)!;
        area.evaluaciones.push({
          ...evaluacion,
          tipo: 'evaluacion',
          es_actividad: false
        });
        area.total++;
        if (evaluacion.completada) {
          area.completadas++;
        } else {
          area.pendientes++;
        }
      });
      
      // Procesar asignaciones de actividades
      actividadesRecientes.forEach((actividad: any) => {
        // ✅ VALIDACIÓN: Verificar que la actividad sea válida
        if (!actividad || typeof actividad !== 'object') {
          console.warn('⚠️ Actividad inválida en getEvaluacionesPorArea:', actividad);
          return;
        }
        
        const areaKey = actividad.componente_nombre?.split(' - ')[1] || 'Sin área';
        if (!evaluacionesPorArea.has(areaKey)) {
          evaluacionesPorArea.set(areaKey, {
            nombre: areaKey,
            evaluaciones: [],
            total: 0,
            completadas: 0,
            pendientes: 0,
            porcentajeCompletado: 0,
            validacionPorcentajes: {
              esValido: true,
              suma: 0,
              objetivo: 0,
              diferencia: 0
            }
          });
        }
        
        const area = evaluacionesPorArea.get(areaKey)!;
        area.evaluaciones.push({
          ...actividad,
          tipo: 'actividad',
          es_actividad: true,
          usuario_evaluado_nombre: actividad.usuario_asignado_nombre,
          evaluador_nombre: actividad.evaluador_nombre,
          componente_nombre: actividad.componente_nombre,
          area_grupo_nombre: areaKey,
          completada: actividad.completada
        });
        area.total++;
        if (actividad.completada) {
          area.completadas++;
        } else {
          area.pendientes++;
        }
      });

      const resultado = Array.from(evaluacionesPorArea.values());
      console.log('✅ getEvaluacionesPorArea - resultado final:', resultado.length, 'áreas');
      return resultado;
    } catch (error) {
      console.error('❌ Error en getEvaluacionesPorArea:', error);
      return [];
    }
  };

  // ✅ TRANSFORMAR Y ORDENAR CONTRATOS POR FECHA DE VENCIMIENTO
  const contratos = useMemo(() => {
    if (!contratosUsuarios || !Array.isArray(contratosUsuarios)) {
      return [];
    }
    
    const contratosTransformados = contratosUsuarios.map((contrato: any) => ({
      id: contrato.id,
      usuario_id: contrato.usuario_id,
      identificacion: contrato.identificacion,
      tipo_contrato: contrato.tipo_contrato,
      fecha_inicio: contrato.fecha_inicio,
      fecha_fin: contrato.fecha_fin,
      cargo: contrato.cargo,
      area_id: contrato.area,
      area_nombre: contrato.area_nombre,
      area_color: '#3b82f6',
      dias_restantes: contrato.dias_restantes,
      urgencia: (contrato.dias_restantes <= 7 ? 'critica' : 
                contrato.dias_restantes <= 15 ? 'alta' : 
                contrato.dias_restantes <= 30 ? 'media' : 'baja') as 'critica' | 'alta' | 'media' | 'baja' | 'vigente',
      prioridad: contrato.dias_restantes <= 7 ? 1 : 
                 contrato.dias_restantes <= 15 ? 2 : 
                 contrato.dias_restantes <= 30 ? 3 : 4,
      salario: contrato.salario ? parseFloat(contrato.salario) : null,
      activo: contrato.activo,
      created_at: contrato.created_at,
      updated_at: contrato.updated_at,
      nombre_usuario: contrato.usuario_nombre,
      nombre_completo: contrato.usuario_nombre,
      email_usuario: null,
      username_usuario: null,
      first_name: contrato.usuario_nombre?.split(' ')[0] || '',
      last_name: contrato.usuario_nombre?.split(' ').slice(1).join(' ') || '',
      nombre: contrato.usuario_nombre,
      cargo_usuario: contrato.cargo,
      is_active: contrato.activo,
      date_joined: null
    }));

    // Ordenar por prioridad (menor número = mayor prioridad) y luego por días restantes
    return contratosTransformados.sort((a, b) => {
      if (a.prioridad !== b.prioridad) {
        return a.prioridad - b.prioridad;
      }
      return a.dias_restantes - b.dias_restantes;
    });
  }, [contratosUsuarios]);
  const [loadingContratos, setLoadingContratos] = useState(false);
  const [errorContratos, setErrorContratos] = useState<string | null>(null);

  // ✅ FUNCIÓN PARA REFRESCAR CONTRATOS (ESTRATEGIA ROBUSTA)
  const refreshContratos = async () => {
    try {
      console.log('🔄 REFRESH: Iniciando recarga forzada de contratos...');
      
      // SINCRONIZACIÓN ROBUSTA: Recarga inmediata + diferida
      console.log('🔄 SINCRONIZANDO: Recargando contratos desde backend...');
      await cargarContratosUrgentes();
      
      // Recarga adicional después de un delay para asegurar sincronización
      setTimeout(async () => {
        console.log('🔄 VERIFICACIÓN: Recargando contratos nuevamente para asegurar sincronización...');
        await cargarContratosUrgentes();
      }, 1000);
      
    } catch (error: any) {
      console.error('❌ Error en refresh de contratos:', error);
    }
  };

  // ✅ DEBUG: Monitorear cambios en el estado de contratos
  useEffect(() => {
    console.log('🔍 DEBUG CONTRATOS - Estado actualizado:');
    console.log('   - Cantidad de contratos:', contratos?.length || 0);
    console.log('   - Loading:', loadingContratos);
    console.log('   - Error:', errorContratos);
    if (contratos && contratos.length > 0) {
      console.log('   - Primer contrato:', contratos[0]);
      console.log('   - Campos disponibles:', Object.keys(contratos[0]));
    }
  }, [contratos, loadingContratos, errorContratos]);



  return (
    <Box>
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
              DASHBOARD DE EVALUACIONES
            </Typography>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={() => {
                console.log('🔄 Botón Actualizar clickeado');
                console.log('   - Estado actual evaluaciones:', evaluaciones?.length || 0);
                console.log('   - Estado actual evaluacionesLocales:', evaluacionesLocales?.length || 0);
                console.log('   - Estado actual asignacionesActividades:', asignacionesActividades?.length || 0);
                loadData();
              }}
              disabled={refreshing}
              sx={{
                backgroundColor: 'rgba(221, 239, 254, 0.9)',
                color: '#4a4a4a',
                '&:hover': { backgroundColor: 'rgba(221, 239, 254, 1)' },
                '&:disabled': { backgroundColor: 'rgba(255,255,255,0.3)' }
              }}
            >
              {refreshing ? 'Actualizando...' : 'Actualizar'}
            </Button>
            
            {/* ✅ BOTÓN DE DEBUG PARA CONTRATOS (ESTRATEGIA ROBUSTA) */}
            <Button
              variant="outlined"
              startIcon={<Schedule />}
              onClick={() => {
                console.log('🔍 Botón Debug Contratos clickeado');
                console.log('   - Estado actual contratos:', contratos?.length || 0);
                console.log('   - Loading contratos:', loadingContratos);
                console.log('   - Error contratos:', errorContratos);
                refreshContratos(); // ✅ USAR FUNCIÓN ROBUSTA
              }}
              disabled={loadingContratos}
              sx={{
                borderColor: '#ff9800',
                color: '#ff9800',
                '&:hover': { 
                  borderColor: '#e65100',
                  backgroundColor: 'rgba(255, 152, 0, 0.1)'
                }
              }}
            >
              {loadingContratos ? 'Cargando...' : 'Debug Contratos'}
            </Button>
            
            {/* ✅ BOTÓN DE REFRESH ESPECÍFICO PARA CONTRATOS */}
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={() => {
                console.log('🔄 Botón Refresh Contratos clickeado');
                refreshContratos();
              }}
              disabled={loadingContratos}
              sx={{
                backgroundColor: '#4caf50',
                color: 'white',
                '&:hover': { backgroundColor: '#45a049' }
              }}
            >
              {loadingContratos ? 'Cargando...' : 'Refresh Contratos'}
            </Button>
          </Box>
        </Box>
      </Box>



      {/* Estadísticas Generales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #e8e3f3 0%, #f0ebf8 100%)',
            color: '#4a4a4a',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(232, 227, 243, 0.4)',
            transition: 'transform 0.3s ease',
            '&:hover': { transform: 'translateY(-4px)' }
          }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Assessment sx={{ fontSize: 40, mb: 2, opacity: 0.9 }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Total Evaluaciones
              </Typography>
              <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
                {(() => {
                  console.log('🔍 Renderizando Total Evaluaciones:', stats.totalEvaluaciones);
                  return stats.totalEvaluaciones;
                })()}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b6b6b' }}>
                En el sistema
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #ddeffe 0%, #e8f4f8 100%)',
            color: '#4a4a4a',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(221, 239, 254, 0.4)',
            transition: 'transform 0.3s ease',
            '&:hover': { transform: 'translateY(-4px)' }
          }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <CheckCircle sx={{ fontSize: 40, mb: 2, opacity: 0.9 }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Completadas
              </Typography>
              <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
                {(() => {
                  console.log('🔍 Renderizando Completadas:', stats.evaluacionesCompletadas);
                  return stats.evaluacionesCompletadas;
                })()}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b6b6b' }}>
                Finalizadas exitosamente
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #ffecd1 0%, #fcf4e4 100%)',
            color: '#4a4a4a',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(255, 236, 209, 0.4)',
            transition: 'transform 0.3s ease',
            '&:hover': { transform: 'translateY(-4px)' }
          }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Warning sx={{ fontSize: 40, mb: 2, opacity: 0.9 }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Pendientes
              </Typography>
              <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
                {(() => {
                  console.log('🔍 Renderizando Pendientes:', stats.evaluacionesPendientes);
                  return stats.evaluacionesPendientes;
                })()}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b6b6b' }}>
                Por completar
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            color: '#333',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(168, 237, 234, 0.3)',
            transition: 'transform 0.3s ease',
            '&:hover': { transform: 'translateY(-4px)' }
          }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <TrendingUp sx={{ fontSize: 40, mb: 2, color: '#7b1fa2', opacity: 0.9 }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#7b1fa2' }}>
                Progreso
              </Typography>
              <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 1, color: '#7b1fa2' }}>
                {(() => {
                  console.log('🔍 Renderizando Progreso:', stats.porcentajeCompletado);
                  return stats.porcentajeCompletado;
                })()}%
              </Typography>
              <Typography variant="body2" sx={{ color: '#7b1fa2', opacity: 0.8 }}>
                Total completado
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tipos de Evaluación */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Tipos de Evaluación
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Evaluaciones 360° */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Chip label="360°" color="primary" size="small" sx={{ mr: 1 }} />
                    <Typography>Evaluaciones 360°</Typography>
                  </Box>
                  <Typography variant="h6">{stats.evaluaciones360}</Typography>
                </Box>
                {/* Evaluaciones 180° */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Chip label="180°" color="secondary" size="small" sx={{ mr: 1 }} />
                    <Typography>Evaluaciones 180°</Typography>
                  </Box>
                  <Typography variant="h6">{stats.evaluaciones180}</Typography>
                </Box>
                {/* Evaluaciones 90° */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Chip label="90°" color="default" size="small" sx={{ mr: 1 }} />
                    <Typography>Evaluaciones 90°</Typography>
                  </Box>
                  <Typography variant="h6">{stats.evaluaciones90}</Typography>
                </Box>
                {/* Separador */}
                <Box sx={{ borderTop: '1px solid #e0e0e0', pt: 1, mt: 1 }} />
                {/* Actividades Laborales */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Chip label="ACT" color="success" size="small" sx={{ mr: 1 }} />
                    <Typography>Actividades Laborales</Typography>
                  </Box>
                  <Typography variant="h6">{asignacionesActividades.length}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Progreso por Componente
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {(() => {
                  try {
                    // ✅ VALIDACIÓN: Verificar que los datos estén disponibles antes de llamar getComponenteStats
                    if (!componentes || !Array.isArray(componentes) || componentes.length === 0 ||
                        !evaluacionesLocales || !Array.isArray(evaluacionesLocales) ||
                        !asignacionesActividades || !Array.isArray(asignacionesActividades)) {
                      console.log('⚠️ Render: Datos no disponibles para getComponenteStats');
                      return (
                        <Typography variant="body2" color="textSecondary" textAlign="center">
                          Cargando datos...
                        </Typography>
                      );
                    }

                    const stats = getComponenteStats();
                    console.log('🔍 Renderizando progreso por componente:', stats.length, 'componentes');
                    
                    if (!stats || stats.length === 0) {
                      return (
                        <Typography variant="body2" color="textSecondary" textAlign="center">
                          No hay datos disponibles
                        </Typography>
                      );
                    }

                    return stats.map((stat, index) => {
                      // ✅ VALIDACIÓN: Verificar que stat sea válido
                      if (!stat || typeof stat !== 'object') {
                        console.warn('⚠️ Stat inválido en render:', stat);
                        return null;
                      }

                      return (
                        <Box key={index}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">
                              {stat.nombre || 'N/A'} - {stat.area || 'N/A'}
                            </Typography>
                            <Typography variant="body2">
                              {stat.completadas || 0}/{stat.total || 0} ({stat.porcentaje || 0}%)
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={stat.porcentaje || 0}
                            sx={{ 
                              height: 8, 
                              borderRadius: 4,
                              backgroundColor: stat.es360 ? '#e3f2fd' : '#f3e5f5'
                            }}
                          />
                          {/* Detalle de evaluaciones vs actividades */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                            <Typography variant="caption" color="textSecondary">
                              Eval: {stat.evaluaciones || 0} | Act: {stat.actividades || 0}
                            </Typography>
                          </Box>
                          {/* Puntajes reales */}
                          {stat.puntajeReal360 && stat.puntajeReal360 > 0 && (
                            <Box sx={{ mt: 1, p: 1, backgroundColor: '#E3F2FD', borderRadius: 1 }}>
                              <Typography variant="caption" color="textSecondary" display="block">
                                📊 Puntaje 360°: {stat.puntajeReal360}%
                              </Typography>
                            </Box>
                          )}
                          {stat.puntajeRealActividades && stat.puntajeRealActividades > 0 && (
                            <Box sx={{ mt: 1, p: 1, backgroundColor: '#F3E5F5', borderRadius: 1 }}>
                              <Typography variant="caption" color="textSecondary" display="block">
                                🏆 Puntaje Actividades: {stat.puntajeRealActividades}%
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      );
                    }).filter(Boolean); // ✅ FILTRAR: Remover elementos null
                  } catch (error) {
                    console.error('❌ Error en render de progreso por componente:', error);
                    return (
                      <Typography variant="body2" color="error" textAlign="center">
                        Error al cargar datos
                      </Typography>
                    );
                  }
                })()}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Evaluaciones y Actividades por Área */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ color: '#333', fontWeight: 'bold', mb: 3 }}>
          Evaluaciones y Actividades por Área
        </Typography>
        
        {(() => {
          try {
            // ✅ VALIDACIÓN: Verificar que los datos estén disponibles antes de llamar getEvaluacionesPorArea
            if (!evaluacionesLocales || !Array.isArray(evaluacionesLocales) ||
                !asignacionesActividades || !Array.isArray(asignacionesActividades)) {
              console.log('⚠️ Render: Datos no disponibles para getEvaluacionesPorArea');
              return (
                <Typography variant="body2" color="textSecondary" textAlign="center">
                  Cargando datos...
                </Typography>
              );
            }

            const areas = getEvaluacionesPorArea();
            console.log('🔍 Renderizando evaluaciones por área:', areas.length, 'áreas');
            
            if (!areas || areas.length === 0) {
              return (
                <Typography variant="body2" color="textSecondary" textAlign="center">
                  No hay datos disponibles
                </Typography>
              );
            }

            return areas.map((area) => {
              // ✅ VALIDACIÓN: Verificar que area sea válido
              if (!area || typeof area !== 'object') {
                console.warn('⚠️ Area inválida en render:', area);
                return null;
              }

              return (
                <Card
                  key={area.nombre || 'sin-nombre'}
                  sx={{
                    mb: 2,
                    backgroundColor: '#F3E5F5',
                    border: '1px solid #E1BEE7',
                    '&:hover': {
                      boxShadow: 3,
                      transform: 'translateY(-2px)',
                      transition: 'all 0.3s ease-in-out'
                    }
                  }}
                >
            {/* Header del área */}
            <Box
              sx={{
                backgroundColor: area.pendientes > 0 ? '#E8EAF6' : '#F1F8E9',
                p: 2,
                borderBottom: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: area.pendientes > 0 ? '#9FA8DA' : '#A5D6A7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1.2rem'
                  }}
                >
                  {area.total}
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#4A148C' }}>
                    {area.nombre}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {area.total} evaluación{area.total !== 1 ? 'es' : ''} • {area.pendientes} pendiente{area.pendientes !== 1 ? 's' : ''} • {area.completadas} completada{area.completadas !== 1 ? 's' : ''}
          </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={`${area.pendientes} pendiente${area.pendientes !== 1 ? 's' : ''}`}
                    size="small"
                    sx={{
                      backgroundColor: '#FFB74D',
                      color: '#E65100',
                      fontWeight: 'bold'
                    }}
                  />
                      <Chip 
                    label={`${area.completadas} completada${area.completadas !== 1 ? 's' : ''}`}
                        size="small"
                    sx={{
                      backgroundColor: '#81C784',
                      color: '#2E7D32',
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => toggleAreaExpandida(area.nombre)}
                  sx={{
                    borderColor: '#9C27B0',
                    color: '#9C27B0',
                    '&:hover': {
                      borderColor: '#7B1FA2',
                      backgroundColor: '#F3E5F5'
                    }
                  }}
                >
                  {areasExpandidas.has(area.nombre) ? 'OCULTAR DETALLES' : 'VER DETALLES'}
                </Button>
              </Box>
            </Box>
            
            {/* Lista de evaluaciones del área (expandible) */}
            {areasExpandidas.has(area.nombre) && (
              <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
                {/* Separar evaluaciones y actividades */}
                {(() => {
                  const evaluaciones = area.evaluaciones.filter((e: any) => !e.es_actividad);
                  const actividades = area.evaluaciones.filter((e: any) => e.es_actividad);
                  
                  return (
                    <>
                      {/* Sección de Evaluaciones */}
                      {evaluaciones.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: '#666' }}>
                            📊 Evaluaciones 360° del área:
                          </Typography>
                          
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {evaluaciones.map((evaluacion: any) => (
                              <Card
                                key={evaluacion.id}
                                sx={{
                                  backgroundColor: '#F8F5FF',
                                  border: '1px solid #D1C4E9',
                                  '&:hover': {
                                    boxShadow: 2,
                                    transform: 'translateY(-1px)',
                                    transition: 'all 0.2s ease-in-out'
                                  }
                                }}
                              >
                                <CardContent sx={{ p: 3 }}>
                                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                    <Box>
                                      <Typography variant="h6" fontWeight="bold" sx={{ mb: 1, color: '#4A148C' }}>
                                        {evaluacion.usuario_evaluado_nombre || 'N/A'}
                                      </Typography>
                                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                                        {evaluacion.componente_nombre || 'N/A'}
                                      </Typography>
                                    </Box>
                      <Chip 
                        label={evaluacion.completada ? 'Completada' : 'Pendiente'}
                                      size="medium"
                                      sx={{
                                        backgroundColor: evaluacion.completada ? '#E0F2F1' : '#FFF3E0',
                                        color: evaluacion.completada ? '#00695C' : '#E65100',
                                        fontWeight: 'bold'
                                      }}
                                    />
                                  </Box>
                                  
                                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                                    <Chip
                                      label={evaluacion.tipo}
                                      size="medium"
                                      sx={{
                                        backgroundColor: 
                                          evaluacion.tipo === '360' ? '#E1F5FE' : 
                                          evaluacion.tipo === '180' ? '#F3E5F5' : '#FCE4EC',
                                        color: 
                                          evaluacion.tipo === '360' ? '#0277BD' : 
                                          evaluacion.tipo === '180' ? '#6A1B9A' : '#AD1457',
                                        fontWeight: 'bold'
                                      }}
                                    />
                                    <Box>
                                      <Typography variant="caption" color="textSecondary" display="block">
                                        Evaluador:
                                      </Typography>
                                      <Typography variant="body2" fontWeight="medium">
                                        {evaluacion.evaluador_nombre || 'N/A'}
                                      </Typography>
                                    </Box>
                                  </Box>
                                  
                                  <Box display="flex" gap={1} justifyContent="flex-end">
                      <Tooltip title="Ver detalles">
                        <IconButton size="small">
                                        <Visibility sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton size="small">
                                        <Edit sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                                  </Box>
                                </CardContent>
                              </Card>
                            ))}
                          </Box>
                        </Box>
                      )}
                      
                      {/* Sección de Actividades */}
                      {actividades.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: '#666' }}>
                            📋 Actividades Laborales del área:
                          </Typography>
                          
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {actividades.map((actividad: any) => (
                              <Card
                                key={actividad.id}
                                sx={{
                                  backgroundColor: '#FCE4EC',
                                  border: '1px solid #F8BBD9',
                                  '&:hover': {
                                    boxShadow: 2,
                                    transform: 'translateY(-1px)',
                                    transition: 'all 0.2s ease-in-out'
                                  }
                                }}
                              >
                                <CardContent sx={{ p: 3 }}>
                                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                    <Box>
                                      <Typography variant="h6" fontWeight="bold" sx={{ mb: 1, color: '#AD1457' }}>
                                        {actividad.usuario_evaluado_nombre || 'N/A'}
                                      </Typography>
                                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                                        {actividad.actividad_nombre || 'N/A'}
                                      </Typography>
                                    </Box>
                                    <Chip
                                      label={actividad.completada ? 'Completada' : 'Pendiente'}
                                      size="medium"
                                      sx={{
                                        backgroundColor: actividad.completada ? '#E0F2F1' : '#FFF3E0',
                                        color: actividad.completada ? '#00695C' : '#E65100',
                                        fontWeight: 'bold'
                                      }}
                                    />
                                  </Box>
                                  
                                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                                    <Chip
                                      label="ACTIVIDAD"
                                      size="medium"
                                      sx={{
                                        backgroundColor: '#FCE4EC',
                                        color: '#AD1457',
                                        fontWeight: 'bold'
                                      }}
                                    />
                                    <Box>
                                      <Typography variant="caption" color="textSecondary" display="block">
                                        Actividad:
                                      </Typography>
                                      <Typography variant="body2" fontWeight="medium">
                                        {actividad.componente_nombre || 'N/A'}
                                      </Typography>
                                    </Box>
                                  </Box>
                                  
                                  {/* Información adicional para actividades */}
                                  <Box sx={{ mb: 2, p: 2, backgroundColor: '#F5F5F5', borderRadius: 1 }}>
                                    <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 1 }}>
                                      Fecha límite:
                                    </Typography>
                                    <Typography variant="body2" fontWeight="medium">
                                      {new Date(actividad.fecha_limite).toLocaleDateString('es-ES')}
                                    </Typography>
                                  </Box>
                                  
                                  <Box display="flex" gap={1} justifyContent="flex-end">
                                    <Tooltip title="Ver detalles">
                                      <IconButton size="small">
                                        <Visibility sx={{ fontSize: 16 }} />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Editar">
                                      <IconButton size="small">
                                        <Edit sx={{ fontSize: 16 }} />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
        </CardContent>
      </Card>
                            ))}
                          </Box>
                        </Box>
                      )}
                    </>
                  );
                })()}
              </Box>
            )}
          </Card>
              );
            }).filter(Boolean); // ✅ FILTRAR: Remover elementos null
          } catch (error) {
            console.error('❌ Error en render de evaluaciones por área:', error);
            return (
              <Typography variant="body2" color="error" textAlign="center">
                Error al cargar datos
              </Typography>
            );
          }
        })()}
      </Box>

      {/* ✅ NUEVA SECCIÓN: Contratos por Vencer */}
      <ContratosUrgentesCard 
        contratos={contratos}
        loading={loadingContratos}
      />
    </Box>
  );
} 
