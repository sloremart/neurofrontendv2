
import CONFIG from "../../../../config/api";
import { 
  setActividades, 
  setAreas, 
  setComponentes, 
  setEvaluaciones, 
  setPreguntas, 
  setPreguntas360, 
  setTiposComponente, 
  setUsuarios, 
  setContratosUsuarios, 
  setCategoriasPreguntas, 
  setRegistrosHorario, 
  setResultadoProcesamiento, 
  setLoadingHorario,
  setLoading,
  setError
} from "../slice/indexEvaluacionDesempeño.tsx";
import { Dispatch } from "react";





const { API_ENDPOINT } = CONFIG;
const BASE_URL = `${API_ENDPOINT}/evaluaciondesempeno`;

const fetchData = async (url: string, method: string, body?: any) => {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  
  // Verificar si la respuesta es exitosa
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  // Para operaciones DELETE, la respuesta puede estar vacía
  if (method === 'DELETE') {
    // Si la respuesta está vacía, devolver un objeto de éxito
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return { success: true, message: 'Elemento eliminado correctamente' };
    }
  }
  
  // Verificar si hay contenido en la respuesta
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const text = await response.text();
    if (text.trim() === '') {
      // Respuesta vacía pero exitosa
      return { success: true };
    }
    return JSON.parse(text);
  }
  
  // Si no es JSON, devolver la respuesta como texto
  return { success: true, message: await response.text() };
};

// Áreas
export const getAreas = () => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const response = await fetch(`${BASE_URL}/areas/`);
    if (!response.ok) throw new Error("Error en la petición");
    
    const data = await response.json();
    
    // Verificar que los datos sean válidos antes de enviarlos al store
    if (!data || !Array.isArray(data)) {
      throw new Error('Datos inválidos recibidos del servidor');
    }
    
    dispatch(setAreas(data));
    return data;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al obtener las áreas';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const createArea = (area: any) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const result = await fetchData(`${BASE_URL}/areas/`, 'POST', area);
    
    // Recargar las áreas después de crear una nueva
    await dispatch(getAreas() as any);
    
    return result;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al crear el área';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const updateArea = (id: number, area: any) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const result = await fetchData(`${BASE_URL}/areas/${id}/`, 'PUT', area);
    
    // Recargar las áreas después de actualizar
    await dispatch(getAreas() as any);
    
    return result;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al actualizar el área';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const deleteArea = (id: number) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const result = await fetchData(`${BASE_URL}/areas/${id}/`, 'DELETE');
    
    // Recargar las áreas después de eliminar
    await dispatch(getAreas() as any);
    
    return result;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al eliminar el área';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

// Tipos de Componente
export const getTiposComponente = () => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const data = await fetchData(`${BASE_URL}/tipos-componentes/`, 'GET');
    
    // Verificar que los datos sean válidos antes de enviarlos al store
    if (!data || !Array.isArray(data)) {
      throw new Error('Datos inválidos recibidos del servidor');
    }
    
    dispatch(setTiposComponente(data));
    return data;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al obtener tipos de componente';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const createTipoComponente = (item: any) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const result = await fetchData(`${BASE_URL}/tipos-componentes/`, 'POST', item);
    
    // Recargar los tipos de componente después de crear uno nuevo
    await dispatch(getTiposComponente() as any);
    
    return result;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al crear el tipo de componente';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const updateTipoComponente = (id: number, item: any) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const result = await fetchData(`${BASE_URL}/tipos-componentes/${id}/`, 'PUT', item);
    
    // Recargar los tipos de componente después de actualizar
    await dispatch(getTiposComponente() as any);
    
    return result;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al actualizar el tipo de componente';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const deleteTipoComponente = (id: number) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const result = await fetchData(`${BASE_URL}/tipos-componentes/${id}/`, 'DELETE');
    
    // Recargar los tipos de componente después de eliminar
    await dispatch(getTiposComponente() as any);
    
    return result;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al eliminar el tipo de componente';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

