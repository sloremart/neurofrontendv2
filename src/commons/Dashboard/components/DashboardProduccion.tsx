import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Chart from 'react-apexcharts';
import { Button } from '@mui/material';
import { AppDispatch, RootState } from '../../../store/store';
import { get_produccion_mensual } from '../store/thunks/DashboardThunks.tsx';
import { Title } from '../../../components/Title.tsx';

const CHART_COLORS = ['#7e22ce', '#6d28d9', '#4f46e5', '#1d4ed8', '#0e7490', '#155e75', '#334155', '#3b0764', '#0f172a', '#083344'];

const SERVICIOS_FILTRO = [
  { label: 'Todos', value: '' },
  { label: 'Resonancia', value: '6' },
  { label: 'Tomografía', value: '5' },
  { label: 'Rayos X', value: '4' },
  { label: 'Ecografía', value: '7' },
  { label: 'PET/CT', value: '10' },
  { label: 'Neurología', value: '11' },
  { label: 'Fisiatría', value: '12' },
  { label: 'Neuropediatría', value: '13' },
  { label: 'Polisomnografías', value: '16' },
  { label: 'EEG / Videotelemetría', value: '15' },
];

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

const fmtNum = (n: number) => new Intl.NumberFormat('es-CO').format(n);

const DashboardProduccion: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { produccionMensual, loading, error } = useSelector((s: RootState) => s.dashboard);

  const [meses, setMeses] = useState(12);
  const [ufuncional, setUfuncional] = useState<string>('');

  useEffect(() => {
    dispatch(get_produccion_mensual(meses, ufuncional ? Number(ufuncional) : undefined));
  }, [dispatch, meses, ufuncional]);

  const d = produccionMensual;

  const series = d
    ? d.series.map((s) => ({
        name: s.servicio,
        data: d.meses.map((mes) => {
          const dato = s.datos.find((x) => x.mes === mes);
          return dato ? dato.cantidad : 0;
        }),
      }))
    : [];

  const barOptions: ApexCharts.ApexOptions = {
    chart: { type: 'bar', stacked: true, toolbar: { show: false }, animations: { enabled: true, easing: 'easeinout', speed: 800 } },
    colors: CHART_COLORS,
    xaxis: { categories: d?.meses ?? [], labels: { style: { fontSize: '12px' } } },
    yaxis: { labels: { formatter: (v) => fmtNum(v) } },
    legend: { position: 'bottom', fontSize: '12px' },
    plotOptions: { bar: { borderRadius: 4 } },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (v) => `${fmtNum(v)} estudios` } },
    grid: { borderColor: '#E5E7EB', strokeDashArray: 4 },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px' }}>
      <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
        📊 Dashboard Producción
      </h2>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', marginTop: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <span style={{ fontWeight: 600, color: '#374151' }}>Período:</span>
        {[3, 6, 12, 24].map((m) => (
          <Button
            key={m}
            variant={meses === m ? 'contained' : 'outlined'}
            color="primary"
            size="small"
            onClick={() => setMeses(m)}
          >
            {m} meses
          </Button>
        ))}
        <select
          value={ufuncional}
          onChange={(e) => setUfuncional(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '14px', color: '#374151' }}
        >
          {SERVICIOS_FILTRO.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {loading && <p>Cargando datos...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {d && !loading && (
        <div style={{ width: '100%', maxWidth: '1400px' }}>
          {/* Tarjetas resumen */}
          <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '30px', flexWrap: 'wrap', gap: '20px', marginTop: '10px' }}>
            <div style={{ backgroundColor: '#3c0b79', color: 'white', padding: '15px 30px', borderRadius: 12 }}>
              <strong>Total estudios</strong><br />
              <span style={{ fontSize: '24px', fontWeight: 700 }}>{fmtNum(d.total_cantidad)}</span>
            </div>
            <div style={{ backgroundColor: '#de497a', color: 'white', padding: '15px 30px', borderRadius: 12 }}>
              <strong>Valor facturado</strong><br />
              <span style={{ fontSize: '20px', fontWeight: 700 }}>{fmt(d.total_valor)}</span>
            </div>
            <div style={{ backgroundColor: '#4A90E2', color: 'white', padding: '15px 30px', borderRadius: 12 }}>
              <strong>Servicios activos</strong><br />
              <span style={{ fontSize: '24px', fontWeight: 700 }}>{d.series.length}</span>
            </div>
          </div>

          {/* Gráfica */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px', marginTop: '10px' }}>
            <div style={{ flex: '1 1 700px', maxWidth: '1200px', backgroundColor: '#fff', padding: 24, borderRadius: 12 }}>
              <Title title="ESTUDIOS POR MES Y SERVICIO" />
              {series.length > 0 ? (
                <Chart options={barOptions} series={series} type="bar" height={420} />
              ) : (
                <p style={{ textAlign: 'center', color: '#6b7280', marginTop: 40 }}>Sin datos para el período seleccionado</p>
              )}
            </div>
          </div>

          {/* Tabla resumen por servicio */}
          {d.series.length > 0 && (
            <div style={{ backgroundColor: '#fff', padding: 24, borderRadius: 12, marginTop: '20px', overflowX: 'auto' }}>
              <Title title="RESUMEN POR SERVICIO" />
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', marginTop: '16px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    {['Servicio', 'Total estudios', 'Valor facturado', 'Promedio/mes'].map((h) => (
                      <th key={h} style={{ textAlign: h === 'Servicio' ? 'left' : 'right', padding: '10px 16px', color: '#374151', fontWeight: 700 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...d.series]
                    .sort((a, b) => b.total_cantidad - a.total_cantidad)
                    .map((s, i) => (
                      <tr key={s.servicio} style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                        <td style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 12, height: 12, borderRadius: '50%', background: CHART_COLORS[i % CHART_COLORS.length], display: 'inline-block' }} />
                          {s.servicio}
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600 }}>{fmtNum(s.total_cantidad)}</td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', color: '#0e7490' }}>{fmt(s.total_valor)}</td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', color: '#6b7280' }}>
                          {fmtNum(Math.round(s.total_cantidad / (d.meses.length || 1)))}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardProduccion;
