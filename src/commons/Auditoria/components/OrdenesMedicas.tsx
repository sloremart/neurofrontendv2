// src/pages/RevisionCitasFacturas.tsx
import React, { useState } from "react";
import {
    DataGrid,
    GridColDef,
    GridToolbarExport,
} from "@mui/x-data-grid";
import {

    Button,
    CircularProgress,
    Stack,
    Typography,
} from "@mui/material";
import FileUploadIcon from "@mui/icons-material/UploadFile";
import DownloadDoneIcon from "@mui/icons-material/DownloadDone";
import CONFIG from "../../../config/api";
import { Title } from "../../../components/Title.tsx";


const API_ENDPOINT = CONFIG.API_ENDPOINT + "/cargue_atenciones/";

interface ResultadoRow {
    id: number;
    identificacion: string;
    paciente: string | null;
    cita: string;       // “Sí (431780)” | “No”
    factura: string;    // “Sí (567890)” | “No”
}

export default function RevisionCitasFacturas() {
    const [rows, setRows] = useState<ResultadoRow[]>([]);
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    // ----- columnas -----
    const columns: GridColDef[] = [
        { field: "id", headerName: "No.", width: 70 },
        {
            field: "identificacion",
            headerName: "Identificación",
            width: 150,
        },
        { field: "paciente", headerName: "Paciente", flex: 1 },
        {
            field: "cita",
            headerName: "Cita posterior",
            width: 160,
            cellClassName: (p) =>
                p.value.startsWith("Sí") ? "ok" : "fail",
        },
        {
            field: "factura",
            headerName: "Factura posterior",
            width: 170,
            cellClassName: (p) =>
                p.value.startsWith("Sí") ? "ok" : "fail",
        },
    ];

    // ----- enviar archivo -----
    const uploadAndFetch = async () => {
        if (!file) return alert("Selecciona un archivo Excel primero");

        const form = new FormData();
        form.append("file", file);

        setLoading(true);
        try {
            const res = await fetch(API_ENDPOINT, {
                method: "POST",
                body: form,
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();

            const formatted: ResultadoRow[] = data.map(
                (item: any, idx: number) => ({
                    id: idx + 1,
                    identificacion: item.identificacion,
                    paciente: item.paciente ?? "—",
                    cita: item.cita.existe
                        ? `Sí (${item.cita.id_cita})`
                        : "No",
                    factura: item.factura.existe
                        ? `Sí (${item.factura.admision})`
                        : "No",
                })
            );
            setRows(formatted);
        } catch (err: any) {
            console.error(err);
            alert("Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="myContainer"
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginTop: "80px",
            }}>


            <Title title="Validación de citas y facturas" />

            <Stack direction="row" spacing={2} mb={4} marginTop={2}>
                <Button
                    component="label"
                    variant="outlined"
                    startIcon={<FileUploadIcon />}
                >
                    Seleccionar Excel
                    <input
                        type="file"
                        accept=".xlsx"
                        hidden
                        onChange={(e) =>
                            setFile(e.target.files ? e.target.files[0] : null)
                        }
                    />
                </Button>

                <Button
                    variant="contained"
                    endIcon={<DownloadDoneIcon />}
                    disabled={!file || loading}
                    onClick={uploadAndFetch}
                >
                    {loading ? (
                        <CircularProgress size={20} color="inherit" />
                    ) : (
                        "Procesar"
                    )}
                </Button>

                {file && !loading && (
                    <Typography variant="body2">
                        {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </Typography>
                )}
            </Stack>

            {/* ------- tabla ------- */}
            <div style={{ height: 520, width: "100%" }}>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    density="compact"
                    disableRowSelectionOnClick
                    components={{ Toolbar: GridToolbarExport }}
                    sx={{
                        "& .ok": { color: "green" },
                        "& .fail": { color: "error.main" },
                    }}
                />
            </div>
        </div>
    );

}
