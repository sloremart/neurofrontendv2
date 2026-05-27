import CONFIG from "../../../../../config/api.js";
import { toast } from "react-toastify";
import { Dispatch } from "react";
import { ToastContent } from "react-toastify";
import {
  set_admision_pendiente,
  set_consolidado_estudios,
  set_estudios_medico_asignado,
  set_hallazgos,
  set_profesionales,
  set_talento_humano,
} from "../slice/indexTalentoHumano.tsx";
import { Hallazgo, Observacion } from "../../interfaces/TalentoHumano.ts";
import { AppDispatch, RootState } from "../../../../../store/store.ts";
import { ThunkAction, } from "@reduxjs/toolkit";

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

export const consultarArchivos = async (
  consecutivoConsulta: number | string,
  setArchivosPDF: (archivos: any[]) => void,
  setMostrarBotonObservacion: (show: boolean) => void,
  setObservaciones: (observaciones: Observacion[]) => void
) => {
  try {
    const response = await fetch(
      `${API_ENDPOINT}/gedocumental/archivos-por-admision/${consecutivoConsulta}/`
    );

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const responseData = await response.json();

    if (!responseData.data || responseData.data.archivos.length === 0) {
      toast.warn("La consulta no devolvió archivos", { autoClose: 3000 });
      return null;
    } else {
      const archivosConEditores = responseData.data.archivos.map((item: any) => ({
        ...item,
        EditorVisible: false,
      }));
      setArchivosPDF(archivosConEditores);
      setMostrarBotonObservacion(responseData.data.archivos.length > 0);

      if (responseData.data.observaciones) {
        setObservaciones(responseData.data.observaciones);
      }

      toast.success("Consulta de archivos exitosa", { autoClose: 3000 });
      return archivosConEditores;
    }
  } catch (error: any) {
    console.error("Error al consultar archivos:", error instanceof Error ? error.message : error);
    toast.error("Error al consultar archivos", { autoClose: 3000 });
    return null;
  }
};
export const get_admisiones_cuentas_medicas = (

  FechaInicio: string,
  FechaFin: string,
  revisionCuentasMedicas: number,
  codigoEntidad?: string, // Opcional
  user_id?: number,        // Opcional
): any => {
  return async (dispatch: Dispatch<any>) => {
    try {
      const url = `${API_ENDPOINT}/filtro_auditoria/?FechaInicio=${FechaInicio}&FechaFin=${FechaFin}&RevisionCuentasMedicas=${revisionCuentasMedicas}
      ${codigoEntidad ? `&CodigoEntidad=${codigoEntidad}` : ""} 
      ${user_id ? `&user_id=${user_id}` : ""}`; // Agregar user_id solo si está presente

      const response = await fetch(url);
      const data = await response.json();

      console.log("Estado de la respuesta:", response.status);
      console.log("Datos recibidos:", data);

      // Verificar si hay datos en la respuesta
      if (data && data.length > 0) {
        dispatch(set_talento_humano(data));
        control_success("Consulta exitosa de admisiones cuentas medicas");
      } else {
        console.log("No hay datos disponibles.");
        // Mostrar notificación de advertencia si no hay datos
        control_error("No hay datos disponibles para mostrar");
      }

      return data;
    } catch (error: any) {
      console.error("Error al obtener las citas:", error);
      return error;
    }
  };
};


export const get_codigos = (): any => {
  return async (dispatch: Dispatch<any>) => {
    try {
      const url = `${API_ENDPOINT}/gedocumental/lista-codigo-entidad/`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      console.log("Estado de la respuesta:", response.status);
      console.log("Datos recibidos:", data);

      return data;
    } catch (error: any) {
      console.error("Error al obtener los códigos:", error);
      throw new Error("Error al obtener los códigos");
    }
  };
};



