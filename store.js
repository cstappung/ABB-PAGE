/* ToolVault — Mock data store (simulates Firebase with localStorage)
   ============================================================ */

const STORAGE_KEY = "toolvault.v1";
const SESSION_KEY = "toolvault.session";

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();

/* ---------- Seed data ---------- */
const seed = () => {
  const u1 = "u_admin";
  const u2 = "u_carla";
  const u3 = "u_diego";
  const u4 = "u_marta";

  const users = [
    { id: u1, name: "Tomás Riquelme", username: "tomas", pass: hash("admin123"), role: "Coordinador", created: now() },
    { id: u2, name: "Carla Pizarro", username: "carla", pass: hash("carla123"), role: "Técnica", created: now() },
    { id: u3, name: "Diego Aguilera", username: "diego", pass: hash("diego123"), role: "Técnico", created: now() },
    { id: u4, name: "Marta Sandoval", username: "marta", pass: hash("marta123"), role: "Almacén", created: now() },
  ];

  const days = (n) => {
    const d = new Date(); d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };

  const baseTools = [
    {
      name: "Megóhmetro Digital 10kV",
      location: "Estante A-04 · Bahía 2",
      status: "Disponible",
      observations: "Última calibración correcta. Maletín completo con puntas.",
      certDue: days(48),
      certIssued: days(-317),
      img: null,
      currentUser: null,
    },
    {
      name: "Llave Dinamométrica 1\"",
      location: "Estante B-12 · Cajón 3",
      status: "En uso",
      observations: "Rango 200–1000 Nm. Calibrada por Lab Externo.",
      certDue: days(12),
      certIssued: days(-353),
      img: null,
      currentUser: u3,
      useStarted: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(),
    },
    {
      name: "Pinza Amperimétrica TRMS",
      location: "Estante A-02 · Cajón 1",
      status: "Disponible",
      observations: "",
      certDue: days(-9),
      certIssued: days(-374),
      img: null,
      currentUser: null,
    },
    {
      name: "Cámara Termográfica",
      location: "Caja Fuerte · Slot 1",
      status: "En uso",
      observations: "Maletín rígido. Cargador + batería extra.",
      certDue: days(120),
      certIssued: days(-245),
      img: null,
      currentUser: u2,
      useStarted: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    },
    {
      name: "Analizador de Redes Trifásico",
      location: "Estante C-01",
      status: "En mantenimiento",
      observations: "Pantalla con falla intermitente. Enviado a servicio técnico.",
      certDue: days(-2),
      certIssued: days(-367),
      img: null,
      currentUser: null,
    },
    {
      name: "Detector de Tensión 1000V",
      location: "Estante A-01 · Cajón 2",
      status: "Disponible",
      observations: "Probado al inicio de turno.",
      certDue: days(220),
      certIssued: days(-145),
      img: null,
      currentUser: null,
    },
    {
      name: "Telurómetro Digital",
      location: "Estante B-04",
      status: "Disponible",
      observations: "Set completo de jabalinas y cables.",
      certDue: days(28),
      certIssued: days(-337),
      img: null,
      currentUser: null,
    },
    {
      name: "Multímetro Industrial CAT IV",
      location: "Estante A-03 · Cajón 5",
      status: "Fuera de servicio",
      observations: "Caída desde altura. Pantalla rota.",
      certDue: days(-45),
      certIssued: days(-410),
      img: null,
      currentUser: null,
    },
    {
      name: "Comprobador de Aislamiento BT",
      location: "Estante B-07",
      status: "Disponible",
      observations: "",
      certDue: days(75),
      certIssued: days(-290),
      img: null,
      currentUser: null,
    },
    {
      name: "Kit Arnés de Seguridad Doble",
      location: "Locker EPP · Pos. 4",
      status: "En uso",
      observations: "Arnés + 2 cabos de vida. Revisión visual al recibir.",
      certDue: days(55),
      certIssued: days(-310),
      img: null,
      currentUser: u4,
      useStarted: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    },
    {
      name: "Torquímetro Hidráulico",
      location: "Estante D-02",
      status: "Disponible",
      observations: "Manguera y bomba en buen estado.",
      certDue: days(200),
      certIssued: days(-165),
      img: null,
      currentUser: null,
    },
    {
      name: "Verificador de Pares Apriete",
      location: "Estante B-03",
      status: "Disponible",
      observations: "",
      certDue: days(8),
      certIssued: days(-357),
      img: null,
      currentUser: null,
    },
  ];

  const tools = baseTools.map((t) => {
    const id = "t_" + uid();
    const created = new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 180).toISOString();
    return {
      id,
      ...t,
      createdBy: u1,
      createdAt: created,
      updatedAt: created,
      updatedBy: u1,
      currentCertId: "c_" + uid(),
    };
  });

  // Build cert history (current + 1-2 previous each)
  const certs = [];
  tools.forEach((t) => {
    // current
    certs.push({
      id: t.currentCertId,
      toolId: t.id,
      uploadedAt: t.createdAt,
      uploadedBy: t.createdBy,
      dueDate: t.certDue,
      issuedDate: t.certIssued,
      filename: `cert-${t.name.toLowerCase().replace(/\s+/g, "-").slice(0, 24)}.pdf`,
      status: "vigente", // recomputed live
    });
    // one previous
    if (Math.random() > 0.3) {
      const prevIssued = new Date(new Date(t.certIssued).getTime() - 1000 * 60 * 60 * 24 * 365).toISOString().slice(0, 10);
      const prevDue    = new Date(new Date(t.certDue).getTime()    - 1000 * 60 * 60 * 24 * 365).toISOString().slice(0, 10);
      certs.push({
        id: "c_" + uid(),
        toolId: t.id,
        uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 400).toISOString(),
        uploadedBy: [u1, u2, u4][Math.floor(Math.random() * 3)],
        dueDate: prevDue,
        issuedDate: prevIssued,
        filename: `cert-${t.name.toLowerCase().replace(/\s+/g, "-").slice(0, 24)}-2024.pdf`,
        status: "reemplazado",
      });
    }
  });

  // Build event log
  const events = [];
  const pushEvt = (e) => events.push({ id: "e_" + uid(), ...e });

  tools.forEach((t) => {
    pushEvt({
      toolId: t.id,
      type: "create",
      userId: t.createdBy,
      at: t.createdAt,
      detail: { name: t.name, location: t.location },
    });

    // random edits
    const editsCount = Math.floor(Math.random() * 3);
    for (let i = 0; i < editsCount; i++) {
      const fields = ["location", "observations", "status"];
      const f = fields[Math.floor(Math.random() * fields.length)];
      pushEvt({
        toolId: t.id,
        type: "edit",
        userId: [u1, u2, u3, u4][Math.floor(Math.random() * 4)],
        at: new Date(new Date(t.createdAt).getTime() + (i + 1) * 1000 * 60 * 60 * 24 * (3 + Math.random() * 20)).toISOString(),
        detail: {
          field: f,
          oldValue: f === "location" ? "Estante temporal" : f === "status" ? "Disponible" : "",
          newValue: f === "location" ? t.location : f === "status" ? t.status : "Notas iniciales",
        },
      });
    }

    // current-use event
    if (t.status === "En uso" && t.currentUser) {
      pushEvt({
        toolId: t.id,
        type: "use",
        userId: t.currentUser,
        at: t.useStarted,
        detail: { from: "Disponible", to: "En uso" },
      });
    }
  });

  // sort newest first
  events.sort((a, b) => b.at.localeCompare(a.at));

  return {
    config: {
      logoUrl: null,
      orgName: "Inventario Almacén Central",
      orgSub: "ToolVault",
    },
    users,
    tools,
    certs,
    events,
  };
};

