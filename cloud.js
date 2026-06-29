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
    async agregarHijo({ nombre, curso, colegio }) {
      const u = await VFX.usuario(); if (!u) throw new Error('Sin sesión');
      const login_code = (nombre || 'NIÑO').slice(0, 3).toUpperCase() +
                         Math.floor(1000 + Math.random() * 9000);
      const { data, error } = await sb.from('students')
        .insert({ parent_id: u.id, nombre, curso, colegio, login_code })
        .select().single();
      if (error) throw error; return data;
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

    // ---------- AVANCE (lo escribe la app del niño; lo lee el panel) ----------
    // Estudiante "activo" en este dispositivo (lo fija el apoderado desde el panel)
    studentActivo() { try { return localStorage.getItem('vfx_student') || null; } catch (e) { return null; } },
    studentActivoNombre() { try { return localStorage.getItem('vfx_student_nombre') || ''; } catch (e) { return ''; } },
    setStudentActivo(id, nombre) {
      try { localStorage.setItem('vfx_student', id); if (nombre) localStorage.setItem('vfx_student_nombre', nombre); } catch (e) {}
    },
    // Guarda un evento de avance usando el estudiante activo + la sesión actual. "Fire and forget".
    async logAvance(ev) {
      try {
        const sid = VFX.studentActivo(); if (!sid) return;
        const s = await VFX.sesion(); if (!s) return;
        VFX.registrarAvance(sid, ev);
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
    async adminCrearSuscripcion({ parent_id, student_id, plan_id, fecha_inicio, cobro_automatico }) {
      const { planes } = await VFX.adminTodo();
      const plan = planes.find(p => p.id === plan_id);
      const inicio = fecha_inicio || new Date().toISOString().slice(0, 10);
      const fila = {
        parent_id, student_id: student_id || null, plan_id,
        estado: 'activa',
        fecha_inicio: inicio,
        ultimo_pago: inicio,
        proximo_pago: VFX._sumaPeriodo(inicio, plan ? plan.periodo : 'mensual'),
        cobro_automatico: !!cobro_automatico,
      };
      const { data, error } = await sb.from('subscriptions').insert(fila).select().single();
      if (error) throw error;
      if (plan) await VFX.adminRegistrarPago({ subscription_id: data.id, monto_clp: plan.precio_clp, periodo: plan.periodo, avanzar: false });
      return data;
    },
    async adminRegistrarPago({ subscription_id, monto_clp, periodo, avanzar = true }) {
      const u = await VFX.usuario();
      const hoy = new Date().toISOString().slice(0, 10);
      const { error } = await sb.from('payments').insert({
        subscription_id, monto_clp, fecha: hoy, metodo: 'transferencia', estado: 'pagado', marcado_por: u ? u.id : null,
      });
      if (error) throw error;
      if (avanzar) {
        await sb.from('subscriptions').update({
          estado: 'activa', ultimo_pago: hoy, proximo_pago: VFX._sumaPeriodo(hoy, periodo || 'mensual'),
        }).eq('id', subscription_id);
      }
    },
    async adminActualizarSub(id, campos) {
      const { error } = await sb.from('subscriptions').update(campos).eq('id', id);
      if (error) throw error;
    },
  };

  window.VFX = VFX;
  document.dispatchEvent(new Event('vfx-listo'));
})();
