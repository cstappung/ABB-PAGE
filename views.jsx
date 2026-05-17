/* ToolVault — Cards view, Table view, Certificates view, History view
   ============================================================ */
const { useState: useSV, useMemo: useMV } = React;

const STATUS_OPTIONS = ["Disponible", "En uso", "En mantenimiento", "Fuera de servicio"];

/* ============================================================
   CARDS VIEW
   ============================================================ */
function CardsView({ db, onOpenTool, onAdd }) {
  const [q, setQ] = useSV("");
  const [statusFilter, setStatusFilter] = useSV("all");
  const [certFilter, setCertFilter] = useSV("all");

  const userMap = useMV(() => Object.fromEntries(db.users.map((u) => [u.id, u])), [db]);
  const tools = useMV(() => {
    const ql = q.toLowerCase().trim();
    return db.tools.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (certFilter !== "all") {
        const s = TV.certStatusFor(t.certDue);
        if (certFilter === "vigente" && s !== "vigente") return false;
        if (certFilter === "soon" && s !== "por-vencer-30" && s !== "por-vencer-60") return false;
        if (certFilter === "expired" && s !== "vencido") return false;
      }
      if (!ql) return true;
      const user = userMap[t.currentUser];
      return [t.name, t.location, t.status, user?.name, user?.username]
        .filter(Boolean).some((s) => s.toLowerCase().includes(ql));
    });
  }, [db, q, statusFilter, certFilter, userMap]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Vista general</h1>
          <p className="page-sub">{tools.length} de {db.tools.length} herramientas</p>
        </div>
        <div className="row">
          <button className="btn" onClick={() => printQRSheet(tools, db.config?.orgName)} title="Imprimir hoja de QRs">
            <Icon.QR size={14}/> <span className="hide-sm">Imprimir QRs</span>
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="search">
          <Icon.Search/>
          <input placeholder="Buscar por nombre, ubicación, usuario..." value={q} onChange={(e) => setQ(e.target.value)}/>
        </div>
        <Select
          value={statusFilter} onChange={setStatusFilter}
          options={[{ value: "all", label: "Todos los estados" }, ...STATUS_OPTIONS.map((s) => ({ value: s, label: s }))]}
        />
        <Select
          value={certFilter} onChange={setCertFilter}
          options={[
            { value: "all", label: "Cualquier certificado" },
            { value: "vigente", label: "Cert. vigente" },
            { value: "soon", label: "Próximo a vencer" },
            { value: "expired", label: "Cert. vencido" },
          ]}
        />
      </div>

      {tools.length === 0 ? (
        <div className="card"><div className="empty">
          <div className="ico"><Icon.Search/></div>
          <div className="t">Sin resultados</div>
          <div>Ajusta los filtros o busca otro término.</div>
        </div></div>
      ) : (
        <div className="tool-grid">
          {tools.map((t) => {
            const user = userMap[t.currentUser];
            const dot = TV.certDot(t.certDue);
            return (
              <div className="tool-card" key={t.id} onClick={() => onOpenTool(t.id)}>
                <div className="img">
                  <ToolImage tool={t}/>
                  <span className={"cert-dot " + dot} title={TV.certBadge(t.certDue).label}/>
                </div>
                <div className="body">
                  <div className="name">{t.name}</div>
                  <div className="loc">{t.location}</div>
                  <div className="foot">
                    <StatusPill status={t.status}/>
                    {user ? (
                      <div className="holder">
                        <Avatar name={user.name} size="sm"/>
                        <span className="nm">{user.name.split(" ")[0]}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: "var(--ink-4)", fontFamily: "var(--mono)" }}>
                        {fmtDate(t.certDue)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   DASHBOARD SUMMARY (embedded at top of TableView)
   ============================================================ */
function TableDashSummary({ db, onOpenTool }) {
  const m = useMV(() => {
    const tools = db.tools;
    const expired = tools.filter((t) => TV.certStatusFor(t.certDue) === "vencido");
    const soon30  = tools.filter((t) => TV.certStatusFor(t.certDue) === "por-vencer-30");
    const soon60  = tools.filter((t) => TV.certStatusFor(t.certDue) === "por-vencer-60");
    return {
      total:   tools.length,
      disp:    tools.filter((t) => t.status === "Disponible").length,
      use:     tools.filter((t) => t.status === "En uso").length,
      maint:   tools.filter((t) => t.status === "En mantenimiento").length,
      expired, soon30, soon60,
    };
  }, [db]);

  const alerts = [
    m.expired.length > 0 && {
      tone: "danger", tools: m.expired,
      msg: <><b>{m.expired.length} cert. vencido{m.expired.length>1?"s":""}</b> — {m.expired.slice(0,2).map(t=>t.name).join(", ")}{m.expired.length>2?` +${m.expired.length-2} más`:""}</>,
    },
    m.soon30.length > 0 && {
      tone: "danger", tools: m.soon30,
      msg: <><b>{m.soon30.length} cert.</b> vence{m.soon30.length>1?"n":""} en ≤ 30 días — {m.soon30.slice(0,2).map(t=>t.name).join(", ")}</>,
    },
    m.soon60.length > 0 && {
      tone: "warn", tools: m.soon60,
      msg: <><b>{m.soon60.length} cert.</b> vence{m.soon60.length>1?"n":""} en ≤ 60 días</>,
    },
  ].filter(Boolean);

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Metric strip */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 10, marginBottom: alerts.length ? 10 : 0,
      }}>
        {[
          { label: "Total",          val: m.total,          color: "var(--ink-2)",    dot: "var(--ink-3)" },
          { label: "Disponibles",    val: m.disp,           color: "var(--ok)",       dot: "var(--ok)" },
          { label: "En uso",         val: m.use,            color: "var(--info)",     dot: "var(--info)" },
          { label: "Cert. vencidos", val: m.expired.length, color: "var(--danger)",   dot: "var(--danger)" },
        ].map((it) => (
          <div key={it.label} style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "var(--r-md)",
            padding: "10px 14px",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: it.dot, flexShrink: 0 }}/>
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ink-3)", flex: 1 }}>{it.label}</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 20, fontWeight: 700, color: it.color, letterSpacing: "-0.02em" }}>{it.val}</span>
          </div>
        ))}
      </div>

      {/* Compact alert rows */}
      {alerts.map((a, i) => (
        <div key={i} className={"alert-row " + a.tone} style={{ marginBottom: 6 }}>
          <div className="ico"><Icon.Alert size={14}/></div>
          <div className="body" style={{ fontSize: 13 }}>{a.msg}</div>
          <button className="btn sm" onClick={() => onOpenTool(a.tools[0].id, "cert")}>
            Subir cert. <Icon.ArrowRight size={12}/>
          </button>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   TABLE VIEW
   ============================================================ */
function TableView({ db, setDb, user, onOpenTool, logEvent }) {
  const [q, setQ] = useSV("");
  const [statusFilter, setStatusFilter] = useSV("all");
  const [certFilter, setCertFilter] = useSV("all");
  const [sort, setSort] = useSV({ k: "updatedAt", dir: "desc" });
  const [editing, setEditing] = useSV(null); // { id, field, value }
  const toast = useToast();

  const userMap = useMV(() => Object.fromEntries(db.users.map((u) => [u.id, u])), [db]);

  const rows = useMV(() => {
    const ql = q.toLowerCase().trim();
    let r = db.tools.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (certFilter !== "all") {
        const s = TV.certStatusFor(t.certDue);
        if (certFilter === "soon" && s !== "por-vencer-30" && s !== "por-vencer-60") return false;
        if (certFilter === "expired" && s !== "vencido") return false;
        if (certFilter === "vigente" && s !== "vigente") return false;
      }
      if (!ql) return true;
      const u = userMap[t.currentUser];
      return [t.name, t.location, t.status, u?.name].filter(Boolean).some((s) => s.toLowerCase().includes(ql));
    });
    r.sort((a, b) => {
      let av, bv;
      switch (sort.k) {
        case "name": av = a.name; bv = b.name; break;
        case "status": av = a.status; bv = b.status; break;
        case "location": av = a.location; bv = b.location; break;
        case "certDue": av = a.certDue || ""; bv = b.certDue || ""; break;
        case "updatedAt": av = a.updatedAt; bv = b.updatedAt; break;
        case "user": av = userMap[a.currentUser]?.name || ""; bv = userMap[b.currentUser]?.name || ""; break;
        default: av = a[sort.k]; bv = b[sort.k];
      }
      const cmp = String(av).localeCompare(String(bv));
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return r;
  }, [db, q, statusFilter, certFilter, sort, userMap]);

  const toggleSort = (k) => {
    setSort((s) => s.k === k ? { k, dir: s.dir === "asc" ? "desc" : "asc" } : { k, dir: "asc" });
  };
  const sortInd = (k) => sort.k !== k ? null : (sort.dir === "asc" ? "↑" : "↓");

  const startEdit = (id, field, value) => setEditing({ id, field, value });
  const commitEdit = () => {
    if (!editing) return;
    const t = db.tools.find((x) => x.id === editing.id);
    if (!t) { setEditing(null); return; }
    if (t[editing.field] === editing.value) { setEditing(null); return; }
    const old = t[editing.field];
    const nextTools = db.tools.map((x) => x.id === t.id ? { ...x, [editing.field]: editing.value, updatedAt: TV.now(), updatedBy: user.id } : x);
    const nextDb = { ...db, tools: nextTools };
    setDb(nextDb);
    logEvent(nextDb, {
      toolId: t.id, type: "edit", userId: user.id, at: TV.now(),
      detail: { field: editing.field, oldValue: old, newValue: editing.value },
    });
    toast("Cambio guardado", "success");
    setEditing(null);
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Tabla</h1>
          <p className="page-sub">{rows.length} de {db.tools.length} herramientas · doble-click en celda para editar</p>
        </div>
      </div>

      {/* ── Métricas compactas ── */}
      <TableDashSummary db={db} onOpenTool={onOpenTool}/>

      <div className="toolbar">
        <div className="search">
          <Icon.Search/>
          <input placeholder="Buscar en la tabla..." value={q} onChange={(e) => setQ(e.target.value)}/>
        </div>
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          options={[{ value: "all", label: "Todos los estados" }, ...STATUS_OPTIONS.map((s) => ({ value: s, label: s }))]}
        />
        <Select
          value={certFilter}
          onChange={setCertFilter}
          options={[
            { value: "all", label: "Cualquier certificado" },
            { value: "vigente", label: "Cert. vigente" },
            { value: "soon", label: "Próximo a vencer" },
            { value: "expired", label: "Cert. vencido" },
          ]}
        />
      </div>

      <div className="tbl-wrap">
        <div className="tbl-scroll">
          <table className="data">
            <thead>
              <tr>
                <th className="sortable" onClick={() => toggleSort("name")}>Herramienta {sortInd("name") && <span className="sort-ind">{sortInd("name")}</span>}</th>
                <th className="sortable" onClick={() => toggleSort("status")}>Estado {sortInd("status") && <span className="sort-ind">{sortInd("status")}</span>}</th>
                <th className="sortable" onClick={() => toggleSort("user")}>En uso por {sortInd("user") && <span className="sort-ind">{sortInd("user")}</span>}</th>
                <th className="sortable" onClick={() => toggleSort("location")}>Ubicación {sortInd("location") && <span className="sort-ind">{sortInd("location")}</span>}</th>
                <th className="sortable" onClick={() => toggleSort("certDue")}>Vence cert. {sortInd("certDue") && <span className="sort-ind">{sortInd("certDue")}</span>}</th>
                <th>Cert.</th>
                <th className="sortable" onClick={() => toggleSort("updatedAt")}>Última act. {sortInd("updatedAt") && <span className="sort-ind">{sortInd("updatedAt")}</span>}</th>
                <th>Modificado por</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const u = userMap[t.currentUser];
                const updatedBy = userMap[t.updatedBy];
                const isEditing = (field) => editing && editing.id === t.id && editing.field === field;
                return (
                  <tr key={t.id} className={editing && editing.id === t.id ? "editing" : ""}>
                    <td>
                      <span className="row-thumb">{t.img?.dataUrl ? <img src={t.img.dataUrl}/> : <span className="ph"/>}</span>
                      {isEditing("name") ? (
                        <input className="inline-edit" autoFocus value={editing.value}
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          onBlur={commitEdit}
                          onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditing(null); }}/>
                      ) : (
                        <span className="tn" onDoubleClick={() => startEdit(t.id, "name", t.name)}>{t.name}</span>
                      )}
                    </td>
                    <td>
                      {isEditing("status") ? (
                        <select className="inline-edit" autoFocus value={editing.value}
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          onBlur={commitEdit}
                          onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditing(null); }}>
                          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : (
                        <span onDoubleClick={() => startEdit(t.id, "status", t.status)}>
                          <StatusPill status={t.status}/>
                        </span>
                      )}
                    </td>
                    <td>
                      {u ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <Avatar name={u.name} size="sm"/> <span>{u.name}</span>
                        </span>
                      ) : <span style={{ color: "var(--ink-4)" }}>—</span>}
                    </td>
                    <td>
                      {isEditing("location") ? (
                        <input className="inline-edit" autoFocus value={editing.value}
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          onBlur={commitEdit}
                          onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditing(null); }}/>
                      ) : (
                        <span onDoubleClick={() => startEdit(t.id, "location", t.location)}>{t.location}</span>
                      )}
                    </td>
                    <td className="mono">{fmtDate(t.certDue)}</td>
                    <td><CertBadge dueDate={t.certDue}/></td>
                    <td className="mono">{fmtAgo(t.updatedAt)}</td>
                    <td>
                      {updatedBy ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <Avatar name={updatedBy.name} size="sm"/> <span>{updatedBy.name.split(" ")[0]}</span>
                        </span>
                      ) : <span style={{ color: "var(--ink-4)" }}>—</span>}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span className="row-actions">
                        <button className="icon-btn" title="Abrir detalle" onClick={() => onOpenTool(t.id)}><Icon.Eye/></button>
                        <button className="icon-btn" title="Editar nombre" onClick={() => startEdit(t.id, "name", t.name)}><Icon.Edit/></button>
                      </span>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={9}>
                  <div className="empty"><div className="ico"><Icon.Search/></div><div className="t">Sin resultados</div></div>
                </td></tr>
              )}
            </tbody>
            <tfoot>
              <tr><td colSpan={9}>Tip: doble-click sobre nombre, estado o ubicación para editar inline. Enter para guardar, Esc para cancelar.</td></tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   CERTIFICATES VIEW
   ============================================================ */
