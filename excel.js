/* Pesaje de Aves - generador del Excel con el formato FO-ENG-004 de Agroinversiones SAI-RAM
 * Desarrollado por Analista de sistemas Eber Romero */
(function (root) {
  'use strict';

  const FIRMA = 'Desarrollado por Analista de sistemas Eber Romero';
  const GRIS = 'FFD9D9D9', GRIS_CLARO = 'FFF2F2F2', AMARILLO = 'FFFFF2CC', VERDE = 'FF1F4A28';
  const THIN = { style: 'thin', color: { argb: 'FF595959' } };
  const BORDE = { top: THIN, left: THIN, bottom: THIN, right: THIN };
  const CORR = ['A', 'B', 'C', 'D'];

  function fnt(o) { return Object.assign({ name: 'Calibri', size: 11 }, o || {}); }

  function paint(ws, r1, c1, r2, c2, o) {
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        const cell = ws.getCell(r, c);
        if (o.fill) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: o.fill } };
        if (o.border !== false) cell.border = BORDE;
        if (o.font) cell.font = o.font;
        if (o.align) cell.alignment = o.align;
        if (o.numFmt) cell.numFmt = o.numFmt;
      }
    }
  }
  const CENTRO = { horizontal: 'center', vertical: 'middle', wrapText: true };

  function fechaTxt(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return m ? m[3] + '/' + m[2] + '/' + m[1] : (iso || '');
  }

  function addSheet(wb, id, g, meta, Core, granja) {
    g = g || {};
    const c = g.c || {};
    const ws = wb.addWorksheet('Galpón ' + id, {
      views: [{ showGridLines: false }],
      pageSetup: {
        paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 1,
        horizontalCentered: true,
        margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 }
      }
    });
    for (let i = 1; i <= 8; i++) ws.getColumn(i).width = 16;

    // Encabezado
    ws.mergeCells('A1:H1');
    ws.getCell('A1').value = 'AGROINVERSIONES SAI-RAM, C.A';
    ws.getCell('A1').font = fnt({ bold: true, size: 18 });
    ws.getCell('A1').alignment = CENTRO;
    ws.getRow(1).height = 30;
    ws.mergeCells('A2:H2');
    ws.getCell('A2').value = 'FORMATO DE REGISTRO DE PESAJE DE AVES';
    ws.getCell('A2').font = fnt({ size: 12, color: { argb: 'FF595959' } });
    ws.getCell('A2').alignment = CENTRO;

    // Fecha / Granja / Edad / Galpón
    const edad = Core.num(g.edad);
    const campos = [
      [1, 'FECHA', fechaTxt(g.fecha)],
      [3, 'GRANJA', granja || ''],
      [5, 'EDAD (días)', isFinite(edad) && edad > 0 ? Math.round(edad) : ''],
      [7, 'GALPÓN', Number(id)]
    ];
    campos.forEach(function (f) {
      const lab = ws.getCell(4, f[0]);
      lab.value = f[1];
      lab.font = fnt({ bold: true, size: 10, color: { argb: 'FF595959' } });
      lab.alignment = { horizontal: 'right', vertical: 'middle' };
      const val = ws.getCell(4, f[0] + 1);
      val.value = f[2];
      val.font = fnt({ bold: true });
      val.alignment = { horizontal: 'center', vertical: 'middle' };
      val.border = BORDE;
    });
    ws.getRow(4).height = 22;

    // Corrales
    const HR = 6, CH = 7, first = 8;
    let maxFilas = 15;
    CORR.forEach(function (k) { maxFilas = Math.max(maxFilas, (c[k] || []).length); });
    const last = first + maxFilas - 1, promRow = last + 1, avesRow = last + 2;
    const promCells = [];

    CORR.forEach(function (k, i) {
      const ca = 1 + 2 * i, cp = ca + 1;
      const la = ws.getColumn(ca).letter, lp = ws.getColumn(cp).letter;
      const lista = c[k] || [];

      ws.mergeCells(HR, ca, HR, cp);
      paint(ws, HR, ca, HR, cp, { font: fnt({ bold: true }), align: CENTRO });
      ws.getCell(HR, ca).value = 'CORRAL ' + k;

      paint(ws, CH, ca, CH, cp, { fill: GRIS, font: fnt({ bold: true, size: 10 }), align: CENTRO });
      ws.getCell(CH, ca).value = 'CANTIDAD DE AVES';
      ws.getCell(CH, cp).value = 'PESO (g)';

      for (let r = first; r <= last; r++) {
        const e = lista[r - first];
        paint(ws, r, ca, r, ca, { font: fnt(), align: CENTRO, numFmt: '0' });
        paint(ws, r, cp, r, cp, { font: fnt(), align: CENTRO, numFmt: '#,##0.##' });
        if (e) { ws.getCell(r, ca).value = e.a; ws.getCell(r, cp).value = e.p; }
        ws.getRow(r).height = 20;
      }

      const st = Core.corralStats(lista);
      // PESO PROM
      paint(ws, promRow, ca, promRow, ca, { fill: GRIS_CLARO, font: fnt({ bold: true, size: 10 }), align: CENTRO });
      ws.getCell(promRow, ca).value = 'PESO PROM';
      paint(ws, promRow, cp, promRow, cp, { fill: GRIS_CLARO, font: fnt({ bold: true }), align: CENTRO, numFmt: '#,##0.00' });
      ws.getCell(promRow, cp).value = {
        formula: 'IF(SUM(' + la + first + ':' + la + last + ')=0,"",SUM(' + lp + first + ':' + lp + last + ')/SUM(' + la + first + ':' + la + last + '))',
        result: st.prom === null ? '' : st.prom
      };
      // AVES PESADAS
      paint(ws, avesRow, ca, avesRow, ca, { fill: GRIS_CLARO, font: fnt({ size: 10 }), align: CENTRO });
      ws.getCell(avesRow, ca).value = 'AVES PESADAS';
      paint(ws, avesRow, cp, avesRow, cp, { fill: GRIS_CLARO, font: fnt({ bold: true }), align: CENTRO, numFmt: '0' });
      ws.getCell(avesRow, cp).value = { formula: 'SUM(' + la + first + ':' + la + last + ')', result: st.aves };
      ws.getRow(promRow).height = 22;
      ws.getRow(avesRow).height = 20;
      promCells.push(lp + promRow);
    });

    // Peso promedio del galpón (promedio de los promedios de corral)
    const gs = Core.galponStats(g, meta);
    const gH = avesRow + 2, gV = gH + 1;
    ws.mergeCells(gH, 3, gH, 6);
    paint(ws, gH, 3, gH, 6, { fill: GRIS, font: fnt({ bold: true }), align: CENTRO });
    ws.getCell(gH, 3).value = 'PESO PROMEDIO GALPÓN';
    ws.mergeCells(gV, 3, gV, 6);
    paint(ws, gV, 3, gV, 6, { font: fnt({ bold: true, size: 15 }), align: CENTRO, numFmt: '#,##0.00" g"' });
    ws.getCell(gV, 3).value = {
      formula: 'IF(COUNT(' + promCells.join(',') + ')=0,"",AVERAGE(' + promCells.join(',') + '))',
      result: gs.galpon === null ? '' : gs.galpon
    };
    ws.getRow(gV).height = 28;

    // Comparación con la tabla de referencia (si hay edad)
    let r = gV + 2;
    if (isFinite(edad) && edad > 0) {
      const ref = Core.refFor(edad);
      const labels = ['EDAD (días)', 'PESO ESTÁNDAR (g)', 'DIFERENCIA (g)', 'ESTADO'];
      labels.forEach(function (t, i) {
        paint(ws, r, 3 + i, r, 3 + i, { fill: GRIS, font: fnt({ bold: true, size: 10 }), align: CENTRO });
        ws.getCell(r, 3 + i).value = t;
      });
      const v = r + 1;
      paint(ws, v, 3, v, 6, { font: fnt({ bold: true }), align: CENTRO });
      ws.getCell(v, 3).value = Math.round(edad);
      if (ref) {
        const avgRef = '$C$' + gV;
        ws.getCell(v, 4).value = Math.round(ref.peso);
        ws.getCell(v, 4).numFmt = '#,##0';
        ws.getCell(v, 5).value = {
          formula: 'IF(ISNUMBER(' + avgRef + '),' + avgRef + '-D' + v + ',"")',
          result: gs.galpon === null ? '' : gs.galpon - Math.round(ref.peso)
        };
        ws.getCell(v, 5).numFmt = '+#,##0.00;-#,##0.00;0.00';
        const d = 'ROUND((' + avgRef + '-D' + v + ')/D' + v + '*100,1)';
        const est = gs.galpon === null ? '' : (function () {
          const p = Math.round((gs.galpon - Math.round(ref.peso)) / Math.round(ref.peso) * 1000) / 10;
          return p >= Core.TOL ? 'Por encima' : (p >= -Core.TOL ? 'Similar' : 'Por debajo');
        })();
        ws.getCell(v, 6).value = {
          formula: 'IF(ISNUMBER(' + avgRef + '),IF(' + d + '>=' + Core.TOL + ',"Por encima",IF(' + d + '>=-' + Core.TOL + ',"Similar","Por debajo")),"")',
          result: est
        };
      } else {
        ws.getCell(v, 4).value = 'N/D';
        ws.getCell(v, 5).value = '—';
        ws.getCell(v, 6).value = '—';
      }
      r = v + 1;
      const nota = ref ? (ref.exacto ? '' : 'Peso estándar estimado entre los días de la tabla.') : 'La tabla de referencia cubre del día 0 al 56.';
      if (nota) {
        ws.mergeCells(r, 3, r, 6);
        ws.getCell(r, 3).value = nota + ' "Similar" = dentro de ±' + Core.TOL + ' %.';
        ws.getCell(r, 3).font = fnt({ italic: true, size: 9, color: { argb: 'FF595959' } });
        ws.getCell(r, 3).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        r++;
      } else {
        ws.mergeCells(r, 3, r, 6);
        ws.getCell(r, 3).value = '"Similar" = dentro de ±' + Core.TOL + ' %.';
        ws.getCell(r, 3).font = fnt({ italic: true, size: 9, color: { argb: 'FF595959' } });
        ws.getCell(r, 3).alignment = { horizontal: 'center', vertical: 'middle' };
        r++;
      }
    }

    // Proyección de alimento (estándar Ross 308 AP)
    const P = (isFinite(edad) && edad >= 1) ? Core.projection(edad, g.poblacion, 7) : null;
    if (P) {
      r += 1;
      ws.mergeCells(r, 1, r, 3);
      ws.getCell(r, 1).value = 'PROYECCIÓN DE ALIMENTO (estándar)';
      ws.getCell(r, 1).font = fnt({ bold: true, size: 10, color: { argb: 'FF595959' } });
      ws.getCell(r, 4).value = 'AVES EN EL GALPÓN';
      ws.mergeCells(r, 4, r, 5);
      ws.getCell(r, 4).font = fnt({ bold: true, size: 10, color: { argb: 'FF595959' } });
      ws.getCell(r, 4).alignment = { horizontal: 'right', vertical: 'middle' };
      const popCell = ws.getCell(r, 6);
      popCell.value = P.poblacion || '';
      popCell.numFmt = '#,##0';
      popCell.font = fnt({ bold: true });
      popCell.alignment = { horizontal: 'center', vertical: 'middle' };
      popCell.border = BORDE;
      popCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AMARILLO } };
      const popRef = '$F$' + r;
      r++;
      const ph = ['Día', 'Peso objetivo (g)', 'Consumo diario (g/ave)', 'Acumulado (g/ave)', 'Consumo diario galpón (kg)', 'Acumulado galpón (kg)'];
      ph.forEach(function (t, i) { ws.getCell(r, 1 + i).value = t; });
      paint(ws, r, 1, r, 6, { fill: GRIS, font: fnt({ bold: true, size: 10 }), align: CENTRO });
      ws.getRow(r).height = 34;
      r++;
      P.rows.forEach(function (row, idx) {
        paint(ws, r, 1, r, 6, { fill: idx === 0 ? AMARILLO : 'FFFFFFFF', font: fnt({ size: 10, bold: idx === 0 }), align: CENTRO });
        ws.getCell(r, 1).value = row.d;
        ws.getCell(r, 2).value = row.peso;
        ws.getCell(r, 2).numFmt = '#,##0';
        ws.getCell(r, 3).value = row.ali;
        ws.getCell(r, 4).value = row.acum;
        ws.getCell(r, 4).numFmt = '#,##0';
        ws.getCell(r, 5).value = { formula: 'IF(ISNUMBER(' + popRef + '),C' + r + '*' + popRef + '/1000,"")', result: row.aliGalpon === null ? '' : row.aliGalpon };
        ws.getCell(r, 5).numFmt = '#,##0.0';
        ws.getCell(r, 6).value = { formula: 'IF(ISNUMBER(' + popRef + '),D' + r + '*' + popRef + '/1000,"")', result: row.acumGalpon === null ? '' : row.acumGalpon };
        ws.getCell(r, 6).numFmt = '#,##0';
        ws.getRow(r).height = 18;
        r++;
      });
      ws.mergeCells(r, 1, r, 6);
      ws.getCell(r, 1).value = 'Objetivo Ross 308 AP (mixto): lo que debería consumir según la tabla. Escribe las aves del galpón en la celda amarilla para calcular los kg.';
      ws.getCell(r, 1).font = fnt({ italic: true, size: 9, color: { argb: 'FF595959' } });
      ws.getCell(r, 1).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      ws.getRow(r).height = 26;
      r++;
    }

    // Tabla de referencia (días de control semanales + el día actual)
    r += 1;
    ws.mergeCells(r, 1, r, 8);
    ws.getCell(r, 1).value = 'TABLA DE REFERENCIA - ROSS 308 AP (MIXTO)';
    ws.getCell(r, 1).font = fnt({ bold: true, size: 10, color: { argb: 'FF595959' } });
    ws.getCell(r, 1).alignment = { horizontal: 'left', vertical: 'middle' };
    r++;
    const heads = ['Día', 'Peso Corporal (g)', 'Ganancia Diaria (g)', 'Promedio Ganancia Diaria (g)', 'Cantidad Alimento Diario (g)', 'Alimento Acumulado (g)', 'CA'];
    heads.forEach(function (t, i) {
      ws.getCell(r, 1 + i).value = t;
    });
    ws.mergeCells(r, 7, r, 8);
    paint(ws, r, 1, r, 8, { fill: GRIS, font: fnt({ bold: true, size: 10 }), align: CENTRO });
    ws.getRow(r).height = 42;
    r++;
    const edadR = isFinite(edad) && edad >= 0 ? Math.round(edad) : -1;
    const dias = [7, 14, 21, 28, 35, 42, 49, 56];
    if (edadR >= 0 && edadR <= Core.REF_MAX && dias.indexOf(edadR) < 0) { dias.push(edadR); dias.sort(function (a, b) { return a - b; }); }
    dias.forEach(function (dd, idx) {
      const f = Core.REF[dd];
      const vals = [f.d, f.peso, f.gan, f.prom, f.ali, f.acum, f.ca];
      const resaltar = edadR === f.d;
      ws.mergeCells(r, 7, r, 8);
      paint(ws, r, 1, r, 8, {
        fill: resaltar ? AMARILLO : (idx % 2 ? 'FFFFFFFF' : GRIS_CLARO),
        font: fnt({ size: 10, bold: resaltar }), align: CENTRO
      });
      vals.forEach(function (x, i) { ws.getCell(r, 1 + i).value = x === null ? '' : x; });
      ws.getCell(r, 7).numFmt = '0.000';
      ws.getRow(r).height = 18;
      r++;
    });

    // Pie
    r += 1;
    ws.mergeCells(r, 1, r, 3);
    ws.getCell(r, 1).value = 'FO-ENG-004 / Rev. 001';
    ws.getCell(r, 1).font = fnt({ italic: true, size: 9, color: { argb: 'FF595959' } });
    ws.mergeCells(r, 4, r, 8);
    ws.getCell(r, 4).value = FIRMA;
    ws.getCell(r, 4).font = fnt({ italic: true, bold: true, size: 10, color: { argb: VERDE } });
    ws.getCell(r, 4).alignment = { horizontal: 'right', vertical: 'middle' };

    ws.pageSetup.printArea = 'A1:H' + r;
    return ws;
  }

  function addResumen(wb, state, Core) {
    const ws = wb.addWorksheet('Resumen Granja', {
      views: [{ showGridLines: false }],
      pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 1, horizontalCentered: true,
        margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 } }
    });
    [10, 12, 14, 14, 14, 14, 14, 18].forEach(function (w, i) { ws.getColumn(i + 1).width = w; });
    ws.mergeCells('A1:H1');
    ws.getCell('A1').value = 'AGROINVERSIONES SAI-RAM, C.A';
    ws.getCell('A1').font = fnt({ bold: true, size: 18 });
    ws.getCell('A1').alignment = CENTRO;
    ws.getRow(1).height = 30;
    ws.mergeCells('A2:H2');
    ws.getCell('A2').value = 'RESUMEN DE PESAJE DE LA GRANJA';
    ws.getCell('A2').font = fnt({ size: 12, color: { argb: 'FF595959' } });
    ws.getCell('A2').alignment = CENTRO;
    const d = new Date();
    const hoy = ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
    ws.getCell('A4').value = 'GRANJA';
    ws.mergeCells('B4:D4');
    ws.getCell('B4').value = state.granja || '';
    ws.getCell('F4').value = 'FECHA';
    ws.mergeCells('G4:H4');
    ws.getCell('G4').value = hoy;
    ['A4', 'F4'].forEach(function (a) { ws.getCell(a).font = fnt({ bold: true, size: 10, color: { argb: 'FF595959' } }); ws.getCell(a).alignment = { horizontal: 'right', vertical: 'middle' }; });
    paint(ws, 4, 2, 4, 4, { font: fnt({ bold: true }), align: CENTRO });
    paint(ws, 4, 7, 4, 8, { font: fnt({ bold: true }), align: CENTRO });
    ws.getRow(4).height = 22;
    const heads = ['GALPÓN', 'EDAD (días)', 'AVES PESADAS', 'CORRAL A (g)', 'CORRAL B (g)', 'CORRAL C (g)', 'CORRAL D (g)', 'PESO PROM. GALPÓN (g)'];
    heads.forEach(function (t, i) { ws.getCell(6, i + 1).value = t; });
    paint(ws, 6, 1, 6, 8, { fill: GRIS, font: fnt({ bold: true, size: 10 }), align: CENTRO });
    ws.getRow(6).height = 34;
    const fs = Core.farmStats(state.galpones || {}, state.meta || 100);
    const first = 7;
    fs.rows.forEach(function (row, i) {
      const r = first + i;
      const hay = row.s.totalAves > 0;
      paint(ws, r, 1, r, 8, { font: fnt(), align: CENTRO });
      ws.getCell(r, 1).value = row.id;
      ws.getCell(r, 1).font = fnt({ bold: true });
      const ed = Core.num(row.edad);
      if (hay && isFinite(ed) && ed > 0) ws.getCell(r, 2).value = Math.round(ed);
      if (hay) ws.getCell(r, 3).value = row.s.totalAves;
      Core.CORRALES.forEach(function (k, j) {
        const cell = ws.getCell(r, 4 + j);
        cell.numFmt = '#,##0.00';
        if (row.s.c[k].aves > 0) cell.value = row.s.c[k].prom;
      });
      const hc = ws.getCell(r, 8);
      hc.numFmt = '#,##0.00';
      hc.font = fnt({ bold: true });
      hc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRIS_CLARO } };
      if (hay) hc.value = { formula: 'AVERAGE(D' + r + ':G' + r + ')', result: row.s.galpon };
      ws.getRow(r).height = 20;
    });
    const last = first + 11;
    ws.getCell(last + 1, 1).value = '';
    ws.mergeCells(last + 2, 2, last + 2, 5);
    paint(ws, last + 2, 2, last + 2, 5, { fill: GRIS, font: fnt({ bold: true }), align: CENTRO });
    ws.getCell(last + 2, 2).value = 'PESO PROMEDIO GRANJA';
    ws.mergeCells(last + 3, 2, last + 3, 5);
    paint(ws, last + 3, 2, last + 3, 5, { font: fnt({ bold: true, size: 16 }), align: CENTRO, numFmt: '#,##0.00" g"' });
    ws.getCell(last + 3, 2).value = {
      formula: 'IF(COUNT(H' + first + ':H' + last + ')=0,"",AVERAGE(H' + first + ':H' + last + '))',
      result: fs.prom === null ? '' : fs.prom
    };
    ws.getRow(last + 3).height = 30;
    ws.mergeCells(last + 2, 6, last + 3, 8);
    ws.getCell(last + 2, 6).value = fs.conDatos + ' de 12 galpones con datos\n' + fs.totalAves.toLocaleString('es-VE') + ' aves pesadas';
    ws.getCell(last + 2, 6).font = fnt({ size: 10, color: { argb: 'FF595959' } });
    ws.getCell(last + 2, 6).alignment = CENTRO;
    ws.mergeCells(last + 5, 1, last + 5, 8);
    ws.getCell(last + 5, 1).value = 'Promedio de la granja = promedio simple de los promedios de los galpones con datos.';
    ws.getCell(last + 5, 1).font = fnt({ italic: true, size: 9, color: { argb: 'FF595959' } });
    ws.mergeCells(last + 6, 1, last + 6, 8);
    ws.getCell(last + 6, 1).value = FIRMA;
    ws.getCell(last + 6, 1).font = fnt({ italic: true, bold: true, size: 10, color: { argb: VERDE } });
    ws.getCell(last + 6, 1).alignment = { horizontal: 'right', vertical: 'middle' };
    ws.pageSetup.printArea = 'A1:H' + (last + 6);
  }

  function build(ExcelJS, state, ids, Core, opts) {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Eber Romero - Analista de sistemas';
    wb.created = new Date();
    if (opts && opts.resumen) addResumen(wb, state, Core);
    ids.forEach(function (id) {
      addSheet(wb, id, (state.galpones || {})[id], state.meta || 100, Core, state.granja);
    });
    return wb;
  }

  root.PesajeExcel = { build: build, FIRMA: FIRMA };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.PesajeExcel;
})(typeof window !== 'undefined' ? window : globalThis);
