import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import CONFIG from "../../../config/api.js";

const API: string = CONFIG.API_ENDPOINT;

// ── tipos ─────────────────────────────────────────────────────────────────────
interface Orden {
  Id: string;
  NroOrden: string;
  NroAdmision: string;
  Fecha: string;
  Paciente: string;
  Documento: string;
  Telefono: string;
  Entidad: string;
  EpsBot: string | null;   // código bot RPA o null si no soportada
  Cups: string;
  Orden: string;
  Observacion: string;
  Medico: string;
  Estado: string;
  // Validación RPA pre-cargada desde AutorizacionRPA
  ValEpsEstado: string;        // AUTORIZADO | SIN_VOLANTE | SIN_CONTRATO | ERROR | ""
  ValEpsAutorizacion: string;
  ValEpsVigencia: string;
  ValEpsMensaje: string;
  ValEpsArchivos: Array<{ tipo: string; nombre_archivo: string; url_descarga: string }>;
  // Cita agendada en ZeusSalud (mismos CUPS, fecha >= hoy)
  TieneCita: boolean;
  FechaCita: string;
}

interface AutorizacionResult {
  status: string;           // AUTORIZADO | SIN_VOLANTE | SIN_CONTRATO | ERROR
  num_autorizacion?: string;
  fecha_vigencia?: string;
  servicio?: string;
  cups?: string;
  mensaje?: string;
}

// ── Familia de orden (replica obtenerFamiliaOrden del Flask app) ──────────────
function obtenerFamiliaOrden(nombre: string): string {
  const s = (nombre || "").trim().toUpperCase();
  if (!s) return "SIN ESPECIFICAR";
  if (s.includes("RESONANCIA")) return "RESONANCIA MAGNÉTICA";
  if (s.includes("TOMOGRAF") || s.includes(" TAC ") || s.includes("PET")) return "TOMOGRAFÍA (TAC)";
  if (s.includes("ELECTROMIOGRAF")) return "ELECTROMIOGRAFÍA";
  if (s.includes("NEUROCONDUCCI") || s.includes("VELOCIDAD DE CONDUCCI")) return "NEUROCONDUCCIÓN";
  if (s.includes("REFLEJO H")) return "REFLEJO H";
  if (s.includes("ONDA F")) return "ONDA F";
  if (s.includes("MONITORIZACI") || s.includes("TELEMETRIA")) return "MONITORIZACIÓN EEG";
  if (s.includes("ELECTROENCEFALOGRAMA") || s.includes(" EEG ")) return "ELECTROENCEFALOGRAMA";
  if (s.includes("POLISOMNOGRAF") || s.includes("POLISOMNOGRAMA") || s.includes("SUEÑO") || s.includes("SUENO")) return "POLISOMNOGRAFÍA";
  if (s.includes("POTENCIAL")) return "POTENCIALES EVOCADOS";
  if (s.includes("BLOQUEO")) return "BLOQUEO";
  if (s.includes("INFILTRACI")) return "INFILTRACIÓN";
  if (s.includes("TOXINA") || s.includes("MIORELAJANTE") || s.includes("INYECCION")) return "TOXINA BOTULÍNICA";
  if (s.includes("ECOGRAF") || s.includes("DOPPLER")) return "ECOGRAFÍA";
  if (s.includes("RADIOGRAF") || s.includes(" RAYOS ") || s.includes(" RX ")) return "RADIOGRAFÍA (RX)";
  if (s.includes("SEDACI")) return "SOPORTE SEDACIÓN";
  if (s.includes("PEDIAT") && (s.includes("CONSULTA") || s.includes("NEUROLOG"))) return "CONSULTA NEUROLOGÍA PEDIÁTRICA";
  if ((s.includes("FISICA") || s.includes("REHABILITA")) && s.includes("CONSULTA")) return "CONSULTA FISIATRÍA";
  if (s.includes("FISIATRIA") && s.includes("CONSULTA")) return "CONSULTA FISIATRÍA";
  if (s.includes("TERAPIA")) return "TERAPIAS";
  if (s.includes("CONSULTA") || s.includes("NEUROLOG") || s.includes("CONTROL")) return "CONSULTA / CONTROL NEUROLOGÍA";
  const palabras = s.split(/[^A-ZÁÉÍÓÚÑ0-9]+/).filter(w => w && !["DE","DEL","LA","EL","LOS","LAS","EN","POR","CON","PARA","O","Y","UN","UNA"].includes(w));
  return palabras.length ? palabras.slice(0, 2).join(" ") : s.slice(0, 25);
}

// ── helpers de clasificación (replica lógica Flask) ───────────────────────────
function getOrdenBadge(orden: string): { bg: string; color: string } {
  const u = (orden || "").toUpperCase();
  if (u.includes("RESONANCIA")) return { bg: "#CFFAFE", color: "#155E75" };
  if (u.includes("TELEMETR") || u.includes("MONITORIZACI") || u.includes("ELECTROENCEFALOGRAMA") || u.includes("POTENCIAL") || u.includes("NEURO"))
    return { bg: "#DBEAFE", color: "#1D4ED8" };
  if (u.includes(" TAC ") || u.includes("PET-CT")) return { bg: "#FEE2E2", color: "#991B1B" };
  if (u.includes("ECOGRAFIA") || u.includes("ULTRASONOGRAFIA") || u.includes("DOPPLER"))
    return { bg: "#D1FAE5", color: "#065F46" };
  if (u.includes("MAMOGRAFIA") || u.includes("RAYOS X") || u.includes(" RX ") || u.includes("RADIOGRAFIA"))
    return { bg: "#FEF9C3", color: "#713F12" };
  if (u.includes("FISIATRIA") || u.includes("TERAPIA") || u.includes("BIOPSIA") || u.includes("INFILTRACION"))
    return { bg: "#F1F5F9", color: "#334155" };
  if (u.includes("MEDICAMENTO")) return { bg: "#E2E8F0", color: "#334155" };
  if (u.includes("CONSULTA")) return { bg: "#F8FAFC", color: "#64748B" };
  return { bg: "#F1F5F9", color: "#334155" };
}

