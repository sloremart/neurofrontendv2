import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { getToken } from "../../../config/token.jsx";
import DetalleCasoDrawer from "./DetalleCasoDrawer.tsx";
import RegistrarDevolucionModal from "./RegistrarDevolucionModal.tsx";

const API = "/api/v2/gestion-facturacion";

type Bandeja = "realizados" | "radicados" | "devoluciones";

interface Caso {
  admision_id: number;
  con_estudio: number;
  paciente: string;
  documento: string;
  eps: string;
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
}

const TABS: { key: Bandeja; label: string; color: string }[] = [
  { key: "realizados",   label: "Realizados sin factura",  color: "#f59e0b" },
  { key: "radicados",    label: "Facturados sin radicar",  color: "#3b82f6" },
  { key: "devoluciones", label: "Devoluciones EPS",        color: "#ef4444" },
];

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
  const [servicioFiltro, setServicioFiltro] = useState<string>("Todos");

  const cargar = useCallback(async (bandeja: Bandeja, fi = fechaIni, ff = fechaFin) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (fi) params.fecha_inicio = fi;
      if (ff) params.fecha_fin    = ff;
      const { data } = await axios.get(`${API}/${bandeja}/`, {
        headers: { Authorization: `Token ${getToken()}` },
        params,
      });
      setCasos(data.data || []);
    } catch {
      setCasos([]);
    } finally {
      setLoading(false);
    }
  }, [fechaIni, fechaFin]);

  useEffect(() => { cargar(tab); }, [tab]);

  const cambiarEstado = async (caso: Caso, estado: string) => {
    await axios.post(
      `${API}/caso/${caso.admision_id}/actualizar/`,
      { bandeja: tab, estado },
      { headers: { Authorization: `Token ${getToken()}` } },
    );
    cargar(tab);
  };

  const serviciosDisponibles = ["Todos", ...Array.from(new Set(casos.map(c => c.servicio))).sort()];

  const casosFiltered = casos.filter(c => {
    if (servicioFiltro !== "Todos" && c.servicio !== servicioFiltro) return false;
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return (
      String(c.con_estudio).includes(q) ||
      String(c.admision_id).includes(q) ||
      c.paciente.toLowerCase().includes(q) ||
      c.eps.toLowerCase().includes(q) ||
      c.documento.includes(q)
    );
  });

  const totales = {
    pendiente:  casos.filter(c => c.estado === "pendiente").length,
    en_gestion: casos.filter(c => c.estado === "en_gestion").length,
    resuelto:   casos.filter(c => c.estado === "resuelto").length,
    valor:      casos.filter(c => c.estado !== "resuelto").reduce((s, c) => s + c.valor_total, 0),
  };

  const tabActual = TABS.find(t => t.key === tab)!;

  return (
    <div style={{ padding: "20px 24px", fontFamily: "inherit", maxWidth: 1400, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>
          Gestión de Facturación
        </h1>
        <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: 14 }}>
          Seguimiento operativo caso a caso — bandejas de trabajo
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "2px solid #e2e8f0", paddingBottom: 0 }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setBusqueda(""); setServicioFiltro("Todos"); }}
            style={{
              padding: "10px 20px", border: "none", cursor: "pointer",
              borderRadius: "8px 8px 0 0", fontWeight: 600, fontSize: 14,
              background: tab === t.key ? t.color : "#f1f5f9",
              color: tab === t.key ? "#fff" : "#475569",
              borderBottom: tab === t.key ? `2px solid ${t.color}` : "2px solid transparent",
              marginBottom: -2,
              transition: "all 0.15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Total casos", val: casos.length, bg: "#f8fafc", text: "#1e293b" },
          { label: "Pendientes",  val: totales.pendiente, bg: "#fef3c7", text: "#92400e" },
          { label: "En gestión",  val: totales.en_gestion, bg: "#dbeafe", text: "#1e40af" },
          { label: "Resueltos",   val: totales.resuelto, bg: "#dcfce7", text: "#166534" },
          { label: "Valor en riesgo", val: fmt(totales.valor), bg: "#fef2f2", text: "#991b1b" },
        ].map(k => (
          <div key={k.label} style={{
            background: k.bg, borderRadius: 10, padding: "10px 18px",
            minWidth: 120, textAlign: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: k.text }}>{k.val}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
        <div style={{ flex: 1 }} />
        {/* Filtros */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
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
          <button onClick={() => cargar(tab)} style={btnStyle(tabActual.color)}>
            Buscar
          </button>
          {tab === "devoluciones" && (
            <button onClick={() => setShowDevModal(true)} style={btnStyle("#10b981")}>
              + Registrar devolución
            </button>
          )}
        </div>
      </div>

      {/* Buscador */}
      <input
        placeholder="Filtrar por No. estudio, paciente, documento o EPS..."
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        style={{ ...inputStyle, width: "100%", marginBottom: 10, fontSize: 14 }}
      />

      {/* Filtro por servicio */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: 8,
        marginBottom: 16,
      }}>
        {serviciosDisponibles.map(s => {
          const grupo = s === "Todos" ? casos : casos.filter(c => c.servicio === s);
          const totalValor = grupo.reduce((acc, c) => acc + c.valor_total, 0);
          const activo = servicioFiltro === s;
          return (
            <button
              key={s}
              onClick={() => setServicioFiltro(s)}
              style={{
                padding: "10px 12px",
                border: `2px solid ${activo ? tabActual.color : "#e2e8f0"}`,
                borderRadius: 10,
                cursor: "pointer",
                background: activo ? tabActual.color : "#fff",
                color: activo ? "#fff" : "#334155",
                transition: "all 0.15s",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 4,
                textAlign: "left",
                boxShadow: activo ? `0 2px 8px ${tabActual.color}44` : "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              <span style={{
                fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: activo ? "#fff" : "#64748b",
              }}>
                {s === "Todos" ? "Todos" : s}
              </span>
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 20, fontWeight: 800, lineHeight: 1 }}>
                  {grupo.length}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  color: activo ? "rgba(255,255,255,0.85)" : "#94a3b8",
                  whiteSpace: "nowrap",
                }}>
                  {fmt(totalValor)}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tabla */}
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
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                {["No. Estudio", "Paciente", "EPS / Servicio", "Valor", "Días", "Docs", "Estado", "Acciones"]
                  .map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#475569", whiteSpace: "nowrap" }}>
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
                    opacity: c.estado === "resuelto" ? 0.6 : 1,
                  }}
                >
                  <td style={td}>
                    <span
                      onClick={() => setDetalleId(c.admision_id)}
                      style={{ color: tabActual.color, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}
                    >
                      {c.con_estudio || c.admision_id}
                    </span>
                    {c.numero_radicado && (
                      <div style={{ fontSize: 11, color: "#64748b" }}>Rad: {c.numero_radicado}</div>
                    )}
                  </td>
                  <td style={td}>
                    <div style={{ fontWeight: 500 }}>{c.paciente || "—"}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{c.documento}</div>
                  </td>
                  <td style={{ ...td, maxWidth: 180 }}>
                    <span title={c.eps} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.eps || "—"}
                    </span>
                    <div style={{ fontSize: 11, color: "#6366f1", marginTop: 2 }}>{c.servicio}</div>
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
                  </td>
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
                  <td style={{ ...td, whiteSpace: "nowrap" }}>
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
          onGuardado={() => { setShowDevModal(false); cargar("devoluciones"); }}
        />
      )}
    </div>
  );
}

// ── estilos inline ─────────────────────────────────────────────────────────
const td: React.CSSProperties = { padding: "10px 12px", verticalAlign: "top" };
const inputStyle: React.CSSProperties = {
  padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 7,
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
