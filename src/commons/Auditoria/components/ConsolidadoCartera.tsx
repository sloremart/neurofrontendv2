import React, { useEffect, useState } from "react";
import { useDispatch,  } from "react-redux";
import {  TextField, Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Title } from "../../../components/Title.tsx";
import { fetch_consolidado_facturas } from "../store/thunks/AuditoriaDashboardthunks.tsx";
import { AppDispatch, } from "../../../store/store";
import { get_nits } from "../../Gedocumental/Facturacion/store/thunks/CajaFacturacionThunks.tsx";


const InformeConsolidadoEntidades = () => {
    const dispatch = useDispatch<AppDispatch>();

    const [selectedEntidades] = useState<any[]>([]);
    const [inputValueNit] = useState<string>("");
    const [anio, setAnio] = useState<string>("");
    const [mes, setMes] = useState<string>("");
    const [resultados, setResultados] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const formatoCOP = new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
    });

    const columnas = [
        { field: "codigo_entidad", headerName: "Código", width: 100 },
        { field: "entidad", headerName: "Entidad", width: 200 },
        { field: "total_admisiones", headerName: "Admisiones", width: 120 },
        { field: "facturas_radicadas", headerName: "Radicadas", width: 120 },
        {
            field: "total_facturado_radicado",
            headerName: "Facturado Radicado",
            width: 180,
            valueFormatter: ({ value }: any) => formatoCOP.format(value),
        },
        {
            field: "total_facturado_no_radicado",
            headerName: "Facturado NO Radicado",
            width: 190,
            valueFormatter: ({ value }: any) => formatoCOP.format(value),
        },
    ];

    const cargarDatos = async () => {
        setLoading(true);
        const codigos = selectedEntidades.map(e => e.value);
        const data = await dispatch(fetch_consolidado_facturas(codigos, Number(anio), Number(mes)));
        setResultados(data);
        setLoading(false);
    };

    useEffect(() => {
        if (inputValueNit.length > 2) {
            const timeout = setTimeout(() => {
                dispatch(get_nits(inputValueNit));
            }, 400);
            return () => clearTimeout(timeout);
        }
    }, [inputValueNit, dispatch]);



    return (
        <div   className="myContainer"
        style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: "80px",
        }}>
            <Title title="Consolidado de Facturación por Entidad" />

              <div style={{ display: "flex", gap: "10px", marginBottom: 20, marginTop: "20px" }}>

                <TextField
                    label="Año"
                    type="number"
                    value={anio}
                    onChange={(e) => setAnio(e.target.value)}
                />
                <TextField
                    label="Mes"
                    type="number"
                    value={mes}
                    onChange={(e) => setMes(e.target.value)}
                />
                <Button variant="contained" onClick={cargarDatos} disabled={loading}>
                    {loading ? "Consultando..." : "Consultar"}
                </Button>
            </div>

            <DataGrid
                autoHeight
                rows={resultados.map((row, i) => ({ ...row, id: i }))}
                columns={columnas}
                sx={{ width: "100%" }}
            />
        </div>
    );
};

export default InformeConsolidadoEntidades;