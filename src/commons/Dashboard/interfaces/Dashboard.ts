export interface Servicio {
  nombre: string;
  total: number;
}

export interface UsuarioAgendamiento {
  nombre: string;
  citas: number;
}

export interface EntidadResumenAgendada {
  nombre: string;
  citas: number;
}

export interface EntidadFacturacion {
  entidad: string;
  servicios: Servicio[];
}

export interface Movimiento {
  NIT: string;
  NombreTercero: string;
  Cuenta: string;
  NombreCuenta: string;
  Credito: number;
}

export interface DocumentoRecaudo {
  Documento: string;
  Detalle: string;
  FechaCreado: string;
  CuentaBanco: string;
  NombreBanco: string;
  ValorTotal: number;
  Movimientos: Movimiento[];
}

// ── Médicos y citas ────────────────────────────────────────────────────────
export interface Medico {
  cedula: string;
  nombre: string;
}

export interface CitaMedico {
  id: number;
  fecha: string;
  hora: string;
  estado: string;
  nombre_paciente: string;
  cedula_paciente: string;
  telefono_paciente: string;
  entidad: string;
  fecha_confirmacion?: string;
  fecha_cancelacion?: string;
}

export interface EstadisticasCitas {
  total: number;
  confirmadas: number;
  canceladas: number;
  pendientes: number;
}

export interface ResponseMedicos {
  medicos: Medico[];
}

export interface ResponseCitasMedico {
  citas: CitaMedico[];
  estadisticas: EstadisticasCitas;
}

// ── Producción mensual ─────────────────────────────────────────────────────
export interface ProduccionDatoMes {
  mes: string;
  cantidad: number;
  valor: number;
}

export interface ProduccionSerie {
  servicio: string;
  ufuncional: number | null;
  datos: ProduccionDatoMes[];
  total_cantidad: number;
  total_valor: number;
}

export interface ProduccionMensualData {
  meses: string[];
  series: ProduccionSerie[];
  total_cantidad: number;
  total_valor: number;
}

// ── Resultados de estudios ─────────────────────────────────────────────────
export interface ResultadosTipoExamen {
  tipo: string;
  cantidad: number;
  dias_promedio: number;
}

export interface ResultadosTimeline {
  mes: string;
  entregados: number;
  realizados: number;
  dias_promedio: number;
}

export interface EstudioPendiente {
  estudio: number;
  fecha: string;
  servicio: string;
  entidad: string;
}

export interface ResultadosEstudiosData {
  total_resultados: number;
  admisiones_con_resultado: number;
  por_tipo_examen: ResultadosTipoExamen[];
  timeline: ResultadosTimeline[];
  pendientes_30d: EstudioPendiente[];
  pendientes_30d_total: number;
}
