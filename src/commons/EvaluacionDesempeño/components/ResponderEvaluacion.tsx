import {
  Box, Typography, Card, CardContent,
  FormControl, FormControlLabel, Radio, RadioGroup, TextField,
  Button, LinearProgress, Chip, Alert, Divider,
  Avatar
} from '@mui/material';
import { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { getPreguntas360, getComponentes, getPreguntasEvaluacion360, completarEvaluacion360 } from '../store/thunks/ThunksEvaluacionDesempeño.tsx';
import React from 'react';
import { AssignmentTurnedIn } from '@mui/icons-material';

interface Pregunta {
  id: number;
  texto: string;
  tipo: string;
  categoria: string;
  obligatoria: boolean;
  peso: number;
  componente?: string;
  escalas?: any[];
  opciones?: any[];
}

interface Respuesta {
  pregunta_id: number;
  respuesta_texto?: string;
  respuesta_numerica?: number;
  respuesta_booleana?: boolean;
}

interface ResponderEvaluacionProps {
  asignacionId: number;
  evaluacionId?: number;
  usuarioEvaluado?: any;
  evaluadorId?: number;
}

export default function ResponderEvaluacion({ 
  asignacionId, 
  evaluacionId, 
  usuarioEvaluado, 
  evaluadorId 
}: ResponderEvaluacionProps) {
  const dispatch = useDispatch();

  const [activeStep, setActiveStep] = useState(0);
  const [respuestas, setRespuestas] = useState<Respuesta[]>([]);
  const [evaluacion, setEvaluacion] = useState<any>(null);
  const [preguntasEvaluacion, setPreguntasEvaluacion] = useState<Pregunta[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const loadEvaluacion = useCallback(async () => {
    try {
      setLoading(true);
      
      // Cargar preguntas específicas de esta asignación
      const preguntasResponse = await dispatch(getPreguntasEvaluacion360(asignacionId) as any);
      
      console.log('🔍 DEBUG: Respuesta preguntas:', preguntasResponse);
      
      if (preguntasResponse) {
        // Configurar información de la evaluación
        setEvaluacion({
          id: preguntasResponse.evaluacion_id || evaluacionId,
          asignacion_id: asignacionId,
          usuario_evaluado: preguntasResponse.usuario_evaluado?.nombre || usuarioEvaluado?.nombre || 'Usuario',
          evaluador: 'Líder',
          tipo: '360',
          componente: preguntasResponse.componente?.nombre || 'Evaluación 360°',
          fecha: preguntasResponse.fecha || new Date().toISOString()
        });

        // Convertir las preguntas del backend al formato esperado por el frontend
        const preguntasFormateadas: Pregunta[] = [];
        
        if (preguntasResponse.categorias) {
          preguntasResponse.categorias.forEach((categoria: any) => {
            categoria.preguntas.forEach((pregunta: any) => {
              preguntasFormateadas.push({
                id: pregunta.id,
                texto: pregunta.texto,
                tipo: pregunta.tipo,
                componente: preguntasResponse.componente?.nombre || 'Evaluación 360°',
                categoria: categoria.nombre,
                obligatoria: pregunta.obligatoria,
                peso: pregunta.peso,
                escalas: pregunta.escalas || [],
                opciones: pregunta.opciones || []
              });
            });
          });
        }
        
        console.log('🔍 DEBUG: Preguntas formateadas:', preguntasFormateadas);
        setPreguntasEvaluacion(preguntasFormateadas);
      }
      
    } catch (error) {
      console.error('Error al cargar evaluación:', error);
      // En caso de error, usar datos por defecto
      setEvaluacion({
        id: evaluacionId,
        asignacion_id: asignacionId,
        usuario_evaluado: usuarioEvaluado?.nombre || 'Usuario',
        evaluador: 'Líder',
        tipo: '360',
        componente: 'Evaluación 360°',
        fecha: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  }, [dispatch, asignacionId, evaluacionId, usuarioEvaluado]);

  useEffect(() => {
    dispatch(getPreguntas360() as any);
    dispatch(getComponentes() as any);
    // Cargar la evaluación específica usando asignacionId
    loadEvaluacion();
  }, [dispatch, asignacionId, loadEvaluacion]);

  // Ya no necesitamos este useEffect porque las preguntas se manejan directamente en loadEvaluacion

  const handleRespuestaChange = (preguntaId: number, valor: any, tipo: string) => {
    const respuestaExistente = respuestas.find(r => r.pregunta_id === preguntaId);
    
    if (respuestaExistente) {
      setRespuestas(respuestas.map(r => 
        r.pregunta_id === preguntaId 
          ? { ...r, [tipo]: valor }
          : r
      ));
    } else {
      setRespuestas([...respuestas, { pregunta_id: preguntaId, [tipo]: valor }]);
    }
  };



  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async () => {
    if (respuestas.length < preguntasEvaluacion.length) {
      alert('Por favor responde todas las preguntas antes de enviar');
      return;
    }

    try {
      setSubmitting(true);
      
      // Preparar datos para enviar al backend
      const evaluacionData = {
        asignacion_id: asignacionId,
        evaluador_id: evaluadorId,
        respuestas: respuestas.map(respuesta => ({
          pregunta_id: respuesta.pregunta_id,
          respuesta_texto: respuesta.respuesta_texto || null,
          respuesta_numerica: respuesta.respuesta_numerica || null,
          respuesta_booleana: respuesta.respuesta_booleana !== undefined ? respuesta.respuesta_booleana : null
        }))
      };

      console.log('🚀 Enviando evaluación:', evaluacionData);
      
      const result = await dispatch(completarEvaluacion360(evaluacionData) as any);
      
      if (result) {
        setSubmitted(true);
        console.log('✅ Evaluación enviada exitosamente:', result);
        
        // Opcional: Redirigir después de unos segundos
        setTimeout(() => {
          window.history.back(); // Volver al dashboard
        }, 2000);
      }
      
    } catch (error) {
      console.error('❌ Error al enviar evaluación:', error);
      alert('Error al enviar la evaluación. Por favor intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const getPreguntasPorCategoria = () => {
    const categorias = [...new Set(preguntasEvaluacion.map(p => p.categoria))];
    return categorias.map(categoria => ({
      categoria,
      preguntas: preguntasEvaluacion.filter(p => p.categoria === categoria)
    }));
  };

  const getProgresso = () => {
    const totalPreguntas = preguntasEvaluacion.length;
    const preguntasRespondidas = respuestas.length;
    return totalPreguntas > 0 ? (preguntasRespondidas / totalPreguntas) * 100 : 0;
  };

  const renderPregunta = (pregunta: Pregunta) => {
    const respuesta = respuestas.find(r => r.pregunta_id === pregunta.id);

    switch (pregunta.tipo) {
      case 'LIKERT':
        return (
          <FormControl component="fieldset" fullWidth>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {pregunta.texto}
            </Typography>
            <RadioGroup
              value={respuesta?.respuesta_numerica || ''}
              onChange={(e) => handleRespuestaChange(pregunta.id, parseInt(e.target.value), 'respuesta_numerica')}
            >
              <FormControlLabel value={1} control={<Radio />} label="Totalmente en desacuerdo" />
              <FormControlLabel value={2} control={<Radio />} label="En desacuerdo" />
              <FormControlLabel value={3} control={<Radio />} label="Neutral" />
              <FormControlLabel value={4} control={<Radio />} label="De acuerdo" />
              <FormControlLabel value={5} control={<Radio />} label="Totalmente de acuerdo" />
            </RadioGroup>
          </FormControl>
        );

      case 'ABIERTA':
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            label={pregunta.texto}
            value={respuesta?.respuesta_texto || ''}
            onChange={(e) => handleRespuestaChange(pregunta.id, e.target.value, 'respuesta_texto')}
            sx={{ mt: 1 }}
          />
        );

      case 'BOOLEANA':
        return (
          <FormControl component="fieldset" fullWidth>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {pregunta.texto}
            </Typography>
            <RadioGroup
              value={respuesta?.respuesta_booleana?.toString() || ''}
              onChange={(e) => handleRespuestaChange(pregunta.id, e.target.value === 'true', 'respuesta_booleana')}
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
            onChange={(e) => handleRespuestaChange(pregunta.id, parseInt(e.target.value), 'respuesta_numerica')}
            inputProps={{ min: 0, max: 10 }}
            sx={{ mt: 1 }}
          />
        );

      default:
        return <Typography>Tipo de pregunta no soportado</Typography>;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Cargando evaluación...</Typography>
      </Box>
    );
  }

  if (!evaluacion) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">No se encontró la evaluación</Alert>
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
      {/* Header mejorado con imagen check.jpg */}
      <Card sx={{ 
        mb: 3, 
        position: 'relative',
        borderRadius: 3,
        overflow: 'hidden',
        minHeight: '200px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
      }}>
        {/* Imagen de fondo principal */}
        <Box
          component="img"
          src="/check.jpg"
          alt="Evaluation Header"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0
          }}
        />
        
        {/* Overlay gradiente para legibilidad */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, rgba(79, 172, 254, 0.8) 0%, rgba(0, 242, 254, 0.6) 100%)',
            zIndex: 1
          }}
        />
        
        {/* Imagen check decorativa adicional */}
        <Box
          component="img"
          src="/check.jpg"
          alt="Check Icon"
          sx={{
            position: 'absolute',
            top: 20,
            right: 20,
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '3px solid rgba(255,255,255,0.3)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            zIndex: 3,
            opacity: 0.9
          }}
        />
        
        <CardContent sx={{ position: 'relative', zIndex: 2, p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)', 
              mr: 3,
              width: 60,
              height: 60,
              backdropFilter: 'blur(10px)'
            }}>
              <AssignmentTurnedIn sx={{ fontSize: 30, color: 'white' }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                Evaluación 360°
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                {evaluacion.usuario_evaluado}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip 
              label={`Tipo: ${evaluacion.tipo}`} 
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                fontWeight: 'bold',
                backdropFilter: 'blur(10px)'
              }} 
            />
            <Chip 
              label={`Componente: ${evaluacion.componente}`} 
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                fontWeight: 'bold',
                backdropFilter: 'blur(10px)'
              }} 
            />
            <Chip 
              label={`Fecha: ${new Date(evaluacion.fecha).toLocaleDateString()}`} 
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                fontWeight: 'bold',
                backdropFilter: 'blur(10px)'
              }} 
            />
          </Box>
        </CardContent>
      </Card>

      {/* Progreso */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Progreso de la Evaluación</Typography>
            <Typography variant="body2">
              {respuestas.length} de {preguntasEvaluacion.length} preguntas respondidas
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={getProgresso()} 
            sx={{ height: 10, borderRadius: 5 }}
          />
        </CardContent>
      </Card>

      {/* Preguntas por Categoría */}
      {getPreguntasPorCategoria().map((categoria, categoriaIndex) => (
        <Card key={categoriaIndex} sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
              {categoria.categoria}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {categoria.preguntas.map((pregunta, preguntaIndex) => (
              <Box key={pregunta.id} sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    Pregunta {preguntaIndex + 1}:
                  </Typography>
                  {pregunta.obligatoria && (
                    <Chip label="Obligatoria" color="error" size="small" />
                  )}
                </Box>
                {renderPregunta(pregunta)}
              </Box>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Mensaje de éxito */}
      {submitted && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            ¡Evaluación enviada exitosamente! 🎉
          </Typography>
          <Typography variant="body2">
            Tu evaluación ha sido guardada. Serás redirigido al dashboard en breve...
          </Typography>
        </Alert>
      )}

      {/* Botones de Navegación */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          variant="outlined"
          onClick={handleBack}
          disabled={activeStep === 0}
        >
          Anterior
        </Button>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined"
            disabled={submitting || submitted}
          >
            Guardar Borrador
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            disabled={respuestas.length < preguntasEvaluacion.length || submitting || submitted}
            sx={{
              backgroundColor: submitted ? '#4caf50' : submitting ? '#ff9800' : '#1976d2',
              '&:hover': {
                backgroundColor: submitted ? '#45a049' : submitting ? '#f57c00' : '#1565c0'
              }
            }}
          >
            {submitted ? '✅ Evaluación Enviada' : submitting ? '📤 Enviando...' : 'Enviar Evaluación'}
          </Button>
        </Box>
      </Box>
      </Box>
    </Box>
  );
} 