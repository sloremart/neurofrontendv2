
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DocumentoRecaudo, EntidadFacturacion, EntidadResumenAgendada, Servicio, UsuarioAgendamiento, Medico, CitaMedico, EstadisticasCitas, ResponseMedicos, ResponseCitasMedico } from "../../interfaces/Dashboard";

interface DashboardState {
  facturacion: EntidadFacturacion[];
  totalFacturado: number;
  agendamientoServicios: Servicio[];
  usuariosAgendamiento: UsuarioAgendamiento[];
  agendamientoEntidades: EntidadResumenAgendada[];
  recaudo: DocumentoRecaudo[];
  medicos: Medico[];
  citas: CitaMedico[];
  estadisticasCitas: EstadisticasCitas | null;
  loading: boolean;
  error: string | null;
}





const initialState: DashboardState = {
  facturacion: [],
  totalFacturado: 0,
  agendamientoServicios: [],
  agendamientoEntidades: [],
  usuariosAgendamiento: [],
  recaudo: [], 
  medicos: [],
  citas: [],
  estadisticasCitas: null,
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
      action: PayloadAction<{ servicios: Servicio[]; entidades: EntidadResumenAgendada[] ; usuarios: UsuarioAgendamiento[] }>
    ) {
      state.agendamientoServicios = action.payload.servicios;
      state.agendamientoEntidades = action.payload.entidades;
      state.usuariosAgendamiento = action.payload.usuarios;
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
  setDashboardError, 
} = dashboard_slice.actions;

export default dashboard_slice.reducer;
