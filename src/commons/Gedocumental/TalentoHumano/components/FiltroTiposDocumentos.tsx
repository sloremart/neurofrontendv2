import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DataGrid, GridColDef, GridRenderCellParams, GridToolbarContainer, GridToolbarExport } from "@mui/x-data-grid";
import { Button, FormControl, InputLabel, MenuItem, Select, Box } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import SearchIcon from "@mui/icons-material/Search";
import { Title } from "../../../../components/Title.tsx";
import { RootState } from "../../../../store/store";
import CONFIG from "../../../../config/api.js";
import { get_users } from "../../../Login/store/thunks/ThunksLogin.tsx";

const CustomToolbar = () => {
  return (
    <GridToolbarContainer>
      <GridToolbarExport />
    </GridToolbarContainer>
  );
};

export const FiltroTiposDocumentos = () => {
  const { users } = useSelector((state: RootState) => state.users);
  const dispatch = useDispatch();
  const [userSeleccionado, setUserSeleccionado] = useState<number | null>(null);
  const [selectedDateInicio, setSelectedDateInicio] = useState<Date | null>(null);
  const [selectedDateFin, setSelectedDateFin] = useState<Date | null>(null);
  const [admisiones, setAdmisiones] = useState([]);
  const API_ENDPOINT = CONFIG.API_ENDPOINT;

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
      field: "Consecutivo",
      headerName: "Número de Admisión",
      width: 250,
      cellClassName: 'truncate-cell',
    },
    {
      field: "CodigoEntidad",
      headerName: "Entidad",
      width: 250,
      cellClassName: 'truncate-cell',
    },
    {
      field: "FechaCreacionAntares",
      headerName: "Fecha Creacion",
      width: 250,
      cellClassName: 'truncate-cell',
    },
    {
      field: 'TiposDeDocumento',
      headerName: 'Tipos de Documento',
      width: 400,
      renderCell: (params) => (
        <Box component="span">{params.value.join(', ')}</Box>
      ),
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        await dispatch(get_users()).unwrap();
      } catch (error) {
        console.error("Error al obtener los usuarios:", error);
      }
    };

    fetchData();
  }, [dispatch]);

  const get_admisiones_con_tipos_documento = async (FechaInicio: string, FechaFin: string, UsuarioId: number) => {
    try {
      // Construct the URL with FechaInicio, FechaFin, and UsuarioId
      const url = `${API_ENDPOINT}/admisiones_con_tipos_documento/?FechaInicio=${FechaInicio}&FechaFin=${FechaFin}&UsuarioId=${UsuarioId}`;
      const response = await fetch(url);
      const data = await response.json();
  
      if (data.success) {
        return data.data;
      } else {
        console.log("No hay datos disponibles.");
        return [];
      }
    } catch (error) {
      console.error("Error al obtener las admisiones:", error);
      return [];
    }
  };
  

  const handleFilterClick = async () => {
    if (selectedDateInicio && selectedDateFin && userSeleccionado) {
      const formattedDateInicio = selectedDateInicio.toISOString().split("T")[0];
      const formattedDateFin = selectedDateFin.toISOString().split("T")[0];
  
      try {
        const result = await get_admisiones_con_tipos_documento(
          formattedDateInicio,
          formattedDateFin,
          userSeleccionado
        );
        setAdmisiones(
          result.map((item: { Consecutivo: number, TiposDeDocumento: string[] }) => ({
            id: item.Consecutivo,
            ...item,
          }))
        );
      } catch (error) {
        console.error("Error al obtener las admisiones:", error);
      }
    } else {
      console.error("Debe seleccionar una fecha de inicio, una fecha de fin y un usuario.");
    }
  };

  return (
    <div
      className="myContainer"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>
      <Title title="TIPOS DE DOCUMENTOS POR ADMISION" />
      <div
        style={{
          display: "flex",
          gap: "10px",
          backgroundColor: "white",
          marginTop: "40px",
        }}>
         <div style={{ width: "150px", backgroundColor: "white" }}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Fecha Inicio"
            value={selectedDateInicio}
            onChange={(newDate) => setSelectedDateInicio(newDate)}
          />
        </LocalizationProvider>
      </div>
      
      {/* End Date Picker */}
      <div style={{ width: "150px", backgroundColor: "white" }}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Fecha Fin"
            value={selectedDateFin}
            onChange={(newDate) => setSelectedDateFin(newDate)}
          />
        </LocalizationProvider>
      </div>
        
        <FormControl
          variant="outlined"
          fullWidth
          style={{ width: "250px", backgroundColor: "white" }}>
          <InputLabel id="user-select-select">Usuario</InputLabel>
          <Select
            labelId="user-select-select"
            value={userSeleccionado}
            onChange={(e) => setUserSeleccionado(e.target.value as number)}
            label="Usuario">
            {users.map((user, index) => (
              <MenuItem key={user.id || index} value={user.id}>
                {user.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          startIcon={<SearchIcon />}
          variant="contained"
          onClick={handleFilterClick}
          style={{ width: "100px" }}>
          BUSCAR
        </Button>
      </div>

      <div
        style={{
          display: "flex",
          width: "100%",
          justifyContent: "space-between",
          marginTop: "20px",
        }}>
        <div style={{ flex: 1, marginRight: "5px", marginTop: "10px" }}>
          <div className="Container">
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "20px",
              }}>
              <label style={{ color: "grey", fontWeight: "bold" }}>
                ADMISIONES
              </label>
            </div>
          </div>
          <DataGrid
            sx={{
              backgroundColor: "white",
              marginTop: "10px",
            }}
            density="compact"
            autoHeight
            columns={columns}
            rows={admisiones}
            components={{
              Toolbar: CustomToolbar,
            }}
          />
        </div>
      </div>
    </div>
  );
};