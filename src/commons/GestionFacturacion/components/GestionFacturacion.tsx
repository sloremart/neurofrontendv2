import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { getToken } from "../../../config/token.jsx";
import DetalleCasoDrawer from "./DetalleCasoDrawer.tsx";
import RegistrarDevolucionModal from "./RegistrarDevolucionModal.tsx";
import HallazgosPendientes from "./HallazgosPendientes.tsx";
import Seccion from "./Seccion.tsx";

import CONFIG from '../../../config/api';
const API = `${CONFIG.API_ENDPOINT}/gestion-facturacion`;

type Bandeja = "realizados" | "radicados" | "devoluciones" | "hallazgos";

interface Caso {
  admision_id: number;
  con_estudio: number;
  paciente: string;
  documento: string;
  eps: string;
  contrato: string;
  procedimientos: string;
  fecha_ingreso: string | null;
  valor_total: number;
  dias_pendiente: number | null;
  servicio: string;
  ufuncional: number | null;
  tiene_resultado: boolean;
  tiene_orden: boolean;
  tiene_autorizacion: boolean;
  tiene_comprobante: boolean;
  tiene_factura: boolean;
  factura_nombre: string | null;
  radicado: boolean;
  caso_id: number | null;
  estado: string;
  responsable_nombre: string;
  numero_radicado: string;
  motivo_devolucion: string;
  observacion: string;
  causa?: string;
  causa_texto?: string;
  detalle?: string[];
  responsable_causa?: string;
  usuario_cargue?: string;
  factura?: string;
  fecha_factura?: string | null;
  renombrado?: boolean;
  radicado_zeus?: boolean;
  fecha_radicado_zeus?: string | null;
  remision_zeus?: string;
  hallazgos?: { tipo: string; documento: string; responsable: string }[];
}

interface CausaResumen { causa: string; texto: string; total: number; }

const CAUSA_COLOR: Record<string, [string, string]> = {
  facturada_siesa:     ["#ede9fe", "#5b21b6"],
  devuelta_cm:         ["#fee2e2", "#991b1b"],
  hallazgo_admisiones: ["#fef3c7", "#92400e"],
  hallazgo_resultado:  ["#ffedd5", "#9a3412"],
  faltan_documentos:   ["#fce7f3", "#9d174d"],
  sin_revision_ia:     ["#e0e7ff", "#3730a3"],
  antes_ia:            ["#f1f5f9", "#475569"],
  pendiente_cm:        ["#e0f2fe", "#075985"],
  aprobada_cm:         ["#dcfce7", "#166534"],
  sin_resultado:          ["#ffedd5", "#9a3412"],
  sin_factura_pdf:        ["#fce7f3", "#9d174d"],
  pendiente_renombrar:    ["#fef3c7", "#92400e"],
  renombrada_sin_radicar: ["#e0f2fe", "#075985"],
};

const TABS: { key: Bandeja; label: string; color: string }[] = [
  { key: "realizados",               label: "Realizados sin factura",      color: "#f59e0b" },
  { key: "radicados",                label: "Facturados sin radicar",      color: "#3b82f6" },
  { key: "devoluciones",             label: "Devoluciones EPS",            color: "#ef4444" },
  { key: "hallazgos",                label: "Hallazgos IA",                color: "#2a78d6" },
];

// Realizados / facturados: en qué área está detenido cada estudio (agrupa las causas del backend)
interface Etapa { key: string; label: string; desc: string; causas: string[]; color: string; }
const ETAPAS: Partial<Record<Bandeja, Etapa[]>> = {
  realizados: [
    { key: "admisiones",   label: "Admisiones",          color: "#b45309",
      desc: "Hallazgos, documentos faltantes o devueltas por Cuentas Médicas",
      causas: ["hallazgo_admisiones", "faltan_documentos", "devuelta_cm"] },
    { key: "coordinacion", label: "Coordinación médica", color: "#c2410c",
      desc: "Hallazgo en el resultado",
      causas: ["hallazgo_resultado"] },
    { key: "cuentas",      label: "Cuentas Médicas",     color: "#0369a1",
      desc: "Pendiente de aprobación o de revisión manual",
      causas: ["pendiente_cm", "antes_ia", "sin_revision_ia"] },
    { key: "facturacion",  label: "Facturación",         color: "#15803d",
      desc: "Aprobada: falta facturar o cargar la factura",
      causas: ["aprobada_cm", "facturada_siesa"] },
  ],
  radicados: [
    { key: "renombrar", label: "GE Documental", color: "#b45309",
      desc: "Pendiente renombrar los documentos", causas: ["pendiente_renombrar"] },
    { key: "radicar",   label: "Radicación",    color: "#0369a1",
      desc: "Renombrada: falta radicar en Zeus", causas: ["renombrada_sin_radicar"] },
  ],
};

