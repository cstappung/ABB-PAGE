/* ToolVault — Utilidades puras (sin localStorage)
   Todo el estado real vive en Firebase.
   ============================================================ */

/* ---------- Identifiers + time ---------- */
const uid  = () => Math.random().toString(36).slice(2, 10);
const now  = () => new Date().toISOString();

/* ---------- Cert helpers ---------- */
function daysUntil(dateStr) {
  if (!dateStr) return Infinity;
  const d = new Date(dateStr.length === 10 ? dateStr + "T23:59:59" : dateStr);
  return Math.ceil((d - Date.now()) / 86400000);
}
function certStatusFor(dueDate) {
  const d = daysUntil(dueDate);
  if (d < 0)   return "vencido";
  if (d <= 30) return "por-vencer-30";
  if (d <= 60) return "por-vencer-60";
  return "vigente";
}
function certBadge(dueDate) {
  const s = certStatusFor(dueDate);
  if (s === "vencido")        return { label: "Vencido",          tone: "danger" };
  if (s === "por-vencer-30")  return { label: "Vence ≤ 30 días",  tone: "danger" };
  if (s === "por-vencer-60")  return { label: "Vence ≤ 60 días",  tone: "warn"   };
  return                              { label: "Vigente",          tone: "ok"     };
}
function certDot(dueDate) {
  const s = certStatusFor(dueDate);
  if (s === "vencido" || s === "por-vencer-30") return "danger";
  if (s === "por-vencer-60")                    return "warn";
  return "ok";
}

/* ---------- Firebase Storage upload ---------- */
async function uploadFile(storagePath, fileObj) {
  if (!fileObj || !fileObj.dataUrl) return null;
  try {
    const ref = fbStorage.ref(storagePath);
    // Base64 → Blob
    const [meta, b64] = fileObj.dataUrl.split(",");
    const mime = meta.match(/:(.*?);/)[1];
    const bstr = atob(b64);
    const arr  = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) arr[i] = bstr.charCodeAt(i);
    const blob = new Blob([arr], { type: mime });
    const snap = await ref.put(blob);
    return await snap.ref.getDownloadURL();
  } catch (e) {
    console.error("[ToolVault] uploadFile error:", e);
    return null;
  }
}

/* ---------- Firestore shortcuts ---------- */
async function fsAdd(collection, data) {
  return fbDB.collection(collection).add(data);
}
async function fsSet(collection, id, data, opts) {
  return fbDB.collection(collection).doc(id).set(data, opts || {});
}
async function fsUpdate(collection, id, patch) {
  return fbDB.collection(collection).doc(id).update(patch);
}
async function fsDelete(collection, id) {
  return fbDB.collection(collection).doc(id).delete();
}

/* ---------- Log event ---------- */
async function logEvent(evt) {
  try {
    await fsAdd("events", { ...evt, at: evt.at || now() });
  } catch (e) {
    console.error("[ToolVault] logEvent error:", e);
  }
}

/* ---------- Roles ---------- */
const ROLES = {
  adminNativo:   { label: "Admin Nativo",   level: 3 },
  administrador: { label: "Administrador",  level: 2 },
  usuario:       { label: "Usuario General", level: 1 },
};

/**
 * can(user, action)
 * Acciones disponibles:
 *  "manageUsers"   → solo adminNativo
 *  "assignRoles"   → solo adminNativo
 *  "deleteTool"    → solo adminNativo
 *  "createTool"    → adminNativo + administrador
 *  "editTool"      → adminNativo + administrador
 *  "uploadCert"    → adminNativo + administrador
 *  "changeLogo"    → adminNativo + administrador
 *  "useTool"       → todos
 *  "viewHistory"   → todos
 */
function can(user, action) {
  if (!user) return false;
  const role = user.role || "usuario";
  const level = (ROLES[role] || ROLES.usuario).level;
  switch (action) {
    case "manageUsers":
    case "assignRoles":
    case "deleteTool":
      return level >= 3;
    case "createTool":
    case "editTool":
    case "uploadCert":
    case "changeLogo":
      return level >= 2;
    case "useTool":
    case "viewHistory":
    default:
      return true;
  }
}

const ADMIN_USERNAME = "adminabb";

/* ---------- Expose ---------- */
window.TV = {
  uid, now,
  daysUntil, certStatusFor, certBadge, certDot,
  uploadFile,
  fsAdd, fsSet, fsUpdate, fsDelete,
  logEvent,
  ROLES, can, ADMIN_USERNAME,
};
