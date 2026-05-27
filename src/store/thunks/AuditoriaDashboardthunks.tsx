import { toast, ToastContent } from "react-toastify";
import CONFIG from "../../../../config/api";
import { Dispatch } from "react";
import { set_admisiones_facturador } from "../slice/indexAuditoriaDashBoard.tsx";


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
  

  export const get_admisiones_facturador = (
    user_ids: number[],
    FechaInicio: string,
    FechaFin: string
  ): any => {
    return async (dispatch: Dispatch<any>) => {
      try {
        // Construir la URL con múltiples parámetros usuario_ids
        const usuario_ids_query = user_ids.map(id => `usuario_ids=${id}`).join('&');
        const url = `${API_ENDPOINT}/admisiones_auditoria_subprocesos/?${usuario_ids_query}&fecha_inicio=${FechaInicio}&fecha_fin=${FechaFin}`;
  
        const response = await fetch(url);
        const data = await response.json();
  
        console.log("Estado de la respuesta:", response.status);
        console.log("Datos recibidos:", data);
  
        // Verificar si hay datos en la respuesta
        if (data && Object.keys(data).length > 0) {
          dispatch(set_admisiones_facturador(data)); // Ajustar la respuesta para extraer los datos correctamente
          control_success("Consulta exitosa de admisiones por facturador");
        } else {
          console.log("No hay datos disponibles.");
          // Mostrar notificación de advertencia si no hay datos
          control_error("No hay datos disponibles para mostrar");
        }
  
        return data;
      } catch (error) {
        console.error("Error al obtener las admisiones:", error);
        control_error("Error al obtener las admisiones");
        return error;
      }
    };
  };


  export const fetch_facturas = (
    nit: string,
    periodo?: string,
    sinLimite: boolean = false
): any => {
    return async (dispatch: Dispatch<any>) => {
        try {
            // 📌 Construir la URL con parámetros dinámicos
            let url = `${API_ENDPOINT}/programacionpagos/informe/?nit=${nit}`;
            if (periodo) {
                url += `&periodo=${periodo}`;
            }
            if (sinLimite) {
                url += `&sin_limite=1`;
            }

            console.log("📌 URL de la consulta:", url); // Debug

            const response = await fetch(url);
            const data = await response.json();

            console.log("📌 Estado de la respuesta:", response.status);
            console.log("📌 Datos recibidos:", data);

            if (Array.isArray(data) && data.length > 0) {
                control_success("Consulta exitosa de facturas");
            } else {
                console.log("⚠️ No hay datos disponibles.");
                control_error("No hay datos disponibles para mostrar");
            }

            return data;
        } catch (error) {
            console.error("❌ Error al obtener las facturas:", error);
            control_error("Error al obtener las facturas");
            return [];
        }
    };
};



export const fetch_consolidado_facturas = (
  codigos: string[] = [],
  anio?: number,
  mes?: number
): any => {
  return async (dispatch: Dispatch<any>) => {
    try {
      let url = `${API_ENDPOINT}/dashboard/consolidado_entidades/`;

      const params = new URLSearchParams();
      codigos.forEach(codigo => params.append('codigo_entidad', codigo));
      if (anio) params.append('anio', anio.toString());
      if (mes) params.append('mes', mes.toString());

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      console.log("📌 Consultando:", url);
      const res = await fetch(url);
      const data = await res.json();

      return data;
    } catch (error) {
      console.error("❌ Error al consultar consolidado:", error);
      control_error("Error al consultar consolidado");
      return [];
    }
  };
};


export const fetch_estado_cartera = (): any => {
  return async (dispatch: Dispatch<any>) => {
    try {
      const res = await fetch(`${API_ENDPOINT}/dashboard/consolidado_cartera/`);
      const data = await res.json();
      return data;
    } catch (err) {
      console.error("❌ Error al obtener el estado de cartera:", err);
      control_error("Error al consultar el estado de cartera");
      return {};
    }
  };
};