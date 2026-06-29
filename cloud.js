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
