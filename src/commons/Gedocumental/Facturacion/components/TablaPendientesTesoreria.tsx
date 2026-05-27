import React, { useState, useEffect } from "react";
import { Checkbox, Button } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useSelector, useDispatch } from "react-redux";
import { Title } from "../../../../components/Title.tsx";
import { RootState } from "../../../../store/store";
import CONFIG from "../../../../config/api.js";
import { get_admision_pendiente_revisadas_cm } from "../../TalentoHumano/store/thunks/TalentoHumanoThunks.tsx";
import { toast, ToastContent } from "react-toastify";

export const control_error = (
  message: ToastContent = "Algo pasó, intente de nuevo"
) =>
  toast.error(message, {
    position: "bottom-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "light",
  });
  
  

export const control_success = (message: ToastContent) =>
  toast.success(message, {
    position: "bottom-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "light",
  });
export const TablaPendientesTesoreria = () => {
  const { admision_pendientes_facturacion } = useSelector(
    (state: RootState) => state.talento_humano
  );
  const dispatch = useDispatch();
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [userData, setUserData] = useState<any>(null); // Añade un estado para almacenar userData
  const API_ENDPOINT = CONFIG.API_ENDPOINT;

  useEffect(() => {
    const userDataString = localStorage.getItem("userData");
    if (!userDataString) {
      console.error("Datos del usuario no encontrados en el almacenamiento local.");
      return;
    }
    const parsedUserData = JSON.parse(userDataString);
    setUserData(parsedUserData); // Guarda userData en el estado
    dispatch(get_admision_pendiente_revisadas_cm(parsedUserData.id));
  }, [dispatch]);

  const handleCheckboxChange = (id: number) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const handleRemoveRevisor = async () => {
    if (!userData) {
      control_error("User data no disponible.");
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (let admisionId of selectedRows) {
      try {
        const response = await fetch(`${API_ENDPOINT}/eliminar_idrevisor/${admisionId}/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();

        if (response.ok) {
          successCount++;
          control_success(result.detail || `Revisor desasociado de la admisión ${admisionId}`);
        } else {
          errorCount++;
          control_error(result.detail || `Error al desasociar revisor de la admisión ${admisionId}`);
        }
      } catch (error) {
        errorCount++;
        control_error(`Error al desasociar revisor de la admisión ${admisionId}: ${error}`);
      }
    }

    setSelectedRows([]);
    dispatch(get_admision_pendiente_revisadas_cm(userData.id));

    if (successCount > 0) {
      control_success(`El revisor ha sido desasociado de ${successCount} admisión(es).`);
    }
    if (errorCount > 0) {
      control_error(`Hubo errores al desasociar el revisor de ${errorCount} admisión(es).`);
    }
  };
  const columns: GridColDef[] = [
    {
      field: "select",
      headerName: "",
      width: 50,
      sortable: false,
      renderCell: (params) => (
        <Checkbox
          checked={selectedRows.includes(params.row.Consecutivo)}
          onChange={() => handleCheckboxChange(params.row.Consecutivo)}
        />
      ),
    },

    {
      field: "Consecutivo",
      headerName: "Núm. Admisión",
      width: 100,
      cellClassName: "truncate-cell",
    },
    {
      field: "IdPaciente",
      headerName: "Identificacion",
      width: 100,
      flex: 1,
      cellClassName: "truncate-cell",
    },
    {
      field: "CodigoEntidad",
      headerName: "Codigo entidad",
      width: 100,
      cellClassName: "truncate-cell",
    },
    {
      field: "NombreResponsable",
      headerName: "Nombre",
      width: 300,
      flex: 1,
    },
    {
      field: "FacturaNo",
      headerName: "Factura",
      width: 100,
      cellClassName: "truncate-cell",
    },
    {
      field: "FechaCreado",
      headerName: "Fecha Creacion",
      width: 200,
      cellClassName: "truncate-cell",
    },
    {
      field: "ObservacionesArchivos",
      headerName: "Observaciones con Archivos",
      width: 300,
      flex: 1,
      renderCell: (params) => {
        return (
          <div>
            {params.value && params.value.length > 0 ? (
              params.value.map((obs) => (
                <p key={obs.IdObservacion}>{obs.Descripcion}</p>
              ))
            ) : (
              <span>Sin Observaciones</span>
            )}
          </div>
        );
      }
    },
    {
      field: "ObservacionesSinArchivos",
      headerName: "Observaciones sin Archivos",
      width: 300,
      flex: 1,
      renderCell: (params) => {
        return (
          <div>
            {params.value && params.value.length > 0 ? (
              params.value.map((obs) => (
                <p key={obs.id}>{obs.Descripcion}</p>
              ))
            ) : (
              <span>Sin Observaciones</span>
            )}
          </div>
        );
      }
    },
  ];

  return (
    <div
      className="myContainer"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Title title="LISTADO DE ADMISIONES PENDIENTES" />
      <Button
        variant="contained"
        color="primary"
        style={{ marginTop: "10px",  }}
        onClick={handleRemoveRevisor}
        disabled={selectedRows.length === 0}
      >
       Quitar Admisiones
      </Button>
      <div style={{ width: "95%", display: "flex", justifyContent: "center" , marginTop: "10px",}}>
        <DataGrid
          sx={{
            backgroundColor: "white",
            '& .MuiDataGrid-cell': {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: "10px",  
            },
            '& .MuiDataGrid-columnHeader': {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
             
            },
          }}
          density="compact"
          autoHeight
          columns={columns}
          getRowId={(row) => row.Consecutivo}
          rows={admision_pendientes_facturacion}
        />
      </div>
    </div>
  );
};