const BANDEJAS_SIMPLES: Bandeja[] = ["realizados", "radicados", "devoluciones"];

const ESTADO_LABEL: Record<string, string> = {
  pendiente:  "Pendiente",
  en_gestion: "En gestión",
  resuelto:   "Resuelto",
};
const ESTADO_COLOR: Record<string, string> = {
  pendiente:  "#fef3c7",
  en_gestion: "#dbeafe",
  resuelto:   "#dcfce7",
};
const ESTADO_TEXT: Record<string, string> = {
  pendiente:  "#92400e",
  en_gestion: "#1e40af",
  resuelto:   "#166534",
};

// Antigüedad (días desde el ingreso): rangos del filtro y del semáforo
const RANGOS_DIAS: { key: string; label: string; min: number; max: number }[] = [
  { key: "0-7",   label: "Hasta 7 días",  min: 0,  max: 7 },
  { key: "8-15",  label: "8 a 15 días",   min: 8,  max: 15 },
  { key: "16-30", label: "16 a 30 días",  min: 16, max: 30 },
  { key: "31+",   label: "Más de 30 días", min: 31, max: Infinity },
];

// Datos en memoria de una pestaña: pasado este tiempo se actualizan en segundo plano al volver a ella
const MAX_EDAD_MS = 5 * 60 * 1000;

function fmt(v: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);
}

function DocBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 6px", borderRadius: 4, fontSize: 11,
      background: ok ? "#dcfce7" : "#fee2e2",
      color: ok ? "#166534" : "#991b1b",
      marginRight: 3, marginBottom: 2,
    }}>
      {label}
    </span>
  );
}

