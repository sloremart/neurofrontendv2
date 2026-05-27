import { PayloadAction, createSlice } from "@reduxjs/toolkit";

import { IDashboardFacturacion, IObjAgendamiento, IObjDashBoardDetalleFactura, IObjDashBoardFacturacion, IObjSubcentro, IObjTarifas } from "../../interfaces/DashBoardFacturacion.ts";

const initial_state: IDashboardFacturacion = {
    dash_board_facturacion: [],
    dash_board_detallefactura: [],
    tarifas: [],
    dash_board_agendamiento: {
      data: {},
      consolidated_data: {
        Radiografia: 0,
        Ultrasonografia: 0,
        Doppler: 0,
        Electroencefalograma: 0,
        Electromiografia: 0,
        EstudioPoliSinOximetria: 0,
        EstudioPoliConOximetria: 0,
        Monitorizacion: 0,
        Neuroconduccion: 0,
        PolisonografiaTitulacion: 0,
        Potenciales: 0,
        Neurologia: 0,
        ServicioRadiologia: 0,
        InyeccionMiorelajante: 0,
        Fisiatria: 0,
        Infiltraciones: 0,
        BloqueoFisiatria: 0,
        Bloqueoneurologia: 0,
        TomografiaContrastada: 0,
        TomografiaSimple: 0,
        InsumoTomografia: 0,
        MedicamentoTac: 0,
        Otros: 0,
      }
  }, 
  dash_board_subcentro:{
    data: {},
    consolidated_data: {
      EstudioSueño: 0, 
      Neurologia:0,
      ImagenesBajaComplejidad: 0,
      AltaComplejidad: 0,
      Fisiatria: 0, 
      Otros: 0,
      
  }
  }

};

export const dash_board_slice = createSlice({
  name: 'dash_board',
  initialState: initial_state,
  reducers: {
    reset_state: () => initial_state,
    set_factura: (
      state: IDashboardFacturacion,
      action: PayloadAction<IObjDashBoardFacturacion[]>
    ) => {
      state.dash_board_facturacion = action.payload;
    },
    set_detalle_factura: (
      state: IDashboardFacturacion,
      action: PayloadAction<IObjDashBoardDetalleFactura[]>
    ) => {
      state.dash_board_detallefactura = action.payload;
    },
    set_agendamiento: (
      state: IDashboardFacturacion,
      action: PayloadAction<IObjAgendamiento>
    ) => {
      state.dash_board_agendamiento = action.payload;
    },
    set_subcentro: (
      state: IDashboardFacturacion,
      action: PayloadAction<IObjSubcentro>
    ) => {
      state.dash_board_subcentro = action.payload;
    },
    set_tarifas: (
      state: IDashboardFacturacion,
      action: PayloadAction<IObjTarifas[]>
    ) => {
      state.tarifas= action.payload;
    },
     
  },
});
export const {
    set_factura, set_detalle_factura, set_agendamiento, set_subcentro, set_tarifas
 
} = dash_board_slice.actions;

export default dash_board_slice.reducer;