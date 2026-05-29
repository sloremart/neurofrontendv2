import React, { useEffect, useState } from "react";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useDispatch, useSelector } from "react-redux";
import { Tabs, Tab, Box } from '@mui/material';

import VisibilityIcon from '@mui/icons-material/Visibility';
import { Title } from "../../../components/Title.tsx";
import { AppDispatch, RootState } from "../../../store/store.ts";
import { get_factura_pendiente_revisor, revisar_factura_proveedor } from "../store/thunks/ProgramacionPagosThunks.tsx";
import { get_users } from "../../Login/store/thunks/ThunksLogin.tsx";
import CONFIG from "../../../config/api.js";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import { toast } from "react-toastify";
import { green, red } from '@mui/material/colors';
import { Cancel, CheckCircle, Close } from "@mui/icons-material";
import { IObjAdmision } from "../interface/ProgramacionPago";

const API_ENDPOINT = CONFIG.API_ENDPOINT;

// FunciÃ³n para formatear fecha y hora
const formatearFechaHora = (fechaString: string) => {
  if (!fechaString) return "";
  
  try {
    const fecha = new Date(fechaString);
    if (isNaN(fecha.getTime())) return fechaString;
    
    // Formato: DD/MM/YYYY HH:MM
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const aÃ±o = fecha.getFullYear();
    const hora = fecha.getHours().toString().padStart(2, '0');
    const minutos = fecha.getMinutes().toString().padStart(2, '0');
    
    return `${dia}/${mes}/${aÃ±o} ${hora}:${minutos}`;
  } catch (error) {
    return fechaString;
  }
};

