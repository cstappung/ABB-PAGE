/* ToolVault — Detail sheet + modales (Firestore-backed)
   ============================================================ */
const { useState: useSD, useEffect: useED, useRef: useRD } = React;

/* ============================================================
   QR MODAL
   ============================================================ */
function QRModal({ open, onClose, tool }) {
  const containerRef = useRD(null);
  const toast = useToast();
  const baseUrl = window.location.origin + window.location.pathname.replace(/\/$/, "");
  const url = tool ? `${baseUrl}?tool=${tool.id}` : "";

  useED(() => {
    if (!open || !tool || !containerRef.current) return;
    containerRef.current.innerHTML = "";
    if (typeof QRCode === "undefined") { console.error("QRCode lib not loaded"); return; }
    new QRCode(containerRef.current, {
      text: url, width: 220, height: 220,
      colorDark: "#1a1a1a", colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H,
    });
  }, [open, tool?.id]);

  const handlePrint = () => {
    if (!tool) return;
    const img = containerRef.current?.querySelector("img");
    const canvas = containerRef.current?.querySelector("canvas");
    const imgSrc = img?.src || canvas?.toDataURL() || "";
    const win = window.open("", "_blank", "width=420,height=560");
    if (!win) return;
    win.document.write(`<!doctype html><html><head><title>QR · ${tool.name}</title>
    <style>
      body{margin:0;font-family:Helvetica,Arial,sans-serif;text-align:center;padding:32px 24px;background:#fff}
      .box{border:2px solid #e5e5e5;border-radius:16px;padding:24px;display:inline-block}
      img{display:block;width:180px;height:180px;margin:0 auto}
      h2{margin:16px 0 4px;font-size:17px;font-weight:700;color:#111}
      .loc{font-size:13px;color:#666;margin:0 0 8px}
      .url{font-size:9px;color:#aaa;font-family:monospace;word-break:break-all;border-top:1px solid #eee;padding-top:10px;margin-top:10px}
      .inst{font-size:11px;color:#888;margin-top:6px}
    </style></head><body>
    <div class="box">
      <img src="${imgSrc}" alt="QR"/>
      <h2>${tool.name}</h2>
      <p class="loc">${tool.location || ""}</p>
      <div class="url">${url}</div>
      <p class="inst">Escanea para marcar en uso · devolver · ver certificado</p>
    </div>
    <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500)}<\/script>
    </body></html>`);
    win.document.close();
  };

  const copyUrl = async () => {
    try { await navigator.clipboard.writeText(url); toast("URL copiada", "success"); }
    catch { toast("No se pudo copiar", "error"); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Código QR" subtitle={tool?.name}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          display: "inline-block", padding: 20,
          border: "1px solid var(--line)", borderRadius: 16,
          background: "#fff", marginBottom: 16,
        }}>
          <div ref={containerRef}/>
        </div>
        <div style={{
          fontSize: 11, color: "var(--ink-3)", marginBottom: 16,
          wordBreak: "break-all", fontFamily: "var(--mono)",
          background: "var(--surface-2)", padding: "8px 12px",
          borderRadius: 8, border: "1px solid var(--line)",
        }}>{url}</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 16 }}>
          <button className="btn primary" onClick={handlePrint}>
            <Icon.Download size={13}/> Imprimir etiqueta
          </button>
          <button className="btn" onClick={copyUrl}>Copiar URL</button>
        </div>
        <div style={{
          fontSize: 12, color: "var(--ink-2)",
          background: "var(--accent-soft)", border: "1px solid oklch(0.88 0.06 25)",
          padding: "10px 14px", borderRadius: 10, textAlign: "left", lineHeight: 1.6,
        }}>
          <b>¿Cómo usarlo?</b> Pega este QR en la herramienta. Los ingenieros lo escanean con el teléfono y llegan directo para marcarla en uso, devolverla o ver el certificado.
        </div>
      </div>
    </Modal>
  );
}

/* ============================================================
   UPLOAD CERTIFICATE MODAL
   ============================================================ */