/// admsiones pendientes por usuario CUENTAS MEDICAS////
export const get_admision_pendiente = (id: string): any => {
  return async (dispatch: Dispatch<any>) => {
    try {
      const url = `${API_ENDPOINT}/gedocumental/archivos-por-usuario/${id}/`;
      const response = await fetch(url);
      const data = await response.json();

      console.log("Estado de la respuesta:", response.status);
      console.log("Datos recibidos:", data);
      if (data && data.data && data.data.length > 0) {
        dispatch(set_admision_pendiente(data.data));
        control_success(
          "Admisiones con observaciones encontradas para el usuario"
        );
      } else {
        console.log("No hay datos disponibles.");
        control_error("No hay datos disponibles para mostrar");
      }

      return data;
    } catch (error: any) {
      console.error("Error al obtener las citas:", error);
      return error;
    }
  };
};
// ADMISIONES PENDIENTES TESORERIA
export const get_admision_pendiente_tesoreria = (id: string): any => {
  return async (dispatch: Dispatch<any>) => {
    try {
      const url = `${API_ENDPOINT}/gedocumental/archivos-por-usuario-tesoreria/${id}/`;
      const response = await fetch(url);
      const data = await response.json();

      console.log("Estado de la respuesta:", response.status);
      console.log("Datos recibidos:", data);
      if (data && data.data && data.data.length > 0) {
        dispatch(set_admision_pendiente(data.data));
        control_success(
          "Admisiones con observaciones encontradas para el usuario"
        );
      } else {
        console.log("No hay datos disponibles.");
        control_error("No hay datos disponibles para mostrar");
      }

      return data;
    } catch (error: any) {
      console.error("Error al obtener las citas:", error);
      return error;
    }
  };
};

export const get_admisiones_tesoreria = (
  user_id: number,
  FechaCreacionAntares: string,
  codigoEntidad: string,
  revisionTesoreria?: number
): any => {
  return async (dispatch: Dispatch<any>) => {
    try {
      const url = `${API_ENDPOINT}/filtro_tesoreria/?user_id=${user_id}&FechaCreacionAntares=${FechaCreacionAntares}&RevisionTesoreria=${revisionTesoreria}${codigoEntidad ? `&CodigoEntidad=${codigoEntidad}` : ""
        }`;
      const response = await fetch(url);
      const data = await response.json();

      console.log("Estado de la respuesta:", response.status);
      console.log("Datos recibidos:", data);

      // Verificar si hay datos en la respuesta
      if (data && data.length > 0) {
        dispatch(set_talento_humano(data));
        control_success("Consulta exitosa de admisiones cuentas medicas");
      } else {
        console.log("No hay datos disponibles.");
        control_error("No hay datos disponibles para mostrar");
      }

      return data;
    } catch (error: any) {
      console.error("Error al obtener las citas:", error);
      return error;
    }
  };
};

export const get_admisiones_radicar = (
  codigoEntidad: string,
  fechaInicio: string,
  fechaFin: string
): any => {
  return async (dispatch: Dispatch<any>) => {
    try {
      const url = `${API_ENDPOINT}/gedocumental/admisiones-radicar/?ContratoId=${codigoEntidad}&FechaInicio=${fechaInicio}&FechaFin=${fechaFin}`;
      const response = await fetch(url);
      const data = await response.json();

      console.log("Estado de la respuesta:", response.status);
      console.log("Datos recibidos:", data);

      if (response.ok) {
        if (data && data.length > 0) {
          dispatch(set_talento_humano(data));
          control_success("Consulta exitosa de admisiones cuentas medicas");
          return { success: true };
        } else {
          console.log("No hay datos disponibles.");
          control_error("No hay datos disponibles para mostrar");
          return { success: false, detail: "No hay datos disponibles para mostrar" };
        }
      } else {
        // Manejar errores específicos devueltos por el backend
        console.error("Error del backend:", data.detail);
        control_error(`Error: ${data.detail}`);
        return { success: false, detail: data.detail };
      }
    } catch (error: any) {
      console.error("Error al obtener las citas:", error);
      control_error("Error en la consulta de admisiones");
      return { success: false, detail: "Error en la consulta de admisiones" };
    }
  };
};

