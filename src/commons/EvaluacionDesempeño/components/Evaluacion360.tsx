import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, List, ListItem, ListItemText,
  ListItemAvatar, Avatar, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Chip, CircularProgress, FormControl,
  InputLabel, Select, MenuItem, Paper, Alert, Stepper, Step, StepLabel,
  RadioGroup, FormControlLabel, Radio, Checkbox, FormGroup, LinearProgress
} from '@mui/material';
import {
  Assessment, Person, CheckCircle, PendingActions, NavigateNext, NavigateBefore,
  Send, Category, QuestionAnswer
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { 
  getEvaluaciones360ParaLider, 
  getEvaluaciones360ParaCompanero,
  getPreguntasEvaluacion360,
  completarEvaluacion360
} from '../store/thunks/ThunksEvaluacionDesempeño.tsx';

interface Evaluacion360Props {
  usuarioId: number;
  esLider?: boolean;
  areas?: Array<{ id: number; nombre: string }>;
}

interface Evaluacion360 {
  id: number;
  usuario_evaluado: {
    id: number;
    nombre: string;
  };
  componente: {
    id: number;
    nombre: string;
  };
  fecha: string;
  ya_evaluada: boolean;
  asignacion_id: number;
}

interface PreguntaEvaluacion {
  id: number;
  texto: string;
  tipo: 'LIKERT' | 'ABIERTA' | 'BOOLEANA' | 'NUMERICA' | 'MULTIPLE';
  orden: number;
  obligatoria: boolean;
  peso: number;
  escalas?: Array<{
    id: number;
    valor: number;
    descripcion: string;
    orden: number;
  }>;
  ya_respondida: boolean;
  respuesta_anterior: any;
}

interface CategoriaPreguntas {
  id: number;
  nombre: string;
  descripcion: string;
  orden: number;
  preguntas: PreguntaEvaluacion[];
}

interface PreguntasEvaluacion360 {
  evaluacion_id: number;
  usuario_evaluado: {
    id: number;
    nombre: string;
  };
  componente: {
    id: number;
    nombre: string;
  };
  fecha: string;
  categorias: CategoriaPreguntas[];
  total_preguntas: number;
  preguntas_respondidas: number;
}

interface RespuestaPregunta {
  pregunta_id: number;
  respuesta_numerica?: number;
  escala_seleccionada_id?: number;
  respuesta_texto?: string;
  respuesta_booleana?: boolean;
  opcion_seleccionada_id?: number;
  comentarios?: string;
}

export default function Evaluacion360({ usuarioId, esLider = false, areas = [] }: Evaluacion360Props) {
  const dispatch = useDispatch();
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion360[]>([]);
  const [areaSeleccionada, setAreaSeleccionada] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [evaluacionSeleccionada, setEvaluacionSeleccionada] = useState<Evaluacion360 | null>(null);
  const [preguntas, setPreguntas] = useState<PreguntasEvaluacion360 | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<number, RespuestaPregunta>>({});
  const [loadingPreguntas, setLoadingPreguntas] = useState(false);

  useEffect(() => {
    cargarEvaluaciones();
  }, [usuarioId, areaSeleccionada]);

  const cargarEvaluaciones = async () => {
    setLoading(true);
    try {
      // ✅ CORREGIR: Solo pasar areaId si está definido
      const areaId = areaSeleccionada || undefined;
      let data;
      
      console.log('🔍 Cargando evaluaciones 360°...');
      console.log('🔍 Usuario ID:', usuarioId);
      console.log('🔍 ¿Es líder?:', esLider);
      console.log('🔍 Área seleccionada:', areaId);
      
      if (esLider) {
        console.log('🔍 Llamando a getEvaluaciones360ParaLider...');
        // ✅ CORREGIR: Solo pasar areaId si está definido
        if (areaId) {
          data = await dispatch(getEvaluaciones360ParaLider(usuarioId, areaId) as any);
        } else {
          data = await dispatch(getEvaluaciones360ParaLider(usuarioId) as any);
        }
        console.log('🔍 Respuesta para líder:', data);
      } else {
        console.log('🔍 Llamando a getEvaluaciones360ParaCompanero...');
        // ✅ CORREGIR: Solo pasar areaId si está definido
        if (areaId) {
          data = await dispatch(getEvaluaciones360ParaCompanero(usuarioId, areaId) as any);
        } else {
          data = await dispatch(getEvaluaciones360ParaCompanero(usuarioId) as any);
        }
        console.log('🔍 Respuesta para compañero:', data);
      }
      
      console.log('🔍 Datos finales de evaluaciones:', data);
      console.log('🔍 Tipo de datos:', typeof data);
      console.log('🔍 Es array?', Array.isArray(data));
      console.log('🔍 Longitud:', data?.length || 0);
      
      // ✅ VALIDAR Y ESTABLECER DATOS
      if (data && Array.isArray(data)) {
        setEvaluaciones(data);
        console.log('✅ Evaluaciones establecidas en estado:', data.length);
        
        // ✅ DEBUG: Mostrar las primeras evaluaciones
        if (data.length > 0) {
          console.log('🔍 Primera evaluación:', data[0]);
          console.log('🔍 Evaluaciones completadas:', data.filter(e => e.ya_evaluada).length);
          console.log('🔍 Evaluaciones pendientes:', data.filter(e => !e.ya_evaluada).length);
        }
      } else {
        console.log('⚠️ No se recibieron datos válidos');
        setEvaluaciones([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar evaluaciones:', error);
      setEvaluaciones([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluar = async (evaluacion: Evaluacion360) => {
    setEvaluacionSeleccionada(evaluacion);
    setLoadingPreguntas(true);
    setOpenDialog(true);
    
    try {
      const preguntasData = await dispatch(getPreguntasEvaluacion360(evaluacion.asignacion_id) as any);
      setPreguntas(preguntasData);
      
      // Inicializar respuestas con valores previos si existen
      const respuestasIniciales: Record<number, RespuestaPregunta> = {};
      preguntasData.categorias.forEach(categoria => {
        categoria.preguntas.forEach(pregunta => {
          if (pregunta.ya_respondida && pregunta.respuesta_anterior) {
            respuestasIniciales[pregunta.id] = pregunta.respuesta_anterior;
          }
        });
      });
      setRespuestas(respuestasIniciales);
      
    } catch (error) {
      console.error('Error al cargar preguntas:', error);
    } finally {
      setLoadingPreguntas(false);
    }
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleRespuestaChange = (preguntaId: number, campo: string, valor: any) => {
    setRespuestas(prev => ({
      ...prev,
      [preguntaId]: {
        ...prev[preguntaId],
        pregunta_id: preguntaId,
        [campo]: valor
      }
    }));
  };

  const handleSubmit = async () => {
    try {
      if (!evaluacionSeleccionada) return;
      
      const respuestasArray = Object.values(respuestas);
      const body = {
        asignacion_id: evaluacionSeleccionada.asignacion_id,
        evaluador_id: usuarioId,
        respuestas: respuestasArray
      };

      console.log('🚀 Enviando evaluación 360:', body);
      const result = await dispatch(completarEvaluacion360(body) as any);
      console.log('✅ Evaluación 360 completada:', result);
      
      // ✅ FORZAR CIERRE DEL MODAL INMEDIATAMENTE
      setOpenDialog(false);
      setEvaluacionSeleccionada(null);
      setPreguntas(null);
      
      // ✅ LIMPIAR FORMULARIO
      setRespuestas({});
      setActiveStep(0);
      
      // ✅ RECARGAR DATOS DESPUÉS DEL CIERRE
      setTimeout(() => {
        cargarEvaluaciones();
      }, 100);
      
      console.log('✅ Modal cerrado y datos recargados');
    } catch (error) {
      console.error('❌ Error al completar evaluación:', error);
      // ❌ NO cerrar el modal si hay error
    }
  };

  const handleClose = () => {
    setOpenDialog(false);
    setEvaluacionSeleccionada(null);
    setPreguntas(null);
    setRespuestas({});
    setActiveStep(0);
  };



  const renderPregunta = (pregunta: PreguntaEvaluacion) => {
    const respuesta = respuestas[pregunta.id] || {};

    switch (pregunta.tipo) {
      case 'LIKERT':
        return (
          <Box key={pregunta.id} sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              {pregunta.texto} {pregunta.obligatoria && <span style={{ color: 'red' }}>*</span>}
            </Typography>
            <RadioGroup
              value={respuesta.escala_seleccionada_id || ''}
              onChange={(e) => handleRespuestaChange(pregunta.id, 'escala_seleccionada_id', parseInt(e.target.value))}
            >
              {pregunta.escalas?.map((escala) => (
                <FormControlLabel
                  key={escala.id}
                  value={escala.id}
                  control={<Radio />}
                  label={`${escala.valor} - ${escala.descripcion}`}
                />
              ))}
            </RadioGroup>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Comentarios adicionales (opcional)"
              value={respuesta.comentarios || ''}
              onChange={(e) => handleRespuestaChange(pregunta.id, 'comentarios', e.target.value)}
              sx={{ mt: 2 }}
            />
          </Box>
        );

      case 'ABIERTA':
        return (
          <Box key={pregunta.id} sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              {pregunta.texto} {pregunta.obligatoria && <span style={{ color: 'red' }}>*</span>}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Su respuesta"
              value={respuesta.respuesta_texto || ''}
              onChange={(e) => handleRespuestaChange(pregunta.id, 'respuesta_texto', e.target.value)}
              placeholder="Escriba su respuesta..."
            />
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Comentarios adicionales (opcional)"
              value={respuesta.comentarios || ''}
              onChange={(e) => handleRespuestaChange(pregunta.id, 'comentarios', e.target.value)}
              sx={{ mt: 2 }}
            />
          </Box>
        );

      case 'BOOLEANA':
        return (
          <Box key={pregunta.id} sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              {pregunta.texto} {pregunta.obligatoria && <span style={{ color: 'red' }}>*</span>}
            </Typography>
            <RadioGroup
              value={respuesta.respuesta_booleana === undefined ? '' : respuesta.respuesta_booleana}
              onChange={(e) => handleRespuestaChange(pregunta.id, 'respuesta_booleana', e.target.value === 'true')}
            >
              <FormControlLabel value={true} control={<Radio />} label="Sí" />
              <FormControlLabel value={false} control={<Radio />} label="No" />
            </RadioGroup>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Comentarios adicionales (opcional)"
              value={respuesta.comentarios || ''}
              onChange={(e) => handleRespuestaChange(pregunta.id, 'comentarios', e.target.value)}
              sx={{ mt: 2 }}
            />
          </Box>
        );

      case 'NUMERICA':
        return (
          <Box key={pregunta.id} sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              {pregunta.texto} {pregunta.obligatoria && <span style={{ color: 'red' }}>*</span>}
            </Typography>
            <TextField
              fullWidth
              type="number"
              label="Su calificación"
              value={respuesta.respuesta_numerica || ''}
              onChange={(e) => handleRespuestaChange(pregunta.id, 'respuesta_numerica', parseFloat(e.target.value))}
              inputProps={{ min: 0, max: 10, step: 0.1 }}
            />
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Comentarios adicionales (opcional)"
              value={respuesta.comentarios || ''}
              onChange={(e) => handleRespuestaChange(pregunta.id, 'comentarios', e.target.value)}
              sx={{ mt: 2 }}
            />
          </Box>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
             {/* Header con imagen de fondo */}
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
            src="/check.jpg"
            alt="Encabezado"
            sx={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 30%',
              opacity: 0.25,
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
            {esLider ? 'EVALUACIONES 360° PARA LÍDER' : 'EVALUACIONES 360° ASIGNADAS'}
          </Typography>
        </Box>
      </Box>

      {/* Filtro de área */}
      {areas.length > 0 && (
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Filtrar por Área</InputLabel>
          <Select
            value={areaSeleccionada}
            onChange={(e) => setAreaSeleccionada(e.target.value)}
            label="Filtrar por Área"
          >
            <MenuItem value="">
              <em>Todas las áreas</em>
            </MenuItem>
            {areas.map((area) => (
              <MenuItem key={area.id} value={area.id}>
                {area.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* Estadísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#eaf8faff', border: '1px solid #b2ebf2' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Assessment sx={{ fontSize: 40, color: '#b2ebf2', mb: 1 }} />
              <Typography variant="h4" color="primary" gutterBottom>
                {evaluaciones.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Evaluaciones 360°
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#e8f5e9', border: '1px solid #dcedc8' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 40, color: '#dcedc8', mb: 1 }} />
              <Typography variant="h4" color="primary" gutterBottom>
                {evaluaciones.filter(e => e.ya_evaluada).length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Evaluaciones 360° Completadas
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#fff3e0', border: '1px solid #ffcc80' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <PendingActions sx={{ fontSize: 40, color: '#ffcc80', mb: 1 }} />
              <Typography variant="h4" color="primary" gutterBottom>
                {evaluaciones.filter(e => !e.ya_evaluada).length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Evaluaciones 360° Pendientes
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#f3e5f5', border: '1px solid #ce93d8' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Person sx={{ fontSize: 40, color: '#ce93d8', mb: 1 }} />
              <Typography variant="h4" color="primary" gutterBottom>
                {new Set(evaluaciones.map(e => e.usuario_evaluado.id)).size}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Usuarios Únicos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Lista de Evaluaciones */}
      <Paper sx={{ backgroundColor: '#eaf8faff', p: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#b2ebf2', mb: 2 }}>
          <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
          Evaluaciones 360° {esLider ? 'para Evaluar como Líder' : 'Asignadas para Evaluar'}
        </Typography>

        <List>
          {evaluaciones.map((evaluacion) => (
            <ListItem
              key={evaluacion.id}
              sx={{
                backgroundColor: 'white',
                mb: 2,
                borderRadius: 2,
                border: '1px solid #b2ebf2',
                '&:hover': {
                  backgroundColor: '#f0f9ff',
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s ease-in-out',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                }
              }}
            >
              <ListItemAvatar>
                <Avatar sx={{ backgroundColor: evaluacion.ya_evaluada ? '#4caf50' : '#ff9800' }}>
                  {evaluacion.ya_evaluada ? <CheckCircle /> : <PendingActions />}
                </Avatar>
              </ListItemAvatar>
              
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6" fontWeight="bold">
                      {evaluacion.usuario_evaluado.nombre}
                    </Typography>
                    <Box display="flex" gap={1} alignItems="center">
                      <Chip
                        label={evaluacion.componente.nombre}
                        size="small"
                        sx={{ backgroundColor: '#e3f2fd', color: '#1976d2' }}
                      />
                      <Chip
                        label={evaluacion.ya_evaluada ? 'Completada' : 'Pendiente'}
                        size="small"
                        sx={{ 
                          backgroundColor: evaluacion.ya_evaluada ? '#e8f5e9' : '#fff3e0',
                          color: evaluacion.ya_evaluada ? '#2e7d32' : '#f57c00'
                        }}
                      />
                    </Box>
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Componente: {evaluacion.componente.nombre}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Fecha: {new Date(evaluacion.fecha).toLocaleDateString()}
                    </Typography>
                  </Box>
                }
              />

              <Button
                variant="contained"
                onClick={() => handleEvaluar(evaluacion)}
                disabled={evaluacion.ya_evaluada}
                sx={{
                  backgroundColor: evaluacion.ya_evaluada ? '#4caf50' : '#b2ebf2',
                  color: evaluacion.ya_evaluada ? 'white' : '#000',
                  '&:hover': {
                    backgroundColor: evaluacion.ya_evaluada ? '#45a049' : '#a0d9c1'
                  }
                }}
              >
                {evaluacion.ya_evaluada ? 'Completada' : 'Evaluar'}
              </Button>
            </ListItem>
          ))}
        </List>

        {evaluaciones.length === 0 && (
          <Box textAlign="center" py={4}>
            <Assessment sx={{ fontSize: 60, color: '#b2ebf2', mb: 2 }} />
            <Typography variant="h6" color="textSecondary">
              No hay evaluaciones 360° {esLider ? 'para evaluar como líder' : 'asignadas para evaluar'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Las evaluaciones aparecerán aquí cuando sean asignadas
            </Typography>
          </Box>
        )}
      </Paper>



      {/* Dialog de Evaluación 360 */}
      <Dialog open={openDialog} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Assessment sx={{ color: '#b2ebf2' }} />
            Evaluación 360° - {evaluacionSeleccionada?.usuario_evaluado.nombre}
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {loadingPreguntas ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : preguntas ? (
            <Box>
              {/* Stepper */}
              <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {preguntas.categorias.map((categoria, index) => (
                  <Step key={categoria.id}>
                    <StepLabel>{categoria.nombre}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              {/* Progreso */}
              <Box sx={{ mb: 3 }}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">
                    Progreso: {preguntas.preguntas_respondidas} / {preguntas.total_preguntas} preguntas
                  </Typography>
                  <Typography variant="body2">
                    {Math.round((preguntas.preguntas_respondidas / preguntas.total_preguntas) * 100)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(preguntas.preguntas_respondidas / preguntas.total_preguntas) * 100}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              {/* Categoría actual */}
              {preguntas.categorias[activeStep] && (
                <Box>
                  <Typography variant="h5" gutterBottom sx={{ color: '#b2ebf2' }}>
                    <Category sx={{ mr: 1, verticalAlign: 'middle' }} />
                    {preguntas.categorias[activeStep].nombre}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    {preguntas.categorias[activeStep].descripcion}
                  </Typography>

                  {/* Preguntas de la categoría */}
                  {preguntas.categorias[activeStep].preguntas.map(renderPregunta)}
                </Box>
              )}

              {/* Navegación */}
              <Box display="flex" justifyContent="space-between" mt={4}>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  startIcon={<NavigateBefore />}
                >
                  Anterior
                </Button>
                
                <Box>
                  {activeStep === preguntas.categorias.length - 1 ? (
                    <Button
                      variant="contained"
                      onClick={handleSubmit}
                      endIcon={<Send />}
                      sx={{ backgroundColor: '#b2ebf2', color: '#000' }}
                    >
                      Completar Evaluación
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      endIcon={<NavigateNext />}
                      sx={{ backgroundColor: '#b2ebf2', color: '#000' }}
                    >
                      Siguiente
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>
          ) : (
            <Typography>Error al cargar las preguntas</Typography>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
