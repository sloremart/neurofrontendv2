import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import {  IObjAdmisionCuentasMedicas, IObjAdmisionPendientes, IObjConsolidadoEstudios, IObjProfesionales, ITalentoHumano } from "../../interfaces/TalentoHumano";


interface Hallazgo {
  id: number;
  descripcion: string;
}
const initial_state: ITalentoHumano = {
    admision_cuentas_medicas: [],
    admision_pendientes_facturacion: [],
    hallazgo:[],
    consolidadoestudios:[],
    profesionales:[],
    estudios_medico_asignado:[],
};

export const talento_humano_slice = createSlice({
  name: 'talento_humano',
  initialState: initial_state,
  reducers: {
    reset_state: () => initial_state,
    set_talento_humano: (
      state: ITalentoHumano,
      action: PayloadAction<IObjAdmisionCuentasMedicas[]>
    ) => {
      state.admision_cuentas_medicas = action.payload;
    },
    set_admision_pendiente: (
      state: ITalentoHumano,
      action: PayloadAction<IObjAdmisionPendientes[]>
    ) => {
      state.admision_pendientes_facturacion = action.payload;
    },
    set_hallazgos: (state, action: PayloadAction<Hallazgo[]>) => {
      state.hallazgo = action.payload;
    },
    set_consolidado_estudios: (state, action: PayloadAction<IObjConsolidadoEstudios[]>) => {
      state.consolidadoestudios = action.payload;
    },
    set_profesionales: (state, action: PayloadAction<IObjProfesionales[]>) => {
      state.profesionales = action.payload;
    },
    set_estudios_medico_asignado: (state, action: PayloadAction<IObjConsolidadoEstudios[]>) => {
      state.estudios_medico_asignado = action.payload;
    }
  
  },
});
export const {
    set_talento_humano, set_admision_pendiente, set_hallazgos, set_consolidado_estudios, set_profesionales,
    set_estudios_medico_asignado
 
} = talento_humano_slice.actions;

export default talento_humano_slice.reducer;