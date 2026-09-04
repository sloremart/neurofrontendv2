import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  TextField, Autocomplete, Button, Snackbar, Alert,
  FormControl, InputLabel, Select, MenuItem,
  Box, Card, CardContent, Typography, Chip,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { get_users } from "../../../Login/store/thunks/ThunksLogin.tsx";
import { Title } from "../../../../components/Title.tsx";
import { AppDispatch, RootState } from "../../../../store/store.ts";
import { subir_facturas_proveedor } from "../store/thunks/CajaFacturacionThunks.tsx";

const SectionHeader = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <Box sx={{
    px: 2.5, py: 1.5,
    background: "linear-gradient(90deg, #381A73 0%, #1E2E71 60%, #0F4374 100%)",
    display: "flex", alignItems: "center", gap: 1,
    borderRadius: "8px 8px 0 0",
  }}>
    <Box sx={{ color: "rgba(255,255,255,0.8)", display: "flex", fontSize: 18 }}>{icon}</Box>
    <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 13, letterSpacing: 0.3 }}>
      {label}
    </Typography>
  </Box>
);

export const CajaFacturacion = () => {
  const dispatch = useDispatch<AppDispatch>();

  const [userSeleccionado, setUserSeleccionado] = useState<number | null>(null);
  const [revisorTesoreria, setRevisorTesoreria] = useState<number | null>(null);
  const [revisorTesoreriaSegundo, setRevisorTesoreriaSegundo] = useState<number | null>(null);
  const [selectedNit, setSelectedNit] = useState<{ label: string; value: string } | null>(null);
  const [inputValueNit, setInputValueNit] = useState<string>("");
  const [archivos, setArchivos] = useState<File[]>([]);
  const [alerta, setAlerta] = useState<{ open: boolean; msg: string; type: "success" | "error" }>({ open: false, msg: "", type: "success" });
  const [userId, setUserId] = useState<number | null>(null);

  const { users } = useSelector((state: RootState) => state.users);
  const nitOptions = (users ?? []).map((u) => ({
    label: u.nombre || u.username || `Usuario ${u.id}`,
    value: u.id.toString(),
  }));

  useEffect(() => {
    const ud = localStorage.getItem("userData");
    if (ud) setUserId(JSON.parse(ud).id);
  }, []);

  useEffect(() => { dispatch(get_users()); }, [dispatch]);

  return (
    <>
      <Box sx={{ p: 2 }}>
        <Title title={'CARGUE DE CAJA FACTURACIÓN'} />

        <Card variant="outlined" sx={{ borderRadius: 2, border: "1px solid #E5E7EB" }}>
          <SectionHeader icon={<UploadFileIcon />} label="Cargar factura" />
          <CardContent sx={{ pb: "16px !important" }}>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 2, mb: 2 }}>
              <Autocomplete
                options={nitOptions}
                getOptionLabel={(o) => o.label || ""}
                isOptionEqualToValue={(o, v) => o.value === v?.value}
                value={selectedNit}
                inputValue={inputValueNit}
                onInputChange={(_, v) => setInputValueNit(v)}
                onChange={(_, v) => setSelectedNit(v || null)}
                renderInput={(params) => <TextField {...params} label="Seleccionar usuario" size="small" />}
              />
              <FormControl size="small">
                <InputLabel>Revisor</InputLabel>
                <Select value={userSeleccionado ?? ""} onChange={(e) => setUserSeleccionado(e.target.value as number)} label="Revisor">
                  <MenuItem value=""><em>Seleccione revisor</em></MenuItem>
                  {users?.map((u) => <MenuItem key={u.id} value={u.id}>{u.nombre || u.username || `Usuario ${u.id}`}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small">
                <InputLabel>Revisor 2 (opcional)</InputLabel>
                <Select value={revisorTesoreria ?? ""} onChange={(e) => setRevisorTesoreria(e.target.value as number)} label="Revisor 2 (opcional)" disabled={!userSeleccionado}>
                  <MenuItem value=""><em>Sin segundo revisor</em></MenuItem>
                  {users?.filter(u => u.id !== userSeleccionado).map((u) => <MenuItem key={u.id} value={u.id}>{u.nombre || u.username || `Usuario ${u.id}`}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small">
                <InputLabel>Revisor 3 (opcional)</InputLabel>
                <Select value={revisorTesoreriaSegundo ?? ""} onChange={(e) => setRevisorTesoreriaSegundo(e.target.value as number)} label="Revisor 3 (opcional)" disabled={!userSeleccionado}>
                  <MenuItem value=""><em>Sin tercer revisor</em></MenuItem>
                  {users?.filter(u => u.id !== userSeleccionado).map((u) => <MenuItem key={u.id} value={u.id}>{u.nombre || u.username || `Usuario ${u.id}`}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadFileIcon />}
                size="small"
                sx={{
                  borderStyle: "dashed",
                  borderColor: archivos.length > 0 ? "#1E2E71" : "#D1D5DB",
                  color: archivos.length > 0 ? "#1E2E71" : "#6B7280",
                  minWidth: 200,
                }}
              >
                {archivos.length > 0 ? archivos[0].name : "Seleccionar PDF"}
                <input type="file" accept="application/pdf" hidden onChange={(e) => { if (e.target.files) setArchivos(Array.from(e.target.files)); }} />
              </Button>
              {archivos.length > 0 && (
                <Chip label={archivos[0].name} size="small" onDelete={() => setArchivos([])} sx={{ maxWidth: 220 }} />
              )}
              <Box sx={{ flex: 1 }} />
              <Button
                variant="contained"
                disabled={!selectedNit || archivos.length === 0 || !userId || !userSeleccionado}
                sx={{ background: "linear-gradient(90deg, #381A73, #1E2E71)", px: 3 }}
                onClick={async () => {
                  const nitLimpio = selectedNit?.value?.replace(/\./g, "");
                  if (!nitLimpio || !userId || !userSeleccionado) return;
                  const resultado = await dispatch(
                    subir_facturas_proveedor(
                      nitLimpio, archivos, "FACTURAPROVEEDOR",
                      userId.toString(), userSeleccionado.toString(),
                      selectedNit?.label || "",
                      revisorTesoreria?.toString(),
                      revisorTesoreriaSegundo?.toString()
                    )
                  );
                  if (resultado && (resultado as any[]).length > 0) {
                    setAlerta({ open: true, msg: "Factura(s) cargada(s) correctamente", type: "success" });
                    setArchivos([]);
                  }
                }}
              >
                Guardar
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Snackbar open={alerta.open} autoHideDuration={4000} onClose={() => setAlerta({ ...alerta, open: false })}>
        <Alert severity={alerta.type} onClose={() => setAlerta({ ...alerta, open: false })}>{alerta.msg}</Alert>
      </Snackbar>
    </>
  );
};

export default CajaFacturacion;
