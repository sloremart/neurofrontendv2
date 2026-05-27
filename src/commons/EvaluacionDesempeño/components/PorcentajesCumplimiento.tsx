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
  TextField,
  Button
} from '@mui/material';
import {
  TrendingUp,
  Assessment,
  Work,
  Star,
  Search
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { getPorcentajesCumplimiento } from '../store/thunks/ThunksEvaluacionDesempeño.tsx';

interface PorcentajesCumplimientoProps {
  areaId: number;
  titulo?: string;
}

interface ComponentePorcentaje {
  componente_id: number;
  componente_nombre: string;
  tipo_nombre: string;
  es_360: boolean;
  porcentaje_objetivo: number;
  porcentaje_360: number;
  porcentaje_actividades: number;
  porcentaje_total: number;
  porcentaje_cumplimiento: number;
}

interface UsuarioPorcentajes {
  usuario_id: number;
  nombre_usuario: string;
  cargo: string;
  componentes: ComponentePorcentaje[];
  total_porcentaje: number;
  promedio_cumplimiento: number;
}

interface RespuestaPorcentajes {
  area_id: number;
  cargo_filtro: string;
  usuarios: UsuarioPorcentajes[];
  resumen_area: {
    total_usuarios: number;
    total_porcentaje: number;
    promedio_cumplimiento: number;
  };
  mensaje?: string;
}

export default function PorcentajesCumplimiento({ 
  areaId, 
  titulo 
}: PorcentajesCumplimientoProps) {
  const tituloFinal = titulo || (areaId === 0 ? "Porcentajes de Cumplimiento - Todas las Áreas" : "Porcentajes de Cumplimiento por Área");
  const dispatch = useDispatch();
  const [porcentajes, setPorcentajes] = useState<RespuestaPorcentajes | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargoFiltro, setCargoFiltro] = useState('');

  const cargarPorcentajes = async (cargo?: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log(`🔍 Cargando porcentajes para área: ${areaId}, cargo: ${cargo || 'todos'}`);
      const data = await dispatch(getPorcentajesCumplimiento(areaId, cargo) as any);
      console.log('📊 Datos recibidos:', data);
      setPorcentajes(data);
    } catch (error: any) {
      console.error('❌ Error al cargar porcentajes:', error);
      setError(error.message || 'Error al cargar porcentajes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPorcentajes();
  }, [areaId]);

  const handleBuscarPorCargo = () => {
    cargarPorcentajes(cargoFiltro);
  };

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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Cargando porcentajes...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
        <Button onClick={() => cargarPorcentajes()} sx={{ ml: 2 }}>
          Reintentar
        </Button>
      </Alert>
    );
  }

  if (!porcentajes) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        No hay datos disponibles
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
          <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
          {tituloFinal}
        </Typography>
        
        {/* Filtros */}
        <Box sx={{ mt: 2, mb: 2, display: 'flex', justifyContent: 'center', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            label="Filtrar por cargo"
            value={cargoFiltro}
            onChange={(e) => setCargoFiltro(e.target.value)}
            size="small"
            placeholder="Ej: CONTADORA, DIRECTOR..."
          />
          <Button
            variant="contained"
            onClick={handleBuscarPorCargo}
            startIcon={<Search />}
          >
            Buscar
          </Button>
          {(cargoFiltro || areaId !== 0) && (
            <Button
              variant="outlined"
              onClick={() => {
                setCargoFiltro('');
                cargarPorcentajes();
              }}
            >
              Limpiar
            </Button>
          )}
        </Box>
        
        {/* Resumen del área */}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 3 }}>
          <Card sx={{ backgroundColor: '#e3f2fd', border: '1px solid #90caf9' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h6" color="primary" fontWeight="bold">
                {porcentajes.resumen_area.total_usuarios}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {cargoFiltro ? `Con cargo: ${cargoFiltro}` : 'Total Usuarios'}
              </Typography>
            </CardContent>
          </Card>
          
          <Card sx={{ backgroundColor: '#e8f5e9', border: '1px solid #dcedc8' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h6" color="success.main" fontWeight="bold">
                {porcentajes.resumen_area.promedio_cumplimiento}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Promedio Área
              </Typography>
            </CardContent>
          </Card>
          
          <Card sx={{ backgroundColor: '#fff3e0', border: '1px solid #ffcc02' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h6" color="warning.main" fontWeight="bold">
                {porcentajes.resumen_area.total_porcentaje}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Obtenido
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Verificar si hay usuarios */}
      {porcentajes.usuarios.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          {porcentajes.mensaje || 'No se encontraron usuarios para mostrar'}
        </Alert>
      ) : (
        /* Lista de Usuarios */
        porcentajes.usuarios.map((usuario) => (
          <Card key={usuario.usuario_id} sx={{ mb: 3, backgroundColor: '#fafafa', border: '1px solid #e0e0e0' }}>
            <CardContent>
              {/* Header del usuario */}
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#1976d2' }}>
                    {usuario.nombre_usuario}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {usuario.cargo}
                  </Typography>
                </Box>
                
                {/* Resumen del usuario */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Chip
                    icon={<Assessment />}
                    label={`${usuario.total_porcentaje}%`}
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    icon={<TrendingUp />}
                    label={`${usuario.promedio_cumplimiento}%`}
                    color={getColorCumplimiento(usuario.promedio_cumplimiento) as any}
                    variant="outlined"
                  />
                </Box>
              </Box>

              {/* Componentes del usuario */}
              {usuario.componentes.length > 0 ? (
                <Grid container spacing={2}>
                  {usuario.componentes.map((componente) => (
                    <Grid item xs={12} md={6} lg={4} key={componente.componente_id}>
                      <Card 
                        sx={{ 
                          height: '100%',
                          backgroundColor: '#ffffff',
                          border: '1px solid #e0e0e0',
                          '&:hover': {
                            boxShadow: 2,
                            transform: 'translateY(-1px)',
                            transition: 'all 0.2s ease-in-out'
                          }
                        }}
                      >
                        <CardContent>
                          {/* Header del componente */}
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ color: '#1976d2' }}>
                              {componente.componente_nombre}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
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
                          </Box>

                          {/* Porcentajes */}
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                              Objetivo: {componente.porcentaje_objetivo}%
                            </Typography>
                            
                            {/* Desglose */}
                            <Grid container spacing={1} sx={{ mb: 2 }}>
                              {componente.es_360 && (
                                <Grid item xs={6}>
                                  <Box sx={{ textAlign: 'center', p: 1, backgroundColor: '#fff3e0', borderRadius: 1 }}>
                                    <Typography variant="caption" display="block">360°</Typography>
                                    <Typography variant="h6" fontWeight="bold" color="#ff9800">
                                      {componente.porcentaje_360}%
                                    </Typography>
                                  </Box>
                                </Grid>
                              )}
                              
                              <Grid item xs={componente.es_360 ? 6 : 12}>
                                <Box sx={{ textAlign: 'center', p: 1, backgroundColor: '#e8f5e9', borderRadius: 1 }}>
                                  <Typography variant="caption" display="block">Actividades</Typography>
                                  <Typography variant="h6" fontWeight="bold" color="#4caf50">
                                    {componente.porcentaje_actividades}%
                                  </Typography>
                                </Box>
                              </Grid>
                            </Grid>
                            
                            {/* Total */}
                            <Typography variant="h5" fontWeight="bold" sx={{ 
                              color: getColorPorcentaje(componente.porcentaje_total),
                              textAlign: 'center'
                            }}>
                              Total: {componente.porcentaje_total}%
                            </Typography>
                          </Box>

                          {/* Barra de progreso */}
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                              Cumplimiento: {componente.porcentaje_cumplimiento}%
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(componente.porcentaje_cumplimiento, 100)}
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: '#e0e0e0',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: getColorPorcentaje(componente.porcentaje_cumplimiento),
                                  borderRadius: 4
                                }
                              }}
                            />
                          </Box>

                          {/* Estado */}
                          <Box sx={{ textAlign: 'center' }}>
                            <Chip
                              label={componente.porcentaje_cumplimiento >= 100 ? 'Completado' : 'En Progreso'}
                              color={getColorCumplimiento(componente.porcentaje_cumplimiento)}
                              variant="filled"
                              size="small"
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Alert severity="info">
                  Este usuario no tiene componentes evaluados
                </Alert>
              )}
            </CardContent>
          </Card>
        ))
      )}

      {/* Información adicional */}
      <Box sx={{ mt: 4, p: 3, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#1976d2' }}>
          <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
          Información del Sistema
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          <strong>Filtrado por Área:</strong> Muestra todos los usuarios con contratos vigentes en el área seleccionada.
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          <strong>Filtrado por Cargo:</strong> Permite filtrar usuarios por cargo específico dentro del área.
        </Typography>
        <Typography variant="body2" color="textSecondary">
          <strong>Porcentajes:</strong> Los porcentajes se calculan basándose en evaluaciones 360° completadas y actividades laborales evaluadas.
        </Typography>
      </Box>
    </Box>
  );
}
