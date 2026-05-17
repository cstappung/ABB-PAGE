/* ToolVault — Auth (login/signup)
   ============================================================ */
const { useState: useStateA } = React;

function AuthScreen({ db, setDb, onLogin }) {
  const [mode, setMode] = useStateA("login");
  const [username, setUsername] = useStateA("");
  const [name, setName] = useStateA("");
  const [pass, setPass] = useStateA("");
  const [pass2, setPass2] = useStateA("");
  const [err, setErr] = useStateA("");
  const toast = useToast();

  const submit = (e) => {
    e.preventDefault();
    setErr("");
    if (mode === "login") {
      const u = db.users.find((u) => u.username.toLowerCase() === username.toLowerCase().trim());
      if (!u) { setErr("Usuario no encontrado."); return; }
      if (u.pass !== TV.hash(pass)) { setErr("Clave incorrecta."); return; }
      localStorage.setItem(TV.SESSION_KEY, u.id);
      toast("Bienvenido, " + u.name.split(" ")[0], "success");
      onLogin(u);
    } else {
      if (!name.trim()) { setErr("Ingresa tu nombre."); return; }
      if (username.trim().length < 3) { setErr("Usuario debe tener al menos 3 caracteres."); return; }
      if (db.users.find((u) => u.username.toLowerCase() === username.toLowerCase().trim())) {
        setErr("Ese usuario ya existe."); return;
      }
      if (pass.length < 6) { setErr("La clave debe tener al menos 6 caracteres."); return; }
      if (pass !== pass2) { setErr("Las claves no coinciden."); return; }
      const u = {
        id: "u_" + TV.uid(),
        name: name.trim(),
        username: username.trim().toLowerCase(),
        pass: TV.hash(pass),
        role: "Técnico",
        created: TV.now(),
      };
      const next = { ...db, users: [...db.users, u] };
      setDb(next); TV.saveDB(next);
      localStorage.setItem(TV.SESSION_KEY, u.id);
      toast("Cuenta creada.", "success");
      onLogin(u);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-art">
        <div className="grid-bg"/>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="corner-mark">TV</div>
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1>Inventario de herramientas, <em>con trazabilidad real.</em></h1>
          <p>Cada movimiento queda registrado: quién la tiene, dónde está, qué certificado vence y cuándo. Sin planillas perdidas.</p>
        </div>
        <div className="stats" style={{ position: "relative" }}>
          <div><div className="n">{db.tools.length}</div><div className="l">Equipos</div></div>
          <div><div className="n">{db.tools.filter((t) => t.status === "Disponible").length}</div><div className="l">Disponibles</div></div>
          <div><div className="n">{db.events.length}</div><div className="l">Eventos</div></div>
        </div>
      </div>

      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={submit}>
          <h2>{mode === "login" ? "Iniciar sesión" : "Crear cuenta"}</h2>
          <p className="sub">
            {mode === "login" ? "Ingresa con tu usuario interno." : "Sin correo electrónico — solo nombre, usuario y clave."}
          </p>

          <div className="auth-toggle">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setErr(""); }}>Iniciar</button>
            <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setErr(""); }}>Registrarse</button>
          </div>

          {mode === "signup" && (
            <div className="field">
              <label>Nombre <span className="req">*</span></label>
              <input className="input" placeholder="Nombre y apellido" value={name} onChange={(e) => setName(e.target.value)} autoFocus/>
            </div>
          )}

          <div className="field">
            <label>Nombre de usuario <span className="req">*</span></label>
            <input className="input" placeholder="ej: jpgomez" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus={mode === "login"}/>
          </div>

          <div className="field">
            <label>Clave <span className="req">*</span></label>
            <input className="input" type="password" placeholder="••••••••" value={pass} onChange={(e) => setPass(e.target.value)}/>
          </div>

          {mode === "signup" && (
            <div className="field">
              <label>Confirmar clave <span className="req">*</span></label>
              <input className="input" type="password" placeholder="••••••••" value={pass2} onChange={(e) => setPass2(e.target.value)}/>
            </div>
          )}

          {err && <div className="field"><div className="err">{err}</div></div>}

          <button className="btn primary block lg" type="submit" style={{ marginTop: 6 }}>
            {mode === "login" ? "Entrar" : "Crear cuenta"}
          </button>

          {mode === "login" && (
            <div style={{
              marginTop: 24, padding: 14, border: "1px dashed var(--line)",
              borderRadius: 12, fontSize: 12, color: "var(--ink-3)", background: "var(--surface-2)",
            }}>
              <div style={{ fontWeight: 600, color: "var(--ink-2)", marginBottom: 6, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Cuentas demo
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, fontFamily: "var(--mono)" }}>
                <span>tomas / admin123</span>
                <span>carla / carla123</span>
                <span>diego / diego123</span>
                <span>marta / marta123</span>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

window.AuthScreen = AuthScreen;
