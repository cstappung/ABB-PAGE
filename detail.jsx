/* ToolVault — Add/Edit Tool modal + Tool Detail sheet + Upload Cert modal
   ============================================================ */
const { useState: useSD, useMemo: useMD, useEffect: useED } = React;

/* ============================================================
   ADD / EDIT TOOL MODAL
   ============================================================ */
function ToolFormModal({ open, onClose, onSave, initial, user }) {
  const isEdit = !!initial;
  const [form, setForm] = useSD({
    name: "", location: "", status: "Disponible", observations: "",
    certDue: "", certFile: null, img: null,
  });

  useED(() => {
    if (open) {
      if (initial) {
        setForm({
          name: initial.name || "",
          location: initial.location || "",
          status: initial.status || "Disponible",
          observations: initial.observations || "",
          certDue: initial.certDue || "",
          certFile: null,
          img: initial.img || null,
        });
      } else {
        setForm({
          name: "", location: "", status: "Disponible", observations: "",
          certDue: "", certFile: null, img: null,
        });
      }
    }
  }, [open, initial]);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e?.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? "Editar herramienta" : "Agregar herramienta"}
      subtitle={isEdit ? `Editando · ${initial?.name}` : "Completa los datos del nuevo equipo"}
      footer={<>
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className="btn primary" onClick={submit} disabled={!form.name.trim()}>
          {isEdit ? "Guardar cambios" : "Crear herramienta"}
        </button>
      </>}
    >
      <form onSubmit={submit}>
        <div className="form-grid">
          <div className="field full">
            <label>Nombre de la herramienta <span className="req">*</span></label>
            <input className="input" autoFocus value={form.name} placeholder="ej: Megóhmetro Digital 10kV"
              onChange={(e) => update("name", e.target.value)}/>
          </div>

          <div className="field">
            <label>Ubicación dentro del almacén <span className="req">*</span></label>
            <input className="input" value={form.location} placeholder="ej: Estante A-04 · Bahía 2"
              onChange={(e) => update("location", e.target.value)}/>
          </div>

          <div className="field">
            <label>Estado inicial <span className="req">*</span></label>
            <Select value={form.status} onChange={(v) => update("status", v)} options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}/>
          </div>

          <div className="field full">
            <label>Imagen de la herramienta o ubicación</label>
            <FileDrop
              kind="image"
              accept="image/*"
              label="Arrastra una imagen o haz click"
              hint="PNG, JPG · referencia del equipo o del lugar donde se guarda"
              value={form.img}
              onChange={(v) => update("img", v)}
            />
          </div>

          <div className="field">
            <label>Certificación vigente (PDF o imagen)</label>
            <FileDrop
              kind="cert"
              accept=".pdf,image/*"
              label="Subir certificado"
              hint="PDF o imagen escaneada"
              value={form.certFile}
              onChange={(v) => update("certFile", v)}
            />
          </div>

          <div className="field">
            <label>Fecha de vencimiento del certificado <span className="req">*</span></label>
            <input className="input" type="date" value={form.certDue}
              onChange={(e) => update("certDue", e.target.value)}/>
            {form.certDue && (
              <div className="hint">
                <CertBadge dueDate={form.certDue}/>
              </div>
            )}
          </div>

          <div className="field full">
            <label>Observaciones (opcional)</label>
            <textarea className="textarea" value={form.observations} placeholder="Notas, accesorios, condiciones especiales..."
              onChange={(e) => update("observations", e.target.value)}/>
          </div>
        </div>
        {!isEdit && (
          <div style={{ marginTop: 14, padding: 12, background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 10, display: "flex", gap: 10, alignItems: "center", fontSize: 12, color: "var(--ink-3)" }}>
            <Avatar name={user.name} size="sm"/>
            <span>Quedará registrado como creador: <b style={{ color: "var(--ink-2)" }}>{user.name}</b> · {fmtDateTime(new Date().toISOString())}</span>
          </div>
        )}
      </form>
    </Modal>
  );
}

