import React, { useEffect, useState } from "react";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../../store/store.ts";
import {
  get_admisiones_tesoreria,
  get_codigos,
} from "../store/thunks/TalentoHumanoThunks.tsx";
import FilterAltIcon from "@mui/icons-material/FilterAlt"; 
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Button, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import { Title } from "../../../../components/Title.tsx";
import { get_users } from "../../../Login/store/thunks/ThunksLogin.tsx";

export const FiltroTesoreria = () => {
  const { admision_cuentas_medicas } = useSelector(
    (state: RootState) => state.talento_humano
  );
  const dispatch = useDispatch();
  const { users } = useSelector((state: RootState) => state.users);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [codigos, setCodigos] = useState<string[]>([]);
  const [userSeleccionado, setUserSeleccionado] = useState<number | null>(null);
  const [revision, setRevision] = useState<number | null>(null);
  const [codigoSeleccionado, setCodigoSeleccionado] = useState<string>(""); 
  const columns: GridColDef[] = [
    {
      field: "AdmisionId",
      headerName: "Numero de la Admisión",
      width: 100,
      flex: 1,
      cellClassName: "truncate-cell",
    },
    {
      field: "CodigoEntidad",
      headerName: "Código Entidad",
      width: 100,
      flex: 1,
      cellClassName: "truncate-cell",
    },
    {
      field: "NombreResponsable",
      headerName: "Nombre del paciente",
      width: 250,
      flex: 1,
      cellClassName: "truncate-cell",
    },
    {
      field: "RevisionCuentasMedicas",
      headerName: "Auditoria Cuentas Medicas",
      width: 250,
      flex: 1,
      renderCell: (params) => {
        const value = params.value as boolean;
        const iconStyle = {
          color: value ? "green" : "red",
        };
        return value ? (
          <CheckCircleIcon style={iconStyle} />
        ) : (
          <HighlightOffIcon style={iconStyle} />
        );
      },
    },
    {
      field: "FechaCreacionAntares",
      headerName: "Fecha de creación",
      width: 250,
      flex: 1,
      cellClassName: "truncate-cell",
    },
 
  ];
  useEffect(() => {
    const fetchData = async () => {
      try {
        const codigosData = await dispatch(get_codigos());
        setCodigos(codigosData);
        await dispatch(get_users()).unwrap();
      } catch (error) {
        console.error("Error al obtener los códigos:", error);
      }
    };

    fetchData();
  }, [dispatch]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const codigosData = await dispatch(get_codigos()); 
        setCodigos(codigosData); 
      } catch (error) {
        console.error("Error al obtener los códigos:", error);
      }
    };

    fetchData();
  }, [dispatch]);

  const handleFilterClick = async () => {
    if (selectedDate && revision !== null && userSeleccionado) {
      const formattedDate = selectedDate.toISOString().split("T")[0];
      const codigoEntidad = codigoSeleccionado || "";
      try {
        await dispatch(
          get_admisiones_tesoreria(
            userSeleccionado,
            formattedDate,
          
            codigoEntidad ,   revision,// Pasar el código entidad, incluso si es una cadena vacía
          )
        );
      } catch (error) {
        console.error("Error al obtener las admisiones:", error);
      }
    } else {
      console.error("Debe seleccionar una fecha, revisión y usuario.");
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
      <div style={{ display: "flex", gap: "10px", marginTop: "40px" }}>
        <div style={{ width: "150px" }}>
          {" "}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Fecha"
              value={selectedDate}
              onChange={(newDate) => setSelectedDate(newDate)}
            />
          </LocalizationProvider>
        </div>

       

        <Select
        value={codigoSeleccionado}
        onChange={(e) => setCodigoSeleccionado(e.target.value as string)}
        fullWidth
        label="Código"
        style={{ width: '150px' }}
        sx={{
          backgroundColor: "white",
        }}>
        {codigos.map((codigo) => (
          <MenuItem key={codigo} value={codigo}>
            {codigo}
          </MenuItem>
        ))}
      </Select>
      <FormControl
          variant="outlined"
          fullWidth
          style={{ width: "150px", backgroundColor: "white" }}>
          <InputLabel id="user-select-label">Revision</InputLabel>
          <Select
            value={revision}
            onChange={(e) => setRevision(e.target.value as number)}
            fullWidth
            label="Revisado"
            style={{ width: "150px" }}
            sx={{
              backgroundColor: "white",
            }}>
            <MenuItem value={0}>No revisado</MenuItem>
            <MenuItem value={1}>Revisado</MenuItem>
          </Select>
        </FormControl>
        <FormControl
          variant="outlined"
          fullWidth
          style={{ width: "150px", backgroundColor: "white" }}>
          <InputLabel id="user-select-label">Facturador</InputLabel>
          <Select
            labelId="user-select-label"
            value={userSeleccionado}
            onChange={(e) => setUserSeleccionado(e.target.value as number)}
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
          style={{ width: "150px" }}>
          {" "}
          Filtrar
        </Button>
      </div>

      <Title title="LISTADO DE ADMISIONES REVISADAS - CUENTAS MEDICAS" />

      <div style={{ width: "95%" }}>
        <DataGrid
          sx={{
            backgroundColor: "white",
          }}
          density="compact"
          autoHeight
          columns={columns}
          getRowId={(row) => row.AdmisionId}
          rows={admision_cuentas_medicas}
        />
      </div>
    </div>
  );
};