// Componentes
export const getComponentes = () => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const data = await fetchData(`${BASE_URL}/componentes/`, 'GET');
    
    // Verificar que los datos sean válidos antes de enviarlos al store
    if (!data || !Array.isArray(data)) {
      throw new Error('Datos inválidos recibidos del servidor');
    }
    
    dispatch(setComponentes(data));
    return data;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al obtener componentes';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

// Obtener porcentajes de cumplimiento por componente
export const getPorcentajesCumplimiento = (areaId: number, cargo?: string) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    let url = `${BASE_URL}/componentes/porcentajes_cumplimiento/?area_id=${areaId}`;
    if (cargo) {
      url += `&cargo=${encodeURIComponent(cargo)}`;
    }
    const data = await fetchData(url, 'GET');
    return data;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al obtener porcentajes de cumplimiento';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const getDashboardGeneral = () => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    // ✅ CAMBIAR: Usar el endpoint dashboard que incluye actividades
    const url = `${BASE_URL}/componentes/dashboard/`;
    const data = await fetchData(url, 'GET');
    return data;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al obtener dashboard general';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const createComponente = (item: any) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const result = await fetchData(`${BASE_URL}/componentes/`, 'POST', item);
    
    // Recargar los componentes después de crear uno nuevo
    await dispatch(getComponentes() as any);
    
    return result;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al crear el componente';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const updateComponente = (id: number, item: any) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const result = await fetchData(`${BASE_URL}/componentes/${id}/`, 'PUT', item);
    
    // Recargar los componentes después de actualizar
    await dispatch(getComponentes() as any);
    
    return result;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al actualizar el componente';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const deleteComponente = (id: number) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const result = await fetchData(`${BASE_URL}/componentes/${id}/`, 'DELETE');
    
    // Recargar los componentes después de eliminar
    await dispatch(getComponentes() as any);
    
    return result;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al eliminar el componente';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

// Actividades
export const getActividades = () => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const data = await fetchData(`${BASE_URL}/actividades/`, 'GET');
    
    // Verificar que los datos sean válidos antes de enviarlos al store
    if (!data || !Array.isArray(data)) {
      throw new Error('Datos inválidos recibidos del servidor');
    }
    
    dispatch(setActividades(data));
    return data;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al obtener actividades';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const createActividad = (item: any) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const result = await fetchData(`${BASE_URL}/actividades/`, 'POST', item);
    
    // Recargar las actividades después de crear una nueva
    await dispatch(getActividades() as any);
    
    return result;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al crear la actividad';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const updateActividad = (id: number, item: any) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const result = await fetchData(`${BASE_URL}/actividades/${id}/`, 'PUT', item);
    
    // Recargar las actividades después de actualizar
    await dispatch(getActividades() as any);
    
    return result;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al actualizar la actividad';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const deleteActividad = (id: number) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const result = await fetchData(`${BASE_URL}/actividades/${id}/`, 'DELETE');
    
    // Recargar las actividades después de eliminar
    await dispatch(getActividades() as any);
    
    return result;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al eliminar la actividad';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

// Evaluaciones
export const getEvaluaciones = () => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const data = await fetchData(`${BASE_URL}/evaluaciones/`, 'GET');
    
    // Verificar que los datos sean válidos antes de enviarlos al store
    if (!data || !Array.isArray(data)) {
      throw new Error('Datos inválidos recibidos del servidor');
    }
    
    dispatch(setEvaluaciones(data));
    return data;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al obtener evaluaciones';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

