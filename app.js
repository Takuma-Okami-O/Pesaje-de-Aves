/* Pesaje de Aves - interfaz (100% offline, datos en el teléfono)
 * Desarrollado por Analista de sistemas Eber Romero */
(function () {
  'use strict';

  const C = window.Core;
  const XL = window.PesajeExcel;
  const KEY = 'pesajeAves.v1';
  const FIRMA = 'Desarrollado por Analista de sistemas Eber Romero';
  const app = document.getElementById('app');

  // ---------- Estado persistente ----------
  function blank() { return { v: 1, meta: 100, lastNucleo: '', galpones: {} }; }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const s = JSON.parse(raw); if (s && s.v === 1 && s.galpones) return s; }
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
      state.galpones[id] = { fecha: today(), nucleo: state.lastNucleo || '', edad: '', c: { A: [], B: [], C: [], D: [] } };
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
    return { v: 'home' };
  }
  let lastRoute = '';
  function render() {
    const r = route();
    const key = r.v + (r.id || '') + (r.k || '');
    if (r.v === 'home') app.innerHTML = viewHome();
    else if (r.v === 'galpon') app.innerHTML = viewGalpon(r.id);
    else app.innerHTML = viewCorral(r.id, r.k);
    if (key !== lastRoute) { window.scrollTo(0, 0); lastRoute = key; }
    if (r.v === 'corral') bindCorral();
  }

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
        (s.galpon !== null ? C.fmt(s.galpon, 0) + ' g' : 'sin datos') + '</span></div>' +
        '<div class="dots">' + dots + '</div></a>';
    }
    return '<header class="top"><div class="grow"><h1>Pesaje de Aves</h1><p>Agroinversiones SAI-RAM, C.A</p></div>' +
      '<button class="ib" data-act="meta" aria-label="Meta de aves">⚙</button></header>' +
      '<main><div class="card" style="padding:10px 14px"><div style="font-size:13px;color:var(--mut)">Toca un galpón para pesar. ' +
      'Meta: <b>' + state.meta + ' aves</b> por corral. Todo se guarda en este teléfono, sin internet.</div></div>' +
      '<div class="sheds">' + tiles + '</div>' +
      '<button class="btn primary big" data-act="export-all">📊 Exportar todos a Excel</button>' +
      '<div class="row mt"><button class="btn small" data-act="backup">⬇ Respaldo</button><button class="btn small" data-act="restore">⬆ Restaurar</button></div>' +
      '<button class="btn danger small" data-act="clear-all">Nueva jornada (borrar todo)</button>' +
      '</main>' + firma();
  }

  // ---------- Vista: galpón ----------
  function summaryHtml(id) {
    const g = state.galpones[id];
    const s = C.galponStats(g, state.meta);
    const edad = g ? g.edad : '';
    let faltan = '';
    if (s.conDatos > 0 && s.faltan.length) {
      faltan = '<div class="warn">Faltan aves para la meta (' + state.meta + ') en: ' + s.faltan.join(', ') + '</div>';
    }
    const big = '<div class="card big-card"><div class="lbl">Peso promedio del galpón</div><div class="val">' +
      (s.galpon !== null ? C.fmt(s.galpon, 1) + ' g' : '—') + '</div><div class="sub">' + s.conDatos +
      ' de 4 corrales con datos · ' + C.fmt(s.totalAves, 0) + ' aves pesadas</div>' + faltan + '</div>';

    let cmpHtml;
    if (!(C.num(edad) > 0)) {
      cmpHtml = '<div class="hintbox">Escribe la <b>edad (días)</b> para comparar el peso con la tabla de referencia (días 13 a 28).</div>';
    } else if (s.galpon === null) {
      cmpHtml = '<div class="hintbox">Cuando haya peso promedio se comparará con la referencia del día ' + Math.round(C.num(edad)) + '.</div>';
    } else {
      const m = C.compare(s.galpon, edad);
      if (m.sinRef) {
        cmpHtml = '<div class="hintbox">Sin referencia para el día ' + m.dia + ' (la tabla cubre del 13 al 28).</div>';
      } else {
        const sg = m.diff >= 0 ? '+' : '';
        cmpHtml = '<div class="cmp ' + m.estado + '"><div class="badge">' + C.ESTADOS[m.estado].largo + '</div>' +
          '<div>Día ' + m.dia + ' · estándar <b>' + C.fmt(m.ref, 0) + ' g</b>' + (m.exacto ? '' : ' (aprox.)') + ' · real <b>' + C.fmt(s.galpon, 1) + ' g</b></div>' +
          '<div>Diferencia: ' + sg + C.fmt(m.diff, 1) + ' g (' + sg + C.fmt(m.pct, 1) + ' %) · "similar" = dentro de ±' + C.TOL + ' %</div></div>';
      }
    }
    return big + cmpHtml;
  }
  function refTable(edad) {
    const e = Math.round(C.num(edad));
    let rows = '';
    C.REF.forEach(function (f) {
      rows += '<tr' + (f.d === e ? ' class="hl"' : '') + '><td>' + f.d + '</td><td>' + f.peso + '</td><td>' + f.gan + '</td><td>' + f.prom +
        '</td><td>' + f.ali + '</td><td>' + f.acum + '</td><td>' + String(f.ca.toFixed(3)).replace('.', ',') + '</td></tr>';
    });
    return '<details class="card"><summary>Tabla de referencia (días 13 a 28)</summary><div class="scroll"><table><thead><tr>' +
      '<th>Día</th><th>Peso corporal (g)</th><th>Ganancia diaria (g)</th><th>Prom. ganancia (g)</th><th>Alimento diario (g)</th><th>Alimento acum. (g)</th><th>CA</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div></details>';
  }
  function viewGalpon(id) {
    const g = state.galpones[id] || { fecha: today(), nucleo: state.lastNucleo || '', edad: '', c: {} };
    const s = C.galponStats(g, state.meta);
    const pens = C.CORRALES.map(function (k) {
      const st = s.c[k];
      const cls = st.aves >= state.meta ? 'ok' : (st.aves > 0 ? 'mid' : '');
      return '<a class="pen ' + cls + '" href="#/g/' + id + '/' + k + '"><span class="l">' + k + '</span>' +
        '<span class="t">' + C.fmt(st.aves, 0) + ' / ' + state.meta + ' aves</span>' +
        '<span class="p">' + (st.prom !== null ? C.fmt(st.prom, 1) + ' g' : '—') + '</span></a>';
    }).join('');
    return '<header class="top"><a class="ib" href="#/" aria-label="Volver">‹</a><div class="grow"><h1>Galpón ' + id + '</h1>' +
      '<p>Toca un corral para registrar pesos</p></div></header>' +
      '<main><div class="card fields">' +
      '<div><label>Fecha</label><input type="date" id="f-fecha" value="' + esc(g.fecha || today()) + '"></div>' +
      '<div><label>Edad (días)</label><input type="number" inputmode="numeric" id="f-edad" min="1" max="70" value="' + esc(g.edad) + '" placeholder="Ej. 21"></div>' +
      '<div class="w2"><label>Núcleo</label><input type="text" id="f-nucleo" value="' + esc(g.nucleo) + '" placeholder="Ej. Catalda II"></div></div>' +
      '<div class="pens">' + pens + '</div>' +
      '<div id="sum">' + summaryHtml(id) + '</div>' +
      refTable(g.edad) +
      '<button class="btn primary big" data-act="export-g" data-id="' + id + '">📊 Generar Excel del galpón ' + id + '</button>' +
      '<button class="btn danger small mt" data-act="clear-g" data-id="' + id + '">Borrar datos de este galpón</button>' +
      '</main>' + firma();
  }

  // ---------- Vista: corral ----------
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
      '<p>' + esc((g && g.nucleo) || 'Sin núcleo') + '</p></div></header>' +
      '<main><div class="card"><div class="row">' +
      '<div><label>Cantidad de aves</label><input type="number" inputmode="numeric" id="in-a" min="1" step="1" placeholder="Ej. 9"></div>' +
      '<div><label>Peso total (kg)</label><input type="text" inputmode="decimal" id="in-p" placeholder="Ej. 26.4"></div></div>' +
      '<div class="hint" id="hint">&nbsp;</div>' +
      '<button class="btn primary big" data-act="add">➕ Agregar pesada</button></div>' +
      '<div class="card"><div class="progtxt"><span>' + C.fmt(st.aves, 0) + ' / ' + meta + ' aves</span><span>' +
      (ok ? '✔ Meta alcanzada' : 'Faltan ' + C.fmt(meta - st.aves, 0)) + '</span></div>' +
      '<div class="bar ' + (ok ? 'ok' : '') + '"><i style="width:' + pct + '%"></i></div></div>' +
      '<div class="card"><h2>Pesadas (' + lista.length + ')</h2>' + rows + '</div></main>' +
      '<div class="sumbar"><div><small>Aves</small><b>' + C.fmt(st.aves, 0) + '</b></div>' +
      '<div><small>Peso total</small><b>' + C.fmt(st.peso, 0) + ' g</b></div>' +
      '<div><small>Promedio</small><b>' + (st.prom !== null ? C.fmt(st.prom, 1) + ' g' : '—') + '</b></div></div>' + firma();
  }
  function bindCorral() {
    const a = $('#in-a'), p = $('#in-p'), h = $('#hint');
    function upd() {
      const av = C.num(a.value), pe = kgToG(C.num(p.value));
      if (av > 0 && pe > 0) {
        const pp = pe / av;
        h.textContent = '= ' + C.fmt(pe, 0) + ' g  ·  ≈ ' + C.fmt(pp, 0) + ' g por ave';
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
  });
  app.addEventListener('change', function (e) {
    const r = route();
    if (r.v !== 'galpon') return;
    const t = e.target;
    if (t.id === 'f-fecha') { ensure(r.id).fecha = t.value || today(); save(); }
    else if (t.id === 'f-nucleo') {
      const g = ensure(r.id); g.nucleo = t.value.trim(); state.lastNucleo = g.nucleo; save();
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
        if (guardado) toast('Copia guardada en Documentos/PesajeAves');
      } catch (e) {
        const m = String((e && e.message) || e);
        if (/cancel/i.test(m)) { if (guardado) toast('Copia guardada en Documentos/PesajeAves'); return; }
        if (guardado) toast('Guardado en Documentos/PesajeAves');
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
  async function exportIds(ids, nombre) {
    if (typeof window.ExcelJS === 'undefined') { toast('Falta la librería de Excel', true); return; }
    try {
      const wb = XL.build(window.ExcelJS, state, ids, C);
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
    exportIds(ids, 'Pesaje_Galpones_' + today() + '.xlsx');
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
          state = s; save(); render(); toast('Respaldo restaurado');
        } catch (e) { toast('Ese archivo no es un respaldo válido', true); }
      };
      rd.readAsText(f);
    };
    inp.click();
  }

  render();
})();
