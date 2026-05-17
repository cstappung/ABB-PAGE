/* ToolVault — App principal con roles
   ============================================================ */
const { useState: useSA, useEffect: useEA, useMemo: useMA,
        useRef: useRA, useCallback: useCA } = React;

const TABS = [
  { id: "cards",   label: "Vista general", icon: <Icon.Grid    size={14}/> },
  { id: "table",   label: "Tabla",         icon: <Icon.Rows    size={14}/> },
  { id: "certs",   label: "Certificados",  icon: <Icon.Cert    size={14}/> },
  { id: "history", label: "Historial",     icon: <Icon.History size={14}/> },
];

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#DA2128",
  "shape": "soft"
}/*EDITMODE-END*/;

const EMPTY_DB = {
  config: { logoUrl: null, orgName: "Inventario ELSE" },
  users: [], tools: [], certs: [], events: [],
};

function Root() {
  return <ToastProvider><App/></ToastProvider>;
}

function App() {
  // undefined = cargando, null = sin sesión, object = autenticado
  const [authState,   setAuthState]   = useSA(undefined);
  const [setupDone,   setSetupDone]   = useSA(undefined); // undefined = verificando
  const [db,          setDb]          = useSA(EMPTY_DB);
  const [tab,         setTab]         = useSA("cards");
  const [openToolId,  setOpenToolId]  = useSA(null);
  const [openAction,  setOpenAction]  = useSA(null);
  const [pendingTool, setPendingTool] = useSA(null);
  const [showAdd,     setShowAdd]     = useSA(false);
  const [editingTool, setEditingTool] = useSA(null);
  const [userMenu,    setUserMenu]    = useSA(false);
  const [showUsers,   setShowUsers]   = useSA(false);
  const [saving,      setSaving]      = useSA(false);
  const [t,           setTweak]       = useTweaks(TWEAK_DEFAULTS);
  const toast   = useToast();
  const fileRef = useRA(null);

  /* ── Deep-link ?tool= desde QR ── */
  useEA(() => {
    const p = new URLSearchParams(window.location.search);
    const tid = p.get("tool");
    if (tid) setPendingTool(tid);
  }, []);

  /* ── Verificar si setup ya fue hecho ── */
  useEA(() => {
    fbDB.collection("config").doc("adminSetup").get().then((doc) => {
      setSetupDone(doc.exists && doc.data()?.done === true);
    }).catch(() => setSetupDone(false));
  }, []);

  /* ── Firebase Auth observer ── */
  useEA(() => {
    const unsub = fbAuth.onAuthStateChanged(async (fbu) => {
      if (fbu) {
        const doc = await fbDB.collection("users").doc(fbu.uid).get();
        const profile = doc.exists
          ? { id: fbu.uid, ...doc.data() }
          : { id: fbu.uid, name: fbu.email, username: fbu.uid, role: "usuario" };
        setAuthState(profile);
      } else {
        setAuthState(null);
      }
    });
    return () => unsub();
  }, []);

  /* ── Abrir herramienta pendiente post-login ── */
  useEA(() => {
    if (authState && pendingTool && db.tools.length > 0) {
      setOpenToolId(pendingTool);
      setPendingTool(null);
    }
  }, [authState, pendingTool, db.tools]);

  /* ── Firestore real-time listeners ── */
  useEA(() => {
    if (!authState) return;
    const unsubs = [];
    unsubs.push(fbDB.collection("users").onSnapshot((s) =>
      setDb((p) => ({ ...p, users: s.docs.map((d) => ({ id: d.id, ...d.data() })) }))
    ));
    unsubs.push(fbDB.collection("tools").onSnapshot((s) => {
      const tools = s.docs.map((d) => ({ id: d.id, ...d.data() }));
      tools.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      setDb((p) => ({ ...p, tools }));
    }));
    unsubs.push(fbDB.collection("certs").onSnapshot((s) =>
      setDb((p) => ({ ...p, certs: s.docs.map((d) => ({ id: d.id, ...d.data() })) }))
    ));
    unsubs.push(
      fbDB.collection("events").orderBy("at", "desc").limit(300)
        .onSnapshot((s) =>
          setDb((p) => ({ ...p, events: s.docs.map((d) => ({ id: d.id, ...d.data() })) }))
        )
    );
    unsubs.push(
      fbDB.collection("config").doc("main").onSnapshot((s) => {
        if (s.exists) setDb((p) => ({ ...p, config: s.data() }));
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [authState]);

  /* ── Tweaks → CSS vars ── */
  useEA(() => {
    const r = document.documentElement.style;
    r.setProperty("--accent", t.accent);
    r.setProperty("--r-md", t.shape === "sharp" ? "4px" : t.shape === "round" ? "14px" : "10px");
    r.setProperty("--r-lg", t.shape === "sharp" ? "6px" : t.shape === "round" ? "20px" : "14px");
  }, [t]);

  const handleLogin  = (profile) => setAuthState(profile);
  const handleLogout = async () => {
    await fbAuth.signOut(); setAuthState(null);
    toast("Sesión cerrada", "info");
  };

  const openTool = (id, action) => { setOpenToolId(id); setOpenAction(action || null); };
  const tool = useMA(() => db.tools.find((x) => x.id === openToolId) || null, [db, openToolId]);

  const saveField = useCA(async (toolId, patch) => {
    await TV.fsUpdate("tools", toolId, { ...patch, updatedAt: TV.now(), updatedBy: authState.id });
  }, [authState]);

  const handleSaveTool = async (form) => {
    if (!authState) return;
    setSaving(true);
    try {
      const n = TV.now();
      if (editingTool) {
        const tl = editingTool;
        let imgUrl = tl.imgUrl || null;
        if (form.img?.dataUrl)
          imgUrl = await TV.uploadFile(`tools/${tl.id}/image`, form.img) || imgUrl;
        const patch = { name:form.name, location:form.location, status:form.status,
          observations:form.observations, certDue:form.certDue, imgUrl,
          updatedAt:n, updatedBy:authState.id };
        await TV.fsUpdate("tools", tl.id, patch);
        for (const f of ["name","location","status","observations","certDue"]) {
          if (form[f] !== tl[f])
            await TV.logEvent({ toolId:tl.id, type:"edit", userId:authState.id, at:n,
              detail:{ field:f, oldValue:tl[f], newValue:form[f] } });
        }
        if (form.certFile) {
          const certId  = TV.uid();
          const fileUrl = await TV.uploadFile(`tools/${tl.id}/certs/${certId}`, form.certFile);
          if (tl.currentCertId)
            await TV.fsUpdate("certs", tl.currentCertId, { status:"reemplazado" });
          await TV.fsSet("certs", certId, { toolId:tl.id, uploadedAt:n, uploadedBy:authState.id,
            issuedDate:new Date().toISOString().slice(0,10), dueDate:form.certDue,
            filename:form.certFile.name, fileUrl:null, status:"vigente" });
          await TV.fsUpdate("tools", tl.id, { currentCertId:certId });
          await TV.logEvent({ toolId:tl.id, type:"cert", userId:authState.id, at:n,
            detail:{ filename:form.certFile.name } });
        }
        toast("Cambios guardados", "success");
        setEditingTool(null); setShowAdd(false);
      } else {
        const toolId = TV.uid(), certId = TV.uid();
        const imgUrl  = form.img?.dataUrl
          ? await TV.uploadFile(`tools/${toolId}/image`, form.img) : null;
        const fileUrl = form.certFile?.dataUrl
          ? await TV.uploadFile(`tools/${toolId}/certs/${certId}`, form.certFile) : null;
        await TV.fsSet("certs", certId, { toolId, uploadedAt:n, uploadedBy:authState.id,
          issuedDate:new Date().toISOString().slice(0,10), dueDate:form.certDue,
          filename:form.certFile?.name || "certificado.pdf", fileUrl:fileUrl||null, status:"vigente" });
        await TV.fsSet("tools", toolId, { name:form.name, location:form.location,
          status:form.status, observations:form.observations,
          certDue:form.certDue, certIssued:new Date().toISOString().slice(0,10),
          imgUrl:imgUrl||null, currentUser:null, currentCertId:certId,
          createdBy:authState.id, createdAt:n, updatedAt:n, updatedBy:authState.id,
          useStarted:null });
        await TV.logEvent({ toolId, type:"create", userId:authState.id, at:n,
          detail:{ name:form.name, location:form.location } });
        toast("Herramienta creada", "success");
        setShowAdd(false); setOpenToolId(toolId);
      }
    } catch (e) { console.error(e); toast("Error: " + e.message, "error"); }
    finally { setSaving(false); }
  };

  const handleLogo = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const obj = { name:file.name, size:file.size, type:file.type, dataUrl:reader.result };
      const url = await TV.uploadFile("config/logo", obj);
      const logoUrl = url || reader.result;
      await TV.fsSet("config", "main", { logoUrl }, { merge:true });
      toast("Logo actualizado", "success");
    };
    reader.readAsDataURL(file);
  };

  /* ── Loading (verificando setup / auth) ── */
  if (setupDone === undefined || authState === undefined) {
    return (
      <div style={{ minHeight:"100vh", display:"grid", placeItems:"center", background:"var(--bg)" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ width:56, height:56, borderRadius:14, background:"var(--accent)",
            display:"grid", placeItems:"center", color:"#fff", fontSize:20, fontWeight:800,
            margin:"0 auto 16px" }}>TV</div>
          <div style={{ color:"var(--ink-3)" }}>Conectando…</div>
        </div>
      </div>
    );
  }

  /* ── First boot ── */
  if (setupDone === false) {
    return (
      <ToastProvider>
        <FirstSetup onDone={(profile) => { setSetupDone(true); setAuthState(profile); }}/>
      </ToastProvider>
    );
  }

  /* ── Auth ── */
  if (!authState) return <AuthScreen onLogin={handleLogin}/>;

  const alertCount = db.tools.filter((tl) => {
    const s = TV.certStatusFor(tl.certDue);
    return s === "vencido" || s === "por-vencer-30";
  }).length;

  const canCreate = TV.can(authState, "createTool");
  const canLogo   = TV.can(authState, "changeLogo");
  const canUsers  = TV.can(authState, "manageUsers");

  return (
    <div className="app">
      {/* ── TopBar ── */}
      <header className="topbar">
        <div className="left">
          {/* Logo / Brand */}
          <div className={"brand" + (canLogo ? "" : " no-click")}
            onClick={() => canLogo && fileRef.current?.click()}
            title={canLogo ? "Click para cambiar logo" : ""}>
            <div className={"mark" + (db.config.logoUrl ? " has-img" : "")}>
              {db.config.logoUrl
                ? <img src={db.config.logoUrl} alt="Logo"/>
                : <span style={{ color:"#fff", fontWeight:800, fontSize:13 }}>TV</span>}
              {canLogo && <div className="logo-slot-edit">Cambiar</div>}
            </div>
            <div className="name hide-sm">
              {db.config.orgName || "Inventario ELSE"}
            </div>
            {canLogo && (
              <input ref={fileRef} hidden type="file" accept="image/*"
                onChange={(e) => handleLogo(e.target.files[0])}/>
            )}
          </div>

          {/* Desktop tabs */}
          <nav className="tabs">
            {TABS.map((tb) => (
              <button key={tb.id} className={tab === tb.id ? "active" : ""}
                onClick={() => setTab(tb.id)}>
                {tb.icon}
                <span className="lbl">{tb.label}</span>
                {tb.id === "certs" && alertCount > 0 &&
                  <span className="badge">{alertCount}</span>}
              </button>
            ))}
          </nav>
        </div>

        <div className="right">
          {canCreate && (
            <button className="btn primary" onClick={() => { setEditingTool(null); setShowAdd(true); }}>
              <Icon.Plus size={14}/>
              <span className="hide-sm">Agregar</span>
            </button>
          )}

          {/* User menu */}
          <div style={{ position:"relative" }}>
            <button className="user-chip" onClick={() => setUserMenu((v) => !v)}>
              <Avatar name={authState.name}/>
              <span className="hide-sm">{authState.name?.split(" ")[0]}</span>
              <Icon.ChevronDown/>
            </button>
            {userMenu && (
              <>
                <div onClick={() => setUserMenu(false)}
                  style={{ position:"fixed", inset:0, zIndex:19 }}/>
                <div className="user-dropdown">
                  <div className="user-dropdown-head">
                    <div style={{ fontWeight:700, fontSize:13 }}>{authState.name}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:4 }}>
                      <span style={{ fontSize:11, color:"var(--ink-3)", fontFamily:"var(--mono)" }}>
                        @{authState.username}
                      </span>
                      <span className={"role-badge role-" + (authState.role || "usuario")}>
                        {TV.ROLES[authState.role || "usuario"]?.label}
                      </span>
                    </div>
                  </div>
                  {canUsers && (
                    <button className="dropdown-item" onClick={() => { setUserMenu(false); setShowUsers(true); }}>
                      <Icon.User size={13}/> Gestionar usuarios
                    </button>
                  )}
                  {canLogo && (
                    <button className="dropdown-item" onClick={() => { setUserMenu(false); fileRef.current?.click(); }}>
                      <Icon.Upload size={13}/> Cambiar logo
                    </button>
                  )}
                  <button className="dropdown-item danger" onClick={handleLogout}>
                    <Icon.Logout/> Cerrar sesión
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Vistas ── */}
      {tab === "cards"   && <CardsView   db={db} onOpenTool={openTool}/>}
      {tab === "table"   && <TableView   db={db} saveField={saveField} user={authState} onOpenTool={openTool}/>}
      {tab === "certs"   && <CertificatesView db={db} onOpenTool={openTool}/>}
      {tab === "history" && <HistoryView db={db} onOpenTool={openTool}/>}

      {/* ── Mobile bottom nav ── */}
      <nav className="mobile-tabs">
        {TABS.map((tb) => (
          <button key={tb.id} className={tab === tb.id ? "active" : ""}
            onClick={() => setTab(tb.id)}>
            {tb.icon}
            <span>{tb.label.split(" ")[0]}</span>
            {tb.id === "certs" && alertCount > 0 &&
              <span className="badge" style={{ position:"absolute", top:4, right:4 }}>{alertCount}</span>}
          </button>
        ))}
      </nav>

      {/* ── Tool detail sheet ── */}
      <ToolDetail
        tool={tool}
        db={db}
        user={authState}
        onClose={() => { setOpenToolId(null); setOpenAction(null); }}
        onEdit={() => { if (canCreate) { setEditingTool(tool); setShowAdd(true); } }}
        initialAction={openAction}
      />

      {/* ── Add / Edit modal (solo Administrador+) ── */}
      {canCreate && (
        <ToolFormModal
          open={showAdd}
          onClose={() => { setShowAdd(false); setEditingTool(null); }}
          onSave={handleSaveTool}
          initial={editingTool}
          user={authState}
          saving={saving}
        />
      )}

      {/* ── Users panel (solo AdminNativo) ── */}
      {canUsers && (
        <UsersPanel
          open={showUsers}
          onClose={() => setShowUsers(false)}
          users={db.users}
          currentUser={authState}
        />
      )}

      {/* ── Tweaks ── */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Identidad"/>
        <TweakColor label="Color de acento" value={t.accent}
          options={["#DA2128","#1F4F8B","#0F7A4D","#222222"]}
          onChange={(v) => setTweak("accent", v)}/>
        <TweakSection label="Forma"/>
        <TweakRadio label="Bordes" value={t.shape}
          options={["sharp","soft","round"]}
          onChange={(v) => setTweak("shape", v)}/>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root/>);