// Evaluaciones para Dashboard (incluye información de asignaciones completadas)
export const getEvaluacionesDashboard = () => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const data = await fetchData(`${BASE_URL}/evaluaciones/dashboard/`, 'GET');
    // No hacer dispatch aquí, solo devolver los datos para que el frontend los maneje
    return data;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al obtener evaluaciones del dashboard';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const createEvaluacion = (item: any) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const result = await fetchData(`${BASE_URL}/evaluaciones/`, 'POST', item);
    
    // Recargar las evaluaciones después de crear una nueva
    await dispatch(getEvaluaciones() as any);
    
    return result;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al crear la evaluación';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const updateEvaluacion = (id: number, item: any) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const result = await fetchData(`${BASE_URL}/evaluaciones/${id}/`, 'PUT', item);
    
    // Recargar las evaluaciones después de actualizar
    await dispatch(getEvaluaciones() as any);
    
    return result;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al actualizar la evaluación';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const deleteEvaluacion = (id: number) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const result = await fetchData(`${BASE_URL}/evaluaciones/${id}/`, 'DELETE');
    
    // Recargar las evaluaciones después de eliminar
    await dispatch(getEvaluaciones() as any);
    
    return result;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al eliminar la evaluación';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const asignarEvaluacionMasiva = (item: any) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const result = await fetchData(`${BASE_URL}/evaluaciones/asignar_masiva/`, 'POST', item);
    
    // Recargar las evaluaciones después de asignar masivamente
    await dispatch(getEvaluaciones() as any);
    
    return result;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al asignar evaluaciones masivamente';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

// Preguntas Evaluación
export const getPreguntas = () => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const data = await fetchData(`${BASE_URL}/preguntas/`, 'GET');
    
    // Verificar que los datos sean válidos antes de enviarlos al store
    if (!data || !Array.isArray(data)) {
      throw new Error('Datos inválidos recibidos del servidor');
    }
    
    dispatch(setPreguntas(data));
    return data;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al obtener preguntas';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const createPregunta = (item: any) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const result = await fetchData(`${BASE_URL}/preguntas/`, 'POST', item);
    
    // Recargar las preguntas después de crear una nueva
    await dispatch(getPreguntas() as any);
    
    return result;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al crear la pregunta';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const updatePregunta = (id: number, item: any) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const result = await fetchData(`${BASE_URL}/preguntas/${id}/`, 'PUT', item);
    
    // Recargar las preguntas después de actualizar
    await dispatch(getPreguntas() as any);
    
    return result;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al actualizar la pregunta';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const deletePregunta = (id: number) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const result = await fetchData(`${BASE_URL}/preguntas/${id}/`, 'DELETE');
    
    // Recargar las preguntas después de eliminar
    await dispatch(getPreguntas() as any);
    
    return result;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al eliminar la pregunta';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};


export const getUsuariosConPerfil = () => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const data = await fetchData(`${BASE_URL}/usuarios_con_perfil/`, 'GET');
    dispatch(setUsuarios(data)); // Asegúrate de tener este slice
    return data;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al obtener los usuarios con perfil';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};


export const getPreguntas360 = () => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const data = await fetchData(`${BASE_URL}/preguntas360/`, 'GET');
    dispatch(setPreguntas360(data));
    return data;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al obtener preguntas 360°';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const createPregunta360 = (item: any) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const result = await fetchData(`${BASE_URL}/preguntas360/`, 'POST', item);
    
    // Recargar las preguntas 360 después de crear una nueva
    await dispatch(getPreguntas360() as any);
    
    return result;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al crear la pregunta 360°';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const updatePregunta360 = (id: number, item: any) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const result = await fetchData(`${BASE_URL}/preguntas360/${id}/`, 'PUT', item);
    
    // Recargar las preguntas 360 después de actualizar
    await dispatch(getPreguntas360() as any);
    
    return result;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al actualizar la pregunta 360°';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const deletePregunta360 = (id: number) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const result = await fetchData(`${BASE_URL}/preguntas360/${id}/`, 'DELETE');
    
    // Recargar las preguntas 360 después de eliminar
    await dispatch(getPreguntas360() as any);
    
    return result;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al eliminar la pregunta 360°';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