export const renombrar_compensar = (admisionId: number, idusuario: string) => {
  return async (dispatch: Dispatch<any>) => {
    try {
      const url = `${API_ENDPOINT}/gedocumental/radicar-compensar/${admisionId}/${idusuario}/`;
      const response = await fetch(url);

      // Manejar la respuesta que no es OK
      if (!response.ok) {
        const errorData = await response.json();
        console.log("Detalle del error:", errorData.detail);
        control_error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }

      // Procesar la respuesta exitosa
      const data = await response.json();
      if (data && data.success === true) {
        control_success("Creación de archivos de manera exitosa!");
      } else {
        console.log("Detalle del error:", data.detail);
        control_error(data.detail || "No hay datos disponibles para mostrar");
      }

      console.log("Estado de la respuesta:", response.status);
      console.log("Datos recibidos:", data);

      return dispatch({ type: "RENOMBRAR_COMPENSAR_EXITO", payload: data });
    } catch (error: any) {
      console.error("Error al renombrar para compensar:", error.message || error);
      return dispatch({
        type: "RENOMBRAR_COMPENSAR_ERROR",
        payload: error.message,
      });
    }
  };
};

export const renombrar_saludtotal = (admisionId: number, idusuario: string) => {
  return async (dispatch: Dispatch<any>) => {
    try {
      const url = `${API_ENDPOINT}/gedocumental/radicar-salud-total/${admisionId}/${idusuario}/`;
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) {
        // Manejo de errores del servidor
        const errorMessage = data.detail || `Error ${response.status}: ${response.statusText}`;
        console.log("Detalle del error:", errorMessage);
        control_error(errorMessage);
        throw new Error(errorMessage);
      }

      if (data && data.success === true) {
        control_success("Creación de archivos de manera exitosa!");
      } else {
        console.log("No hay datos disponibles.");
        control_error("No hay datos disponibles para mostrar");
      }

      console.log("Estado de la respuesta:", response.status);

      console.log("Datos recibidos:", data);

      return dispatch({ type: "RENOMBRAR_COMPENSAR_EXITO", payload: data });
    } catch (error: any) {
      console.error("Error al renombrar para compensar:", error);
      return dispatch({
        type: "RENOMBRAR_COMPENSAR_ERROR",
        payload: error.message,
      });
    }
  };
};

export const renombrar_sanitasevento = (admisionId: number, idusuario: string) => {
  return async (dispatch: Dispatch<any>) => {
    try {
      const url = `${API_ENDPOINT}/gedocumental/radicar-sanitas-evento/${admisionId}/${idusuario}/`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        // Manejo de errores del servidor
        const errorMessage = data.detail || `Error ${response.status}: ${response.statusText}`;
        console.log("Detalle del error:", errorMessage);
        control_error(errorMessage); // Mostrar el mensaje específico
        throw new Error(errorMessage);
      }

      if (data && data.success === true) {
        control_success("Creación de archivos de manera exitosa!");
      } else if (data && data.detail) {
        console.log("Detalle del error:", data.detail);
        control_error(data.detail);
      } else {
        console.log("No hay datos disponibles.");
        control_error("No hay datos disponibles para mostrar");
      }

      console.log("Estado de la respuesta:", response.status);
      console.log("Datos recibidos:", data);

      return dispatch({ type: "RENOMBRAR_SANITAS_EVENTO_EXITO", payload: data });
    } catch (error: any) {
      console.error("Error al renombrar para Sanitas Evento:", error);
      control_error(error.message);
      return dispatch({
        type: "RENOMBRAR_SANITAS_EVENTO_ERROR",
        payload: error.message,
      });
    }
  };
};


