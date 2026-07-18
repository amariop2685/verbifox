/* ============================================================
   VerbiFox · Conexión a la nube (Supabase)
   Config pública (segura): la protección real la dan las reglas RLS.
   Requiere haber cargado antes el script de supabase-js.
   ============================================================ */
window.VERBIFOX_SUPABASE_URL = 'https://ymvjsumdkmtgfnqercrt.supabase.co';
window.VERBIFOX_SUPABASE_KEY = 'sb_publishable_uW5H9qKGxxLDk9MoWVPQDg_dNuvYEuI';

(function () {
  if (!window.supabase || !window.supabase.createClient) {
    console.warn('[VerbiFox] supabase-js no cargó todavía.');
    return;
  }
  const sb = window.supabase.createClient(
    window.VERBIFOX_SUPABASE_URL,
    window.VERBIFOX_SUPABASE_KEY,
    { auth: { persistSession: true, autoRefreshToken: true } }
  );

  const VFX = {
    sb,

    // ---------- AUTENTICACIÓN (apoderado) ----------
    async registrar(email, password, nombre) {
      const { data, error } = await sb.auth.signUp({ email, password });
      if (error) throw error;
      // crea/actualiza su perfil
      if (data.user) await VFX.guardarPerfil({ nombre, email });
      return data;
    },
    async entrar(email, password) {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await VFX.guardarPerfil({ email });
      return data;
    },
    async salir() { await sb.auth.signOut(); },
    // ¿Hay una cuenta con este correo? (para mensajes de login claros)
    async emailExiste(email) {
      const { data, error } = await sb.rpc('existe_email', { p_email: email });
      if (error) throw error;
      return !!data;
    },
    // Recuperación de contraseña
    async recuperarClave(email) {
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: 'https://www.verbifox.cl/panel.html' });
      if (error) throw error;
    },
    async cambiarClave(nueva) {
      const { error } = await sb.auth.updateUser({ password: nueva });
      if (error) throw error;
    },
    alRecuperar(cb) { sb.auth.onAuthStateChange((e) => { if (e === 'PASSWORD_RECOVERY') cb(); }); },
    async sesion() { const { data } = await sb.auth.getSession(); return data.session; },
    async usuario() { const { data } = await sb.auth.getUser(); return data.user; },
    alCambiarSesion(cb) { sb.auth.onAuthStateChange((_e, s) => cb(s)); },

    // ---------- PERFIL ----------
    async guardarPerfil(campos) {
      const u = await VFX.usuario(); if (!u) return;
      const fila = { id: u.id, ...campos };
      if (!fila.email) fila.email = u.email;
      const { error } = await sb.from('profiles').upsert(fila);
      if (error) console.warn('perfil:', error.message);
    },
    async miPerfil() {
      const u = await VFX.usuario(); if (!u) return null;
      const { data } = await sb.from('profiles').select('*').eq('id', u.id).maybeSingle();
      return data;
    },

    // ---------- HIJOS ----------
    async misHijos() {
      const { data, error } = await sb.from('students').select('*').order('created_at');
      if (error) throw error; return data || [];
    },
    async agregarHijo({ nombre, curso, colegio, avatar }) {
      const u = await VFX.usuario(); if (!u) throw new Error('Sin sesión');
      // el PIN de 4 dígitos lo asigna la base de datos (único por niño)
      const fila = { parent_id: u.id, nombre, curso, colegio };
      if (avatar) fila.avatar = avatar;
      let r = await sb.from('students').insert(fila).select().single();
      if (r.error && avatar) { // por si la columna avatar aún no existe
        delete fila.avatar;
        r = await sb.from('students').insert(fila).select().single();
      }
      if (r.error) throw r.error; return r.data;
    },

    // ---------- SUSCRIPCIONES + PAGOS ----------
    async misSuscripciones() {
      const { data, error } = await sb.from('subscriptions')
        .select('*, plans(*), students(nombre)').order('created_at');
      if (error) throw error; return data || [];
    },
    async pagosDe(subId) {
      const { data, error } = await sb.from('payments')
        .select('*').eq('subscription_id', subId).order('fecha', { ascending: false });
      if (error) throw error; return data || [];
    },
    async planes() {
      const { data } = await sb.from('plans').select('*').eq('activo', true);
      return data || [];
    },
    // VerbiFox crea el pago con el monto del plan y redirige a Mercado Pago
    async suscribir(plan_id) {
      const s = await VFX.sesion();
      if (!s) { location.href = 'panel.html'; return; }
      try {
        const r = await fetch(window.VERBIFOX_SUPABASE_URL + '/functions/v1/crear-suscripcion', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + s.access_token, 'content-type': 'application/json' },
          body: JSON.stringify({ plan_id }),
        });
        const d = await r.json();
        if (d.init_point) { location.href = d.init_point; }
        else { alert('No se pudo iniciar el pago: ' + (d.error || 'intenta de nuevo')); }
      } catch (e) { alert('Error de conexión: ' + e.message); }
    },

    // ---------- AVANCE (lo escribe la app del niño; lo lee el panel) ----------
    // Estudiante "activo" en este dispositivo (lo fija el apoderado desde el panel)
    studentActivo() { try { return localStorage.getItem('vfx_student') || null; } catch (e) { return null; } },
    studentActivoNombre() { try { return localStorage.getItem('vfx_student_nombre') || ''; } catch (e) { return ''; } },
    setStudentActivo(id, nombre) {
      try { localStorage.setItem('vfx_student', id); if (nombre) localStorage.setItem('vfx_student_nombre', nombre); } catch (e) {}
    },
    // Guarda un evento de avance usando el estudiante activo (sesión del papá o código del niño).
    async logAvance(ev) {
      try {
        const sid = VFX.studentActivo(); if (!sid) return;
        const s = await VFX.sesion();
        if (s) { VFX.registrarAvance(sid, ev); return; }
        const code = VFX.codigoActivo();
        if (code) sb.rpc('avance_codigo', { p_code: code, p_materia: ev.materia || null, p_app: ev.app || null, p_tipo: ev.tipo || null, p_correcto: !!ev.correcto, p_tiempo: ev.tiempo_ms || null });
      } catch (e) { /* sin conexión: el juego sigue igual */ }
    },
    async registrarAvance(studentId, ev) {
      // ev: { materia, app, tipo, oa_codigo, correcto, tiempo_ms, detalle }
      const { error } = await sb.from('progress_events')
        .insert({ student_id: studentId, ...ev });
      if (error) console.warn('avance:', error.message);
    },
    async resumenAvance(studentId, dias = 30) {
      const { data, error } = await sb.from('progress_events')
        .select('materia, correcto, tiempo_ms, created_at, tipo')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(2000);
      if (error) throw error;
      const evs = data || [];
      const porMateria = {};
      for (const e of evs) {
        const m = e.materia || 'otros';
        porMateria[m] = porMateria[m] || { total: 0, correctos: 0, tiempo: 0 };
        porMateria[m].total++;
        if (e.correcto) porMateria[m].correctos++;
        porMateria[m].tiempo += (e.tiempo_ms || 0);
      }
      return { total: evs.length, porMateria, ultimos: evs.slice(0, 20) };
    },

    // ---------- ARMADURA / INVENTARIO + RECOMPENSAS REALES ----------
    async guardarInventario(studentId, inv) {
      const fila = {
        student_id: studentId,
        piezas: inv.piezas || {},
        gemas: inv.gemas || 0,
        valor: inv.valor || 0,
        updated_at: new Date().toISOString(),
      };
      const { error } = await sb.from('inventario').upsert(fila, { onConflict: 'student_id' });
      if (error) console.warn('inventario:', error.message);
    },
    async miInventario(studentId) {
      const { data } = await sb.from('inventario').select('*').eq('student_id', studentId).maybeSingle();
      return data || { piezas: {}, gemas: 0, valor: 0 };
    },
    // Recompensa REAL (sobre/vale) que el papá entrega
    async crearRecompensa(studentId, { tipo, motivo }) {
      const { error } = await sb.from('recompensas').insert({ student_id: studentId, tipo: tipo || 'sobre', motivo: motivo || null });
      if (error) console.warn('recompensa:', error.message);
    },
    async recompensasDe(studentId) {
      const { data } = await sb.from('recompensas').select('*').eq('student_id', studentId).order('created_at', { ascending: false });
      return data || [];
    },
    async marcarRecompensa(id, estado) {
      const { error } = await sb.from('recompensas').update({ estado, entregado_at: estado === 'entregado' ? new Date().toISOString() : null }).eq('id', id);
      if (error) throw error;
    },

    // ---------- AVANCE EN LA NUBE (multi-dispositivo) + MODO CÓDIGO DEL NIÑO ----------
    _SYNC_PREFIJOS: ['vfx_ml_','vfx_seen_','vfx_lec_','vfx_prac_','vfx_exsc_','vfx_examok_','vfx_bonus_','vfx_caballero','vfx_ruta','vfx_curso','mate_','verbos_','memoria_','jugador','vozIngles','dialecto'],
    _snapEstado() {
      const o = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (VFX._SYNC_PREFIJOS.some(p => k === p || k.indexOf(p) === 0)) o[k] = localStorage.getItem(k);
      }
      return o;
    },
    _aplicarEstado(o) {
      if (!o || !Object.keys(o).length) return;
      const del = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (VFX._SYNC_PREFIJOS.some(p => k === p || k.indexOf(p) === 0)) del.push(k);
      }
      del.forEach(k => { try { localStorage.removeItem(k); } catch (e) {} });
      for (const k of Object.keys(o)) { try { localStorage.setItem(k, o[k]); } catch (e) {} }
    },
    codigoActivo() { try { return localStorage.getItem('vfx_code') || null; } catch (e) { return null; } },
    // El niño entra con su código (sin cuenta): baja su avance de la nube y queda activo
    async entrarConCodigo(code) {
      code = (code || '').toUpperCase().trim();
      const { data, error } = await sb.rpc('nino_por_codigo', { p_code: code });
      if (error) throw error;
      if (!data) return null;
      try { const r = await sb.rpc('estado_por_codigo', { p_code: code }); if (r.data) VFX._aplicarEstado(r.data); } catch (e) {}
      try {
        localStorage.setItem('vfx_code', code);
        localStorage.setItem('vfx_code_info', JSON.stringify(data));
        localStorage.setItem('jugador', data.nombre || '');
        const m = String(data.curso || '').match(/[1-6]/); if (m) localStorage.setItem('vfx_curso', m[0] + '°');
      } catch (e) {}
      VFX.setStudentActivo(data.id, data.nombre);
      return data;
    },
    // Con sesión del apoderado: bajar el avance del niño elegido
    async cargarEstadoNube(studentId) {
      try {
        const { data } = await sb.from('estado_estudiante').select('estado').eq('student_id', studentId).maybeSingle();
        if (data && data.estado && Object.keys(data.estado).length) VFX._aplicarEstado(data.estado);
      } catch (e) {}
    },
    // Subir el avance actual (sesión del papá o código del niño)
    async subirEstadoNube() {
      const sid = VFX.studentActivo(); if (!sid) return;
      const estado = VFX._snapEstado();
      try {
        const s = await VFX.sesion();
        if (s) { await sb.from('estado_estudiante').upsert({ student_id: sid, estado, updated_at: new Date().toISOString() }); return; }
        const code = VFX.codigoActivo();
        if (code) await sb.rpc('guardar_estado_codigo', { p_code: code, p_estado: estado });
      } catch (e) {}
    },
    // Leer el estado guardado de un hijo (sesión del apoderado)
    async estadoHijo(studentId) {
      const { data } = await sb.from('estado_estudiante').select('estado').eq('student_id', studentId).maybeSingle();
      return (data && data.estado) || {};
    },
    // El apoderado ajusta preferencias del niño (ej: voz del relator) sin pisar su avance
    async ajustarEstadoHijo(studentId, parche) {
      const { data } = await sb.from('estado_estudiante').select('estado').eq('student_id', studentId).maybeSingle();
      const estado = Object.assign({}, (data && data.estado) || {}, parche);
      const { error } = await sb.from('estado_estudiante').upsert({ student_id: studentId, estado, updated_at: new Date().toISOString() });
      if (error) throw error;
      return estado;
    },

    // ---------- ACCESO / CANDADO POR SUSCRIPCIÓN ----------
    // Materias desbloqueadas para un estudiante (según sus suscripciones activas o de cortesía)
    async misMaterias(studentId) {
      const { data, error } = await sb.from('subscriptions').select('estado, student_id, plans(materias, curso)');
      if (error) throw error;
      const set = new Set(); let grado = null;
      for (const sub of (data || [])) {
        if (sub.estado !== 'activa') continue;                     // cortesía también queda 'activa'
        if (sub.student_id && studentId && sub.student_id !== studentId) continue;
        const pl = sub.plans;
        if (pl) { (pl.materias || []).forEach(m => set.add(m)); if (pl.curso && !grado) grado = pl.curso; }
      }
      return { materias: [...set], grado };
    },
    // Devuelve 'ok' | 'locked' | 'sin-sesion' para una materia
    // Estado de acceso: sesión, admin, materias pagadas y prueba de 7 días
    async estadoAcceso(studentId) {
      let u = null; try { u = await VFX.usuario(); } catch (e) {}
      if (!u) {
        // Modo código del niño: el candado usa el plan (y la prueba de 7 días) del papá
        const code = VFX.codigoActivo();
        if (code) {
          try {
            const { data } = await sb.rpc('acceso_codigo', { p_code: code });
            if (data) return { materias: data.materias || [], trialActivo: !!data.trialActivo, diasRestantes: data.diasRestantes || 0 };
          } catch (e) {}
        }
        return { sinSesion: true };
      }
      try { if (await VFX.soyAdmin()) return { admin: true, materias: ['*'] }; } catch (e) {}
      let materias = [];
      try { const r = await VFX.misMaterias(studentId); materias = r.materias; } catch (e) {}
      let trialActivo = false, diasRestantes = 0;
      try {
        const p = await VFX.miPerfil();
        if (p && p.created_at) {
          const dias = (Date.now() - new Date(p.created_at).getTime()) / 86400000;
          diasRestantes = Math.max(0, Math.ceil(7 - dias));
          trialActivo = dias < 7;
        }
      } catch (e) {}
      return { materias, trialActivo, diasRestantes };
    },
    async accesoMateria(materia) {
      let e; try { e = await VFX.estadoAcceso(VFX.studentActivo()); } catch (err) { return 'ok'; }
      if (e.sinSesion) return 'sin-sesion';
      if (e.admin) return 'ok';
      if (e.materias && (e.materias.includes('*') || e.materias.includes(materia))) return 'ok';
      if (e.trialActivo) return 'trial';
      return 'locked';
    },
    _bannerTrial(dias) {
      if (document.getElementById('vfx-trial')) return;
      const b = document.createElement('div');
      b.id = 'vfx-trial';
      b.style.cssText = 'position:fixed;left:0;right:0;bottom:0;background:#26303b;color:#fff;padding:9px 14px;z-index:99998;text-align:center;font-family:-apple-system,sans-serif;font-size:.85rem';
      b.innerHTML = `🎁 Prueba gratis: <b>${dias} día${dias===1?'':'s'}</b> restante${dias===1?'':'s'}. <a href="planes.html" style="color:#ffd23f;font-weight:800;text-decoration:none">Suscríbete ▶</a>`;
      document.body.appendChild(b);
    },
    // Si no tiene acceso, muestra pantalla de bloqueo (o banner de prueba). Devuelve true si bloqueó.
    async bloquearSi(materia) {
      if (document.getElementById('vfx-gate')) return true;
      let e; try { e = await VFX.estadoAcceso(VFX.studentActivo()); } catch (err) { return false; }
      const tiene = e.admin || (e.materias && (e.materias.includes('*') || e.materias.includes(materia)));
      if (tiene) return false;
      if (e.trialActivo) { VFX._bannerTrial(e.diasRestantes); return false; } // prueba activa: deja pasar
      if (document.getElementById('vfx-gate')) return true;
      const nombreMat = { matematicas: 'Matemática', ingles: 'Inglés', ciencias: 'Ciencias Naturales', historia: 'Historia y Geografía', lenguaje: 'Lenguaje', orientacion: 'Orientación', tecnologia: 'Tecnología', artes: 'Artes Visuales', musica: 'Música', edfisica: 'Educación Física' }[materia] || materia;
      const sinSesion = !!e.sinSesion;
      const tienePlan = e.materias && e.materias.length > 0;
      let cuerpo;
      if (sinSesion) {
        cuerpo = `<h2 style="margin:8px 0;color:#26303b">🎁 Prueba gratis 7 días</h2>
          <p style="color:#5a6b7a">Crea tu cuenta de apoderado y prueba <b>todo gratis por 7 días</b>. Sin tarjeta.</p>
          <a href="panel.html" style="display:block;background:#ff7a18;color:#fff;text-decoration:none;padding:14px;border-radius:14px;font-weight:800;margin-top:14px">Crear cuenta y empezar ▶</a>
          <a href="planes.html" style="display:block;color:#ff7a18;text-decoration:none;font-weight:700;margin-top:12px">Ver planes</a>`;
      } else if (tienePlan) {
        cuerpo = `<h2 style="margin:8px 0;color:#26303b">${nombreMat} no está en tu plan</h2>
          <p style="color:#5a6b7a">Amplía tu plan para acceder a esta materia.</p>
          <a href="planes.html" style="display:block;background:#ff7a18;color:#fff;text-decoration:none;padding:14px;border-radius:14px;font-weight:800;margin-top:14px">Ver planes ▶</a>
          <a href="inicio.html" style="display:block;color:#ff7a18;text-decoration:none;font-weight:700;margin-top:12px">← Mis materias</a>`;
      } else {
        cuerpo = `<h2 style="margin:8px 0;color:#26303b">Tu prueba de 7 días terminó 🌟</h2>
          <p style="color:#5a6b7a">¡Esperamos que la hayan disfrutado! Suscríbete para seguir aprendiendo sin límites.</p>
          <a href="planes.html" style="display:block;background:#ff7a18;color:#fff;text-decoration:none;padding:14px;border-radius:14px;font-weight:800;margin-top:14px">Ver planes ▶</a>
          <a href="panel.html" style="display:block;color:#ff7a18;text-decoration:none;font-weight:700;margin-top:12px">Ir a mi panel</a>`;
      }
      const div = document.createElement('div');
      div.id = 'vfx-gate';
      div.style.cssText = 'position:fixed;inset:0;background:linear-gradient(135deg,#ff7a18,#ff9d4d);z-index:100000;display:flex;align-items:center;justify-content:center;padding:20px;font-family:-apple-system,BlinkMacSystemFont,sans-serif';
      div.innerHTML = `<div style="background:#fff;border-radius:22px;padding:30px 24px;max-width:400px;text-align:center;box-shadow:0 14px 40px rgba(0,0,0,.25)"><div style="font-size:3rem">🦊</div>${cuerpo}</div>`;
      document.body.appendChild(div);
      return true;
    },

    // ---------- BUZÓN PQRS / SOPORTE ----------
    async crearTicket({ nombre, email, tipo, asunto, mensaje }) {
      const u = await VFX.usuario();
      const fila = {
        parent_id: u ? u.id : null,
        nombre: nombre || (u ? null : null),
        email: email || (u ? u.email : null),
        tipo: tipo || 'problema', asunto: asunto || null, mensaje,
      };
      const { error } = await sb.from('tickets').insert(fila);
      if (error) throw error;
    },
    async adminTickets() {
      const { data, error } = await sb.from('tickets').select('*').order('created_at', { ascending: false });
      if (error) throw error; return data || [];
    },
    async adminResponderTicket(id, campos) {
      const { error } = await sb.from('tickets').update(campos).eq('id', id);
      if (error) throw error;
    },

    // ---------- ADMINISTRADOR ----------
    async soyAdmin() {
      try { const { data } = await sb.rpc('is_admin'); return !!data; }
      catch (e) { return false; }
    },
    async adminTodo() {
      const [pf, st, su, pl] = await Promise.all([
        sb.from('profiles').select('*'),
        sb.from('students').select('*'),
        sb.from('subscriptions').select('*'),
        sb.from('plans').select('*'),
      ]);
      const planes = pl.data || [];
      const subs = (su.data || []).map(s => ({ ...s, plan: planes.find(p => p.id === s.plan_id) }));
      const apoderados = (pf.data || []).map(p => ({
        ...p,
        hijos: (st.data || []).filter(x => x.parent_id === p.id),
        subs: subs.filter(x => x.parent_id === p.id),
      }));
      return { apoderados, planes };
    },
    _sumaPeriodo(fechaISO, periodo) {
      const d = new Date((fechaISO || new Date().toISOString().slice(0,10)) + 'T00:00:00');
      if (periodo === 'anual') d.setFullYear(d.getFullYear() + 1);
      else d.setMonth(d.getMonth() + 1);
      return d.toISOString().slice(0, 10);
    },
    // Atómico en el servidor: crea la suscripción + registra el pago en UNA transacción.
    async adminCrearSuscripcion({ parent_id, student_id, plan_id, fecha_inicio, cobro_automatico, cortesia }) {
      const { data, error } = await sb.rpc('admin_activar_suscripcion', {
        p_parent: parent_id, p_student: student_id || null, p_plan: plan_id,
        p_inicio: fecha_inicio || null, p_cobro: !!cobro_automatico, p_cortesia: !!cortesia,
      });
      if (error) throw error;
      return data;
    },
    // Atómico: registra el pago + extiende la vigencia en UNA transacción.
    async adminRegistrarPago({ subscription_id, monto_clp }) {
      const { error } = await sb.rpc('admin_registrar_pago', { p_sub: subscription_id, p_monto: monto_clp || 0 });
      if (error) throw error;
    },
    async adminActualizarSub(id, campos) {
      const { error } = await sb.from('subscriptions').update(campos).eq('id', id);
      if (error) throw error;
    },
  };

  window.VFX = VFX;
  // Auto-guardado del avance en la nube: cada 20s si algo cambió, y al salir de la página
  let _lastSnap = '';
  setInterval(() => {
    try {
      if (!VFX.studentActivo()) return;
      const j = JSON.stringify(VFX._snapEstado());
      if (j !== _lastSnap) { _lastSnap = j; VFX.subirEstadoNube(); }
    } catch (e) {}
  }, 20000);
  window.addEventListener('pagehide', () => { try { VFX.subirEstadoNube(); } catch (e) {} });
  document.dispatchEvent(new Event('vfx-listo'));
})();