// Categorías de Preguntas
export const getCategoriasPreguntas = () => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const data = await fetchData(`${BASE_URL}/categorias-preguntas/`, 'GET');
    dispatch(setCategoriasPreguntas(data));
    return data;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al obtener categorías';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const createCategoriaPregunta = (item: any) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const result = await fetchData(`${BASE_URL}/categorias-preguntas/`, 'POST', item);
    
    // Recargar las categorías de preguntas después de crear una nueva
    await dispatch(getCategoriasPreguntas() as any);
    
    return result;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al crear la categoría de pregunta';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const updateCategoriaPregunta = (id: number, item: any) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const result = await fetchData(`${BASE_URL}/categorias-preguntas/${id}/`, 'PUT', item);
    
    // Recargar las categorías de preguntas después de actualizar
    await dispatch(getCategoriasPreguntas() as any);
    
    return result;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al actualizar la categoría de pregunta';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const deleteCategoriaPregunta = (id: number) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const result = await fetchData(`${BASE_URL}/categorias-preguntas/${id}/`, 'DELETE');
    
    // Recargar las categorías de preguntas después de eliminar
    await dispatch(getCategoriasPreguntas() as any);
    
    return result;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al eliminar la categoría';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

// Dashboard de Líderes
export const getDashboardLiderResumen = (liderId: number, areaId?: number) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    let url = `${BASE_URL}/dashboard-lider/resumen/${liderId}/`;
    if (areaId) {
      url += `?area_id=${areaId}`;
    }
    const data = await fetchData(url, 'GET');
    return data;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al obtener resumen del dashboard de líder';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const getDashboardLiderUsuarios = (liderId: number, areaId?: number) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    let url = `${BASE_URL}/dashboard-lider/usuarios_a_cargo/${liderId}/`;
    if (areaId) {
      url += `?area_id=${areaId}`;
    }
    const data = await fetchData(url, 'GET');
    return data;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al obtener usuarios a cargo';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

// Asignaciones de Actividades Laborales
export const getAsignacionesActividadesParaLider = (liderId: number, areaId?: number) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    let url = `${BASE_URL}/asignaciones-actividades/para_lider/?lider_id=${liderId}`;
    if (areaId) {
      url += `&area_id=${areaId}`;
    }
    const data = await fetchData(url, 'GET');
    return data;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al obtener asignaciones de actividades para evaluar';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const asignarActividadesMasiva = (asignacionData: any) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const result = await fetchData(`${BASE_URL}/asignaciones-actividades/asignar_masiva/`, 'POST', asignacionData);
    
    // Recargar las asignaciones de actividades después de asignar masivamente
    await dispatch(getAsignacionesActividadesParaLider(asignacionData.lider_id, asignacionData.area_id) as any);
    
    return result;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al asignar actividades';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

// Evaluaciones de Actividades Laborales
export const getEvaluacionesActividadesParaLider = (liderId: number, areaId?: number) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    let url = `${BASE_URL}/evaluaciones-actividades/para_lider/${liderId}/`;
    if (areaId) {
      url += `?area_id=${areaId}`;
    }
    const data = await fetchData(url, 'GET');
    return data;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al obtener actividades para evaluar';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const evaluarActividadLaboral = (evaluacionData: any) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    console.log('🚀 Evaluando actividad con datos:', evaluacionData);
    
    // ✅ VALIDACIÓN: Verificar que los datos requeridos estén presentes
    if (!evaluacionData.asignacion_id || !evaluacionData.calificacion) {
      throw new Error('Datos de evaluación incompletos: asignacion_id y calificacion son requeridos');
    }
    
    const result = await fetchData(`${BASE_URL}/evaluaciones-actividades/evaluar_actividad/`, 'POST', evaluacionData);
    console.log('✅ Evaluación exitosa:', result);
    
    // ✅ LIMPIAR ERRORES después de éxito
    dispatch(setError(null));
    
    return result;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al evaluar la actividad';
    console.error('❌ Error en evaluarActividadLaboral:', error);
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

