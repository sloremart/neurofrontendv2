import React, { useEffect, useState } from "react";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { DataGrid, GridRenderCellParams, type GridColDef } from "@mui/x-data-grid";
import { useDispatch, useSelector } from "react-redux";
import { FormControl, InputLabel } from "@mui/material";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Button, MenuItem, Select } from "@mui/material";
import { RootState } from "../../../store/store";
import { get_users } from "../../Login/store/thunks/ThunksLogin.tsx";
import { Title } from "../../../components/Title.tsx";
import { GridToolbarExport } from "@mui/x-data-grid";
import CONFIG from "../../../config/api.js";
const API_ENDPOINT = CONFIG.API_ENDPOINT;

// Aquí está el thunk dentro del mismo archivo
const get_admisiones_revisadas_cm = async (
  usuarioId: number,
  fechaInicio: string,
  fechaFin: string
) => {
  try {
    const url = `${API_ENDPOINT}/admision_revisadas_cm/?usuario_id=${usuarioId}&fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;

    const response = await fetch(url);
    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Error al obtener las admisiones revisadas:", error);
    throw error;
  }
};

export const AuditoriaCm = () => {
  const { users } = useSelector((state: RootState) => state.users);
  const dispatch = useDispatch();

  const [userSeleccionado, setUserSeleccionado] = useState<number[]>([]);
  const [selectedDateInicio, setSelectedDateInicio] = useState<Date | null>(
    null
  );
  const [selectedDateFin, setSelectedDateFin] = useState<Date | null>(null);
  const [admisionesData, setAdmisionesData] = useState<any[]>([]); // Estado para almacenar los datos
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await dispatch(get_users());
      } catch (error) {
        console.error("Error al obtener los usuarios:", error);
      }
    };

    fetchData();
  }, [dispatch]);

  const handleFilterClick = async () => {
    if (selectedDateInicio && selectedDateFin && userSeleccionado.length > 0) {
      const formattedDateInicio = selectedDateInicio
        .toISOString()
        .split("T")[0];
      const formattedDateFin = selectedDateFin.toISOString().split("T")[0];

      setLoading(true);
      try {
        const data = await get_admisiones_revisadas_cm(
          userSeleccionado[0], // Solo un usuario es seleccionado, ajustar si se permite seleccionar múltiples
          formattedDateInicio,
          formattedDateFin
        );
        setAdmisionesData(data); // Guardar los datos en el estado
        setLoading(false);
      } catch (error) {
        console.error("Error al obtener las admisiones:", error);
        setLoading(false);
      }
    } else {
      console.error("Debe seleccionar una fecha y al menos un usuario.");
    }
  };

  // Definir las columnas para el DataGrid
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
    { field: "AdmisionId", headerName: "ID Admisión", width: 100 },
    { field: "FechaRevisionPrimera", headerName: "Fecha Revisión", width: 200 },
    { field: "CodigoEntidad", headerName: "Código Entidad", width: 200 },
    {
      field: "NombreResponsable",
      headerName: "Nombre Responsable",
      width: 300,
    },

  
    {
      field: "FechaCreacionAntares",
      headerName: "Fecha Creación Antares",
      width: 100,
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
        <Title title="AUDITORIA DE ADMSIONES REVISADAS POR CUENTAS MEDICAS" />
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
          <FormControl
            variant="outlined"
            fullWidth
            style={{
              width: "350px",
              backgroundColor: "white",
              marginRight: "35px",
            }}>
            <InputLabel id="user-select-label">Usuario</InputLabel>
            <Select
              labelId="user-select-label"
              multiple
              value={userSeleccionado}
              onChange={(e) => setUserSeleccionado(e.target.value as number[])}
              label="Usuario">
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
            height: "500px", // Altura fija para el DataGrid
            display: "flex",
            justifyContent: "center",
            marginTop: "40px",
            overflowY: "auto", // Scroll vertical si el contenido excede la altura fija
          }}
        >
          <DataGrid
            sx={{
              backgroundColor: "white",
              '& .MuiDataGrid-cell': {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              },
              '& .MuiDataGrid-columnHeader': {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              },
            }}
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
