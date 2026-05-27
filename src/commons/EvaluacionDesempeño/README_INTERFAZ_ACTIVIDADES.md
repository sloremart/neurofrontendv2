# 🎯 **Interfaz de Gestión de Actividades de Desempeño**

## 📋 **Resumen**

He creado una interfaz completa para gestionar líderes y contratos de actividades de desempeño, integrada en el dashboard principal de Evaluación Neurodx.

## 🚀 **Componentes Creados**

### **1. GestionLideresForm.tsx**
- **Ubicación**: `src/commons/EvaluacionDesempeño/components/`
- **Funcionalidad**: Gestión completa de líderes de actividades
- **Características**:
  - ✅ Crear nuevos líderes
  - ✅ Editar líderes existentes
  - ✅ Eliminar líderes
  - ✅ Asignar líderes a áreas específicas
  - ✅ Configurar fechas de vigencia
  - ✅ Definir tipos de actividad

### **2. GestionContratosForm.tsx**
- **Ubicación**: `src/commons/EvaluacionDesempeño/components/`
- **Funcionalidad**: Gestión completa de contratos de usuarios
- **Características**:
  - ✅ Crear contratos individuales
  - ✅ Creación masiva de contratos
  - ✅ Editar contratos existentes
  - ✅ Eliminar contratos
  - ✅ Asignar usuarios a áreas
  - ✅ Configurar tipos de contrato
  - ✅ Gestionar fechas y salarios

### **3. Configuración de API (api.ts)**
- **Ubicación**: `src/commons/EvaluacionDesempeño/config/`
- **Funcionalidad**: Centralización de endpoints y funciones HTTP
- **Características**:
  - ✅ URLs centralizadas para todos los endpoints
  - ✅ Funciones helper para GET, POST, PUT, DELETE
  - ✅ Headers por defecto
  - ✅ Manejo de errores centralizado

## 🎨 **Integración en el Dashboard**

### **Nuevas Opciones en el Menú:**

#### **Configuración del Sistema**
- **Gestión de Líderes** 🎯
  - Configurar líderes para actividades de desempeño
  - Asignar líderes a áreas específicas
  - Gestionar fechas de vigencia

- **Gestión de Contratos** 📝
  - Crear contratos para usuarios
  - Creación masiva de contratos
  - Gestionar información laboral

## 🔧 **Cómo Usar la Interfaz**

### **Paso 1: Acceder a la Gestión**
1. Abrir el dashboard de Evaluación Neurodx
2. En el menú izquierdo, expandir "Configuración del Sistema"
3. Seleccionar "Gestión de Líderes" o "Gestión de Contratos"

### **Paso 2: Configurar Líderes**
1. **Seleccionar Área**: Elegir el área organizacional
2. **ID del Líder**: Ingresar el ID del usuario que será líder
3. **Tipo de Actividad**: Seleccionar el tipo (Funciones de Contrato, Actividades Diarias, etc.)
4. **Fechas**: Configurar fechas de inicio y fin (opcional)
5. **Estado**: Activar o desactivar el liderazgo
6. **Guardar**: Crear o actualizar el líder

### **Paso 3: Configurar Contratos**
1. **Contrato Individual**:
   - ID del Usuario
   - Área asignada
   - Tipo de contrato
   - Cargo
   - Salario (opcional)
   - Fechas de inicio y fin
   - Estado activo/inactivo

2. **Creación Masiva**:
   - Seleccionar área
   - Agregar múltiples usuarios
   - Configurar datos para cada usuario
   - Crear todos los contratos de una vez

## 📱 **Endpoints de la API Utilizados**

### **Líderes de Actividades:**
```
GET    /api/lideres-actividades/                    # Listar líderes
POST   /api/lideres-actividades/                    # Crear líder
PUT    /api/lideres-actividades/{id}/               # Actualizar líder
DELETE /api/lideres-actividades/{id}/               # Eliminar líder
GET    /api/lideres-actividades/lideres_vigentes/   # Líderes vigentes
```

