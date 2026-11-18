/* Pesaje de Aves - lógica de cálculo (sin dependencias, funciona offline)
 * Desarrollado por Analista de sistemas Eber Romero */
(function (root) {
  'use strict';

  // Objetivos de rendimiento Ross 308 AP - Mixto (días 0 a 56). null = celda vacía en la tabla original.
  const REF = [
    { d: 0, peso: 44, gan: null, prom: null, ali: null, acum: null, ca: null },
    { d: 1, peso: 62, gan: 18, prom: null, ali: null, acum: 12, ca: 0.194 },
    { d: 2, peso: 80, gan: 19, prom: null, ali: 16, acum: 28, ca: 0.348 },
    { d: 3, peso: 101, gan: 21, prom: null, ali: 20, acum: 48, ca: 0.472 },
    { d: 4, peso: 125, gan: 24, prom: null, ali: 24, acum: 71, ca: 0.571 },
    { d: 5, peso: 151, gan: 27, prom: null, ali: 27, acum: 98, ca: 0.652 },
    { d: 6, peso: 181, gan: 30, prom: null, ali: 31, acum: 130, ca: 0.717 },
    { d: 7, peso: 214, gan: 33, prom: 24, ali: 35, acum: 165, ca: 0.772 },
    { d: 8, peso: 250, gan: 36, prom: 26, ali: 39, acum: 204, ca: 0.818 },
    { d: 9, peso: 289, gan: 40, prom: 27, ali: 44, acum: 248, ca: 0.857 },
    { d: 10, peso: 333, gan: 43, prom: 29, ali: 48, acum: 296, ca: 0.891 },
    { d: 11, peso: 379, gan: 47, prom: 31, ali: 53, acum: 349, ca: 0.921 },
    { d: 12, peso: 429, gan: 50, prom: 32, ali: 58, acum: 407, ca: 0.948 },
    { d: 13, peso: 483, gan: 54, prom: 34, ali: 63, acum: 469, ca: 0.972 },
    { d: 14, peso: 540, gan: 57, prom: 35, ali: 68, acum: 537, ca: 0.995 },
    { d: 15, peso: 601, gan: 61, prom: 37, ali: 73, acum: 610, ca: 1.016 },
    { d: 16, peso: 665, gan: 64, prom: 39, ali: 79, acum: 689, ca: 1.036 },
    { d: 17, peso: 732, gan: 67, prom: 41, ali: 84, acum: 773, ca: 1.056 },
    { d: 18, peso: 803, gan: 71, prom: 42, ali: 90, acum: 863, ca: 1.075 },
    { d: 19, peso: 876, gan: 74, prom: 44, ali: 96, acum: 959, ca: 1.094 },
    { d: 20, peso: 953, gan: 77, prom: 45, ali: 101, acum: 1060, ca: 1.112 },
    { d: 21, peso: 1033, gan: 80, prom: 47, ali: 107, acum: 1167, ca: 1.13 },
    { d: 22, peso: 1115, gan: 82, prom: 49, ali: 113, acum: 1280, ca: 1.148 },
    { d: 23, peso: 1200, gan: 85, prom: 50, ali: 119, acum: 1400, ca: 1.166 },
    { d: 24, peso: 1287, gan: 87, prom: 52, ali: 125, acum: 1525, ca: 1.185 },
    { d: 25, peso: 1377, gan: 90, prom: 53, ali: 131, acum: 1655, ca: 1.203 },
    { d: 26, peso: 1468, gan: 92, prom: 55, ali: 137, acum: 1792, ca: 1.221 },
    { d: 27, peso: 1562, gan: 94, prom: 56, ali: 142, acum: 1935, ca: 1.239 },
    { d: 28, peso: 1657, gan: 95, prom: 58, ali: 148, acum: 2083, ca: 1.257 },
    { d: 29, peso: 1754, gan: 97, prom: 59, ali: 154, acum: 2236, ca: 1.275 },
    { d: 30, peso: 1853, gan: 98, prom: 60, ali: 159, acum: 2396, ca: 1.293 },
    { d: 31, peso: 1952, gan: 100, prom: 62, ali: 164, acum: 2560, ca: 1.312 },
    { d: 32, peso: 2053, gan: 101, prom: 63, ali: 170, acum: 2730, ca: 1.33 },
    { d: 33, peso: 2154, gan: 102, prom: 64, ali: 175, acum: 2904, ca: 1.349 },
    { d: 34, peso: 2257, gan: 102, prom: 65, ali: 180, acum: 3084, ca: 1.367 },
    { d: 35, peso: 2360, gan: 103, prom: 66, ali: 184, acum: 3268, ca: 1.386 },
    { d: 36, peso: 2463, gan: 103, prom: 67, ali: 189, acum: 3457, ca: 1.404 },
    { d: 37, peso: 2567, gan: 104, prom: 68, ali: 193, acum: 3650, ca: 1.423 },
    { d: 38, peso: 2671, gan: 104, prom: 69, ali: 197, acum: 3848, ca: 1.441 },
    { d: 39, peso: 2775, gan: 104, prom: 70, ali: 201, acum: 4049, ca: 1.46 },
    { d: 40, peso: 2879, gan: 104, prom: 71, ali: 205, acum: 4254, ca: 1.479 },
    { d: 41, peso: 2982, gan: 104, prom: 72, ali: 209, acum: 4463, ca: 1.497 },
    { d: 42, peso: 3086, gan: 103, prom: 72, ali: 212, acum: 4674, ca: 1.516 },
    { d: 43, peso: 3189, gan: 103, prom: 73, ali: 215, acum: 4890, ca: 1.535 },
    { d: 44, peso: 3291, gan: 102, prom: 74, ali: 218, acum: 5108, ca: 1.553 },
    { d: 45, peso: 3393, gan: 102, prom: 74, ali: 221, acum: 5328, ca: 1.572 },
    { d: 46, peso: 3493, gan: 101, prom: 75, ali: 223, acum: 5552, ca: 1.591 },
    { d: 47, peso: 3594, gan: 100, prom: 76, ali: 226, acum: 5778, ca: 1.609 },
    { d: 48, peso: 3693, gan: 99, prom: 76, ali: 228, acum: 6005, ca: 1.628 },
    { d: 49, peso: 3791, gan: 98, prom: 76, ali: 230, acum: 6235, ca: 1.646 },
    { d: 50, peso: 3888, gan: 97, prom: 77, ali: 232, acum: 6467, ca: 1.665 },
    { d: 51, peso: 3984, gan: 96, prom: 77, ali: 233, acum: 6700, ca: 1.684 },
    { d: 52, peso: 4079, gan: 95, prom: 78, ali: 235, acum: 6935, ca: 1.702 },
    { d: 53, peso: 4173, gan: 94, prom: 78, ali: 236, acum: 7171, ca: 1.721 },
    { d: 54, peso: 4265, gan: 92, prom: 78, ali: 237, acum: 7408, ca: 1.739 },
    { d: 55, peso: 4356, gan: 91, prom: 78, ali: 238, acum: 7646, ca: 1.757 },
    { d: 56, peso: 4446, gan: 90, prom: 79, ali: 239, acum: 7884, ca: 1.776 }
  ];
  const REF_MAX = 56;
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

  // Resumen de la granja: promedio simple de los promedios de los galpones con datos
  function farmStats(galpones, meta) {
    const rows = [];
    let suma = 0, n = 0, tot = 0;
    for (let i = 1; i <= 12; i++) {
      const g = (galpones || {})[i];
      const s = galponStats(g, meta);
      rows.push({ id: i, edad: g ? g.edad : '', s: s });
      tot += s.totalAves;
      if (s.galpon !== null) { suma += s.galpon; n++; }
    }
    return { rows: rows, prom: n > 0 ? suma / n : null, conDatos: n, totalAves: tot };
  }

  // Fila de la tabla para un día entero (0 a 56)
  function refRow(day) {
    const d = Math.round(Number(day));
    if (!isFinite(d) || d < 0 || d > REF_MAX) return null;
    return REF[d];
  }
  // Peso estándar para un día
  function refFor(day) {
    const r = refRow(day);
    return r ? { dia: r.d, peso: r.peso, exacto: true } : null;
  }
  // Alimento estándar por ave. Si el consumo diario viene vacío en la tabla (día 1) se deduce del acumulado.
  function feedFor(day) {
    const r = refRow(day);
    if (!r) return null;
    let ali = r.ali;
    if (ali === null && r.acum !== null) ali = r.acum - (r.d > 0 && REF[r.d - 1].acum !== null ? REF[r.d - 1].acum : 0);
    return { dia: r.d, peso: r.peso, ali: ali, acum: r.acum, ca: r.ca };
  }
  // Proyección de alimento: desde la edad actual hasta N días más (máx. día 56).
  // poblacion (opcional) = aves vivas en el galpón -> consumo total en kg.
  function projection(edad, poblacion, dias) {
    const e = Math.round(num(edad));
    if (!isFinite(e) || e < 0 || e > REF_MAX) return null;
    const n = dias === undefined ? 7 : dias;
    const pob = num(poblacion);
    const rows = [];
    for (let d = e; d <= Math.min(REF_MAX, e + n); d++) {
      const f = feedFor(d);
      rows.push({
        d: d, peso: f.peso, ali: f.ali, acum: f.acum,
        aliGalpon: pob > 0 && f.ali !== null ? f.ali * pob / 1000 : null,
        acumGalpon: pob > 0 && f.acum !== null ? f.acum * pob / 1000 : null
      });
    }
    return { poblacion: pob > 0 ? pob : null, rows: rows };
  }

  function compare(avg, edad) {
    const e = num(edad);
    if (avg === null || avg === undefined || !isFinite(e) || e < 1) return null;
    const r = refFor(e);
    if (!r) return { dia: Math.round(e), sinRef: true };
    const diff = avg - r.peso;
    const pct = diff / r.peso * 100;
    const pr = Math.round(pct * 10) / 10; // se clasifica con el mismo valor que se muestra
    const estado = pr >= TOL ? 'sobre' : (pr >= -TOL ? 'similar' : 'bajo');
    return { dia: r.dia, ref: r.peso, exacto: r.exacto, diff: diff, pct: pct, estado: estado };
  }

  root.Core = {
    REF: REF, REF_MAX: REF_MAX, CORRALES: CORRALES, TOL: TOL, ESTADOS: ESTADOS,
    num: num, fmt: fmt, corralStats: corralStats, galponStats: galponStats, farmStats: farmStats,
    refFor: refFor, refRow: refRow, feedFor: feedFor, projection: projection, compare: compare
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.Core;
})(typeof window !== 'undefined' ? window : globalThis);
