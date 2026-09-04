import React, { useRef, useState } from 'react';
import { Button, Chip, Box, Typography, Paper } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { Title } from '../../components/Title.tsx';
import CONFIG from '../../config/api.js';
import { getToken } from '../../config/token.jsx';

interface Resultado {
  id: number;
  estado: 'actualizado' | 'no_encontrado' | 'sin_cambio' | 'error';
  doc_id: string;
  nombre: string;
  cups: string;
  nro_autorizacion: string;
  fecha_admision?: string;
  mensaje: string;
}

interface Respuesta {
  total_procesadas: number;
  actualizados: number;
  no_encontrados: number;
  sin_cambio: number;
  errores: number;
  resultados: Omit<Resultado, 'id'>[];
}

const CHIP_PROPS: Record<string, { label: string; color: 'success' | 'error' | 'warning' | 'default' }> = {
  actualizado:   { label: 'Actualizado',    color: 'success' },
  no_encontrado: { label: 'No encontrado',  color: 'error' },
  sin_cambio:    { label: 'Sin cambio',     color: 'warning' },
  error:         { label: 'Error',          color: 'default' },
};

const COLUMNS: GridColDef[] = [
  {
    field: 'estado',
    headerName: 'Estado',
    width: 150,
    renderCell: (params: GridRenderCellParams) => {
      const p = CHIP_PROPS[params.value] ?? { label: params.value, color: 'default' };
      return <Chip label={p.label} color={p.color} size="small" />;
    },
  },
  { field: 'doc_id',          headerName: 'Documento',       width: 130, headerAlign: 'center', align: 'center' },
  { field: 'nombre',          headerName: 'Nombre',          flex: 1,    minWidth: 180 },
  { field: 'cups',            headerName: 'CUPS',            width: 110, headerAlign: 'center', align: 'center' },
  { field: 'nro_autorizacion',headerName: 'N° Autorización', width: 180, headerAlign: 'center', align: 'center' },
  { field: 'fecha_admision',  headerName: 'Fecha Admisión',  width: 130, headerAlign: 'center', align: 'center',
    valueFormatter: (params: any) => params.value ?? '—' },
  { field: 'mensaje',         headerName: 'Detalle',         flex: 1,    minWidth: 200 },
];

const StatCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <Paper elevation={1} sx={{ p: 2, textAlign: 'center', borderRadius: 2, minWidth: 130 }}>
    <Typography variant="h4" fontWeight={700} color={color}>{value}</Typography>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
  </Paper>
);

const CargaAutorizaciones: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [cargando, setCargando]           = useState(false);
  const [respuesta, setRespuesta]         = useState<Respuesta | null>(null);
  const [error, setError]                 = useState('');
  const [filtro, setFiltro]               = useState('todos');

  const handleSeleccionar = () => inputRef.current?.click();

  const handleArchivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setNombreArchivo(file.name);
  };

  const handleProcesar = async () => {
    const file = inputRef.current?.files?.[0];
    if (!file) { setError('Selecciona un archivo Excel primero.'); return; }
    setError(''); setRespuesta(null); setCargando(true);
    const form = new FormData();
    form.append('archivo', file);
    try {
      const res = await fetch(`${CONFIG.API_ENDPOINT}/dashboard/carga-autorizaciones/`, {
        method: 'POST',
        headers: { Authorization: `Token ${getToken()}` },
        body: form,
      });
      if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
      setRespuesta(await res.json());
      setFiltro('todos');
    } catch (err: any) {
      setError(err.message || 'Error al procesar el archivo.');
    } finally {
      setCargando(false);
    }
  };

  const filas: Resultado[] = respuesta
    ? (filtro === 'todos'
        ? respuesta.resultados
        : respuesta.resultados.filter(r => r.estado === filtro)
      ).map((r, i) => ({ id: i, ...r }))
    : [];

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Title title="CARGA DE AUTORIZACIONES" />

      {/* Zona de carga */}
      <Paper
        variant="outlined"
        sx={{
          mt: 3, p: 4, textAlign: 'center', borderRadius: 3,
          borderStyle: 'dashed', borderColor: 'divider', bgcolor: 'grey.50',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
          onChange={handleArchivoChange}
        />
        <UploadFileIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
        <Typography variant="body2" color="text.secondary" mb={2}>
          {nombreArchivo || 'Selecciona el archivo Excel de autorizaciones de la EPS'}
        </Typography>
        <Button variant="outlined" onClick={handleSeleccionar}>
          Seleccionar archivo
        </Button>
      </Paper>

      <Button
        variant="contained"
        startIcon={<CheckCircleOutlineIcon />}
        onClick={handleProcesar}
        disabled={cargando || !nombreArchivo}
        sx={{ mt: 2, mb: 3 }}
      >
        {cargando ? 'Procesando...' : 'Procesar autorizaciones'}
      </Button>

      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: '#fef2f2', border: '1px solid #fca5a5' }}>
          <Typography color="error" variant="body2">{error}</Typography>
        </Paper>
      )}

      {/* Resultados */}
      {respuesta && (
        <>
          {/* Tarjetas resumen */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            <StatCard label="Procesadas"     value={respuesta.total_procesadas} color="#1e3a8a" />
            <StatCard label="Actualizadas"   value={respuesta.actualizados}     color="success.main" />
            <StatCard label="No encontradas" value={respuesta.no_encontrados}   color="error.main" />
            <StatCard label="Sin cambio"     value={respuesta.sin_cambio}       color="warning.main" />
            <StatCard label="Errores"        value={respuesta.errores}          color="text.secondary" />
          </Box>

          {/* Filtros */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {[
              { key: 'todos',        label: `Todos (${respuesta.total_procesadas})` },
              { key: 'actualizado',  label: `Actualizados (${respuesta.actualizados})` },
              { key: 'no_encontrado',label: `No encontrados (${respuesta.no_encontrados})` },
              { key: 'sin_cambio',   label: `Sin cambio (${respuesta.sin_cambio})` },
              { key: 'error',        label: `Errores (${respuesta.errores})` },
            ].map(f => (
              <Button
                key={f.key}
                size="small"
                variant={filtro === f.key ? 'contained' : 'outlined'}
                onClick={() => setFiltro(f.key)}
              >
                {f.label}
              </Button>
            ))}
          </Box>

          {/* Tabla */}
          <Box sx={{ height: 520 }}>
            <DataGrid
              rows={filas}
              columns={COLUMNS}
              pageSizeOptions={[25, 50, 100]}
              initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
              density="compact"
              disableRowSelectionOnClick
              sx={{
                borderRadius: 2,
                '& .MuiDataGrid-columnHeaders': {
                  background: 'linear-gradient(45deg, #381A73, #1E2E71)',
                  color: '#fff',
                  fontWeight: 700,
                },
                '& .MuiDataGrid-columnHeaderTitle': { color: '#fff' },
                '& .MuiDataGrid-sortIcon, & .MuiDataGrid-menuIconButton': { color: '#fff' },
              }}
            />
          </Box>
        </>
      )}
    </Box>
  );
};

export default CargaAutorizaciones;
