import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { CicloPagos, Cuentas, Egreso, Facturas, IObjAdmision, IProgramacionPago, Nits } from "../../interface/ProgramacionPago";


const initial_state: IProgramacionPago = {
  facturas: [],
  cuentas: [],
  nits: [],
  ciclopagos: [],
  loading: false,
  gestion_pagos_aprobados: [],
  egresos: [],
  archivos: [],

};

export const programacion_pagos_slice = createSlice({
  name: 'programacion_pagos',
  initialState: initial_state,
  reducers: {
    reset_state: () => initial_state,
    set_facturas_programacion_pagos: (
      state: IProgramacionPago,
      action: PayloadAction<Facturas[]>
    ) => {
      state.facturas = action.payload;
    },

    set_cuentas_nits: (
      state: IProgramacionPago,
      action: PayloadAction<Nits[]>
    ) => {
      console.log("Payload recibido en set_cuentas_nits:", action.payload);
      state.nits = action.payload;
      console.log("Estado actualizado de nits en Redux:", state.nits);
    },

    set_archivos: (
      state: IProgramacionPago,
      action: PayloadAction<IObjAdmision[]>
    ) => {
      state.archivos = action.payload;
    },
    set_cuentas: (
      state: IProgramacionPago,
      action: PayloadAction<Cuentas[]>
    ) => {
      state.cuentas = action.payload;
    },
    set_ciclos_pagos: (state, action: PayloadAction<CicloPagos[]>) => {
      state.ciclopagos = action.payload;
      state.loading = false;
    },
    set_gestion_pagos: (state, action: PayloadAction<CicloPagos[]>) => {
      state.gestion_pagos_aprobados = action.payload;
      state.loading = false;
    },
    set_egresos: (state, action: PayloadAction<Egreso[]>) => {
      state.egresos = action.payload;
      state.loading = false;
    },
    set_loading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    update_factura_revision_financiera: (state, action) => {
      const { facturaId, revisionFinanciera } = action.payload;
      const facturaIndex = state.ciclopagos.findIndex((fact) => fact.Id === facturaId);
      if (facturaIndex !== -1) {
        state.ciclopagos[facturaIndex].RevisionFinanciera = revisionFinanciera;
      }
    },




  },
});
export const {
  set_facturas_programacion_pagos, set_cuentas_nits, set_cuentas, set_ciclos_pagos, update_factura_revision_financiera, set_gestion_pagos, set_egresos, set_archivos
} = programacion_pagos_slice.actions;

export default programacion_pagos_slice.reducer;