function UploadCertModal({ open, onClose, onSave, tool }) {
  const [file,   setFile]   = useSD(null);
  const [issued, setIssued] = useSD(new Date().toISOString().slice(0, 10));
  const [due,    setDue]    = useSD("");
  const [busy,   setBusy]   = useSD(false);

  useED(() => {
    if (open) {
      setFile(null);
      setIssued(new Date().toISOString().slice(0, 10));
      const d = new Date(); d.setFullYear(d.getFullYear() + 1);
      setDue(d.toISOString().slice(0, 10));
    }
  }, [open]);

  const save = async () => {
    if (!due) return;
    setBusy(true);
    await onSave({ file, issued, due });
    setBusy(false);
  };

  return (
    <Modal open={open} onClose={onClose}
      title="Subir nuevo certificado"
      subtitle={tool?.name}
      footer={<>
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className="btn primary" disabled={!due || busy} onClick={save}>
          {busy ? "Guardando…" : "Guardar certificado"}
        </button>
      </>}>
      <div style={{
        marginBottom: 14, padding: 12,
        background: "var(--warn-soft)", border: "1px solid oklch(0.85 0.10 75)",
        borderRadius: 10, fontSize: 13, color: "oklch(0.40 0.12 75)",
      }}>
        El certificado actual quedará archivado — no se elimina nunca.
      </div>
      <div className="field">
        <label>Archivo (PDF o imagen)</label>
        <FileDrop accept=".pdf,image/*" kind="cert"
          label="Arrastra el PDF o haz click"
          hint="Queda vinculado permanentemente a la herramienta"
          value={file} onChange={setFile}/>
      </div>
      <div className="form-grid">
        <div className="field">
          <label>Fecha de emisión</label>
          <input className="input" type="date" value={issued} onChange={(e) => setIssued(e.target.value)}/>
        </div>
        <div className="field">
          <label>Fecha de vencimiento <span className="req">*</span></label>
          <input className="input" type="date" value={due} onChange={(e) => setDue(e.target.value)}/>
          {due && <div className="hint"><CertBadge dueDate={due}/></div>}
        </div>
      </div>
    </Modal>
  );
}

/* ============================================================
   RETURN MODAL
   ============================================================ */
function ReturnModal({ open, onClose, onConfirm, tool, user, holder }) {
  const [mode,   setMode]   = useSD("self");
  const [reason, setReason] = useSD("");

  useED(() => {
    if (open) {
      setMode(holder?.id === user?.id ? "self" : "behalf");
      setReason("");
    }
  }, [open, holder, user]);

  const isOwn = holder?.id === user?.id;

  return (
    <Modal open={open} onClose={onClose}
      title="Devolver herramienta" subtitle={tool?.name}
      footer={<>
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className="btn primary" onClick={() => onConfirm({ mode, reason })}>
          Confirmar devolución
        </button>
      </>}>
      {isOwn ? (
        <p style={{ margin: 0, color: "var(--ink-2)" }}>
          La herramienta volverá a <b>Disponible</b>. Quedará registrado en el historial.
        </p>
      ) : (
        <>
          <p style={{ margin: "0 0 14px", color: "var(--ink-2)" }}>
            Esta herramienta la tiene <b>{holder?.name}</b>.
          </p>
          <div className="field">
            <label>¿Quién hace la devolución?</label>
            {[
              { val: "self",   title: "La devuelvo yo mismo",
                sub: `${holder?.name} me la entregó.` },
              { val: "behalf", title: `Devuelvo en nombre de ${holder?.name?.split(" ")[0]}`,
                sub: "Queda trazabilidad de ambos usuarios." },
            ].map((opt) => (
              <label key={opt.val} style={{
                display: "flex", gap: 10, padding: "10px 12px",
                border: "1px solid " + (mode === opt.val ? "var(--accent)" : "var(--line)"),
                borderRadius: 10, cursor: "pointer", marginBottom: 8,
                background: mode === opt.val ? "var(--accent-soft-2)" : "transparent",
              }}>
                <input type="radio" checked={mode === opt.val} onChange={() => setMode(opt.val)} style={{ marginTop: 3 }}/>
                <div>
                  <div style={{ fontWeight: 600 }}>{opt.title}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{opt.sub}</div>
                </div>
              </label>
            ))}
          </div>
          <div className="field">
            <label>Motivo / observación (opcional)</label>
            <textarea className="textarea" value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="ej: encontrada en bahía 3, sin novedad"/>
          </div>
        </>
      )}
    </Modal>
  );
}