export const renombrar_colsanitas = (admisionId: number, idusuario: string) => {
  return async (dispatch: Dispatch<any>) => {
    try {
      const url = `${API_ENDPOINT}/gedocumental/radicar-colsanitas/${admisionId}/${idusuario}/`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        // Manejo de errores del servidor
        const errorMessage = data.detail || `Error ${response.status}: ${response.statusText}`;
        console.log("Detalle del error:", errorMessage);
        control_error(errorMessage); // Mostrar el mensaje específico
        throw new Error(errorMessage);
      }


      if (data && data.success === true) {
        control_success("Creación de archivos de manera exitosa!");
      } else if (data && data.detail) {
        // Mostrar detalle del error si existe
        console.log("Detalle del error:", data.detail);
        control_error(data.detail);
      } else {
        console.log("No hay datos disponibles.");
        control_error("No hay datos disponibles para mostrar");
      }

      console.log("Estado de la respuesta:", response.status);

      console.log("Datos recibidos:", data);

      return dispatch({ type: "RENOMBRAR_COMPENSAR_EXITO", payload: data });
    } catch (error: any) {
      console.error("Error al renombrar para compensar:", error);
      return dispatch({
        type: "RENOMBRAR_COMPENSAR_ERROR",
        payload: error.message,
      });
    }
  };
};

export const renombrar_medisanitas = (admisionId: number, idusuario: string) => {
  return async (dispatch: Dispatch<any>) => {
    try {
      const url = `${API_ENDPOINT}/gedocumental/radicar-medisanitas/${admisionId}/${idusuario}/`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        // Manejo de errores del servidor
        const errorMessage = data.detail || `Error ${response.status}: ${response.statusText}`;
        console.log("Detalle del error:", errorMessage);
        control_error(errorMessage); // Mostrar el mensaje específico
        throw new Error(errorMessage);
      }

      if (data && data.success === true) {
        control_success("Creación de archivos de manera exitosa!");
      } else if (data && data.detail) {
        console.log("Detalle del error:", data.detail);
        control_error(data.detail);
      } else {
        console.log("No hay datos disponibles.");
        control_error("No hay datos disponibles para mostrar");
      }
      console.log("Estado de la respuesta:", response.status);
      console.log("Datos recibidos:", data);

      return dispatch({ type: "RENOMBRAR_COMPENSAR_EXITO", payload: data });
    } catch (error: any) {
      console.error("Error al renombrar para compensar:", error);
      return dispatch({
        type: "RENOMBRAR_COMPENSAR_ERROR",
        payload: error.message,
      });
    }
  };
};


export const renombrar_policia = (admisionId: number, idusuario: string) => {
  return async (dispatch: Dispatch<any>) => {
    try {
      const url = `${API_ENDPOINT}/gedocumental/radicar-policia/${admisionId}/${idusuario}/`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        // Manejo de errores del servidor
        const errorMessage = data.detail || `Error ${response.status}: ${response.statusText}`;
        console.log("Detalle del error:", errorMessage);
        control_error(errorMessage); // Mostrar el mensaje específico
        throw new Error(errorMessage);
      }

      if (data && data.success === true) {
        control_success("Creación de archivos de manera exitosa!");
      } else if (data && data.detail) {
        console.log("Detalle del error:", data.detail);
        control_error(data.detail);
      } else {
        console.log("No hay datos disponibles.");
        control_error("No hay datos disponibles para mostrar");
      }
      console.log("Estado de la respuesta:", response.status);
      console.log("Datos recibidos:", data);

      return dispatch({ type: "RENOMBRAR_policia_EXITO", payload: data });
    } catch (error: any) {
      console.error("Error al renombrar para policia:", error);
      return dispatch({
        type: "RENOMBRAR_policia_ERROR",
        payload: error.message,
      });
    }
  };
};




