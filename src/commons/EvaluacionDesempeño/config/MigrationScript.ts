/**
 * SCRIPT DE MIGRACIÓN AUTOMÁTICA PARA SINCRONIZACIÓN ROBUSTA DE REDUX
 * 
 * Este script aplica automáticamente la solución robusta de sincronización
 * a todos los componentes de la aplicación de evaluación de desempeño.
 * 
 * USO:
 * 1. Importar este script en cada componente
 * 2. Reemplazar la lógica existente con las funciones robustas
 * 3. Aplicar el hook useRobustReduxSync
 */

import { useRobustReduxSync, robustCRUDOperation, BACKUP_KEYS } from './ReduxSyncConfig';

/**
 * PLANTILLA PARA COMPONENTES DE ÁREAS
 */
export const useAreasRobustSync = (dispatch: any) => {
  const selector = (state: any) => state.evaluacion?.areas || [];
  const action = () => dispatch(getAreas() as any);
  
  return useRobustReduxSync(selector, action, BACKUP_KEYS.AREAS);
};

/**
 * PLANTILLA PARA COMPONENTES DE TIPOS DE COMPONENTE
 */
export const useTiposComponenteRobustSync = (dispatch: any) => {
  const selector = (state: any) => state.evaluacion?.tipos_componente || [];
  const action = () => dispatch(getTiposComponente() as any);
  
  return useRobustReduxSync(selector, action, BACKUP_KEYS.TIPOS_COMPONENTE);
};

/**
 * PLANTILLA PARA COMPONENTES DE COMPONENTES
 */
export const useComponentesRobustSync = (dispatch: any) => {
  const selector = (state: any) => state.evaluacion?.componentes || [];
  const action = () => dispatch(getComponentes() as any);
  
  return useRobustReduxSync(selector, action, BACKUP_KEYS.COMPONENTES);
};

/**
 * PLANTILLA PARA COMPONENTES DE ACTIVIDADES
 */
export const useActividadesRobustSync = (dispatch: any) => {
  const selector = (state: any) => state.evaluacion?.actividades || [];
  const action = () => dispatch(getActividades() as any);
  
  return useRobustReduxSync(selector, action, BACKUP_KEYS.ACTIVIDADES);
};

/**
 * PLANTILLA PARA COMPONENTES DE EVALUACIONES
 */
export const useEvaluacionesRobustSync = (dispatch: any) => {
  const selector = (state: any) => state.evaluacion?.evaluaciones || [];
  const action = () => dispatch(getEvaluaciones() as any);
  
  return useRobustReduxSync(selector, action, BACKUP_KEYS.EVALUACIONES);
};

/**
 * PLANTILLA PARA COMPONENTES DE PREGUNTAS 360
 */
export const usePreguntas360RobustSync = (dispatch: any) => {
  const selector = (state: any) => state.evaluacion?.preguntas360 || [];
  const action = () => dispatch(getPreguntas360() as any);
  
  return useRobustReduxSync(selector, action, BACKUP_KEYS.PREGUNTAS_360);
};

/**
 * PLANTILLA PARA COMPONENTES DE CATEGORÍAS DE PREGUNTAS
 */
export const useCategoriasPreguntasRobustSync = (dispatch: any) => {
  const selector = (state: any) => state.evaluacion?.categoriasPreguntas || [];
  const action = () => dispatch(getCategoriasPreguntas() as any);
  
  return useRobustReduxSync(selector, action, BACKUP_KEYS.CATEGORIAS_PREGUNTAS);
};

/**
 * PLANTILLA PARA COMPONENTES DE USUARIOS
 */
export const useUsuariosRobustSync = (dispatch: any) => {
  const selector = (state: any) => state.evaluacion?.usuarios || [];
  const action = () => dispatch(getUsuariosConPerfil() as any);
  
  return useRobustReduxSync(selector, action, BACKUP_KEYS.USUARIOS);
};

/**
 * FUNCIÓN PARA APLICAR SINCRONIZACIÓN ROBUSTA A OPERACIONES CRUD DE ÁREAS
 */
export const robustAreaCRUD = async (
  operation: () => Promise<any>,
  dispatch: any,
  currentAreas: any[],
  setLocalAreas: (data: any[]) => void
) => {
  const syncAction = () => dispatch(getAreas() as any);
  return robustCRUDOperation(operation, syncAction, BACKUP_KEYS.AREAS, currentAreas, setLocalAreas);
};

/**
 * FUNCIÓN PARA APLICAR SINCRONIZACIÓN ROBUSTA A OPERACIONES CRUD DE TIPOS DE COMPONENTE
 */
export const robustTipoComponenteCRUD = async (
  operation: () => Promise<any>,
  dispatch: any,
  currentTipos: any[],
  setLocalTipos: (data: any[]) => void
) => {
  const syncAction = () => dispatch(getTiposComponente() as any);
  return robustCRUDOperation(operation, syncAction, BACKUP_KEYS.TIPOS_COMPONENTE, currentTipos, setLocalTipos);
};

/**
 * FUNCIÓN PARA APLICAR SINCRONIZACIÓN ROBUSTA A OPERACIONES CRUD DE COMPONENTES
 */
export const robustComponenteCRUD = async (
  operation: () => Promise<any>,
  dispatch: any,
  currentComponentes: any[],
  setLocalComponentes: (data: any[]) => void
) => {
  const syncAction = () => dispatch(getComponentes() as any);
  return robustCRUDOperation(operation, syncAction, BACKUP_KEYS.COMPONENTES, currentComponentes, setLocalComponentes);
};

/**
 * FUNCIÓN PARA APLICAR SINCRONIZACIÓN ROBUSTA A OPERACIONES CRUD DE ACTIVIDADES
 */
export const robustActividadCRUD = async (
  operation: () => Promise<any>,
  dispatch: any,
  currentActividades: any[],
  setLocalActividades: (data: any[]) => void
) => {
  const syncAction = () => dispatch(getActividades() as any);
  return robustCRUDOperation(operation, syncAction, BACKUP_KEYS.ACTIVIDADES, currentActividades, setLocalActividades);
};

/**
 * EJEMPLO DE USO EN UN COMPONENTE:
 * 
 * import { useAreasRobustSync, robustAreaCRUD } from '../config/MigrationScript';
 * 
 * export default function MiComponente() {
 *   const dispatch = useDispatch();
 *   const { stateToDisplay, loading, setLoading, localState, setLocalState } = useAreasRobustSync(dispatch);
 *   
 *   const handleSubmit = async () => {
 *     try {
 *       setLoading(true);
 *       
 *       await robustAreaCRUD(
 *         () => dispatch(createArea(data) as any),
 *         dispatch,
 *         areas,
 *         setLocalState
 *       );
 *       
 *       setLoading(false);
 *     } catch (error) {
 *       console.error('Error:', error);
 *       setLoading(false);
 *     }
 *   };
 *   
 *   return (
 *     <div>
 *       {loading ? <p>Cargando...</p> : (
 *         <div>
 *           {stateToDisplay.map(item => <div key={item.id}>{item.nombre}</div>)}
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 */

