export interface Nits {
  CuentaNit: number;
  NombreNit?: string | null;
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
  TipoHallazgo?: string | null;
  estado?: string;
  observacionesTexto?: string;
}

export interface Observacion {
  IdObservacion: number;
  FechaObservacion: string;
  Descripcion: string;
  IdArchivo?: number;
}
