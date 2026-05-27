import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Area {
  id: number;
  nombre: string;
}

interface TipoComponente {
  id: number;
  nombre: string;
  porcentaje_total: number;
  descripcion?: string;
}

interface Componente {
  area_nombre: string;
  tipo_nombre: string;
  id: number;
  tipo: number; // id del TipoComponente
  area: number;
  es_360: boolean; 
}

interface Actividad {
  id: number;
  componente: number;
  nombre: string;
  descripcion?: string;
  porcentaje: number;
  usuario_asignado?: number;
  usuarios_grupo?: number[];
}

interface Evaluacion {
  id: number;
  usuario_evaluado: number;
  evaluador: number;
  tipo: string;
  componente: number;
  fecha: string;
  // Additional properties that might come from the backend
  usuario_evaluado_nombre?: string;
  evaluador_nombre?: string;
  componente_nombre?: string;
  completada?: boolean;
  total_asignaciones?: number;
  asignaciones_completadas?: number;
  porcentaje_completado?: number;
}

interface PreguntaEvaluacion {
  id: number;
  evaluacion: number;
  texto: string;
  valor: number;
}

interface UsuarioPerfil {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  perfil?: {
    id: number;
    rol?: string;
    cargo?: string;
    tipo_evaluacion?: string;
    area_id?: number;
  };
}

interface ContratoUsuario {
  id: number;
  usuario_nombre: string;
  area_nombre: string;
  es_vigente: boolean;
  dias_restantes: number;
  usuario_id: number;
  identificacion: string;
  tipo_contrato: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
  salario: string;
  cargo: string;
  created_at: string;
  updated_at: string;
  area: number;
}

interface Pregunta360 {
  id: number;
  componente: number;
  texto: string;
}

interface CategoriaPregunta {
  id: number;
  nombre: string;
  descripcion?: string;
  componente: number;
  orden: number;
  activo: boolean;
}

interface RegistroHorario {
  // ✅ CAMPOS DE REGISTROS PROCESADOS (Excel)
  fila?: number;
  identificador?: string;
  nombre_completo: string;
  grupo?: string;
  fecha: string;
  turno?: string;
  entro?: string;
  salio_manana?: string;
  entro_tarde?: string;
  salio_tarde?: string;
  minutos_atraso?: number;
  atraso_manana?: number;      // Minutos de atraso en la mañana
  atraso_almuerzo?: number;    // Minutos de atraso del almuerzo
  atraso_salida?: number;      // Minutos de atraso en la salida
  total_minutos_atraso?: number; // Total de minutos de atraso
  adelanto?: number;           // Minutos de adelanto
  hea?: string;
  hec?: string;
  hnt?: string;
  ht?: string;
  porcentaje?: number;
  estado?: string;
  mensaje?: string;
  usuario_encontrado?: boolean;
  area?: string;
  cargo?: string;
  
  // ✅ CAMPOS DE REGISTROS DE BASE DE DATOS
  id?: number;
  identificacion?: string;     // Campo de BD equivalente a identificador
  grupo_area?: string;         // Campo de BD equivalente a grupo
  hora_entrada_manana?: string;
  hora_salida_almuerzo?: string;
  hora_entrada_almuerzo?: string;
  hora_salida_final?: string;
  total_atraso_entrada?: number;  // Campo consolidado de BD
  total_atraso_almuerzo?: number; // Campo consolidado de BD
  total_atraso_salida?: number;   // Campo consolidado de BD
  total_adelanto?: number;        // Campo consolidado de BD
  porcentaje_cumplimiento?: number; // Campo consolidado de BD
  total_dias?: number;
  dias_con_atraso?: number;
  fecha_inicio_periodo?: string;
  fecha_fin_periodo?: string;
  periodo_descripcion?: string;
  archivo_origen?: string;
  created_at?: string;
}

interface ResultadoProcesamiento {
  success: boolean;
  total_registros: number;
  total_validos: number;
  total_advertencias: number;
  total_errores: number;
  resultados: RegistroHorario[];
  archivo?: string;
  error?: string;
}

interface EvaluacionState {
  areas: Area[];
  tipos_componente: TipoComponente[];
  componentes: Componente[];
  actividades: Actividad[];
  evaluaciones: Evaluacion[];
  preguntas: PreguntaEvaluacion[];
  usuarios: UsuarioPerfil[];
  contratosUsuarios: ContratoUsuario[];
  preguntas360: Pregunta360[];
  categoriasPreguntas: CategoriaPregunta[];
  registrosHorario: RegistroHorario[];
  resultadoProcesamiento: ResultadoProcesamiento | null;
  loadingHorario: boolean;
  loading: boolean; // ✅ Agregar estado de loading general
  error: string | null; // ✅ Agregar estado de error
}

