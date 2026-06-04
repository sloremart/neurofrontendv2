import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../../store/store";
import { Title } from "../../../../components/Title.tsx";
import { actualizar_numero_egreso, eliminar_factura_proveedor, get_facturas_usuario_filtrado, get_nits, subir_facturas_proveedor } from "../store/thunks/CajaFacturacionThunks.tsx";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { TextField, Autocomplete, Button, debounce, Snackbar, Alert, FormControl, InputLabel, Select, MenuItem, DialogTitle, DialogContent, Dialog, DialogActions, IconButton, Tooltip, } from "@mui/material";
import { get_users } from "../../../Login/store/thunks/ThunksLogin.tsx";
import { DataGrid, GridColDef, GridToolbarExport } from "@mui/x-data-grid";
import { Dayjs } from "dayjs";
import { CheckCircle, Cancel, Block, Close } from "@mui/icons-material";
import { green, red } from "@mui/material/colors";
import CONFIG from "../../../../config/api.js";
import AddBoxIcon from "@mui/icons-material/AddBox";
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import CommentIcon from "@mui/icons-material/Comment";

const API_ENDPOINT = CONFIG.API_ENDPOINT;

export const GeDocumentalProgramacion = () => {
    const dispatch = useDispatch<AppDispatch>();

    const nitsData = useSelector((state: RootState) => state.caja_facturacion.nits);

    const [userSeleccionado, setUserSeleccionado] = useState<number | null>(null);
    const [revisorTesoreria, setRevisorTesoreria] = useState<number | null>(null);
    const [revisorTesoreriaSegundo, setRevisorTesoreriaSegundo] = useState<number | null>(null);
    const [selectedNit, setSelectedNit] = useState<{ label: string; value: string } | null>(null);
    const [inputValueNit, setInputValueNit] = useState<string>("");
    const [alerta, setAlerta] = useState<{ open: boolean; msg: string; type: "success" | "error" }>({ open: false, msg: "", type: "success" });
    const [userId, setUserId] = useState<number | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [documentoEgreso, setDocumentoEgreso] = useState<string>("");
    const [facturaSeleccionada, setFacturaSeleccionada] = useState<number | null>(null);
    const [archivos, setArchivos] = useState<File[]>([]);
    const [estadoFiltro, setEstadoFiltro] = useState<string | null>(null);
    const [fechaInicio, setFechaInicio] = useState<Dayjs | null>(null);
    const [fechaFin, setFechaFin] = useState<Dayjs | null>(null);
    const [nitBusqueda, setNitBusqueda] = useState<string>("");
    const [modalObservacionesOpen, setModalObservacionesOpen] = useState(false);
    const [observacionesSeleccionadas, setObservacionesSeleccionadas] = useState<string[]>([]);

    const facturasCreadas = useSelector((state: RootState) => state.caja_facturacion.archivos);
    const nitOptions = nitsData.map((nit) => ({
        label: nit.NombreNit || "Sin nombre",
        value: nit.CuentaNit.toString(),
    }));
    const { users } = useSelector((state: RootState) => state.users);

const formatearFechaHora = (fechaString: string) => {
    if (!fechaString) return "";
    try {
      const fecha = new Date(fechaString);
      if (isNaN(fecha.getTime())) return fechaString;
      const dia = fecha.getDate().toString().padStart(2, '0');
      const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
      const año = fecha.getFullYear();
      const hora = fecha.getHours().toString().padStart(2, '0');
      const minutos = fecha.getMinutes().toString().padStart(2, '0');
      return `${dia}/${mes}/${año} ${hora}:${minutos}`;
    } catch (error) {
      return fechaString;
    }
  };

    useEffect(() => {
        const userDataString = localStorage.getItem("userData");
        if (userDataString) {
            const userData = JSON.parse(userDataString);
            setUserId(userData.id);
        }
    }, []);

    useEffect(() => {
        dispatch(get_users());
    }, [dispatch]);

    const handleSearchNit = debounce(async (value) => {
        if (value.length > 2) {
            await dispatch(get_nits(value));
        }
    }, 500);

    const consultarFacturasUsuario = async () => {
        if (!userId) return;
        await dispatch(get_facturas_usuario_filtrado({
            idUsuario: userId,
            fechaInicio: fechaInicio?.format("YYYY-MM-DD"),
            fechaFin: fechaFin?.format("YYYY-MM-DD"),
            estado: estadoFiltro as any,
            numeroAdmision: nitBusqueda,
        }));
    };

    const handleVerDocumento = (idArchivo: number) => {
        const url = `${API_ENDPOINT}/gedocumental/descargar/${idArchivo}/`;
        window.open(url, "_blank");
    };

    const handleGuardarDocumento = async () => {
        if (!facturaSeleccionada || !documentoEgreso.trim()) return;
        const response = await dispatch(actualizar_numero_egreso({
            idArchivo: facturaSeleccionada,
            numeroDocumento: documentoEgreso.trim()
        })).unwrap();
        if (response?.success) {
            setModalOpen(false);
            setDocumentoEgreso("");
            setFacturaSeleccionada(null);
            await consultarFacturasUsuario();
        }
    };

    const handleEliminarFactura = async (idArchivo: number) => {
        const resultado = await dispatch(eliminar_factura_proveedor(idArchivo));
        if (resultado) {
            await consultarFacturasUsuario();
        }
    };

    const columns: GridColDef[] = [
        {
            field: "TipoHallazgo",
            headerName: "Proveedor",
            width: 350,
            headerAlign: 'center',
            align: 'center',
        },
        {
            field: "FechaCreacionArchivo",
            headerName: "Fecha Creación",
            width: 350,
            headerAlign: 'center',
            align: 'center',
            valueFormatter: (params) => formatearFechaHora(params.value),
        },
        {
            field: "Admision_id",
            headerName: "Comprobante",
            width: 100,
            headerAlign: 'center',
            align: 'center',
            renderCell: (params) => (
                params.value && params.value !== 0 ? params.value : "—"
            ),
        },
        {
            field: "IdRevisor",
            headerName: "Revisión 1",
            width: 300,
            renderCell: (params) => {
                const user = users.find((u) => u.id === params.value);
                return <span>{user?.nombre || user?.username || "Sin asignar"}</span>;
            },
            headerAlign: "center",
            align: "center",
        },
        {
            field: "RevisionPrimera",
            headerName: "Aprobación 1",
            width: 100,
            renderCell: (params) => {
                if (params.value) {
                    return <CheckCircle style={{ color: green[500] }} />;
                } else if (params.row.FechaRechazo && params.row.UsuarioRechazo === params.row.IdRevisor) {
                    return <Close style={{ color: red[500] }} />;
                } else {
                    return <Block style={{ color: red[500] }} />;
                }
            },
            headerAlign: 'center',
            align: 'center',
        },
        {
            field: "FechaRevisionPrimera",
            headerName: "Fecha Revisión 1",
            width: 350,
            headerAlign: 'center',
            align: 'center',
            valueFormatter: (params) => formatearFechaHora(params.value),
        },
        {
            field: "IdRevisorTesoreria",
            headerName: "Revisión 2",
            width: 300,
            renderCell: (params) => {
                const user = users.find((u) => u.id === params.value);
                return <span>{user?.nombre || user?.username || "—"}</span>;
            },
            headerAlign: "center",
            align: "center",
        },
        {
            field: "RevisionSegunda",
            headerName: "Aprobación 2",
            width: 100,
            renderCell: (params) => {
                if (params.row.IdRevisorTesoreria) {
                    if (params.value) {
                        return <CheckCircle style={{ color: green[500] }} />;
                    } else if (params.row.FechaRechazo && params.row.UsuarioRechazo === params.row.IdRevisorTesoreria) {
                        return <Close style={{ color: red[500] }} />;
                    } else {
                        return <Block style={{ color: red[500] }} />;
                    }
                } else {
                    return null;
                }
            },
            headerAlign: "center",
            align: "center",
        },
        {
            field: "FechaRevisionSegunda",
            headerName: "Fecha Revisión 2",
            width: 350,
            headerAlign: 'center',
            align: 'center',
            valueFormatter: (params) => formatearFechaHora(params.value),
        },
        {
            field: "FechaRechazo",
            headerName: "Fecha Rechazo",
            width: 350,
            headerAlign: 'center',
            align: 'center',
            valueFormatter: (params) => formatearFechaHora(params.value),
        },
        {
            field: "UsuarioRechazo",
            headerName: "Usuario Rechazo",
            width: 200,
            headerAlign: 'center',
            align: 'center',
            renderCell: (params) => {
                if (params.value) {
                    const user = users.find((u) => u.id === params.value);
                    return <span>{user?.nombre || user?.username || `Usuario ${params.value}`}</span>;
                }
                return <span>—</span>;
            },
        },
        {
            field: "FechaRevisionTercera",
            headerName: "Fecha Revisión 3",
            width: 350,
            headerAlign: 'center',
            align: 'center',
            valueFormatter: (params) => formatearFechaHora(params.value),
        },
        {
            field: "UsuarioCuentasMedicas",
            headerName: "Revisión 3",
            width: 300,
            renderCell: (params) => {
                const user = users.find((u) => u.id === params.value);
                return <span>{user?.nombre || user?.username || "—"}</span>;
            },
            headerAlign: "center",
            align: "center",
        },
        {
            field: "RevisionTercera",
            headerName: "Aprobación 3",
            width: 100,
            renderCell: (params) => {
                if (params.row.UsuarioCuentasMedicas) {
                    if (params.value) {
                        return <CheckCircle style={{ color: green[500] }} />;
                    } else if (params.row.FechaRechazo && params.row.UsuarioRechazo === params.row.UsuarioCuentasMedicas) {
                        return <Close style={{ color: red[500] }} />;
                    } else {
                        return <Block style={{ color: red[500] }} />;
                    }
                } else {
                    return null;
                }
            },
            headerAlign: "center",
            align: "center",
        },
        {
            field: "verObservaciones",
            headerName: "",
            width: 50,
            renderCell: (params) => {
                const observaciones = params.row.Observaciones || [];
                return observaciones.length > 0 ? (
                    <Tooltip title="Ver Observaciones">
                        <IconButton
                         sx={{ color: "#08717A" }}
                            color="primary"
                            size="small"
                            onClick={() => {
                                const descripciones = observaciones.map((obs: { Descripcion: string }) => obs.Descripcion);
                                setObservacionesSeleccionadas(descripciones);
                                setModalObservacionesOpen(true);
                            }}
                        >
                            <CommentIcon />
                        </IconButton>
                    </Tooltip>
                ) : null;
            },
            align: "center",
            headerAlign: "center",
        },
        {
            field: "egreso",
            headerName: "",
            width: 50,
            renderCell: (params) =>
                params.row.RevisionPrimera ? (
                    <Tooltip title="Agregar Comprobante">
                        <IconButton
                       sx={{ color: " #1E2E71 " }}
                            color="primary"
                            size="small"
                            onClick={() => {
                                setFacturaSeleccionada(params.row.IdArchivo);
                                setModalOpen(true);
                            }}
                        >
                              <AddBoxIcon />
                        </IconButton>
                    </Tooltip>
                ) : null,
            align: "center",
            headerAlign: "center",
        },
        {
            field: "verDocumento",
            headerName: "",
            width: 50,
            renderCell: (params) => (
                <Tooltip title="Ver Documento">
                    <IconButton
                     sx={{ color: " #381A73 " }}
                        color="primary"
                        size="small"
                        onClick={() => handleVerDocumento(params.row.IdArchivo)}
                    >
                        <VisibilityIcon />
                    </IconButton>
                </Tooltip>
            ),
            align: "center",
            headerAlign: "center",
        },
        {
            field: "acciones",
            headerName: "",
            width: 50,
            renderCell: (params) => {
                if (userId === 227) {
                    return null;
                }
                return (
                    <Tooltip title="Eliminar Factura">
                        <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleEliminarFactura(params.row.IdArchivo)}
                        >
                            <DeleteIcon />
                        </IconButton>
                    </Tooltip>
                );
            },
            align: "center",
            headerAlign: "center",
        },
    ];

    return (
        <>
            <div className="myContainer" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "80px" }}>
                <Title title="GESTIÓN DOCUMENTAL - PROGRAMACIÓN DE PAGOS - NEURODX" />

                <div style={{ display: "flex", gap: "10px", marginTop: "40px", width: "100%", justifyContent: "center" }}>
                    <div style={{ width: "450px" }}>
                        <Autocomplete
                            options={nitOptions}
                            getOptionLabel={(option) => option.label || ""}
                            isOptionEqualToValue={(option, value) => option.value === value?.value}
                            value={selectedNit}
                            inputValue={inputValueNit}
                            onInputChange={(_, newInputValue) => {
                                setInputValueNit(newInputValue);
                                handleSearchNit(newInputValue);
                            }}
                            onChange={(_, newValue) => setSelectedNit(newValue || null)}
                            renderInput={(params) => (
                                <TextField {...params} label="Buscar y seleccionar NIT" variant="outlined" fullWidth />
                            )}
                        />
                    </div>
                    <div style={{ marginLeft: "20px", marginRight: "20px" }}>
                        <Button
                            variant="outlined"
                            component="label"
                            style={{ height: "60px", minWidth: "250px", display: "flex", justifyContent: "center", alignItems: "center" }}
                        >
                            {archivos.length > 0 ? archivos[0].name : "Cargar PDF"}
                            <input
                                type="file"
                                accept="application/pdf"
                                hidden
                                onChange={(e) => {
                                    if (e.target.files) {
                                        setArchivos(Array.from(e.target.files));
                                    }
                                }}
                            />
                        </Button>
                    </div>

                    <FormControl variant="outlined" fullWidth style={{ width: "450px", backgroundColor: "white" }}>
                        <InputLabel id="user-select-label">Revisor</InputLabel>
                        <Select
                            labelId="user-select-label"
                            value={userSeleccionado ?? ""}
                            onChange={(e) => setUserSeleccionado(e.target.value as number)}
                            label="Revisor"
                        >
                            <MenuItem value=""><em>Seleccione un revisor</em></MenuItem>
                            {users?.map((user) => (
                                <MenuItem key={user.id} value={user.id}>
                                    {user.nombre || user.username || `Usuario ${user.id}`}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl variant="outlined" fullWidth style={{ width: "450px", backgroundColor: "white" }}>
                        <InputLabel id="tesoreria-select-label">Revisor 2(opcional)</InputLabel>
                        <Select
                            labelId="tesoreria-select-label"
                            value={revisorTesoreria ?? ""}
                            onChange={(e) => setRevisorTesoreria(e.target.value as number)}
                            label="Revisor Tesorería"
                            disabled={userSeleccionado === null}
                        >
                            <MenuItem value=""><em>Sin segundo revisor</em></MenuItem>
                            {users
                                ?.filter((user) => user.id !== userSeleccionado)
                                .map((user) => (
                                    <MenuItem key={user.id} value={user.id}>
                                        {user.nombre || user.username || `Usuario ${user.id}`}
                                    </MenuItem>
                                ))}
                        </Select>
                    </FormControl>
                    <FormControl variant="outlined" fullWidth style={{ width: "450px", backgroundColor: "white" }}>
                        <InputLabel id="tesoreria-select-label2">Revisor 3(opcional)</InputLabel>
                        <Select
                            labelId="tesoreria-select-label2"
                            value={revisorTesoreriaSegundo ?? ""}
                            onChange={(e) => setRevisorTesoreriaSegundo(e.target.value as number)}
                            label="Revisor Tesorería"
                            disabled={userSeleccionado === null}
                        >
                            <MenuItem value=""><em>Sin tercer revisor</em></MenuItem>
                            {users
                                ?.filter((user) => user.id !== userSeleccionado)
                                .map((user) => (
                                    <MenuItem key={user.id} value={user.id}>
                                        {user.nombre || user.username || `Usuario ${user.id}`}
                                    </MenuItem>
                                ))}
                        </Select>
                    </FormControl>
                    <div style={{ marginLeft: "20px", marginRight: "20px" }}>
                        <Button
                            variant="contained"
                            color="primary"
                            style={{ height: "60px", minWidth: "100px", display: "flex", justifyContent: "center", alignItems: "center" }}
                            disabled={!selectedNit || archivos.length === 0 || !userId || !userSeleccionado}
                            onClick={async () => {
                                const nit = selectedNit?.value;
                                const nitLimpio = nit?.replace(/\./g, "");
                                if (!nitLimpio || archivos.length === 0 || !userId || !userSeleccionado) return;
                                const resultado = await dispatch(
                                    subir_facturas_proveedor(
                                        nitLimpio,
                                        archivos,
                                        "FACTURAPROVEEDOR",
                                        userId.toString(),
                                        userSeleccionado.toString(),
                                        selectedNit?.label || "",
                                        revisorTesoreria?.toString(),
                                        revisorTesoreriaSegundo?.toString()
                                    )
                                );
                                if (resultado && resultado.length > 0) {
                                    setAlerta({ open: true, msg: "Factura(s) cargada(s) correctamente", type: "success" });
                                    setArchivos([]);
                                }
                            }}
                        >
                            Guardar
                        </Button>
                    </div>
                </div>

                <Title title="SEGUIMIENTO FACTURAS PROVEEDORES - NEURODX" />
                <div style={{ display: "flex", gap: "20px", marginTop: "50px", alignItems: "center" }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="Fecha Inicio"
                            value={fechaInicio}
                            onChange={(newDate) => setFechaInicio(newDate)}
                        />
                    </LocalizationProvider>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="Fecha Fin"
                            value={fechaFin}
                            onChange={(newDate) => setFechaFin(newDate)}
                        />
                    </LocalizationProvider>
                    <Autocomplete
                        options={nitOptions}
                        getOptionLabel={(option) => option.label || ""}
                        isOptionEqualToValue={(option, value) => option.value === value?.value}
                        value={nitOptions.find((nit) => nit.value === nitBusqueda) || null}
                        onChange={(_, newValue) => {
                            setNitBusqueda(newValue ? newValue.value : "");
                        }}
                        onInputChange={(_, newInputValue) => {
                            handleSearchNit(newInputValue);
                        }}
                        renderInput={(params) => (
                            <TextField {...params} label="Buscar por NIT" variant="outlined" />
                        )}
                        style={{ width: 300 }}
                    />
                    <FormControl>
                        <InputLabel id="estado-select-label">Estado</InputLabel>
                        <Select
                            labelId="estado-select-label"
                            value={estadoFiltro ?? ""}
                            onChange={(e) => setEstadoFiltro(e.target.value)}
                            style={{ width: 160 }}
                        >
                            <MenuItem value="">Todos</MenuItem>
                            <MenuItem value="aprobada">Aprobada</MenuItem>
                            <MenuItem value="rechazada">Rechazada</MenuItem>
                            <MenuItem value="pendiente">Pendiente</MenuItem>
                        </Select>
                    </FormControl>
                    <Button variant="contained" onClick={consultarFacturasUsuario}>Buscar</Button>
                </div>

                <div style={{ width: "95%", display: "flex", justifyContent: "center", marginTop: "10px" }}>
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
                        rowHeight={80}
                        columns={columns}
                        getRowId={(row) => row.IdArchivo}
                        rows={facturasCreadas}
                        components={{
                            Toolbar: GridToolbarExport,
                        }}
                    />
                </div>

                <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
                    <DialogTitle>Ingresar número de comprobante</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Número de documento"
                            fullWidth
                            value={documentoEgreso}
                            onChange={(e) => setDocumentoEgreso(e.target.value)}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button variant="contained" onClick={handleGuardarDocumento}>Guardar</Button>
                    </DialogActions>
                </Dialog>
            </div>

            <Dialog open={modalObservacionesOpen} onClose={() => setModalObservacionesOpen(false)}>
                <DialogTitle>Observaciones</DialogTitle>
                <DialogContent dividers>
                    {observacionesSeleccionadas.map((obs, index) => (
                        <div key={index} style={{ marginBottom: "1rem", whiteSpace: "pre-wrap" }}>
                            {obs}
                        </div>
                    ))}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setModalObservacionesOpen(false)}>Cerrar</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={alerta.open} autoHideDuration={4000} onClose={() => setAlerta({ ...alerta, open: false })}>
                <Alert severity={alerta.type} onClose={() => setAlerta({ ...alerta, open: false })}>
                    {alerta.msg}
                </Alert>
            </Snackbar>
        </>
    );
};

export default GeDocumentalProgramacion;
