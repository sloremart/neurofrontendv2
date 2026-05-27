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
  getEvaluaciones360ParaCompanero,
  getPreguntasEvaluacion360,
  completarEvaluacion360
} from '../store/thunks/ThunksEvaluacionDesempeño.tsx';

interface EvaluacionEvaluarProps {
  usuarioId: number;
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

export default function EvaluacionEvaluar({ usuarioId }: EvaluacionEvaluarProps) {
  const dispatch = useDispatch();
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion360[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [evaluacionSeleccionada, setEvaluacionSeleccionada] = useState<Evaluacion360 | null>(null);
  const [preguntas, setPreguntas] = useState<PreguntasEvaluacion360 | null>(null);
  const [loadingPreguntas, setLoadingPreguntas] = useState(false);
  const [respuestas, setRespuestas] = useState<{ [key: number]: RespuestaPregunta }>({});
  const [pasoActual, setPasoActual] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    cargarEvaluaciones();
  }, [usuarioId]);

  const cargarEvaluaciones = async () => {
    try {
      setLoading(true);
      console.log('🔍 Cargando evaluaciones para usuario:', usuarioId);
      
      const data = await dispatch(getEvaluaciones360ParaCompanero(usuarioId) as any);
      console.log('✅ Evaluaciones cargadas:', data);
      
      if (data && Array.isArray(data)) {
        setEvaluaciones(data);
      } else {
        setEvaluaciones([]);
      }
    } catch (error) {
      console.error('❌ Error cargando evaluaciones:', error);
      setError('Error al cargar las evaluaciones');
    } finally {
      setLoading(false);
    }
  };

  const abrirEvaluacion = async (evaluacion: Evaluacion360) => {
    try {
      setEvaluacionSeleccionada(evaluacion);
      setOpenDialog(true);
      setLoadingPreguntas(true);
      setError(null);
      
      console.log('🔍 Cargando preguntas para evaluación:', evaluacion.asignacion_id);
      const preguntasData = await dispatch(getPreguntasEvaluacion360(evaluacion.asignacion_id) as any);
      console.log('✅ Preguntas cargadas:', preguntasData);
      
      if (preguntasData) {
        setPreguntas(preguntasData);
        // Inicializar respuestas vacías
        const respuestasIniciales: { [key: number]: RespuestaPregunta } = {};
        preguntasData.categorias.forEach(categoria => {
          categoria.preguntas.forEach(pregunta => {
            respuestasIniciales[pregunta.id] = {
              pregunta_id: pregunta.id,
              comentarios: ''
            };
          });
        });
        setRespuestas(respuestasIniciales);
      }
    } catch (error) {
      console.error('❌ Error cargando preguntas:', error);
      setError('Error al cargar las preguntas de la evaluación');
    } finally {
      setLoadingPreguntas(false);
    }
  };

  const cerrarEvaluacion = () => {
    setOpenDialog(false);
    setEvaluacionSeleccionada(null);
    setPreguntas(null);
    setRespuestas({});
    setPasoActual(0);
    setError(null);
    setSuccess(null);
  };

  const actualizarRespuesta = (preguntaId: number, campo: keyof RespuestaPregunta, valor: any) => {
    setRespuestas(prev => ({
      ...prev,
      [preguntaId]: {
        ...prev[preguntaId],
        [campo]: valor
      }
    }));
  };

