
export interface CUPSResumen {
  cups: string;
  cantidad: number;
  valor_total: number;
}

export interface GrupoResumen {
  grupo: string;
  valor_total_pagado: number;
  cantidad_total_facturas: number;
  costo_unitario_estimado: number;
  estado: string;
  cantidad_minima: number;
  cantidad_referencia: number;
  cantidad_maxima:  number;
  valor_mes:  number;
  cups: CUPSResumen[];
}

export interface RiesgoCompartidoResponse {
  fecha_inicio: string;
  fecha_fin: string;
  grupos: GrupoResumen[];
}