// Evaluaciones 360
export const getEvaluaciones360ParaLider = (liderId: number, areaId?: number) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    let url = `${BASE_URL}/evaluaciones-360/para_lider/${liderId}/`;
    if (areaId) {
      url += `?area_id=${areaId}`;
    }
    const data = await fetchData(url, 'GET');
    return data;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al obtener evaluaciones 360 para líder';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const getEvaluaciones360ParaCompanero = (usuarioId: number, areaId?: number) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    let url = `${BASE_URL}/evaluaciones-360/para_companero/${usuarioId}/`;
    if (areaId) {
      url += `?area_id=${areaId}`;
    }
    const data = await fetchData(url, 'GET');
    return data;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al obtener evaluaciones 360 para compañero';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const getPreguntasEvaluacion360 = (asignacionId: number) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const data = await fetchData(`${BASE_URL}/evaluaciones-360/preguntas/${asignacionId}/`, 'GET');
    return data;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al obtener preguntas de evaluación 360';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const completarEvaluacion360 = (evaluacionData: any) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    console.log('🚀 Completando evaluación 360 con datos:', evaluacionData);
    
    // ✅ VALIDACIÓN: Verificar que los datos requeridos estén presentes
    if (!evaluacionData.asignacion_id || !evaluacionData.evaluador_id || !evaluacionData.respuestas) {
      throw new Error('Datos de evaluación 360 incompletos: asignacion_id, evaluador_id y respuestas son requeridos');
    }
    
    const result = await fetchData(`${BASE_URL}/evaluaciones-360/evaluar_360/`, 'POST', evaluacionData);
    console.log('✅ Evaluación 360 completada exitosamente:', result);
    
    // ✅ LIMPIAR ERRORES después de éxito
    dispatch(setError(null));
    
    // ✅ NO recargar aquí - la recarga se hará desde el componente
    // await dispatch(getEvaluaciones360ParaLider(evaluacionData.lider_id, evaluacionData.area_id) as any);
    
    return result;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al completar evaluación 360';
    console.error('❌ Error en completarEvaluacion360:', error);
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

// Dashboard Personal de Usuario
export const getDashboardUsuario = (usuarioId: number, areaId?: number) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    let url = `${BASE_URL}/dashboard-usuario/mi_dashboard/${usuarioId}/`;
    if (areaId) {
      url += `?area_id=${areaId}`;
    }
    const data = await fetchData(url, 'GET');
    return data;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al obtener dashboard personal';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const getProgresoEvaluacion = (asignacionId: number) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const data = await fetchData(`${BASE_URL}/dashboard-usuario/progreso_evaluacion/${asignacionId}/`, 'GET');
    return data;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al obtener progreso de evaluación';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

// USUARIOS
export const getUsuarios = () => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const data = await fetchData(`${BASE_URL}/usuarios_con_perfil/`, 'GET');
    dispatch(setUsuarios(data)); // ✅ GUARDAR EN REDUX
    return data;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al obtener usuarios';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

// LÍDERES DE ACTIVIDADES
export const getLideresActividades = () => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const data = await fetchData(`${BASE_URL}/lideres-actividades/`, 'GET');
    return data;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al obtener líderes de actividades';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const createLiderActividad = (liderData: any) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const result = await fetchData(`${BASE_URL}/lideres-actividades/`, 'POST', liderData);
    
    // Recargar los líderes de actividades después de crear uno nuevo
    await dispatch(getLideresActividades() as any);
    
    return result;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al crear líder de actividad';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const updateLiderActividad = (id: number, liderData: any) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const result = await fetchData(`${BASE_URL}/lideres-actividades/${id}/`, 'PUT', liderData);
    
    // Recargar los líderes de actividades después de actualizar
    await dispatch(getLideresActividades() as any);
    
    return result;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al actualizar líder de actividad';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const deleteLiderActividad = (id: number) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const result = await fetchData(`${BASE_URL}/lideres-actividades/${id}/`, 'DELETE');
    
    // Recargar los líderes de actividades después de eliminar
    await dispatch(getLideresActividades() as any);
    
    return result;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al eliminar líder de actividad';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