const initialState: EvaluacionState = {
  areas: [],
  tipos_componente: [],
  componentes: [],
  actividades: [],
  evaluaciones: [],
  preguntas: [],
  usuarios: [],
  contratosUsuarios: [],
  preguntas360: [],
  categoriasPreguntas: [],
  registrosHorario: [],
  resultadoProcesamiento: null,
  loadingHorario: false,
  loading: false, // ✅ Inicializar loading
  error: null // ✅ Inicializar error
};

export const evaluacion_slice = createSlice({
  name: 'evaluacion',
  initialState,
  reducers: {
    resetEvaluacionState: () => initialState,
    
    // ✅ LOG DE DEPURACIÓN PARA VERIFICAR QUE EL SLICE SE EJECUTA
    testSlice: (state) => {
      console.log('🔄 Slice testSlice: SLICE EJECUTÁNDOSE CORRECTAMENTE');
      console.log('🔄 Slice testSlice: Estado actual:', state);
      console.log('🔄 Slice testSlice: Estado inicial:', initialState);
      console.log('🔄 Slice testSlice: Nombre del slice:', 'evaluacion');
    },
    
    setAreas: (state, action: PayloadAction<Area[]>) => {
      console.log('🔄 Slice setAreas: Acción recibida con payload:', action.payload);
      console.log('🔄 Slice setAreas: Estado anterior:', state.areas);
      console.log('🔄 Slice setAreas: Tipo de payload:', typeof action.payload);
      console.log('🔄 Slice setAreas: Payload es array:', Array.isArray(action.payload));
      console.log('🔄 Slice setAreas: Longitud del payload:', action.payload?.length || 0);
      
      // Protección: no actualizar si el payload está vacío y ya tenemos datos
      if ((!action.payload || action.payload.length === 0) && state.areas && state.areas.length > 0) {
        console.log('🔄 Slice setAreas: PROTECCIÓN - No se actualiza con datos vacíos si ya hay datos');
        return;
      }
      
      // Usar mutación inmutable para asegurar que Redux Toolkit detecte el cambio
      state.areas = [...(action.payload || [])];
      
      console.log('🔄 Slice setAreas: Estado actualizado:', state.areas);
      console.log('🔄 Slice setAreas: Longitud del estado actualizado:', state.areas?.length || 0);
      console.log('🔄 Slice setAreas: Referencia del array cambiada:', state.areas !== action.payload);
    },
    
    setTiposComponente: (state, action: PayloadAction<TipoComponente[]>) => {
      console.log('🔄 Slice setTiposComponente: Acción recibida con payload:', action.payload);
      console.log('🔄 Slice setTiposComponente: Estado anterior:', state.tipos_componente);
      console.log('🔄 Slice setTiposComponente: Tipo de payload:', typeof action.payload);
      console.log('🔄 Slice setTiposComponente: Payload es array:', Array.isArray(action.payload));
      console.log('🔄 Slice setTiposComponente: Longitud del payload:', action.payload?.length || 0);
      
      // Protección: no actualizar si el payload está vacío y ya tenemos datos
      if ((!action.payload || action.payload.length === 0) && state.tipos_componente && state.tipos_componente.length > 0) {
        console.log('🔄 Slice setTiposComponente: PROTECCIÓN - No se actualiza con datos vacíos si ya hay datos');
        return;
      }
      
      // Usar mutación inmutable para asegurar que Redux Toolkit detecte el cambio
      state.tipos_componente = [...(action.payload || [])];
      
      console.log('🔄 Slice setTiposComponente: Estado actualizado:', state.tipos_componente);
      console.log('🔄 Slice setTiposComponente: Longitud del estado actualizado:', state.tipos_componente?.length || 0);
      console.log('🔄 Slice setTiposComponente: Referencia del array cambiada:', state.tipos_componente !== action.payload);
    },
    
    setComponentes: (state, action: PayloadAction<Componente[]>) => {
      state.componentes = action.payload;
    },
    
    setActividades: (state, action: PayloadAction<Actividad[]>) => {
      console.log('🔄 Slice setActividades: Acción recibida con payload:', action.payload);
      console.log('🔄 Slice setActividades: Estado anterior:', state.actividades);
      console.log('🔄 Slice setActividades: Tipo de payload:', typeof action.payload);
      console.log('🔄 Slice setActividades: Payload es array:', Array.isArray(action.payload));
      console.log('🔄 Slice setActividades: Longitud del payload:', action.payload?.length || 0);
      
      // Protección: no actualizar si el payload está vacío y ya tenemos datos
      if ((!action.payload || action.payload.length === 0) && state.actividades && state.actividades.length > 0) {
        console.log('🔄 Slice setActividades: PROTECCIÓN - No se actualiza con datos vacíos si ya hay datos');
        return;
      }
      
      // Usar mutación inmutable para asegurar que Redux Toolkit detecte el cambio
      state.actividades = [...(action.payload || [])];
      
      console.log('🔄 Slice setActividades: Estado actualizado:', state.actividades);
      console.log('🔄 Slice setActividades: Longitud del estado actualizado:', state.actividades?.length || 0);
      console.log('🔄 Slice setActividades: Referencia del array cambiada:', state.actividades !== action.payload);
    },
    
    setEvaluaciones: (state, action: PayloadAction<Evaluacion[]>) => {
      state.evaluaciones = action.payload;
    },
    
    setPreguntas: (state, action: PayloadAction<PreguntaEvaluacion[]>) => {
      state.preguntas = action.payload;
    },
    
    setUsuarios: (state, action: PayloadAction<UsuarioPerfil[]>) => {
      state.usuarios = action.payload;
    },
    
    setContratosUsuarios: (state, action: PayloadAction<ContratoUsuario[]>) => {
      state.contratosUsuarios = action.payload;
    },
    
    setPreguntas360: (state, action: PayloadAction<Pregunta360[]>) => {
      state.preguntas360 = action.payload;
    },
    
    setCategoriasPreguntas: (state, action: PayloadAction<CategoriaPregunta[]>) => {
      state.categoriasPreguntas = action.payload;
    },
    
    setRegistrosHorario: (state, action: PayloadAction<RegistroHorario[]>) => {
      console.log('🔄 Slice setRegistrosHorario: Acción recibida con payload:', {
        payload: action.payload,
        longitud: action.payload?.length || 0,
        esArray: Array.isArray(action.payload),
        estadoAnterior: state.registrosHorario?.length || 0,
        timestamp: new Date().toISOString()
      });
      state.registrosHorario = action.payload;
      console.log('🔄 Slice setRegistrosHorario: Estado actualizado:', {
        nuevoEstado: state.registrosHorario,
        longitud: state.registrosHorario?.length || 0
      });
      
      // ✅ VERIFICAR QUE EL ESTADO SE ACTUALIZÓ CORRECTAMENTE
      console.log('🔄 Slice setRegistrosHorario: Verificación final:', {
        stateKeys: Object.keys(state),
        registrosHorarioExiste: 'registrosHorario' in state,
        registrosHorarioValue: state.registrosHorario,
        registrosHorarioLength: state.registrosHorario?.length || 0
      });
    },
    
    setResultadoProcesamiento: (state, action: PayloadAction<ResultadoProcesamiento | null>) => {
      state.resultadoProcesamiento = action.payload;
    },
    
    setLoadingHorario: (state, action: PayloadAction<boolean>) => {
      state.loadingHorario = action.payload;
    },
    
    // ✅ Agregar nuevos reducers
    setLoading: (state, action: PayloadAction<boolean>) => {
      console.log('🔄 Slice setLoading:', action.payload);
      state.loading = action.payload;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      console.log('🔄 Slice setError:', action.payload);
      state.error = action.payload;
    }
  } // ✅ Remover la llave extra que estaba causando el problema
});

