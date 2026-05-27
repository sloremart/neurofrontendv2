import React, { useState } from "react";
import { DataGrid, GridColDef, GridRenderCellParams, GridToolbarExport } from "@mui/x-data-grid";
import CONFIG from "../../../config/api.js";
import { Title } from "../../../components/Title.tsx";
import { Button, } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import dayjs from "dayjs";

const API_ENDPOINT = CONFIG.API_ENDPOINT;

interface AdmisionData {
  id: number;
  AdmisionId: number;
  FechaCreacionAntares: string;
  Usuarios: string;
  ObservacionesArchivos: string;
  ObservacionesSinArchivos: string;
}

export const TablaPendientesUsuario = () => {
  const [admisionesData, setAdmisionesData] = useState<AdmisionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDateInicio, setSelectedDateInicio] = useState<Date | null>(
    null
  );

  const [selectedDateFin, setSelectedDateFin] = useState<Date | null>(null);

  const fetchAdmisionesData = async (
    fechaInicio?: string,
    fechaFin?: string
  ) => {
    setLoading(true);
    try {
      let url = `${API_ENDPOINT}/listado_admsiones_observaciones/`;

      if (fechaInicio && fechaFin) {
        url += `?fechainicio=${fechaInicio}&fechafin=${fechaFin}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      console.log("Datos recibidos:", data);

      if (data && Array.isArray(data) && data.length > 0) {
        const formattedData: AdmisionData[] = data.map(
          (item: any, index: number) => ({
            id: index + 1,
            AdmisionId: item.AdmisionId,
            FechaCreacionAntares: item.FechaCreacionAntares,
            Usuarios: item.Usuarios.join(", "),
            ObservacionesArchivos: item.ObservacionesArchivos.map(
              (obs: any) => obs.Descripcion
            ).join(", "),
            ObservacionesSinArchivos: item.ObservacionesSinArchivos.map(
              (obs: any) => obs.Descripcion
            ).join(", "),
          })
        );
        setAdmisionesData(formattedData);
      } else {
        console.log("No hay datos disponibles.");
      }
    } catch (error) {
      console.error(
        "Error al obtener las admisiones con observaciones:",
        error
      );
    } finally {
      setLoading(false);
    }
  };
  const handleFilterClick = () => {
    const fechaInicio = selectedDateInicio
      ? dayjs(selectedDateInicio).format("YYYY-MM-DD")
      : undefined;
    const fechaFin = selectedDateFin
      ? dayjs(selectedDateFin).format("YYYY-MM-DD")
      : undefined;

    if (fechaInicio && fechaFin) {
      fetchAdmisionesData(fechaInicio, fechaFin);
    } else {
      alert("Por favor selecciona ambas fechas para aplicar el filtro.");
    }
  };


  const columns: GridColDef[] = [
    {
      field: "id",
      headerName: "No.",
      width: 70,
      renderCell: (params: GridRenderCellParams<any>) => {
        return params.value;
      },
    },
    { field: "AdmisionId", headerName: "ID Admisión", width: 150 },
    {
      field: "FechaCreacionAntares",
      headerName: "Fecha Creación Admsion ",
      width: 200,
    },
    { field: "Usuarios", headerName: "Usuarios", width: 300 },
    {
      field: "ObservacionesArchivos",
      headerName: "Observaciones con Archivos",
      width: 400,
    },
    {
      field: "ObservacionesSinArchivos",
      headerName: "Observaciones sin Archivos",
      width: 400,
    },
  ];

  return (
    <>
    <div
      className="myContainer"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>
      <Title title="OBSERVACIONES POR USUARIO" />

      <div style={{ display: "flex", gap: "10px", marginTop: "40px" }}>
        <div style={{ width: "300px" }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Fecha Inicio"
              value={selectedDateInicio}
              onChange={(newDate) => setSelectedDateInicio(newDate)}
            />
          </LocalizationProvider>
        </div>
        <div style={{ width: "300px" }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Fecha Fin"
              value={selectedDateFin}
              onChange={(newDate) => setSelectedDateFin(newDate)}
            />
          </LocalizationProvider>
        </div>
      
        <Button
          startIcon={<FilterAltIcon />}
          variant="outlined"
          onClick={handleFilterClick}
          style={{ width: "150px" }}
          disabled={loading}>
          {loading ? "Cargando..." : "Filtrar"}
        </Button>
      </div>
      <div
          style={{
            width: "75%",
            height: "500px", 
            display: "flex",
            justifyContent: "center",
            marginTop: "40px",
            overflowY: "auto", // Scroll vertical si el contenido excede la altura fija
          }}
        >
      <DataGrid
    
        rows={admisionesData}
        columns={columns}
        density="compact"
        getRowId={(row) => row.AdmisionId}
        loading={loading}
        components={{
          Toolbar: GridToolbarExport,
        }}
      />
      
    </div>
    </div>
    </>
  );
};
