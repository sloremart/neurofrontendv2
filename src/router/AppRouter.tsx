import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { GeDocumental } from '../commons/Gedocumental/Facturacion/GeDocumental.tsx';
import Login from '../commons/Login/Login.tsx';
import RegistroScreen from '../commons/Login/screen/RegistroScreen.tsx';
import { TalentoHumano } from '../commons/Gedocumental/TalentoHumano/screen/TalentoHumano.tsx';
import { Tesoreria } from '../commons/Gedocumental/TalentoHumano/screen/Tesoseria.tsx';
import { TablaRadicacion } from '../commons/Gedocumental/Radicacion/TablaRadicacion.tsx';
import { DashBoardFacturacion } from '../commons/FacturacionDasboard/components/DashboardFacturacion.tsx';
import { Tarifas } from '../commons/FacturacionDasboard/components/Tarifas.tsx';
import { SubdireccionProcesos } from '../commons/Gedocumental/TalentoHumano/screen/Subdireccion.tsx';
import { AuditoriaDashboard } from '../commons/Auditoria/screen/AuditoriaDashboard.tsx';
import { GeDocumentalResultados } from '../commons/Gedocumental/Facturacion/components/GeDocumentalResultados.tsx';
import { CodigosCufe } from '../commons/Gedocumental/Radicacion/CodigosCUFE.tsx';
import { ConsolidadoEstudios } from '../commons/Gedocumental/Facturacion/components/TablaConsolidadoEstudios.tsx';
import GeDocumentalProgramacion from '../commons/Gedocumental/Facturacion/components/GeDocumentalProgramacionPagos.tsx';
import InformeTotalFacturacion from '../commons/Auditoria/screen/InformeTotalFac.tsx';
import FacturacionDashboard from '../commons/Dashboard/components/DashboardFacturacion.tsx';
import DashboardLayout from '../components/DashboardLayout.tsx';
import AgendamientoDashboard from '../commons/Dashboard/components/DashBoardAgendamiento.tsx';
import RecaudoDashboard from '../commons/Dashboard/components/DashboardRecaudo.tsx';
import DashboardMedicos from '../commons/Dashboard/components/DashboardMedicos.tsx';
import { ProtectedRoute } from '../components/ProtectedRoute.tsx';
import NoAutorizado from '../pages/Unauthorized.tsx';
import RevisionCitasFacturas from '../commons/Auditoria/components/OrdenesMedicas.tsx';
import EvaluacionDashboard from '../commons/EvaluacionDesempeño/screens/EvaluacionDashboard.tsx';
// Importar el layout y componentes wrapper para evaluación personal
import EvaluacionPersonalLayout from '../commons/EvaluacionDesempeño/components/EvaluacionPersonalLayout.tsx';
import DashboardPersonalWrapper from '../commons/EvaluacionDesempeño/components/DashboardPersonalWrapper.tsx';
import DashboardLiderWrapper from '../commons/EvaluacionDesempeño/components/DashboardLiderWrapper.tsx';
import Evaluacion360Wrapper from '../commons/EvaluacionDesempeño/components/Evaluacion360Wrapper.tsx';
import EvaluacionEvaluarWrapper from '../commons/EvaluacionDesempeño/components/EvaluacionEvaluarWrapper.tsx';
import EvaluacionActividadesWrapper from '../commons/EvaluacionDesempeño/components/EvaluacionActividadesWrapper.tsx';
import ResponderEvaluacionWrapper from '../commons/EvaluacionDesempeño/components/ResponderEvaluacionWrapper.tsx';
import CajaFacturacion from '../commons/Gedocumental/Facturacion/components/CajaFacturacion.tsx';
import { TablaProveedor } from '../commons/ProgramacionPagos/components/TablaIdRevisor.tsx';



export const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/ge_documental" element={<GeDocumental />} />
      <Route path="/caja_facturacion" element={<CajaFacturacion />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<RegistroScreen />} />
      <Route path="/no-autorizado" element={<NoAutorizado />} />

      <Route element={<ProtectedRoute allowedRoles={["CuentasMedicas", "LiderCuentasMedicas"]} />}>
        <Route path="/talento_humano" element={<TalentoHumano />} />
        <Route path="/radicacion" element={<TablaRadicacion />} />        
        <Route path="/subdireccion_proceso" element={<SubdireccionProcesos />} />

      </Route>

      <Route element={<ProtectedRoute allowedRoles={["LiderCuentasMedicas"]} />}>

        <Route path="/codigo_cufe" element={<CodigosCufe />} />
      </Route>


      <Route element={<ProtectedRoute allowedRoles={["EstudiosSueño", "Asistencial"]} />}>
     
        <Route path="/consolidado_estudios" element={<ConsolidadoEstudios />} />
        <Route path="/ge_documental_resultados" element={<GeDocumentalResultados />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["Contador", "Financiera"]} />}>
        <Route path="/documental_programacion_pagos" element={<GeDocumentalProgramacion />} />
        <Route path="/tesoreria" element={<Tesoreria />} />
        <Route path="/facturas_proveedores" element={<TablaProveedor />} />
      </Route>




      <Route element={<ProtectedRoute allowedRoles={["Administrativo", "AdministrativoGerencia", "Sistemas", "Financiera"]} />}>
        <Route path="/dashboard_facturacion" element={<DashBoardFacturacion />} />
        <Route path="/tarifas" element={<Tarifas />} />
        <Route path="/auditoriadashboard" element={<AuditoriaDashboard />} />
        <Route path="/ordenes_medicas" element={<RevisionCitasFacturas />} />   
        <Route path="/evaluacion_dashboard/*" element={<EvaluacionDashboard />} />   
        <Route element={<DashboardLayout />}>
          <Route path="/informe_fact" element={<InformeTotalFacturacion />} />
          <Route path="/recaudo" element={<RecaudoDashboard />} />
          <Route path="/dashboard_agendamiento" element={<AgendamientoDashboard />} />
          <Route path="/dashboard_medicos" element={<DashboardMedicos />} />
          <Route path="/dashboard" element={<FacturacionDashboard />} />
        </Route>
      </Route>

      {/* Nuevas rutas para evaluación personal - accesibles para todos los usuarios */}
      <Route path="/evaluacion_personal" element={<EvaluacionPersonalLayout />}>
        <Route index element={<DashboardPersonalWrapper />} />
        <Route path="lider" element={<DashboardLiderWrapper />} />
        <Route path="360" element={<Evaluacion360Wrapper />} />
        <Route path="evaluar" element={<EvaluacionEvaluarWrapper />} />

        <Route path="360/evaluar/:asignacionId" element={<ResponderEvaluacionWrapper />} />
        <Route path="actividades" element={<EvaluacionActividadesWrapper />} />
      </Route>


    </Routes>
  );
};

 