/* Tiny non-secure hash for demo (NOT for production) */
function hash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i);
  return "h" + (h >>> 0).toString(36);
}

/* ---------- Store ---------- */
function loadDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fresh = seed();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }
    return JSON.parse(raw);
  } catch (e) {
    const fresh = seed();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    return fresh;
  }
}

function saveDB(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

/* ---------- Cert status helpers ---------- */
function daysUntil(dateStr) {
  if (!dateStr) return Infinity;
  const target = new Date(dateStr + (dateStr.length === 10 ? "T23:59:59" : ""));
  const ms = target - new Date();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}
function certStatusFor(dueDate) {
  const d = daysUntil(dueDate);
  if (d < 0) return "vencido";
  if (d <= 30) return "por-vencer-30";
  if (d <= 60) return "por-vencer-60";
  return "vigente";
}
function certBadge(dueDate) {
  const s = certStatusFor(dueDate);
  if (s === "vencido") return { label: "Vencido", tone: "danger" };
  if (s === "por-vencer-30") return { label: "Vence ≤ 30 días", tone: "danger" };
  if (s === "por-vencer-60") return { label: "Vence ≤ 60 días", tone: "warn" };
  return { label: "Vigente", tone: "ok" };
}
function certDot(dueDate) {
  const s = certStatusFor(dueDate);
  if (s === "vencido" || s === "por-vencer-30") return "danger";
  if (s === "por-vencer-60") return "warn";
  return "ok";
}

/* ---------- Public API ---------- */
const TV = {
  STORAGE_KEY,
  SESSION_KEY,
  hash, uid, now,
  loadDB, saveDB,
  daysUntil, certStatusFor, certBadge, certDot,
  seed,
};

window.TV = TV;
