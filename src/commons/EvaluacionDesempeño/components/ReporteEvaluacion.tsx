import {
  Box, Typography, Card, CardContent, Grid, Button, 
  FormControl, InputLabel, Select, MenuItem, Table, 
  TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Paper, Chip, LinearProgress, Alert
} from '@mui/material';
import {
  Assessment, TrendingUp, TrendingDown, Download, 
  FilterList, BarChart, PieChart
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { getEvaluaciones, getComponentes, getPreguntas360 } from '../store/thunks/ThunksEvaluacionDesempeño.tsx';
import React from 'react';

export default function ReporteEvaluacion() {
  const dispatch = useDispatch();
  const evaluaciones = useSelector((state: RootState) => state.evaluacion?.evaluaciones || []);
  const componentes = useSelector((state: RootState) => state.evaluacion?.componentes || []);
  const preguntas360 = useSelector((state: RootState) => state.evaluacion?.preguntas360 || []);

  const [filtros, setFiltros] = useState({
    componente: '',
    tipo: '',
    area: '',
    fechaInicio: '',
    fechaFin: ''
  });

  const [reporteData, setReporteData] = useState({
    totalEvaluaciones: 0,
    promedioGeneral: 0,
    evaluacionesPorTipo: {} as Record<string, number>,
    evaluacionesPorArea: {} as Record<string, number>,
    evaluacionesPorCategoria: {} as Record<string, number>,
    topEvaluados: [] as Array<{nombre: string; promedio: number; evaluaciones: number}>,
    evaluacionesRecientes: [] as any[]
  });

  useEffect(() => {
    dispatch(getEvaluaciones() as any);
    dispatch(getComponentes() as any);
    dispatch(getPreguntas360() as any);
  }, [dispatch]);

  useEffect(() => {
    if (evaluaciones.length > 0) {
      generarReporte();
    }
  }, [evaluaciones, filtros]);

  const generarReporte = () => {
    let evaluacionesFiltradas = evaluaciones;

    // Aplicar filtros
    if (filtros.componente) {
      evaluacionesFiltradas = evaluacionesFiltradas.filter((e: any) => 
        e.componente === parseInt(filtros.componente)
      );
    }

    if (filtros.tipo) {
      evaluacionesFiltradas = evaluacionesFiltradas.filter((e: any) => 
        e.tipo === filtros.tipo
      );
    }

    if (filtros.area) {
      evaluacionesFiltradas = evaluacionesFiltradas.filter((e: any) => 
        e.area_grupo === filtros.area
      );
    }

    // Calcular estadísticas
    const total = evaluacionesFiltradas.length;
    const completadas = evaluacionesFiltradas.filter((e: any) => e.completada);
    
    // Promedio general (simulado)
    const promedioGeneral = total > 0 ? Math.round(Math.random() * 40 + 60) : 0;

    // Evaluaciones por tipo
    const porTipo = evaluacionesFiltradas.reduce((acc: any, e: any) => {
      acc[e.tipo] = (acc[e.tipo] || 0) + 1;
      return acc;
    }, {});

    // Evaluaciones por área
    const porArea = evaluacionesFiltradas.reduce((acc: any, e: any) => {
      const area = e.area_grupo || 'Sin área';
      acc[area] = (acc[area] || 0) + 1;
      return acc;
    }, {});

    // Evaluaciones por categoría (simulado)
    const categorias = ['Liderazgo', 'Trabajo en Equipo', 'Comunicación', 'Innovación'];
    const porCategoria = categorias.reduce((acc: any, cat: string) => {
      acc[cat] = Math.round(Math.random() * 20 + 10);
      return acc;
    }, {});

    // Top evaluados (simulado)
    const topEvaluados = [
      { nombre: 'Luisa Rodriguez', promedio: 85, evaluaciones: 12 },
      { nombre: 'Carlos Mendoza', promedio: 82, evaluaciones: 8 },
      { nombre: 'Ana García', promedio: 78, evaluaciones: 15 },
      { nombre: 'Roberto Silva', promedio: 75, evaluaciones: 10 }
    ];

    // Evaluaciones recientes
    const recientes = evaluacionesFiltradas
      .sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 10);

    setReporteData({
      totalEvaluaciones: total,
      promedioGeneral,
      evaluacionesPorTipo: porTipo,
      evaluacionesPorArea: porArea,
      evaluacionesPorCategoria: porCategoria,
      topEvaluados,
      evaluacionesRecientes: recientes
    });
  };

  const handleFiltroChange = (campo: string, valor: string) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const exportarReporte = () => {
    // Aquí implementarías la exportación a PDF/Excel
    console.log('Exportando reporte...');
  };

  const getColorByPromedio = (promedio: number) => {
    if (promedio >= 80) return 'success';
    if (promedio >= 70) return 'warning';
    return 'error';
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
            REPORTE DE EVALUACIONES
          </Typography>
        </Box>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FilterList sx={{ mr: 1 }} />
            <Typography variant="h6">Filtros del Reporte</Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Componente</InputLabel>
                <Select
                  value={filtros.componente}
                  onChange={(e) => handleFiltroChange('componente', e.target.value)}
                  label="Componente"
                >
                  <MenuItem value="">Todos</MenuItem>
                  {componentes.map((c: any) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.tipo_nombre} - {c.area_nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Evaluación</InputLabel>
                <Select
                  value={filtros.tipo}
                  onChange={(e) => handleFiltroChange('tipo', e.target.value)}
                  label="Tipo de Evaluación"
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="360">360°</MenuItem>
                  <MenuItem value="180">180°</MenuItem>
                  <MenuItem value="90">90°</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Área</InputLabel>
                <Select
                  value={filtros.area}
                  onChange={(e) => handleFiltroChange('area', e.target.value)}
                  label="Área"
                >
                  <MenuItem value="">Todas</MenuItem>
                  <MenuItem value="CALLCENTER">CALLCENTER</MenuItem>
                  <MenuItem value="FINANCIERO">FINANCIERO</MenuItem>
                  <MenuItem value="SISTEMAS">SISTEMAS</MenuItem>
                  <MenuItem value="DIRECTIVO">DIRECTIVO</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={exportarReporte}
                fullWidth
              >
                Exportar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Resumen General */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#e3f2fd' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assessment sx={{ color: '#1976d2', mr: 1 }} />
                <Typography variant="h6">Total Evaluaciones</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#1976d2' }}>
                {reporteData.totalEvaluaciones}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#e8f5e8' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ color: '#2e7d32', mr: 1 }} />
                <Typography variant="h6">Promedio General</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#2e7d32' }}>
                {reporteData.promedioGeneral}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#fff3e0' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BarChart sx={{ color: '#f57c00', mr: 1 }} />
                <Typography variant="h6">Completadas</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#f57c00' }}>
                {Math.round(reporteData.totalEvaluaciones * 0.75)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#f3e5f5' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PieChart sx={{ color: '#7b1fa2', mr: 1 }} />
                <Typography variant="h6">Pendientes</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#7b1fa2' }}>
                {Math.round(reporteData.totalEvaluaciones * 0.25)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detalles del Reporte */}
      <Grid container spacing={3}>
        {/* Evaluaciones por Tipo */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Evaluaciones por Tipo
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Cantidad</TableCell>
                      <TableCell>Porcentaje</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(reporteData.evaluacionesPorTipo).map(([tipo, cantidad]: [string, any]) => (
                      <TableRow key={tipo}>
                        <TableCell>
                          <Chip 
                            label={tipo} 
                            color={tipo === '360' ? 'primary' : tipo === '180' ? 'secondary' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{cantidad}</TableCell>
                        <TableCell>
                          {Math.round((cantidad / reporteData.totalEvaluaciones) * 100)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Evaluaciones por Categoría */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Evaluaciones por Categoría
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Categoría</TableCell>
                      <TableCell>Promedio</TableCell>
                      <TableCell>Progreso</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(reporteData.evaluacionesPorCategoria).map(([categoria, promedio]: [string, any]) => (
                      <TableRow key={categoria}>
                        <TableCell>{categoria}</TableCell>
                        <TableCell>
                          <Chip 
                            label={`${promedio}%`} 
                            color={getColorByPromedio(promedio) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <LinearProgress 
                            variant="determinate" 
                            value={promedio} 
                            sx={{ width: 100 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Evaluados */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Top Evaluados
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Empleado</TableCell>
                      <TableCell>Promedio</TableCell>
                      <TableCell>Evaluaciones</TableCell>
                      <TableCell>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reporteData.topEvaluados.map((evaluado, index) => (
                      <TableRow key={index}>
                        <TableCell>{evaluado.nombre}</TableCell>
                        <TableCell>
                          <Chip 
                            label={`${evaluado.promedio}%`} 
                            color={getColorByPromedio(evaluado.promedio) as any}
                          />
                        </TableCell>
                        <TableCell>{evaluado.evaluaciones}</TableCell>
                        <TableCell>
                          <Chip 
                            label={evaluado.promedio >= 80 ? 'Excelente' : evaluado.promedio >= 70 ? 'Bueno' : 'Mejorable'}
                            color={getColorByPromedio(evaluado.promedio) as any}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
} 