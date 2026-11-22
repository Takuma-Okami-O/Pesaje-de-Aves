/* Pesaje de Aves - interfaz (100% offline, datos en el teléfono)
 * Desarrollado por Analista de sistemas Eber Romero */
(function () {
  'use strict';

  const C = window.Core;
  const XL = window.PesajeExcel;
  // Si license.js no llegó a cargar (archivo faltante, caché vieja, etc.), se usa
  // esta versión de respaldo que simplemente nunca bloquea: la licencia es un
  // añadido y JAMÁS debe poder tumbar la app de pesar aves.
  const L = window.License || {
    blankCache: function () { return { installedAt: '1970-01-01' }; },
    evaluate: function () { return { allowed: true, state: 'sin-modulo-licencia' }; },
    shouldTryNow: function () { return false; },
    parseFirestoreDoc: function () { return { active: true, validUntil: null, note: '' }; },
    mensaje: function () { return { t: 'Licencia no disponible', d: 'Contacta al administrador.' }; }
  };
  const KEY = 'pesajeAves.v1';
  const LKEY = 'pesajeAves.license.v1';
  const FIRMA = 'Desarrollado por Analista de sistemas Eber Romero';
  const app = document.getElementById('app');

  // ---------- Estado persistente ----------
  function blank() { return { v: 1, meta: 100, granja: '', galpones: {} }; }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const s = JSON.parse(raw); if (s && s.v === 1 && s.galpones) {
          if (s.granja === undefined) s.granja = s.lastNucleo || '';
          return s;
        } }
    } catch (e) { /* sin almacenamiento */ }
    return blank();
  }
  let state = load();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { toast('No se pudo guardar en el teléfono', true); }
  }

  // ---------- Utilidades ----------
  function esc(s) {
    return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function two(n) { return (n < 10 ? '0' : '') + n; }
  function today() { const d = new Date(); return d.getFullYear() + '-' + two(d.getMonth() + 1) + '-' + two(d.getDate()); }
  function $(s) { return document.querySelector(s); }
  // El usuario escribe kg; la app trabaja y muestra en gramos
  function kgToG(kg) { return Math.round(kg * 1000 * 10) / 10; }
  function fmtG(n) { return C.fmt(n, Math.abs(n - Math.round(n)) < 0.005 ? 0 : 1); }
  let toastTimer = null;
  function toast(msg, bad) {
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.className = (bad ? 'bad ' : '') + 'show';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = bad ? 'bad' : ''; }, bad ? 3800 : 2400);
  }
  function ensure(id) {
    if (!state.galpones[id]) {
      state.galpones[id] = { fecha: today(), edad: '', c: { A: [], B: [], C: [], D: [] } };
    }
    const g = state.galpones[id];
    if (!g.c) g.c = {};
    C.CORRALES.forEach(function (k) { if (!g.c[k]) g.c[k] = []; });
    return g;
  }
  function firma() { return '<div class="firma">' + esc(FIRMA.replace('Eber Romero', '')) + '<b>Eber Romero</b></div>'; }

  // ---------- Rutas ----------
  function route() {
    const p = (location.hash || '').replace(/^#\/?/, '').split('/');
    if (p[0] === 'g' && /^\d+$/.test(p[1]) && +p[1] >= 1 && +p[1] <= 12) {
      if (p[2] && C.CORRALES.indexOf(p[2]) >= 0) return { v: 'corral', id: +p[1], k: p[2] };
      return { v: 'galpon', id: +p[1] };
    }
    if (p[0] === 'granja') return { v: 'granja' };
    if (p[0] === 'respaldo') return { v: 'respaldo' };
    return { v: 'home' };
  }
  let lastRoute = '';
  function render() {
    const r = route();
    const key = r.v + (r.id || '') + (r.k || '');
    if (r.v === 'home') app.innerHTML = viewHome();
    else if (r.v === 'granja') app.innerHTML = viewGranja();
    else if (r.v === 'respaldo') app.innerHTML = viewRespaldo();
    else if (r.v === 'galpon') app.innerHTML = viewGalpon(r.id);
    else app.innerHTML = viewCorral(r.id, r.k);
    if (key !== lastRoute) { window.scrollTo(0, 0); lastRoute = key; }
    if (r.v === 'corral') bindCorral();
  }

  // ---------- Resumen de la granja ----------
  function farmCard() {
    const f = C.farmStats(state.galpones, state.meta);
    return '<a class="card big-card" href="#/granja" style="display:block;margin-bottom:14px;padding:12px">' +
      '<div class="lbl" style="font-size:12px;opacity:.85;text-transform:uppercase;letter-spacing:.05em">Peso promedio de la granja</div>' +
      '<div style="font-size:30px;font-weight:800;margin:2px 0">' + (f.prom !== null ? C.fmt(f.prom, 2) + ' g' : '—') + '</div>' +
      '<div style="font-size:12.5px;opacity:.85">' + f.conDatos + ' de 12 galpones con datos · toca para ver el resumen ›</div></a>';
  }
  function viewGranja() {
    const f = C.farmStats(state.galpones, state.meta);
    const faltan = f.rows.filter(function (r) { return r.s.totalAves === 0; }).map(function (r) { return r.id; });
    const incompletos = f.rows.filter(function (r) { return r.s.totalAves > 0 && r.s.completos < 4; }).map(function (r) { return r.id; });
    let avisos = '';
    if (f.conDatos > 0 && faltan.length) avisos += '<div class="warn">Sin datos todavía: galpón ' + faltan.join(', ') + '. Si otro teléfono los tiene, usa "Respaldo y combinar".</div>';
    if (incompletos.length) avisos += '<div class="warn">Corrales por debajo de la meta en: galpón ' + incompletos.join(', ') + '.</div>';
    const filas = f.rows.map(function (r) {
      const hay = r.s.totalAves > 0;
      return '<a class="ent" style="grid-template-columns:82px 1fr 1fr" href="#/g/' + r.id + '"><span class="n">Galpón ' + r.id + '</span>' +
        '<span>' + (hay ? C.fmt(r.s.totalAves, 0) + ' aves' : '<span style="color:var(--mut)">sin datos</span>') + '</span>' +
        '<span style="text-align:right"><b>' + (hay ? C.fmt(r.s.galpon, 2) + ' g' : '—') + '</b></span></a>';
    }).join('');
    return '<header class="top"><a class="ib" href="#/" aria-label="Volver">‹</a><div class="grow"><h1>Resumen de la granja</h1>' +
      '<p>' + esc(state.granja || 'Sin nombre de granja') + '</p></div></header>' +
      '<main><div class="card big-card"><div class="lbl">Peso promedio de la granja</div><div class="val">' +
      (f.prom !== null ? C.fmt(f.prom, 2) + ' g' : '—') + '</div><div class="sub">' + f.conDatos + ' de 12 galpones con datos · ' +
      C.fmt(f.totalAves, 0) + ' aves pesadas</div>' + avisos + '</div>' +
      '<div class="card"><h2>Por galpón</h2>' + filas + '</div>' +
      '<button class="btn primary big" data-act="export-all">📊 Generar Excel de la granja</button>' +
      '<a class="btn small mt" href="#/respaldo">🔄 Recibir datos de otro teléfono</a></main>' + firma();
  }

  // ---------- Vista: respaldo y combinar ----------
  function viewRespaldo() {
    const f = C.farmStats(state.galpones, state.meta);
    return '<header class="top"><a class="ib" href="#/" aria-label="Volver">‹</a><div class="grow"><h1>Respaldo y combinar</h1>' +
      '<p>Juntar datos de varios teléfonos</p></div></header><main>' +
      '<div class="card"><h2>1. Enviar mis datos</h2>' +
      '<div class="hintbox" style="margin-bottom:10px">Tienes <b>' + f.conDatos + ' galpones</b> con datos. Se envían como un mensaje de texto: no hace falta guardar ni buscar ningún archivo.</div>' +
      '<button class="btn primary big" data-act="send-code">📤 Enviar por WhatsApp (texto)</button>' +
      '<button class="btn small mt" data-act="copy-code">📋 Copiar código</button>' +
      '<button class="btn small mt" data-act="backup">💾 Guardar como archivo (.json)</button>' +
      '<div id="res" class="hint"></div></div>' +
      '<div class="card"><h2>2. Recibir datos de otro teléfono</h2>' +
      '<label>Pega aquí el mensaje recibido</label>' +
      '<textarea id="code-in" rows="4" placeholder="PESAJE1:..." style="width:100%;border:2px solid var(--line);border-radius:12px;padding:10px;font-size:14px;font-family:inherit"></textarea>' +
      '<button class="btn primary big mt" data-act="combine-code">🔗 Combinar</button>' +
      '<button class="btn small mt" data-act="combine">📁 Elegir archivo .json</button></div>' +
      '<div class="card"><h2>Restaurar (reemplaza todo)</h2><div class="hintbox" style="margin-bottom:10px">Para pasar todo a un teléfono nuevo. Borra lo que haya aquí y pone lo del archivo.</div>' +
      '<button class="btn danger small" data-act="restore">⬆ Restaurar desde archivo</button></div></main>' + firma();
  }
  function setRes(msg, bad) { const r = $('#res'); if (r) { r.textContent = msg; r.className = 'hint' + (bad ? ' bad' : ''); } }

  // ---------- Vista: inicio ----------
  function shedSvg() {
    return '<svg viewBox="0 0 100 100" aria-hidden="true">' +
      '<polygon points="4,38 50,7 96,38 96,95 4,95" style="fill:var(--f);stroke:var(--s);stroke-width:3.5;stroke-linejoin:round"/>' +
      '<path d="M4 38 L50 7 L96 38" style="fill:none;stroke:var(--s);stroke-width:6;stroke-linejoin:round;stroke-linecap:round"/></svg>';
  }
  function viewHome() {
    let tiles = '';
    for (let i = 1; i <= 12; i++) {
      const s = C.galponStats(state.galpones[i], state.meta);
      const st = s.totalAves === 0 ? 'empty' : (s.completos === 4 ? 'done' : 'prog');
      const dots = C.CORRALES.map(function (k) {
        const a = s.c[k].aves;
        return '<i class="dot ' + (a >= state.meta ? 'ok' : (a > 0 ? 'mid' : '')) + '">' + k + '</i>';
      }).join('');
      tiles += '<a class="shed ' + st + '" href="#/g/' + i + '">' + shedSvg() +
        '<div class="in"><span class="num">' + i + '</span><span class="avg">' +
        (s.galpon !== null ? C.fmt(s.galpon, 2) + ' g' : 'sin datos') + '</span></div>' +
        '<div class="dots">' + dots + '</div></a>';
    }
    return '<header class="top"><div class="grow"><h1>Pesaje de Aves</h1><p>Agroinversiones SAI-RAM, C.A</p></div>' +
      '<button class="ib" data-act="meta" aria-label="Meta de aves">⚙</button></header>' +
      '<main><div class="card" style="padding:10px 14px"><div style="font-size:13px;color:var(--mut)">Toca un galpón para pesar. ' +
      'Meta: <b>' + state.meta + ' aves</b> por corral. Todo se guarda en este teléfono, sin internet.</div></div>' +
      farmCard() +
      '<div class="sheds">' + tiles + '</div>' +
      '<button class="btn primary big" data-act="export-all">📊 Exportar todos a Excel</button>' +
      '<a class="btn small mt" href="#/respaldo" style="margin-bottom:10px">🔄 Respaldo y combinar datos de otros teléfonos</a>' +
      '<button class="btn danger small" data-act="clear-all">Nueva jornada (borrar todo)</button>' +
      '</main>' + firma();
  }

  // ---------- Vista: galpón ----------
  function feedHtml(g) {
    const edad = g ? g.edad : '';
    if (!(C.num(edad) >= 1)) return '';
    const P = C.projection(edad, g.poblacion, 7);
    if (!P) return '';
    const hoy = P.rows[0], pob = P.poblacion;
    let h = '<div class="card"><h2>Alimento estándar · día ' + hoy.d + '</h2>' +
      '<div style="font-size:15px;line-height:1.5">Por ave hoy: <b>' + C.fmt(hoy.ali, 0) + ' g</b> · acumulado desde el alojamiento: <b>' + C.fmt(hoy.acum, 0) + ' g</b></div>';
    if (pob) {
      h += '<div style="font-size:15px;line-height:1.5;margin-top:4px">Para <b>' + C.fmt(pob, 0) + ' aves</b>: hoy <b>' + C.fmt(hoy.aliGalpon, 1) +
        ' kg</b> · acumulado <b>' + C.fmt(hoy.acumGalpon, 0) + ' kg</b></div>';
    } else {
      h += '<div class="hintbox" style="margin:8px 0 0">Escribe las <b>aves en el galpón</b> para ver el consumo total en kg.</div>';
    }
    if (P.rows.length > 1) {
      let rows = '';
      P.rows.forEach(function (r, i) {
        rows += '<tr' + (i === 0 ? ' class="hl"' : '') + '><td>' + (i === 0 ? 'Hoy ' : '') + r.d + '</td><td>' + C.fmt(r.peso, 0) + '</td><td>' + C.fmt(r.ali, 0) + '</td><td>' + C.fmt(r.acum, 0) + '</td>' +
          (pob ? '<td>' + C.fmt(r.aliGalpon, 1) + '</td><td>' + C.fmt(r.acumGalpon, 0) + '</td>' : '') + '</tr>';
      });
      h += '<details style="margin-top:10px"><summary style="font-weight:700;color:var(--gd);cursor:pointer">Proyección próximos ' + (P.rows.length - 1) + ' días</summary><div class="scroll"><table><thead><tr>' +
        '<th>Día</th><th>Peso objetivo (g)</th><th>g/ave/día</th><th>g/ave acum.</th>' + (pob ? '<th>kg galpón/día</th><th>kg galpón acum.</th>' : '') +
        '</tr></thead><tbody>' + rows + '</tbody></table></div></details>';
    }
    return h + '<div style="font-size:11.5px;color:var(--mut);margin-top:8px">Objetivo Ross 308 AP (mixto). Es lo que debería consumir según la tabla; el consumo real puede variar.</div></div>';
  }
  function summaryHtml(id) {
    const g = state.galpones[id];
    const s = C.galponStats(g, state.meta);
    const edad = g ? g.edad : '';
    let faltan = '';
    if (s.conDatos > 0 && s.faltan.length) {
      faltan = '<div class="warn">Faltan aves para la meta (' + state.meta + ') en: ' + s.faltan.join(', ') + '</div>';
    }
    const big = '<div class="card big-card"><div class="lbl">Peso promedio del galpón</div><div class="val">' +
      (s.galpon !== null ? C.fmt(s.galpon, 2) + ' g' : '—') + '</div><div class="sub">' + s.conDatos +
      ' de 4 corrales con datos · ' + C.fmt(s.totalAves, 0) + ' aves pesadas</div>' + faltan + '</div>';

    let cmpHtml;
    if (!(C.num(edad) > 0)) {
      cmpHtml = '<div class="hintbox">Escribe la <b>edad (días)</b> para comparar el peso con la tabla de referencia y proyectar el alimento (días 0 a 56).</div>';
    } else if (s.galpon === null) {
      cmpHtml = '<div class="hintbox">Cuando haya peso promedio se comparará con la referencia del día ' + Math.round(C.num(edad)) + '.</div>';
    } else {
      const m = C.compare(s.galpon, edad);
      if (m.sinRef) {
        cmpHtml = '<div class="hintbox">Sin referencia para el día ' + m.dia + ' (la tabla cubre del 0 al 56).</div>';
      } else {
        const sg = m.diff >= 0 ? '+' : '';
        cmpHtml = '<div class="cmp ' + m.estado + '"><div class="badge">' + C.ESTADOS[m.estado].largo + '</div>' +
          '<div>Día ' + m.dia + ' · estándar <b>' + C.fmt(m.ref, 0) + ' g</b>' + (m.exacto ? '' : ' (aprox.)') + ' · real <b>' + C.fmt(s.galpon, 2) + ' g</b></div>' +
          '<div>Diferencia: ' + sg + C.fmt(m.diff, 1) + ' g (' + sg + C.fmt(m.pct, 1) + ' %) · "similar" = dentro de ±' + C.TOL + ' %</div></div>';
      }
    }
    return big + cmpHtml + feedHtml(g);
  }
  function refTable(edad) {
    const e = Math.round(C.num(edad));
    let rows = '';
    C.REF.forEach(function (f) {
      const v = function (x) { return x === null ? '' : x; };
      rows += '<tr' + (f.d === e ? ' class="hl"' : '') + '><td>' + f.d + '</td><td>' + f.peso + '</td><td>' + v(f.gan) + '</td><td>' + v(f.prom) +
        '</td><td>' + v(f.ali) + '</td><td>' + v(f.acum) + '</td><td>' + (f.ca === null ? '' : f.ca.toFixed(3).replace('.', ',')) + '</td></tr>';
    });
    return '<details class="card"><summary>Tabla de referencia Ross 308 AP (días 0 a 56)</summary><div class="scroll" style="max-height:380px;overflow-y:auto"><table><thead><tr>' +
      '<th>Día</th><th>Peso corporal (g)</th><th>Ganancia diaria (g)</th><th>Prom. ganancia (g)</th><th>Alimento diario (g)</th><th>Alimento acum. (g)</th><th>CA</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div></details>';
  }
  function viewGalpon(id) {
    const g = state.galpones[id] || { fecha: today(), edad: '', c: {} };
    const s = C.galponStats(g, state.meta);
    const pens = C.CORRALES.map(function (k) {
      const st = s.c[k];
      const cls = st.aves >= state.meta ? 'ok' : (st.aves > 0 ? 'mid' : '');
      return '<a class="pen ' + cls + '" href="#/g/' + id + '/' + k + '"><span class="l">' + k + '</span>' +
        '<span class="t">' + C.fmt(st.aves, 0) + ' / ' + state.meta + ' aves</span>' +
        '<span class="p">' + (st.prom !== null ? C.fmt(st.prom, 2) + ' g' : '—') + '</span></a>';
    }).join('');
    return '<header class="top"><a class="ib" href="#/" aria-label="Volver">‹</a><div class="grow"><h1>Galpón ' + id + '</h1>' +
      '<p>Toca un corral para registrar pesos</p></div></header>' +
      '<main><div class="card fields">' +
      '<div><label>Fecha</label><input type="date" id="f-fecha" value="' + esc(g.fecha || today()) + '"></div>' +
      '<div><label>Edad (días)</label><input type="number" inputmode="numeric" id="f-edad" min="1" max="56" value="' + esc(g.edad) + '" placeholder="Ej. 21"></div>' +
      '<div class="w2"><label>Aves en el galpón (opcional)</label><input type="number" inputmode="numeric" id="f-pob" min="0" value="' + esc(g.poblacion) + '" placeholder="Ej. 12000"></div>' +
      '<div class="w2"><label>Granja</label><input type="text" id="f-granja" value="' + esc(state.granja) + '" placeholder="Ej. Catalda II"></div></div>' +
      '<div class="pens">' + pens + '</div>' +
      '<div id="sum">' + summaryHtml(id) + '</div>' +
      refTable(g.edad) +
      '<button class="btn primary big" data-act="export-g" data-id="' + id + '">📊 Generar Excel del galpón ' + id + '</button>' +
      '<button class="btn danger small mt" data-act="clear-g" data-id="' + id + '">Borrar datos de este galpón</button>' +
      '</main>' + firma();
  }

  // ---------- Vista: corral ----------
  function cmpCorral(g, st) {
    if (!g || st.prom === null || !(C.num(g.edad) >= 1)) return '';
    const m = C.compare(st.prom, g.edad);
    if (!m || m.sinRef) return '';
    const sg = m.diff >= 0 ? '+' : '';
    return '<div class="cmp ' + m.estado + '"><div class="badge">' + C.ESTADOS[m.estado].largo + '</div><div>Día ' + m.dia + ' · estándar <b>' + C.fmt(m.ref, 0) +
      ' g</b> · este corral <b>' + C.fmt(st.prom, 2) + ' g</b> (' + sg + C.fmt(m.pct, 1) + ' %)</div></div>';
  }
  function viewCorral(id, k) {
    const g = state.galpones[id];
    const lista = (g && g.c && g.c[k]) || [];
    const st = C.corralStats(lista);
    const meta = state.meta;
    const ok = st.aves >= meta;
    const pct = Math.min(100, st.aves / meta * 100);
    let rows = '';
    for (let i = lista.length - 1; i >= 0; i--) {
      const e = lista[i];
      rows += '<div class="ent"><span class="n">#' + (i + 1) + '</span><span><b>' + C.fmt(e.a, 0) + '</b> aves</span>' +
        '<span><b>' + fmtG(e.p) + '</b> g<small class="pa">' + C.fmt(e.p / e.a, 0) + ' g/ave</small></span>' +
        '<button data-act="del" data-i="' + i + '" aria-label="Borrar">✕</button></div>';
    }
    if (!rows) rows = '<div class="empty">Aún no hay pesadas. Escribe cuántas aves pesaste y el peso total.</div>';
    return '<header class="top"><a class="ib" href="#/g/' + id + '" aria-label="Volver">‹</a><div class="grow"><h1>Galpón ' + id + ' · Corral ' + k + '</h1>' +
      '<p>' + esc(state.granja || 'Sin granja') + '</p></div></header>' +
      '<main><div class="card"><div class="row">' +
      '<div><label>Cantidad de aves</label><input type="number" inputmode="numeric" id="in-a" min="1" step="1" placeholder="Ej. 9"></div>' +
      '<div><label>Peso total (kg)</label><input type="text" inputmode="decimal" id="in-p" placeholder="Ej. 26.4"></div></div>' +
      '<div class="hint" id="hint">&nbsp;</div>' +
      '<button class="btn primary big" data-act="add">➕ Agregar pesada</button></div>' +
      cmpCorral(g, st) +
      '<div class="card"><div class="progtxt"><span>' + C.fmt(st.aves, 0) + ' / ' + meta + ' aves</span><span>' +
      (ok ? '✔ Meta alcanzada' : 'Faltan ' + C.fmt(meta - st.aves, 0)) + '</span></div>' +
      '<div class="bar ' + (ok ? 'ok' : '') + '"><i style="width:' + pct + '%"></i></div></div>' +
      '<div class="card"><h2>Pesadas (' + lista.length + ')</h2>' + rows + '</div></main>' +
      '<div class="sumbar"><div><small>Aves</small><b>' + C.fmt(st.aves, 0) + '</b></div>' +
      '<div><small>Peso total</small><b>' + C.fmt(st.peso, 0) + ' g</b></div>' +
      '<div><small>Promedio</small><b>' + (st.prom !== null ? C.fmt(st.prom, 2) + ' g' : '—') + '</b></div></div>' + firma();
  }
  function bindCorral() {
    const a = $('#in-a'), p = $('#in-p'), h = $('#hint');
    function upd() {
      const av = C.num(a.value), pe = kgToG(C.num(p.value));
      if (av > 0 && pe > 0) {
        const pp = pe / av;
        h.textContent = '= ' + C.fmt(pe, 0) + ' g  ·  ≈ ' + C.fmt(pp, 2) + ' g por ave';
        h.className = 'hint' + (pp < 20 || pp > 6000 ? ' bad' : '');
      } else { h.innerHTML = '&nbsp;'; h.className = 'hint'; }
    }
    a.addEventListener('input', upd);
    p.addEventListener('input', upd);
    a.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); p.focus(); } });
    p.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); addEntry(); } });
  }
  function addEntry() {
    const r = route();
    const a = $('#in-a'), p = $('#in-p');
    const av = C.num(a.value), pe = kgToG(C.num(p.value));
    if (!(av > 0) || Math.floor(av) !== av) { toast('Escribe la cantidad de aves (número entero)', true); a.focus(); return; }
    if (!(pe > 0)) { toast('Escribe el peso total en kg (ej. 26.4)', true); p.focus(); return; }
    const pp = pe / av;
    if ((pp < 20 || pp > 6000) && !confirm('El peso da ' + C.fmt(pp, 0) + ' g por ave. ¿Es correcto?')) return;
    const g = ensure(r.id);
    const antes = C.corralStats(g.c[r.k]).aves;
    g.c[r.k].push({ a: av, p: pe });
    save();
    render();
    const despues = antes + av;
    if (antes < state.meta && despues >= state.meta) toast('Meta alcanzada: ' + despues + ' aves ✔');
    const na = $('#in-a'); if (na) na.focus();
  }

  // ---------- Eventos ----------
  app.addEventListener('click', function (e) {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.getAttribute('data-act');
    const r = route();
    if (act === 'add') addEntry();
    else if (act === 'del') {
      if (!confirm('¿Borrar esta pesada?')) return;
      const g = ensure(r.id);
      g.c[r.k].splice(+b.getAttribute('data-i'), 1);
      save(); render();
    }
    else if (act === 'meta') {
      const v = prompt('Meta de aves a pesar por corral:', state.meta);
      if (v === null) return;
      const n = C.num(v);
      if (!(n >= 1) || Math.floor(n) !== n) { toast('Escribe un número entero', true); return; }
      state.meta = n; save(); render();
    }
    else if (act === 'export-g') exportGalpon(+b.getAttribute('data-id'));
    else if (act === 'export-all') exportAll();
    else if (act === 'clear-g') {
      const id = +b.getAttribute('data-id');
      if (!confirm('¿Borrar todos los datos del Galpón ' + id + '? No se puede deshacer.')) return;
      delete state.galpones[id]; save(); render(); toast('Galpón ' + id + ' borrado');
    }
    else if (act === 'clear-all') {
      if (!confirm('¿Borrar los datos de TODOS los galpones? Haz primero un respaldo o exporta el Excel.')) return;
      if (!confirm('Última confirmación: se borrarán los 12 galpones.')) return;
      state.galpones = {}; save(); render(); toast('Jornada nueva lista');
    }
    else if (act === 'backup') exportBackup();
    else if (act === 'restore') restoreBackup();
    else if (act === 'combine') combineBackups();
    else if (act === 'send-code') sendCode();
    else if (act === 'copy-code') copyCode();
    else if (act === 'combine-code') combineCode();
  });
  app.addEventListener('change', function (e) {
    const r = route();
    if (r.v !== 'galpon') return;
    const t = e.target;
    if (t.id === 'f-fecha') { ensure(r.id).fecha = t.value || today(); save(); }
    else if (t.id === 'f-granja') {
      state.granja = t.value.trim(); save();
    }
    else if (t.id === 'f-pob') {
      ensure(r.id).poblacion = t.value; save();
      $('#sum').innerHTML = summaryHtml(r.id);
    }
    else if (t.id === 'f-edad') {
      ensure(r.id).edad = t.value; save();
      $('#sum').innerHTML = summaryHtml(r.id);
      const det = document.querySelector('details.card');
      if (det) { const open = det.open; det.outerHTML = refTable(t.value); const nd = document.querySelector('details.card'); if (nd) nd.open = open; }
    }
  });
  window.addEventListener('hashchange', render);

  // ---------- Exportar / compartir ----------
  function toB64(buf) {
    const bytes = new Uint8Array(buf);
    let bin = '';
    const step = 0x8000;
    for (let i = 0; i < bytes.length; i += step) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + step));
    return btoa(bin);
  }
  function isNative() {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  }
  function aviso(msg, bad) { toast(msg, bad); setRes(msg, bad); }
  async function saveAndShare(name, buf, mime) {
    const P = window.Capacitor && window.Capacitor.Plugins;
    if (isNative() && P && P.Filesystem) {
      const b64 = toB64(buf);
      let guardado = false;
      try {
        await P.Filesystem.writeFile({ path: 'PesajeAves/' + name, data: b64, directory: 'DOCUMENTS', recursive: true });
        guardado = true;
      } catch (e) { /* algunos Android no permiten Documentos: se usa compartir */ }
      try {
        const f = await P.Filesystem.writeFile({ path: name, data: b64, directory: 'CACHE' });
        if (P.Share) await P.Share.share({ title: name, text: name, url: f.uri, dialogTitle: 'Guardar o enviar archivo' });
        if (guardado) aviso('Copia guardada en Documentos/PesajeAves');
        else aviso('No se pudo guardar copia en Documentos; solo se compartió', true);
      } catch (e) {
        const m = String((e && e.message) || e);
        if (/cancel/i.test(m)) { aviso(guardado ? 'Copia guardada en Documentos/PesajeAves' : 'No se guardó ninguna copia en el teléfono', !guardado); return; }
        if (guardado) aviso('Guardado en Documentos/PesajeAves');
        else toast('No se pudo exportar: ' + m, true);
      }
      return;
    }
    const blob = new Blob([buf], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    toast('Archivo generado');
  }
  const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  function tieneDatos(id) { return C.galponStats(state.galpones[id], state.meta).totalAves > 0; }
  async function exportIds(ids, nombre, opts) {
    if (typeof window.ExcelJS === 'undefined') { toast('Falta la librería de Excel', true); return; }
    try {
      const wb = XL.build(window.ExcelJS, state, ids, C, opts);
      const buf = await wb.xlsx.writeBuffer();
      await saveAndShare(nombre, buf, XLSX_MIME);
    } catch (e) { toast('Error al crear el Excel: ' + ((e && e.message) || e), true); }
  }
  function exportGalpon(id) {
    if (!tieneDatos(id)) { toast('Este galpón aún no tiene pesos', true); return; }
    const g = state.galpones[id];
    exportIds([id], 'Pesaje_Galpon' + id + '_' + (g.fecha || today()) + '.xlsx');
  }
  function exportAll() {
    const ids = [];
    for (let i = 1; i <= 12; i++) if (tieneDatos(i)) ids.push(i);
    if (!ids.length) { toast('Aún no hay galpones con pesos', true); return; }
    exportIds(ids, 'Pesaje_Granja_' + today() + '.xlsx', { resumen: true });
  }
  function exportBackup() {
    const bytes = new TextEncoder().encode(JSON.stringify(state));
    saveAndShare('Respaldo_PesajeAves_' + today() + '.json', bytes.buffer, 'application/json');
  }
  function restoreBackup() {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = function () {
      const f = inp.files && inp.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = function () {
        try {
          const s = JSON.parse(rd.result);
          if (!s || s.v !== 1 || !s.galpones) throw new Error('formato');
          if (!confirm('Esto reemplaza los datos actuales por los del respaldo. ¿Continuar?')) return;
          if (!s.granja) s.granja = state.granja || '';
          state = s; save(); render(); toast('Respaldo restaurado');
        } catch (e) { toast('Ese archivo no es un respaldo válido', true); }
      };
      rd.readAsText(f);
    };
    inp.click();
  }

  // ---------- Código de texto (para enviar por WhatsApp sin archivos) ----------
  function encodeState() {
    const out = { v: 1, meta: state.meta, granja: state.granja || '', galpones: {} };
    Object.keys(state.galpones).forEach(function (id) {
      const g = state.galpones[id];
      if (!(C.galponStats(g, state.meta).totalAves > 0)) return;
      const c = {};
      C.CORRALES.forEach(function (k) { c[k] = ((g.c && g.c[k]) || []).map(function (e) { return [e.a, e.p]; }); });
      out.galpones[id] = { fecha: g.fecha, edad: g.edad, poblacion: g.poblacion, c: c };
    });
    return 'PESAJE1:' + btoa(unescape(encodeURIComponent(JSON.stringify(out)))) + '#';
  }
  // Acepta el código (con texto alrededor) o un JSON de respaldo. Devuelve el estado en formato normal.
  function decodeAny(text) {
    let t = String(text || '').trim();
    const m = /PESAJE1:([A-Za-z0-9+\/=\s]+)#/.exec(t);
    if (m) t = decodeURIComponent(escape(atob(m[1].replace(/\s+/g, ''))));
    const s = JSON.parse(t);
    if (!s || s.v !== 1 || !s.galpones) throw new Error('formato');
    Object.keys(s.galpones).forEach(function (id) {
      const g = s.galpones[id];
      if (!g || !g.c) return;
      Object.keys(g.c).forEach(function (k) {
        g.c[k] = (g.c[k] || []).map(function (e) { return Array.isArray(e) ? { a: e[0], p: e[1] } : e; });
      });
    });
    return s;
  }
  function finishMerge(resumen) {
    save(); render();
    const partes = [];
    if (resumen.nuevos.length) partes.push('agregados: ' + resumen.nuevos.sort(function (x, y) { return x - y; }).join(', '));
    if (resumen.reemplazados.length) partes.push('reemplazados: ' + resumen.reemplazados.join(', '));
    if (resumen.conservados.length) partes.push('conservados: ' + resumen.conservados.join(', '));
    toast(partes.length ? 'Galpones ' + partes.join(' · ') : 'No traía galpones con datos', !partes.length);
  }
  function combineCode() {
    const box = $('#code-in');
    if (!box || !box.value.trim()) { toast('Pega primero el mensaje recibido', true); return; }
    const resumen = { nuevos: [], reemplazados: [], conservados: [] };
    try { mergeBackup(decodeAny(box.value), resumen); }
    catch (e) { toast('No se reconoce ese texto. Copia el mensaje completo, desde PESAJE1: hasta el # final', true); return; }
    finishMerge(resumen);
    location.hash = '#/granja';
  }
  async function sendCode() {
    const code = encodeState();
    if (code.length < 30 || !Object.keys(JSON.parse(decodeURIComponent(escape(atob(code.slice(8, -1))))).galpones).length) { toast('Aún no hay galpones con datos para enviar', true); return; }
    const P = window.Capacitor && window.Capacitor.Plugins;
    try {
      if (isNative() && P && P.Share) await P.Share.share({ title: 'Datos de pesaje', text: code, dialogTitle: 'Enviar datos de pesaje' });
      else if (navigator.share) await navigator.share({ title: 'Datos de pesaje', text: code });
      else { await copyCode(); return; }
      setRes('Listo. En el otro teléfono: Respaldo y combinar → pegar el mensaje → Combinar.');
    } catch (e) {
      if (!/cancel|abort/i.test(String((e && e.message) || e))) { setRes('No se pudo abrir el menú de compartir. Usa "Copiar código".', true); }
    }
  }
  async function copyCode() {
    const code = encodeState();
    let ok = false;
    try { await navigator.clipboard.writeText(code); ok = true; }
    catch (e) {
      try {
        const ta = document.createElement('textarea'); ta.value = code; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select(); ok = document.execCommand('copy'); ta.remove();
      } catch (e2) { ok = false; }
    }
    if (ok) { toast('Código copiado. Pégalo en un mensaje de WhatsApp'); setRes('Código copiado (' + code.length + ' caracteres). Pégalo en WhatsApp y envíalo.'); }
    else toast('No se pudo copiar', true);
  }

  // Une los galpones de uno o varios respaldos (de otros teléfonos) con los de este teléfono.
  function readText(f) {
    return new Promise(function (res, rej) {
      const rd = new FileReader();
      rd.onload = function () { res(rd.result); };
      rd.onerror = function () { rej(rd.error); };
      rd.readAsText(f);
    });
  }
  function mergeBackup(s, resumen) {
    if (!s || s.v !== 1 || !s.galpones) throw new Error('formato');
    Object.keys(s.galpones).forEach(function (id) {
      const inc = s.galpones[id];
      const ai = C.galponStats(inc, state.meta).totalAves;
      if (!(ai > 0)) return;
      const cur = state.galpones[id];
      const ac = C.galponStats(cur, state.meta).totalAves;
      if (!(ac > 0)) { state.galpones[id] = inc; resumen.nuevos.push(id); return; }
      if (confirm('El galpón ' + id + ' tiene datos aquí (' + ac + ' aves) y en el archivo (' + ai + ' aves).\n\nAceptar = usar el del archivo\nCancelar = conservar el de este teléfono')) {
        state.galpones[id] = inc; resumen.reemplazados.push(id);
      } else resumen.conservados.push(id);
    });
    if (!state.granja && s.granja) state.granja = s.granja;
  }
  function combineBackups() {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json,application/json'; inp.multiple = true;
    inp.onchange = async function () {
      const files = Array.prototype.slice.call(inp.files || []);
      if (!files.length) return;
      const resumen = { nuevos: [], reemplazados: [], conservados: [] };
      try {
        for (let i = 0; i < files.length; i++) mergeBackup(decodeAny(await readText(files[i])), resumen);
      } catch (e) { toast('Ese archivo no es un respaldo válido', true); return; }
      finishMerge(resumen);
      location.hash = '#/granja';
    };
    inp.click();
  }
  window.__combine = { mergeBackup: mergeBackup, decodeAny: decodeAny, encodeState: encodeState };

  // ---------- Licencia (ver license.js) ----------
  function loadLic() {
    try {
      const raw = localStorage.getItem(LKEY);
      if (raw) { const c = JSON.parse(raw); if (c && c.installedAt) return c; }
    } catch (e) { /* sin almacenamiento */ }
    return L.blankCache();
  }
  function saveLic(c) { try { localStorage.setItem(LKEY, JSON.stringify(c)); } catch (e) { /* best-effort */ } }
  let lic = loadLic();

  function lockScreen(ev) {
    const m = L.mensaje(ev);
    app.innerHTML = '<div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px;text-align:center;background:var(--gd);color:#fff">' +
      '<div style="font-size:52px;margin-bottom:10px">🔒</div>' +
      '<h1 style="font-size:21px;margin:0 0 8px">' + esc(m.t) + '</h1>' +
      '<p style="font-size:15px;opacity:.9;max-width:320px;margin:0 0 22px">' + esc(m.d) + '</p>' +
      '<button id="lic-retry" class="btn" style="background:#fff;border-color:#fff;max-width:220px">↻ Reintentar</button>' +
      '</div>';
    const b = document.getElementById('lic-retry');
    if (b) b.addEventListener('click', function () { checkLicense(true); });
  }

  function licenseConfigured() {
    const cfg = window.LICENSE_CONFIG || {};
    return !!(cfg.PROJECT_ID && cfg.API_KEY);
  }

  // Intenta confirmar la licencia contra Firestore (solo lectura). Si no hay
  // internet o no está configurada, no cambia nada: se sigue usando lo guardado.
  async function checkLicense(force) {
    if (!licenseConfigured()) return; // modo libre: sin Firebase configurado, no se exige licencia
    if (!force && !L.shouldTryNow(lic)) return;
    const cfg = window.LICENSE_CONFIG;
    const url = 'https://firestore.googleapis.com/v1/projects/' + cfg.PROJECT_ID +
      '/databases/(default)/documents/license/status?key=' + cfg.API_KEY;
    lic.lastTryAt = new Date().toISOString();
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('http ' + res.status);
      const doc = L.parseFirestoreDoc(await res.json());
      lic.active = doc.active;
      lic.validUntil = doc.validUntil;
      lic.note = doc.note;
      lic.lastOkAt = new Date().toISOString();
      saveLic(lic);
      const before = route();
      const ev = L.evaluate(lic);
      if (!ev.allowed) { lockScreen(ev); }
      else if (!before || app.querySelector('#lic-retry')) { render(); }
    } catch (e) {
      saveLic(lic); // guarda al menos el intento, aunque haya fallado
    }
  }

  function startApp() {
    if (!licenseConfigured()) { render(); return; } // sin Firebase configurado: funciona libre, como antes
    const ev = L.evaluate(lic);
    if (!ev.allowed) lockScreen(ev); else render();
    checkLicense(false);
    setInterval(function () { checkLicense(false); }, 60 * 60 * 1000); // reintenta cada hora si hace falta
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') checkLicense(false);
    });
  }

  try { startApp(); } catch (e) { render(); } // la licencia nunca debe impedir que la app funcione
})();
