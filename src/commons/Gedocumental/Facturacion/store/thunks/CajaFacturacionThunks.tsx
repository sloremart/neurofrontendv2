import { toast } from "react-toastify";
import { ToastContent } from "react-toastify";
import { createAsyncThunk } from "@reduxjs/toolkit";
import CONFIG from "../../../../../config/api";
import { set_cuentas_nits, set_archivos_caja } from "../slice/CajaFacturacionSlice.tsx";
import { AppDispatch } from "../../../../../store/store";

const API_ENDPOINT = CONFIG.API_ENDPOINT;

const control_error = (message: ToastContent = "Algo pasó, intente de nuevo") =>
  toast.error(message, {
    position: "bottom-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: "light",
  });

const control_success = (message: ToastContent) =>
  toast.success(message, {
    position: "bottom-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: "light",
  });

export const get_nits = (searchValue = "") => async (dispatch: AppDispatch) => {
  try {
    const url = `${API_ENDPOINT}/programacionpagos/lista_nits/?search=${searchValue}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      dispatch(set_cuentas_nits([]));
      return;
    }

    dispatch(set_cuentas_nits(data));
  } catch (error) {
    console.error("Error al obtener los NITs:", error);
  }
};

export const subir_facturas_proveedor = (
  nit: string,
  archivos: File[],
  tipoDocumentos: string,
  userId: string,
  IdRevisor?: string,
  tipoHallazgo?: string,
  IdRevisorTesoreria?: string,
  IdRevisorCuentasMedicas?: string
) => {
  return async (_dispatch: AppDispatch) => {
    try {
      const nitLimpio = nit.replace(/\./g, "");
      const url = `${API_ENDPOINT}/programacionpagos/factura_proveedor/upload/${nitLimpio}/`;

      const formData = new FormData();
      archivos.forEach((file) => formData.append("files", file));
      formData.append("tipoDocumentos", tipoDocumentos);
      formData.append("userId", userId);
      if (IdRevisor !== undefined) formData.append("IdRevisor", IdRevisor);
      if (IdRevisorTesoreria !== undefined) formData.append("IdRevisorTesoreria", IdRevisorTesoreria);
      if (IdRevisorCuentasMedicas !== undefined) formData.append("IdRevisorCuentasMedicas", IdRevisorCuentasMedicas);
      if (tipoHallazgo !== undefined) formData.append("TipoHallazgo", tipoHallazgo);

      const response = await fetch(url, { method: "POST", body: formData });
      const result = await response.json();

      if (!response.ok) throw new Error(result.detail || "Error al subir archivos.");

      control_success(result.detail || "Factura(s) subida(s) correctamente.");
      return result.data;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "No se pudo subir la factura.";
      control_error(msg);
    }
  };
};

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
      if (queryParams.toString()) url += `?${queryParams.toString()}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);

      const result = await response.json();
      if (!result.success || !Array.isArray(result.data)) {
        control_error("No se encontraron facturas.");
        return;
      }

      const adaptado = result.data.map((item: { factura: object; estado: string; observaciones?: Array<{ Descripcion: string }> }) => ({
        ...(item.factura as object),
        estado: item.estado,
        observacionesTexto: item.observaciones?.map((o) => o.Descripcion).join("; ") || "Sin observaciones",
      }));

      dispatch(set_archivos_caja(adaptado));
      control_success("Facturas filtradas cargadas correctamente.");
      return adaptado;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "No se pudo obtener la información.";
      control_error(msg);
    }
  };
};

interface ActualizarEgresoPayload {
  idArchivo: number;
  numeroDocumento: string;
}

export const actualizar_numero_egreso = createAsyncThunk(
  "cajaFacturacion/actualizarNumeroEgreso",
  async ({ idArchivo, numeroDocumento }: ActualizarEgresoPayload, thunkAPI) => {
    try {
      const url = `${API_ENDPOINT}/programacionpagos/actualizar_egreso/${idArchivo}/`;
      const response = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero_documento: numeroDocumento }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || "Error al actualizar el número de egreso.");

      control_success(result.detail || "Número de egreso actualizado correctamente.");
      return result;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "No se pudo actualizar el número de egreso.";
      control_error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const eliminar_factura_proveedor = (archivoId: number) => {
  return async (_dispatch: AppDispatch) => {
    try {
      const url = `${API_ENDPOINT}/programacionpagos/eliminar_archivo/${archivoId}/`;
      const response = await fetch(url, { method: "DELETE" });
      const result = await response.json();

      if (!response.ok) throw new Error(result.detail || "Error al eliminar el archivo.");

      control_success(result.detail || "Archivo eliminado correctamente.");
      return archivoId;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "No se pudo eliminar la factura.";
      control_error(msg);
    }
  };
};
