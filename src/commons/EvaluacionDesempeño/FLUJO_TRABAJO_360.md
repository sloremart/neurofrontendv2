# 🎯 FLUJO DE TRABAJO - EVALUACIONES 360°

## 📋 **ORDEN DE CREACIÓN RECOMENDADO**

### **1️⃣ ÁREAS** ✅ (Ya configuradas)
- CALLCENTER
- FINANCIERO
- SISTEMAS
- DIRECTIVO
- etc.

### **2️⃣ TIPOS DE COMPONENTE** ✅ (Ya configurados)
- **DESEMPEÑO LABORAL** (50%) - Evaluación tradicional
- **EVALUACIÓN DE CUMPLIMIENTO** (30%) - Cumplimiento y capacitaciones  
- **Evaluación 360°** (20%) - Retroalimentación 360°

### **3️⃣ COMPONENTES** ✅ (Ya configurados)
- **No 360°:**
  - "DESEMPEÑO LABORAL - CALLCENTER" (es_360: false)
  - "EVALUACIÓN DE CUMPLIMIENTO - DIRECTIVO" (es_360: false)
  
- **Sí 360°:**
  - "Evaluación 360° - CALLCENTER" (es_360: true)
  - "Evaluación 360° - FINANCIERO" (es_360: true)

### **4️⃣ CATEGORÍAS DE PREGUNTAS 360°** 🆕 (Nuevo)
- **Liderazgo** - Capacidad de liderar equipos y tomar decisiones
- **Trabajo en Equipo** - Colaboración y trabajo efectivo con otros
- **Comunicación** - Habilidades de comunicación verbal y escrita
- **Innovación** - Creatividad y mejora de procesos
- **Gestión del Tiempo** - Organización y priorización de tareas
- **Resolución de Problemas** - Análisis y solución de conflictos
- **Adaptabilidad** - Flexibilidad ante cambios y nuevas situaciones
- **Orientación a Resultados** - Enfoque en alcanzar objetivos

### **5️⃣ PREGUNTAS 360°** 🆕 (Mejorado)
Ahora con categorías organizadas:
- **Liderazgo:**
  - "¿Cómo evalúa la capacidad de liderazgo de esta persona?"
  - "¿Qué tan efectivo es tomando decisiones difíciles?"

- **Trabajo en Equipo:**
  - "¿Qué tan bien colabora esta persona con otros?"
  - "¿Contribuye positivamente al trabajo en equipo?"

### **6️⃣ EVALUACIONES**
- Crear evaluación asignando el componente 360°
- Asignar evaluadores (líder, pares, subordinados)

---

## 🎯 **TIPOS DE EVALUACIÓN**

### **360° COMPLETO**
- **Autoevaluación** - La persona se evalúa a sí misma
- **Evaluación del Líder** - Su jefe directo
- **Evaluación de Pares** - Compañeros del mismo nivel
- **Evaluación de Subordinados** - Personas que reportan a él

### **180°**
- **Autoevaluación** - La persona se evalúa a sí misma
- **Evaluación del Líder** - Su jefe directo

### **90°**
- **Solo Evaluación del Líder** - Su jefe directo

---

## 📊 **EJEMPLO PRÁCTICO**

### **Paso 1: Crear Categorías**
1. Ir a "Categorías de Preguntas 360°"
2. Crear categoría "Liderazgo"
3. Asignar al componente "Evaluación 360° - CALLCENTER"

### **Paso 2: Crear Preguntas**
1. Ir a "Preguntas 360°"
2. Seleccionar componente "Evaluación 360° - CALLCENTER"
3. Seleccionar categoría "Liderazgo"
4. Crear pregunta: "¿Cómo evalúa la capacidad de liderazgo de esta persona?"
5. Tipo: LIKERT, Peso: 1.00, Obligatoria: Sí

### **Paso 3: Crear Evaluación**
1. Ir a "Evaluación"
2. Crear nueva evaluación
3. Seleccionar usuario evaluado
4. Tipo: 360°
5. Componente: "Evaluación 360° - CALLCENTER"

### **Paso 4: Asignar Evaluadores**
- El sistema automáticamente asignará:
  - Líder del área
  - Compañeros del mismo nivel
  - Subordinados (si los tiene)

---

## 🔧 **CONFIGURACIÓN TÉCNICA**

### **Backend (Ya implementado)**
- ✅ Modelos: `CategoriaPregunta`, `PreguntaComponente360`
- ✅ Serializers: Validaciones y campos calculados
- ✅ Viewsets: Endpoints para CRUD
- ✅ Servicios: Lógica de negocio

### **Frontend (Implementado)**
- ✅ `Preguntas360Form` - Con selector de categorías
- ✅ `CategoriaPreguntaForm` - Gestión de categorías
- ✅ Filtros por componentes 360°
- ✅ Validaciones de formularios

---

## 📈 **BENEFICIOS DE ESTA ESTRUCTURA**

1. **Organización Clara** - Preguntas categorizadas por competencias
2. **Flexibilidad** - Fácil agregar nuevas categorías
3. **Escalabilidad** - Sistema preparado para crecer
4. **Análisis Detallado** - Reportes por categoría de competencia
5. **Personalización** - Diferentes categorías por área/componente

---

## 🚀 **PRÓXIMOS PASOS**

1. **Implementar thunks** para categorías en el backend
2. **Conectar CategoriaPreguntaForm** con el backend
3. **Agregar filtros** por categoría en las preguntas
4. **Crear reportes** por categoría de competencia
5. **Implementar plantillas** de evaluación predefinidas

---

## 💡 **RECOMENDACIONES**

- **Comenzar con pocas categorías** y expandir según necesidad
- **Usar pesos diferentes** para categorías más importantes
- **Revisar preguntas** periódicamente para mantener relevancia
- **Capacitar evaluadores** en el uso del sistema 360°
- **Generar reportes** de tendencias por categoría 