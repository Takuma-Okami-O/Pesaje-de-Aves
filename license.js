/* Pesaje de Aves - licencia centralizada (Firebase), con uso offline entre revisiones
 * Desarrollado por Analista de sistemas Eber Romero
 *
 * Idea: Eber activa la licencia UNA VEZ AL MES en un panel propio (admin.html).
 * Cada teléfono, cuando tiene señal, pregunta si sigue activa y guarda la respuesta
 * por un tiempo (GRACE_DAYS). Mientras ese plazo no se cumpla, la app funciona
 * offline con normalidad. Si pasa ese plazo sin lograr confirmar, o si Eber
 * desactiva la licencia, la app se bloquea con un aviso honesto (no un error falso).
 */
(function (root) {
  'use strict';

  const GRACE_DAYS = 10;         // días que puede trabajar sin confirmar conexión
  const INSTALL_GRACE_DAYS = 3;  // margen para un teléfono nuevo que aún no logra conectarse
  const CHECK_COOLDOWN_MIN = 60; // no intentar more de una vez por hora aunque la app se reabra

  function todayISO() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function daysBetween(aISO, bISO) {
    const a = new Date(aISO + 'T00:00:00'), b = new Date(bISO + 'T00:00:00');
    return Math.round((b - a) / 86400000);
  }
  function minutesBetween(aISOTime, nowMs) {
    return (nowMs - new Date(aISOTime).getTime()) / 60000;
  }

  // cache: { validUntil: 'YYYY-MM-DD'|null, active: bool|null, note: string,
  //          lastOkAt: ISO datetime|null, lastTryAt: ISO datetime|null, installedAt: 'YYYY-MM-DD' }
  function blankCache() { return { validUntil: null, active: null, note: '', lastOkAt: null, lastTryAt: null, installedAt: todayISO() }; }

  // Decide si la app puede funcionar, a partir de la caché guardada en el teléfono.
  function evaluate(cache, nowDate) {
    nowDate = nowDate || todayISO();
    const c = cache || blankCache();
    if (!c.lastOkAt) {
      // Nunca se ha confirmado conexión en este teléfono.
      const inst = c.installedAt || nowDate;
      const dias = daysBetween(inst, nowDate);
      if (dias <= INSTALL_GRACE_DAYS) {
        return { allowed: true, state: 'instalando', diasRestantesInstalacion: INSTALL_GRACE_DAYS - dias };
      }
      return { allowed: false, state: 'sin-primera-conexion' };
    }
    if (c.active === false) {
      return { allowed: false, state: 'desactivada' };
    }
    if (!c.validUntil || c.validUntil < nowDate) {
      return { allowed: false, state: 'vencida', validUntil: c.validUntil };
    }
    const sinConfirmar = daysBetween(c.lastOkAt.slice(0, 10), nowDate);
    if (sinConfirmar > GRACE_DAYS) {
      return { allowed: false, state: 'sin-conexion-reciente', dias: sinConfirmar };
    }
    return { allowed: true, state: 'activa', validUntil: c.validUntil, diasSinConfirmar: sinConfirmar, diasRestantesGracia: GRACE_DAYS - sinConfirmar };
  }

  function shouldTryNow(cache, nowMs) {
    if (!cache || !cache.lastTryAt) return true;
    return minutesBetween(cache.lastTryAt, nowMs || Date.now()) >= CHECK_COOLDOWN_MIN;
  }

  // Interpreta la respuesta REST de Firestore para el documento license/status.
  function parseFirestoreDoc(json) {
    const f = (json && json.fields) || {};
    const get = function (k) { return f[k] || {}; };
    const activeField = get('active');
    const validUntilField = get('validUntil');
    const noteField = get('note');
    return {
      active: 'booleanValue' in activeField ? !!activeField.booleanValue : true,
      validUntil: typeof validUntilField.stringValue === 'string' ? validUntilField.stringValue : null,
      note: typeof noteField.stringValue === 'string' ? noteField.stringValue : ''
    };
  }

  function mensaje(ev) {
    const M = {
      'sin-primera-conexion': { t: 'Falta activar esta app', d: 'Conecta el teléfono a wifi o datos móviles una vez para activarla.' },
      'desactivada': { t: 'Licencia no activa', d: 'Contacta al administrador de la aplicación.' },
      'vencida': { t: 'Licencia vencida', d: 'Contacta al administrador para renovarla.' },
      'sin-conexion-reciente': { t: 'Falta confirmar la licencia', d: 'Este teléfono no logra conectarse hace días. Conéctalo a wifi o datos móviles.' }
    };
    return M[ev.state] || { t: 'Licencia no activa', d: 'Contacta al administrador de la aplicación.' };
  }

  root.License = {
    GRACE_DAYS: GRACE_DAYS, INSTALL_GRACE_DAYS: INSTALL_GRACE_DAYS, CHECK_COOLDOWN_MIN: CHECK_COOLDOWN_MIN,
    todayISO: todayISO, daysBetween: daysBetween, blankCache: blankCache,
    evaluate: evaluate, shouldTryNow: shouldTryNow, parseFirestoreDoc: parseFirestoreDoc, mensaje: mensaje
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.License;
})(typeof window !== 'undefined' ? window : globalThis);
