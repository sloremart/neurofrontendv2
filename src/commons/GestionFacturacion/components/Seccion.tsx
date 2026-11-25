import React, { useState } from "react";

/**
 * Sección desplegable con encabezado: título, resumen a la derecha (visible aun cerrada) y flecha.
 * Recuerda si estaba abierta o cerrada en este navegador (clave `id`).
 */
export default function Seccion({ id, titulo, resumen, acciones, abiertaPorDefecto = false, children }: {
  id: string;
  titulo: string;
  resumen?: React.ReactNode;
  acciones?: React.ReactNode;
  abiertaPorDefecto?: boolean;
  children: React.ReactNode;
}) {
  const clave = `gf-seccion-${id}`;
  const [abierta, setAbierta] = useState<boolean>(() => {
    try {
      const v = window.localStorage.getItem(clave);
      return v === null ? abiertaPorDefecto : v === "1";
    } catch {
      return abiertaPorDefecto;
    }
  });
  const alternar = () => {
    setAbierta(a => {
      try { window.localStorage.setItem(clave, a ? "0" : "1"); } catch { /* sin almacenamiento */ }
      return !a;
    });
  };

  return (
    <section style={{
      background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, marginBottom: 12,
      boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", flexWrap: "wrap" }}>
        <button
          onClick={alternar}
          aria-expanded={abierta}
          aria-controls={`${clave}-cuerpo`}
          style={{
            display: "flex", alignItems: "center", gap: 10, background: "none", border: "none",
            padding: 0, cursor: "pointer", textAlign: "left", flex: "1 1 auto", minWidth: 200,
          }}
        >
          <span aria-hidden style={{
            display: "inline-flex", width: 22, height: 22, alignItems: "center", justifyContent: "center",
            borderRadius: 6, background: "#f1f5f9", color: "#475569", fontSize: 12,
            transform: abierta ? "rotate(90deg)" : "none", transition: "transform 0.15s",
          }}>▶</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{titulo}</span>
          {resumen && <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{resumen}</span>}
        </button>
        {abierta && acciones}
      </div>
      {abierta && (
        <div id={`${clave}-cuerpo`} style={{ padding: "0 16px 16px", borderTop: "1px solid #f1f5f9" }}>
          <div style={{ paddingTop: 14 }}>{children}</div>
        </div>
      )}
    </section>
  );
}