/* ============================================================
   UPLOAD CERTIFICATE MODAL
   ============================================================ */
function UploadCertModal({ open, onClose, onSave, tool }) {
  const [file, setFile] = useSD(null);
  const [issued, setIssued] = useSD(new Date().toISOString().slice(0, 10));
  const [due, setDue] = useSD("");

  useED(() => {
    if (open) {
      setFile(null);
      setIssued(new Date().toISOString().slice(0, 10));
      // suggest +12 months
      const d = new Date(); d.setFullYear(d.getFullYear() + 1);
      setDue(d.toISOString().slice(0, 10));
    }
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Subir nuevo certificado"
      subtitle={tool ? tool.name : ""}
      footer={<>
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className="btn primary" disabled={!due} onClick={() => onSave({ file, issued, due })}>
          Guardar certificado
        </button>
      </>}
    >
      <div style={{ marginBottom: 14, padding: 12, background: "var(--warn-soft)", border: "1px solid oklch(0.85 0.10 75)", borderRadius: 10, fontSize: 13, color: "oklch(0.40 0.12 75)" }}>
        El certificado actual quedará archivado como "reemplazado" — no se elimina nunca.
      </div>
      <div className="field">
        <label>Archivo del certificado (PDF o imagen)</label>
        <FileDrop accept=".pdf,image/*" kind="cert"
          label="Arrastra el PDF o haz click"
          hint="Quedará vinculado a la herramienta"
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
   RETURN MODAL (when returning on behalf of someone else)
   ============================================================ */
function ReturnModal({ open, onClose, onConfirm, tool, currentUser, holder }) {
  const [mode, setMode] = useSD("self");
  const [reason, setReason] = useSD("");

  useED(() => {
    if (open) {
      setMode(holder?.id === currentUser.id ? "self" : "behalf");
      setReason("");
    }
  }, [open, holder, currentUser]);

  const isOwn = holder?.id === currentUser.id;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Devolver herramienta"
      subtitle={tool?.name}
      footer={<>
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className="btn primary" onClick={() => onConfirm({ mode, reason })}>Confirmar devolución</button>
      </>}
    >
      {isOwn ? (
        <div>
          <p style={{ margin: 0, color: "var(--ink-2)" }}>
            La herramienta volverá al estado <b>Disponible</b>. Quedará registrado en el historial con fecha y hora.
          </p>
        </div>
      ) : (
        <div>
          <p style={{ margin: "0 0 14px", color: "var(--ink-2)" }}>
            Esta herramienta la tiene actualmente <b>{holder?.name}</b>.
          </p>
          <div className="field">
            <label>¿Quién hace la devolución?</label>
            <div style={{ display: "grid", gap: 8 }}>
              <label style={{ display: "flex", gap: 10, padding: 10, border: "1px solid " + (mode==="self" ? "var(--accent)" : "var(--line)"), borderRadius: 10, cursor: "pointer", background: mode==="self" ? "var(--accent-soft-2)" : "transparent" }}>
                <input type="radio" name="rmode" checked={mode === "self"} onChange={() => setMode("self")} style={{ marginTop: 2 }}/>
                <div>
                  <div style={{ fontWeight: 600 }}>La devuelvo yo mismo</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{holder?.name} la dejó en mis manos.</div>
                </div>
              </label>
              <label style={{ display: "flex", gap: 10, padding: 10, border: "1px solid " + (mode==="behalf" ? "var(--accent)" : "var(--line)"), borderRadius: 10, cursor: "pointer", background: mode==="behalf" ? "var(--accent-soft-2)" : "transparent" }}>
                <input type="radio" name="rmode" checked={mode === "behalf"} onChange={() => setMode("behalf")} style={{ marginTop: 2 }}/>
                <div>
                  <div style={{ fontWeight: 600 }}>Devuelvo en nombre de {holder?.name?.split(" ")[0]}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Quedará trazabilidad de ambos usuarios.</div>
                </div>
              </label>
            </div>
          </div>
          <div className="field">
            <label>Motivo / observación (opcional)</label>
            <textarea className="textarea" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="ej: encontrada en bahía 3, sin novedad"/>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ============================================================
   TOOL DETAIL SHEET (slide-in)
   ============================================================ */
function ToolDetail({ tool, db, setDb, user, onClose, onEdit, logEvent, initialAction }) {
  const [showUpload, setShowUpload] = useSD(false);
  const [showReturn, setShowReturn] = useSD(false);
  const [showQR, setShowQR] = useSD(false);
  const [confirm, setConfirm] = useSD(null);
  const toast = useToast();

  useED(() => {
    if (initialAction === "cert") setShowUpload(true);
    if (initialAction === "qr") setShowQR(true);
  }, [initialAction]);

  if (!tool) return null;

  const userMap = Object.fromEntries(db.users.map((u) => [u.id, u]));
  const holder = userMap[tool.currentUser];
  const isHolder = holder && holder.id === user.id;

  // history of this tool
  const evts = db.events.filter((e) => e.toolId === tool.id);
  // certs for this tool
  const certs = db.certs.filter((c) => c.toolId === tool.id).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  const currentCert = certs.find((c) => c.status === "vigente") || certs[0];

  const updateTool = (patch, evt) => {
    const next = {
      ...db,
      tools: db.tools.map((t) => t.id === tool.id ? { ...t, ...patch, updatedAt: TV.now(), updatedBy: user.id } : t),
    };
    setDb(next);
    if (evt) logEvent(next, evt);
  };

  const takeForUse = () => {
    updateTool({ status: "En uso", currentUser: user.id, useStarted: TV.now() }, {
      toolId: tool.id, type: "use", userId: user.id, at: TV.now(),
      detail: { from: tool.status, to: "En uso" },
    });
    toast("Marcada como en uso", "success");
  };

  const handleReturn = ({ mode, reason }) => {
    const onBehalfOf = mode === "behalf" ? tool.currentUser : null;
    updateTool({ status: "Disponible", currentUser: null, useStarted: null }, {
      toolId: tool.id, type: "return", userId: user.id, at: TV.now(),
      detail: { from: "En uso", to: "Disponible", onBehalfOf, reason },
    });
    setShowReturn(false);
    toast("Herramienta devuelta", "success");
  };

  const handleUploadCert = ({ file, issued, due }) => {
    const oldCertId = tool.currentCertId;
    const newCertId = "c_" + TV.uid();
    const newCerts = db.certs.map((c) => c.id === oldCertId ? { ...c, status: "reemplazado" } : c);
    newCerts.push({
      id: newCertId, toolId: tool.id,
      uploadedAt: TV.now(), uploadedBy: user.id,
      issuedDate: issued, dueDate: due,
      filename: file?.name || ("cert-" + tool.name.toLowerCase().replace(/\s+/g, "-") + ".pdf"),
      status: "vigente",
    });
    const next = {
      ...db,
      certs: newCerts,
      tools: db.tools.map((t) => t.id === tool.id ? { ...t, certDue: due, certIssued: issued, currentCertId: newCertId, updatedAt: TV.now(), updatedBy: user.id } : t),
    };
    setDb(next);
    logEvent(next, {
      toolId: tool.id, type: "cert", userId: user.id, at: TV.now(),
      detail: { field: "certDue", oldValue: tool.certDue, newValue: due, filename: file?.name },
    });
    setShowUpload(false);
    toast("Certificado actualizado", "success");
  };

  const handleDelete = () => {
    const next = {
      ...db,
      tools: db.tools.filter((t) => t.id !== tool.id),
    };
    setDb(next);
    toast("Herramienta eliminada", "success");
    onClose();
  };

  return (
    <Sheet open={!!tool} onClose={onClose}>
      <div className="sheet-h">
        <div>
          <div className="t">{tool.name}</div>
          <div className="s">ID {tool.id} · creada {fmtDate(tool.createdAt)}</div>
        </div>
        <div className="row">
          <button className="btn sm" onClick={() => setShowQR(true)} title="Código QR"><Icon.QR size={14}/><span className="hide-xs">QR</span></button>
          <button className="btn sm" onClick={onEdit}><Icon.Edit/><span className="hide-xs">Editar</span></button>
          <button className="modal-close" onClick={onClose}><Icon.Close/></button>
        </div>
      </div>

      <div className="sheet-b">
        <div className="detail-hero">
          <ToolImage tool={tool} kind="hero"/>
          <span style={{
            position: "absolute", top: 16, right: 16,
            display: "inline-flex", gap: 8,
          }}>
            <StatusPill status={tool.status}/>
            <CertBadge dueDate={tool.certDue}/>
          </span>
          {holder && (
            <span style={{
              position: "absolute", bottom: 16, left: 16,
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "oklch(0 0 0 / 0.7)", backdropFilter: "blur(8px)",
              color: "#fff", padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600,
            }}>
              <Avatar name={holder.name} size="sm"/>
              En uso por {holder.name}
              {tool.useStarted && <span style={{ color: "oklch(1 0 0 / 0.6)", fontFamily: "var(--mono)", fontSize: 11, marginLeft: 4 }}>· hace {fmtAgo(tool.useStarted).replace("hace ", "")}</span>}
            </span>
          )}
        </div>

        <div className="detail-meta">
          <div>
            <div className="k">Ubicación</div>
            <div className="v"><Icon.Pin size={13} style={{ display: "inline", marginRight: 4, color: "var(--accent)" }}/> {tool.location || "—"}</div>
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
            <div className="k">Cert. emitido</div>
            <div className="v mono">{fmtDate(tool.certIssued)}</div>
          </div>
          <div>
            <div className="k">Creado por</div>
            <div className="v">{userMap[tool.createdBy]?.name || "—"}</div>
          </div>
          <div>
            <div className="k">Última edición</div>
            <div className="v">{userMap[tool.updatedBy]?.name || "—"} · <span style={{ fontFamily: "var(--mono)", fontWeight: 500, color: "var(--ink-3)" }}>{fmtAgo(tool.updatedAt)}</span></div>
          </div>
        </div>

        {tool.observations && (
          <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--line)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Observaciones</div>
            <div style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55 }}>{tool.observations}</div>
          </div>
        )}

        {/* Current cert */}
        <div className="section-h">
          <span>Certificado actual</span>
          <button className="btn sm" onClick={() => setShowUpload(true)}><Icon.Upload size={12}/> Subir nuevo</button>
        </div>
        {currentCert && (
          <div style={{ padding: "0 24px 16px" }}>
            <div className="file-pill" style={{ padding: 12 }}>
              <div className="ico" style={{ width: 38, height: 38 }}><Icon.Cert/></div>
              <div className="grow">
                <div className="name">{currentCert.filename}</div>
                <div className="meta">
                  vence {fmtDate(currentCert.dueDate)} ·
                  subido {fmtDate(currentCert.uploadedAt)} por {userMap[currentCert.uploadedBy]?.name || "—"}
                </div>
              </div>
              <button className="btn sm ghost" title="Ver"><Icon.Eye/></button>
              <button className="btn sm ghost" title="Descargar"><Icon.Download/></button>
            </div>
          </div>
        )}

        {/* Cert history */}
        {certs.length > 1 && (
          <>
            <div className="section-h"><span>Historial de certificados</span><span style={{ color: "var(--ink-4)", fontFamily: "var(--mono)" }}>{certs.length - 1} previo{certs.length-1>1?"s":""}</span></div>
            <div style={{ padding: "0 24px 16px" }}>
              {certs.filter((c) => c.id !== currentCert?.id).map((c) => (
                <div key={c.id} style={{
                  display: "grid", gridTemplateColumns: "36px 1fr auto", gap: 12, alignItems: "center",
                  padding: 10, border: "1px solid var(--line)", borderRadius: 10, marginBottom: 6,
                  background: "var(--surface-2)",
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--muted-soft)", display: "grid", placeItems: "center", color: "var(--ink-3)" }}>
                    <Icon.Cert size={14}/>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{c.filename}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
                      Subido <span style={{ fontFamily: "var(--mono)" }}>{fmtDate(c.uploadedAt)}</span> · vencía <span style={{ fontFamily: "var(--mono)" }}>{fmtDate(c.dueDate)}</span> · por {userMap[c.uploadedBy]?.name}
                    </div>
                  </div>
                  <span className="badge muted">Reemplazado</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Event timeline */}
        <div className="section-h"><span>Historial completo</span><span style={{ color: "var(--ink-4)", fontFamily: "var(--mono)" }}>{evts.length} eventos</span></div>
        <div className="timeline">
          {evts.map((e) => {
            const u = userMap[e.userId];
            return (
              <div className={"timeline-item " + e.type} key={e.id}>
                <div className="dot"><EventIcon type={e.type}/></div>
                <div className="body">
                  <div className="l1">
                    <b>{u?.name}</b>{" "}<span style={{ color: "var(--ink-3)" }}>{eventVerb(e.type)} la herramienta</span>
                    {e.type === "edit" && e.detail?.field && (
                      <> · campo <span style={{ fontFamily: "var(--mono)", fontSize: 12, background: "var(--surface-2)", border: "1px solid var(--line)", padding: "1px 6px", borderRadius: 5 }}>{e.detail.field}</span>
                      {e.detail.oldValue !== undefined && (
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
                      {e.detail.reason && <span style={{ color: "var(--ink-3)" }}> — "{e.detail.reason}"</span>}
                      </>
                    )}
                  </div>
                  <div className="l2">
                    <span>{fmtDateTime(e.at)}</span>
                    <span className="sep"/>
                    <span>{u?.username}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="sheet-f">
        <button className="btn danger" onClick={() => setConfirm("delete")}>
          <Icon.Trash/> Eliminar
        </button>
        <div className="row">
          {tool.status === "Disponible" && (
            <button className="btn dark lg" onClick={takeForUse}>
              <Icon.User size={14}/> Marcar como En uso
            </button>
          )}
          {tool.status === "En uso" && isHolder && (
            <button className="btn primary lg" onClick={() => setShowReturn(true)}>
              <Icon.Check size={14}/> Devolver herramienta
            </button>
          )}
          {tool.status === "En uso" && !isHolder && (
            <button className="btn lg" onClick={() => setShowReturn(true)}>
              <Icon.Check size={14}/> Marcar como devuelta
            </button>
          )}
          {(tool.status === "En mantenimiento" || tool.status === "Fuera de servicio") && (
            <button className="btn dark lg" onClick={() => updateTool({ status: "Disponible" }, {
              toolId: tool.id, type: "edit", userId: user.id, at: TV.now(),
              detail: { field: "status", oldValue: tool.status, newValue: "Disponible" },
            })}>
              Volver a Disponible
            </button>
          )}
        </div>
      </div>

      <UploadCertModal open={showUpload} onClose={() => setShowUpload(false)} onSave={handleUploadCert} tool={tool}/>
      <ReturnModal open={showReturn} onClose={() => setShowReturn(false)} onConfirm={handleReturn} tool={tool} currentUser={user} holder={holder}/>
      <QRToolModal open={showQR} onClose={() => setShowQR(false)} tool={tool} orgName={db.config?.orgName}/>
      <ConfirmModal
        open={confirm === "delete"}
        onClose={() => setConfirm(null)}
        onConfirm={handleDelete}
        title="Eliminar herramienta"
        body={<>Estás por eliminar <b>{tool.name}</b>. Esta acción no se puede deshacer. El historial de eventos permanecerá registrado.</>}
        confirmLabel="Sí, eliminar"
        danger
      />
    </Sheet>
  );
}

Object.assign(window, { ToolFormModal, ToolDetail, UploadCertModal, ReturnModal });
