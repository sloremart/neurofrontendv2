
export interface IDashboardFacturacion {
    dash_board_facturacion: IObjDashBoardFacturacion[];
    dash_board_detallefactura: IObjDashBoardDetalleFactura[];
    dash_board_agendamiento: IObjAgendamiento;
    dash_board_subcentro: IObjSubcentro;
    tarifas: IObjTarifas[];
  }

export interface IObjDashBoardFacturacion {

    AdmisionNo?: number;    
    FacturaNo ?: number;
    Fecha ?: string | null;
    Plan?: string | null;
    TotalServicio?: string | null;
    TotalTerceros?: string | null;
    TotalFactura?: number;
    VrAbono?: string | null;
    VrDescuento ?: string | null;
    VrAbonado?: string | null;
    FechaAdmision ?: string | null;
    EnviadoEntidad ?: string | null;
    FechaEnvio ?: string | null;
    RemisionNo ?: string ;
    VrOtros ?: number;
    Contabilizada  ?: string | null;
    Revisada  ?: string | null;
    FechaRecibo ?: string | null;
    FechaReenvio ?: string | null;
    Ruta ?: string | null;
    ReemplazadaPor ?: string | null;
    ReemplazadaFactura ?: string | null;
    Observaciones  ?: string | null;
    FechaDevolucion ?: string | null;
    Devuelta?: string | null;
    TarifarioFactura?: string | null;
    VrGlosa?: string | null;
    TipoGlosa ?: string | null;
    MotivoGlosa?: string | null;
    Prefijo ?: string ;
    VrCapitacion ?: string | null;
    FechaCreado?: string | null;
    FechaModificado ?: string | null;
    FechaGlosa ?: string | null;
    FechaRespuesta ?: string | null;
    FechaReciboGlosa?: string | null;
    FechaElaboracionGlosa?: string | null;
    VrIVA ?: string | null;
    VrAceptado?: string | null;
    VrRecibidoAdmision?: string | null;
    Etimer?: string | null;
    IncluirCuentaCobro ?: string | null;
    Impresa?: string | null;
    Modificadapor?: string | null;
    VrLevantadoGlosa?: string | null;
    FechaLevante ?: string | null;
    IDPaciente?: string ;
    FacturaCC ?: string | null;
    VrCopago?: string | null;
    VrCuotaModeradora?: string | null;
    FacturaAnulada?: string | null;
    EstadoContGlosa?: string | null;
    CreoGlosa?: string | null;
    ContestoGlosa ?: string | null;
    DetalleFact?: string | null;
    TipoDoc1?: string | null;
    TipoDoc2?: string | null;
    TipoDoc3?: string | null;
    TipoDoc4?: string | null;
    TipoDoc5?: string | null;
    TipoDoc6?: string | null;
    VrRatificado?: string | null;
    VrAceptadoConc?: string | null;
    VrSoportadoEntidad ?: string | null;
    FechaRatificado ?: string | null;
    FechaConciliacion ?: string | null;
    rCUFE?: string ;
    rHora?: string ;
    regResolucion?: string | null;
    rEnviado?: string | null;
    EstadoAuditoria ?: string | null;
    FechaAnulada?: string | null;
    AnuladaPor?: string | null;
    QRCode ?: string | null;
    MedioPago ?: string | null;
}



export interface IObjDashBoardDetalleFactura {
    RegistroNo ?: number;
    AdmisionNo?: number;
    FechaServicio  ?: string | null;
    IDServicio?: number;
    CodigoCUPS?: number;
    CodigoSOAT?: number;
    CodigoISS?: number; 
    Cantidad?: number;
    ValorUnitario?: number;
    FacturaNo?: number;
    RegistroGlosa ?: number;
    IdEspecialista ?: number;
    CreadoPor ?: number;
    ModificadoPor?: number;
    FechaCreado?: string | null;
    FechaModificado ?: string | null;
    VrUnitarioCompartido ?: number;
    VrPorCopago ?: number;
    VrPorCuota ?: number;
    OrdenNo ?: number;
    Ccosto ?: number;
}

export interface IObjAgendamiento {
    data: {
        [fecha: string]: {
            IdCita: number;
            VrUnitario: number;
            Cantidad: number;  
            CUPS: string;
            RegistroNo: number; 
            Servicio: string; 
            Descripcion: string;
            ValorTotal: number; 
        }[];
    };
    consolidated_data: {
        Radiografia: number;
        Ultrasonografia: number;
        Doppler: number;
        Electroencefalograma: number;
        Electromiografia: number;
        EstudioPoliSinOximetria: number;
        EstudioPoliConOximetria: number;
        Monitorizacion: number;
        Neuroconduccion: number;
        PolisonografiaTitulacion: number;
        Potenciales: number;
        Neurologia: number;
        ServicioRadiologia: number;
        InyeccionMiorelajante: number;
        Fisiatria: number;
        Infiltraciones: number;
        BloqueoFisiatria: number;
        Bloqueoneurologia: number;
        TomografiaContrastada: number;
        TomografiaSimple: number;
        InsumoTomografia: number;
        MedicamentoTac: number;
        Otros: number;
    };
}

export interface IObjSubcentro {
    data: {
        [fecha: string]: {
            IdCita: number;
            VrUnitario: number;
            Cantidad: number;  
            CUPS: string;
            RegistroNo: number; 
            Servicio: string; 
            Descripcion: string;
            ValorTotal: number; 
        }[];
    };
    consolidated_data: {
        EstudioSueño: number; 
        Neurologia: number; 
        ImagenesBajaComplejidad: number; 
        AltaComplejidad: number; 
        Fisiatria: number; 
        Otros: number; 
        
    };
}



export interface IObjTarifas {
    CodigoCUPS: number; 
    DescripcionCUPS: string; 
    Tarifa: number; 
}