export const renombrar_capitalsalud = (admisionId: number, idusuario: string) => {
  return async (dispatch: Dispatch<any>) => {
    try {
      const url = `${API_ENDPOINT}/gedocumental/radicar-capital-salud/${admisionId}/${idusuario}/`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        // Manejo de errores del servidor
        const errorMessage = data.detail || `Error ${response.status}: ${response.statusText}`;
        console.log("Detalle del error:", errorMessage);
        control_error(errorMessage);
        throw new Error(errorMessage);
      }

      if (data && data.success === true) {
        control_success("Creación de archivos de manera exitosa!");
        return dispatch({ type: "RENOMBRAR_CAPITAL_SALUD_EXITO", payload: data });
      } else {
        const detailMessage = data.detail || "No hay datos disponibles para mostrar";
        console.log("Detalle del error:", detailMessage);
        control_error(detailMessage);
        return dispatch({
          type: "RENOMBRAR_CAPITAL_SALUD_ERROR",
          payload: detailMessage,
        });
      }

    } catch (error: any) {
      console.error("Error al renombrar para Capital Salud:", error.message || error);
      control_error(error.message || "Error desconocido");
      return dispatch({
        type: "RENOMBRAR_CAPITAL_SALUD_ERROR",
        payload: error.message || "Error desconocido",
      });
    }
  };
};

export const renombrar_otros = (admisionId: number, idusuario: string) => {
  return async (dispatch: Dispatch<any>) => {
    try {
      const url = `${API_ENDPOINT}/gedocumental/radicar-otros/${admisionId}/${idusuario}/`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        // Manejo de errores del servidor
        const errorMessage = data.detail || `Error ${response.status}: ${response.statusText}`;
        console.log("Detalle del error:", errorMessage);
        control_error(errorMessage); // Mostrar el mensaje específico
        throw new Error(errorMessage);
      }


      if (data && data.success === true) {
        control_success("Creación de archivos de manera exitosa!");
      } else if (data && data.detail) {
        console.log("Detalle del error:", data.detail);
        control_error(data.detail);
      } else {
        console.log("No hay datos disponibles.");
        control_error("No hay datos disponibles para mostrar");
      }

      console.log("Estado de la respuesta:", response.status);
      console.log("Datos recibidos:", data);

      return dispatch({ type: "RENOMBRAR_COMPENSAR_EXITO", payload: data });
    } catch (error: any) {
      console.error("Error al renombrar para compensar:", error);
      return dispatch({
        type: "RENOMBRAR_COMPENSAR_ERROR",
        payload: error.message,
      });
    }
  };
};


export const renombrar_san02 = (admisionId: number, idusuario: string) => {
  return async (dispatch: Dispatch<any>) => {
    try {
      // Incluye idusuario en la URL
      const url = `${API_ENDPOINT}/gedocumental/radicar-san02/${admisionId}/${idusuario}/`;
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) {
        // Manejo de errores del servidor
        const errorMessage = data.detail || `Error ${response.status}: ${response.statusText}`;
        console.log("Detalle del error:", errorMessage);
        control_error(errorMessage);
        throw new Error(errorMessage);
      }


      if (data && data.success === true) {
        control_success("Creación de archivos de manera exitosa!");
      } else {
        console.log("No hay datos disponibles.");
        control_error("No hay datos disponibles para mostrar");
      }

      console.log("Estado de la respuesta:", response.status);
      console.log("Datos recibidos:", data);

      return dispatch({ type: "RENOMBRAR_COMPENSAR_EXITO", payload: data });
    } catch (error: any) {
      console.error("Error al renombrar para compensar:", error);
      return dispatch({
        type: "RENOMBRAR_COMPENSAR_ERROR",
        payload: error.message,
      });
    }
  };
};

export const renombrar_ejercito = (admisionId: number, idusuario: string) => {
  return async (dispatch: Dispatch<any>) => {
    try {
      // Incluye idusuario en la URL
      const url = `${API_ENDPOINT}/gedocumental/radicar-ejercito/${admisionId}/${idusuario}/`;
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) {
        // Manejo de errores del servidor
        const errorMessage = data.detail || `Error ${response.status}: ${response.statusText}`;
        console.log("Detalle del error:", errorMessage);
        control_error(errorMessage);
        throw new Error(errorMessage);
      }


      if (data && data.success === true) {
        control_success("Creación de archivos de manera exitosa!");
      } else {
        console.log("No hay datos disponibles.");
        control_error("No hay datos disponibles para mostrar");
      }

      console.log("Estado de la respuesta:", response.status);
      console.log("Datos recibidos:", data);

      return dispatch({ type: "RENOMBRAR_COMPENSAR_EXITO", payload: data });
    } catch (error: any) {
      console.error("Error al renombrar para compensar:", error);
      return dispatch({
        type: "RENOMBRAR_COMPENSAR_ERROR",
        payload: error.message,
      });
    }
  };
};



