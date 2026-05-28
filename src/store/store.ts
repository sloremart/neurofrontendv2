

import { configureStore } from '@reduxjs/toolkit';
import { talento_humano_slice } from '../commons/Gedocumental/TalentoHumano/store/slice/indexTalentoHumano.tsx';
import { dash_board_slice } from '../commons/FacturacionDasboard/store/slice/indexDashBoardfacturacion.tsx';
import { users_slice } from '../commons/Login/store/slice/SliceLogin.tsx';
import { auditoria_dashboard_slice } from '../commons/Auditoria/store/slice/indexAuditoriaDashBoard.tsx';
import { caja_facturacion_slice } from '../commons/Gedocumental/Facturacion/store/slice/CajaFacturacionSlice.tsx';
import { dashboard_slice } from '../commons/Dashboard/store/slice/indexDashboard.tsx';
import { riesgo_compartido_slice } from '../commons/Dashboard/store/slice/indexMrc.tsx';
import { programacion_pagos_slice } from '../commons/ProgramacionPagos/store/slice/indexProgramacionPago.tsx';

const store = configureStore({
  reducer: {
    talento_humano: talento_humano_slice.reducer,
    dash_board: dash_board_slice.reducer,
    users: users_slice.reducer,
    auditoria_dashboard: auditoria_dashboard_slice.reducer,
    caja_facturacion: caja_facturacion_slice.reducer,
    dashboard: dashboard_slice.reducer,
    riesgo_compartido: riesgo_compartido_slice.reducer,
    programacion_pagos: programacion_pagos_slice.reducer,

  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;