



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

