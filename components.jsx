/* ToolVault — Shared components, icons, helpers
   ============================================================ */

const { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } = React;

/* ============================================================
   ICONS — minimal stroke icons (16/18 px)
   ============================================================ */
const Icon = {
  Search: (p) => (
    <svg width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
    </svg>
  ),
  Plus: (p) => (
    <svg width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  Close: (p) => (
    <svg width={p.size || 18} height={p.size || 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M18 6 6 18M6 6l12 12"/>
    </svg>
  ),
  Edit: (p) => (
    <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/>
    </svg>
  ),
  Trash: (p) => (
    <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z"/>
    </svg>
  ),
  Eye: (p) => (
    <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  Download: (p) => (
    <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
    </svg>
  ),
  Upload: (p) => (
    <svg width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
    </svg>
  ),
  ChevronDown: (p) => (
    <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="m6 9 6 6 6-6"/>
    </svg>
  ),
  Filter: (p) => (
    <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M22 3H2l8 9.5V19l4 2v-8.5L22 3Z"/>
    </svg>
  ),
  Cert: (p) => (
    <svg width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>
    </svg>
  ),
  Alert: (p) => (
    <svg width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/>
    </svg>
  ),
  Check: (p) => (
    <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  ),
  Box: (p) => (
    <svg width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.27 6.96 8.73 5.05 8.73-5.05M12 22.08V12"/>
    </svg>
  ),
  Pin: (p) => (
    <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Calendar: (p) => (
    <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  ),
  Clock: (p) => (
    <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
    </svg>
  ),
  User: (p) => (
    <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  History: (p) => (
    <svg width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>
    </svg>
  ),
  Logout: (p) => (
    <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
    </svg>
  ),
  Sort: (p) => (
    <svg width={p.size || 12} height={p.size || 12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="m7 15 5 5 5-5M7 9l5-5 5 5"/>
    </svg>
  ),
  Dashboard: (p) => (
    <svg width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>
    </svg>
  ),
  Grid: (p) => (
    <svg width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  Rows: (p) => (
    <svg width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>
    </svg>
  ),
  Tool: (p) => (
    <svg width={p.size || 18} height={p.size || 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M14.7 6.3a4 4 0 0 1 5.7 5.7l-8.5 8.5-5.7 1.4 1.4-5.7 8.5-8.5a4 4 0 0 1 0-1.4Z"/>
    </svg>
  ),
  QR: (p) => (
    <svg width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/>
      <path d="M21 16h-3v3M18 21h3M14 3v3M14 8v1M14 14h1v1M8 14H3M8 18v3M3 14v5"/>
    </svg>
  ),
  QR: (p) => (
    <svg width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
      <path d="M14 14h3v3M20 14v.01M14 20h.01M17 17h.01M20 17v3M17 20h3"/>
    </svg>
  ),
  Print: (p) => (
    <svg width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
    </svg>
  ),
  ArrowRight: (p) => (
    <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M5 12h14M13 5l7 7-7 7"/>
    </svg>
  ),
};

/* ============================================================
   FORMATTERS
   ============================================================ */
function fmtDate(iso) {
  if (!iso) return "—";
  const d = iso.length === 10 ? new Date(iso + "T12:00:00") : new Date(iso);
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("es-CL", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function fmtAgo(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return "hace " + s + "s";
  if (s < 3600) return "hace " + Math.floor(s/60) + " min";
  if (s < 86400) return "hace " + Math.floor(s/3600) + " h";
  if (s < 86400*7) return "hace " + Math.floor(s/86400) + " d";
  return fmtDate(iso);
}
function initials(name) {
  if (!name) return "?";
  const parts = name.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || "") + (parts[parts.length - 1]?.[0] || "")).toUpperCase().slice(0, 2);
}

/* ============================================================
   COMMON COMPONENTS
   ============================================================ */
function Avatar({ name, size }) {
  return <div className={"avatar " + (size || "")}>{initials(name)}</div>;
}

function StatusPill({ status }) {
  const key = status.replace(/\s+/g, "");
  return (
    <span className={"status-pill status-" + key}>
      <span className="dot" style={{
        width: 6, height: 6, borderRadius: 999, background: "currentColor", opacity: 0.9,
      }}/>
      {status}
    </span>
  );
}

function CertBadge({ dueDate }) {
  const b = TV.certBadge(dueDate);
  return <span className={"badge " + b.tone}><span className="dot"/>{b.label}</span>;
}

function Modal({ open, onClose, title, subtitle, size, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const k = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-veil" onClick={onClose}>
      <div className={"modal " + (size || "")} onClick={(e) => e.stopPropagation()}>
        <div className="modal-h">
          <div>
            <div className="t">{title}</div>
            {subtitle && <div className="s">{subtitle}</div>}
          </div>
          <button className="modal-close" onClick={onClose}><Icon.Close/></button>
        </div>
        <div className="modal-b">{children}</div>
        {footer && <div className="modal-f">{footer}</div>}
      </div>
    </div>
  );
}

function Sheet({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    const k = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="sheet-veil" onClick={onClose}/>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>{children}</div>
    </>
  );
}

function ConfirmModal({ open, onClose, onConfirm, title, body, confirmLabel, danger }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title || "¿Estás seguro?"}
      footer={<>
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className={"btn " + (danger ? "primary" : "dark")} onClick={() => { onConfirm(); onClose(); }}>
          {confirmLabel || "Confirmar"}
        </button>
      </>}
    >
      <div style={{ color: "var(--ink-2)", fontSize: 14, lineHeight: 1.55 }}>{body}</div>
    </Modal>
  );
}

/* ============================================================
   TOAST SYSTEM
   ============================================================ */
const ToastCtx = createContext(null);
function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((msg, kind = "info") => {
    const id = Math.random().toString(36).slice(2);
    setItems((x) => [...x, { id, msg, kind }]);
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-stack">
        {items.map((t) => (
          <div className={"toast " + t.kind} key={t.id}>
            <span className="ico">
              {t.kind === "success" ? <Icon.Check size={11}/> : t.kind === "error" ? <Icon.Close size={11}/> : <Icon.Alert size={11}/>}
            </span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
const useToast = () => useContext(ToastCtx);

/* ============================================================
   FILE INPUT (image / pdf) — converts to base64 dataURL for demo
   ============================================================ */
function FileDrop({ accept, label, hint, value, onChange, kind }) {
  const inputRef = useRef(null);
  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onChange({ name: file.name, size: file.size, type: file.type, dataUrl: reader.result });
    };
    reader.readAsDataURL(file);
  };
  if (value) {
    return (
      <div className="file-drop has-file">
        <div className="file-pill">
          <div className="ico">
            {kind === "image" ? <Icon.Eye/> : <Icon.Cert/>}
          </div>
          <div className="grow">
            <div className="name">{value.name}</div>
            <div className="meta">{Math.round((value.size || 0)/1024)} KB · {value.type || "archivo"}</div>
          </div>
          <button className="btn sm ghost" onClick={() => onChange(null)}><Icon.Close size={12}/></button>
        </div>
      </div>
    );
  }
  return (
    <div className="file-drop" onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
    >
      <div className="ico"><Icon.Upload/></div>
      <div className="lbl">{label}</div>
      <div className="sub">{hint}</div>
      <input ref={inputRef} type="file" accept={accept} hidden onChange={(e) => handleFile(e.target.files[0])}/>
    </div>
  );
}

/* ============================================================
   SELECT (basic native styled)
   ============================================================ */
function Select({ value, onChange, options }) {
  return (
    <div style={{ position: "relative" }}>
      <select className="select" value={value} onChange={(e) => onChange(e.target.value)} style={{ paddingRight: 32, appearance: "none" }}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)", pointerEvents: "none" }}>
        <Icon.ChevronDown/>
      </span>
    </div>
  );
}

/* ============================================================
   PLACEHOLDER (for tool images — supports Firebase Storage URL)
   ============================================================ */
function ToolImage({ tool, kind }) {
  const src = tool.imgUrl || (tool.img && tool.img.dataUrl) || null;
  if (src) return <img src={src} alt={tool.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>;
  return <div className="ph">{kind === "hero" ? "imagen referencial · 16:9" : "imagen"}</div>;
}

/* ============================================================
   EVENT ICON + VERB (compartido por HistoryView y ToolDetail)
   ============================================================ */
function EventIcon({ type }) {
  if (type === "create") return <Icon.Plus  size={12}/>;
  if (type === "use")    return <Icon.User  size={11}/>;
  if (type === "return") return <Icon.Check size={11}/>;
  if (type === "cert")   return <Icon.Cert  size={11}/>;
  if (type === "edit")   return <Icon.Edit  size={10}/>;
  return <Icon.Clock size={11}/>;
}
function eventVerb(type) {
  return { create:"creó", use:"tomó", return:"devolvió",
           cert:"actualizó el certificado de", edit:"editó" }[type] || "modificó";
}

/* expose */
Object.assign(window, {
  Icon, Avatar, StatusPill, CertBadge, Modal, Sheet, ConfirmModal,
  ToastProvider, useToast, FileDrop, Select, ToolImage,
  EventIcon, eventVerb,
  fmtDate, fmtDateTime, fmtAgo, initials,
});
