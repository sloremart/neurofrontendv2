
import { toast } from "react-toastify";
import { Dispatch } from "react";
import { ToastContent } from "react-toastify";
import { createAsyncThunk } from "@reduxjs/toolkit";
import CONFIG from "../../../../config/api";
import { set_ciclos_pagos, set_cuentas, set_cuentas_nits, set_egresos, set_facturas_programacion_pagos, set_gestion_pagos, update_factura_revision_financiera, set_archivos } from "../slice/indexProgramacionPago.tsx";
import { AppDispatch } from "../../../../store/store";


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


export const get_facturas = (
  cuenta?: string,
  nit?: string,
  fecha_inicial?: string
) => {
  return async (dispatch: AppDispatch) => {
    try {
      let url = `${API_ENDPOINT}/programacionpagos/facturas/`;

      // Construcción de la URL con parámetros opcionales
      const queryParams = new URLSearchParams();
      if (cuenta) queryParams.append("cuenta", cuenta);
      if (nit) queryParams.append("nit", nit);
      if (fecha_inicial) queryParams.append("fecha_inicial", fecha_inicial);

      // Si existen parámetros, se agregan a la URL
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data || data.length === 0) {
        control_error("No se encontraron registros de facturas.");
        return;
      }

      // Guardar directamente los datos en Redux
      dispatch(set_facturas_programacion_pagos(data));

      control_success("Facturas cargadas exitosamente.");
    } catch (error: any) {
      console.error("Error al obtener facturas:", error.message);
      control_error("Error al obtener facturas, intente de nuevo.");
    }
  };
};




export const get_cuentas = (): any => {
  return async (dispatch: Dispatch<any>) => {
    try {
      const url = `${API_ENDPOINT}/programacionpagos/lista_cuentas`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data || data.length === 0) {
        control_error("No se encontraron registros de facturas.");
        return;
      }
  
      // Guardar directamente los datos en Redux
      dispatch(set_cuentas(data));

      console.log("Estado de la respuesta:", response.status);
      console.log("Datos recibidos:", data);

      return data;
    } catch (error) {
      console.error("Error al obtener los códigos:", error);
      throw new Error("Error al obtener los códigos");
    }
  };
};