export const {
  resetEvaluacionState,
  testSlice, // ✅ Exportar testSlice
  setAreas,
  setTiposComponente,
  setComponentes,
  setActividades,
  setEvaluaciones,
  setPreguntas, 
  setUsuarios,
  setContratosUsuarios,
  setPreguntas360, 
  setCategoriasPreguntas,
  setRegistrosHorario,
  setResultadoProcesamiento,
  setLoadingHorario,
  setLoading, // ✅ Exportar setLoading
  setError // ✅ Exportar setError
} = evaluacion_slice.actions;

// Export interfaces for use in components
export type { RegistroHorario, ResultadoProcesamiento };

// ✅ AGREGAR: Selectores tipo-seguros para producción
export const selectAreas = (state: any) => state.evaluacion?.areas || [];
export const selectTiposComponente = (state: any) => state.evaluacion?.tipos_componente || [];
export const selectComponentes = (state: any) => state.evaluacion?.componentes || [];
export const selectActividades = (state: any) => state.evaluacion?.actividades || [];
export const selectEvaluaciones = (state: any) => state.evaluacion?.evaluaciones || [];
export const selectLoading = (state: any) => state.evaluacion?.loading || false;
export const selectError = (state: any) => state.evaluacion?.error || null;

export default evaluacion_slice.reducer;