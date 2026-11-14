/* Pesaje de Aves - lógica de cálculo (sin dependencias, funciona offline)
 * Desarrollado por Analista de sistemas Eber Romero */
(function (root) {
  'use strict';

  // Tabla de referencia del formato FO-ENG-004 (días 13 a 28)
  const REF = [
    { d: 13, peso: 483,  gan: 54, prom: 34, ali: 63,  acum: 469,  ca: 0.972 },
    { d: 14, peso: 540,  gan: 57, prom: 35, ali: 68,  acum: 537,  ca: 0.995 },
    { d: 15, peso: 601,  gan: 61, prom: 37, ali: 73,  acum: 610,  ca: 1.016 },
    { d: 21, peso: 1033, gan: 80, prom: 47, ali: 107, acum: 1167, ca: 1.130 },
    { d: 22, peso: 1115, gan: 82, prom: 49, ali: 113, acum: 1280, ca: 1.148 },
    { d: 27, peso: 1562, gan: 94, prom: 56, ali: 142, acum: 1935, ca: 1.239 },
    { d: 28, peso: 1657, gan: 95, prom: 58, ali: 148, acum: 2083, ca: 1.257 }
  ];
  const CORRALES = ['A', 'B', 'C', 'D'];
  const TOL = 3; // % de tolerancia para considerar "similar" al estándar
  const ESTADOS = {
    sobre:   { corto: 'Por encima', largo: 'Por encima del estándar' },
    similar: { corto: 'Similar',    largo: 'Similar al estándar' },
    bajo:    { corto: 'Por debajo', largo: 'Por debajo del estándar' }
  };

  // Número desde texto (acepta coma o punto decimal). NaN si no es válido.
  function num(v) {
    if (typeof v === 'number') return v;
    if (v === null || v === undefined) return NaN;
    const s = String(v).trim().replace(/\s/g, '').replace(',', '.');
    if (s === '' || !/^-?\d*\.?\d*$/.test(s)) return NaN;
    return Number(s);
  }

  // Formato es-VE: coma decimal, punto de miles
  function fmt(n, d) {
    if (n === null || n === undefined || !isFinite(n)) return '—';
    d = d === undefined ? 1 : d;
    const neg = n < 0;
    const parts = Math.abs(n).toFixed(d).split('.');
    const ent = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (neg ? '-' : '') + ent + (parts[1] ? ',' + parts[1] : '');
  }

  function corralStats(list) {
    let aves = 0, peso = 0;
    (list || []).forEach(function (e) { aves += e.a; peso += e.p; });
    return { n: (list || []).length, aves: aves, peso: peso, prom: aves > 0 ? peso / aves : null };
  }

  // Promedio del galpón = promedio simple de los promedios de los corrales con datos
  function galponStats(g, meta) {
    const c = {};
    let total = 0, suma = 0, conDatos = 0, completos = 0;
    const faltan = [];
    CORRALES.forEach(function (k) {
      const s = corralStats(g && g.c && g.c[k]);
      c[k] = s;
      total += s.aves;
      if (s.aves > 0) { conDatos++; suma += s.prom; }
      if (s.aves >= meta) completos++; else faltan.push(k);
    });
    return {
      c: c, totalAves: total, conDatos: conDatos, completos: completos, faltan: faltan,
      galpon: conDatos > 0 ? suma / conDatos : null
    };
  }

  // Peso estándar para un día (interpola entre los días de la tabla)
  function refFor(day) {
    const d = Math.round(Number(day));
    if (!isFinite(d) || d < REF[0].d || d > REF[REF.length - 1].d) return null;
    for (let i = 0; i < REF.length; i++) {
      if (REF[i].d === d) return { dia: d, peso: REF[i].peso, exacto: true };
    }
    for (let i = 0; i < REF.length - 1; i++) {
      const lo = REF[i], hi = REF[i + 1];
      if (d > lo.d && d < hi.d) {
        const t = (d - lo.d) / (hi.d - lo.d);
        return { dia: d, peso: lo.peso + (hi.peso - lo.peso) * t, exacto: false };
      }
    }
    return null;
  }

  function compare(avg, edad) {
    const e = num(edad);
    if (avg === null || avg === undefined || !isFinite(e) || e <= 0) return null;
    const r = refFor(e);
    if (!r) return { dia: Math.round(e), sinRef: true };
    const diff = avg - r.peso;
    const pct = diff / r.peso * 100;
    const pr = Math.round(pct * 10) / 10; // se clasifica con el mismo valor que se muestra
    const estado = pr >= TOL ? 'sobre' : (pr >= -TOL ? 'similar' : 'bajo');
    return { dia: r.dia, ref: r.peso, exacto: r.exacto, diff: diff, pct: pct, estado: estado };
  }

  root.Core = {
    REF: REF, CORRALES: CORRALES, TOL: TOL, ESTADOS: ESTADOS,
    num: num, fmt: fmt, corralStats: corralStats, galponStats: galponStats,
    refFor: refFor, compare: compare
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.Core;
})(typeof window !== 'undefined' ? window : globalThis);
