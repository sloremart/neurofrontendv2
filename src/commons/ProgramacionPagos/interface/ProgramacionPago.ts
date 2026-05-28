
export interface IProgramacionPago {
    facturas: Facturas[];
    cuentas: Cuentas[];
    nits: Nits[];
    ciclopagos: CicloPagos[];
    gestion_pagos_aprobados: CicloPagos[];
    loading: boolean;
    egresos: Egreso[];
    archivos: IObjAdmision[];
}

export interface Facturas {
  Id?: string;
  Cuenta: number;
  NombreCuenta?: string | null;
  Nit: number;
  NombreNit?: string | null;
  Sucursal?: string | null;
  Documento?: string | null;
  Fecha?: string | null;
  FechaVence?: string | null;
  Debito?: string | null;
  Credito?: string | null;
  IdArchivo?: string | null;
}

export interface Cuentas {
  Cuenta: number;
  Nombre?: string | null;
}

export interface Nits {
  CuentaNit: number;
  NombreNit?: string | null;
}

export interface CicloPagos {
  Id?: number | null;
  Fecha?: string | null;
  FechaVence?: string | null;
  Cuenta?: string | null;
  NIT?: string | null;
  Sucursal?: number | null;
  Documento?: string | null;
  FechaComitePago?: string | null;
  FechaRecibo?: string | null;
  FechaReenvio?: string | null;
  FechaPago?: string | null;
  FechaCreado?: string | null;
  Debito?: string | null;
  Credito?: string | null;
  RetencionCausada?: string | null;
  Paga?: string | null;
  CtaCobro?: string | null;
  Prefijo?: string | null;
  Registro?: string | null;
  PrioridadAlta?: boolean | null;
  PrioridadMedia?: boolean | null;
  PrioridadBaja?: boolean | null;
  PrioridadInmediata?: boolean | null;
  UsuarioAsignador?: string | null;
  NombreCuenta?: string | null;
  NombreNit?: string | null;
  NumeroEgreso?: string | null;
  PagoTesoreria?: string | null;
  RevisionFinanciera?: string | null;
  IdArchivo?: string | null;
}

export interface Egreso {
  TipoDoc?: string | null;
  Documento?: string | null;
  Periodo?: number | null;
  Cuenta?: string | null;
  NIT?: string | null;
  Factura?: string | null;
  Debito?: string | null;
  Credito?: string | null;
  AdmisionNo?: string | null;
  Registro?: string | null;
  FechaVence?: string | null;
  OrdenIngreso?: string | null;
  DescripcionTipoDoc?: string | null;
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
  IdRevisor?: number | null;
  IdRevisorTesoreria?: number | null;
  UsuarioCuentasMedicas?: number | null;
  FechaRevisionPrimera?: string | null;
  FechaRevisionSegunda?: string | null;
  FechaRevisionTercera?: string | null;
  FechaRechazo?: string | null;
  UsuarioRechazo?: number | null;
}

export interface Observacion {
  IdObservacion: number;
  FechaObservacion: string;
  Descripcion: string;
  IdArchivo?: number;
}
