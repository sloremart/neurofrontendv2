
import { toast } from "react-toastify";

import { ToastContent } from "react-toastify";

import CONFIG from "../../../../config/api";

import { AppDispatch } from "../../../../store/store";
import { setAgendamientoSuccess, setDashboardError, setDashboardStart, setFacturacionSuccess, setRecaudoSuccess, setMedicosSuccess, setCitasSuccess } from "../slice/indexDashboard.tsx";
import { getRiesgoError, getRiesgoStart, getRiesgoSuccess } from "../slice/indexMrc.tsx";
import { RiesgoCompartidoResponse } from "../../interfaces/Mrc.ts";

export const control_error = (
  message: ToastContent = "Algo pasó, intente de nuevo"
) =>
  toast.error(message, {
    position: "bottom-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "light",
  });



export const control_success = (message: ToastContent) =>
  toast.success(message, {
    position: "bottom-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "light",
  });
const API_ENDPOINT = CONFIG.API_ENDPOINT;





export const get_facturacion = (fecha_inicio: string, fecha_fin: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      const url = `${API_ENDPOINT}/dashboard/facturacion/?fecha_inicio=${fecha_inicio}&fecha_fin=${fecha_fin}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // ✅ Verificar si hay registros reales en la respuesta
      if (!Array.isArray(data.data) || data.data.length === 0) {
        control_error("No se encontraron registros.");
        return;
      }

      // ✅ Enviar estructura completa { data, total_facturado } al reducer
      dispatch(setFacturacionSuccess(data));

      control_success("Datos cargados exitosamente.");
    } catch (error: any) {
      console.error("Error al obtener los datos:", error.message);
      control_error("Error al obtener los datos, intente de nuevo.");
    }
  };
};






export const get_agenda_diaria = () => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setDashboardStart());

      const url = `${API_ENDPOINT}/dashboard/agendadas`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (
        !data ||
        !Array.isArray(data.servicios) ||
        !Array.isArray(data.entidades)
      ) {
        control_error("La respuesta del servidor no es válida.");
        return;
      }

      dispatch(setAgendamientoSuccess({
        servicios: data.servicios,
        entidades: data.entidades,
        usuarios: data.usuarios,
      }));

      control_success("Datos cargados exitosamente.");
    } catch (error: any) {
      console.error("Error al obtener los datos:", error.message);
      dispatch(setDashboardError(error.message));
      control_error("Error al obtener los datos, intente de nuevo.");
    }
  };
};






export const get_recaudo = (periodo: string,) => {
  return async (dispatch: AppDispatch) => {
    try {
     
      const url = `${API_ENDPOINT}/dashboard/recaudo/?periodo=${periodo}`;

     
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Corregir la validación para usar la estructura correcta de la API
      if (!data.recaudos || !Array.isArray(data.recaudos) || data.recaudos.length === 0) {
        control_error("No se encontraron registros para este periodo.");
        return;
      }
      
      dispatch(setRecaudoSuccess(data.recaudos));

      control_success("Datos cargados exitosamente.");
    } catch (error: any) {
      console.error("Error al obtener los datos:", error.message);
      control_error("Error al obtener los datos, intente de nuevo.");
    }
  };
};




export const get_riesgo_compartido = (fecha_inicio: string, fecha_fin: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(getRiesgoStart());

      const res = await fetch(`${CONFIG.API_ENDPOINT}/dashboard/mrc/?fecha_inicio=${fecha_inicio}&fecha_fin=${fecha_fin}`);
      if (!res.ok) throw new Error("Error en la petición");

      const data: RiesgoCompartidoResponse = await res.json();
      dispatch(getRiesgoSuccess(data.grupos));
    } catch (err: any) {
      dispatch(getRiesgoError(err.message));
    }
  };
};

// Thunk para obtener todos los médicos
export const get_medicos = () => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setDashboardStart());

      const url = `${API_ENDPOINT}/dashboard/medicos/`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data || !Array.isArray(data.medicos)) {
        control_error("La respuesta del servidor no es válida.");
        return;
      }

      dispatch(setMedicosSuccess(data));
      control_success("Médicos cargados exitosamente.");
    } catch (error: any) {
      console.error("Error al obtener los médicos:", error.message);
      dispatch(setDashboardError(error.message));
      control_error("Error al obtener los médicos, intente de nuevo.");
    }
  };
};

// Thunk para obtener citas por médico
export const get_citas_medico = (
  cedula_medico: string,
  fecha?: string,
  fecha_inicio?: string,
  fecha_fin?: string,
  estado: string = 'todas'
) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setDashboardStart());

      // Construir parámetros de la URL
      const params = new URLSearchParams({
        cedula_medico,
        estado,
      });

      if (fecha) {
        params.append('fecha', fecha);
      } else if (fecha_inicio && fecha_fin) {
        params.append('fecha_inicio', fecha_inicio);
        params.append('fecha_fin', fecha_fin);
      }

      const url = `${API_ENDPOINT}/dashboard/citas-medico/?${params.toString()}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data || !Array.isArray(data.citas) || !data.estadisticas) {
        control_error("La respuesta del servidor no es válida.");
        return;
      }

      dispatch(setCitasSuccess(data));
      control_success(`Citas cargadas exitosamente. Total: ${data.estadisticas.total}`);
    } catch (error: any) {
      console.error("Error al obtener las citas:", error.message);
      dispatch(setDashboardError(error.message));
      control_error("Error al obtener las citas, intente de nuevo.");
    }
  };
};