/* ============================================================
   TOOL FORM MODAL (crear / editar)
   ============================================================ */
function ToolFormModal({ open, onClose, onSave, initial, user, saving }) {
  const isEdit = !!initial;
  const [form, setForm] = useSD({
    name: "", location: "", status: "Disponible",
    observations: "", certDue: "", certFile: null, img: null,
  });

  useED(() => {
    if (open) {
      setForm(initial ? {
        name: initial.name || "",
        location: initial.location || "",
        status: initial.status || "Disponible",
        observations: initial.observations || "",
        certDue: initial.certDue || "",
        certFile: null, img: null,
      } : {
        name: "", location: "", status: "Disponible",
        observations: "", certDue: "", certFile: null, img: null,
      });
    }
  }, [open, initial]);

  const up = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Modal open={open} onClose={onClose} size="lg"
      title={isEdit ? "Editar herramienta" : "Nueva herramienta"}
      subtitle={isEdit ? initial?.name : "Completa los datos del equipo"}
      footer={<>
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className="btn primary" disabled={!form.name.trim() || saving}
          onClick={() => onSave(form)}>
          {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear herramienta"}
        </button>
      </>}>
      <div className="form-grid">
        <div className="field full">
          <label>Nombre <span className="req">*</span></label>
          <input className="input" autoFocus value={form.name}
            placeholder="ej: Megóhmetro Digital 10kV"
            onChange={(e) => up("name", e.target.value)}/>
        </div>
        <div className="field">
          <label>Ubicación <span className="req">*</span></label>
          <input className="input" value={form.location}
            placeholder="ej: Estante A-04 · Bahía 2"
            onChange={(e) => up("location", e.target.value)}/>
        </div>
        <div className="field">
          <label>Estado</label>
          <Select value={form.status} onChange={(v) => up("status", v)}
            options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}/>
        </div>
        <div className="field full">
          <label>Imagen del equipo o ubicación</label>
          <FileDrop kind="image" accept="image/*"
            label="Arrastra o haz click" hint="PNG, JPG"
            value={form.img} onChange={(v) => up("img", v)}/>
        </div>
        <div className="field">
          <label>Certificado (PDF o imagen)</label>
          <FileDrop kind="cert" accept=".pdf,image/*"
            label="Subir certificado" hint="PDF escaneado"
            value={form.certFile} onChange={(v) => up("certFile", v)}/>
        </div>
        <div className="field">
          <label>Vencimiento del certificado <span className="req">*</span></label>
          <input className="input" type="date" value={form.certDue}
            onChange={(e) => up("certDue", e.target.value)}/>
          {form.certDue && <div className="hint"><CertBadge dueDate={form.certDue}/></div>}
        </div>
        <div className="field full">
          <label>Observaciones (opcional)</label>
          <textarea className="textarea" value={form.observations}
            placeholder="Notas, accesorios, condiciones especiales…"
            onChange={(e) => up("observations", e.target.value)}/>
        </div>
      </div>
      <div style={{
        marginTop: 14, padding: 12, background: "var(--surface-2)",
        border: "1px solid var(--line)", borderRadius: 10,
        display: "flex", gap: 10, alignItems: "center",
        fontSize: 12, color: "var(--ink-3)",
      }}>
        <Avatar name={user?.name} size="sm"/>
        <span>Registrado como: <b style={{ color: "var(--ink-2)" }}>{user?.name}</b></span>
      </div>
    </Modal>
  );
}

/* ============================================================
   TOOL DETAIL SHEET
   ============================================================ */
