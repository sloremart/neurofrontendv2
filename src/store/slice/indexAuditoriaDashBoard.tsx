import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { AdmisionesFacturador, IAuditoriaDashboard } from "../../interface/AuditoriaDashboard";



const initial_state: IAuditoriaDashboard = {
    admisiones_facturador: {
      cantidad_admisiones: 0,
      admisiones: [],
      entidad_count: {}
    }
  };

export const auditoria_dashboard_slice = createSlice({
  name: 'auditoria_dashboard',
  initialState: initial_state,
  reducers: {
    reset_state: () => initial_state,
    set_admisiones_facturador: (
      state: IAuditoriaDashboard ,
      action: PayloadAction<AdmisionesFacturador>
    ) => {
      state.admisiones_facturador = action.payload;
    },

  

     
  },
});
export const {
    set_admisiones_facturador, 
 
} = auditoria_dashboard_slice.actions;

export default auditoria_dashboard_slice.reducer;