  const validarRespuestas = (): boolean => {
    if (!preguntas) return false;
    
    let todasRespondidas = true;
    preguntas.categorias.forEach(categoria => {
      categoria.preguntas.forEach(pregunta => {
        if (pregunta.obligatoria) {
          const respuesta = respuestas[pregunta.id];
          if (!respuesta) {
            todasRespondidas = false;
            return;
          }
          
          let tieneRespuesta = false;
          switch (pregunta.tipo) {
            case 'LIKERT':
              tieneRespuesta = respuesta.escala_seleccionada_id !== undefined;
              break;
            case 'ABIERTA':
              tieneRespuesta = Boolean(respuesta.respuesta_texto && respuesta.respuesta_texto.trim() !== '');
              break;
            case 'BOOLEANA':
              tieneRespuesta = respuesta.respuesta_booleana !== undefined;
              break;
            case 'NUMERICA':
              tieneRespuesta = respuesta.respuesta_numerica !== undefined;
              break;
            case 'MULTIPLE':
              tieneRespuesta = respuesta.opcion_seleccionada_id !== undefined;
              break;
          }
          
          if (!tieneRespuesta) {
            todasRespondidas = false;
          }
        }
      });
    });
    
    return todasRespondidas;
  };

  const enviarEvaluacion = async () => {
    if (!validarRespuestas()) {
      setError('Por favor responde todas las preguntas obligatorias');
      return;
    }

    try {
      setEnviando(true);
      setError(null);
      
      const respuestasArray = Object.values(respuestas).filter(r => r.pregunta_id);
      
      const datosEvaluacion = {
        asignacion_id: evaluacionSeleccionada?.asignacion_id,
        evaluador_id: usuarioId,
        respuestas: respuestasArray
      };
      
      console.log('🚀 Enviando evaluación:', datosEvaluacion);
      const resultado = await dispatch(completarEvaluacion360(datosEvaluacion) as any);
      console.log('✅ Evaluación enviada exitosamente:', resultado);
      
      setSuccess('Evaluación completada exitosamente');
      setTimeout(() => {
        cerrarEvaluacion();
        cargarEvaluaciones(); // Recargar para actualizar estado
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error enviando evaluación:', error);
      setError('Error al enviar la evaluación');
    } finally {
      setEnviando(false);
    }
  };

  const renderizarPregunta = (pregunta: PreguntaEvaluacion) => {
    const respuesta = respuestas[pregunta.id];
    
    switch (pregunta.tipo) {
      case 'LIKERT':
        return (
          <FormControl component="fieldset" fullWidth>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              {pregunta.obligatoria && <span style={{color: 'red'}}>* </span>}
              {pregunta.texto}
            </Typography>
            <RadioGroup
              value={respuesta?.escala_seleccionada_id || ''}
              onChange={(e) => actualizarRespuesta(pregunta.id, 'escala_seleccionada_id', parseInt(e.target.value))}
            >
              {pregunta.escalas?.map((escala) => (
                <FormControlLabel
                  key={escala.id}
                  value={escala.id}
                  control={<Radio />}
                  label={`${escala.valor}: ${escala.descripcion}`}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );
        
      case 'ABIERTA':
        return (
          <TextField
            fullWidth
            multiline
            rows={3}
            label={pregunta.texto}
            value={respuesta?.respuesta_texto || ''}
            onChange={(e) => actualizarRespuesta(pregunta.id, 'respuesta_texto', e.target.value)}
            required={pregunta.obligatoria}
            helperText={pregunta.obligatoria ? 'Campo obligatorio' : ''}
          />
        );
        
      case 'BOOLEANA':
        return (
          <FormControl component="fieldset" fullWidth>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              {pregunta.obligatoria && <span style={{color: 'red'}}>* </span>}
              {pregunta.texto}
            </Typography>
            <RadioGroup
              value={respuesta?.respuesta_booleana !== undefined ? respuesta.respuesta_booleana.toString() : ''}
              onChange={(e) => actualizarRespuesta(pregunta.id, 'respuesta_booleana', e.target.value === 'true')}
            >
              <FormControlLabel value="true" control={<Radio />} label="Sí" />
              <FormControlLabel value="false" control={<Radio />} label="No" />
            </RadioGroup>
          </FormControl>
        );
        
      case 'NUMERICA':
        return (
          <TextField
            fullWidth
            type="number"
            label={pregunta.texto}
            value={respuesta?.respuesta_numerica || ''}
            onChange={(e) => actualizarRespuesta(pregunta.id, 'respuesta_numerica', parseInt(e.target.value))}
            required={pregunta.obligatoria}
            helperText={pregunta.obligatoria ? 'Campo obligatorio' : ''}
          />
        );
        
      default:
        return (
          <Typography variant="body2" color="textSecondary">
            Tipo de pregunta no soportado: {pregunta.tipo}
          </Typography>
        );
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
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Mis Evaluaciones 360°
      </Typography>
      
      <Typography variant="body1" color="textSecondary" paragraph>
        Aquí puedes ver y completar las evaluaciones que tienes asignadas
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {evaluaciones.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No tienes evaluaciones asignadas por el momento
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Las evaluaciones aparecerán aquí cuando te sean asignadas
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {evaluaciones.map((evaluacion) => (
            <Grid item xs={12} md={6} lg={4} key={evaluacion.id}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <Person />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {evaluacion.usuario_evaluado.nombre}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {evaluacion.componente.nombre}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="body2" color="textSecondary">
                      {new Date(evaluacion.fecha).toLocaleDateString()}
                    </Typography>
                    <Chip
                      label={evaluacion.ya_evaluada ? 'Completada' : 'Pendiente'}
                      color={evaluacion.ya_evaluada ? 'success' : 'warning'}
                      size="small"
                    />
                  </Box>
                  
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => abrirEvaluacion(evaluacion)}
                    disabled={evaluacion.ya_evaluada}
                    startIcon={evaluacion.ya_evaluada ? <CheckCircle /> : <Assessment />}
                  >
                    {evaluacion.ya_evaluada ? 'Ya Evaluada' : 'Evaluar'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog para evaluar */}
      <Dialog
        open={openDialog}
        onClose={cerrarEvaluacion}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Evaluar a {evaluacionSeleccionada?.usuario_evaluado.nombre}
          <Typography variant="body2" color="textSecondary">
            {evaluacionSeleccionada?.componente.nombre}
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          {loadingPreguntas ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : preguntas ? (
            <Box>
              <Stepper activeStep={pasoActual} sx={{ mb: 3 }}>
                {preguntas.categorias.map((categoria, index) => (
                  <Step key={categoria.id}>
                    <StepLabel>{categoria.nombre}</StepLabel>
                  </Step>
                ))}
              </Stepper>
              
              {preguntas.categorias[pasoActual] && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {preguntas.categorias[pasoActual].nombre}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    {preguntas.categorias[pasoActual].descripcion}
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    {preguntas.categorias[pasoActual].preguntas.map((pregunta) => (
                      <Box key={pregunta.id} sx={{ mb: 3 }}>
                        {renderizarPregunta(pregunta)}
                      </Box>
                    ))}
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between">
                    <Button
                      disabled={pasoActual === 0}
                      onClick={() => setPasoActual(pasoActual - 1)}
                      startIcon={<NavigateBefore />}
                    >
                      Anterior
                    </Button>
                    
                    {pasoActual < preguntas.categorias.length - 1 ? (
                      <Button
                        variant="contained"
                        onClick={() => setPasoActual(pasoActual + 1)}
                        endIcon={<NavigateNext />}
                      >
                        Siguiente
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        onClick={enviarEvaluacion}
                        disabled={enviando}
                        startIcon={<Send />}
                      >
                        {enviando ? 'Enviando...' : 'Enviar Evaluación'}
                      </Button>
                    )}
                  </Box>
                  
                  <Box sx={{ mt: 2 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={((pasoActual + 1) / preguntas.categorias.length) * 100} 
                    />
                    <Typography variant="body2" color="textSecondary" align="center">
                      Paso {pasoActual + 1} de {preguntas.categorias.length}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          ) : (
            <Typography color="error">
              No se pudieron cargar las preguntas
            </Typography>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={cerrarEvaluacion}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
