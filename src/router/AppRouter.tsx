import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Layout
import SidebarLayout from '../components/SidebarLayout.tsx';
import { ProtectedRoute } from '../components/ProtectedRoute.tsx';

// Auth
import Login from '../commons/Login/Login.tsx';
import NoAutorizado from '../pages/Unauthorized.tsx';

// Gedocumental
import { GeDocumental } from '../commons/Gedocumental/Facturacion/GeDocumental.tsx';
import { TalentoHumano } from '../commons/Gedocumental/TalentoHumano/screen/TalentoHumano.tsx';
import { Tesoreria } from '../commons/Gedocumental/TalentoHumano/screen/Tesoseria.tsx';
import { TablaRadicacion } from '../commons/Gedocumental/Radicacion/TablaRadicacion.tsx';
import { CodigosCufe } from '../commons/Gedocumental/Radicacion/CodigosCUFE.tsx';
import { GeDocumentalResultados } from '../commons/Gedocumental/Facturacion/components/GeDocumentalResultados.tsx';
import GeDocumentalProgramacion from '../commons/Gedocumental/Facturacion/components/GeDocumentalProgramacionPagos.tsx';
import { TablaProveedor } from '../commons/ProgramacionPagos/components/TablaIdRevisor.tsx';
import CargaAutorizaciones from '../commons/Autorizaciones/CargaAutorizaciones.tsx';
import { CajaFacturacion } from '../commons/Gedocumental/Facturacion/components/CajaFacturacion.tsx';

// Dashboard
import { DashBoardFacturacion } from '../commons/FacturacionDasboard/components/DashboardFacturacion.tsx';
import FacturacionDashboard from '../commons/Dashboard/components/DashboardFacturacion.tsx';
import AgendamientoDashboard from '../commons/Dashboard/components/DashBoardAgendamiento.tsx';
import RecaudoDashboard from '../commons/Dashboard/components/DashboardRecaudo.tsx';
import DashboardMedicos from '../commons/Dashboard/components/DashboardMedicos.tsx';
import DashboardProduccion from '../commons/Dashboard/components/DashboardProduccion.tsx';
import DashboardResultados from '../commons/Dashboard/components/DashboardResultados.tsx';
import InformeTotalFacturacion from '../commons/Auditoria/screen/InformeTotalFac.tsx';

// Evaluación
import EvaluacionDashboard from '../commons/EvaluacionDesempeño/screens/EvaluacionDashboard.tsx';
import EvaluacionPersonalLayout from '../commons/EvaluacionDesempeño/components/EvaluacionPersonalLayout.tsx';
import DashboardPersonalWrapper from '../commons/EvaluacionDesempeño/components/DashboardPersonalWrapper.tsx';
import DashboardLiderWrapper from '../commons/EvaluacionDesempeño/components/DashboardLiderWrapper.tsx';
import Evaluacion360Wrapper from '../commons/EvaluacionDesempeño/components/Evaluacion360Wrapper.tsx';
import EvaluacionEvaluarWrapper from '../commons/EvaluacionDesempeño/components/EvaluacionEvaluarWrapper.tsx';
import EvaluacionActividadesWrapper from '../commons/EvaluacionDesempeño/components/EvaluacionActividadesWrapper.tsx';
import ResponderEvaluacionWrapper from '../commons/EvaluacionDesempeño/components/ResponderEvaluacionWrapper.tsx';

const ADMIN_ROLES  = ['Administrativo', 'AdministrativoGerencia', 'Sistemas', 'Financiera'];
const CM_ROLES     = ['CuentasMedicas', 'LiderCuentasMedicas'];
const CONT_ROLES   = ['Contador', 'Financiera'];
const EST_ROLES    = ['EstudiosSueño', 'Asistencial'];
const AUTH_ROLES   = [...CM_ROLES, 'Administrativo', 'AdministrativoGerencia', 'Sistemas'];

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Rutas públicas — sin sidebar */}
      <Route path="/login"    element={<Login />} />
      <Route path="/no-autorizado" element={<NoAutorizado />} />

      {/* Todas las rutas autenticadas envueltas en SidebarLayout */}
      <Route element={<SidebarLayout />}>

        {/* Acceso general (cualquier usuario autenticado) */}
        <Route path="/ge_documental"   element={<GeDocumental />} />

        {/* Cuentas Médicas */}
        <Route element={<ProtectedRoute allowedRoles={CM_ROLES} />}>
          <Route path="/cuentas_medicas"      element={<TalentoHumano />} />
          <Route path="/radicacion"          element={<TablaRadicacion />} />
        </Route>

        {/* Solo Líder CM */}
        <Route element={<ProtectedRoute allowedRoles={['LiderCuentasMedicas']} />}>
          <Route path="/codigo_cufe" element={<CodigosCufe />} />
        </Route>

        {/* Estudios / Asistencial */}
        <Route element={<ProtectedRoute allowedRoles={EST_ROLES} />}>
          <Route path="/ge_documental_resultados" element={<GeDocumentalResultados />} />
        </Route>

        {/* Contador / Financiera */}
        <Route element={<ProtectedRoute allowedRoles={CONT_ROLES} />}>
          <Route path="/documental_programacion_pagos" element={<GeDocumentalProgramacion />} />
          <Route path="/tesoreria"                     element={<Tesoreria />} />
        </Route>

        {/* Facturador */}
        <Route element={<ProtectedRoute allowedRoles={['Facturador']} />}>
          <Route path="/caja_facturacion" element={<CajaFacturacion />} />
        </Route>

        {/* Contador / Financiera / Gerencia */}
        <Route element={<ProtectedRoute allowedRoles={[...CONT_ROLES, 'AdministrativoGerencia']} />}>
          <Route path="/facturas_proveedores" element={<TablaProveedor />} />
        </Route>

        {/* Autorizaciones */}
        <Route element={<ProtectedRoute allowedRoles={AUTH_ROLES} />}>
          <Route path="/carga_autorizaciones" element={<CargaAutorizaciones />} />
        </Route>

        {/* Dashboard / Administrativo */}
        <Route element={<ProtectedRoute allowedRoles={ADMIN_ROLES} />}>
          <Route path="/dashboard_facturacion" element={<DashBoardFacturacion />} />
          <Route path="/dashboard"             element={<FacturacionDashboard />} />
          <Route path="/dashboard_agendamiento" element={<AgendamientoDashboard />} />
          <Route path="/recaudo"               element={<RecaudoDashboard />} />
          <Route path="/dashboard_medicos"     element={<DashboardMedicos />} />
          <Route path="/dashboard_produccion"  element={<DashboardProduccion />} />
          <Route path="/dashboard_resultados"  element={<DashboardResultados />} />
          <Route path="/informe_fact"          element={<InformeTotalFacturacion />} />
          <Route path="/evaluacion_dashboard/*" element={<EvaluacionDashboard />} />
        </Route>

        {/* Evaluación personal — todos */}
        <Route path="/evaluacion_personal" element={<EvaluacionPersonalLayout />}>
          <Route index element={<DashboardPersonalWrapper />} />
          <Route path="lider"   element={<DashboardLiderWrapper />} />
          <Route path="360"     element={<Evaluacion360Wrapper />} />
          <Route path="evaluar" element={<EvaluacionEvaluarWrapper />} />
          <Route path="360/evaluar/:asignacionId" element={<ResponderEvaluacionWrapper />} />
          <Route path="actividades" element={<EvaluacionActividadesWrapper />} />
        </Route>

      </Route>
    </Routes>
  );
};