// CONTRATOS DE USUARIOS
export const getContratosUsuarios = () => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const response = await fetch(`${BASE_URL}/contratos-usuarios/`);
    if (!response.ok) throw new Error("Error en la petición");
    
    const data = await response.json();
    dispatch(setContratosUsuarios(data));
    return data;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al obtener contratos de usuarios';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const createContratoUsuario = (contratoData: any) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const result = await fetchData(`${BASE_URL}/contratos-usuarios/`, 'POST', contratoData);
    
    // Recargar los contratos de usuarios después de crear uno nuevo
    await dispatch(getContratosUsuarios() as any);
    
    return result;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al crear contrato de usuario';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const updateContratoUsuario = (id: number, contratoData: any) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const result = await fetchData(`${BASE_URL}/contratos-usuarios/${id}/`, 'PUT', contratoData);
    
    // Recargar los contratos de usuarios después de actualizar
    await dispatch(getContratosUsuarios() as any);
    
    return result;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al actualizar contrato de usuario';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const deleteContratoUsuario = (id: number) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const result = await fetchData(`${BASE_URL}/contratos-usuarios/${id}/`, 'DELETE');
    
    // Recargar los contratos de usuarios después de eliminar
    await dispatch(getContratosUsuarios() as any);
    
    return result;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al eliminar contrato de usuario';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const crearContratoMasivo = (contratosData: any) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const result = await fetchData(`${BASE_URL}/contratos-usuarios/crear_contrato_masivo/`, 'POST', contratosData);
    
    // Recargar los contratos de usuarios después de crear masivamente
    await dispatch(getContratosUsuarios() as any);
    
    return result;
  } catch (error: any) {
    const errorMessage = error.message || 'Error al crear contratos masivos';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

// GESTIÓN DE HORARIO LABORAL
export const procesarArchivoHorarioLaboral = (archivo: File) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoadingHorario(true));
    
    const formData = new FormData();
    formData.append('archivo', archivo);

    const response = await fetch(`${BASE_URL}/procesar-horario-laboral/`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    dispatch(setResultadoProcesamiento(data));
    
    if (data.success && data.resultados) {
      // Convertir los resultados al formato de RegistroHorario
      const registros: any[] = data.resultados.map((item: any) => ({
        fila: item.fila,
        identificador: item.identificador,
        nombre_completo: item.nombre_completo,
        grupo: item.grupo,
        fecha: item.fecha,
        turno: item.turno,
        entro: item.entro,
        salio_manana: item.salio_manana,
        entro_tarde: item.entro_tarde,
        salio_tarde: item.salio_tarde,
        minutos_atraso: item.minutos_atraso,
        atraso_manana: item.atraso_manana,
        atraso_almuerzo: item.atraso_almuerzo,
        atraso_salida: item.atraso_salida,
        total_minutos_atraso: item.total_minutos_atraso,
        adelanto: item.adelanto,
        hea: item.hea,
        hec: item.hec,
        hnt: item.hnt,
        ht: item.ht,
        porcentaje: item.porcentaje,
        estado: item.estado,
        mensaje: item.mensaje,
        usuario_encontrado: item.usuario_encontrado,
        area: item.area,
        cargo: item.cargo,
        usuario_id: item.usuario_id
      }));
      
      dispatch(setRegistrosHorario(registros));
      
      // Si hay consolidado de usuarios, guardarlo también
      if (data.consolidado_usuarios) {
        console.log('📊 Consolidado de usuarios recibido:', data.consolidado_usuarios);
        // Aquí podrías dispatchar una acción para guardar el consolidado si lo necesitas
      }
    }
    
    return data;
  } catch (error: any) {
    const errorMessage = error.message || 'Error procesando archivo Excel';
    dispatch(setResultadoProcesamiento({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido',
      total_registros: 0,
      total_validos: 0,
      total_advertencias: 0,
      total_errores: 0,
      resultados: []
    }));
    throw error;
  } finally {
    dispatch(setLoadingHorario(false));
  }
};