export const get_hallazgos = (): any => {
  return async (
    dispatch: AppDispatch
  ): Promise<Hallazgo[] | { error: any }> => {
    try {
      const url = `${API_ENDPOINT}/gedocumental/hallazgos/`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        dispatch(set_hallazgos(data.data));
        return data.data;
      } else {
        throw new Error(data.detail);
      }
    } catch (error: any) {
      console.error("Error al obtener los hallazgos:", error);
      return { error: error.message || "Error desconocido" };
    }
  };
};

//// SERVICIO PARA CAMBIAR EL REGIMEN DE UNA ADMSION//////

export const actualizarRegimenArchivos = async (consecutivo: number | string, regimen: string) => {
  try {
    const response = await fetch(
      `${API_ENDPOINT}/actualizar_regimen/${consecutivo}/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ regimen }),
      }
    );

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log(responseData);
    // Mostrar notificación de éxito
    toast.success(responseData.message, { autoClose: 3000 });
  } catch (error: any) {
    console.error("Error al actualizar régimen:", error.message);
    // Mostrar notificación de error utilizando control_error
    toast.error("Error al actualizar régimen", { autoClose: 3000 });
  }
};

/// AGREGAR OBSERVACIONES SIN ARCHIVOS A USUARIOS ////

export const agregarObservacionSinArchivo = async (
  admisionId: number,
  usuarioId: number,
  descripcion: string,
  tipoArchivo: string
) => {
  try {
    const response = await fetch(
      `${API_ENDPOINT}/agregar_observacion_sin_archivo/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          AdmisionId: admisionId,
          Usuario: usuarioId,
          Descripcion: descripcion,
          TipoArchivo: tipoArchivo,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log(responseData);
    // Mostrar notificación de éxito
    toast.success(responseData.message, { autoClose: 3000 });
  } catch (error: any) {
    console.error("Error al agregar observación sin archivo:", error.message);
    // Mostrar notificación de error
    toast.error("Error al agregar observación sin archivo", {
      autoClose: 3000,
    });
  }
};

export const
  ObservacionRevisada = async (admisionId: number) => {
    try {
      const response = await fetch(
        `${API_ENDPOINT}/revisar_observacion/${admisionId}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ Revisada: true }),
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log(responseData);
      toast.success("Observación marcada como revisada.", { autoClose: 3000 });
    } catch (error: any) {
      console.error(
        "Error al marcar la observación como revisada:",
        error.message
      );
      toast.error("Error al marcar la observación como revisada", {
        autoClose: 3000,
      });
    }
  };

/////// servicio para revisadas las admisiones

export const actualizarModificadoRevisor = (
  admisionId: any,
  tipoRevisor: any
) => {
  return async (dispatch: Dispatch<any>) => {
    try {
      const response = await fetch(
        `${API_ENDPOINT}/actualizar_modificado_revisor/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            admision_id: admisionId,
            tipo_revisor: tipoRevisor,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log(responseData);
      // Optionally show a success notification
    } catch (error: any) {
      console.error("Error al actualizar modificado revisor:", error.message);
      // Optionally show an error notification
    }
  };
};

export const eliminarArchivoFacturacion = async (archivoId: number) => {
  try {
    const response = await fetch(
      `${API_ENDPOINT}/eliminar_archivo_facturacion/?archivo_id=${archivoId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status === 404) {
      console.warn(`Archivo con ID ${archivoId} no encontrado. Es posible que ya haya sido eliminado.`);
      toast.warn(`Archivo con ID ${archivoId} no encontrado. Es posible que ya haya sido eliminado.`, { autoClose: 3000 });
      return;
    }

    if (!response.ok) {
      const errorData = await response.json();
      console.log("Detalle del error:", errorData.detail);
      control_error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
    }

    console.log("Archivo eliminado con éxito!");
    toast.success("Archivo eliminado con éxito!", { autoClose: 3000 });

    return response;
  } catch (error: any) {
    console.error("Error al eliminar el archivo de facturación:", error.message || error);
    control_error(error.message || "Error desconocido");
    toast.error("Error al eliminar el archivo de facturación", { autoClose: 3000 });
    throw error;
  }
};

export const actualizarModificadoCm = (
  admisionId: string,
  userId: number
): ThunkAction<void, RootState, unknown, any> => {
  return async (dispatch, getState) => {
    try {
      const response = await fetch(`${API_ENDPOINT}/actualizar_correciones_cm/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admision_id: admisionId,
          user_id: userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log(responseData);

      // Opcionalmente muestra una notificación de éxito
      toast.success('Modificado actualizado correctamente');
    } catch (error: any) {
      console.error('Error al actualizar modificado revisor:', error.message);
      toast.error('Error al actualizar modificado revisor');
    }
  };
};




export const enviar_tesoreria = (
  admisionId: string,
  userId: number
): ThunkAction<void, RootState, unknown, any> => {
  return async (dispatch, getState) => {
    try {
      const response = await fetch(`${API_ENDPOINT}/admision_revisor_tesoreria/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admision_id: admisionId,
          user_id: userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log(responseData);

      // Opcionalmente muestra una notificación de éxito
      toast.success('Modificado actualizado correctamente');
    } catch (error: any) {
      console.error('Error al actualizar modificado revisor:', error.message);
      toast.error('Error al actualizar modificado revisor');
    }
  };
};




export const get_admision_pendiente_revisadas_cm = (id: string): any => {
  return async (dispatch: Dispatch<any>) => {
    try {
      const url = `${API_ENDPOINT}/admisiones_enviadas_cm/${id}/`;
      const response = await fetch(url);
      const data = await response.json();

      console.log("Estado de la respuesta:", response.status);
      console.log("Datos recibidos:", data);
      if (data && data.data && data.data.length > 0) {
        dispatch(set_admision_pendiente(data.data));
        control_success("Admisiones con el revisor ID encontradas");
      } else {
        console.log("No hay datos disponibles.");
        control_error("No hay datos disponibles para mostrar");
      }

      return data;
    } catch (error: any) {
      console.error("Error al obtener las admisiones:", error);
      return error;
    }
  };
};

// CONSOLIDADO PARA ESTUDIOS 
export const getCitasEstudios = (fechaInicio: string, fechaFin: string): any => {
  return async (dispatch: Dispatch<any>) => {
    try {
      const url = `${API_ENDPOINT}/citasestudios/?fecha_inicial=${fechaInicio}&fecha_final=${fechaFin}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(`Error al obtener citas: ${errorData.detail || response.statusText}`, {
          position: "bottom-right",
          autoClose: 3000,
          theme: "light",
        });
        throw new Error(`Error ${response.status}: ${errorData.detail}`);
      }

      const data = await response.json();

      console.log("Datos recibidos:", data);

      if (data.success) {
        dispatch(set_consolidado_estudios(data.data));
        toast.success("Citas de estudios cargadas con éxito.", {
          position: "bottom-right",
          autoClose: 3000,
          theme: "light",
        });
      }

      return data.data;
    } catch (error: any) {
      console.error("Error al obtener las citas de estudios:", error);
      toast.error("Error al obtener las citas de estudios.", {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light",
      });
    }
  };
};



export const get_profesionales = (): any => {
  return async (dispatch: Dispatch<any>) => {
    try {
      const url = `${API_ENDPOINT}/listadomedicos/`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      console.log("Estado de la respuesta:", response.status);
      console.log("Datos recibidos:", data);

      // Guardar los datos en el estado global si la respuesta fue exitosa
      if (data.success) {
        dispatch(set_profesionales(data.data));
      } else {
        throw new Error(data.detail || "Error desconocido en el servidor");
      }

      return data;
    } catch (error: any) {
      console.error("Error al obtener los profesionales:", error);
      
    }
  };
};

export const guardarConsolidadoEstudios = (datos: any[]): any => {
  return async (dispatch: Dispatch<any>) => {
    try {
      const url = `${API_ENDPOINT}/guardar-consolidado-estudios/`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ consolidado_estudios: datos }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(`Error al guardar: ${errorData.detail || response.statusText}`, {
          position: "bottom-right",
          autoClose: 3000,
          theme: "light",
        });
        throw new Error(`Error ${response.status}: ${errorData.detail}`);
      }

      const data = await response.json();
      toast.success("Datos guardados exitosamente.", {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light",
      });

      console.log("Datos guardados exitosamente:", data);
      return data;
    } catch (error: any) {
      console.error("Error al guardar el consolidado de estudios:", error);
      toast.error("Error al guardar el consolidado de estudios.", {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light",
      });
      throw new Error("No se pudo guardar el consolidado de estudios.");
    }
  };
};

