
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  DocumentoRecaudo, EntidadFacturacion, EntidadResumenAgendada, Servicio, UsuarioAgendamiento,
  Medico, CitaMedico, EstadisticasCitas, ResponseMedicos, ResponseCitasMedico,
  ProduccionMensualData, ResultadosEstudiosData, AgendamientoTimeline,
} from "../../interfaces/Dashboard";

interface AgendamientoEstados {
  total: number;
  atendidas: number;
  programadas: number;
  incumplidas: number;
  canceladas: number;
  sin_estado: number;
}

interface AgendamientoMedico {
  medico: string;
  total: number;
  atendidas: number;
  programadas: number;
  canceladas: number;
  incumplidas: number;
  sin_estado: number;
}

interface DashboardState {
  facturacion: EntidadFacturacion[];
  totalFacturado: number;
  agendamientoServicios: Servicio[];
  usuariosAgendamiento: UsuarioAgendamiento[];
  agendamientoEntidades: EntidadResumenAgendada[];
  agendamientoTimeline: AgendamientoTimeline[];
  agendamientoTotal: number;
  agendamientoValorConsultas: number;
  agendamientoCopago: number;
  agendamientoPagado: number;
  agendamientoEstados: AgendamientoEstados;
  agendamientoMedicos: AgendamientoMedico[];
  recaudo: DocumentoRecaudo[];
  medicos: Medico[];
  citas: CitaMedico[];
  estadisticasCitas: EstadisticasCitas | null;
  produccionMensual: ProduccionMensualData | null;
  resultadosEstudios: ResultadosEstudiosData | null;
  loading: boolean;
  error: string | null;
}





const initialState: DashboardState = {
  facturacion: [],
  totalFacturado: 0,
  agendamientoServicios: [],
  agendamientoEntidades: [],
  usuariosAgendamiento: [],
  agendamientoTimeline: [],
  agendamientoTotal: 0,
  agendamientoValorConsultas: 0,
  agendamientoCopago: 0,
  agendamientoPagado: 0,
  agendamientoEstados: { total: 0, atendidas: 0, programadas: 0, incumplidas: 0, canceladas: 0, sin_estado: 0 },
  agendamientoMedicos: [],
  recaudo: [],
  medicos: [],
  citas: [],
  estadisticasCitas: null,
  produccionMensual: null,
  resultadosEstudios: null,
  loading: false,
  error: null,
};

export const dashboard_slice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    setDashboardStart(state) {
      state.loading = true;
      state.error = null;
    },
    setFacturacionSuccess(
      state,
      action: PayloadAction<{ data: EntidadFacturacion[]; total_facturado: number }>
    ) {
      state.facturacion = action.payload.data;
      state.totalFacturado = action.payload.total_facturado;
      state.loading = false;
    },
    setAgendamientoSuccess(
      state,
      action: PayloadAction<{ servicios: Servicio[]; entidades: EntidadResumenAgendada[]; usuarios: UsuarioAgendamiento[]; timeline: AgendamientoTimeline[]; total: number; total_valor_consultas: number; total_copago: number; total_pagado: number; estados?: AgendamientoEstados; medicos?: AgendamientoMedico[] }>
    ) {
      state.agendamientoServicios = action.payload.servicios;
      state.agendamientoEntidades = action.payload.entidades;
      state.usuariosAgendamiento = action.payload.usuarios;
      state.agendamientoTimeline = action.payload.timeline;
      state.agendamientoTotal = action.payload.total;
      state.agendamientoValorConsultas = action.payload.total_valor_consultas ?? 0;
      state.agendamientoCopago = action.payload.total_copago ?? 0;
      state.agendamientoPagado = action.payload.total_pagado ?? 0;
      if (action.payload.estados) state.agendamientoEstados = action.payload.estados;
      if (action.payload.medicos) state.agendamientoMedicos = action.payload.medicos;
      state.loading = false;
    },
    setRecaudoSuccess(state, action: PayloadAction<DocumentoRecaudo[]>) {
      state.recaudo = action.payload;
      state.loading = false;
    },
    setMedicosSuccess(state, action: PayloadAction<ResponseMedicos>) {
      state.medicos = action.payload.medicos;
      state.loading = false;
    },
    setCitasSuccess(state, action: PayloadAction<ResponseCitasMedico>) {
      state.citas = action.payload.citas;
      state.estadisticasCitas = action.payload.estadisticas;
      state.loading = false;
    },
    setProduccionSuccess(state, action: PayloadAction<ProduccionMensualData>) {
      state.produccionMensual = action.payload;
      state.loading = false;
    },
    setResultadosSuccess(state, action: PayloadAction<ResultadosEstudiosData>) {
      state.resultadosEstudios = action.payload;
      state.loading = false;
    },
    setDashboardError(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  setDashboardStart,
  setFacturacionSuccess,
  setAgendamientoSuccess,
  setRecaudoSuccess,
  setMedicosSuccess,
  setCitasSuccess,
  setProduccionSuccess,
  setResultadosSuccess,
  setDashboardError,
} = dashboard_slice.actions;

export default dashboard_slice.reducer;
