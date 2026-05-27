
export interface IAuditoriaDashboard 
{
 admisiones_facturador: AdmisionesFacturador,


}




export interface AdmisionesFacturador {
    cantidad_admisiones: number;
    admisiones: number[];
    entidad_count: {
      [codigoEntidad: string]: number;
    };
  }