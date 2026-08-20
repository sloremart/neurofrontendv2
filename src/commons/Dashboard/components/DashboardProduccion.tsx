import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Chart from 'react-apexcharts';
import { AppDispatch, RootState } from '../../../store/store';
import { get_produccion_mensual } from '../store/thunks/DashboardThunks.tsx';

const MESES_OPCIONES = [3, 6, 12, 24];

const SERVICIOS_FILTRO = [
  { label: 'Todos', value: undefined },
  { label: 'Resonancia', value: 6 },
  { label: 'Tomografía', value: 5 },
  { label: 'Rayos X', value: 4 },
  { label: 'Ecografía', value: 7 },
  { label: 'PET/CT', value: 10 },
  { label: 'Neurología', value: 11 },
  { label: 'Fisiatría', value: 12 },
  { label: 'Neuropediatría', value: 13 },
  { label: 'Polisomnografías', value: 16 },
  { label: 'EEG / Videotelemetría', value: 15 },
];

const PALETTE = ['#6C3FC5', '#2563eb', '#0d9488', '#f59e0b', '#e11d48', '#16a34a', '#7c3aed', '#ea580c', '#0891b2', '#4f46e5'];

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

const fmtNum = (n: number) =>
  new Intl.NumberFormat('es-CO').format(n);

const DashboardProduccion: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { produccionMensual, loading } = useSelector((s: RootState) => s.dashboard);

  const [meses, setMeses] = useState(12);
  const [ufuncional, setUfuncional] = useState<number | undefined>(undefined);

  useEffect(() => {
    dispatch(get_produccion_mensual(meses, ufuncional));
  }, [dispatch, meses, ufuncional]);

  const series = produccionMensual
    ? produccionMensual.series.map((s) => ({
        name: s.servicio,
        data: produccionMensual.meses.map((mes) => {
          const d = s.datos.find((d) => d.mes === mes);
          return d ? d.cantidad : 0;
        }),
      }))
    : [];

  const barOptions: ApexCharts.ApexOptions = {
    chart: { type: 'bar', stacked: true, toolbar: { show: false }, background: 'transparent', fontFamily: 'inherit' },
    colors: PALETTE,
    xaxis: { categories: produccionMensual?.meses ?? [], labels: { style: { colors: '#94a3b8', fontSize: '12px' } } },
    yaxis: { labels: { style: { colors: '#94a3b8' }, formatter: (v) => fmtNum(v) } },
    legend: { position: 'bottom', labels: { colors: '#94a3b8' } },
    plotOptions: { bar: { borderRadius: 3 } },
    dataLabels: { enabled: false },
    tooltip: {
      theme: 'dark',
      y: { formatter: (v) => `${fmtNum(v)} estudios` },
    },
    grid: { borderColor: '#334155' },
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', padding: '0 0 40px' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(to right, #381A73, #1e3a8a, #0f766e)',
        padding: '28px 32px',
        marginBottom: '32px',
      }}>
        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
          Producción Mensual
        </h1>
        <p style={{ margin: '6px 0 0', color: '#93c5fd', fontSize: '0.9rem' }}>
          Estudios realizados por servicio · SIESA
        </p>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {/* Filtros */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Período
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {MESES_OPCIONES.map((m) => (
                <button
                  key={m}
                  onClick={() => setMeses(m)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    background: meses === m ? '#6C3FC5' : '#1e293b',
                    color: meses === m ? '#fff' : '#94a3b8',
                    transition: 'background 0.15s',
                  }}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Servicio
            </label>
            <select
              value={ufuncional ?? ''}
              onChange={(e) => setUfuncional(e.target.value === '' ? undefined : Number(e.target.value))}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid #334155',
                background: '#1e293b',
                color: '#e2e8f0',
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              {SERVICIOS_FILTRO.map((s) => (
                <option key={String(s.value)} value={s.value ?? ''}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* KPI cards */}
        {produccionMensual && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
            <div style={{ background: '#1e293b', borderRadius: 10, padding: '20px 24px', borderLeft: '4px solid #6C3FC5' }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total estudios
              </p>
              <p style={{ margin: '8px 0 0', fontSize: '2rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {fmtNum(produccionMensual.total_cantidad)}
              </p>
            </div>
            <div style={{ background: '#1e293b', borderRadius: 10, padding: '20px 24px', borderLeft: '4px solid #0d9488' }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Valor facturado
              </p>
              <p style={{ margin: '8px 0 0', fontSize: '1.6rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {fmt(produccionMensual.total_valor)}
              </p>
            </div>
            <div style={{ background: '#1e293b', borderRadius: 10, padding: '20px 24px', borderLeft: '4px solid #2563eb' }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Servicios activos
              </p>
              <p style={{ margin: '8px 0 0', fontSize: '2rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {produccionMensual.series.length}
              </p>
            </div>
          </div>
        )}

        {/* Gráfica */}
        <div style={{ background: '#1e293b', borderRadius: 12, padding: '24px', marginBottom: 28 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: '1rem', fontWeight: 600, color: '#e2e8f0' }}>
            Estudios por mes
          </h2>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, color: '#64748b' }}>
              Cargando...
            </div>
          ) : series.length > 0 ? (
            <Chart options={barOptions} series={series} type="bar" height={350} />
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, color: '#64748b' }}>
              Sin datos para el período seleccionado
            </div>
          )}
        </div>

        {/* Tabla resumen por servicio */}
        {produccionMensual && produccionMensual.series.length > 0 && (
          <div style={{ background: '#1e293b', borderRadius: 12, padding: '24px', overflowX: 'auto' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '1rem', fontWeight: 600, color: '#e2e8f0' }}>
              Resumen por servicio
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr>
                  {['Servicio', 'Estudios', 'Valor facturado', 'Promedio/mes'].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: h === 'Servicio' ? 'left' : 'right',
                        padding: '10px 16px',
                        color: '#94a3b8',
                        fontWeight: 600,
                        borderBottom: '1px solid #334155',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...produccionMensual.series]
                  .sort((a, b) => b.total_cantidad - a.total_cantidad)
                  .map((s, i) => (
                    <tr key={s.servicio} style={{ background: i % 2 === 0 ? 'transparent' : '#0f172a' }}>
                      <td style={{ padding: '10px 16px', color: '#e2e8f0' }}>
                        <span style={{
                          display: 'inline-block',
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: PALETTE[i % PALETTE.length],
                          marginRight: 8,
                        }} />
                        {s.servicio}
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                        {fmtNum(s.total_cantidad)}
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#4ade80' }}>
                        {fmt(s.total_valor)}
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>
                        {fmtNum(Math.round(s.total_cantidad / (produccionMensual.meses.length || 1)))}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardProduccion;
