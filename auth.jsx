/* ToolVault — Auth + First-boot setup
   ============================================================
   Flujo:
   1. App arranca → revisa config/adminSetup en Firestore
   2. Si no existe → muestra FirstSetup (crea AdminNativo una sola vez)
   3. Después → pantalla de login normal (solo AdminNativo puede crear más usuarios)
   ============================================================ */
const { useState: useStateAuth, useEffect: useEffectAuth } = React;

/* ============================================================
   FIRST SETUP — se muestra solo la primera vez
   ============================================================ */
function FirstSetup({ onDone }) {
  const [pass,  setPass]  = useStateAuth("");
  const [pass2, setPass2] = useStateAuth("");
  const [err,   setErr]   = useStateAuth("");
  const [busy,  setBusy]  = useStateAuth(false);
  const toast = useToast();

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (pass.length < 8)    { setErr("La clave debe tener mínimo 8 caracteres."); return; }
    if (pass !== pass2)     { setErr("Las claves no coinciden."); return; }
    setBusy(true);
    try {
      const email = usernameToEmail(TV.ADMIN_USERNAME);
      const cred  = await fbAuth.createUserWithEmailAndPassword(email, pass);
      const profile = {
        name: "Admin Nativo",
        username: TV.ADMIN_USERNAME,
        role: "adminNativo",
        createdAt: TV.now(),
      };
      await TV.fsSet("users", cred.user.uid, profile);
      await TV.fsSet("config", "adminSetup", { done: true, at: TV.now() });
      toast("Sistema configurado. Bienvenido.", "success");
      onDone({ id: cred.user.uid, ...profile });
    } catch (e) {
      setErr(e.message || "Error al crear el administrador.");
    } finally { setBusy(false); }
  };

  return (
    <div className="auth-shell" style={{ gridTemplateColumns: "1fr" }}>
      <div className="auth-form-wrap">
        <form className="auth-form" style={{ maxWidth: 420 }} onSubmit={submit}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, background: "var(--accent)",
            display: "grid", placeItems: "center", color: "#fff",
            fontWeight: 800, fontSize: 20, marginBottom: 22,
          }}>TV</div>
          <h2>Configuración inicial</h2>
          <p className="sub">
            Esta es la primera vez que se abre ToolVault.<br/>
            Crea la clave para el <b>Admin Nativo</b> — el usuario maestro del sistema.<br/>
            El nombre de usuario será: <code style={{ fontFamily:"var(--mono)", background:"var(--surface-2)", padding:"1px 6px", borderRadius:4 }}>adminabb</code>
          </p>
          <div style={{
            padding: "12px 14px", background: "var(--warn-soft)",
            border: "1px solid oklch(0.85 0.10 75)", borderRadius: 10,
            fontSize: 13, color: "oklch(0.40 0.12 75)", marginBottom: 18, lineHeight: 1.5,
          }}>
            <b>Guarda esta clave</b> en un lugar seguro. El Admin Nativo es el único que puede gestionar usuarios y asignar roles.
          </div>
          <div className="field">
            <label>Clave del Admin Nativo <span className="req">*</span></label>
            <input className="input" type="password" autoFocus placeholder="Mínimo 8 caracteres"
              value={pass} onChange={(e) => setPass(e.target.value)}/>
          </div>
          <div className="field">
            <label>Confirmar clave <span className="req">*</span></label>
            <input className="input" type="password" placeholder="Repite la clave"
              value={pass2} onChange={(e) => setPass2(e.target.value)}/>
          </div>
          {err && <div className="field"><div className="err">⚠ {err}</div></div>}
          <button className="btn primary block lg" type="submit" disabled={busy} style={{ marginTop: 8 }}>
            {busy ? "Configurando…" : "Crear Admin Nativo y continuar"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ============================================================
   LOGIN SCREEN
   ============================================================ */
function AuthScreen({ onLogin }) {
  const [username, setUsername] = useStateAuth("");
  const [pass,     setPass]     = useStateAuth("");
  const [err,      setErr]      = useStateAuth("");
  const [busy,     setBusy]     = useStateAuth(false);
  const toast = useToast();

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const snap = await fbDB.collection("users")
        .where("username", "==", username.toLowerCase().trim())
        .limit(1).get();
      if (snap.empty) { setErr("Usuario no encontrado."); setBusy(false); return; }
      const profileDoc = snap.docs[0];
      const profile = profileDoc.data();
      // Verificar que no esté desactivado
      if (profile.disabled) { setErr("Esta cuenta ha sido desactivada. Contacta al administrador."); setBusy(false); return; }
      const email = usernameToEmail(username);
      const cred  = await fbAuth.signInWithEmailAndPassword(email, pass);
      const full  = { id: cred.user.uid, ...profile };
      toast("Bienvenido, " + full.name.split(" ")[0], "success");
      onLogin(full);
    } catch (e) {
      const msg = {
        "auth/wrong-password":         "Clave incorrecta.",
        "auth/user-not-found":         "Usuario no encontrado.",
        "auth/too-many-requests":      "Demasiados intentos. Espera un momento.",
        "auth/network-request-failed": "Sin conexión. Revisa tu red.",
      }[e.code] || (e.message || "Error desconocido.");
      setErr(msg);
    } finally { setBusy(false); }
  };

  return (
    <div className="auth-shell">
      {/* Panel izquierdo */}
      <div className="auth-art">
        <div className="grid-bg"/>
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{
            width:56, height:56, borderRadius:14, background:"var(--accent)",
            display:"grid", placeItems:"center", color:"#fff", fontWeight:800, fontSize:22,
          }}>TV</div>
        </div>
        <div style={{ position:"relative", zIndex:1 }}>
          <h1>Inventario de herramientas, <em>con trazabilidad real.</em></h1>
          <p>Escanea el QR del equipo, marca quién lo tiene, devuélvelo y controla certificaciones — todo desde el teléfono.</p>
        </div>
        <div className="stats" style={{ position:"relative", zIndex:1 }}>
          <div><div className="n">QR</div><div className="l">Por equipo</div></div>
          <div><div className="n">100%</div><div className="l">Trazable</div></div>
          <div><div className="n">RT</div><div className="l">Tiempo real</div></div>
        </div>
      </div>

      {/* Formulario */}
      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={submit}>
          <h2>Iniciar sesión</h2>
          <p className="sub">Ingresa con tu usuario. Contacta al administrador si no tienes cuenta.</p>

          <div className="field">
            <label>Nombre de usuario <span className="req">*</span></label>
            <input className="input" placeholder="ej: jgarcia" value={username}
              onChange={(e) => setUsername(e.target.value)} autoFocus/>
          </div>
          <div className="field">
            <label>Clave <span className="req">*</span></label>
            <input className="input" type="password" placeholder="••••••••"
              value={pass} onChange={(e) => setPass(e.target.value)}/>
          </div>

          {err && <div className="field"><div className="err">⚠ {err}</div></div>}

          <button className="btn primary block lg" type="submit" disabled={busy} style={{ marginTop: 6 }}>
            {busy ? "Conectando…" : "Entrar"}
          </button>

          <div style={{
            marginTop: 20, padding: "10px 14px", background: "var(--surface-2)",
            border: "1px solid var(--line)", borderRadius: 10,
            fontSize: 12, color: "var(--ink-3)", lineHeight: 1.6,
          }}>
            ¿No tienes cuenta? Pide al <b style={{ color:"var(--ink-2)" }}>Administrador</b> que te cree una.
          </div>
        </form>
      </div>
    </div>
  );
}

window.FirstSetup  = FirstSetup;
window.AuthScreen  = AuthScreen;
