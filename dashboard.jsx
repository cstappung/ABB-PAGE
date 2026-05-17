/* ToolVault — Dashboard view
   ============================================================ */
const { useMemo: useMemoD } = React;

function Dashboard({ db, user, onOpenTool, onTab }) {
  const m = useMemoD(() => {
    const tools = db.tools;
    const expired = tools.filter((t) => TV.certStatusFor(t.certDue) === "vencido");
    const soon30 = tools.filter((t) => TV.certStatusFor(t.certDue) === "por-vencer-30");
    const soon60 = tools.filter((t) => TV.certStatusFor(t.certDue) === "por-vencer-60");
    return {
      total: tools.length,
      disp: tools.filter((t) => t.status === "Disponible").length,
      use: tools.filter((t) => t.status === "En uso").length,
      maint: tools.filter((t) => t.status === "En mantenimiento").length,
      out: tools.filter((t) => t.status === "Fuera de servicio").length,
      expired, soon30, soon60,
    };
  }, [db]);

  const recent = useMemoD(() => db.events.slice(0, 8), [db]);
  const userMap = useMemoD(() => Object.fromEntries(db.users.map((u) => [u.id, u])), [db]);
  const toolMap = useMemoD(() => Object.fromEntries(db.tools.map((t) => [t.id, t])), [db]);

  const alerts = [
    m.expired.length > 0 && {
      tone: "danger",
      title: <><b>{m.expired.length} certificado{m.expired.length>1?"s":""} vencido{m.expired.length>1?"s":""}</b> requiere{m.expired.length>1?"n":""} renovación inmediata</>,
      sub: m.expired.slice(0, 3).map((t) => t.name).join(" · ") + (m.expired.length > 3 ? ` · +${m.expired.length-3} más` : ""),
      tools: m.expired,
    },
    m.soon30.length > 0 && {
      tone: "danger",
      title: <><b>{m.soon30.length} certificado{m.soon30.length>1?"s":""}</b> vence{m.soon30.length>1?"n":""} en los próximos 30 días</>,
      sub: m.soon30.slice(0, 3).map((t) => `${t.name} (${TV.daysUntil(t.certDue)}d)`).join(" · "),
      tools: m.soon30,
    },
    m.soon60.length > 0 && {
      tone: "warn",
      title: <><b>{m.soon60.length} certificado{m.soon60.length>1?"s":""}</b> vence{m.soon60.length>1?"n":""} en 60 días</>,
      sub: m.soon60.slice(0, 3).map((t) => `${t.name} (${TV.daysUntil(t.certDue)}d)`).join(" · "),
      tools: m.soon60,
    },
  ].filter(Boolean);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Hola, {user.name.split(" ")[0]} 👋</h1>
          <p className="page-sub">Resumen del almacén · actualizado hace unos segundos</p>
        </div>
        <div className="row">
          <button className="btn" onClick={() => onTab("certs")}>
            <Icon.Cert size={14}/> Ver certificados
          </button>
          <button className="btn" onClick={() => onTab("table")}>
            <Icon.Rows size={14}/> Abrir tabla
          </button>
        </div>
      </div>

      <div className="metric-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className="metric">
          <div className="lbl">Total</div>
          <div className="num">{m.total}</div>
        </div>
        <div className="metric ok">
          <div className="lbl"><span className="dot"/>Disponibles</div>
          <div className="num">{m.disp}</div>
        </div>
        <div className="metric info">
          <div className="lbl"><span className="dot"/>En uso</div>
          <div className="num">{m.use}</div>
        </div>
        <div className="metric danger">
          <div className="lbl"><span className="dot"/>Cert. vencidos</div>
          <div className="num">{m.expired.length}</div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div style={{ margin: "20px 0" }}>
          {alerts.map((a, i) => (
            <div className={"alert-row " + a.tone} key={i}>
              <div className="ico"><Icon.Alert size={15}/></div>
              <div className="body">
                <div>{a.title}</div>
                <div className="s">{a.sub}</div>
              </div>
              <button className="btn sm" onClick={() => onOpenTool(a.tools[0].id, "cert")}>
                Subir certificado
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-h">
          <div>
            <div className="t">Últimas acciones</div>
          </div>
          <button className="btn ghost sm" onClick={() => onTab("history")}>
            Ver todo
          </button>
        </div>
        <div>
          {recent.length === 0 && (
            <div className="empty"><div className="ico"><Icon.History/></div><div className="t">Sin actividad aún</div></div>
          )}
          {recent.map((e) => {
            const t = toolMap[e.toolId];
            const u = userMap[e.userId];
            return (
              <div className="activity" key={e.id}>
                <div className={"icon " + e.type}><EventIcon type={e.type}/></div>
                <div className="body">
                  <div className="l1">
                    <b>{u?.name || "Usuario"}</b>{" "}
                    <span style={{ color: "var(--ink-3)" }}>{eventVerb(e.type)}</span>{" "}
                    <span className="tool" onClick={() => onOpenTool(e.toolId)} style={{ cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: 3 }}>
                      {t?.name || "—"}
                    </span>
                  </div>
                </div>
                <div className="when">{fmtAgo(e.at)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EventIcon({ type }) {
  if (type === "create") return <Icon.Plus size={14}/>;
  if (type === "use")    return <Icon.User size={13}/>;
  if (type === "return") return <Icon.Check size={13}/>;
  if (type === "cert")   return <Icon.Cert size={13}/>;
  if (type === "edit")   return <Icon.Edit size={12}/>;
  return <Icon.Clock size={13}/>;
}
function eventVerb(type) {
  return {
    create: "creó",
    use: "tomó",
    return: "devolvió",
    cert: "actualizó el certificado de",
    edit: "editó",
  }[type] || "actualizó";
}

function CertChart({ total, expired, soon30, soon60 }) {
  const vigentes = Math.max(0, total - expired - soon30 - soon60);
  const items = [
    { l: "Vigente",           v: vigentes, color: "var(--ok)" },
    { l: "Vence en 60d",      v: soon60,   color: "var(--warn)" },
    { l: "Vence en 30d",      v: soon30,   color: "oklch(0.62 0.18 50)" },
    { l: "Vencido",           v: expired,  color: "var(--danger)" },
  ];
  return (
    <div>
      <div style={{ display: "flex", height: 14, borderRadius: 999, overflow: "hidden", border: "1px solid var(--line)", background: "var(--surface-2)" }}>
        {items.map((it, i) => it.v > 0 && (
          <div key={i} style={{ width: (it.v / total * 100) + "%", background: it.color }} title={`${it.l}: ${it.v}`}/>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: it.color }}/>
            <span style={{ color: "var(--ink-2)", flex: 1 }}>{it.l}</span>
            <span style={{ fontFamily: "var(--mono)", fontWeight: 600 }}>{it.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LocationList({ tools }) {
  const grouped = {};
  tools.forEach((t) => {
    const k = (t.location || "—").split("·")[0].trim();
    grouped[k] = (grouped[k] || 0) + 1;
  });
  const max = Math.max(...Object.values(grouped));
  const entries = Object.entries(grouped).sort((a, b) => b[1] - a[1]).slice(0, 6);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {entries.map(([k, v]) => (
        <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
          <span style={{ width: 100, color: "var(--ink-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k}</span>
          <span style={{ flex: 1, height: 8, background: "var(--surface-2)", borderRadius: 999, overflow: "hidden", border: "1px solid var(--line)" }}>
            <span style={{ display: "block", height: "100%", width: (v/max*100)+"%", background: "var(--accent)" }}/>
          </span>
          <span style={{ fontFamily: "var(--mono)", fontWeight: 600, width: 24, textAlign: "right" }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

window.Dashboard = Dashboard;