export const get_nits = (searchValue = '') => async (dispatch) => {
  try {
    const url = `${API_ENDPOINT}/programacionpagos/lista_nits?search=${searchValue}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      console.warn("No se encontraron registros de NITs.");
      dispatch(set_cuentas_nits([])); 
      return;
    }

    dispatch(set_cuentas_nits(data));
  } catch (error) {
    console.error("Error al obtener los códigos:", error);
    throw new Error("Error al obtener los códigos");
  }
};



export const factura_pagos = (facturaData: any) => {
  return async (dispatch: AppDispatch) => {
    try {
      const url = `${API_ENDPOINT}/programacionpagos/consolidado_facturas_pagos/`; 
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(facturaData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data || data.length === 0) {
        control_error("No se encontraron registros de facturas.");
        return;
      }

      control_success("Factura creada exitosamente.");
      return data;
    } catch (error: any) {
      console.error("Error al crear la factura:", error.message);
      control_error(error.message);
    }
  };
};


export const get_facturas_por_prioridad_y_fechas = (
  prioridad: string | null,
  fechaInicio: string,
  fechaFin: string
) => {
  return async (dispatch: AppDispatch) => {
    try {
      // Construcción dinámica de la URL
      let url = `${API_ENDPOINT}/programacionpagos/obtener_ciclo_pagos?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;

      // Si se proporciona prioridad, se agrega a la URL
      if (prioridad) {
        url += `&prioridad=${prioridad}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!Array.isArray(data.data)) {
        console.warn("⚠️ Respuesta del servidor no es un array:", data);
        return;
      }

      // ✅ Guardamos los datos en Redux
      dispatch(set_ciclos_pagos(data.data));

      control_success(
        prioridad
          ? `Facturas de prioridad ${prioridad} en el rango ${fechaInicio} - ${fechaFin} cargadas.`
          : `Todas las facturas en el rango ${fechaInicio} - ${fechaFin} cargadas.`
      );
    } catch (error: any) {
      console.error("Error al obtener facturas por prioridad y fechas:", error.message);
      control_error("Error al obtener facturas, intente de nuevo.");
    }
  };
};

export const actualizar_revision_financiera = (facturaId: number, revisionFinanciera: boolean) => {
  return async (dispatch: AppDispatch) => {
    try {
      // Construcción de la URL
      const url = `${API_ENDPOINT}/programacionpagos/factura/revision_financiera/${facturaId}/`;

    
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ RevisionFinanciera: revisionFinanciera }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      dispatch(update_factura_revision_financiera({ facturaId, revisionFinanciera }));


  
      control_success(`Factura ${facturaId} marcada como ${revisionFinanciera ? "Aprobada" : "No Aprobada"}.`);
    } catch (error: any) {
      console.error("Error al actualizar la revisión financiera:", error.message);
      control_error("Error al actualizar la revisión financiera, intente de nuevo.");
    }
  };
};



export const get_facturas_aprobadas_financieramente = (fecha_inicio: string, fecha_final: string) => {
  return async (dispatch: AppDispatch) => {
    try {
     
      const url = `${API_ENDPOINT}/programacionpagos/facturas_aprobadas_financieramente/?fecha_inicio=${fecha_inicio}&fecha_final=${fecha_final}`;

     
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

      if (!Array.isArray(data) || data.length === 0) {
        control_error("No se encontraron registros de facturas aprobadas.");
        return;
      }

      dispatch(set_gestion_pagos(data));

      control_success("Facturas aprobadas cargadas exitosamente.");
    } catch (error: any) {
      console.error("Error al obtener facturas aprobadas financieramente:", error.message);
      control_error("Error al obtener facturas aprobadas, intente de nuevo.");
    }
  };
};


export const pago_tesoreria = (facturaId: number, pagoTesoreria: boolean) => {
  return async (dispatch: AppDispatch) => {
    try {
      // Construcción de la URL
      const url = `${API_ENDPOINT}/programacionpagos/pago_tesoreria/${facturaId}/`;

      // Envío de la solicitud PUT
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ PagoTesoreria: pagoTesoreria }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }


  
      control_success(`Factura ${facturaId} marcada como ${pagoTesoreria ? "Aprobada" : "No Aprobada"}.`);
    } catch (error: any) {
      console.error("Error al actualizar la revisión financiera:", error.message);
      control_error("Error al actualizar la revisión financiera, intente de nuevo.");
    }
  };
};


export const obtener_egreso = (Documento: number) => {
  return async (dispatch: AppDispatch) => {
    try {
      const url = `${API_ENDPOINT}/programacionpagos/obtener_egreso/${Documento}/`;

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

    
      dispatch(set_egresos(data.data));

    } catch (error: any) {
      console.error("Error al actualizar la revisión financiera:", error.message);
      control_error("Error al actualizar la revisión financiera, intente de nuevo.");
    }
  };
};



export const subir_facturas_proveedor = (
  nit: string,
  archivos: File[],
  tipoDocumentos: string,
  userId: string,
  IdRevisor?: string,
  tipoHallazgo?: string,
  IdRevisorTesoreria?: string ,
  IdRevisorCuentasMedicas?: string 
) => {
  return async (dispatch: AppDispatch) => {
    try {
      // 🔍 DEBUG: Verificar qué parámetros llegan al thunk
      console.log(" DEBUG - Parámetros recibidos en thunk:");
      console.log("IdRevisor:", IdRevisor, "tipo:", typeof IdRevisor);
      console.log("IdRevisorTesoreria:", IdRevisorTesoreria, "tipo:", typeof IdRevisorTesoreria);
      console.log("IdRevisorCuentasMedicas:", IdRevisorCuentasMedicas, "tipo:", typeof IdRevisorCuentasMedicas);

      const nitLimpio = nit.replace(/\./g, "");

      const url = `${API_ENDPOINT}/programacionpagos/factura_proveedor/upload/${nitLimpio}/`;

      const formData = new FormData();
      archivos.forEach((file) => {
        formData.append("files", file); 
      });

      formData.append("tipoDocumentos", tipoDocumentos);
      formData.append("userId", userId);
      if (IdRevisor !== undefined) {formData.append("IdRevisor", IdRevisor);}
      if (IdRevisorTesoreria  !== undefined) formData.append("IdRevisorTesoreria", IdRevisorTesoreria);
      if (IdRevisorCuentasMedicas  !== undefined) formData.append("IdRevisorCuentasMedicas", IdRevisorCuentasMedicas);
      if (tipoHallazgo !== undefined) { formData.append("TipoHallazgo", tipoHallazgo);}

      // 🔍 DEBUG: Verificar qué se está enviando en FormData
      console.log("🔍 DEBUG - FormData que se envía:");
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Error al subir archivos.");
      }

      control_success(result.detail || "Factura(s) subida(s) correctamente.");

      return result.data;
    } catch (error: any) {
      console.error("❌ Error al subir facturas del proveedor:", error.message);
      control_error(error.message || "No se pudo subir la factura.");
    }
  };
};




export const get_factura_pendiente_revisor = createAsyncThunk(
  "programacionPagos/getFacturaPendienteRevisor",
  async (id: string, thunkAPI) => {
    try {
      const url = `${API_ENDPOINT}/programacionpagos/facturas_revisor/${id}/`;
      const response = await fetch(url);
      const data = await response.json();

      console.log("Estado de la respuesta:", response.status);
      console.log("Datos recibidos:", data);
      
      if (data && data.success) {
        // El backend ahora devuelve { pendientes: [], historicas: [] }
        const todasLasFacturas = [
          ...(data.data.pendientes || []),
          ...(data.data.historicas || [])
        ];
        
        if (todasLasFacturas.length > 0) {
          thunkAPI.dispatch(set_archivos(todasLasFacturas));
          control_success("Facturas del revisor obtenidas correctamente");
        } else {
          console.log("No hay datos disponibles.");
          control_error("No hay datos disponibles para mostrar");
        }
      } else {
        console.log("Respuesta no exitosa del backend");
        control_error("Error al obtener las facturas del revisor");
      }

      return data;
    } catch (error) {
      console.error("Error al obtener las facturas del revisor:", error);
      return thunkAPI.rejectWithValue(error);
    }
  }
);

interface RevisarFacturaPayload {
  idArchivo: number;
  aprobado: boolean;
  usuarioId: number;
  descripcion?: string;
}

export const revisar_factura_proveedor = createAsyncThunk(
  "programacionPagos/revisarFacturaProveedor",
  async ({ idArchivo, aprobado, usuarioId, descripcion = "" }: RevisarFacturaPayload, thunkAPI) => {
    try {
      const url = `${API_ENDPOINT}/programacionpagos/aprobacion_revisor/${idArchivo}/`;

      const body = {
        aprobado,
        usuario_id: usuarioId,
        descripcion: descripcion.trim(),
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error al revisar factura.");
      }

      control_success(result.message || "Revisión completada correctamente.");
      return result;

    } catch (error: any) {
      control_error(error.message || "No se pudo procesar la revisión.");
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);




interface FiltrosUsuarioFacturas {
  idUsuario: number;
  fechaInicio?: string;
  fechaFin?: string;
  estado?: "aprobada" | "rechazada" | "pendiente";
  numeroAdmision?: string;
}

export const get_facturas_usuario_filtrado = (filtros: FiltrosUsuarioFacturas) => {
  return async (dispatch: AppDispatch) => {
    try {
      const { idUsuario, fechaInicio, fechaFin, estado, numeroAdmision } = filtros;

      let url = `${API_ENDPOINT}/programacionpagos/facturas_usuario/${idUsuario}/`;

      const queryParams = new URLSearchParams();
      if (fechaInicio) queryParams.append("fecha_inicio", fechaInicio);
      if (fechaFin) queryParams.append("fecha_fin", fechaFin);
      if (estado) queryParams.append("estado", estado);
      if (numeroAdmision) queryParams.append("numero_admision", numeroAdmision);

      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success || !Array.isArray(result.data)) {
        control_error("No se encontraron facturas.");
        return;
      }

 
      const adaptado = result.data.map((item: any) => ({
        ...item.factura,
        estado: item.estado,
        observacionesTexto: item.observaciones?.map((o: any) => o.Descripcion).join("; ") || "Sin observaciones",
      }));

      dispatch(set_archivos(adaptado));

      control_success("Facturas filtradas cargadas correctamente.");
      return adaptado;

    } catch (error: any) {
      console.error("❌ Error al obtener facturas del usuario:", error.message);
      control_error(error.message || "No se pudo obtener la información.");
    }
  };
};



interface ActualizarEgresoPayload {
  idArchivo: number;
  numeroDocumento: string;
}

export const actualizar_numero_egreso = createAsyncThunk(
  "programacionPagos/actualizarNumeroEgreso",
  async ({ idArchivo, numeroDocumento }: ActualizarEgresoPayload, thunkAPI) => {
    try {
      const url = `${API_ENDPOINT}/programacionpagos/actualizar_egreso/${idArchivo}/`;

      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ numero_documento: numeroDocumento }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Error al actualizar el número de egreso.");
      }

      control_success(result.detail || "Número de egreso actualizado correctamente.");
      return result;

    } catch (error: any) {
      control_error(error.message || "No se pudo actualizar el número de egreso.");
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);



export const eliminar_factura_proveedor = (archivoId: number) => {
  return async (dispatch: AppDispatch) => {
    try {
      const url = `${API_ENDPOINT}/programacionpagos/eliminar_archivo/${archivoId}/`;

      const response = await fetch(url, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Error al eliminar el archivo.");
      }

      control_success(result.detail || "Archivo eliminado correctamente.");

      // Podrías agregar aquí un dispatch para refrescar datos si es necesario
      // dispatch(get_facturas(...)); por ejemplo

      return archivoId;
    } catch (error: any) {
      console.error("❌ Error al eliminar factura del proveedor:", error.message);
      control_error(error.message || "No se pudo eliminar la factura.");
    }
  };
};