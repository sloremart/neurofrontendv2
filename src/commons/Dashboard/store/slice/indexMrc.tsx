import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { GrupoResumen } from "../../interfaces/Mrc";

interface RiesgoCompartidoState {
  datos: GrupoResumen[];
  loading: boolean;
  error: string | null;
}

const initialState: RiesgoCompartidoState = {
  datos: [],
  loading: false,
  error: null,
};

export const riesgo_compartido_slice = createSlice({
  name: "riesgo_compartido",
  initialState,
  reducers: {
    getRiesgoStart(state) {
      state.loading = true;
      state.error = null;
    },
    getRiesgoSuccess(state, action: PayloadAction<GrupoResumen[]>) {
      state.datos = action.payload;
      state.loading = false;
    },
    getRiesgoError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { getRiesgoStart, getRiesgoSuccess, getRiesgoError } = riesgo_compartido_slice.actions;
export default riesgo_compartido_slice.reducer;
