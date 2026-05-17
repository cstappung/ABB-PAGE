/* ToolVault — Gestión de usuarios (solo AdminNativo)
   ============================================================ */
const { useState: useStateU, useEffect: useEffectU, useMemo: useMemoU } = React;

/* ============================================================
   CREATE USER MODAL (AdminNativo crea cuentas)
   ============================================================ */
function CreateUserModal({ open, onClose, onCreated }) {
  const [name,     setName]     = useStateU("");
  const [username, setUsername] = useStateU("");
  const [pass,     setPass]     = useStateU("");
  const [role,     setRole]     = useStateU("usuario");
  const [err,      setErr]      = useStateU("");
  const [busy,     setBusy]     = useStateU(false);
  const toast = useToast();

  useEffectU(() => {
    if (open) { setName(""); setUsername(""); setPass(""); setRole("usuario"); setErr(""); }
  }, [open]);

  const submit = async (e) => {
    e?.preventDefault();
    setErr(""); setBusy(true);
    try {
      if (!name.trim())              { setErr("Ingresa el nombre."); setBusy(false); return; }
      if (username.trim().length < 3){ setErr("Usuario mínimo 3 caracteres."); setBusy(false); return; }
      if (pass.length < 6)           { setErr("Clave mínima 6 caracteres."); setBusy(false); return; }
      // Verificar unicidad
      const existing = await fbDB.collection("users")
        .where("username", "==", username.toLowerCase().trim()).limit(1).get();
      if (!existing.empty) { setErr("Ese nombre de usuario ya existe."); setBusy(false); return; }
      const email = usernameToEmail(username);
      const cred  = await fbAuth.createUserWithEmailAndPassword(email, pass);
      const profile = {
        name: name.trim(),
        username: username.toLowerCase().trim(),
        role,
        createdAt: TV.now(),
        disabled: false,
      };
      await TV.fsSet("users", cred.user.uid, profile);
      // Volver a loguear al admin (createUserWithEmailAndPassword cambia la sesión)
      toast("Usuario creado correctamente", "success");
      onCreated({ id: cred.user.uid, ...profile });
      onClose();
    } catch (e) {
      const msg = {
        "auth/email-already-in-use": "Ese usuario ya existe.",
        "auth/weak-password": "Clave demasiado débil.",
      }[e.code] || e.message;
      setErr(msg);
    } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose}
      title="Crear usuario"
      subtitle="El nuevo usuario podrá iniciar sesión de inmediato"
      footer={<>
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className="btn primary" disabled={busy} onClick={submit}>
          {busy ? "Creando…" : "Crear usuario"}
        </button>
      </>}>
      <div className="form-grid">
        <div className="field full">
          <label>Nombre completo <span className="req">*</span></label>
          <input className="input" autoFocus value={name} placeholder="ej: Juan García"
            onChange={(e) => setName(e.target.value)}/>
        </div>
        <div className="field">
          <label>Nombre de usuario <span className="req">*</span></label>
          <input className="input" value={username} placeholder="ej: jgarcia"
            onChange={(e) => setUsername(e.target.value)}/>
        </div>
        <div className="field">
          <label>Clave inicial <span className="req">*</span></label>
          <input className="input" type="password" value={pass} placeholder="Mínimo 6 caracteres"
            onChange={(e) => setPass(e.target.value)}/>
        </div>
        <div className="field full">
          <label>Rol</label>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {Object.entries(TV.ROLES).filter(([k]) => k !== "adminNativo").map(([k, v]) => (
              <label key={k} style={{
                flex:1, minWidth:140,
                display:"flex", gap:10, padding:"10px 12px",
                border:"1px solid " + (role===k ? "var(--accent)" : "var(--line)"),
                borderRadius:10, cursor:"pointer",
                background: role===k ? "var(--accent-soft-2)" : "transparent",
              }}>
                <input type="radio" checked={role===k} onChange={() => setRole(k)} style={{ marginTop:3 }}/>
                <div>
                  <div style={{ fontWeight:700 }}>{v.label}</div>
                  <div style={{ fontSize:11, color:"var(--ink-3)", marginTop:2 }}>
                    {k==="administrador"
                      ? "Logo, certificados, herramientas"
                      : "Marcar en uso · devolver · ver"}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
      {err && <div style={{ marginTop:12 }}><div className="err">⚠ {err}</div></div>}
      <div style={{
        marginTop:14, padding:"10px 12px",
        background:"var(--warn-soft)", border:"1px solid oklch(0.85 0.10 75)",
        borderRadius:10, fontSize:12, color:"oklch(0.40 0.12 75)", lineHeight:1.5,
      }}>
        Al crear, se inicia sesión con el nuevo usuario temporalmente. Vuelve a entrar con tu cuenta de <b>adminabb</b> si es necesario.
      </div>
    </Modal>
  );
}

/* ============================================================
   CHANGE ROLE MODAL
   ============================================================ */
function ChangeRoleModal({ open, onClose, targetUser }) {
  const [role, setRole] = useStateU(targetUser?.role || "usuario");
  const [busy, setBusy] = useStateU(false);
  const toast = useToast();

  useEffectU(() => { if (open) setRole(targetUser?.role || "usuario"); }, [open, targetUser]);

  const save = async () => {
    if (!targetUser) return;
    setBusy(true);
    try {
      await TV.fsUpdate("users", targetUser.id, { role });
      toast("Rol actualizado", "success");
      onClose();
    } catch (e) { toast("Error: " + e.message, "error"); }
    finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose}
      title="Cambiar rol"
      subtitle={targetUser?.name}
      footer={<>
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className="btn primary" disabled={busy} onClick={save}>
          {busy ? "Guardando…" : "Guardar cambio"}
        </button>
      </>}>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {Object.entries(TV.ROLES).map(([k, v]) => {
          const isAdminNativo = k === "adminNativo";
          return (
            <label key={k} style={{
              display:"flex", gap:12, padding:"12px 14px",
              border:"1px solid " + (role===k ? "var(--accent)" : "var(--line)"),
              borderRadius:10, cursor: isAdminNativo ? "not-allowed" : "pointer",
              background: role===k ? "var(--accent-soft-2)" : "transparent",
              opacity: isAdminNativo ? 0.5 : 1,
            }}>
              <input type="radio" disabled={isAdminNativo} checked={role===k}
                onChange={() => !isAdminNativo && setRole(k)} style={{ marginTop:4 }}/>
              <div>
                <div style={{ fontWeight:700, display:"flex", gap:8, alignItems:"center" }}>
                  {v.label}
                  {isAdminNativo && <span style={{ fontSize:10, background:"var(--danger-soft)", color:"var(--danger)", padding:"1px 7px", borderRadius:999, fontFamily:"var(--mono)" }}>Solo 1</span>}
                </div>
                <div style={{ fontSize:12, color:"var(--ink-3)", marginTop:3 }}>
                  {k==="adminNativo"   && "Gestión de usuarios + todo lo demás. Único."}
                  {k==="administrador" && "Logo · certificados · crear y editar herramientas"}
                  {k==="usuario"       && "Marcar en uso · devolver · ver historial y certificados"}
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </Modal>
  );
}

/* ============================================================
   USERS PANEL — slide-in sheet
   ============================================================ */
function UsersPanel({ open, onClose, users, currentUser }) {
  const [showCreate,  setShowCreate]  = useStateU(false);
  const [showRole,    setShowRole]    = useStateU(false);
  const [targetUser,  setTargetUser]  = useStateU(null);
  const [confirmDis,  setConfirmDis]  = useStateU(null);
  const [q,           setQ]           = useStateU("");
  const toast = useToast();

  const filtered = useMemoU(() => {
    const ql = q.toLowerCase();
    return users.filter((u) =>
      !ql || u.name.toLowerCase().includes(ql) || u.username.toLowerCase().includes(ql)
    );
  }, [users, q]);

  const toggleDisabled = async (u) => {
    try {
      await TV.fsUpdate("users", u.id, { disabled: !u.disabled });
      toast(u.disabled ? "Cuenta reactivada" : "Cuenta desactivada", "success");
    } catch (e) { toast("Error: " + e.message, "error"); }
    setConfirmDis(null);
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="sheet-h">
        <div>
          <div className="t">Gestión de usuarios</div>
          <div className="s" style={{ fontFamily:"var(--mono)", color:"var(--ink-3)", fontSize:11 }}>
            {users.length} usuario{users.length!==1?"s":""} registrado{users.length!==1?"s":""}
          </div>
        </div>
        <div className="row">
          <button className="btn primary sm" onClick={() => setShowCreate(true)}>
            <Icon.Plus size={13}/> Crear usuario
          </button>
          <button className="modal-close" onClick={onClose}><Icon.Close/></button>
        </div>
      </div>

      <div className="sheet-b">
        {/* Search */}
        <div style={{ padding:"14px 24px 0" }}>
          <div className="search">
            <Icon.Search/>
            <input placeholder="Buscar usuarios…" value={q}
              onChange={(e) => setQ(e.target.value)}/>
          </div>
        </div>

        {/* Role legend */}
        <div style={{ padding:"12px 24px", display:"flex", gap:8, flexWrap:"wrap" }}>
          {Object.entries(TV.ROLES).map(([k, v]) => (
            <span key={k} className={"role-badge role-" + k}>{v.label}</span>
          ))}
        </div>

        {/* User list */}
        {filtered.map((u) => {
          const isMe = u.id === currentUser?.id;
          const isAdminNativo = u.role === "adminNativo";
          return (
            <div key={u.id} style={{
              display:"grid", gridTemplateColumns:"40px 1fr auto",
              gap:12, alignItems:"center",
              padding:"12px 24px",
              borderBottom:"1px solid var(--line)",
              opacity: u.disabled ? 0.5 : 1,
            }}>
              <Avatar name={u.name} size="lg"/>
              <div>
                <div style={{ fontWeight:700, fontSize:14, display:"flex", gap:8, alignItems:"center" }}>
                  {u.name}
                  {isMe && <span style={{ fontSize:10, background:"var(--info-soft)", color:"var(--info)", padding:"1px 7px", borderRadius:999, fontFamily:"var(--mono)" }}>Tú</span>}
                  {u.disabled && <span style={{ fontSize:10, background:"var(--muted-soft)", color:"var(--ink-3)", padding:"1px 7px", borderRadius:999 }}>Desactivado</span>}
                </div>
                <div style={{ fontSize:12, color:"var(--ink-3)", display:"flex", gap:8, alignItems:"center", marginTop:2 }}>
                  <span style={{ fontFamily:"var(--mono)" }}>@{u.username}</span>
                  <span style={{ width:3, height:3, borderRadius:999, background:"var(--ink-4)" }}/>
                  <span className={"role-badge role-" + (u.role || "usuario")} style={{ padding:"1px 8px" }}>
                    {TV.ROLES[u.role || "usuario"]?.label}
                  </span>
                </div>
              </div>
              {!isMe && !isAdminNativo && (
                <div style={{ display:"flex", gap:6 }}>
                  <button className="btn sm ghost" title="Cambiar rol"
                    onClick={() => { setTargetUser(u); setShowRole(true); }}>
                    <Icon.Edit size={13}/>
                  </button>
                  <button className={"btn sm " + (u.disabled ? "ghost" : "danger")} title={u.disabled ? "Reactivar" : "Desactivar"}
                    onClick={() => setConfirmDis(u)}>
                    {u.disabled ? <Icon.Check size={13}/> : <Icon.Trash size={13}/>}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="empty">
            <div className="ico"><Icon.User/></div>
            <div className="t">Sin resultados</div>
          </div>
        )}
      </div>

      {/* Modales hijos */}
      <CreateUserModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {}}
      />
      <ChangeRoleModal
        open={showRole}
        onClose={() => { setShowRole(false); setTargetUser(null); }}
        targetUser={targetUser}
      />
      <ConfirmModal
        open={!!confirmDis}
        onClose={() => setConfirmDis(null)}
        onConfirm={() => toggleDisabled(confirmDis)}
        title={confirmDis?.disabled ? "Reactivar cuenta" : "Desactivar cuenta"}
        body={<>¿{confirmDis?.disabled ? "Reactivar" : "Desactivar"} la cuenta de <b>{confirmDis?.name}</b>? {!confirmDis?.disabled && "No podrá iniciar sesión."}</>}
        confirmLabel={confirmDis?.disabled ? "Reactivar" : "Desactivar"}
        danger={!confirmDis?.disabled}
      />
    </Sheet>
  );
}

Object.assign(window, { UsersPanel, CreateUserModal, ChangeRoleModal });
