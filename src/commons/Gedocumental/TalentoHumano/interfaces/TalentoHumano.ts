
export interface ITalentoHumano {
  admision_cuentas_medicas: IObjAdmisionCuentasMedicas[],
  admision_pendientes_facturacion: IObjAdmisionPendientes[],
  hallazgo: Hallazgo[],
  consolidadoestudios: IObjConsolidadoEstudios[],
  profesionales: IObjProfesionales[],
  estudios_medico_asignado: IObjConsolidadoEstudios[],

}


export interface IObjAdmision {
  observacionAdicional: string;
  IdArchivo?: number;
  Admision_id?: number | null;
  Tipo?: string | null;
  NombreArchivo?: string | null;
  RutaArchivo?: string | null;
  NumeroAdmision?: number | null;
  FechaCreacionArchivo?: string | null;
  Observacion?: string | null;
  RevisionPrimera?: boolean;
  RevisionSegunda?: boolean;
  RevisionTercera?: boolean;
  EditorVisible?: boolean;
  Regimen?: string | null;
  FechaCreacionAntares?: string | null;
  Observaciones?: Observacion[] | null;
  initialObservation?: string;
  NuevaObservacion?: string;
  nombreArchivoCargado?: string;
  FechaRecienteObservacion?: string;
  selectedHallazgo?: number | null;
  Apellido1?: string | null;
  Apelliido2?: string | null;
  Nombre1?: string | null;
  Nombre2?: string | null;
}

export interface Observacion {
  IdObservacion: number;
  FechaObservacion: string;
  Descripcion: string;
  IdArchivo?: number;
}

export interface IObjAdmisionCuentasMedicas {
  AdmisionId?: number | null;
  FechaCreacion?: number | null;
  FechaCargueArchivo?: number | null;
  FechaCreacionAntares?: string | null;
  FechaCreacionArchivo?: string | null;
  Observacion?: string;
  RevisionCuentasMedicas?: boolean;
  RevisionTesoreria?: boolean;
  Consecutivo?: number | null;
  IdPaciente?: number | null;
  CodigoEntidad?: string;
  ContratoAlias?: string;
  NombreResponsable?: string;
  FacturaNo?: number | null;
  FechaRecienteObservacion?: string;
  Radicado?: boolean;
}

export interface IObjAdmisionPendientes {
  Consecutivo?: number | null;
  IdPaciente?: number | null;
  CodigoEntidad?: string;
  NombreResponsable?: string;
  FacturaNo?: number | null;
  Observacion?: string;
  FechaRecienteObservacion?: string;
}

export interface Hallazgo {
  id: number;
  descripcion: string;
}

export interface IObjConsolidadoEstudios {
  IdCita?: number | null;
  AdmisionNo?: number | null;
  FeCita?: string;
  IdMedico?: string;
  NumeroPaciente?: number | null;
  CUPS?: string;
  Cantidad?: number;
  NCompleto?: string;
  CodigoEntidad?: string;
  ResultadoArchivos?: string;
  DescripcionCUPS?: string;
  NombreMedico?: string;
  id?: number | null;
  Admision?: number | null;
  FechaCita?: string;
  NombreCompleto?: string;
  DescripcionCups?: string;
  ResultadoArchivo?: string;
  
}

export interface IObjProfesionales {
  IdUsuario?: number | null;
  NombreReal?: string | null;
 
}