export const obtenerRegistrosHorario = (filtros?: {
  fecha?: string;
  identificacion?: string;
  grupo_area?: string;
}) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoadingHorario(true));
    
    let url = `${BASE_URL}/horarios-laborales/`;
    
    if (filtros) {
      const params = new URLSearchParams();
      if (filtros.fecha) params.append('fecha', filtros.fecha);
      if (filtros.identificacion) params.append('identificacion', filtros.identificacion);
      if (filtros.grupo_area) params.append('grupo_area', filtros.grupo_area);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    const registros = data.results || data;
    
    // ✅ SIEMPRE ACTUALIZAR EL ESTADO CON LOS REGISTROS DE BD
    // Para producción: siempre mostrar los datos de la BD
    dispatch(setRegistrosHorario(registros || []));
    console.log('📊 Registros cargados desde BD:', registros?.length || 0);
    
    return registros;
  } catch (error: any) {
    const errorMessage = error.message || 'Error obteniendo registros';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoadingHorario(false));
  }
};

export const obtenerResumenHorarioPorFecha = (fecha: string) => async (dispatch: Dispatch<any>) => {
  try {
    const response = await fetch(`${BASE_URL}/horarios-laborales/resumen_por_fecha/?fecha=${fecha}`);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    const errorMessage = error.message || 'Error obteniendo resumen por fecha';
    dispatch(setError(errorMessage));
    throw error;
  }
};

export const obtenerEstadisticasHorarioUsuario = (identificacion: string, fechaInicio?: string, fechaFin?: string) => async (dispatch: Dispatch<any>) => {
  try {
    let url = `${BASE_URL}/horarios-laborales/estadisticas_usuario/?identificacion=${identificacion}`;
    
    if (fechaInicio) url += `&fecha_inicio=${fechaInicio}`;
    if (fechaFin) url += `&fecha_fin=${fechaFin}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    const errorMessage = error.message || 'Error obteniendo estadísticas de usuario';
    dispatch(setError(errorMessage));
    throw error;
  }
};

// ✅ NUEVO THUNK PARA GUARDAR REGISTROS CONSOLIDADOS EN BD
export const guardarRegistroHorarioLaboral = (registro: any) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoadingHorario(true));
    
    const result = await fetchData(`${BASE_URL}/horarios-laborales/`, 'POST', registro);
    
    return result;
  } catch (error: any) {
    const errorMessage = error.message || 'Error guardando registro en BD';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoadingHorario(false));
  }
};

// ✅ NUEVO THUNK PARA CONTRATOS URGENTES DEL DASHBOARD
export const getContratosUrgentesDashboard = (filtros?: {
  usuario_id?: number;
  area_id?: number;
  limit?: number;
}) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    let url = `${BASE_URL}/contratos-usuarios/dashboard_contratos_urgentes/`;
    
    if (filtros) {
      const params = new URLSearchParams();
      if (filtros.usuario_id) params.append('usuario_id', filtros.usuario_id.toString());
      if (filtros.area_id) params.append('area_id', filtros.area_id.toString());
      if (filtros.limit) params.append('limit', filtros.limit.toString());
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }

    const data = await fetchData(url, 'GET');
    
    if (data.success) {
      return data;
    } else {
      throw new Error(data.error || 'Error obteniendo contratos urgentes');
    }
    
  } catch (error: any) {
    const errorMessage = error.message || 'Error al obtener contratos urgentes del dashboard';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

// ✅ THUNK PARA VALIDAR CONTRATO DE EVALUACIÓN
export const validarContratoEvaluacion = (usuario_id: number, area_id: number) => async (dispatch: Dispatch<any>) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const url = `${BASE_URL}/contratos-usuarios/validar_contrato_evaluacion/?usuario_id=${usuario_id}&area_id=${area_id}`;
    const data = await fetchData(url, 'GET');
    
    if (data.success) {
      return data.validacion;
    } else {
      throw new Error(data.error || 'Error validando contrato');
    }
    
  } catch (error: any) {
    const errorMessage = error.message || 'Error al validar contrato para evaluación';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};