export function GestionFacturacion() {
  const [tab, setTab]              = useState<Bandeja>("realizados");
  const [casos, setCasos]          = useState<Caso[]>([]);
  const [loading, setLoading]      = useState(false);
  const [fechaIni, setFechaIni]    = useState("");
  const [fechaFin, setFechaFin]    = useState("");
  const [detalleId, setDetalleId]  = useState<number | null>(null);
  const [showDevModal, setShowDevModal] = useState(false);
  const [busqueda, setBusqueda]    = useState("");
  const [servicioFiltro, setServicioFiltro] = useState<string>("Todos");   // recuadro elegido (servicio o contrato)
  const [agrupar, setAgrupar]               = useState<"servicio" | "contrato" | "usuario">("servicio");
  const [epsFiltro, setEpsFiltro]           = useState<string>("Todas");
  const [causaFiltro, setCausaFiltro]       = useState<string>("Todas");
  const [causas, setCausas]                 = useState<CausaResumen[]>([]);
  const [usuarioFiltro, setUsuarioFiltro]   = useState<string>("Todos");
  const [contratoFiltro, setContratoFiltro] = useState<string>("Todos");
  const [diasFiltro, setDiasFiltro]         = useState<string>("Todos");
  const [orden, setOrden]                   = useState<"dias" | "valor">("dias");
  const [masFiltros, setMasFiltros]         = useState(false);
  const [etapaFiltro, setEtapaFiltro]       = useState<string>("Todas");
  const [recargaResumen, setRecargaResumen] = useState(0);

  // Datos de cada pestaña en memoria: al volver a una pestaña se muestran de inmediato (sin "Cargando...")
  // y se actualizan en segundo plano si tienen más de MAX_EDAD_MS. El backend también guarda la respuesta.
  const memoria = useRef<Partial<Record<Bandeja, { casos: Caso[]; causas: CausaResumen[]; t: number }>>>({});
  const tabRef = useRef<Bandeja>(tab);
  tabRef.current = tab;
  const [actualizando, setActualizando] = useState(false);

  const cargar = useCallback(async (bandeja: Bandeja, opciones: { refrescar?: boolean } = {}) => {
    if (bandeja === "hallazgos") {   // la pestaña de hallazgos consulta su propio resumen
      if (opciones.refrescar) setRecargaResumen(r => r + 1);
      return;
    }
    const enMemoria = memoria.current[bandeja];
    const esActual = () => tabRef.current === bandeja;
    if (esActual()) {
      if (enMemoria) setActualizando(true);
      else { setCasos([]); setCausas([]); setLoading(true); }
    }
    try {
      const params: Record<string, string> = {};
      if (fechaIni) params.fecha_inicio = fechaIni;
      if (fechaFin) params.fecha_fin    = fechaFin;
      if (opciones.refrescar) params.refrescar = "1";
      const { data } = await axios.get(`${API}/${bandeja}/`, {
        headers: { Authorization: `Token ${getToken()}` }, params,
      });
      memoria.current[bandeja] = { casos: data.data || [], causas: data.causas || [], t: Date.now() };
      if (esActual()) {
        setCasos(data.data || []);
        setCausas(data.causas || []);
      }
    } catch {
      if (esActual() && !enMemoria) setCasos([]);
    } finally {
      if (esActual()) { setLoading(false); setActualizando(false); }
    }
  }, [fechaIni, fechaFin]);

  // Precarga en segundo plano las demás bandejas, para que cambiar de pestaña sea inmediato
  const precargar = useCallback((excepto: Bandeja) => {
    (["realizados", "radicados", "devoluciones"] as Bandeja[])
      .filter(b => b !== excepto && !memoria.current[b])
      .forEach(b => { cargar(b); });
  }, [cargar]);

  useEffect(() => {
    const enMemoria = memoria.current[tab];
    if (enMemoria) {
      setCasos(enMemoria.casos);
      setCausas(enMemoria.causas);
      setLoading(false);
      if (Date.now() - enMemoria.t > MAX_EDAD_MS) cargar(tab);
    } else {
      cargar(tab).then(() => precargar(tab));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Botón Buscar (o cambio de fechas): recalcula la pestaña actual y vuelve a precargar las demás
  const buscar = () => {
    memoria.current = {};
    cargar(tab, { refrescar: true }).then(() => precargar(tab));
    if (tab === "hallazgos") setRecargaResumen(r => r + 1);
  };

  const cambiarEstado = async (caso: Caso, estado: string) => {
    await axios.post(
      `${API}/caso/${caso.admision_id}/actualizar/`,
      { bandeja: tab, estado },
      { headers: { Authorization: `Token ${getToken()}` } },
    );
    cargar(tab);
  };

  // Realizados y Facturados sin radicar: vista por causa/etapa, solo con el botón Ver
  const vistaCausa = tab === "realizados" || tab === "radicados";
  const etiquetaCausa = tab === "radicados" ? "Etapa en GE Documental" : "Hallazgo / por qué sigue sin factura";
  const usuarioDe = (c: Caso) => c.usuario_cargue || "Sin usuario";
  const rangoDias = RANGOS_DIAS.find(r => r.key === diasFiltro);
  const enRango = (c: Caso) => !rangoDias || ((c.dias_pendiente ?? 0) >= rangoDias.min && (c.dias_pendiente ?? 0) <= rangoDias.max);
  const conteoDias = (r: typeof RANGOS_DIAS[number]) =>
    casos.filter(c => (c.dias_pendiente ?? 0) >= r.min && (c.dias_pendiente ?? 0) <= r.max).length;
  // Opciones de cada filtro con su cantidad de estudios (sobre todos los casos de la bandeja)
  const opciones = (valores: string[]) => {
    const cuenta: Record<string, number> = {};
    valores.forEach(v => { cuenta[v] = (cuenta[v] || 0) + 1; });
    return Object.keys(cuenta).sort().map(v => ({ valor: v, total: cuenta[v] }));
  };
  const opcionesEps      = opciones(casos.map(c => c.eps || "Sin EPS"));
  const opcionesContrato = opciones(casos.map(c => c.contrato || "Sin contrato"));
  const opcionesUsuario  = opciones(casos.map(usuarioDe));
  const etapas = ETAPAS[tab] || [];
  const etapaDe = (c: Caso) => etapas.find(e => e.causas.includes(c.causa || ""))?.key || "Otras";
  const etapaActual = etapas.find(e => e.key === etapaFiltro);
  // Casos con los filtros generales (sin etapa ni causa): base de los conteos de las tarjetas de etapa
  const casosBase = casos.filter(c =>
    (epsFiltro === "Todas" || (c.eps || "Sin EPS") === epsFiltro) &&
    (contratoFiltro === "Todos" || (c.contrato || "Sin contrato") === contratoFiltro) &&
    (usuarioFiltro === "Todos" || usuarioDe(c) === usuarioFiltro) &&
    enRango(c)
  );
  const conteoEtapa = (key: string) => {
    const g = casosBase.filter(c => etapaDe(c) === key);
    return { n: g.length, valor: g.reduce((a, c) => a + c.valor_total, 0) };
  };
  const casosEps = casosBase.filter(c =>
    (etapaFiltro === "Todas" || etapaDe(c) === etapaFiltro) &&
    (causaFiltro === "Todas" || c.causa === causaFiltro)
  );
  const hayFiltros = epsFiltro !== "Todas" || contratoFiltro !== "Todos" || causaFiltro !== "Todas" || etapaFiltro !== "Todas"
    || usuarioFiltro !== "Todos" || servicioFiltro !== "Todos" || diasFiltro !== "Todos" || !!busqueda;
  const filtrosActivos = [epsFiltro !== "Todas", contratoFiltro !== "Todos",
    usuarioFiltro !== "Todos", diasFiltro !== "Todos"].filter(Boolean).length;
  const limpiarFiltros = () => {
    setEpsFiltro("Todas"); setContratoFiltro("Todos"); setCausaFiltro("Todas"); setDiasFiltro("Todos"); setEtapaFiltro("Todas");
    setUsuarioFiltro("Todos"); setServicioFiltro("Todos"); setBusqueda("");
  };
  const grupoDe = (c: Caso) => agrupar === "servicio" ? (c.servicio || "Sin servicio")
    : agrupar === "usuario" ? (c.usuario_cargue || "Sin usuario")
    : (c.contrato || "Sin contrato");
  const serviciosDisponibles = ["Todos", ...Array.from(new Set(casosEps.map(grupoDe))).sort()];

  const casosFiltered = casosEps.filter(c => {
    if (servicioFiltro !== "Todos" && grupoDe(c) !== servicioFiltro) return false;
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return (
      String(c.con_estudio).includes(q) ||
      String(c.admision_id).includes(q) ||
      c.paciente.toLowerCase().includes(q) ||
      usuarioDe(c).toLowerCase().includes(q) ||
      c.eps.toLowerCase().includes(q) ||
      (c.contrato || "").toLowerCase().includes(q) ||
      (c.procedimientos || "").toLowerCase().includes(q) ||
      c.documento.includes(q)
    );
  }).sort((a, b) => orden === "valor"
    ? b.valor_total - a.valor_total
    : (b.dias_pendiente ?? 0) - (a.dias_pendiente ?? 0));

  const totales = {
    pendiente:  casos.filter(c => c.estado === "pendiente").length,
    en_gestion: casos.filter(c => c.estado === "en_gestion").length,
    resuelto:   casos.filter(c => c.estado === "resuelto").length,
    valor:      casos.filter(c => c.estado !== "resuelto").reduce((s, c) => s + c.valor_total, 0),
  };

  const tabActual = TABS.find(t => t.key === tab)!;

  return (
    <div style={{ fontFamily: "inherit", maxWidth: 1400, margin: "0 auto" }}>

      {/* Header dark navy */}
      <div style={{
        background: "linear-gradient(135deg, #1e2d5a 0%, #2d1b69 100%)",
        padding: "18px 24px",
        marginBottom: 0,
      }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          Módulo de Gestión de Facturación
        </h1>
        <p style={{ color: "rgba(255,255,255,0.6)", margin: "4px 0 0", fontSize: 13 }}>
          Seguimiento operativo caso a caso — bandejas de trabajo
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 0, background: "#fff",
        borderBottom: "1px solid #e2e8f0", paddingLeft: 16,
      }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setBusqueda(""); setServicioFiltro("Todos"); setEpsFiltro("Todas"); setCausaFiltro("Todas"); setCausas([]); if (t.key !== "realizados") setAgrupar(g => g === "usuario" ? "servicio" : g); setUsuarioFiltro("Todos"); setContratoFiltro("Todos"); setDiasFiltro("Todos"); setEtapaFiltro("Todas"); }}
            style={{
              padding: "12px 20px", border: "none", cursor: "pointer",
              background: "transparent", fontWeight: 600, fontSize: 14,
              color: tab === t.key ? "#6d28d9" : "#64748b",
              borderBottom: tab === t.key ? "3px solid #6d28d9" : "3px solid transparent",
              marginBottom: -1,
              transition: "all 0.15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "20px 24px" }}>

      {/* KPIs */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {BANDEJAS_SIMPLES.includes(tab as any) ? (vistaCausa ? [
          { label: "Total casos",    val: casos.length,          bg: "#f8fafc", text: "#1e293b" },
          { label: tab === "realizados" ? "Valor sin facturar" : "Valor facturado sin radicar", val: fmt(casos.reduce((s, c) => s + c.valor_total, 0)), bg: "#fef2f2", text: "#991b1b" },
          { label: "Más de 15 días", val: casos.filter(c => (c.dias_pendiente ?? 0) > 15).length, bg: "#fff7ed", text: "#9a3412" },
        ] : [
          { label: "Total casos",    val: casos.length,          bg: "#f8fafc", text: "#1e293b" },
          { label: "Pendientes",     val: totales.pendiente,     bg: "#fef3c7", text: "#92400e" },
          { label: "En gestión",     val: totales.en_gestion,    bg: "#dbeafe", text: "#1e40af" },
          { label: "Resueltos",      val: totales.resuelto,      bg: "#dcfce7", text: "#166534" },
          { label: "Valor en riesgo",val: fmt(totales.valor),    bg: "#fef2f2", text: "#991b1b" },
        ]).map(k => (
          <div key={k.label} style={{
            background: k.bg, borderRadius: 10, padding: "10px 18px",
            minWidth: 120, textAlign: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: k.text }}>{k.val}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{k.label}</div>
          </div>
        )) : null}
        <div style={{ flex: 1 }} />
        {/* Filtros */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="date" value={fechaIni}
                onChange={e => setFechaIni(e.target.value)}
                style={inputStyle}
              />
              <span style={{ color: "#94a3b8", fontSize: 13 }}>→</span>
              <input
                type="date" value={fechaFin}
                onChange={e => setFechaFin(e.target.value)}
                style={inputStyle}
              />
            </div>
            <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: 2 }}>
              {"Filtra por fecha de ingreso"}
              {tab === "radicados"
                ? " · sin rango: todo el histórico"
                : " · sin rango: desde el inicio de la IA (20/10/2026)"}
            </span>
          </div>
          <button onClick={buscar} style={btnStyle(tabActual.color)}>
            Buscar
          </button>
          {actualizando && (
            <span style={{ fontSize: 11, color: "#64748b" }}>Actualizando…</span>
          )}
          {tab === "devoluciones" && (
            <button onClick={() => setShowDevModal(true)} style={btnStyle("#10b981")}>
              + Registrar devolución
            </button>
          )}
        </div>
      </div>

      {/* Pestaña Hallazgos IA: resumen administrativo por responsable y por tipo (todas las admisiones) */}
      {tab === "hallazgos" && (
        <HallazgosPendientes fechaIni={fechaIni} fechaFin={fechaFin} recarga={recargaResumen} />
      )}

      {/* ¿Dónde está detenido? Tarjetas por área responsable; la elegida filtra la tabla y muestra sus causas */}
      {etapas.length > 0 && !loading && casos.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
            ¿Dónde está detenido?
          </div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(190px, 1fr))`, gap: 8 }}>
            {[{ key: "Todas", label: "Todas", desc: "Todos los estudios de la bandeja", causas: [], color: "#334155" } as Etapa, ...etapas]
              .filter(e => e.key === "Todas" || conteoEtapa(e.key).n > 0)
              .map(e => {
                const activo = etapaFiltro === e.key;
                const { n, valor } = e.key === "Todas"
                  ? { n: casosBase.length, valor: casosBase.reduce((a, c) => a + c.valor_total, 0) }
                  : conteoEtapa(e.key);
                return (
                  <button
                    key={e.key}
                    onClick={() => { setEtapaFiltro(e.key); setCausaFiltro("Todas"); setServicioFiltro("Todos"); }}
                    aria-pressed={activo}
                    style={{
                      textAlign: "left", cursor: "pointer", borderRadius: 10, padding: "10px 12px",
                      background: activo ? "#f8fafc" : "#fff",
                      border: `1px solid ${activo ? e.color : "#e2e8f0"}`,
                      borderTop: `4px solid ${e.color}`,
                      boxShadow: activo ? "0 2px 6px rgba(15,23,42,0.10)" : "0 1px 2px rgba(15,23,42,0.04)",
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{e.label}</div>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 6, margin: "4px 0 2px" }}>
                      <span style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{n}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>{fmt(valor)}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.3 }}>{e.desc}</div>
                  </button>
                );
              })}
          </div>
          {/* Causas de la etapa elegida */}
          {etapaActual && etapaActual.causas.length > 1 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              {["Todas", ...etapaActual.causas].filter(k => k === "Todas" || casosBase.some(c => c.causa === k)).map(k => {
                const activo = causaFiltro === k;
                const n = k === "Todas" ? conteoEtapa(etapaActual.key).n : casosBase.filter(c => c.causa === k).length;
                const texto = k === "Todas" ? `Todas las de ${etapaActual.label}` : (causas.find(x => x.causa === k)?.texto || k);
                return (
                  <button key={k} onClick={() => { setCausaFiltro(k); setServicioFiltro("Todos"); }} aria-pressed={activo}
                    style={{
                      padding: "4px 12px", borderRadius: 14, fontSize: 12, fontWeight: 600, cursor: "pointer",
                      border: `1px solid ${activo ? etapaActual.color : "#e2e8f0"}`,
                      background: activo ? etapaActual.color : "#fff", color: activo ? "#fff" : "#475569",
                    }}>
                    {texto} ({n})
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Buscador + filtros + distribución — solo en bandejas simples */}
      {BANDEJAS_SIMPLES.includes(tab as any) && <>
      {/* Barra de filtros: búsqueda y orden siempre visibles; el resto en "Más filtros" */}
      <div style={{
        background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 16px", marginBottom: 12,
        boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
      }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <Filtro etiqueta="Buscar" flex="1 1 320px">
            <input
              placeholder="No. estudio, paciente, documento, usuario o CUPS..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
            />
          </Filtro>
          <Filtro etiqueta="Ordenar por" flex="0 1 200px">
            <select value={orden} onChange={e => setOrden(e.target.value as "dias" | "valor")} style={selectStyle}>
              <option value="dias">Más antiguos primero</option>
              <option value="valor">Mayor valor primero</option>
            </select>
          </Filtro>
          <button
            onClick={() => setMasFiltros(m => !m)}
            aria-expanded={masFiltros}
            style={{
              padding: "7px 14px", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer",
              border: "1px solid #c4b5fd", background: masFiltros ? "#f5f3ff" : "#fff", color: "#5b21b6",
            }}
          >
            {masFiltros ? "▲" : "▼"} Más filtros{filtrosActivos > 0 ? ` (${filtrosActivos})` : ""}
          </button>
          {hayFiltros && (
            <button onClick={limpiarFiltros} style={{ ...btnSmall("#64748b"), padding: "8px 12px", marginBottom: 0 }}>
              Limpiar filtros
            </button>
          )}
          <span style={{ marginLeft: "auto", fontSize: 12, color: "#64748b", alignSelf: "center" }}>
            Mostrando <b style={{ color: "#0f172a" }}>{casosFiltered.length}</b> de {casos.length}
          </span>
        </div>
        {masFiltros && (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10,
            marginTop: 12, paddingTop: 12, borderTop: "1px solid #f1f5f9",
          }}>
            {tab === "realizados" && (
              <Filtro etiqueta="Usuario que cargó" flex="1">
                <select value={usuarioFiltro} onChange={e => { setUsuarioFiltro(e.target.value); setServicioFiltro("Todos"); }} style={selectStyle}>
                  <option value="Todos">Todos ({casos.length})</option>
                  {opcionesUsuario.map(o => <option key={o.valor} value={o.valor}>{o.valor} ({o.total})</option>)}
                </select>
              </Filtro>
            )}
            <Filtro etiqueta="EPS" flex="1">
              <select value={epsFiltro} onChange={e => { setEpsFiltro(e.target.value); setServicioFiltro("Todos"); }} style={selectStyle}>
                <option value="Todas">Todas ({casos.length})</option>
                {opcionesEps.map(o => <option key={o.valor} value={o.valor}>{o.valor} ({o.total})</option>)}
              </select>
            </Filtro>
            <Filtro etiqueta="Contrato" flex="1">
              <select value={contratoFiltro} onChange={e => { setContratoFiltro(e.target.value); setServicioFiltro("Todos"); }} style={selectStyle}>
                <option value="Todos">Todos ({casos.length})</option>
                {opcionesContrato.map(o => <option key={o.valor} value={o.valor}>{o.valor} ({o.total})</option>)}
              </select>
            </Filtro>
            {vistaCausa && (
              <Filtro etiqueta="Antigüedad" flex="1">
                <select value={diasFiltro} onChange={e => { setDiasFiltro(e.target.value); setServicioFiltro("Todos"); }} style={selectStyle}>
                  <option value="Todos">Todas ({casos.length})</option>
                  {RANGOS_DIAS.map(r => <option key={r.key} value={r.key}>{r.label} ({conteoDias(r)})</option>)}
                </select>
              </Filtro>
            )}
          </div>
        )}
      </div>

      {/* Distribución por servicio, contrato o (en realizados) usuario que cargó: los recuadros filtran la tabla */}
      <Seccion
        id={`distribucion-${tab}`}
        titulo="Distribución"
        resumen={<>
          por {agrupar === "servicio" ? "servicio" : agrupar === "contrato" ? "contrato" : "usuario que cargó"}
          {" · "}{serviciosDisponibles.length - 1} grupos
          {servicioFiltro !== "Todos" && <> · <b style={{ color: "#0f172a" }}>filtrando: {servicioFiltro}</b></>}
        </>}
        acciones={
          <div style={{ display: "flex", gap: 6 }}>
            {(tab === "realizados" ? ["servicio", "contrato", "usuario"] as const : ["servicio", "contrato"] as const).map(a => (
              <button
                key={a}
                onClick={() => { setAgrupar(a); setServicioFiltro("Todos"); }}
                style={{
                  padding: "4px 12px", borderRadius: 14, fontSize: 12, fontWeight: 600, cursor: "pointer",
                  border: `1px solid ${agrupar === a ? tabActual.color : "#e2e8f0"}`,
                  background: agrupar === a ? tabActual.color : "#fff",
                  color: agrupar === a ? "#fff" : "#475569",
                }}
              >
                {a === "servicio" ? "Servicio" : a === "contrato" ? "Contrato" : "Usuario que cargó"}
              </button>
            ))}
          </div>
        }
      >
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
        gap: 8,
      }}>
        {serviciosDisponibles.map(s => {
          const grupo = s === "Todos" ? casosEps : casosEps.filter(c => grupoDe(c) === s);
          const totalValor = grupo.reduce((acc, c) => acc + c.valor_total, 0);
          const activo = servicioFiltro === s;
          return (
            <button
              key={s}
              onClick={() => setServicioFiltro(s)}
              aria-pressed={activo}
              style={{
                padding: "8px 10px",
                border: `1px solid ${activo ? tabActual.color : "#e2e8f0"}`,
                borderLeft: `4px solid ${activo ? tabActual.color : "#cbd5e1"}`,
                borderRadius: 8,
                cursor: "pointer",
                background: activo ? "#fffbeb" : "#fff",
                color: "#334155",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 4,
                textAlign: "left",
              }}
            >
              <span title={s} style={{
                fontSize: 11, fontWeight: 600, color: "#475569", width: "100%",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {s === "Todos" ? "Todos" : s}
              </span>
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 18, fontWeight: 800, lineHeight: 1, color: "#0f172a" }}>
                  {grupo.length}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", whiteSpace: "nowrap" }}>
                  {fmt(totalValor)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
      </Seccion>

      {/* Tabla bandeja simple */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>Cargando...</div>
      ) : casosFiltered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#94a3b8", fontSize: 14 }}>
          No hay casos en esta bandeja.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#1e2d5a" }}>
                {["No. Estudio", "Paciente", ...(tab === "realizados" ? ["Usuario que cargó"] : []),
                  "EPS / Contrato / Servicio", "Valor", "Días", "Docs",
                  vistaCausa ? etiquetaCausa : "Estado", "Acciones"]
                  .map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#fff", whiteSpace: "nowrap", fontSize: 12 }}>
                      {h}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {casosFiltered.map((c, i) => (
                <tr
                  key={c.admision_id}
                  style={{
                    background: i % 2 === 0 ? "#fff" : "#f8fafc",
                    borderBottom: "1px solid #f1f5f9",
                    opacity: !vistaCausa && c.estado === "resuelto" ? 0.6 : 1,
                  }}
                >
                  <td style={td}>
                    <span
                      onClick={() => setDetalleId(c.admision_id)}
                      style={{ color: tabActual.color, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}
                    >
                      {c.con_estudio || c.admision_id}
                    </span>
                    {tab === "radicados" && c.factura && (
                      <div style={{ fontSize: 11, color: "#334155", fontWeight: 600 }}>{c.factura}</div>
                    )}
                    {tab === "radicados" && c.fecha_factura && (
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>{c.fecha_factura}</div>
                    )}
                    {c.numero_radicado && (
                      <div style={{ fontSize: 11, color: "#64748b" }}>Rad: {c.numero_radicado}</div>
                    )}
                  </td>
                  <td style={td}>
                    <div style={{ fontWeight: 500 }}>{c.paciente || "—"}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{c.documento}</div>
                  </td>
                  {tab === "realizados" && (
                    <td style={{ ...td, fontWeight: 600, color: c.usuario_cargue ? "#4c1d95" : "#94a3b8" }}>
                      {c.usuario_cargue || "Sin usuario"}
                    </td>
                  )}
                  <td style={{ ...td, maxWidth: 300 }}>
                    <div style={{ fontWeight: 600 }}>{c.eps || "—"}</div>
                    {c.contrato && <div style={{ fontSize: 11, color: "#64748b" }}>{c.contrato}</div>}
                    <div style={{ fontSize: 11, color: "#6366f1", marginTop: 2, fontWeight: 600 }}>{c.servicio}</div>
                    {c.procedimientos && (
                      <div title={c.procedimientos} style={{ fontSize: 10, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.procedimientos}
                      </div>
                    )}
                  </td>
                  <td style={{ ...td, fontVariantNumeric: "tabular-nums" }}>{fmt(c.valor_total)}</td>
                  <td style={td}>
                    <span style={{
                      fontWeight: 700,
                      color: (c.dias_pendiente ?? 0) > 30 ? "#ef4444" : (c.dias_pendiente ?? 0) > 15 ? "#f59e0b" : "#16a34a",
                    }}>
                      {c.dias_pendiente ?? "—"}
                    </span>
                  </td>
                  <td style={td}>
                    <DocBadge ok={c.tiene_orden}        label="ORD" />
                    <DocBadge ok={c.tiene_autorizacion} label="AUT" />
                    <DocBadge ok={c.tiene_comprobante}  label="COM" />
                    <DocBadge ok={c.tiene_resultado}    label="RES" />
                    {tab !== "realizados" && (
                      <DocBadge ok={c.tiene_factura} label="FAC" />
                    )}
                    {tab === "radicados" && (
                      <DocBadge ok={!!c.renombrado} label="REN" />
                    )}
                  </td>
                  {vistaCausa ? (
                  <td style={{ ...td, maxWidth: 280 }}>
                    <span style={{
                      display: "inline-block", padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 700,
                      background: (CAUSA_COLOR[c.causa || ""] || ["#f1f5f9"])[0],
                      color: (CAUSA_COLOR[c.causa || ""] || ["", "#334155"])[1],
                    }}>
                      {c.causa_texto || "—"}
                    </span>
                    {(c.detalle || []).map((d, di) => (
                      <div key={di} title={d} style={{ fontSize: 11, color: "#64748b", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        • {d}
                      </div>
                    ))}
                  </td>
                  ) : (
                  <td style={td}>
                    <span style={{
                      padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                      background: ESTADO_COLOR[c.estado] || "#f1f5f9",
                      color: ESTADO_TEXT[c.estado] || "#334155",
                    }}>
                      {ESTADO_LABEL[c.estado] || c.estado}
                    </span>
                    {c.responsable_nombre && (
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{c.responsable_nombre}</div>
                    )}
                    {c.motivo_devolucion && (
                      <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={c.motivo_devolucion}>
                        {c.motivo_devolucion}
                      </div>
                    )}
                  </td>
                  )}
                  <td style={{ ...td, whiteSpace: "nowrap" }}>
                    {!vistaCausa && <>
                    {c.estado !== "en_gestion" && c.estado !== "resuelto" && (
                      <button onClick={() => cambiarEstado(c, "en_gestion")} style={btnSmall("#3b82f6")}>
                        En gestión
                      </button>
                    )}
                    {c.estado !== "resuelto" && (
                      <button onClick={() => cambiarEstado(c, "resuelto")} style={btnSmall("#10b981")}>
                        Resolver
                      </button>
                    )}
                    {c.estado === "resuelto" && (
                      <button onClick={() => cambiarEstado(c, "pendiente")} style={btnSmall("#94a3b8")}>
                        Reabrir
                      </button>
                    )}
                    </>}
                    <button onClick={() => setDetalleId(c.admision_id)} style={btnSmall("#6366f1")}>
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </>}

      {/* Drawer detalle */}
      {detalleId && (
        <DetalleCasoDrawer
          admisionId={detalleId}
          bandeja={tab}
          onClose={() => { setDetalleId(null); cargar(tab); }}
        />
      )}

      {/* Modal devolución */}
      {showDevModal && (
        <RegistrarDevolucionModal
          onClose={() => setShowDevModal(false)}
          onGuardado={() => { setShowDevModal(false); cargar("devoluciones", { refrescar: true }); }}
        />
      )}
      </div>{/* /padding wrapper */}
    </div>
  );
}

// ── estilos inline ─────────────────────────────────────────────────────────
const td: React.CSSProperties = { padding: "10px 12px", verticalAlign: "top" };
const selectStyle: React.CSSProperties = {
  padding: "7px 10px", border: "1px solid #c4b5fd", borderRadius: 7,
  fontSize: 13, outline: "none", background: "#fff", width: "100%", maxWidth: 320,
};

function Filtro({ etiqueta, flex = "0 1 240px", children }: { etiqueta: string; flex?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, flex, minWidth: 160 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.03em" }}>
        {etiqueta}
      </span>
      {children}
    </div>
  );
}
const inputStyle: React.CSSProperties = {
  padding: "7px 10px", border: "1px solid #c4b5fd", borderRadius: 7,
  fontSize: 13, outline: "none", background: "#fff",
};
const btnStyle = (color: string): React.CSSProperties => ({
  padding: "7px 16px", background: color, color: "#fff",
  border: "none", borderRadius: 7, cursor: "pointer", fontWeight: 600, fontSize: 13,
});
const btnSmall = (color: string): React.CSSProperties => ({
  padding: "4px 10px", background: color, color: "#fff",
  border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 11,
  marginRight: 4, marginBottom: 3,
});