export const TablaProveedor = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { archivos } = useSelector((state: RootState) => state.programacion_pagos);
  const { users } = useSelector((state: RootState) => state.users);

  // FunciÃ³n para obtener el nombre del usuario por ID
  const obtenerNombreUsuario = (userId: number | null) => {
    if (!userId) return '';
    const user = users.find((u) => u.id === userId);
    return user?.nombre || user?.username || `Usuario ${userId}`;
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [observacion, setObservacion] = useState("");
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<number | null>(null);
  const [modoAccion, setModoAccion] = useState<"aprobar" | "rechazar" | null>(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [archivosPendientes, setArchivosPendientes] = useState<IObjAdmision[]>([]);
  const [archivosHistorial, setArchivosHistorial] = useState<IObjAdmision[]>([]);

  // Obtener el usuario del localStorage
  const userDataString = localStorage.getItem("userData");
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const idRevisor = userData?.id;

  useEffect(() => {
    dispatch(get_users());
  }, [dispatch]);

  useEffect(() => {
    if (idRevisor) {
      dispatch(get_factura_pendiente_revisor(idRevisor.toString()))
        .unwrap()
        .then((response) => {
          if (response.success) {
            // El backend ya separa las facturas en pendientes e histÃ³ricas
            setArchivosPendientes(response.data.pendientes || []);
            setArchivosHistorial(response.data.historicas || []);
          }
        })
        .catch((error) => {
          console.error("Error al obtener facturas:", error);
        });
    }
  }, [idRevisor, dispatch]);

  const handleOpenModal = (id: number, modo: "aprobar" | "rechazar") => {
    setArchivoSeleccionado(id);
    setModoAccion(modo);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setArchivoSeleccionado(null);
    setObservacion("");
    setModoAccion(null);
  };

  const handleEnviarAccion = async () => {
    if (!archivoSeleccionado) {
      toast.error("Archivo no seleccionado.");
      return;
    }

    // Validar observaciÃ³n solo si es un rechazo
    if (modoAccion === "rechazar" && !observacion.trim()) {
      toast.error("Debe escribir una observaciÃ³n al rechazar.");
      return;
    }

    const userDataString = localStorage.getItem("userData");
    if (!userDataString) {
      toast.error("No se encontrÃ³ informaciÃ³n del usuario.");
      return;
    }

    const userData = JSON.parse(userDataString);
    const usuarioId = userData.id;
    const usuarioNombre = userData.nombre || userData.name || "Usuario";

    let descripcionFinal = observacion.trim();
    if (modoAccion === "rechazar") {
      descripcionFinal += ` / ${usuarioNombre}`;
    }

    await dispatch(
      revisar_factura_proveedor({
        idArchivo: archivoSeleccionado,
        aprobado: modoAccion === "aprobar",
        usuarioId,
        descripcion: descripcionFinal,
      })
    );

    dispatch(get_factura_pendiente_revisor(usuarioId.toString()));
    handleCloseModal();
  };

  const handleVerDocumento = (idArchivo: number) => {
    const url = `${API_ENDPOINT}/gedocumental/descargar/${idArchivo}/`;
    window.open(url, "_blank");
  };

  useEffect(() => {
    const userDataString = localStorage.getItem("userData");
    if (!userDataString) return;
    const userData = JSON.parse(userDataString);
    dispatch(get_factura_pendiente_revisor(userData.id.toString()));
  }, [dispatch]);

  // FunciÃ³n para determinar si el usuario puede revisar una factura
  const puedeRevisar = (archivo: any) => {
    const usuarioActualId = parseInt(localStorage.getItem("userData") ? JSON.parse(localStorage.getItem("userData")!).id : "0");
    
    // Si es el primer revisor y no ha revisado
    if (archivo.IdRevisor === usuarioActualId && !archivo.RevisionPrimera) {
      return true;
    }
    
    // Si es el segundo revisor, el primero aprobÃ³ y no ha revisado
    if (archivo.IdRevisorTesoreria === usuarioActualId && 
        archivo.RevisionPrimera === true && 
        !archivo.FechaRevisionSegunda) {
      return true;
    }
    
    // Si es el tercer revisor, los dos primeros aprobaron y no ha revisado y no estÃ¡ rechazada
    if (archivo.UsuarioCuentasMedicas === usuarioActualId && 
        archivo.RevisionPrimera === true && 
        archivo.RevisionSegunda === true && 
        !archivo.FechaRevisionTercera &&
        !archivo.FechaRechazo) {
      return true;
    }
    
    return false;
  };

  const columnsPendientes: GridColDef[] = [
    {
      field: 'FechaCreacionArchivo',
      headerName: 'Fecha CreaciÃ³n',
      width: 150,
      sortable: false,
      valueFormatter: (params: any) => {
        if (params.value) {
          return new Date(params.value).toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
        return '';
      },
    },

    {
      field: 'TipoHallazgo',
      headerName: 'Nombre',
      width: 200,
      sortable: false,
    },
    {
      field: 'IdRevisor',
      headerName: 'Revisor 1',
      width: 150,
      sortable: false,
      renderCell: (params: any) => {
        console.log('IdRevisor value:', params.value, 'type:', typeof params.value);
        const user = users.find((u) => u.id === params.value);
        return <span>{user?.nombre || user?.username || "Sin asignar"}</span>;
      },
    },
    
    {
      field: 'RevisionPrimera',
      headerName: 'Estado 1',
      width: 120,
      sortable: false,
      renderCell: (params: any) => {
        const archivo = params.row;
        if (archivo.FechaRevisionPrimera) {
          if (archivo.FechaRechazo && archivo.UsuarioRechazo === archivo.IdRevisor) {
            return 'âŒ Rechazada';
          }
          return archivo.RevisionPrimera ? 'âœ… Aprobada' : 'â³ No aprobada';
        }
        return 'â³ Pendiente';
      },
    },
    {
      field: 'FechaRevisionPrimera',
      headerName: 'Fecha 1Âª RevisiÃ³n',
      width: 150,
      sortable: false,
      valueFormatter: (params: any) => {
        if (params.value) {
          return new Date(params.value).toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
        return '';
      },
    },
    {
      field: 'IdRevisorTesoreria',
      headerName: 'Revisor 2',
      width: 150,
      sortable: false,
      renderCell: (params: any) => {
        if (!params.value) return <span>â€”</span>;
        const user = users.find((u) => u.id === params.value);
        return <span>{user?.nombre || user?.username || "Sin asignar"}</span>;
      },
    },
    
    {
      field: 'RevisionSegunda',
      headerName: 'Estado 2',
      width: 120,
      sortable: false,
      renderCell: (params: any) => {
        const archivo = params.row;
        if (archivo.FechaRevisionSegunda) {
          return archivo.RevisionSegunda ? 'âœ… Aprobada' : 'âŒ Rechazada';
        }
        return 'â³ Pendiente';
      },
    },
    {
      field: 'FechaRevisionSegunda',
      headerName: 'Fecha 2Âª RevisiÃ³n',
      width: 150,
      sortable: false,
      valueFormatter: (params: any) => {
        if (params.value) {
          return new Date(params.value).toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
        return '';
      },
    },

    


 
 
   
    {
      field: 'UsuarioCuentasMedicas',
      headerName: 'Revisor 3',
      width: 150,
      sortable: false,
      renderCell: (params: any) => {
        if (!params.value) return <span>â€”</span>;
        const user = users.find((u) => u.id === params.value);
        return <span>{user?.nombre || user?.username || "Sin asignar"}</span>;
      },
    },
    {
      field: 'RevisionTercera',
      headerName: 'Estado 3',
      width: 120,
      sortable: false,
      renderCell: (params: any) => {
        const archivo = params.row;
        if (archivo.FechaRevisionTercera) {
          return archivo.RevisionTercera ? 'âœ… Aprobada' : 'âŒ Rechazada';
        }
        return 'â³ Pendiente';
      },
    },
    {
      field: 'FechaRevisionTercera',
      headerName: 'Fecha 3Âª RevisiÃ³n',
      width: 150,
      sortable: false,
      valueFormatter: (params: any) => {
        if (params.value) {
          return new Date(params.value).toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
        return '';
      },
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 200,
      sortable: false,
      renderCell: (params: any) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="contained"
            color="success"
            size="small"
            onClick={() => handleOpenModal(params.row.IdArchivo, "aprobar")}
            disabled={!puedeRevisar(params.row as IObjAdmision)}
          >
            Aprobar
          </Button>
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={() => handleOpenModal(params.row.IdArchivo, "rechazar")}
            disabled={!puedeRevisar(params.row as IObjAdmision)}
          >
            Rechazar
          </Button>
        </div>
      ),
    },
    {
      field: 'verDocumento',
      headerName: 'Ver Documento',
      width: 120,
      renderCell: (params: any) => (
        <Button
          variant="outlined"
          size="small"
          startIcon={<VisibilityIcon />}
          onClick={() => handleVerDocumento(params.row.IdArchivo)}
        >
          Ver
        </Button>
      ),
    },
  ];

  const columnsHistorial = [
    {
      field: 'FechaCreacionArchivo',
      headerName: 'Fecha CreaciÃ³n',
      width: 150,
      sortable: false,
      valueFormatter: (params: any) => {
        if (params.value) {
          return new Date(params.value).toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
        return '';
      },
    },
    {
      field: 'TipoHallazgo',
      headerName: 'Nombre',
      width: 200,
      sortable: false,
    },
    {
      field: 'IdRevisor',
      headerName: 'Revisor 1',
      width: 150,
      sortable: false,
      renderCell: (params: any) => {
        const user = users.find((u) => u.id === params.value);
        return <span>{user?.nombre || user?.username || "Sin asignar"}</span>;
      },
    },
    {
      field: 'FechaRevisionPrimera',
      headerName: 'Fecha 1Âª RevisiÃ³n',
      width: 150,
      sortable: false,
      valueFormatter: (params: any) => {
        if (params.value) {
          return new Date(params.value).toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
        return '';
      },
    },
    {
      field: 'RevisionPrimera',
      headerName: 'Estado 1',
      width: 120,
      sortable: false,
      renderCell: (params: any) => {
        const archivo = params.row;
        if (archivo.FechaRevisionPrimera) {
          return archivo.RevisionPrimera ? 'âœ… Aprobada' : 'âŒ Rechazada';
        }
        return 'â³ Pendiente';
      },
    },
    {
      field: 'IdRevisorTesoreria',
      headerName: 'Revisor 2',
      width: 150,
      sortable: false,
      renderCell: (params: any) => {
        if (!params.value) return <span>â€”</span>;
        const user = users.find((u) => u.id === params.value);
        return <span>{user?.nombre || user?.username || "Sin asignar"}</span>;
      },
    },
 
    {
      field: 'FechaRevisionSegunda',
      headerName: 'Fecha 2Âª RevisiÃ³n',
      width: 150,
      sortable: false,
      valueFormatter: (params: any) => {
        if (params.value) {
          return new Date(params.value).toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
        return '';
      },
    },
  
   
    {
      field: 'RevisionSegunda',
      headerName: 'Estado 2',
      width: 120,
      sortable: false,
      renderCell: (params: any) => {
        const archivo = params.row;
        if (archivo.FechaRevisionSegunda) {
          return archivo.RevisionSegunda ? 'âœ… Aprobada' : 'âŒ Rechazada';
        }
        return 'â³ Pendiente';
      },
    },
   
  
    {
      field: 'UsuarioCuentasMedicas',
      headerName: 'Revisor 3',
      width: 150,
      sortable: false,
      renderCell: (params: any) => {
        if (!params.value) return <span>â€”</span>;
        const user = users.find((u) => u.id === params.value);
        return <span>{user?.nombre || user?.username || "Sin asignar"}</span>;
      },
    },
    {
      field: 'RevisionTercera',
      headerName: 'Estado 3',
      width: 120,
      sortable: false,
      renderCell: (params: any) => {
        const archivo = params.row;
        if (archivo.FechaRevisionTercera) {
          return archivo.RevisionTercera ? 'âœ… Aprobada' : 'âŒ Rechazada';
        }
        return 'â³ Pendiente';
      },
    },
    {
      field: 'FechaRevisionTercera',
      headerName: 'Fecha 3Âª RevisiÃ³n',
      width: 150,
      sortable: false,
      valueFormatter: (params: any) => {
        if (params.value) {
          return new Date(params.value).toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
        return '';
      },
    },
   
    {
      field: 'FechaRechazo',
      headerName: 'Fecha Rechazo',
      width: 150,
      sortable: false,
      valueFormatter: (params: any) => {
        if (params.value) {
          return new Date(params.value).toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
        return '';
      },
    },
    {
      field: 'UsuarioRechazo',
      headerName: 'Usuario Rechazo',
      width: 150,
      sortable: false,
      valueGetter: (params: any) => {
        return obtenerNombreUsuario(params.row.UsuarioRechazo);
      },
    },
    {
      field: 'verDocumento',
      headerName: 'Ver Documento',
      width: 120,
      renderCell: (params: any) => (
        <Button
          variant="outlined"
          size="small"
          startIcon={<VisibilityIcon />}
          onClick={() => handleVerDocumento(params.row.IdArchivo)}
        >
          Ver
        </Button>
      ),
    },
  ];

  return (
    <div className="myContainer" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Title title="GESTIÃ“N DE FACTURAS - REVISIÃ“N Y APROBACIÃ“N" />
      
      <Box sx={{ width: '95%', marginTop: 2 }}>
        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)} centered>
          <Tab label={`FACTURAS PENDIENTES (${archivosPendientes.length})`} />
          <Tab label={`HISTORIAL (${archivosHistorial.length})`} />
        </Tabs>
      </Box>

      {currentTab === 0 && (
        <div style={{ width: "95%", display: "flex", justifyContent: "center", marginTop: 16 }}>
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
            density="compact"
            autoHeight
            columns={columnsPendientes}
            getRowId={(row: IObjAdmision) => row.IdArchivo ?? 0}
            rows={archivosPendientes}
          />
        </div>
      )}

      {currentTab === 1 && (
        <div style={{ width: "95%", display: "flex", justifyContent: "center", marginTop: 16 }}>
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
            density="compact"
            autoHeight
            columns={columnsHistorial}
            getRowId={(row: IObjAdmision) => row.IdArchivo ?? 0}
            rows={archivosHistorial}
          />
        </div>
      )}

      <Dialog open={modalOpen} onClose={handleCloseModal}
        PaperProps={{
          sx: {
            width: '600px',
            maxWidth: 'none'
          }
        }}>
        <DialogTitle>{modoAccion === "aprobar" ? "Opcional: escriba o presione ENVIAR" : "Rechazar Factura"}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="ObservaciÃ³n"
            fullWidth
            multiline
            minRows={3}
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancelar</Button>
          <Button onClick={handleEnviarAccion} color={modoAccion === "aprobar" ? "primary" : "error"} variant="contained">
            Enviar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
