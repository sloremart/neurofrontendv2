import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  Box,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  Warning,
  ExpandMore,
  ExpandLess,
  Schedule,
  Person,
  Business,
  Assignment,
  CalendarToday
} from '@mui/icons-material';

interface Contrato {
  // ✅ DATOS DEL CONTRATO
  id: number;
  usuario_id: number;
  identificacion: string;
  tipo_contrato: string;
  fecha_inicio: string;
  fecha_fin: string;
  cargo: string;
  area_id: number | null;
  area_nombre: string;
  area_color: string;
  dias_restantes: number;
  urgencia: 'critica' | 'alta' | 'media' | 'baja' | 'vigente';
  prioridad: number;
  salario: number | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  
  // ✅ DATOS COMPLETOS DE LA PERSONA
  nombre_usuario: string;
  nombre_completo: string;
  email_usuario: string | null;
  username_usuario: string | null;
  first_name: string;
  last_name: string;
  nombre: string;
  cargo_usuario: string;
  is_active: boolean;
  date_joined: string | null;
}

interface ContratosUrgentesCardProps {
  contratos: Contrato[];
  loading: boolean;
}

const ContratosUrgentesCard: React.FC<ContratosUrgentesCardProps> = ({ contratos, loading }) => {
  const [expanded, setExpanded] = useState(false);
  


  // ✅ FUNCIONES AUXILIARES
  const getUrgenciaColor = (urgencia: string) => {
    switch (urgencia) {
      case 'critica': return '#f44336';      // Rojo - Crítico
      case 'alta': return '#ff9800';         // Naranja - Alto
      case 'media': return '#ffc107';        // Amarillo - Medio
      case 'baja': return '#4caf50';         // Verde - Bajo
      case 'vigente': return '#2196f3';      // Azul - Vigente
      default: return '#9e9e9e';             // Gris - Default
    }
  };

  const getUrgenciaIcon = (urgencia: string) => {
    switch (urgencia) {
      case 'critica': return <Warning sx={{ color: '#f44336' }} />;
      case 'alta': return <Warning sx={{ color: '#ff9800' }} />;
      case 'media': return <Schedule sx={{ color: '#ffc107' }} />;
      case 'baja': return <Schedule sx={{ color: '#4caf50' }} />;
      default: return <Schedule sx={{ color: '#2196f3' }} />;
    }
  };

  const getUrgenciaText = (urgencia: string) => {
    switch (urgencia) {
      case 'critica': return 'Crítico';
      case 'alta': return 'Alto';
      case 'media': return 'Medio';
      case 'baja': return 'Bajo';
      case 'vigente': return 'Vigente';
      default: return 'Desconocido';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // ✅ ESTADÍSTICAS
  const contratosCriticos = contratos.filter(c => c.urgencia === 'critica').length;
  const contratosAltos = contratos.filter(c => c.urgencia === 'alta').length;
  const contratosMedios = contratos.filter(c => c.urgencia === 'media').length;
  const contratosBajos = contratos.filter(c => c.urgencia === 'baja').length;

  const totalUrgentes = contratosCriticos + contratosAltos + contratosMedios + contratosBajos;

  if (loading) {
    return (
      <Card sx={{ 
        background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
        borderRadius: 3,
        boxShadow: '0 8px 32px rgba(107, 114, 128, 0.15)',
        mb: 3
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Warning sx={{ color: '#6b7280', mr: 1 }} />
            <Typography variant="h6" sx={{ color: '#374151', fontWeight: 'bold' }}>
              Contratos por Vencer
            </Typography>
          </Box>
          <LinearProgress sx={{ height: 8, borderRadius: 4 }} />
          <Typography variant="body2" sx={{ mt: 1, color: '#6b7280' }}>
            Cargando contratos urgentes...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (!contratos || contratos.length === 0) {
    return (
      <Card sx={{ 
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        borderRadius: 3,
        boxShadow: '0 8px 32px rgba(59, 130, 246, 0.15)',
        mb: 3
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Schedule sx={{ color: '#3b82f6', mr: 1 }} />
            <Typography variant="h6" sx={{ color: '#1e40af', fontWeight: 'bold' }}>
              Contratos por Vencer
            </Typography>
          </Box>
          <Alert severity="success" sx={{ mb: 2 }}>
            ¡Excelente! No hay contratos urgentes por vencer.
          </Alert>
          <Typography variant="body2" sx={{ color: '#1e40af' }}>
            Todos los contratos están vigentes o tienen fechas de vencimiento lejanas.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ 
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      borderRadius: 3,
      boxShadow: '0 8px 32px rgba(107, 114, 128, 0.15)',
      mb: 3,
      transition: 'transform 0.3s ease',
      '&:hover': { transform: 'translateY(-4px)' }
    }}>
      <CardHeader
        avatar={<Warning sx={{ color: '#3b82f6' }} />}
        title={
          <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 'bold' }}>
            Contratos por Vencer
          </Typography>
        }
        subheader={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <Chip 
              label={`${totalUrgentes} contratos urgentes`}
              size="small"
              sx={{ 
                backgroundColor: '#3b82f6', 
                color: 'white',
                fontWeight: 'bold'
              }}
            />
            {contratosCriticos > 0 && (
              <Chip 
                label={`${contratosCriticos} críticos`}
                size="small"
                sx={{ 
                  backgroundColor: '#ef4444', 
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
            )}
            {contratosAltos > 0 && (
              <Chip 
                label={`${contratosAltos} altos`}
                size="small"
                sx={{ 
                  backgroundColor: '#f59e0b', 
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
            )}
          </Box>
        }
        action={
          <IconButton onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        }
      />
      
       <CardContent>
                   {/* ✅ RESUMEN VISUAL PROFESIONAL */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ color: '#475569', mb: 2, fontWeight: 'medium' }}>
              Distribución por urgencia:
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
              {contratosCriticos > 0 && (
                <Chip 
                  icon={<Box sx={{ width: 8, height: 8, backgroundColor: '#ef4444', borderRadius: '50%' }} />}
                  label={`${contratosCriticos} Críticos`}
                  size="small"
                  sx={{ 
                    backgroundColor: '#fef2f2', 
                    color: '#dc2626',
                    fontWeight: 'bold',
                    border: '1px solid #ef4444'
                  }}
                />
              )}
              {contratosAltos > 0 && (
                <Chip 
                  icon={<Box sx={{ width: 8, height: 8, backgroundColor: '#f59e0b', borderRadius: '50%' }} />}
                  label={`${contratosAltos} Altos`}
                  size="small"
                  sx={{ 
                    backgroundColor: '#fffbeb', 
                    color: '#d97706',
                    fontWeight: 'bold',
                    border: '1px solid #f59e0b'
                  }}
                />
              )}
              {contratosMedios > 0 && (
                <Chip 
                  icon={<Box sx={{ width: 8, height: 8, backgroundColor: '#10b981', borderRadius: '50%' }} />}
                  label={`${contratosMedios} Medios`}
                  size="small"
                  sx={{ 
                    backgroundColor: '#ecfdf5', 
                    color: '#059669',
                    fontWeight: 'bold',
                    border: '1px solid #10b981'
                  }}
                />
              )}
              {contratosBajos > 0 && (
                <Chip 
                  icon={<Box sx={{ width: 8, height: 8, backgroundColor: '#3b82f6', borderRadius: '50%' }} />}
                  label={`${contratosBajos} Bajos`}
                  size="small"
                  sx={{ 
                    backgroundColor: '#eff6ff', 
                    color: '#2563eb',
                    fontWeight: 'bold',
                    border: '1px solid #3b82f6'
                  }}
                />
              )}
            </Box>
          </Box>

                   {/* ✅ LISTA DE CONTRATOS PROFESIONAL */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ color: '#475569', mb: 2, fontWeight: 'medium' }}>
              Contratos urgentes:
            </Typography>
           <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
             {contratos.map((contrato) => (
               <Box
                 key={contrato.id}
                 sx={{
                   p: 2,
                   borderRadius: 2,
                   backgroundColor: getUrgenciaColor(contrato.urgencia) === '#f44336' ? '#ffebee' :
                                   getUrgenciaColor(contrato.urgencia) === '#ff9800' ? '#fff3e0' :
                                   getUrgenciaColor(contrato.urgencia) === '#ffc107' ? '#fffbf0' :
                                   '#e8f5e8',
                   border: `2px solid ${getUrgenciaColor(contrato.urgencia)}`,
                   transition: 'all 0.3s ease',
                   '&:hover': {
                     transform: 'translateY(-2px)',
                     boxShadow: `0 4px 20px ${getUrgenciaColor(contrato.urgencia)}40`
                   }
                 }}
               >
                 {/* Header del contrato */}
                 <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                     <Person sx={{ 
                       color: getUrgenciaColor(contrato.urgencia), 
                       fontSize: 20 
                     }} />
                     <Box>
                       <Typography variant="subtitle1" sx={{ 
                         fontWeight: 'bold', 
                         color: getUrgenciaColor(contrato.urgencia),
                         mb: 0.5
                       }}>
                         {contrato.nombre_completo || contrato.nombre_usuario}
                       </Typography>
                      
                     </Box>
                   </Box>
                   <Chip
                     label={getUrgenciaText(contrato.urgencia)}
                     size="small"
                     sx={{
                       backgroundColor: getUrgenciaColor(contrato.urgencia),
                       color: 'white',
                       fontWeight: 'bold',
                       fontSize: '0.7rem',
                       minWidth: 60
                     }}
                   />
                 </Box>

                 {/* Detalles del contrato */}
                 <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                     <Business sx={{ fontSize: 16, color: '#666' }} />
                     <Typography variant="body2" sx={{ color: '#666' }}>
                       {contrato.area_nombre} • {contrato.cargo_usuario || contrato.cargo}
                     </Typography>
                   </Box>
                   
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                     <Assignment sx={{ fontSize: 16, color: '#666' }} />
                     <Typography variant="body2" sx={{ color: '#666' }}>
                       {contrato.tipo_contrato}
                     </Typography>
                   </Box>
                   
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                     <CalendarToday sx={{ fontSize: 16, color: '#666' }} />
                     <Typography variant="body2" sx={{ color: '#666' }}>
                       Vence: {formatDate(contrato.fecha_fin)}
                     </Typography>
                   </Box>
                   
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                     <Schedule sx={{ fontSize: 16, color: getUrgenciaColor(contrato.urgencia) }} />
                     <Typography variant="body2" sx={{ 
                       color: getUrgenciaColor(contrato.urgencia),
                       fontWeight: 'bold'
                     }}>
                       {contrato.dias_restantes > 0 
                         ? `${contrato.dias_restantes} días restantes`
                         : 'VENCIDO'
                       }
                     </Typography>
                   </Box>
                 </Box>
               </Box>
             ))}
           </Box>
         </Box>

                   {/* ✅ FOOTER INFORMATIVO PROFESIONAL */}
          <Box sx={{ 
            mt: 3, 
            pt: 2, 
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            p: 2,
            borderRadius: 2
          }}>
            <Typography variant="body2" sx={{ 
              color: '#475569', 
              fontStyle: 'italic', 
              mb: 1, 
              display: 'block',
              textAlign: 'center'
            }}>
              💡 Prioriza las evaluaciones de usuarios con contratos críticos y altos para asegurar la continuidad del proceso.
            </Typography>
            {contratos.length > 0 && (
              <Typography variant="caption" sx={{ 
                color: '#475569', 
                opacity: 0.8,
                display: 'block',
                textAlign: 'center'
              }}>
                📊 Mostrando {contratos.length} contratos urgentes de {totalUrgentes} total
              </Typography>
            )}
          </Box>
       </CardContent>
    </Card>
  );
};

export default ContratosUrgentesCard;
