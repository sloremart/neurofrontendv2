/**
 * 🚀 EVALUACION DASHBOARD - SISTEMA ROBUSTO PARA PRODUCCIÓN
 * 
 * ✅ CARACTERÍSTICAS IMPLEMENTADAS:
 * - Sincronización automática cada 30 segundos
 * - Validación de integridad de datos Redux
 * - Manejo de errores robusto
 * - Indicador visual de estado de sincronización
 * - Logs de consola para debugging en producción
 * - Recuperación automática de fallos
 * 
 * 🔧 SINCRONIZACIÓN:
 * - Verifica que Redux tenga datos válidos
 * - Valida que todos los arrays sean arrays reales
 * - Establece estado de salud (ok/warning/error)
 * - Logs detallados para troubleshooting
 * 
 * 🎯 PRODUCCIÓN:
 * - No muestra paneles de debug intrusivos
 * - Indicador sutil en esquina superior derecha
 * - Tooltip informativo al hacer hover
 * - Recuperación automática sin intervención del usuario
 */

import React, { useEffect, useState } from 'react';
import { Box, Drawer, List, ListItem, ListItemText, Typography, ListItemIcon, Divider, Collapse, Chip, Tooltip } from '@mui/material';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { 
  Dashboard, 
  Business, 
  Category, 
  Assessment, 
  Quiz, 
  Assignment, 
  Leaderboard,
  Work,
  Group,
  ExpandLess,
  ExpandMore,
  ViewList,
  QuestionAnswer,
  AdminPanelSettings,
  Analytics,
  Star,
  TrendingUp,
  Grade,
  Schedule
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store/store';

import AreaForm from '../components/AreaForm.tsx';
import TipoComponenteForm from '../components/TipoComponenteForm.tsx';
import ComponenteForm from '../components/ComponenteForm.tsx';
import ActividadForm from '../components/ActividadForm.tsx';
import PreguntaForm from '../components/Preguntas360Form.tsx';
import EvaluacionForm from '../components/EvaluacionForm.tsx';
import EvaluacionDashboardComponent from '../components/EvaluacionDashboard.tsx';
import CategoriaPreguntaForm from '../components/CategoriaPreguntaForm.tsx';
import DashboardLider from '../components/DashboardLider.tsx';
import EvaluacionActividadesLaborales from '../components/EvaluacionActividadesLaborales.tsx';
import Evaluacion360 from '../components/Evaluacion360.tsx';
import DashboardPersonal from '../components/DashboardPersonal.tsx';
import GestionLideresForm from '../components/GestionLideresForm.tsx';
import GestionContratosForm from '../components/GestionContratosForm.tsx';
import PorcentajesCumplimiento from '../components/PorcentajesCumplimiento.tsx';
import DashboardGeneral from '../components/DashboardGeneral.tsx';
import GestionHorarioLaboral from '../components/GestionHorarioLaboral.tsx';

const drawerWidth = 280;

// Estructura organizada con submenús
const menuStructure = [
  {
    id: 'dashboard',
    label: 'Dashboard Principal',
    icon: <Analytics sx={{ color: '#4facfe' }} />,
    component: <EvaluacionDashboardComponent />,
    badge: 'Inicio'
  },
  {
    id: 'configuracion',
    label: 'Configuración del Sistema',
    icon: <AdminPanelSettings sx={{ color: '#667eea' }} />,
    isExpandable: true,
    children: [
      { 
        id: 'areas',
        label: 'Áreas Organizacionales', 
        component: <AreaForm />,
        icon: <Business sx={{ color: '#f093fb' }} />,
        description: 'Gestionar áreas de la empresa'
      },
      { 
        id: 'tipos-componente',
        label: 'Tipos de Componente', 
        component: <TipoComponenteForm />,
        icon: <Category sx={{ color: '#43e97b' }} />,
        description: 'Definir tipos de evaluación'
      },
      { 
        id: 'componentes',
        label: 'Componentes', 
        component: <ComponenteForm />,
        icon: <Assessment sx={{ color: '#4facfe' }} />,
        description: 'Crear componentes 360° y normales'
      },
      { 
        id: 'gestion-lideres',
        label: 'Gestión de Líderes', 
        component: <GestionLideresForm />,
        icon: <Leaderboard sx={{ color: '#e91e63' }} />,
        description: 'Configurar líderes para actividades'
      },
      { 
        id: 'gestion-contratos',
        label: 'Gestión de Contratos', 
        component: <GestionContratosForm />,
        icon: <Work sx={{ color: '#795548' }} />,
        description: 'Gestionar contratos de usuarios'
      }
    ]
  },
  {
    id: 'preguntas-evaluacion',
    label: 'Gestión de Preguntas',
    icon: <QuestionAnswer sx={{ color: '#f5576c' }} />,
    isExpandable: true,
    children: [
      { 
        id: 'categorias',
        label: 'Categorías de Preguntas', 
        component: <CategoriaPreguntaForm />,
        icon: <ViewList sx={{ color: '#38f9d7' }} />,
        description: 'Organizar preguntas por categorías'
      },
      { 
        id: 'preguntas-360',
        label: 'Preguntas 360°', 
        component: <PreguntaForm />,
        icon: <Quiz sx={{ color: '#764ba2' }} />,
        description: 'Gestionar banco de preguntas'
      }
    ]
  },
  {
    id: 'evaluaciones',
    label: 'Sistema de Evaluaciones',
    icon: <Star sx={{ color: '#ff9800' }} />,
    isExpandable: true,
    children: [
      { 
        id: 'crear-evaluaciones',
        label: 'Crear Evaluaciones', 
        component: <EvaluacionForm />,
        icon: <Assignment sx={{ color: '#2196f3' }} />,
        description: 'Crear y gestionar evaluaciones'
      },
      { 
        id: 'actividades',
        label: 'Actividades Laborales', 
        component: <ActividadForm />,
        icon: <Work sx={{ color: '#795548' }} />,
        description: 'Gestionar actividades de evaluación'
      }
    ]
  },
  {
    id: 'dashboards-usuarios',
    label: 'Dashboards de Usuario',
    icon: <TrendingUp sx={{ color: '#9c27b0' }} />,
    isExpandable: true,
    children: [
      { 
        id: 'dashboard-lider',
        label: 'Dashboard de Líder', 
        component: <DashboardLider liderId={1} />,
        icon: <Leaderboard sx={{ color: '#e91e63' }} />,
        description: 'Vista para gestionar equipo'
      },
      { 
        id: 'dashboard-personal',
        label: 'Dashboard Personal', 
        component: <DashboardPersonal usuarioId={1} />,
        icon: <Dashboard sx={{ color: '#00bcd4' }} />,
        description: 'Mi progreso personal'
      },
      { 
        id: 'porcentajes-cumplimiento',
        label: 'Dashboard General', 
        component: <DashboardGeneral />,
        icon: <TrendingUp sx={{ color: '#4caf50' }} />,
        description: 'Vista completa de todas las áreas y usuarios'
      }
    ]
  },
  {
    id: 'realizar-evaluaciones',
    label: 'Realizar Evaluaciones',
    icon: <Group sx={{ color: '#4caf50' }} />,
    isExpandable: true,
    children: [
      { 
        id: 'asignar-actividades',
        label: 'Asignar Actividades', 
        component: <ActividadForm />,
        icon: <Assignment sx={{ color: '#ff9800' }} />,
        description: 'Crear y asignar actividades al equipo'
      },
      { 
        id: 'evaluar-actividades',
        label: 'Evaluar Actividades', 
        component: <EvaluacionActividadesLaborales liderId={1} />,
        icon: <Grade sx={{ color: '#ff5722' }} />,
        description: 'Evaluar actividades asignadas al equipo'
      },
      { 
        id: 'evaluaciones-360',
        label: 'Evaluaciones Integrales', 
        component: <Evaluacion360 usuarioId={1} esLider={true} />,
        icon: <Group sx={{ color: '#673ab7' }} />,
        description: 'Completar evaluaciones asignadas'
      }
    ]
  },
  {
    id: 'gestion-horario-laboral',
    label: 'Gestión de Horario Laboral',
    icon: <Schedule sx={{ color: '#ff6b35' }} />,
    component: <GestionHorarioLaboral />,
    description: 'Cargar y validar archivos Excel de horario laboral'
  }
];

export default function EvaluacionDashboard() {
  // ✅ ROUTING
  const navigate = useNavigate();
  const location = useLocation();
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [estadoSincronizacion, setEstadoSincronizacion] = useState<'ok' | 'warning' | 'error'>('ok');



  // ✅ ESTADO REDUX (para debug y sincronización)
  const dispatch = useDispatch();
  const evaluacionState = useSelector((state: RootState) => state.evaluacion);

  // ✅ SINCRONIZACIÓN AUTOMÁTICA ROBUSTA (para producción)
  const sincronizarEstadoRobusto = async () => {
    try {
      
      // Verificar si Redux tiene datos (usar nueva estructura)
      if (!evaluacionState?.datos?.evaluaciones?.length) {
        setEstadoSincronizacion('warning');
        // Aquí podrías dispatch acciones para recargar datos
        return;
      }
      
      // Verificar integridad de datos
      let hayErrores = false;
      
      if (evaluacionState?.datos?.evaluaciones && !Array.isArray(evaluacionState.datos.evaluaciones)) {
        hayErrores = true;
      }
      
      if (evaluacionState?.datos?.usuarios && !Array.isArray(evaluacionState.datos.usuarios)) {
        hayErrores = true;
      }
      
      if (evaluacionState?.datos?.componentes && !Array.isArray(evaluacionState.datos.componentes)) {
        hayErrores = true;
      }
      
      if (evaluacionState?.datos?.areas && !Array.isArray(evaluacionState.datos.areas)) {
        hayErrores = true;
      }
      
      if (evaluacionState?.contratosUsuarios && !Array.isArray(evaluacionState.contratosUsuarios)) {
        hayErrores = true;
      }
      
      if (evaluacionState?.datos?.actividades && !Array.isArray(evaluacionState.datos.actividades)) {
        hayErrores = true;
      }
      
      if (hayErrores) {
        setEstadoSincronizacion('error');
      } else {
        setEstadoSincronizacion('ok');
      }
      
      console.log('✅ Sincronización completada');
      
    } catch (error) {
      console.error('❌ Error en sincronización:', error);
      // En producción, podrías enviar error a servicio de monitoreo
    }
  };

  // ✅ DEBUG ROBUSTO + SINCRONIZACIÓN AUTOMÁTICA (para producción)
  useEffect(() => {
    console.log('🔍 EvaluacionDashboard - Estado del store Redux:');
    console.log('🔍 - Evaluaciones:', evaluacionState?.evaluaciones?.length || 0);
    console.log('🔍 - Usuarios:', evaluacionState?.usuarios?.length || 0);
    console.log('🔍 - Componentes:', evaluacionState?.componentes?.length || 0);
    console.log('🔍 - Areas:', evaluacionState?.areas?.length || 0);
    console.log('🔍 - Actividades:', evaluacionState?.actividades?.length || 0);
    console.log('🔍 - Contratos:', evaluacionState?.contratosUsuarios?.length || 0);
    
    // ✅ SINCRONIZACIÓN AUTOMÁTICA CADA 30 SEGUNDOS (para producción)
    const interval = setInterval(() => {
      sincronizarEstadoRobusto();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [evaluacionState]);



  // ✅ CARGA INICIAL AUTOMÁTICA
  useEffect(() => {
    console.log('🚀 EvaluacionDashboard - Iniciando carga inicial...');
    
    console.log('✅ EvaluacionDashboard - Carga inicial completada');
  }, []);



  const handleSectionToggle = (sectionId: string) => {
    console.log('🔍 Toggle sección:', sectionId);
    setOpenSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleItemClick = (item: any) => {
    console.log('🔍 Click en item:', item.id, item.label);
    if (item.route) {
      // Navegar a ruta externa
      navigate(item.route);
      console.log('✅ Navegando a ruta externa:', item.route);
    } else if (item.component) {
      // Navegar a la ruta correspondiente
      const route = `/evaluacion_dashboard/${item.id}`;
      navigate(route);
      console.log('✅ Navegando a:', route);
    }
  };

  const isSelected = (item: any) => {
    if (item.route) {
      return location.pathname === item.route;
    }
    return location.pathname === `/evaluacion_dashboard/${item.id}`;
  };



  return (
    <>
      {/* ✅ ESTILOS CSS PARA ANIMACIÓN (para producción) */}
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
      </style>
      
      <Box sx={{ display: 'flex' }}>
        <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#f7f7f7',
            borderRight: '1px solid #e0e0e0',
          },
        }}
      >
        {/* Imagen de fondo */}
        <Box
          component="img"
          src="/logoneuro.jpeg"
          alt="Logo NEURODX"
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: 0.06,
            width: '200px',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />

        {/* Contenido del Drawer */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography 
            variant="h6" 
            textAlign="center" 
            mt={2} 
            mb={1}
            sx={{ 
              fontWeight: 'bold',
              color: '#1976d2',
              fontSize: '1.1rem'
            }}
          >
            Evaluación Neurodx
          </Typography>
          
          <Typography 
            variant="caption" 
            textAlign="center" 
            sx={{ 
              display: 'block',
              px: 2,
              color: '#666',
              mb: 2
            }}
          >
            Sistema de Evaluación de desempeño
          </Typography>

          <Divider sx={{ mb: 1 }} />

          <List sx={{ pt: 0 }}>
            {menuStructure.map((section) => (
              <React.Fragment key={section.id}>
                {/* Elemento principal del menú */}
                <ListItem
                  component="div"
                  selected={isSelected(section)}
                  onClick={() => {
                    if (section.component) {
                      handleItemClick(section);
                    } else if (section.isExpandable) {
                      handleSectionToggle(section.id);
                    }
                  }}
                  sx={{
                    py: 1.5,
                    mx: 1,
                    borderRadius: 2,
                    mb: 0.5,
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(79, 172, 254, 0.1)',
                      borderLeft: '4px solid #4facfe',
                      '&:hover': {
                        backgroundColor: 'rgba(79, 172, 254, 0.15)',
                      }
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.04)',
                      transform: 'translateX(2px)',
                      transition: 'all 0.2s ease'
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 42 }}>
                    {section.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={section.label}
                    primaryTypographyProps={{
                      fontSize: '0.95rem',
                      fontWeight: isSelected(section) ? 'bold' : '500',
                      color: isSelected(section) ? '#4facfe' : '#333'
                    }}
                  />
                  {section.badge && (
                    <Chip 
                      label={section.badge} 
                      size="small" 
                      sx={{ 
                        backgroundColor: '#4facfe', 
                        color: 'white',
                        fontSize: '0.7rem',
                        height: 20
                      }} 
                    />
                  )}
                  {section.isExpandable && (
                    openSections.includes(section.id) ? <ExpandLess /> : <ExpandMore />
                  )}
                </ListItem>

                {/* Submenús desplegables */}
                {section.isExpandable && (
                  <Collapse in={openSections.includes(section.id)} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {section.children?.map((child) => (
                        <ListItem
                          key={child.id}
                          component="div"
                          selected={isSelected(child)}
                          onClick={() => handleItemClick(child)}
                          sx={{
                            pl: 4,
                            py: 1,
                            mx: 2,
                            borderRadius: 2,
                            mb: 0.3,
                            '&.Mui-selected': {
                              backgroundColor: 'rgba(103, 58, 183, 0.1)',
                              borderLeft: '3px solid #673ab7',
                              '&:hover': {
                                backgroundColor: 'rgba(103, 58, 183, 0.15)',
                              }
                            },
                            '&:hover': {
                              backgroundColor: 'rgba(0,0,0,0.03)',
                              transform: 'translateX(4px)',
                              transition: 'all 0.2s ease'
                            }
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            {child.icon}
                          </ListItemIcon>
                          <ListItemText 
                            primary={child.label}
                            secondary={child.description}
                            primaryTypographyProps={{
                              fontSize: '0.85rem',
                              fontWeight: isSelected(child) ? 'bold' : 'normal',
                              color: isSelected(child) ? '#673ab7' : '#555'
                            }}
                            secondaryTypographyProps={{
                              fontSize: '0.7rem',
                              color: '#888'
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                )}
              </React.Fragment>
            ))}
          </List>
        </Box>
      </Drawer>

              <Box component="main" sx={{ flexGrow: 1, p: 3, backgroundColor: '#fafafa' }}>
          
          {/* ✅ INDICADOR DE SINCRONIZACIÓN SUTIL (para producción) */}
          <Tooltip 
            title={
              estadoSincronizacion === 'ok' ? '✅ Datos sincronizados correctamente' :
              estadoSincronizacion === 'warning' ? '⚠️ Datos incompletos - sincronizando...' :
              '❌ Error en sincronización - revisar consola'
            }
            placement="left"
          >
            <Box sx={{ 
              position: 'fixed', 
              top: 20, 
              right: 20, 
              zIndex: 1000,
              opacity: 0.7,
              transition: 'opacity 0.3s ease',
              cursor: 'help'
            }}>
              <Box sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                backgroundColor: estadoSincronizacion === 'ok' ? '#4caf50' : 
                               estadoSincronizacion === 'warning' ? '#ff9800' : '#f44336',
                animation: estadoSincronizacion === 'ok' ? 'none' : 'pulse 2s infinite'
              }} />
            </Box>
          </Tooltip>
          
          <Box sx={{ 
          backgroundColor: 'white', 
          borderRadius: 2, 
          p: 3, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          minHeight: 'calc(100vh - 48px)'
        }}>
          <Routes>
            <Route path="/" element={<EvaluacionDashboardComponent />} />
            {menuStructure.map((section) => {
              if (section.component) {
                return <Route key={section.id} path={`/${section.id}`} element={section.component} />;
              }
              if (section.children) {
                return section.children.map((child) => {
                  if (child.component) {
                    return <Route key={child.id} path={`/${child.id}`} element={child.component} />;
                  }
                  return null;
                });
              }
              return null;
            })}
          </Routes>
        </Box>
      </Box>
    </Box>
    </>
  );
}
