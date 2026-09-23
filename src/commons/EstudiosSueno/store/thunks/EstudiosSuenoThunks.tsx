import { toast } from "react-toastify";
import CONFIG from "../../../../config/api.js";
import {
  set_registros, set_especialistas, set_tecnicos, set_estudios, set_equipos, set_entidades,
} from "../slice/indexEstudiosSueno.tsx";

const BASE = `${CONFIG.API_ENDPOINT}/estudios-sueno`;

const token = () => localStorage.getItem("token") ?? "";
const headers = () => ({ "Content-Type": "application/json", Authorization: `Token ${token()}` });

export const control_error = (msg = "Algo salió mal") =>
  toast.error(msg, { position: "bottom-right", autoClose: 3000 });

// ── Catálogos ────────────────────────────────────────────────────────────────

export const cargar_catalogos = () => async (dispatch: any) => {
  try {
    const [res1, res2, res3, res4, res5] = await Promise.all([
      fetch(`${BASE}/estudios/`,      { headers: headers() }),
      fetch(`${BASE}/equipos/`,       { headers: headers() }),
      fetch(`${BASE}/especialistas/`, { headers: headers() }),
      fetch(`${BASE}/tecnicos/`,      { headers: headers() }),
      fetch(`${BASE}/entidades/`,     { headers: headers() }),
    ]);
    const [d1, d2, d3, d4, d5] = await Promise.all([res1.json(), res2.json(), res3.json(), res4.json(), res5.json()]);
    if (d1.success) dispatch(set_estudios(d1.data));
    if (d2.success) dispatch(set_equipos(d2.data));
    if (d3.success) dispatch(set_especialistas(d3.data));
    if (d4.success) dispatch(set_tecnicos(d4.data));
    if (d5.success) dispatch(set_entidades(d5.data));
  } catch {
    control_error("Error cargando catálogos");
  }
};

// ── Registros ────────────────────────────────────────────────────────────────

export const cargar_registros = (fechaInicio: string, fechaFin: string) => async (dispatch: any) => {
  try {
    const res  = await fetch(`${BASE}/registros/?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`, { headers: headers() });
    const data = await res.json();
    dispatch(set_registros(Array.isArray(data) ? data : []));
  } catch {
    control_error("Error cargando registros");
  }
};

export const crear_registro = (payload: any) => async (dispatch: any) => {
  try {
    const res  = await fetch(`${BASE}/registros/`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success("Registro guardado");
      return { success: true, data };
    }
    control_error(data.detail ?? "Error al guardar");
    return { success: false };
  } catch {
    control_error();
    return { success: false };
  }
};

export const actualizar_registro = (id: number, payload: any) => async (dispatch: any) => {
  try {
    const res  = await fetch(`${BASE}/registros/${id}/`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success("Registro actualizado");
      return { success: true, data };
    }
    control_error(data.detail ?? "Error al actualizar");
    return { success: false };
  } catch {
    control_error();
    return { success: false };
  }
};

export const eliminar_registro = (id: number) => async () => {
  try {
    const res = await fetch(`${BASE}/registros/${id}/`, {
      method: "DELETE",
      headers: headers(),
    });
    if (res.ok) { toast.success("Registro eliminado"); return { success: true }; }
    control_error("Error al eliminar");
    return { success: false };
  } catch {
    control_error();
    return { success: false };
  }
};

export const buscar_pacientes_agenda = (fechaInicio: string, fechaFin: string) => async () => {
  try {
    const res  = await fetch(`${BASE}/pacientes-agenda/?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`, { headers: headers() });
    const data = await res.json();
    return data.success ? data.data : [];
  } catch {
    control_error("Error consultando agenda");
    return [];
  }
};