function CertificatesView({ db, onOpenTool }) {
  const [tab, setTab] = useSV("alerts");
  const userMap = useMV(() => Object.fromEntries(db.users.map((u) => [u.id, u])), [db]);
  const toolMap = useMV(() => Object.fromEntries(db.tools.map((t) => [t.id, t])), [db]);

  const byStatus = useMV(() => {
    const expired = [], soon30 = [], soon60 = [], vigente = [];
    db.tools.forEach((t) => {
      const s = TV.certStatusFor(t.certDue);
      if (s === "vencido") expired.push(t);
      else if (s === "por-vencer-30") soon30.push(t);
      else if (s === "por-vencer-60") soon60.push(t);
      else vigente.push(t);
    });
    return { expired, soon30, soon60, vigente };
  }, [db]);

  const historical = useMV(() =>
    db.certs.slice().sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
  , [db]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Certificados</h1>
          <p className="page-sub">Vigentes, próximos a vencer e historial completo</p>
        </div>
      </div>

      <div className="metric-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 20 }}>
        <div className="metric danger">
          <div className="lbl"><span className="dot"/>Vencidos</div>
          <div className="num">{byStatus.expired.length}</div>
          <div className="foot">Renovación inmediata</div>
        </div>
        <div className="metric accent">
          <div className="lbl"><span className="dot"/>Vence en 30 días</div>
          <div className="num">{byStatus.soon30.length}</div>
          <div className="foot">Prioridad alta</div>
        </div>
        <div className="metric warn">
          <div className="lbl"><span className="dot"/>Vence en 60 días</div>
          <div className="num">{byStatus.soon60.length}</div>
          <div className="foot">Programar renovación</div>
        </div>
        <div className="metric ok">
          <div className="lbl"><span className="dot"/>Vigentes</div>
          <div className="num">{byStatus.vigente.length}</div>
          <div className="foot">Sin acción requerida</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="tabs" style={{ background: "transparent", border: 0, padding: 0 }}>
          <button className={tab === "alerts" ? "active" : ""} onClick={() => setTab("alerts")} style={{ padding: "8px 14px", border: "1px solid var(--line)" }}>
            <Icon.Alert size={13}/> Por vencer / vencidos
            <span className="badge">{byStatus.expired.length + byStatus.soon30.length + byStatus.soon60.length}</span>
          </button>
          <button className={tab === "history" ? "active" : ""} onClick={() => setTab("history")} style={{ padding: "8px 14px", border: "1px solid var(--line)", marginLeft: 6 }}>
            <Icon.History size={13}/> Historial completo
          </button>
        </div>
      </div>

      {tab === "alerts" ? (
        <div className="card">
          <div className="card-h"><div className="t">Alertas activas</div></div>
          {[...byStatus.expired, ...byStatus.soon30, ...byStatus.soon60].length === 0 ? (
            <div className="empty">
              <div className="ico"><Icon.Check/></div>
              <div className="t">Todo en orden</div>
              <div>No hay certificados próximos a vencer.</div>
            </div>
          ) : (
            <div>
              {byStatus.expired.map((t) => <AlertCertRow key={t.id} tool={t} kind="expired" onOpen={() => onOpenTool(t.id, "cert")}/>)}
              {byStatus.soon30.map((t) => <AlertCertRow key={t.id} tool={t} kind="soon30" onOpen={() => onOpenTool(t.id, "cert")}/>)}
              {byStatus.soon60.map((t) => <AlertCertRow key={t.id} tool={t} kind="soon60" onOpen={() => onOpenTool(t.id, "cert")}/>)}
            </div>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="card-h"><div className="t">Historial de certificados</div><div className="s">{historical.length} registros</div></div>
          {historical.length === 0 ? (
            <div className="empty"><div className="ico"><Icon.Cert/></div><div className="t">Sin historial</div></div>
          ) : historical.map((c) => {
            const t = toolMap[c.toolId];
            const u = userMap[c.uploadedBy];
            const live = c.status === "vigente" ? TV.certStatusFor(c.dueDate) : c.status;
            const tone = c.status === "reemplazado" ? "muted" : live === "vencido" ? "danger" : live === "por-vencer-30" || live === "por-vencer-60" ? "warn" : "ok";
            const cls = c.status === "reemplazado" ? "" : live === "vencido" ? "expired" : (live === "por-vencer-30" || live === "por-vencer-60") ? "soon" : "current";
            return (
              <div className={"cert-row " + cls} key={c.id}>
                <div className="ico"><Icon.Cert size={16}/></div>
                <div className="body">
                  <div className="name" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span>{c.filename}</span>
                    <span className={"badge " + tone}>
                      {c.status === "reemplazado" ? "Reemplazado" :
                       live === "vencido" ? "Vencido" :
                       live === "por-vencer-30" ? "Vence ≤30d" :
                       live === "por-vencer-60" ? "Vence ≤60d" : "Vigente"}
                    </span>
                  </div>
                  <div className="meta">
                    <span style={{ color: "var(--ink-2)", fontWeight: 600 }}>{t?.name}</span>
                    <span className="sep"/>
                    <span>vence <span className="mono">{fmtDate(c.dueDate)}</span></span>
                    <span className="sep"/>
                    <span>subido <span className="mono">{fmtDate(c.uploadedAt)}</span> por {u?.name || "—"}</span>
                  </div>
                </div>
                <div className="row">
                  <button className="btn sm ghost" title="Ver"><Icon.Eye/></button>
                  <button className="btn sm ghost" title="Descargar"><Icon.Download/></button>
                  <button className="btn sm" onClick={() => onOpenTool(c.toolId)}>Abrir herramienta</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AlertCertRow({ tool, kind, onOpen }) {
  const days = TV.daysUntil(tool.certDue);
  const cls = kind === "expired" ? "expired" : (kind === "soon30" ? "expired" : "soon");
  const label = kind === "expired" ? `Vencido hace ${Math.abs(days)} días`
              : `Vence en ${days} día${days===1?"":"s"}`;
  return (
    <div className={"cert-row " + cls}>
      <div className="ico"><Icon.Alert size={16}/></div>
      <div className="body">
        <div className="name">{tool.name}</div>
        <div className="meta">
          <span style={{ color: kind === "expired" ? "var(--danger)" : "oklch(0.55 0.14 75)", fontWeight: 700 }}>{label}</span>
          <span className="sep"/>
          <span><Icon.Pin size={11} style={{ display: "inline", verticalAlign: -2, marginRight: 3 }}/> {tool.location}</span>
          <span className="sep"/>
          <span>vence <span className="mono">{fmtDate(tool.certDue)}</span></span>
        </div>
      </div>
      <button className="btn primary sm" onClick={onOpen}><Icon.Upload size={12}/> Subir nuevo</button>
    </div>
  );
}

/* ============================================================
   HISTORY / AUDIT
   ============================================================ */
function HistoryView({ db, onOpenTool }) {
  const [q, setQ] = useSV("");
  const [typeFilter, setTypeFilter] = useSV("all");
  const userMap = useMV(() => Object.fromEntries(db.users.map((u) => [u.id, u])), [db]);
  const toolMap = useMV(() => Object.fromEntries(db.tools.map((t) => [t.id, t])), [db]);

  const events = useMV(() => {
    const ql = q.toLowerCase().trim();
    return db.events.filter((e) => {
      if (typeFilter !== "all" && e.type !== typeFilter) return false;
      if (!ql) return true;
      const u = userMap[e.userId];
      const t = toolMap[e.toolId];
      return [u?.name, u?.username, t?.name, e.type, JSON.stringify(e.detail)]
        .filter(Boolean).some((s) => String(s).toLowerCase().includes(ql));
    });
  }, [db, q, typeFilter, userMap, toolMap]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Historial y auditoría</h1>
          <p className="page-sub">{events.length} eventos · trazabilidad completa de cada acción</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="search">
          <Icon.Search/>
          <input placeholder="Buscar por usuario, herramienta, campo..." value={q} onChange={(e) => setQ(e.target.value)}/>
        </div>
        <Select value={typeFilter} onChange={setTypeFilter} options={[
          { value: "all", label: "Todos los tipos" },
          { value: "create", label: "Creaciones" },
          { value: "edit", label: "Ediciones" },
          { value: "use", label: "Tomas" },
          { value: "return", label: "Devoluciones" },
          { value: "cert", label: "Certificados" },
        ]}/>
      </div>

      <div className="card">
        <div className="card-h">
          <div className="t">Eventos recientes primero</div>
          <div className="s">{events.length} resultado{events.length===1?"":"s"}</div>
        </div>
        <div>
          {events.length === 0 ? (
            <div className="empty"><div className="ico"><Icon.History/></div><div className="t">Sin eventos</div></div>
          ) : events.map((e) => {
            const u = userMap[e.userId];
            const t = toolMap[e.toolId];
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
                    {e.type === "edit" && e.detail?.field && (
                      <> <span style={{ color: "var(--ink-3)" }}>· campo</span>{" "}
                      <span style={{ fontFamily: "var(--mono)", fontSize: 12, background: "var(--surface-2)", border: "1px solid var(--line)", padding: "1px 6px", borderRadius: 5 }}>{e.detail.field}</span>
                      {e.detail.oldValue !== undefined && (
                        <span className="diff" style={{ display: "inline-flex", gap: 6, alignItems: "center", fontFamily: "var(--mono)", fontSize: 12, background: "var(--surface-2)", border: "1px solid var(--line)", padding: "2px 7px", borderRadius: 6, margin: "0 4px" }}>
                          <span style={{ color: "var(--danger)", textDecoration: "line-through" }}>{String(e.detail.oldValue) || "—"}</span>
                          <span style={{ color: "var(--ink-4)" }}>→</span>
                          <span style={{ color: "oklch(0.40 0.13 150)" }}>{String(e.detail.newValue) || "—"}</span>
                        </span>
                      )}
                      </>
                    )}
                    {e.type === "use" && <span style={{ color: "var(--ink-3)" }}> · responsable asignado</span>}
                    {e.type === "return" && e.detail?.onBehalfOf && (
                      <span style={{ color: "var(--ink-3)" }}> · en nombre de <b style={{ color: "var(--ink-2)" }}>{userMap[e.detail.onBehalfOf]?.name || "—"}</b></span>
                    )}
                  </div>
                  <div className="l2">
                    <Avatar name={u?.name} size="sm"/>
                    <span>{u?.username}</span>
                    <span className="sep"/>
                    <span>{fmtDateTime(e.at)}</span>
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

Object.assign(window, { CardsView, TableView, CertificatesView, HistoryView, STATUS_OPTIONS });
