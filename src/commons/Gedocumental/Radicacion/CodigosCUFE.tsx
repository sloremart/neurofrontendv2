import React, { useState } from "react";
import { DataGrid,  GridRenderCellParams,  GridToolbarExport, type GridColDef } from "@mui/x-data-grid";
import { Button } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import FilterAltIcon from "@mui/icons-material/FilterAlt";


import { Title } from "../../../components/Title.tsx";
import axios from "axios";
import CONFIG from "../../../config/api.js";

export const CodigosCufe = () => {
  // Estados locales
  const [selectedDateInicio, setSelectedDateInicio] = useState<Date | null>(
    null
  );
  const [selectedDateFin, setSelectedDateFin] = useState<Date | null>(null);
  const [rows, setRows] = useState([]); // Para almacenar los datos recibidos del backend
  const [loading, setLoading] = useState(false);
  const API_ENDPOINT = CONFIG.API_ENDPOINT;
  // Definición de columnas para el DataGrid
  const columns: GridColDef[] = [

    {
        field: "no",
        headerName: "No.",
        width: 70,
        renderCell: (params: GridRenderCellParams<any>) => {
          const allRows = params.api.getSortedRowIds();
          const index = allRows.indexOf(params.id);
          return index + 1;
        },
      },
    {
      field: "AdmisionNo",
      headerName: "No Admision",
      width: 100,
  
    },
    {
        field: "Prefijo",
        headerName: "Prefijo",
        width: 100,
    
      },
      {
        field: "FacturaNo",
        headerName: "Factura",
        width: 100,
    
      },
    {
      field: "rCUFE",
      headerName: "Cod CUFE",
      width: 900,

    },
  /*  {
        field: "Valor",
        headerName: "Valor",
        width: 120,
        flex: 1,
        valueFormatter: (params) => {
          // Formatear como valor monetario sin decimales
          const value = Number(params.value);
          return value.toLocaleString("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0, // No mostrar decimales
            maximumFractionDigits: 0, // No mostrar decimales
          });
        },
      },
      {
        field: "Subtotal",
        headerName: "Subtotal",
        width: 100,
        flex: 1,
        valueFormatter: (params) => {
          // Formatear como valor monetario sin decimales
          const value = Number(params.value);
          return value.toLocaleString("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0, // No mostrar decimales
            maximumFractionDigits: 0, // No mostrar decimales
          });
        },
      },*/
    {
      field: "FechaCreado",
      headerName: "Fecha Creacion",
      width: 200,
 
    },
  ];

  // Manejo del clic en el botón de filtrar
  const handleFilterClick = async () => {
    if (selectedDateInicio && selectedDateFin) {
      const formattedDateInicio = selectedDateInicio
        .toISOString()
        .split("T")[0]; // Formatea la fecha de inicio como YYYY-MM-DD
      const formattedDateFin = selectedDateFin.toISOString().split("T")[0]; // Formatea la fecha de fin como YYYY-MM-DD

      try {
        setLoading(true);
        const response = await axios.get(
          `${API_ENDPOINT}/codigocufe/`, // Cambia la URL según la configuración de tu backend
          {
            params: {
              fecha_inicio: formattedDateInicio,
              fecha_fin: formattedDateFin,
            },
          }
        );

        if (response.data.success) {
          setRows(response.data.data); // Actualiza las filas con los datos recibidos del backend
        } else {
          console.error("Error en la consulta:", response.data.detail);
          setRows([]); // Limpia las filas si no hay datos
        }
      } catch (error) {
        console.error("Error al obtener los datos:", error);
      } finally {
        setLoading(false);
      }
    } else {
      console.error("Debe seleccionar una fecha de inicio y una fecha de fin.");
    }
  };

  // Renderización del componente
  return (
    <div
      className="myContainer"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: "80px",
      }}
    >
      <Title title="CÓDIGOS CUFE" />

      <div style={{ display: "flex", gap: "10px", marginTop: "40px" }}>
        <div style={{ width: "150px" }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Fecha Inicio"
              value={selectedDateInicio}
              onChange={(newDate) => setSelectedDateInicio(newDate)}
            />
          </LocalizationProvider>
        </div>

        <div style={{ width: "150px" }}>
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
        >
          Filtrar
        </Button>
      </div>

      <Title title="LISTADO DE CUFE" />

      <div style={{ width: "95%" }}>
        <DataGrid
          sx={{
            backgroundColor: "white",
          }}
          density="compact"
          autoHeight
          columns={columns}
          loading={loading} // Estado de carga aplicado aquí
          getRowId={(row) => row.AdmisionNo}
          rows={rows} // Datos para la tabla
          components={{
            Toolbar: GridToolbarExport,
          }}
        />
      </div>
    </div>
  );
};