// trae la tabla consolidado estudios 

export const getConsolidadoEstudios = (
  fechaInicio: string | null,
  fechaFin: string | null,
  nombreMedico: string | null
): any => {
  return async (dispatch: Dispatch<any>) => {
    try {
      let url = `${API_ENDPOINT}/estudiosasignados/?`;
      if (fechaInicio && fechaFin) url += `fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}&`;
      if (nombreMedico) url += `nombre_medico=${encodeURIComponent(nombreMedico)}&`;

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(`Error al cargar consolidado: ${errorData.detail || response.statusText}`, {
          position: "bottom-right",
          autoClose: 3000,
          theme: "light",
        });
        throw new Error(`Error ${response.status}: ${errorData.detail}`);
      }

      const data = await response.json();
      console.log("Datos recibidos:", data);

      if (data.success) {
        dispatch(set_estudios_medico_asignado(data.data));
        toast.success("Consolidado de estudios cargado con éxito.", {
          position: "bottom-right",
          autoClose: 3000,
          theme: "light",
        });
      }

      return data.data;
    } catch (error: any) {
      console.error("Error al obtener el consolidado de estudios:", error);
      toast.error("Error al obtener el consolidado de estudios.", {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light",
      });
      throw new Error("No se pudo obtener el consolidado de estudios.");
    }
  };
};



export const renombrar_fomag = (admisionId: number, idusuario: string) => {
  return async (dispatch: Dispatch<any>) => {
    try {
      const url = `${API_ENDPOINT}/gedocumental/radicar-fomag/${admisionId}/${idusuario}/`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        // Manejo de errores del servidor
        const errorMessage = data.detail || `Error ${response.status}: ${response.statusText}`;
        console.log("Detalle del error:", errorMessage);
        control_error(errorMessage); // Mostrar el mensaje específico
        throw new Error(errorMessage);
      }

      if (data && data.success === true) {
        control_success("Creación de archivos de manera exitosa!");
      } else if (data && data.detail) {
        console.log("Detalle del error:", data.detail);
        control_error(data.detail);
      } else {
        console.log("No hay datos disponibles.");
        control_error("No hay datos disponibles para mostrar");
      }
      console.log("Estado de la respuesta:", response.status);
      console.log("Datos recibidos:", data);

      return dispatch({ type: "RENOMBRAR_FOMAG_EXITO", payload: data });
    } catch (error: any) {
      console.error("Error al renombrar para compensar:", error);
      return dispatch({
        type: "RENOMBRAR_FOMAG_ERROR",
        payload: error.message,
      });
    }
  };
};