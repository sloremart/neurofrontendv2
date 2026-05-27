import CONFIG from "../../../../config/api";
import { toast } from "react-toastify";
import { Dispatch } from "react";
import { ToastContent } from "react-toastify";
import { set_agendamiento, set_factura, set_subcentro, set_tarifas } from "../slice/indexDashBoardfacturacion.tsx";
import { IObjTarifas } from "../../interfaces/DashBoardFacturacion.ts";

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

export const get_facturas = (fecha: string): any => {
  return async (dispatch: Dispatch<any>) => {
    try {
      const url = `${API_ENDPOINT}/facturacion/?Fecha=${fecha}`;
      const response = await fetch(url);
      const data = await response.json();

      console.log("Estado de la respuesta:", response.status);
      console.log("Datos recibidos:", data);

      // Verificar si hay datos en la respuesta
      if (data && data.length > 0) {
        dispatch(set_factura(data));
        control_success("Consulta exitosa de facturas");
      } else {
        console.log("No hay datos disponibles.");
        control_error("No hay datos disponibles para mostrar");
      }

      return data;
    } catch (error) {
      console.error("Error al obtener las citas:", error);
      return error;
    }
  };
};

export const get_agendamiento = (
  fecha_inicio: string,
  fecha_fin: string
): any => {
  return async (dispatch: Dispatch<any>) => {
    try {
      const url = `${API_ENDPOINT}/consolidado_especialidad/?fecha_inicio=${fecha_inicio}&fecha_fin=${fecha_fin}`;
      const response = await fetch(url);
      const data = await response.json();

      console.log("Estado de la respuesta:", response.status);
      console.log("Datos recibidos:", data);

      // Verificar si hay datos en la respuesta
      if (data && Object.keys(data).length > 0) {
        dispatch(set_agendamiento(data));
        console.log(set_agendamiento(data));
        control_success("Consulta exitosa");
      } else {
        console.log("No hay datos disponibles.");
        control_error("No hay datos disponibles para mostrar");
      }
      return data;
    } catch (error) {
      console.error("Error al obtener las citas:", error);
      return error;
    }
  };
};


export const get_contrato_tarifa = (): any => {
  return async (dispatch: Dispatch<any>) => {
    try {
      const url = `${API_ENDPOINT}/lista_contrato_tarifa/`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();

      console.log("Estado de la respuesta:", response.status); 
      console.log("Datos recibidos:", data); 

      return data;
    } catch (error) {
      console.error("Error al obtener los códigos:", error);
      throw new Error('Error al obtener los códigos');
    }
  };
};



export const get_agendamiento_subcentro = (
  fecha_inicio: string,
  fecha_fin: string
): any => {
  return async (dispatch: Dispatch<any>) => {
    try {
      const url = `${API_ENDPOINT}/consolidado_subcentro/?fecha_inicio=${fecha_inicio}&fecha_fin=${fecha_fin}`;
      const response = await fetch(url);
      const data = await response.json();

      console.log("Estado de la respuesta:", response.status);
      console.log("Datos recibidos:", data);

      // Verificar si hay datos en la respuesta
      if (data && Object.keys(data).length > 0) {
        dispatch(set_subcentro(data));
        console.log(set_subcentro(data));
        control_success("Consulta exitosa");
      } else {
        console.log("No hay datos disponibles.");
        control_error("No hay datos disponibles para mostrar");
      }
      return data;
    } catch (error) {
      console.error("Error al obtener las citas:", error);
      return error;
    }
  };
};


export const get_tarifas = (tarifa: string | number): any => {
  return async (dispatch: Dispatch<any>) => {
    try {
      const url = `${API_ENDPOINT}/tarifas_contratos/${tarifa}`;
      const response = await fetch(url);
      const data: IObjTarifas[] = await response.json();

      console.log("Estado de la respuesta:", response.status);
      console.log("Datos recibidos:", data);

      // Verificar si hay datos en la respuesta
      if (data && data.length > 0) {
        dispatch(set_tarifas(data));
        control_success("Consulta exitosa");
      } else {
        console.log("No hay datos disponibles.");
        control_error("No hay datos disponibles para mostrar");
      }
    } catch (error) {
      console.error("Error al obtener las tarifas:", error);
      control_error("Error al obtener las tarifas");
    }
  };
};