### **Contratos de Usuarios:**
```
GET    /api/contratos-usuarios/                     # Listar contratos
POST   /api/contratos-usuarios/                     # Crear contrato
PUT    /api/contratos-usuarios/{id}/                # Actualizar contrato
DELETE /api/contratos-usuarios/{id}/                # Eliminar contrato
POST   /api/contratos-usuarios/crear_contrato_masivo/  # Creación masiva
GET    /api/contratos-usuarios/contratos_vigentes/  # Contratos vigentes
```

## 🎯 **Flujo de Trabajo Recomendado**

### **1. Configuración Inicial:**
1. **Crear Áreas** (si no existen)
2. **Configurar Líderes** para cada área
3. **Crear Contratos** para los usuarios

### **2. Gestión Diaria:**
1. **Asignar Actividades** a usuarios
2. **Líderes evalúan** las actividades
3. **Sistema valida** permisos automáticamente

### **3. Mantenimiento:**
1. **Actualizar líderes** cuando cambien
2. **Renovar contratos** cuando venzan
3. **Gestionar cambios** de área

## 🔍 **Características Técnicas**

### **Validaciones Implementadas:**
- ✅ **Líderes**: No solapamiento de fechas para el mismo área
- ✅ **Contratos**: Fechas coherentes según tipo de contrato
- ✅ **Áreas**: Verificación de existencia antes de asignar
- ✅ **Usuarios**: Validación de IDs antes de crear contratos

### **Funcionalidades Avanzadas:**
- 🔄 **Creación Masiva**: Múltiples contratos en una operación
- 📅 **Gestión de Fechas**: Vigencia automática de contratos
- 🎯 **Tipos de Actividad**: Categorización de actividades
- 📊 **Estado en Tiempo Real**: Indicadores visuales de estado

## 🚨 **Consideraciones Importantes**

### **Antes de Usar:**
1. **Verificar que el backend esté funcionando**
2. **Confirmar que las tablas estén creadas**
3. **Ejecutar los comandos de configuración** si es necesario

### **Datos Requeridos:**
1. **Áreas organizacionales** configuradas
2. **Usuarios existentes** en el sistema
3. **Permisos adecuados** para gestionar datos

### **Validaciones del Sistema:**
1. **Líderes únicos** por área y tipo de actividad
2. **Contratos vigentes** para usuarios activos
3. **Fechas coherentes** entre inicio y fin

## 🎉 **Resultado Esperado**

Después de configurar la interfaz tendrás:
- ✅ **Dashboard integrado** con gestión de actividades
- ✅ **Formularios intuitivos** para líderes y contratos
- ✅ **Validaciones automáticas** de datos
- ✅ **Gestión masiva** de contratos
- ✅ **Interfaz responsive** y moderna
- ✅ **Integración completa** con el sistema existente

## 🔧 **Solución de Problemas**

### **Error: "No se pueden cargar áreas"**
- Verificar que el backend esté funcionando
- Confirmar que exista al menos un área en la base de datos

### **Error: "No se pueden cargar líderes"**
- Verificar que la tabla `LiderActividad` esté creada
- Ejecutar el comando de configuración si es necesario

### **Error: "No se pueden cargar contratos"**
- Verificar que la tabla `ContratoUsuario` esté creada
- Confirmar que existan contratos en la base de datos

### **Problemas de CORS:**
- Verificar configuración del backend
- Confirmar que las URLs de la API sean correctas

## 📞 **Soporte**

Para problemas técnicos:
1. **Revisar logs** del navegador (F12)
2. **Verificar endpoints** en la configuración de la API
3. **Confirmar estado** del backend
4. **Revisar permisos** de usuario

¡La interfaz está lista para usar y gestionar completamente el sistema de actividades de desempeño! 🚀
