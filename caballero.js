/* ============================================================
   VerbiFox · El Caballero (compartido entre TODAS las materias)
   Una sola armadura, gemas, conquistas y sobres por niño.
   Estado local en 'vfx_caballero' (mismo origen = compartido por
   Matemática, Inglés, etc.) + sincroniza a la nube (VFX).
   ============================================================ */
(function(){
  const KEY='vfx_caballero';
  const ARMADURA=[
    {id:'casco',  n:'Casco',       e:'🪖', v:10},
    {id:'espada', n:'Espada',      e:'⚔️', v:15},
    {id:'escudo', n:'Escudo',      e:'🛡️', v:15},
    {id:'peto',   n:'Coraza',      e:'🐉', v:40},
    {id:'guantes',n:'Guanteletes', e:'🧤', v:10},
    {id:'botas',  n:'Botas',       e:'🥾', v:10},
    {id:'capa',   n:'Capa',        e:'🧥', v:20},
    {id:'caballo',n:'Caballo',     e:'🐎', v:50},
  ];
  const MAX=5;
  const COSTO=[4,6,8,10];
  const CONECT=['',' de Recluta',' del Escudero',' del Guardián',' del Capitán',' del Héroe'];

  let S=null, lastEl=null;
  function load(){
    if(S) return S;
    try{ S=JSON.parse(localStorage.getItem(KEY)); }catch(e){ S=null; }
    if(!S) S={};
    if(!S.piezas || Array.isArray(S.piezas)) S.piezas = Array.isArray(S.piezas)? Object.fromEntries(S.piezas.map(x=>[x,1])) : {};
    S.gemas=S.gemas||0; S.conquistas=S.conquistas||0; S.sobres=S.sobres||0; S.vales=S.vales||[];
    return S;
  }
  function valorPieza(p,niv){ return p.v*(niv||1); }
  function valorTotal(){ load(); let s=0; for(const p of ARMADURA){ const niv=S.piezas[p.id]; if(niv) s+=valorPieza(p,niv); } return s; }
  function nombrePieza(p,niv){ return p.n+(CONECT[niv]||''); }

  function syncCloud(){
    try{ if(window.VFX){ const sid=VFX.studentActivo&&VFX.studentActivo(); if(sid) VFX.guardarInventario(sid,{piezas:S.piezas,gemas:S.gemas,valor:valorTotal()}); } }catch(e){}
  }
  function save(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} syncCloud(); }

  function cbToast(msg){
    if(window.toast){ try{ window.toast(msg,'logro'); return; }catch(e){} }
    let box=document.getElementById('cb-toast');
    if(!box){ box=document.createElement('div'); box.id='cb-toast'; box.style.cssText='position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#26303b;color:#fff;padding:12px 18px;border-radius:12px;font-weight:700;z-index:99999;box-shadow:0 6px 20px rgba(0,0,0,.3);font-family:-apple-system,sans-serif'; document.body.appendChild(box); }
    box.textContent=msg; box.style.opacity='1';
    clearTimeout(box._t); box._t=setTimeout(()=>{ box.style.opacity='0'; }, 2200);
  }

  // Registrar una CONQUISTA (aprobar una evaluación en cualquier materia)
  function conquistar(motivo){
    load();
    S.conquistas++; S.gemas+=2;
    const piezaNueva = ARMADURA.find(p=>!S.piezas[p.id]) || null;
    if(piezaNueva) S.piezas[piezaNueva.id]=1;
    let ganoSobre=false;
    if(S.conquistas%2===0){
      S.sobres++; ganoSobre=true;
      S.vales.push({ n:S.sobres, fecha:new Date().toLocaleDateString('es-CL'), motivo:motivo||'' });
      try{ if(window.VFX){ const sid=VFX.studentActivo&&VFX.studentActivo(); if(sid) VFX.crearRecompensa(sid,{tipo:'sobre', motivo:motivo||''}); } }catch(e){}
    }
    save();
    return { piezaNueva, ganoSobre, conquistas:S.conquistas, gemas:S.gemas };
  }

  function mejorarPieza(id){
    load();
    const p=ARMADURA.find(x=>x.id===id), niv=S.piezas[id];
    if(!niv) return;
    if(niv>=MAX){ cbToast('¡Ya está al máximo! 🌟'); return; }
    const costo=COSTO[niv-1];
    if((S.gemas||0)<costo){ cbToast('Te faltan gemas 💎. ¡Sigue practicando!'); return; }
    S.gemas-=costo; S.piezas[id]=niv+1; save();
    try{ if(window.campana) window.campana(); }catch(e){}
    cbToast('⬆️ ¡'+nombrePieza(p,niv+1)+'! Ahora vale 🪙 '+valorPieza(p,niv+1));
    if(lastEl) render(lastEl);
  }

  function piezaImg(p,niv){
    const c=[`img/armadura/${p.id}-${niv}.svg`,`img/armadura/${p.id}-${niv}.png`,`img/armadura/${p.id}.svg`,`img/armadura/${p.id}.png`];
    return `<img src="${c[0]}" alt="${p.n}" data-c='${JSON.stringify(c)}' data-i="0" data-emoji="${p.e}" style="width:52px;height:52px;object-fit:contain" onerror="armImgFallback(this)">`;
  }
  window.armImgFallback=function(img){
    let c=[]; try{ c=JSON.parse(img.dataset.c); }catch(e){}
    const i=parseInt(img.dataset.i||'0',10)+1;
    if(i<c.length){ img.dataset.i=i; img.src=c[i]; return; }
    const s=document.createElement('span'); s.style.fontSize='1.8rem'; s.textContent=img.dataset.emoji||'🛡️'; if(img.parentNode) img.replaceWith(s);
  };

  function render(el){
    if(!el) return; lastEl=el; load();
    const owned=ARMADURA.filter(p=>S.piezas[p.id]);
    const tot=ARMADURA.length, hechas=owned.length;
    const hero = S.piezas['caballo']?'🏇':(hechas>=4?'🧑‍🎤':'🧍');
    const grid=ARMADURA.map(p=>{
      const niv=S.piezas[p.id];
      if(!niv){ return `<div style="text-align:center;padding:12px 6px;border-radius:12px;background:#eef1f4;border:2px solid #dfe5ea;opacity:.55">
        <div style="font-size:1.8rem">🔒</div><div style="font-size:.74rem;font-weight:700;color:#5a6b7a">${p.n}</div><div style="font-size:.64rem;color:#9aa7b2">Por conquistar</div></div>`; }
      const val=valorPieza(p,niv), max=niv>=MAX, costo=max?null:COSTO[niv-1], puede=!max&&(S.gemas||0)>=costo;
      return `<div style="text-align:center;padding:12px 6px;border-radius:12px;background:#fff7e6;border:2px solid #ffb454">
        <div style="height:46px;display:flex;align-items:center;justify-content:center">${piezaImg(p,niv)}</div>
        <div style="font-size:.74rem;font-weight:800;color:#5a4a2a">${p.n}${CONECT[niv]||''}</div>
        <div style="font-size:.64rem;color:#b07b1e">${'⭐'.repeat(niv)}</div>
        <div style="font-weight:800;color:#7c4a03;margin:2px 0">🪙 ${val}</div>
        ${max?'<div style="font-size:.68rem;color:#2bb673;font-weight:800">¡AL MÁXIMO! 🌟</div>'
              :`<button ${puede?'':'disabled'} style="cursor:pointer;border:0;border-radius:8px;font-weight:700;margin:2px 0 0;padding:7px 8px;font-size:.72rem;color:#fff;background:${puede?'#2bb673':'#b6c0c9'}" onclick="Caballero.mejorarPieza('${p.id}')">⬆️ ${costo} 💎</button>`}
      </div>`;
    }).join('');
    el.innerHTML=`
      <div style="text-align:center;background:linear-gradient(135deg,#fff3dc,#ffe2b8);border-radius:16px;padding:18px;margin-bottom:12px">
        <div style="font-size:3.4rem">${hero}</div>
        <div style="font-weight:800;font-size:1.1rem;color:#7c4a03">Valor de tu armadura: 🪙 ${valorTotal()}</div>
        <div style="color:#9a6a1e;font-weight:600">💎 ${S.gemas||0} gemas · 🛡️ ${hechas}/${tot} piezas · 🏰 ${S.conquistas} conquistas</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px">${grid}</div>
      <p style="font-size:.8rem;color:#9aa7b2;text-align:center;margin-top:6px">Aprueba evaluaciones (Matemática, Inglés…) para ganar piezas. Con 💎 mejoras cada pieza. ¡Un solo caballero para todas tus materias! 🤝</p>`;
  }

  function valesHTML(){
    load();
    if(!S.vales.length) return '<p style="color:#9aa7b2;text-align:center">Aún no ganas sobres. ¡Consigue 2 conquistas y ganarás uno! 🎟️</p>';
    return S.vales.slice().reverse().map(v=>`<div style="background:#fff4e0;border-radius:12px;padding:12px;margin:8px 0">
      <div style="font-weight:800">🎟️ Vale N°${v.n} · Sobre del mundial</div>
      <div style="font-size:.85rem;color:#8a6d3a">${v.fecha||''} · ${v.motivo||''}</div>
      <div style="font-size:.8rem;color:#8a6d3a">👉 Pídeselo a papá (lo ve en su panel).</div></div>`).join('');
  }

  window.Caballero={ load, estado:load, conquistar, mejorarPieza, render, valesHTML, valorTotal, nombrePieza, ARMADURA };
  load();
})();