function ToolDetail({ tool, db, user, onClose, onEdit, initialAction }) {
  const [showQR,     setShowQR]     = useSD(false);
  const [showUpload, setShowUpload] = useSD(false);
  const [showReturn, setShowReturn] = useSD(false);
  const [confirm,    setConfirm]    = useSD(null);
  const [busy,       setBusy]       = useSD(false);
  const toast = useToast();

  useED(() => {
    if (initialAction === "cert" && tool) setShowUpload(true);
  }, [initialAction, tool?.id]);

  if (!tool) return null;

  const userMap  = Object.fromEntries(db.users.map((u) => [u.id, u]));
  const holder   = userMap[tool.currentUser];
  const isHolder = holder && holder.id === user?.id;

  const certs = db.certs
    .filter((c) => c.toolId === tool.id)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  const currentCert = certs.find((c) => c.status === "vigente") || certs[0];
  const evts = db.events.filter((e) => e.toolId === tool.id);

  /* Writes to Firestore */
  const updateTool = async (patch, evtData) => {
    setBusy(true);
    try {
      const n = TV.now();
      await TV.fsUpdate("tools", tool.id, { ...patch, updatedAt: n, updatedBy: user.id });
      if (evtData) await TV.logEvent({ ...evtData, at: n });
    } catch (e) { toast("Error: " + e.message, "error"); }
    finally { setBusy(false); }
  };

  const takeForUse = () => updateTool(
    { status: "En uso", currentUser: user.id, useStarted: TV.now() },
    { toolId: tool.id, type: "use", userId: user.id,
      detail: { from: tool.status, to: "En uso" } }
  ).then(() => toast("Marcada como en uso", "success"));

  const handleReturn = async ({ mode, reason }) => {
    const onBehalfOf = mode === "behalf" ? tool.currentUser : null;
    await updateTool(
      { status: "Disponible", currentUser: null, useStarted: null },
      { toolId: tool.id, type: "return", userId: user.id,
        detail: { from: "En uso", to: "Disponible", onBehalfOf, reason: reason || null } }
    );
    setShowReturn(false);
    toast("Herramienta devuelta", "success");
  };

  const handleUploadCert = async ({ file, issued, due }) => {
    setBusy(true);
    try {
      const certId = TV.uid(), n = TV.now();
      const fileUrl = file?.dataUrl
        ? await TV.uploadFile(`tools/${tool.id}/certs/${certId}`, file) : null;
      if (tool.currentCertId)
        await TV.fsUpdate("certs", tool.currentCertId, { status: "reemplazado" });
      await TV.fsSet("certs", certId, {
        toolId: tool.id, uploadedAt: n, uploadedBy: user.id,
        issuedDate: issued, dueDate: due,
        filename: file?.name || "certificado.pdf",
        fileUrl: fileUrl || null, status: "vigente",
      });
      await TV.fsUpdate("tools", tool.id, {
        certDue: due, certIssued: issued, currentCertId: certId,
        updatedAt: n, updatedBy: user.id,
      });
      await TV.logEvent({ toolId: tool.id, type: "cert", userId: user.id, at: n,
        detail: { filename: file?.name, newDue: due, oldDue: tool.certDue } });
      setShowUpload(false);
      toast("Certificado actualizado", "success");
    } catch (e) { toast("Error: " + e.message, "error"); }
    finally { setBusy(false); }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await TV.fsDelete("tools", tool.id);
      toast("Herramienta eliminada", "success");
      onClose();
    } catch (e) { toast("Error: " + e.message, "error"); }
    finally { setBusy(false); }
  };

  return (
    <Sheet open={!!tool} onClose={onClose}>
      {/* Header */}
      <div className="sheet-h">
        <div>
          <div className="t">{tool.name}</div>
          <div className="s" style={{ fontFamily: "var(--mono)", color: "var(--ink-3)", fontSize: 11 }}>
            {tool.id}
          </div>
        </div>
        <div className="row">
          <button className="btn sm" onClick={() => setShowQR(true)}>QR</button>
          {TV.can(user, "editTool") && (
            <button className="btn sm" onClick={onEdit}><Icon.Edit/> Editar</button>
          )}
          <button className="modal-close" onClick={onClose}><Icon.Close/></button>
        </div>
      </div>

      {/* Body */}
      <div className="sheet-b">
        {/* Hero image */}
        <div className="detail-hero">
          <ToolImage tool={tool} kind="hero"/>
          <span style={{
            position: "absolute", top: 14, right: 14,
            display: "inline-flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end",
          }}>
            <StatusPill status={tool.status}/>
            <CertBadge dueDate={tool.certDue}/>
          </span>
          {holder && (
            <span style={{
              position: "absolute", bottom: 14, left: 14,
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "oklch(0 0 0 / 0.72)", backdropFilter: "blur(8px)",
              color: "#fff", padding: "6px 12px", borderRadius: 999,
              fontSize: 12, fontWeight: 600,
            }}>
              <Avatar name={holder.name} size="sm"/>
              {holder.name}
              {tool.useStarted && (
                <span style={{ color: "oklch(1 0 0 / 0.6)", fontFamily: "var(--mono)", fontSize: 11 }}>
                  · {fmtAgo(tool.useStarted).replace("hace ", "")}
                </span>
              )}
            </span>
          )}
        </div>

        {/* Meta grid */}
        <div className="detail-meta">
          <div>
            <div className="k">Ubicación</div>
            <div className="v"><Icon.Pin size={12} style={{ display:"inline", marginRight:4, color:"var(--accent)" }}/>{tool.location || "—"}</div>
          </div>
          <div>
            <div className="k">Estado</div>
            <div className="v"><StatusPill status={tool.status}/></div>
          </div>
          <div>
            <div className="k">Cert. vence</div>
            <div className="v mono">{fmtDate(tool.certDue)}</div>
          </div>
          <div>
            <div className="k">Creado por</div>
            <div className="v">{userMap[tool.createdBy]?.name || "—"}</div>
          </div>
        </div>

        {/* Observaciones */}
        {tool.observations && (
          <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--line)" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"var(--ink-3)",
              textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>
              Observaciones
            </div>
            <div style={{ fontSize:14, color:"var(--ink-2)", lineHeight:1.55 }}>
              {tool.observations}
            </div>
          </div>
        )}

        {/* Certificado actual */}
        <div className="section-h">
          <span>Certificado actual</span>
          {TV.can(user, "uploadCert") && (
            <button className="btn sm" onClick={() => setShowUpload(true)}>
              <Icon.Upload size={12}/> Subir nuevo
            </button>
          )}
        </div>
        <div style={{ padding: "0 24px 16px" }}>
          {currentCert ? (
            <div className="file-pill" style={{ padding: 12 }}>
              <div className="ico" style={{ width:38, height:38 }}><Icon.Cert/></div>
              <div className="grow">
                <div className="name">{currentCert.filename}</div>
                <div className="meta">
                  Vence {fmtDate(currentCert.dueDate)} · subido {fmtDate(currentCert.uploadedAt)} por {userMap[currentCert.uploadedBy]?.name || "—"}
                </div>
              </div>
              {currentCert.fileUrl && (
                <a href={currentCert.fileUrl} target="_blank" rel="noreferrer"
                  className="btn sm ghost"><Icon.Eye/></a>
              )}
            </div>
          ) : (
            <div style={{ color:"var(--ink-3)", fontSize:13 }}>Sin certificado cargado.</div>
          )}
        </div>

        {/* Historial de certificados */}
        {certs.length > 1 && (
          <>
            <div className="section-h">
              <span>Certificados anteriores</span>
              <span style={{ color:"var(--ink-4)", fontFamily:"var(--mono)", fontSize:11 }}>
                {certs.length - 1} previo{certs.length - 1 > 1 ? "s" : ""}
              </span>
            </div>
            <div style={{ padding: "0 24px 16px" }}>
              {certs.filter((c) => c.id !== currentCert?.id).map((c) => (
                <div key={c.id} style={{
                  display:"grid", gridTemplateColumns:"36px 1fr auto",
                  gap:12, alignItems:"center",
                  padding:10, border:"1px solid var(--line)", borderRadius:10,
                  marginBottom:6, background:"var(--surface-2)",
                }}>
                  <div style={{ width:36, height:36, borderRadius:8, background:"var(--muted-soft)",
                    display:"grid", placeItems:"center", color:"var(--ink-3)" }}>
                    <Icon.Cert size={14}/>
                  </div>
                  <div>
                    <div style={{ fontWeight:600, fontSize:13 }}>{c.filename}</div>
                    <div style={{ fontSize:11, color:"var(--ink-3)" }}>
                      Vencía <span style={{ fontFamily:"var(--mono)" }}>{fmtDate(c.dueDate)}</span>
                      {" · "}{userMap[c.uploadedBy]?.name}
                    </div>
                  </div>
                  <span className="badge muted">Reemplazado</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Timeline */}
        <div className="section-h">
          <span>Historial</span>
          <span style={{ color:"var(--ink-4)", fontFamily:"var(--mono)", fontSize:11 }}>
            {evts.length} eventos
          </span>
        </div>
        <div className="timeline">
          {evts.length === 0 && (
            <div style={{ color:"var(--ink-3)", fontSize:13, padding:"0 0 12px" }}>
              Sin eventos registrados.
            </div>
          )}
          {evts.map((e) => {
            const u = userMap[e.userId];
            return (
              <div className={"timeline-item " + e.type} key={e.id}>
                <div className="dot"><EventIcon type={e.type}/></div>
                <div className="body">
                  <div className="l1">
                    <b>{u?.name || "Usuario"}</b>{" "}
                    <span style={{ color:"var(--ink-3)" }}>{eventVerb(e.type)}</span>
                    {e.type === "edit" && e.detail?.field && (
                      <>
                        {" · campo "}
                        <code style={{ fontFamily:"var(--mono)", fontSize:11,
                          background:"var(--surface-2)", border:"1px solid var(--line)",
                          padding:"1px 5px", borderRadius:4 }}>
                          {e.detail.field}
                        </code>
                        {e.detail.oldValue != null && (
                          <span className="diff">
                            <span className="old">{String(e.detail.oldValue) || "—"}</span>
                            <span className="arr">→</span>
                            <span className="new">{String(e.detail.newValue) || "—"}</span>
                          </span>
                        )}
                      </>
                    )}
                    {e.type === "return" && e.detail?.onBehalfOf && (
                      <> · en nombre de <b>{userMap[e.detail.onBehalfOf]?.name}</b>
                        {e.detail.reason && <span style={{ color:"var(--ink-3)" }}> — "{e.detail.reason}"</span>}
                      </>
                    )}
                  </div>
                  <div className="l2">
                    <span>{fmtDateTime(e.at)}</span>
                    <span className="sep"/>
                    <span>@{u?.username}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer actions */}
      <div className="sheet-f">
        {TV.can(user, "deleteTool") && (
          <button className="btn danger" disabled={busy} onClick={() => setConfirm("delete")}>
            <Icon.Trash/> <span className="hide-sm">Eliminar</span>
          </button>
        )}
        {!TV.can(user, "deleteTool") && <span/>}
        <div className="row">
          {tool.status === "Disponible" && TV.can(user, "useTool") && (
            <button className="btn dark lg" disabled={busy} onClick={takeForUse}>
              <Icon.User size={14}/> Marcar en uso
            </button>
          )}
          {tool.status === "En uso" && (
            <button className="btn primary lg" disabled={busy} onClick={() => setShowReturn(true)}>
              <Icon.Check size={14}/> Devolver
            </button>
          )}
          {(tool.status === "En mantenimiento" || tool.status === "Fuera de servicio") && TV.can(user, "editTool") && (
            <button className="btn dark lg" disabled={busy} onClick={() =>
              updateTool({ status: "Disponible" },
                { toolId: tool.id, type: "edit", userId: user.id,
                  detail: { field: "status", oldValue: tool.status, newValue: "Disponible" } }
              ).then(() => toast("Estado actualizado", "success"))}>
              Volver a Disponible
            </button>
          )}
        </div>
      </div>

      {/* Modales hijos */}
      <QRModal        open={showQR}     onClose={() => setShowQR(false)}     tool={tool}/>
      <UploadCertModal open={showUpload} onClose={() => setShowUpload(false)} onSave={handleUploadCert} tool={tool}/>
      <ReturnModal    open={showReturn} onClose={() => setShowReturn(false)} onConfirm={handleReturn}
        tool={tool} user={user} holder={holder}/>
      <ConfirmModal
        open={confirm === "delete"} onClose={() => setConfirm(null)}
        onConfirm={handleDelete}
        title="Eliminar herramienta"
        body={<>Estás por eliminar <b>{tool.name}</b>. El historial quedará en el sistema.</>}
        confirmLabel="Sí, eliminar" danger/>
    </Sheet>
  );
}

Object.assign(window, { ToolFormModal, ToolDetail, QRModal, UploadCertModal, ReturnModal });
