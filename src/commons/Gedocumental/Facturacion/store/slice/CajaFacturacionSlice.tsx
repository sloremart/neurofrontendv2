import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { IObjAdmision, Nits } from "../../interface/CajaFacturacion";

interface ICajaFacturacion {
  nits: Nits[];
  archivos: IObjAdmision[];
}

const initial_state: ICajaFacturacion = {
  nits: [],
  archivos: [],
};

export const caja_facturacion_slice = createSlice({
  name: "caja_facturacion",
  initialState: initial_state,
  reducers: {
    set_cuentas_nits: (state, action: PayloadAction<Nits[]>) => {
      state.nits = action.payload;
    },
    set_archivos_caja: (state, action: PayloadAction<IObjAdmision[]>) => {
      state.archivos = action.payload;
    },
  },
});

export const { set_cuentas_nits, set_archivos_caja } = caja_facturacion_slice.actions;
export default caja_facturacion_slice.reducer;
