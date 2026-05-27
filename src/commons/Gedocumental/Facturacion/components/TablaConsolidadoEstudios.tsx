import React, { useEffect, useState } from "react";
import { DataGrid, GridToolbarExport, type GridColDef } from "@mui/x-data-grid";
import { useDispatch, useSelector } from "react-redux";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import { Button, MenuItem, Select } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { RootState } from "../../../../store/store";
import { Title } from "../../../../components/Title.tsx";
import { get_profesionales, getCitasEstudios, getConsolidadoEstudios, guardarConsolidadoEstudios } from "../../TalentoHumano/store/thunks/TalentoHumanoThunks.tsx";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import dayjs from "dayjs";
import { toast } from "react-toastify";


export const ConsolidadoEstudios = () => {

  const { consolidadoestudios, profesionales, estudios_medico_asignado } = useSelector(
    (state: RootState) => state.talento_humano
  );
  const dispatch = useDispatch();
  const [selectedDateInicio, setSelectedDateInicio] = useState<Date | null>(null);
  const [selectedDateFin, setSelectedDateFin] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [loading_asignado, setLoading_asignado] = useState(false);
  const [selectedProfesionales, setSelectedProfesionales] = useState({});
  const [filterDateInicio, setFilterDateInicio] = useState<Date | null>(null);
  const [filterDateFin, setFilterDateFin] = useState<Date | null>(null);
  const [filterMedico, setFilterMedico] = useState<number | null>(null)

  const handleProfesionalChange = (idCita, profesionalId) => {
    if (!idCita) {
      console.error("IdCita es inválido:", idCita);
      return;
    }

    setSelectedProfesionales((prevState) => ({
      ...prevState,
      [String(idCita)]: profesionalId, // Convertir a string para evitar problemas de índice
    }));

    console.log(`Profesional asignado para IdCita ${idCita}: ${profesionalId}`);
  };

  const columns: GridColDef[] = [
    {
      field: "AdmisionNo",
      headerName: "Admision",
      width: 100,

    },
    {
      field: "FeCita",
      headerName: "Fecha",
      width: 100,

    },
    {
      field: "DiasDesdeCita",
      headerName: "Retraso",
      width: 80,
      valueGetter: (params) => {
        const fechaCita = dayjs(params.row.FeCita);
        const hoy = dayjs();
        if (!params.row.ResultadoArchivos && fechaCita.isValid()) {
          return hoy.diff(fechaCita, "day");
        }
        return null;
      },
      renderCell: (params) => {
        const dias = params.value;
        return dias !== null ? `${dias} días` : "-";
      },
    },
    {
      field: "NCompleto",
      headerName: "Nombre del paciente",
      width: 300,
    },
    {
      field: "FechaNacimiento",
      headerName: "Fecha de Nacimiento",
      width: 150,
    },
   
    {
      field: "ResultadoArchivos",
      headerName: "Resultado",
      width: 80,
      renderCell: (params) => {
        return params.value ? (
          <CheckCircleIcon style={{ color: "green" }} />
        ) : (
          <CancelIcon style={{ color: "red" }} />
        );
      },
    },
    {
      field: "DescripcionCUPS",
      headerName: "Examen",
      width: 400,

    },
    {
      field: "Cantidad",
      headerName: "Cantidad",
      width: 100,

    },
    {
      field: "NombreMedico",
      headerName: "Profesional Asignado",
      width: 300,

    },
    {
      field: "Profesional",
      headerName: "Profesional Por Asignar",
      width: 300,
      renderCell: (params) => {
        const idCita = params.row.IdCita;
        return (
          <Select
            value={selectedProfesionales[idCita] || ""}
            onChange={(event) => handleProfesionalChange(idCita, event.target.value)}
            fullWidth
          >
            {profesionales.map((profesional) => (
              <MenuItem
                key={profesional.IdUsuario}
                value={profesional.IdUsuario || ""}
              >
                {profesional.NombreReal || "Sin nombre"}
              </MenuItem>
            ))}
          </Select>
        );
      },
    },
    {
      field: "CodigoEntidad",
      headerName: "Codigo Entidad",
      width: 80,

    },
  ];

  const filterColumns: GridColDef[] = [
    {
      field: "Admision",
      headerName: "Admision",
      width: 100,
    },
    {
      field: "FechaCita",
      headerName: "Fecha",
      width: 150,
    },
    {
      field: "DiasDesdeCita",
      headerName: "Dias Transcurridos",
      width: 150,
      valueGetter: (params) => {
        const fechaCita = dayjs(params.row.FechaCita);
        const hoy = dayjs();
        if (!params.row.ResultadoArchivo && fechaCita.isValid()) {
          return hoy.diff(fechaCita, "day");
        }
        return null;
      },
      renderCell: (params) => {
        const dias = params.value;
        return dias !== null ? `${dias} días` : "-";
      },
    },
    {
      field: "NombreCompleto",
      headerName: "Nombre del paciente",
      width: 300,
    },
    
    {
      field: "DescripcionCups",
      headerName: "Examen",
      width: 500,
    },
    {
      field: "NombreMedico",
      headerName: "Profesional  ",
      width: 300,
    },
    {
      field: "ResultadoArchivo",
      headerName: "Resultado",
      width: 300,
      renderCell: (params) => {
        return params.value ? (
          <CheckCircleIcon style={{ color: "green" }} />
        ) : (
          <CancelIcon style={{ color: "red" }} />
        );
      },
    },
  ];

  const handleFilterClick = async () => {
    if (!selectedDateInicio || !selectedDateFin) {
      toast.error("Por favor selecciona ambas fechas.", {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light",
      });
      return;
    }

    try {
      setLoading(true);

      const fechaInicio = selectedDateInicio.toISOString().split("T")[0];
      const fechaFin = selectedDateFin.toISOString().split("T")[0];

      await dispatch(getCitasEstudios(fechaInicio, fechaFin));

      toast.success("Citas de estudios filtradas con éxito.", {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light",
      });
    } catch (error) {
      console.error("Error al filtrar citas de estudios:", error);
      toast.error("Error al filtrar citas de estudios.", {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light",
      });
    } finally {
      setLoading(false);
    }
  };


  const handleSecondaryFilterClick = async () => {
    if (!filterDateInicio || !filterDateFin) {
      toast.error("Por favor selecciona ambas fechas", {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light",
      });
      return;
    }

    try {
      setLoading_asignado(true);
      const fechaInicio = filterDateInicio.toISOString().split("T")[0];
      const fechaFin = filterDateFin.toISOString().split("T")[0];

      const nombreMedico =
        filterMedico != null
          ? profesionales.find((p) => p.IdUsuario === filterMedico)?.NombreReal ?? null
          : null;

      await dispatch(getConsolidadoEstudios(fechaInicio, fechaFin, nombreMedico));

      // Notificar éxito al usuario
      toast.success("Filtro aplicado exitosamente.", {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light",
      });
    } catch (error) {
      console.error("Error al filtrar el consolidado de estudios:", error);
      toast.error("Error al filtrar el consolidado de estudios. Por favor, intenta de nuevo.", {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light",
      });
    } finally {
      setLoading_asignado(false);
    }
  };


  useEffect(() => {
    dispatch(get_profesionales());
  }, [dispatch]);

  const handleGuardarTodo = async () => {
    const asignaciones = consolidadoestudios
      .filter((fila) => fila.IdCita)
      .map((fila) => {
        const idUsuario = selectedProfesionales[String(fila.IdCita)];
        const profesional = profesionales.find((p) => p.IdUsuario === idUsuario);
        return {
          Idcita: fila.IdCita,
          ProfesionalId: idUsuario,
          NombreReal: profesional?.NombreReal || "",
          Admision: fila.AdmisionNo,
          FechaCita: fila.FeCita,
          IdMedico: idUsuario,
          NombreMedico: profesional?.NombreReal || "",
          NumeroPaciente: fila.NumeroPaciente,
          Cups: fila.CUPS,
          Cantidad: fila.Cantidad,
          NombreCompleto: fila.NCompleto,
          CodigoEntidad: fila.CodigoEntidad,
          ResultadoArchivo: fila.ResultadoArchivos ? 1 : 0,
          DescripcionCups: fila.DescripcionCUPS,
        };
      })
      .filter((asignacion) => asignacion.ProfesionalId);

    if (asignaciones.length === 0) {
      alert("No hay asignaciones pendientes para guardar.");
      return;
    }

    try {
      await dispatch(guardarConsolidadoEstudios(asignaciones));
    } catch (error) {
      console.error("Error al guardar las asignaciones:", error);
    }
  };





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
      <Title title="CONSOLIDADO ESTUDIOS DEL SUEÑO" />

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

        <Button
          onClick={handleGuardarTodo}
          variant="contained"
          color="primary"
          style={{ width: "200px" }}
        >
          Guardar Todos
        </Button>

      </div>

      <Title title="LISTADO DE ADMISIONES" />

      <div style={{ width: "95%" }}>
        <DataGrid
          sx={{
            backgroundColor: "white",
          }}
          density="compact"
          autoHeight
          columns={columns}
          loading={loading}
          getRowId={(row) => row.IdCita}
          rows={consolidadoestudios}
          components={{
            Toolbar: GridToolbarExport,
          }}
        />
      </div>
      <Title title="CONSOLIDADO EXÁMENES ASIGNADOS" />

      <div style={{ display: "flex", gap: "10px", marginTop: "40px" }}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Fecha Inicio"
            value={filterDateInicio}
            onChange={(newDate) => setFilterDateInicio(newDate)}
          />
        </LocalizationProvider>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Fecha Fin"
            value={filterDateFin}
            onChange={(newDate) => setFilterDateFin(newDate)}
          />
        </LocalizationProvider>

        <Select
          value={filterMedico === null ? "" : filterMedico} // Convierte null a ""
          onChange={(e) => setFilterMedico(e.target.value === "" ? null : Number(e.target.value))} // Convierte "" a null y el resto a número
          displayEmpty
          fullWidth
        >
          <MenuItem value="">Todos los Médicos</MenuItem> {/* Usa una cadena vacía para representar "Todos los Médicos" */}
          {profesionales.map((profesional) => (
            <MenuItem key={profesional.IdUsuario} value={profesional.IdUsuario ?? ""}>
              {profesional.NombreReal ?? "Sin nombre"}
            </MenuItem>
          ))}
        </Select>



        <Button
          startIcon={<FilterAltIcon />}
          variant="outlined"
          onClick={handleSecondaryFilterClick}
          style={{ width: "150px" }}
        >
          Filtrar        </Button>
      </div>

      <Title title="" />
      <div style={{ width: "95%", marginTop: "20px" }}>
        <DataGrid
          sx={{ backgroundColor: "white" }}
          density="compact"
          autoHeight
          columns={filterColumns}
          loading={loading_asignado}
          getRowId={(row) => row.Admision}
          rows={estudios_medico_asignado}
          components={{
            Toolbar: GridToolbarExport,
          }}
        />
      </div>
    </div>
  );
};
