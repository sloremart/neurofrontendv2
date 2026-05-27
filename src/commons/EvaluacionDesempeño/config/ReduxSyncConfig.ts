/**
 * CONFIGURACIÓN CENTRAL PARA SINCRONIZACIÓN ROBUSTA DE REDUX
 * 
 * Este archivo contiene la solución para los problemas de sincronización
 * que afectan a todos los componentes de la aplicación de evaluación de desempeño.
 * 
 * PROBLEMAS SOLUCIONADOS:
 * 1. Store no se actualiza inmediatamente después de operaciones CRUD
 * 2. Estados se resetean en producción
 * 3. Sincronización asíncrona lenta
 * 4. Falta de respaldo cuando el store falla
 */

import { useEffect, useState } from 'react';

/**
 * Hook personalizado para sincronización robusta de Redux
 * @param selector - Selector de Redux
 * @param action - Acción para cargar datos
 * @param backupKey - Clave para localStorage
 * @param dependencies - Dependencias adicionales
 */
export const useRobustReduxSync = (
  selector: (state: any) => any[],
  action: () => any,
  backupKey: string,
  dependencies: any[] = []
) => {
  const [localState, setLocalState] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Sincronizar estado local con store
  useEffect(() => {
    const data = selector;
    if (data && data.length > 0) {
      console.log(`🔄 Sincronizando ${backupKey} con store:`, data);
      setLocalState(data);
      
      // Guardar en localStorage como respaldo
      try {
        localStorage.setItem(`${backupKey}_backup`, JSON.stringify(data));
        console.log(`🔄 ${backupKey} guardados en localStorage como respaldo`);
      } catch (error) {
        console.log(`🔄 No se pudo guardar backup de ${backupKey}:`, error);
      }
    }
  }, [selector, backupKey]);

  // Restaurar desde localStorage si el store se resetea
  useEffect(() => {
    const restaurarDesdeBackup = () => {
      try {
        const backup = localStorage.getItem(`${backupKey}_backup`);
        if (backup && (!selector || selector.length === 0)) {
          const dataBackup = JSON.parse(backup);
          console.log(`🔄 Restaurando ${backupKey} desde backup:`, dataBackup);
          setLocalState(dataBackup);
        }
      } catch (error) {
        console.log(`🔄 Error al restaurar ${backupKey} desde backup:`, error);
      }
    };

    if (!selector || selector.length === 0) {
      console.log(`🔄 Store vacío para ${backupKey}, verificando backup...`);
      restaurarDesdeBackup();
    }
  }, [selector, backupKey]);

  // Función para sincronización forzada
  const forceSync = async () => {
    try {
      console.log(`🔄 SINCRONIZANDO: Recargando ${backupKey} desde backend...`);
      await action();
      
      // Verificación adicional después de 500ms
      setTimeout(async () => {
        console.log(`🔄 VERIFICACIÓN: Recargando ${backupKey} nuevamente para asegurar sincronización...`);
        await action();
      }, 500);
    } catch (error) {
      console.error(`❌ Error al sincronizar ${backupKey}:`, error);
    }
  };

  // Función para cargar datos inicialmente
  const loadInitialData = async () => {
    try {
      console.log(`🚀 Iniciando carga inicial de ${backupKey}...`);
      setLoading(true);
      
      await action();
      console.log(`✅ ${backupKey} cargados inicialmente`);
      
      // Sincronización forzada inicial
      await forceSync();
      
      setLoading(false);
    } catch (error) {
      console.error(`❌ Error al cargar ${backupKey} inicialmente:`, error);
      setLoading(false);
    }
  };

  // Estado a mostrar (store o local como respaldo)
  const stateToDisplay = selector && selector.length > 0 ? selector : localState;

  return {
    localState,
    setLocalState,
    loading,
    setLoading,
    forceSync,
    loadInitialData,
    stateToDisplay
  };
};

/**
 * Función para aplicar sincronización robusta a operaciones CRUD
 * @param operation - Operación CRUD (create, update, delete)
 * @param syncAction - Acción para sincronizar
 * @param backupKey - Clave para localStorage
 * @param currentData - Datos actuales del store
 * @param setLocalState - Función para actualizar estado local
 */
export const robustCRUDOperation = async (
  operation: () => Promise<any>,
  syncAction: () => Promise<any>,
  backupKey: string,
  currentData: any[],
  setLocalState: (data: any[]) => void
) => {
  try {
    console.log(`🔄 Ejecutando operación CRUD para ${backupKey}...`);
    
    // Ejecutar operación
    const result = await operation();
    console.log(`✅ Operación CRUD completada para ${backupKey}:`, result);
    
    // Sincronización forzada inmediata
    console.log(`🔄 SINCRONIZANDO: Recargando ${backupKey} después de operación...`);
    await syncAction();
    
    // Verificación adicional después de 500ms
    setTimeout(async () => {
      console.log(`🔄 VERIFICACIÓN: Recargando ${backupKey} nuevamente para asegurar sincronización...`);
      await syncAction();
    }, 500);
    
    return result;
  } catch (error) {
    console.error(`❌ Error en operación CRUD para ${backupKey}:`, error);
    
    // Restaurar desde backup en caso de error
    try {
      const backup = localStorage.getItem(`${backupKey}_backup`);
      if (backup) {
        const dataBackup = JSON.parse(backup);
        setLocalState(dataBackup);
        console.log(`🔄 Restaurando ${backupKey} desde backup después del error`);
      }
    } catch (backupError) {
      console.log(`🔄 No se pudo restaurar ${backupKey} desde backup:`, backupError);
    }
    
    throw error;
  }
};

/**
 * Configuración de claves para localStorage
 */
export const BACKUP_KEYS = {
  AREAS: 'areas',
  TIPOS_COMPONENTE: 'tipos_componente',
  COMPONENTES: 'componentes',
  ACTIVIDADES: 'actividades',
  EVALUACIONES: 'evaluaciones',
  PREGUNTAS_360: 'preguntas_360',
  CATEGORIAS_PREGUNTAS: 'categorias_preguntas',
  USUARIOS: 'usuarios',
  LIDERES: 'lideres',
  CONTRATOS: 'contratos'
};

/**
 * Mensajes de log estandarizados
 */
export const LOG_MESSAGES = {
  SYNC_START: (key: string) => `🔄 Sincronizando ${key} con store...`,
  SYNC_SUCCESS: (key: string) => `✅ ${key} sincronizados exitosamente`,
  SYNC_ERROR: (key: string) => `❌ Error al sincronizar ${key}`,
  BACKUP_SAVE: (key: string) => `🔄 ${key} guardados en localStorage como respaldo`,
  BACKUP_RESTORE: (key: string) => `🔄 Restaurando ${key} desde backup...`,
  LOAD_START: (key: string) => `🚀 Iniciando carga inicial de ${key}...`,
  LOAD_SUCCESS: (key: string) => `✅ ${key} cargados inicialmente`,
  CRUD_START: (key: string) => `🔄 Ejecutando operación CRUD para ${key}...`,
  CRUD_SUCCESS: (key: string) => `✅ Operación CRUD completada para ${key}`,
  CRUD_ERROR: (key: string) => `❌ Error en operación CRUD para ${key}`
};