function categorizarOrden(orden: string): "imagenes" | "neuro" | "fisi" | "otro" {
  const u = (orden || "").toUpperCase();
  if (u.includes("RESONANCIA") || u.includes(" TAC ") || u.includes("PET") || u.includes("RAYOS X") || u.includes(" RX ") || u.includes("ECOGRAF") || u.includes("MAMOGRAF") || u.includes("RADIOGRAFIA"))
    return "imagenes";
  if (u.includes("MONITORIZACI") || u.includes("TELEMETRIA") || u.includes("ELECTROENCEFALOGRAMA") || u.includes("POTENCIAL") || u.includes("NEURO"))
    return "neuro";
  if (u.includes("FISIATRIA") || u.includes("TERAPIA") || u.includes("REHABILITA") || u.includes("MEDICINA FISICA") || u.includes("INFILTRACION"))
    return "fisi";
  return "otro";
}

function exportarExcel(data: Orden[]) {
  const encabezados = ["Fecha", "Paciente", "Documento", "Teléfono", "Entidad", "Médico", "CUPS", "Orden", "Observación", "Estado"];
  const filas = data.map(r => [
    r.Fecha, r.Paciente, r.Documento, r.Telefono, r.Entidad,
    r.Medico, r.Cups, r.Orden, r.Observacion, r.Estado,
  ]);
  const contenido = [encabezados, ...filas]
    .map(row => row.map(c => `"${(c || "").toString().replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["﻿" + contenido], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Reporte_Demanda_Inducida.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ── StatCard ──────────────────────────────────────────────────────────────────
interface DesglosItem { familia: string; cantidad: number }
interface StatCardProps {
  label: string; value: string | number; icon: string; borderColor: string; iconColor: string;
  small?: boolean; onClick?: () => void; active?: boolean;
  desglose?: DesglosItem[]; onClickFamilia?: (f: string) => void; familiaActiva?: string;
}
const StatCard = ({ label, value, icon, borderColor, iconColor, small, onClick, active, desglose, onClickFamilia, familiaActiva }: StatCardProps) => (
  <div
    onClick={onClick}
    style={{
      background: active ? `${borderColor}10` : "#fff",
      borderRadius: 12,
      borderLeft: `5px solid ${borderColor}`,
      boxShadow: active ? `0 0 0 2px ${borderColor}40, 0 4px 6px -1px rgba(0,0,0,0.05)` : "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)",
      padding: desglose ? "10px 14px" : "14px 18px",
      flex: 1, minWidth: 160, cursor: onClick ? "pointer" : "default",
      transition: "box-shadow 0.15s"
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <div style={{ fontSize: "0.70rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6B7280", marginBottom: 4 }}>{label}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <div style={{ fontSize: small ? "1.2rem" : "1.65rem", fontWeight: 700, color: "#1F2937" }}>{value}</div>
          {active && <span style={{ fontSize: "0.6rem", background: borderColor, color: "#fff", borderRadius: 9999, padding: "1px 6px", fontWeight: 600 }}>Activo</span>}
        </div>
      </div>
      <div style={{ fontSize: "1.9rem", color: iconColor, opacity: 0.75, marginTop: 2 }}>{icon}</div>
    </div>
    {desglose && desglose.length > 0 && (
      <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px solid #F1F5F9", maxHeight: 72, overflowY: "auto" }}>
        {desglose.map(g => (
          <div key={g.familia}
            onClick={e => { e.stopPropagation(); onClickFamilia?.(g.familia); }}
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "1px 4px", borderRadius: 4, cursor: "pointer", marginBottom: 1,
              background: familiaActiva === g.familia ? "#FEF3C7" : "transparent",
              fontWeight: familiaActiva === g.familia ? 700 : 400
            }}
          >
            <span style={{ fontSize: "0.61rem", color: "#1F2937", maxWidth: 155, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>• {g.familia}</span>
            <span style={{ fontSize: "0.6rem", background: "#F59E0B", color: "#fff", borderRadius: 9999, padding: "0 5px", fontWeight: 700 }}>{g.cantidad}</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ── Badge de validación EPS (columna Validación EPS) ─────────────────────────
const BadgeValidacionEps = ({ r, onValidar, onRevalidar }: {
  r: AutorizacionResult | "cargando" | null;
  onValidar: () => void;
  onRevalidar: () => void;
}) => {
  if (r === "cargando") return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <span style={{ background: "#EFF6FF", color: "#3B82F6", borderRadius: 9999, padding: "3px 8px", fontSize: "0.65rem", display: "inline-flex", alignItems: "center", gap: 3 }}>
        <span style={{ display: "inline-block", width: 8, height: 8, border: "2px solid #3B82F6", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}></span> Consultando...
      </span>
    </div>
  );
  if (!r) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <span style={{ background: "#F1F5F9", color: "#64748B", border: "1px solid #E2E8F0", borderRadius: 9999, padding: "2px 7px", fontSize: "0.63rem", fontWeight: 500, whiteSpace: "nowrap" }}>
        Contratado
      </span>
      <button onClick={onValidar} style={{ background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE", borderRadius: 9999, padding: "2px 8px", fontSize: "0.6rem", cursor: "pointer", whiteSpace: "nowrap" }}>
        Validar EPS
      </button>
    </div>
  );
  if (r.status === "AUTORIZADO") return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <span style={{ background: "#D1FAE5", color: "#065F46", borderRadius: 9999, padding: "3px 8px", fontSize: "0.65rem", fontWeight: 600, whiteSpace: "nowrap" }}>
        Autorizado
      </span>
      {r.num_autorizacion && <div style={{ fontSize: "0.58rem", color: "#374151", textAlign: "center" }}>#{r.num_autorizacion.replace(/^#+/, "").substring(0, 18)}</div>}
      {r.fecha_vigencia && <div style={{ fontSize: "0.58rem", color: "#6B7280" }}>Vence: {r.fecha_vigencia}</div>}
      <button onClick={onRevalidar} style={{ background: "none", color: "#9CA3AF", border: "none", padding: 0, fontSize: "0.58rem", cursor: "pointer" }}>↺ Revalidar</button>
    </div>
  );
  if (r.status === "SIN_VOLANTE" || r.status === "SIN_ORDENES") return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <span style={{ background: "#FEF3C7", color: "#92400E", border: "1px solid #F59E0B", borderRadius: 9999, padding: "2px 7px", fontSize: "0.63rem", fontWeight: 500, whiteSpace: "nowrap" }}>
        Sin Volante
      </span>
      <button onClick={onRevalidar} style={{ background: "#F9FAFB", color: "#6B7280", border: "1px solid #E5E7EB", borderRadius: 9999, padding: "2px 7px", fontSize: "0.6rem", cursor: "pointer", whiteSpace: "nowrap" }}>
        ↺ Revalidar
      </button>
    </div>
  );
  if (r.status === "SIN_CONTRATO") return (
    <span style={{ background: "#FEE2E2", color: "#991B1B", borderRadius: 9999, padding: "3px 8px", fontSize: "0.63rem", fontWeight: 500 }}>Sin contrato</span>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <span style={{ background: "#F3F4F6", color: "#6B7280", borderRadius: 9999, padding: "2px 7px", fontSize: "0.63rem" }}>{r.status}</span>
      <button onClick={onRevalidar} style={{ background: "none", color: "#9CA3AF", border: "none", padding: 0, fontSize: "0.58rem", cursor: "pointer" }}>↺ Revalidar</button>
    </div>
  );
};

const ITEMS_POR_PAGINA = 10;

// ── Componente principal ──────────────────────────────────────────────────────
const DashboardDemandaInducida: React.FC = () => {
  const [data, setData]       = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina]   = useState(1);
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null);  // "imagenes"|"neuro"|"fisi"|"otro"
  const [filtroFamilia, setFiltroFamilia]     = useState<string | null>(null);  // sub-especialidad exacta

  const hoy = new Date();
  const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
  const hace30 = new Date(hoy); hace30.setDate(hace30.getDate() - 30);
  const hace30Str = `${hace30.getFullYear()}-${String(hace30.getMonth() + 1).padStart(2, "0")}-${String(hace30.getDate()).padStart(2, "0")}`;
  const [fechaDesde, setFechaDesde] = useState(hace30Str);
  const [fechaHasta, setFechaHasta] = useState(hoyStr);

  // Caché de autorizaciones: clave = "eps|doc_num"
  const autCache = useRef<Record<string, AutorizacionResult | "cargando">>({});
  const [autState, setAutState] = useState<Record<string, AutorizacionResult | "cargando">>({});
  // Cola de validaciones pendientes
  const colaRef = useRef<{ eps: string; docNum: string; clave: string }[]>([]);
  const procesandoRef = useRef(false);

  const actualizarAut = useCallback((clave: string, val: AutorizacionResult | "cargando") => {
    autCache.current[clave] = val;
    setAutState(prev => ({ ...prev, [clave]: val }));
  }, []);

  const procesarCola = useCallback(async () => {
    if (procesandoRef.current) return;
    procesandoRef.current = true;
    while (colaRef.current.length > 0) {
      const item = colaRef.current.shift()!;
      if (autCache.current[item.clave] && autCache.current[item.clave] !== "cargando") continue;
      actualizarAut(item.clave, "cargando");
      try {
        const res = await fetch(`${API}/gedocumental/consultar-autorizacion/`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
          body: JSON.stringify({ eps: item.eps, doc_tipo: "CC", doc_num: item.docNum }),
        });
        const json = await res.json();
        const resultado: AutorizacionResult = json.data || json;
        actualizarAut(item.clave, resultado);
      } catch {
        actualizarAut(item.clave, { status: "ERROR", mensaje: "Sin conexión con RPA" });
      }
    }
    procesandoRef.current = false;
  }, [actualizarAut]);

  const encolarValidaciones = useCallback((filas: Orden[]) => {
    const nuevas: typeof colaRef.current = [];
    const vistos = new Set<string>();
    for (const fila of filas) {
      if (!fila.EpsBot) continue;
      // Si ya tiene estado desde la BD, no re-consultar automáticamente
      if (fila.ValEpsEstado) continue;
      const docLimpio = (fila.Documento || "").replace(/[^0-9A-Za-z]/g, "");
      const clave = `${fila.EpsBot}|${docLimpio}`;
      if (!vistos.has(clave) && !autCache.current[clave]) {
        vistos.add(clave);
        nuevas.push({ eps: fila.EpsBot, docNum: docLimpio, clave });
      }
    }
    if (nuevas.length > 0) {
      colaRef.current.push(...nuevas);
      procesarCola();
    }
  }, [procesarCola]);

  const cargarDatos = () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (fechaDesde) params.set("fecha_desde", fechaDesde);
    if (fechaHasta) params.set("fecha_hasta", fechaHasta);
    fetch(`${API}/gedocumental/demanda-inducida/?${params.toString()}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
    })
      .then(r => r.json())
      .then(json => { setData(json.data || []); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  };

  useEffect(() => { cargarDatos(); }, []);

  const filtrados = useMemo(() => {
    return data.filter(r => {
      const fechaRow = r.Fecha.split(" ")[0];
      if (fechaDesde && fechaRow < fechaDesde) return false;
      if (fechaHasta && fechaRow > fechaHasta) return false;
      // Ocultar filas que ya tienen "Sin contrato" en BD
      if (r.ValEpsEstado === "SIN_CONTRATO") return false;
      // Ocultar filas cuya validación en vivo ya retornó "Sin contrato"
      if (r.EpsBot) {
        const docLimpio = (r.Documento || "").replace(/[^0-9A-Za-z]/g, "");
        const clave = `${r.EpsBot}|${docLimpio}`;
        const aut = autState[clave];
        if (aut && aut !== "cargando" && (aut as AutorizacionResult).status === "SIN_CONTRATO") return false;
      }
      if (busqueda) {
        const q = busqueda.toLowerCase();
        if (!(r.Paciente + r.Entidad + r.Medico + r.Orden + r.Documento + r.Cups).toLowerCase().includes(q)) return false;
      }
      if (filtroCategoria) {
        if (categorizarOrden(r.Orden) !== filtroCategoria) return false;
      }
      if (filtroFamilia) {
        if (obtenerFamiliaOrden(r.Orden) !== filtroFamilia) return false;
      }
      return true;
    });
  }, [data, fechaDesde, fechaHasta, busqueda, filtroCategoria, filtroFamilia, autState]);

  // Para stats usamos los datos SIN filtro de categoría/familia (para mostrar totales reales)
  const dataSinFiltroCategoria = useMemo(() => {
    return data.filter(r => {
      const fechaRow = r.Fecha.split(" ")[0];
      if (fechaDesde && fechaRow < fechaDesde) return false;
      if (fechaHasta && fechaRow > fechaHasta) return false;
      if (busqueda) {
        const q = busqueda.toLowerCase();
        if (!(r.Paciente + r.Entidad + r.Medico + r.Orden + r.Documento + r.Cups).toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [data, fechaDesde, fechaHasta, busqueda]);

  const stats = useMemo(() => {
    let imagenes = 0, neuro = 0, fisi = 0, otro = 0, lastDate = "";
    const mapFamilias: Record<string, Record<string, number>> = { imagenes: {}, neuro: {}, fisi: {}, otro: {} };
    for (const r of dataSinFiltroCategoria) {
      const cat = categorizarOrden(r.Orden);
      const fam = obtenerFamiliaOrden(r.Orden);
      if (cat === "imagenes") { imagenes++; mapFamilias.imagenes[fam] = (mapFamilias.imagenes[fam] || 0) + 1; }
      else if (cat === "neuro") { neuro++; mapFamilias.neuro[fam] = (mapFamilias.neuro[fam] || 0) + 1; }
      else if (cat === "fisi") { fisi++; mapFamilias.fisi[fam] = (mapFamilias.fisi[fam] || 0) + 1; }
      else { otro++; mapFamilias.otro[fam] = (mapFamilias.otro[fam] || 0) + 1; }
      if (!lastDate || r.Fecha > lastDate) lastDate = r.Fecha;
    }
    const toDesglose = (m: Record<string, number>): DesglosItem[] =>
      Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([familia, cantidad]) => ({ familia, cantidad }));
    const mapTotal: Record<string, number> = {};
    for (const r of dataSinFiltroCategoria) {
      const fam = obtenerFamiliaOrden(r.Orden);
      mapTotal[fam] = (mapTotal[fam] || 0) + 1;
    }
    return {
      total: dataSinFiltroCategoria.length, imagenes, neuro, fisi, otro,
      lastDate: lastDate ? lastDate.split(" ")[0] : "-",
      desgloseTotal: toDesglose(mapTotal),
    };
  }, [dataSinFiltroCategoria]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / ITEMS_POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const filasPagina  = filtrados.slice((paginaActual - 1) * ITEMS_POR_PAGINA, paginaActual * ITEMS_POR_PAGINA);

  // Auto-validar las filas de la página actual cuando cambian
  useEffect(() => {
    if (filasPagina.length > 0) encolarValidaciones(filasPagina);
  }, [filasPagina, encolarValidaciones]);

  const limpiarFiltro = () => { setFechaDesde(hace30Str); setFechaHasta(hoyStr); setBusqueda(""); setPagina(1); setFiltroCategoria(null); setFiltroFamilia(null); };

  const toggleCategoria = (cat: string) => {
    if (filtroCategoria === cat) { setFiltroCategoria(null); setFiltroFamilia(null); }
    else { setFiltroCategoria(cat); setFiltroFamilia(null); }
    setPagina(1);
  };
  const toggleFamilia = (fam: string) => {
    if (filtroFamilia === fam) { setFiltroFamilia(null); }
    else { setFiltroFamilia(fam); }
    setPagina(1);
  };

  // Contadores de autorizaciones en los datos filtrados
  const contAutorizados = useMemo(() => {
    return filtrados.filter(r => {
      if (!r.EpsBot) return false;
      const clave = `${r.EpsBot}|${(r.Documento || "").replace(/[^0-9A-Za-z]/g, "")}`;
      const aut = autState[clave];
      return aut && aut !== "cargando" && (aut as AutorizacionResult).status === "AUTORIZADO";
    }).length;
  }, [filtrados, autState]);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#F3F4F6", minHeight: "100%", padding: "24px" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Tarjetas */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard label="Total Notificaciones"  value={stats.total}    icon="✉️"  borderColor="#DC143C" iconColor="#DC143C" />
        <StatCard label="Imágenes Diagnósticas" value={stats.imagenes} icon="🧲"  borderColor="#4B0082" iconColor="#4B0082"
          onClick={() => toggleCategoria("imagenes")} active={filtroCategoria === "imagenes"} />
        <StatCard label="Neurología y Estudios" value={stats.neuro}    icon="🧠"  borderColor="#173872" iconColor="#173872"
          onClick={() => toggleCategoria("neuro")} active={filtroCategoria === "neuro"} />
        <StatCard label="Fisiatría y Terapias"  value={stats.fisi}     icon="🚶"  borderColor="#20c997" iconColor="#20c997"
          onClick={() => toggleCategoria("fisi")} active={filtroCategoria === "fisi"} />
        <StatCard label="Otros Servicios"       value={stats.otro}     icon="📋"  borderColor="#F59E0B" iconColor="#F59E0B"
          onClick={() => toggleCategoria("otro")} active={filtroCategoria === "otro"} />
        <StatCard label="Pendiente Cita (Aut. EPS)" value={contAutorizados} icon="✅" borderColor="#16a34a" iconColor="#16a34a"
          desglose={stats.desgloseTotal} onClickFamilia={toggleFamilia} familiaActiva={filtroFamilia || undefined} />
        <StatCard label="Última Actividad"      value={stats.lastDate}  icon="⚡" borderColor="#28a745" iconColor="#28a745" small />
      </div>

      {/* Tabla */}
      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontWeight: 600, fontSize: "1.1rem", color: "#1F2937", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ color: "#9CA3AF" }}>⊞</span> Listado de Órdenes Generadas
            {(filtroCategoria || filtroFamilia) && (
              <span
                onClick={() => { setFiltroCategoria(null); setFiltroFamilia(null); setPagina(1); }}
                style={{ background: "#F59E0B", color: "#1F2937", borderRadius: 9999, padding: "3px 10px", fontSize: "0.7rem", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                title="Clic para quitar filtro"
              >
                Filtro activo: {filtroFamilia ? filtroFamilia : ({ imagenes: "Imágenes", neuro: "Neurología", fisi: "Fisiatría", otro: "Otros" } as Record<string,string>)[filtroCategoria!]} ×
              </span>
            )}
            {!filtroCategoria && !filtroFamilia && (
              <span style={{ fontSize: "0.72rem", color: "#6B7280", fontWeight: 400 }}>
                — Autorizaciones consultadas automáticamente para SANITAS · CAPITAL · FOMAG · SALUD TOTAL
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: "0.8rem" }}>
            <input type="text" placeholder="Buscar..." value={busqueda} onChange={e => { setBusqueda(e.target.value); setPagina(1); }}
              style={{ border: "1px solid #D1D5DB", borderRadius: 8, padding: "4px 10px", fontSize: "0.78rem", height: 28, width: 140 }} />
            <span style={{ color: "#6B7280", fontWeight: 600 }}>Desde:</span>
            <input type="date" value={fechaDesde} onChange={e => { setFechaDesde(e.target.value); setPagina(1); }}
              style={{ border: "1px solid #D1D5DB", borderRadius: 8, padding: "2px 6px", fontSize: "0.78rem", height: 28, width: 128 }} />
            <span style={{ color: "#6B7280", fontWeight: 600 }}>Hasta:</span>
            <input type="date" value={fechaHasta} onChange={e => { setFechaHasta(e.target.value); setPagina(1); }}
              style={{ border: "1px solid #D1D5DB", borderRadius: 8, padding: "2px 6px", fontSize: "0.78rem", height: 28, width: 128 }} />
            <button onClick={cargarDatos} style={{ background: "#173872", color: "#fff", border: "none", borderRadius: 20, padding: "0 12px", height: 28, fontSize: "0.72rem", cursor: "pointer" }}>🔍 Consultar</button>
            <button onClick={limpiarFiltro} style={{ background: "linear-gradient(135deg,#9B7DD4,#7C5CBF)", color: "#fff", border: "none", borderRadius: 20, padding: "0 12px", height: 28, fontSize: "0.72rem", cursor: "pointer" }}>↺ Limpiar</button>
            <button onClick={() => exportarExcel(filtrados)} style={{ background: "#556B2F", color: "#fff", border: "none", borderRadius: 20, padding: "0 12px", height: 28, fontSize: "0.72rem", cursor: "pointer" }}>⬇ Exportar Excel</button>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 48, color: "#6B7280" }}>Cargando datos...</div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: 48, color: "#DC2626" }}>Error: {error}</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {(["Fecha","Paciente","Contacto","Entidad","Médico","Orden Solicitada","Obs. Médica","Validación EPS","Orden Adjunta","Seguimiento Cita"] as string[]).map(h => (
                    <th key={h} style={{ background: "#F9FAFB", color: "#6B7280", fontWeight: 600, textTransform: "uppercase", fontSize: "0.62rem", letterSpacing: "0.04em", borderBottom: "2px solid #E5E7EB", padding: "8px 12px", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filasPagina.length === 0 ? (
                  <tr><td colSpan={10} style={{ textAlign: "center", padding: 32, color: "#6B7280", fontSize: "0.875rem" }}>No hay registros para el rango de fechas seleccionado.</td></tr>

                ) : filasPagina.map((r, i) => {
                  const badge = getOrdenBadge(r.Orden);
                  const partesFecha = r.Fecha.split(" ");
                  const docLimpio = (r.Documento || "").replace(/[^0-9A-Za-z]/g, "");

                  // Validación: usa datos pre-cargados, con posibilidad de re-consulta
                  const claveAut = r.EpsBot ? `${r.EpsBot}|${docLimpio}` : null;
                  const autDinamico = claveAut ? autState[claveAut] : undefined;
                  // Si hay resultado dinámico (del botón Revalidar) lo usa, si no usa el pre-cargado
                  const valEstado = autDinamico && autDinamico !== "cargando"
                    ? (autDinamico as AutorizacionResult).status
                    : (r.ValEpsEstado || "");
                  const valAutorizacion = autDinamico && autDinamico !== "cargando"
                    ? ((autDinamico as AutorizacionResult).num_autorizacion || "")
                    : (r.ValEpsAutorizacion || "");
                  const valVigencia = autDinamico && autDinamico !== "cargando"
                    ? ((autDinamico as AutorizacionResult).fecha_vigencia || "")
                    : (r.ValEpsVigencia || "");
                  const cargando = autDinamico === "cargando";

                  const revalidar = () => {
                    if (!r.EpsBot || !docLimpio) return;
                    const clave = `${r.EpsBot}|${docLimpio}`;
                    delete autCache.current[clave];
                    colaRef.current.unshift({ eps: r.EpsBot, docNum: docLimpio, clave });
                    procesarCola();
                  };

                  // Archivos adjuntos: del resultado dinámico (Revalidar) o de la pre-carga
                  const archivosRaw: Array<{tipo:string;nombre_archivo:string;url_descarga:string}> =
                    (autDinamico && autDinamico !== "cargando" ? (autDinamico as any).ValEpsArchivos : null)
                    || r.ValEpsArchivos || [];
                  // Filtrar solo el PDF cuyo nombre coincide con el CUPS de esta fila
                  const cupsFila = (r.Cups || "").split("-")[0];
                  const archivos = cupsFila
                    ? archivosRaw.filter(a => a.url_descarga.includes(`CUPS_${cupsFila}`))
                    : archivosRaw;

                  return (
                    <tr key={r.Id} style={{ background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#F9FAFB")}
                      onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#FAFAFA")}>

                      {/* FECHA */}
                      <td style={{ padding: "7px 12px", borderBottom: "1px solid #F3F4F6", fontSize: "0.75rem", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                        <div style={{ fontWeight: 500, color: "#1F2937" }}>{partesFecha[0]}</div>
                        <div style={{ color: "#9CA3AF", fontSize: "0.65rem" }}>{partesFecha[1] || "00:00"}</div>
                        <div style={{ color: "#CBD5E1", fontSize: "0.58rem" }}>#{r.NroOrden}</div>
                      </td>

                      {/* PACIENTE */}
                      <td style={{ padding: "7px 12px", borderBottom: "1px solid #F3F4F6", fontSize: "0.75rem", verticalAlign: "middle" }}>
                        <div style={{ fontWeight: 700, color: "#1F2937" }}>{r.Paciente}</div>
                        <div style={{ color: "#6B7280", fontSize: "0.65rem", marginTop: 1 }}>CC: {r.Documento}</div>
                      </td>

                      {/* CONTACTO */}
                      <td style={{ padding: "7px 12px", borderBottom: "1px solid #F3F4F6", fontSize: "0.75rem", verticalAlign: "middle" }}>
                        <div style={{ color: "#6B7280" }}>{r.Telefono}</div>
                      </td>

                      {/* ENTIDAD */}
                      <td style={{ padding: "7px 12px", borderBottom: "1px solid #F3F4F6", fontSize: "0.75rem", verticalAlign: "middle", maxWidth: 170 }}>
                        <div style={{ color: "#374151", lineHeight: 1.3 }}>{r.Entidad}</div>
                        {r.EpsBot && <div style={{ fontSize: "0.58rem", color: "#A78BFA", marginTop: 1 }}>{r.EpsBot}</div>}
                      </td>

                      {/* MÉDICO */}
                      <td style={{ padding: "7px 12px", borderBottom: "1px solid #F3F4F6", fontSize: "0.75rem", verticalAlign: "middle" }}>
                        <div style={{ color: "#1F2937" }}>{r.Medico}</div>
                      </td>

                      {/* ORDEN SOLICITADA */}
                      <td style={{ padding: "7px 12px", borderBottom: "1px solid #F3F4F6", fontSize: "0.75rem", verticalAlign: "middle", textAlign: "center" }}>
                        <div style={{ display: "inline-block", background: badge.bg, color: badge.color, borderRadius: 9999, padding: "2px 8px", fontSize: "0.58rem", fontWeight: 500, lineHeight: 1.3, textAlign: "center", maxWidth: 150, wordBreak: "break-word" }}>
                          {r.Orden || `PROCEDIMIENTO (${r.Cups})`}
                        </div>
                        <div style={{ color: "#9CA3AF", fontSize: "0.58rem", marginTop: 2 }}>CUPS: {r.Cups}</div>
                        {r.NroOrden && r.NroAdmision && (
                          <a href={`${API}/gedocumental/ver-pdf-orden/?estudio=${r.NroAdmision}&numero=${r.NroOrden}`}
                            target="_blank" rel="noreferrer"
                            style={{ display: "inline-flex", alignItems: "center", gap: 3, marginTop: 4, background: "#F1F5F9", color: "#334155", border: "1px solid #CBD5E1", borderRadius: 6, padding: "2px 7px", fontSize: "0.58rem", textDecoration: "none", whiteSpace: "nowrap" }}>
                            □ Orden Neuro
                          </a>
                        )}
                      </td>

                      {/* OBS. MÉDICA */}
                      <td style={{ padding: "7px 12px", borderBottom: "1px solid #F3F4F6", fontSize: "0.75rem", verticalAlign: "middle", maxWidth: 150 }}>
                        {r.Observacion && r.Observacion.trim()
                          ? <div style={{ color: "#5a6268", fontSize: "0.67rem", fontStyle: "italic", lineHeight: 1.3 }}>{r.Observacion}</div>
                          : <span style={{ color: "#D1D5DB" }}>—</span>}
                      </td>

                      {/* VALIDACIÓN EPS */}
                      <td style={{ padding: "7px 12px", borderBottom: "1px solid #F3F4F6", fontSize: "0.75rem", verticalAlign: "middle", textAlign: "center", minWidth: 120 }}>
                        {!r.EpsBot ? (
                          <span style={{ background: "#F1F5F9", color: "#64748B", border: "1px solid #E2E8F0", borderRadius: 9999, padding: "3px 8px", fontSize: "0.63rem" }}>Contratado</span>
                        ) : cargando ? (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                            <span style={{ background: "#EFF6FF", color: "#3B82F6", borderRadius: 9999, padding: "3px 8px", fontSize: "0.65rem", display: "inline-flex", alignItems: "center", gap: 3 }}>
                              <span style={{ display: "inline-block", width: 8, height: 8, border: "2px solid #3B82F6", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}></span> Consultando...
                            </span>
                          </div>
                        ) : valEstado === "AUTORIZADO" ? (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                            <span style={{ fontSize: "0.7rem", color: "#16a34a" }}>●</span>
                            {valAutorizacion && <div style={{ fontSize: "0.62rem", color: "#374151", fontWeight: 600 }}>#{valAutorizacion.replace(/^#+/, "").substring(0, 18)}</div>}
                            {valVigencia && <div style={{ fontSize: "0.58rem", color: "#6B7280" }}>Vence: {valVigencia}</div>}
                            <button onClick={revalidar} style={{ background: "none", color: "#9CA3AF", border: "none", padding: 0, fontSize: "0.58rem", cursor: "pointer" }}>↺ Revalidar</button>
                          </div>
                        ) : valEstado === "SIN_VOLANTE" || valEstado === "SIN_ORDENES" ? (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                            <span style={{ background: "#FEF3C7", color: "#92400E", border: "1px solid #F59E0B", borderRadius: 9999, padding: "2px 7px", fontSize: "0.63rem", fontWeight: 500 }}>Sin Volante</span>
                            <button onClick={revalidar} style={{ background: "#F9FAFB", color: "#6B7280", border: "1px solid #E5E7EB", borderRadius: 9999, padding: "2px 7px", fontSize: "0.6rem", cursor: "pointer" }}>↺ Revalidar</button>
                          </div>
                        ) : valEstado === "SIN_CONTRATO" ? (
                          <span style={{ background: "#FEE2E2", color: "#991B1B", borderRadius: 9999, padding: "3px 8px", fontSize: "0.63rem", fontWeight: 500 }}>Sin contrato</span>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                            <span style={{ background: "#F3F4F6", color: "#6B7280", border: "1px solid #E5E7EB", borderRadius: 9999, padding: "2px 7px", fontSize: "0.63rem" }}>
                              {valEstado || "Pendiente"}
                            </span>
                            <button onClick={revalidar} style={{ background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE", borderRadius: 9999, padding: "2px 8px", fontSize: "0.6rem", cursor: "pointer" }}>Validar EPS</button>
                          </div>
                        )}
                      </td>

                      {/* ORDEN ADJUNTA */}
                      <td style={{ padding: "7px 12px", borderBottom: "1px solid #F3F4F6", fontSize: "0.75rem", verticalAlign: "middle", textAlign: "center" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                          {archivos.filter(a => a.tipo === "ORDEN_PDF").map((a, ai) => (
                            <a key={ai} href={a.url_descarga} target="_blank" rel="noreferrer"
                              style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "#16a34a", color: "#fff", borderRadius: 6, padding: "3px 8px", fontSize: "0.6rem", textDecoration: "none", fontWeight: 600, whiteSpace: "nowrap" }}>
                              □ Orden PDF
                            </a>
                          ))}
                          {archivos.filter(a => a.tipo === "ADJUNTO").map((a, ai) => (
                            <a key={ai} href={a.url_descarga} target="_blank" rel="noreferrer"
                              title={a.nombre_archivo}
                              style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "#2563EB", color: "#fff", borderRadius: 6, padding: "3px 8px", fontSize: "0.6rem", textDecoration: "none", fontWeight: 600, whiteSpace: "nowrap", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis" }}>
                              ⊕ {a.nombre_archivo.length > 14 ? a.nombre_archivo.substring(0, 14) + "…" : a.nombre_archivo}
                            </a>
                          ))}
                          <button style={{ background: "none", border: "1px dashed #CBD5E1", color: "#9CA3AF", borderRadius: 6, padding: "3px 8px", fontSize: "0.6rem", cursor: "pointer", whiteSpace: "nowrap" }}>
                            + Adjuntar
                          </button>
                        </div>
                      </td>

                      {/* SEGUIMIENTO CITA */}
                      <td style={{ padding: "7px 12px", borderBottom: "1px solid #F3F4F6", fontSize: "0.75rem", verticalAlign: "middle", textAlign: "center", minWidth: 130 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                          {r.TieneCita ? (
                            <>
                              <span style={{ background: "#D1FAE5", color: "#065F46", borderRadius: 9999, padding: "2px 8px", fontSize: "0.6rem", fontWeight: 700 }}>✓ Cita Agendada</span>
                              {r.FechaCita && (
                                <span style={{ fontSize: "0.58rem", color: "#374151", fontWeight: 500 }}>{r.FechaCita}</span>
                              )}
                              {valEstado === "AUTORIZADO" && (
                                <span style={{ background: "#ECFDF5", color: "#059669", borderRadius: 9999, padding: "1px 6px", fontSize: "0.55rem", fontWeight: 600 }}>Aut. EPS ✓</span>
                              )}
                            </>
                          ) : (
                            <>
                              <span style={{ background: "#FEF3C7", color: "#92400E", borderRadius: 9999, padding: "2px 8px", fontSize: "0.6rem", fontWeight: 600 }}>Sin Cita</span>
                              {valEstado === "AUTORIZADO" && (
                                <span style={{ background: "#ECFDF5", color: "#059669", borderRadius: 9999, padding: "1px 6px", fontSize: "0.55rem", fontWeight: 600 }}>Aut. EPS ✓</span>
                              )}
                            </>
                          )}
                          <button style={{ background: "#0D9488", color: "#fff", border: "none", borderRadius: 6, padding: "3px 10px", fontSize: "0.6rem", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>
                            Agendar Cita
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {!loading && !error && (
          <div style={{ padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, borderTop: "1px solid #F3F4F6" }}>
            <div style={{ fontSize: "0.8rem", color: "#6B7280" }}>
              Mostrando {filtrados.length === 0 ? 0 : (paginaActual - 1) * ITEMS_POR_PAGINA + 1}–{Math.min(paginaActual * ITEMS_POR_PAGINA, filtrados.length)} de {filtrados.length} registros
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={paginaActual === 1}
                style={{ border: "1px solid #D1D5DB", borderRadius: 6, padding: "4px 10px", cursor: paginaActual === 1 ? "default" : "pointer", background: paginaActual === 1 ? "#F9FAFB" : "#fff", color: paginaActual === 1 ? "#9CA3AF" : "#1F2937" }}>‹</button>
              {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                let num = i + 1;
                if (totalPaginas > 5) {
                  if (paginaActual <= 3) num = i + 1;
                  else if (paginaActual >= totalPaginas - 2) num = totalPaginas - 4 + i;
                  else num = paginaActual - 2 + i;
                }
                return (
                  <button key={num} onClick={() => setPagina(num)}
                    style={{ border: "1px solid #D1D5DB", borderRadius: 6, padding: "4px 10px", cursor: "pointer", background: paginaActual === num ? "#173872" : "#fff", color: paginaActual === num ? "#fff" : "#1F2937" }}>{num}</button>
                );
              })}
              <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={paginaActual === totalPaginas}
                style={{ border: "1px solid #D1D5DB", borderRadius: 6, padding: "4px 10px", cursor: paginaActual === totalPaginas ? "default" : "pointer", background: paginaActual === totalPaginas ? "#F9FAFB" : "#fff", color: paginaActual === totalPaginas ? "#9CA3AF" : "#1F2937" }}>›</button>
            </div>
          </div>
        )}
      </div>

      <div style={{ textAlign: "center", marginTop: 16, color: "#9CA3AF", fontSize: "0.85rem" }}>
        Desarrollado por tecnología <strong>NeurDx</strong>
      </div>
    </div>
  );
};

export default DashboardDemandaInducida;
