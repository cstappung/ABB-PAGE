/* ToolVault — QR code generation + print sheet
   Uses qrcode-svg from CDN (loaded in index.html)
   ============================================================ */
const { useState: useSQ, useEffect: useEQ, useRef: useRQ, useMemo: useMQ } = React;

/* Make a tool URL using current origin + hash routing so it works on GH Pages */
function toolUrl(toolId) {
  const u = new URL(window.location.href);
  u.hash = "tool=" + toolId;
  return u.toString();
}

/* Render QR as SVG using the global QRCode lib (qrcode-generator) */
function qrSvg(text, size) {
  size = size || 240;
  try {
    // Library: qrcode-generator (loaded as window.qrcode)
    const qr = window.qrcode(0, "M");
    qr.addData(text);
    qr.make();
    const count = qr.getModuleCount();
    const cell = size / count;
    let rects = "";
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (qr.isDark(r, c)) {
          rects += `<rect x="${(c * cell).toFixed(2)}" y="${(r * cell).toFixed(2)}" width="${cell.toFixed(2)}" height="${cell.toFixed(2)}"/>`;
        }
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#ffffff"/><g fill="#000000">${rects}</g></svg>`;
  } catch (e) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="#eee"/><text x="50%" y="50%" font-family="monospace" font-size="10" text-anchor="middle" fill="#666">QR no disponible</text></svg>`;
  }
}

function QR({ text, size }) {
  const html = useMQ(() => qrSvg(text, size || 200), [text, size]);
  return <span dangerouslySetInnerHTML={{ __html: html }} style={{ display: "inline-block", lineHeight: 0 }}/>;
}

/* ============================================================
   Single-tool QR modal
   ============================================================ */
function QRToolModal({ open, onClose, tool, orgName }) {
  if (!tool) return null;
  const url = toolUrl(tool.id);
  const print = () => {
    const w = window.open("", "_blank", "width=520,height=720");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>QR — ${escapeHtml(tool.name)}</title>
      <style>
        body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;color:#111;}
        .label{padding:24px;display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;page-break-after:always;border:1px dashed #ccc;border-radius:14px;margin:24px;max-width:360px;margin-left:auto;margin-right:auto;}
        .org{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#888;}
        .nm{font-size:18px;font-weight:700;letter-spacing:-0.01em;text-wrap:pretty;margin:4px 0 0;}
        .loc{font-size:12px;color:#666;font-family:ui-monospace,monospace;}
        .qr{margin:10px 0;}
        .id{font-size:10px;font-family:ui-monospace,monospace;color:#999;}
        @page{size:A6;margin:6mm}
      </style></head><body><div class="label">
      <div class="org">${escapeHtml(orgName || "ToolVault")}</div>
      <div class="nm">${escapeHtml(tool.name)}</div>
      <div class="loc">${escapeHtml(tool.location || "")}</div>
      <div class="qr">${qrSvg(url, 220)}</div>
      <div class="id">${escapeHtml(tool.id)}</div>
      </div><script>window.onload=()=>setTimeout(()=>window.print(),300)</script></body></html>`);
    w.document.close();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Código QR"
      subtitle={tool.name}
      footer={<>
        <button className="btn ghost" onClick={onClose}>Cerrar</button>
        <button className="btn" onClick={() => navigator.clipboard?.writeText(url).then(() => {})}>
          Copiar enlace
        </button>
        <button className="btn primary" onClick={print}>
          <Icon.Download size={13}/> Imprimir etiqueta
        </button>
      </>}
    >
      <div style={{ textAlign: "center", padding: "10px 0 16px" }}>
        <div style={{ display: "inline-block", padding: 16, background: "#fff", border: "1px solid var(--line)", borderRadius: 12 }}>
          <QR text={url} size={220}/>
        </div>
        <div style={{ marginTop: 14, fontSize: 13, color: "var(--ink-2)", maxWidth: 360, margin: "14px auto 0" }}>
          Imprime esta etiqueta y pégala en la herramienta. Al escanear, abre directamente el detalle para tomar, devolver o ver el certificado.
        </div>
        <div style={{ marginTop: 12, padding: 8, background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 8, fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)", wordBreak: "break-all", maxWidth: 380, margin: "12px auto 0" }}>
          {url}
        </div>
      </div>
    </Modal>
  );
}

/* ============================================================
   Print all QRs sheet (grid)
   ============================================================ */
function printQRSheet(tools, orgName) {
  const w = window.open("", "_blank", "width=900,height=1100");
  if (!w) return;
  const cells = tools.map((t) => `
    <div class="cell">
      <div class="org">${escapeHtml(orgName || "ToolVault")}</div>
      <div class="nm">${escapeHtml(t.name)}</div>
      <div class="loc">${escapeHtml(t.location || "")}</div>
      <div class="qr">${qrSvg(toolUrl(t.id), 150)}</div>
    </div>
  `).join("");
  w.document.write(`<!doctype html><html><head><title>QRs · ${tools.length} herramientas</title>
    <style>
      body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;color:#111;}
      .sheet{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:14px;}
      .cell{border:1px dashed #bbb;border-radius:10px;padding:12px 8px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:4px;break-inside:avoid;}
      .org{font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:#888;}
      .nm{font-size:13px;font-weight:700;letter-spacing:-0.01em;line-height:1.2;text-wrap:pretty;}
      .loc{font-size:10px;color:#666;font-family:ui-monospace,monospace;}
      .qr{margin:4px 0 2px}
      @page{size:Letter;margin:8mm}
      @media print { .sheet{padding:0} }
    </style></head><body>
    <div class="sheet">${cells}</div>
    <script>window.onload=()=>setTimeout(()=>window.print(),400)</script>
    </body></html>`);
  w.document.close();
}

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
}

Object.assign(window, { QR, QRToolModal, printQRSheet, toolUrl, qrSvg });
