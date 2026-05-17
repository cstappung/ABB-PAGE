/* ToolVault — Main app
   ============================================================ */
const { useState: useSA, useEffect: useEA, useMemo: useMA, useRef: useRA, useCallback: useCA } = React;

const TABS = [
  { id: "cards",   label: "Vista general",  icon: <Icon.Grid size={14}/> },
  { id: "table",   label: "Tabla",          icon: <Icon.Rows size={14}/> },
  { id: "certs",   label: "Certificados",   icon: <Icon.Cert size={14}/> },
  { id: "history", label: "Historial",      icon: <Icon.History size={14}/> },
];

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#DA2128",
  "density": "comfortable",
  "shape": "soft"
}/*EDITMODE-END*/;

function App() {
  const [db, setDb] = useSA(() => TV.loadDB());
  const [user, setUser] = useSA(() => {
    const sid = localStorage.getItem(TV.SESSION_KEY);
    const initial = TV.loadDB();
    return initial.users.find((u) => u.id === sid) || null;
  });
  const [tab, setTab] = useSA("cards");
  const [openToolId, setOpenToolId] = useSA(null);
  const [openToolAction, setOpenToolAction] = useSA(null);
  const [showAdd, setShowAdd] = useSA(false);
  const [editingTool, setEditingTool] = useSA(null);
  const [userMenu, setUserMenu] = useSA(false);
  const [logoUpload, setLogoUpload] = useSA(false);
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const toast = useToast();

  // Persist on db change
  useEA(() => { TV.saveDB(db); }, [db]);

  // Hash routing for QR deep links: #tool=t_xxx opens the detail sheet
  useEA(() => {
    const handleHash = () => {
      const m = window.location.hash.match(/tool=([\w]+)/);
      if (m && m[1]) setOpenToolId(m[1]);
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  // Update hash when tool opens/closes (for share / browser back)
  useEA(() => {
    if (openToolId) {
      const target = "#tool=" + openToolId;
      if (window.location.hash !== target) {
        window.history.replaceState(null, "", target);
      }
    } else if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, [openToolId]);

  // Auto-load assets/logo.png if present and no logo configured yet
  useEA(() => {
    if (db.config?.logoUrl) return;
    const img = new Image();
    img.onload = () => {
      const next = { ...db, config: { ...db.config, logoUrl: "assets/logo.png" } };
      setDb(next);
    };
    img.onerror = () => {/* no logo.png, that's fine */};
    img.src = "assets/logo.png?ts=" + Date.now();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply tweaks (accent + shape) to CSS variables
  useEA(() => {
    const r = document.documentElement.style;
    r.setProperty("--accent", t.accent);
    r.setProperty("--r-md", t.shape === "sharp" ? "4px" : t.shape === "round" ? "14px" : "10px");
    r.setProperty("--r-lg", t.shape === "sharp" ? "6px" : t.shape === "round" ? "20px" : "14px");
  }, [t]);

  const logEvent = useCA((nextDb, evt) => {
    const e = { id: "e_" + TV.uid(), ...evt };
    const merged = { ...nextDb, events: [e, ...nextDb.events] };
    setDb(merged);
  }, []);

  const handleLogin = (u) => setUser(u);
  const handleLogout = () => {
    localStorage.removeItem(TV.SESSION_KEY);
    setUser(null);
    toast("Sesión cerrada", "info");
  };

  const openTool = (id, action) => {
    setOpenToolId(id);
    setOpenToolAction(action || null);
  };

  const tool = useMA(() => db.tools.find((t) => t.id === openToolId) || null, [db, openToolId]);

  const handleSaveTool = (form) => {
    if (editingTool) {
      // edit
      const t = editingTool;
      const fields = ["name", "location", "status", "observations", "certDue"];
      const changes = [];
      fields.forEach((f) => {
        if (form[f] !== t[f]) changes.push({ field: f, oldValue: t[f], newValue: form[f] });
      });
      // image change
      if (form.img && (!t.img || form.img.dataUrl !== t.img?.dataUrl)) {
        changes.push({ field: "image", oldValue: t.img?.name || "—", newValue: form.img.name });
      }

      let next = {
        ...db,
        tools: db.tools.map((x) => x.id === t.id ? {
          ...x,
          name: form.name, location: form.location, status: form.status,
          observations: form.observations, certDue: form.certDue,
          img: form.img || x.img,
          updatedAt: TV.now(), updatedBy: user.id,
        } : x),
      };
      // log each change
      changes.forEach((c) => {
        const e = { id: "e_" + TV.uid(), toolId: t.id, type: "edit", userId: user.id, at: TV.now(), detail: c };
        next = { ...next, events: [e, ...next.events] };
      });
      // cert file replaced?
      if (form.certFile) {
        const oldCertId = t.currentCertId;
        const newCertId = "c_" + TV.uid();
        const newCerts = next.certs.map((c) => c.id === oldCertId ? { ...c, status: "reemplazado" } : c);
        newCerts.push({
          id: newCertId, toolId: t.id,
          uploadedAt: TV.now(), uploadedBy: user.id,
          issuedDate: new Date().toISOString().slice(0, 10),
          dueDate: form.certDue,
          filename: form.certFile.name,
          status: "vigente",
        });
        next = {
          ...next,
          certs: newCerts,
          tools: next.tools.map((x) => x.id === t.id ? { ...x, currentCertId: newCertId } : x),
        };
        const e = { id: "e_" + TV.uid(), toolId: t.id, type: "cert", userId: user.id, at: TV.now(), detail: { filename: form.certFile.name } };
        next = { ...next, events: [e, ...next.events] };
      }
      setDb(next);
      toast(changes.length > 0 ? `${changes.length} cambio${changes.length>1?"s":""} guardado${changes.length>1?"s":""}` : "Sin cambios", "success");
      setEditingTool(null);
    } else {
      // create
      const newCertId = "c_" + TV.uid();
      const t = {
        id: "t_" + TV.uid(),
        name: form.name,
        location: form.location,
        status: form.status,
        observations: form.observations,
        certDue: form.certDue,
        certIssued: new Date().toISOString().slice(0, 10),
        img: form.img,
        currentUser: null,
        currentCertId: newCertId,
        createdBy: user.id,
        createdAt: TV.now(),
        updatedAt: TV.now(),
        updatedBy: user.id,
      };
      const newCert = {
        id: newCertId, toolId: t.id,
        uploadedAt: TV.now(), uploadedBy: user.id,
        issuedDate: t.certIssued, dueDate: t.certDue,
        filename: form.certFile?.name || ("cert-" + form.name.toLowerCase().replace(/\s+/g, "-") + ".pdf"),
        status: "vigente",
      };
      const e = { id: "e_" + TV.uid(), toolId: t.id, type: "create", userId: user.id, at: TV.now(), detail: { name: t.name, location: t.location } };
      const next = {
        ...db,
        tools: [t, ...db.tools],
        certs: [newCert, ...db.certs],
        events: [e, ...db.events],
      };
      setDb(next);
      toast("Herramienta agregada", "success");
      setShowAdd(false);
      setOpenToolId(t.id);
    }
  };

  // Logo upload
  const fileInput = useRA(null);
  const handleLogo = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const next = { ...db, config: { ...db.config, logoUrl: reader.result } };
      setDb(next);
      toast("Logo actualizado", "success");
    };
    reader.readAsDataURL(file);
  };

  /* ---------- Auth screen ---------- */
  if (!user) {
    return <AuthScreen db={db} setDb={setDb} onLogin={handleLogin}/>;
  }

  const alertCount = db.tools.filter((t) => {
    const s = TV.certStatusFor(t.certDue);
    return s === "vencido" || s === "por-vencer-30";
  }).length;

  return (
    <div className="app">
      <header className="topbar">
        <div className="left">
          <div className="brand" onClick={() => fileInput.current?.click()} title="Click para personalizar el logo">
            <div className={"mark" + (db.config.logoUrl ? " has-img" : "")}>
              {db.config.logoUrl ? <img src={db.config.logoUrl}/> : "TV"}
              <div className="logo-slot-edit">Reemplazar</div>
            </div>
            <div className="name">
              ToolVault <span className="muted hide-sm">/ {db.config.orgName}</span>
            </div>
            <input ref={fileInput} hidden type="file" accept="image/*" onChange={(e) => handleLogo(e.target.files[0])}/>
          </div>

          <div className="tabs">
            {TABS.map((t) => (
              <button key={t.id} className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)}>
                {t.icon} <span className="lbl">{t.label}</span>
                {t.id === "certs" && alertCount > 0 && <span className="badge">{alertCount}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="right">
          <button className="btn primary" onClick={() => { setEditingTool(null); setShowAdd(true); }}>
            <Icon.Plus size={14}/> <span className="hide-sm">Agregar herramienta</span>
          </button>
          <div style={{ position: "relative" }}>
            <button className="user-chip" onClick={() => setUserMenu((v) => !v)}>
              <Avatar name={user.name}/>
              <span className="hide-sm">{user.name.split(" ")[0]}</span>
              <Icon.ChevronDown/>
            </button>
            {userMenu && (
              <>
                <div onClick={() => setUserMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 19 }}/>
                <div style={{
                  position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 20,
                  background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12,
                  boxShadow: "var(--shadow-md)", minWidth: 220, overflow: "hidden",
                }}>
                  <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--line)", background: "var(--surface-2)" }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{user.name}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--mono)" }}>@{user.username} · {user.role}</div>
                  </div>
                  <button className="btn ghost block" style={{ borderRadius: 0, justifyContent: "flex-start", padding: "10px 14px", border: 0 }} onClick={() => { setUserMenu(false); fileInput.current?.click(); }}>
                    <Icon.Upload size={13}/> Cambiar logo
                  </button>
                  <button className="btn ghost block" style={{ borderRadius: 0, justifyContent: "flex-start", padding: "10px 14px", border: 0 }} onClick={() => {
                    if (confirm("¿Restablecer datos de demostración? Se perderán las modificaciones locales.")) {
                      localStorage.removeItem(TV.STORAGE_KEY);
                      window.location.reload();
                    }
                  }}>
                    <Icon.History size={13}/> Restablecer demo
                  </button>
                  <button className="btn ghost block" style={{ borderRadius: 0, justifyContent: "flex-start", padding: "10px 14px", border: 0, color: "var(--danger)" }} onClick={handleLogout}>
                    <Icon.Logout/> Cerrar sesión
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {tab === "cards"   && <CardsView db={db} onOpenTool={openTool} onAdd={() => setShowAdd(true)}/>}
      {tab === "table"   && <TableView db={db} setDb={setDb} user={user} onOpenTool={openTool} logEvent={logEvent}/>}
      {tab === "certs"   && <CertificatesView db={db} onOpenTool={openTool}/>}
      {tab === "history" && <HistoryView db={db} onOpenTool={openTool}/>}

      {/* Mobile bottom tab bar */}
      <nav className="mobile-tabs">
        {TABS.map((tb) => (
          <button key={tb.id} className={tab === tb.id ? "active" : ""} onClick={() => setTab(tb.id)}>
            {tb.icon}
            <span>{tb.label.split(" ")[0]}</span>
            {tb.id === "certs" && alertCount > 0 && <span className="badge">{alertCount}</span>}
          </button>
        ))}
      </nav>

      <ToolDetail
        tool={tool}
        db={db}
        setDb={setDb}
        user={user}
        onClose={() => { setOpenToolId(null); setOpenToolAction(null); }}
        onEdit={() => { setEditingTool(tool); setShowAdd(true); }}
        logEvent={logEvent}
        initialAction={openToolAction}
      />

      <ToolFormModal
        open={showAdd}
        onClose={() => { setShowAdd(false); setEditingTool(null); }}
        onSave={handleSaveTool}
        initial={editingTool}
        user={user}
      />

      {/* Tweaks panel */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Identidad"/>
        <TweakColor
          label="Color de acento"
          value={t.accent}
          options={["#DA2128", "#1F4F8B", "#0F7A4D", "#222222"]}
          onChange={(v) => setTweak("accent", v)}
        />
        <TweakSection label="Forma"/>
        <TweakRadio
          label="Bordes"
          value={t.shape}
          options={["sharp", "soft", "round"]}
          onChange={(v) => setTweak("shape", v)}
        />
      </TweaksPanel>
    </div>
  );
}

/* ---------- Root ---------- */
function Root() {
  return (
    <ToastProvider>
      <App/>
    </ToastProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root/>);
